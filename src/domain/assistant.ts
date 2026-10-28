import { CATEGORIES, EXPENSE_CATEGORIES, getCategory, isTransferCategory } from './categories';
import {
  absoluteCents,
  addCents,
  compareCents,
  ratioOf,
  scaleCents,
  subtractCents,
  sumCents,
  ZERO,
  type Cents,
} from './money';
import type { Budget, RecurringRule, Transaction } from './models';
import type { DateOnly, MonthKey } from './primitives';
import {
  addDays,
  addMonths,
  formatRelativeDay,
  monthBounds,
  monthKeyOf,
  monthKeyOfParts,
  parseDateOnly,
} from '@/lib/date';
import { pluralize } from '@/lib/format';

/**
 * The local assistant.
 *
 * Ledger makes no network call, and that is the product's whole claim — so this is
 * deliberately **not** a language model and must never be presented as one. It is a
 * deterministic parser: it reads a question, decides what is being asked, and
 * computes the answer from the ledger already on the device.
 *
 * That constraint is the feature. Every answer is arithmetic over the user's own
 * rows, so it is exactly reproducible, instant, works in aeroplane mode, and
 * cannot invent a number. The price is coverage: it understands a fixed
 * vocabulary. So the vocabulary is wide — roughly 200 synonyms across 17 intents
 * and 9 period shapes — and when a question falls outside it, the assistant says
 * so and offers what it can answer rather than guessing.
 *
 * Everything here is pure: no React, no I/O, no currency decisions. Money is
 * rendered through a `format` function the caller injects.
 */

export type FormatCents = (
  value: Cents,
  options?: { showSign?: boolean; compact?: boolean },
) => string;

export type AssistantIntent =
  | 'net-worth'
  | 'account-balance'
  | 'spend-total'
  | 'income-total'
  | 'category-spend'
  | 'category-count'
  | 'merchant-spend'
  | 'top-category'
  | 'top-merchant'
  | 'biggest-expense'
  | 'average-spend'
  | 'savings-rate'
  | 'budget-status'
  | 'compare-spending'
  | 'transaction-count'
  | 'recurring-total'
  | 'list-categories'
  | 'unknown';

/**
 * A period is reduced to a date range plus the words used to describe it.
 *
 * Every shape — a day, a week, a named month, a year, all of time — becomes the
 * same two nullable bounds, so nothing downstream has to know which shape it was.
 * `previous` carries the equivalent range immediately before, which is what makes
 * comparisons work without a second parse.
 */
export interface AssistantPeriod {
  start: DateOnly | null;
  end: DateOnly | null;
  label: string;
  previous: AssistantPeriod | null;
}

export interface AssistantAccount {
  id: string;
  name: string;
  balance: Cents;
}

export interface AssistantContext {
  transactions: readonly Transaction[];
  budgets: readonly Budget[];
  recurring: readonly RecurringRule[];
  accounts: readonly AssistantAccount[];
  today: DateOnly;
}

export interface AssistantRow {
  label: string;
  value?: string;
}

export interface AssistantAnswer {
  intent: AssistantIntent;
  /**
   * The parse, said back to the user — "Dining out · last month".
   *
   * Showing what was understood is the difference between an answer and a guess:
   * it lets the reader catch a misreading without having to work out why the
   * number looks wrong.
   */
  scope: string;
  /** The figure, or the one-line verdict. */
  headline: string;
  /** What the figure is, and over what range. */
  detail: string;
  /** A breakdown, when the answer has one worth showing. */
  rows: readonly AssistantRow[];
}

/** Everything an answer needs except the parse summary, which is derived once. */
type AssistantBody = Omit<AssistantAnswer, 'scope'>;

/**
 * The suggestion rail.
 *
 * Each entry carries a translated **label** and an English **query**, and the two
 * are deliberately different strings. The parser's vocabulary is English — it
 * matches words like "spend", "last month" and "dining" — so sending it the
 * Filipino label would produce nothing. The chip is a shortcut, so it shows the
 * user their own language and hands the parser a sentence it can read.
 *
 * The consequence is worth stating plainly: free-typed Filipino questions are not
 * understood, because the parser has no Filipino vocabulary. That is the next
 * piece of work, not a thing to paper over.
 */
export interface SuggestedQuestion {
  /** i18n key for the label shown to the user. */
  labelKey: string;
  /** The English question handed to the parser. */
  query: string;
}

export const SUGGESTED_QUESTIONS: readonly SuggestedQuestion[] = [
  { labelKey: 'assistant.q.spendMonth', query: 'How much did I spend this month?' },
  { labelKey: 'assistant.q.earnLast', query: 'How much did I earn last month?' },
  { labelKey: 'assistant.q.netWorth', query: 'What is my net worth?' },
  { labelKey: 'assistant.q.topCategory', query: 'Where did most of my money go?' },
  { labelKey: 'assistant.q.biggest', query: 'What was my biggest expense?' },
  { labelKey: 'assistant.q.dining', query: 'How much did I spend on dining out?' },
  { labelKey: 'assistant.q.budget', query: 'Am I over budget?' },
  { labelKey: 'assistant.q.supermarket', query: 'How much did I spend at the supermarket?' },
  { labelKey: 'assistant.q.average', query: 'What is my average daily spend?' },
  { labelKey: 'assistant.q.compare', query: 'How does this month compare to last?' },
  { labelKey: 'assistant.q.subscriptions', query: 'What are my subscriptions?' },
  { labelKey: 'assistant.q.count', query: 'How many times did I eat out this month?' },
];

/* ------------------------------------------------------------- vocabulary --- */

/**
 * Words people use for a category that are not its label.
 *
 * A curated list rather than fuzzy matching: a wrong guess here produces a
 * confidently incorrect figure, which is the one failure a ledger cannot afford.
 * An unrecognised word falls through to "I did not understand" instead.
 */
const CATEGORY_ALIASES: Record<string, readonly string[]> = {
  groceries: ['food', 'grocery', 'supermarket', 'market', 'produce', 'fruit', 'vegetables'],
  dining: [
    'dining', 'dine', 'dined', 'eat', 'ate', 'eating', 'restaurant', 'restaurants', 'cafe', 'cafes',
    'coffee', 'takeaway', 'takeout', 'take-away', 'dinner', 'lunch', 'breakfast', 'brunch',
    'fast food', 'bar', 'bars', 'pub', 'drinks', 'eating out',
  ],
  transport: [
    'gas', 'fuel', 'petrol', 'car', 'cars', 'transport', 'transportation', 'bus', 'buses', 'train',
    'trains', 'subway', 'metro', 'uber', 'lyft', 'taxi', 'cab', 'parking', 'tolls', 'rideshare',
    'commute',
  ],
  housing: ['rent', 'mortgage', 'home', 'landlord', 'property', 'accommodation'],
  utilities: [
    'bill', 'bills', 'electricity', 'electric', 'water', 'internet', 'wifi', 'phone', 'mobile',
    'utility', 'heating', 'broadband', 'cell',
  ],
  health: [
    'medical', 'doctor', 'doctors', 'pharmacy', 'dentist', 'hospital', 'prescription', 'medicine',
    'therapy', 'gym', 'healthcare',
  ],
  shopping: ['clothes', 'clothing', 'shoes', 'amazon', 'retail', 'apparel', 'furniture'],
  entertainment: [
    'movie', 'movies', 'cinema', 'games', 'gaming', 'concert', 'concerts', 'theatre', 'theater',
    'fun', 'night out', 'nights out',
  ],
  travel: ['flight', 'flights', 'holiday', 'vacation', 'hotel', 'hotels', 'airbnb', 'trip', 'trips'],
  subscriptions: ['subscription', 'subs', 'membership', 'memberships', 'streaming'],
  education: ['course', 'courses', 'school', 'tuition', 'books', 'university', 'college', 'class'],
  other: ['misc', 'miscellaneous', 'everything else'],
  salary: ['wage', 'wages', 'paycheck', 'paycheque', 'payroll', 'job'],
  freelance: ['contract', 'contracting', 'consulting', 'side gig', 'gig', 'client'],
  interest: ['dividend', 'dividends', 'interest earned'],
  'gifts-received': ['gift', 'gifts', 'present', 'presents', 'birthday money'],
};

/** Verbs and nouns that signal each intent, in the order they are tested. */
const INTENT_PATTERNS: readonly { intent: AssistantIntent; pattern: RegExp }[] = [
  {
    intent: 'list-categories',
    pattern: /\bwhat categories\b|\blist categories\b|\bwhich categories\b|\bwhat can i ask\b/,
  },
  {
    intent: 'savings-rate',
    pattern: /\bsavings rate\b|\bsave rate\b|\bhow much am i saving\b|\bsaving rate\b/,
  },
  {
    intent: 'compare-spending',
    pattern: /\bcompare\b|\bversus\b|\bvs\b|\bhow does\b.*\bstack up\b|\bbetter or worse\b/,
  },
  {
    intent: 'average-spend',
    pattern: /\baverage\b|\bavg\b|\bper day\b|\bdaily\b|\btypical\b|\bper transaction\b/,
  },
  {
    intent: 'account-balance',
    // Narrow on purpose: a loose "in my" would swallow ordinary spending
    // questions, and an unmatched account here returns null rather than falling
    // through to a different intent.
    pattern:
      /\bhow much is in\b|\bhow much is left in\b|\bhow much do i have in\b|\bbalance of\b|\bwhat'?s in\b/,
  },
  {
    intent: 'net-worth',
    pattern: /\bnet worth\b|\bnet position\b|\bhow much do i have\b|\bwhat do i have\b|\bmy worth\b/,
  },
  {
    intent: 'budget-status',
    pattern: /\bbudget\b|\blimits?\b|\ballowance\b|\benvelopes?\b|\bover ?spend\b|\bon track\b/,
  },
  {
    intent: 'recurring-total',
    pattern: /\bsubscriptions?\b|\brecurring\b|\bregular payments?\b|\bstanding orders?\b|\bdirect debits?\b/,
  },
  {
    intent: 'biggest-expense',
    pattern: /\bbiggest\b|\blargest\b|\bmost expensive\b|\bpriciest\b|\bmost costly\b|\btop single\b/,
  },
  {
    intent: 'top-merchant',
    pattern: /\bwhich (shop|store|merchant)\b|\bwhere do i shop\b|\bwho do i pay\b/,
  },
  {
    intent: 'top-category',
    pattern:
      /\bwhere did\b|\bwhere does\b|\bmost of my money\b|\btop category\b|\bmain expense\b|\bbiggest category\b|\bspend most\b|\boutgoings\b/,
  },
  {
    intent: 'transaction-count',
    pattern: /\bhow many\b|\bcount\b|\bnumber of\b|\bhow often\b/,
  },
  {
    intent: 'income-total',
    pattern:
      /\bearn|\bearned|\bincome\b|\bmade\b|\bmake\b|\bmoney in\b|\bcoming in\b|\bcame in\b|\breceived\b|\bgot paid\b|\bincoming\b|\bpaycheck\b|\bwages\b/,
  },
  {
    intent: 'spend-total',
    pattern:
      /\bspend|\bspent|\bspending\b|\bcost|\bcosts\b|\bpaid\b|\bpay\b|\bbuy\b|\bbought\b|\bpurchase|\boutgoing|\bexpenses?\b|\bmoney out\b|\bgoing out\b|\bgone out\b/,
  },
];

/**
 * Period phrases, tested in order.
 *
 * The `this` forms come before the `last` forms deliberately. A comparison
 * question names both — "how does this month compare to last month" — and the
 * subject of that sentence is *this* month; matching `last month` first would
 * anchor the answer on the wrong side and the comparison would come back empty.
 * Where only one is named, order is irrelevant.
 */
const PERIOD_PATTERNS: readonly { pattern: RegExp; build: (today: DateOnly) => AssistantPeriod }[] = [
  { pattern: /\b(this|current) month\b/, build: (today) => monthPeriod(monthKeyOf(today), 'this month') },
  { pattern: /\b(this|current) week\b/, build: (today) => weekPeriod(today, 0) },
  { pattern: /\b(this|current) year\b|\byear to date\b|\bytd\b/, build: (today) => yearPeriod(today, 0) },
  { pattern: /\b(last|previous) month\b/, build: (today) => monthPeriod(addMonths(monthKeyOf(today), -1), 'last month') },
  { pattern: /\b(last|previous) week\b/, build: (today) => weekPeriod(today, -1) },
  { pattern: /\b(last|previous) year\b/, build: (today) => yearPeriod(today, -1) },
  { pattern: /\byesterday\b/, build: (today) => dayPeriod(addDays(today, -1), 'yesterday') },
  { pattern: /\btoday\b/, build: (today) => dayPeriod(today, 'today') },
  { pattern: /\ball time\b|\bever\b|\baltogether\b|\bso far\b|\bin total\b/, build: () => allTime() },
];

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

/* ----------------------------------------------------------- period maths --- */

const clampToToday = (end: DateOnly, today: DateOnly): DateOnly =>
  compareDates(end, today) > 0 ? today : end;

function compareDates(left: DateOnly, right: DateOnly): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function dayPeriod(date: DateOnly, label: string): AssistantPeriod {
  return {
    start: date,
    end: date,
    label,
    previous: dayPeriod(addDays(date, -1), 'the day before'),
  };
}

function monthPeriod(month: MonthKey, label: string): AssistantPeriod {
  const bounds = monthBounds(month);
  const prior = monthBounds(addMonths(month, -1));
  return {
    start: bounds.start,
    end: bounds.end,
    label,
    previous: { start: prior.start, end: prior.end, label: 'the month before', previous: null },
  };
}

/** Monday-based, because a week of spending starts on Monday in most ledgers. */
function startOfWeek(date: DateOnly): DateOnly {
  const day = parseDateOnly(date).getDay();
  return addDays(date, -(day === 0 ? 6 : day - 1));
}

function weekPeriod(today: DateOnly, offset: number): AssistantPeriod {
  const start = addDays(startOfWeek(today), offset * 7);
  const end = addDays(start, 6);
  return {
    start,
    end,
    label: offset === 0 ? 'this week' : 'last week',
    previous: {
      start: addDays(start, -7),
      end: addDays(end, -7),
      label: offset === 0 ? 'last week' : 'the week before',
      previous: null,
    },
  };
}

function yearPeriod(today: DateOnly, offset: number): AssistantPeriod {
  const year = Number(today.slice(0, 4)) + offset;
  return {
    start: `${year}-01-01` as DateOnly,
    end: `${year}-12-31` as DateOnly,
    label: offset === 0 ? 'this year' : String(year),
    previous: {
      start: `${year - 1}-01-01` as DateOnly,
      end: `${year - 1}-12-31` as DateOnly,
      label: String(year - 1),
      previous: null,
    },
  };
}

function allTime(): AssistantPeriod {
  return { start: null, end: null, label: 'all time', previous: null };
}

/** A named month, e.g. "in march" — this year, or last year if still to come. */
function namedMonth(query: string, today: DateOnly): AssistantPeriod | null {
  for (let index = 0; index < MONTH_NAMES.length; index += 1) {
    if (!new RegExp(`\\b${MONTH_NAMES[index]}\\b`).test(query)) continue;

    const thisYear = Number(today.slice(0, 4));
    const candidate = monthKeyOfParts(thisYear, index + 1);
    const month = candidate > monthKeyOf(today) ? monthKeyOfParts(thisYear - 1, index + 1) : candidate;

    return monthPeriod(month, MONTH_NAMES[index]);
  }
  return null;
}

function resolvePeriod(query: string, today: DateOnly): AssistantPeriod {
  for (const { pattern, build } of PERIOD_PATTERNS) {
    if (pattern.test(query)) {
      const period = build(today);
      // A month or year that has not finished is only spent up to today.
      return { ...period, end: period.end ? clampToToday(period.end, today) : null };
    }
  }

  const named = namedMonth(query, today);
  if (named) return { ...named, end: named.end ? clampToToday(named.end, today) : null };

  // Default to the month in progress: it is what "how much have I spent" means.
  const current = monthPeriod(monthKeyOf(today), 'this month');
  return { ...current, end: current.end ? clampToToday(current.end, today) : null };
}

/* --------------------------------------------------------------- matching --- */

const inPeriod = (transaction: Transaction, period: AssistantPeriod): boolean => {
  if (period.start && compareDates(transaction.date, period.start) < 0) return false;
  if (period.end && compareDates(transaction.date, period.end) > 0) return false;
  return true;
};

/** Money out. Transfers move money between the user's own accounts, so they are
 *  neither income nor spending and are excluded from every total here. */
const isSpend = (transaction: Transaction): boolean =>
  transaction.amount < 0 && !isTransferCategory(transaction.categoryId);

const isIncome = (transaction: Transaction): boolean =>
  transaction.amount > 0 && !isTransferCategory(transaction.categoryId);

const spendOf = (transactions: readonly Transaction[]): Transaction[] =>
  transactions.filter(isSpend);

const incomeOf = (transactions: readonly Transaction[]): Transaction[] =>
  transactions.filter(isIncome);

const totalOf = (transactions: readonly Transaction[]): Cents =>
  sumCents(transactions.map((transaction) => absoluteCents(transaction.amount)));

/** Every word in a phrase, so a multi-word alias still matches loosely. */
const words = (value: string): string[] => value.split(/\s+/).filter(Boolean);

function detectCategory(query: string): string | null {
  // A full label first: "dining out" should never be mistaken for "out".
  for (const category of CATEGORIES) {
    if (query.includes(category.label.toLowerCase())) return category.id;
  }

  for (const [categoryId, aliases] of Object.entries(CATEGORY_ALIASES)) {
    for (const alias of aliases) {
      const pattern = alias.includes(' ')
        ? new RegExp(`\\b${alias}\\b`)
        : new RegExp(`\\b${alias}s?\\b`);
      if (pattern.test(query)) return categoryId;
    }
  }

  return null;
}

function detectMerchant(query: string, transactions: readonly Transaction[]): string | null {
  let best: string | null = null;

  for (const transaction of transactions) {
    const merchant = transaction.merchant?.trim();
    if (!merchant) continue;

    const needle = merchant.toLowerCase();
    if (query.includes(needle) && (!best || merchant.length > best.length)) best = merchant;
  }

  return best;
}

function detectAccount(query: string, accounts: readonly AssistantAccount[]): AssistantAccount | null {
  let best: AssistantAccount | null = null;

  for (const account of accounts) {
    const name = account.name.toLowerCase();
    if (query.includes(name) && (!best || name.length > best.name.length)) best = account;

    // A single distinctive word of the name is often enough: "in checking".
    for (const word of words(name)) {
      if (word.length < 4) continue;
      if (new RegExp(`\\b${word}\\b`).test(query) && !best) best = account;
    }
  }

  return best;
}

function detectIntent(query: string): AssistantIntent {
  for (const { intent, pattern } of INTENT_PATTERNS) {
    if (pattern.test(query)) return intent;
  }
  return 'unknown';
}

/* ---------------------------------------------------------------- answers --- */

export function answerQuery(
  rawQuery: string,
  context: AssistantContext,
  format: FormatCents,
): AssistantAnswer | null {
  const query = rawQuery.toLowerCase().replace(/[?!.,;:'"]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!query) return null;

  const intent = detectIntent(query);
  const period = resolvePeriod(query, context.today);
  const scoped = context.transactions.filter((transaction) => inPeriod(transaction, period));

  const body = resolveAnswer(intent, query, period, scoped, context, format);
  if (!body) return null;

  return { ...body, scope: describeScope(intent, query, period, context) };
}

/** The figure and its context, before the parse is described back to the user. */
function resolveAnswer(
  intent: AssistantIntent,
  query: string,
  period: AssistantPeriod,
  scoped: readonly Transaction[],
  context: AssistantContext,
  format: FormatCents,
): AssistantBody | null {
  switch (intent) {
    case 'net-worth': {
      const net = sumCents(context.accounts.map((account) => account.balance));
      return {
        intent,
        headline: format(net),
        detail: `${pluralize(context.accounts.length, 'account', 'accounts')}, all on this device`,
        rows: context.accounts.map((account) => ({
          label: account.name,
          value: format(account.balance),
        })),
      };
    }

    case 'account-balance': {
      const account = detectAccount(query, context.accounts);
      if (!account) return null;
      return {
        intent,
        headline: format(account.balance),
        detail: account.name,
        rows: [],
      };
    }

    case 'spend-total': {
      // An empty period is not the same as a zero one: "$0.00" would read as
      // "you spent nothing", when the truth is that nothing is recorded.
      if (scoped.length === 0) return nothing(intent, period.label);

      const categoryId = detectCategory(query);
      if (categoryId) return categorySpend(categoryId, scoped, period, format);

      const merchant = detectMerchant(query, context.transactions);
      if (merchant) return merchantSpend(merchant, scoped, period, format);

      const spend = spendOf(scoped);
      return {
        intent,
        headline: format(totalOf(spend)),
        detail: `${pluralize(spend.length, 'entry', 'entries')} · ${period.label}`,
        rows: [],
      };
    }

    case 'income-total': {
      if (scoped.length === 0) return nothing(intent, period.label);

      const income = incomeOf(scoped);
      return {
        intent,
        headline: format(totalOf(income)),
        detail: `${pluralize(income.length, 'entry', 'entries')} · ${period.label}`,
        rows: [],
      };
    }

    case 'category-spend': {
      const categoryId = detectCategory(query);
      if (!categoryId) return null;
      return categorySpend(categoryId, scoped, period, format);
    }

    case 'category-count': {
      const categoryId = detectCategory(query);
      if (!categoryId) return null;
      const matching = scoped.filter((transaction) => transaction.categoryId === categoryId);
      return {
        intent,
        headline: String(matching.length),
        detail: `${pluralize(matching.length, 'entry', 'entries')} · ${getCategory(categoryId).label} · ${period.label}`,
        rows: [],
      };
    }

    case 'merchant-spend': {
      const merchant = detectMerchant(query, context.transactions);
      if (!merchant) return null;
      return merchantSpend(merchant, scoped, period, format);
    }

    case 'top-category': {
      const ranked = rankBy(spendOf(scoped), (transaction) => transaction.categoryId);
      if (ranked.length === 0) return nothing(intent, period.label);
      return {
        intent,
        headline: getCategory(ranked[0].key).label,
        detail: `${format(ranked[0].total)} · ${period.label}`,
        // The winner is the headline, so the rows are the runners-up. Repeating
        // it here would state the same figure twice in one card.
        rows: ranked.slice(1, 5).map((entry) => ({
          label: getCategory(entry.key).label,
          value: format(entry.total),
        })),
      };
    }

    case 'top-merchant': {
      const ranked = rankBy(
        spendOf(scoped).filter((transaction) => transaction.merchant?.trim()),
        (transaction) => transaction.merchant!.trim(),
      );
      if (ranked.length === 0) return nothing(intent, period.label);
      return {
        intent,
        headline: ranked[0].key,
        detail: `${format(ranked[0].total)} · ${period.label}`,
        rows: ranked.slice(1, 5).map((entry) => ({
          label: entry.key,
          value: format(entry.total),
        })),
      };
    }

    case 'biggest-expense': {
      const spend = spendOf(scoped);
      if (spend.length === 0) return nothing(intent, period.label);

      const biggest = spend.reduce((largest, candidate) =>
        compareCents(absoluteCents(candidate.amount), absoluteCents(largest.amount)) > 0
          ? candidate
          : largest,
      );

      return {
        intent,
        headline: format(absoluteCents(biggest.amount)),
        detail: `${biggest.merchant?.trim() || getCategory(biggest.categoryId).label} · ${formatRelativeDay(biggest.date)}`,
        rows: [],
      };
    }

    case 'average-spend': {
      const spend = spendOf(scoped);
      if (spend.length === 0) return nothing(intent, period.label);

      const days = period.start && period.end ? Math.max(1, daysBetween(period.start, period.end)) : 1;
      const perDay = Math.round(totalOf(spend) / days) as Cents;
      const perEntry = Math.round(totalOf(spend) / spend.length) as Cents;

      return {
        intent,
        headline: format(perDay),
        detail: `per day across ${pluralize(days, 'day', 'days')} · ${period.label}`,
        rows: [
          { label: 'Per day', value: format(perDay) },
          { label: 'Per entry', value: format(perEntry) },
        ],
      };
    }

    case 'savings-rate': {
      const income = totalOf(incomeOf(scoped));
      const spend = totalOf(spendOf(scoped));
      if (compareCents(income, ZERO) === 0) {
        return {
          intent,
          headline: 'No income recorded',
          detail: `Nothing came in ${period.label}, so a rate cannot be worked out`,
          rows: [],
        };
      }

      const kept = subtractCents(income, spend);
      return {
        intent,
        headline: `${Math.round(ratioOf(kept, income) * 100)}%`,
        detail: `${format(kept)} kept of ${format(income)} · ${period.label}`,
        rows: [],
      };
    }

    case 'budget-status':
      return budgetAnswer(query, context, scoped, format);

    case 'compare-spending': {
      const previous = period.previous;
      if (!previous) return null;

      const current = totalOf(spendOf(scoped));
      const before = totalOf(
        spendOf(context.transactions.filter((transaction) => inPeriod(transaction, previous))),
      );
      if (compareCents(before, ZERO) === 0) {
        return {
          intent,
          headline: format(current),
          detail: `Nothing recorded ${previous.label}, so there is nothing to compare`,
          rows: [],
        };
      }

      const change = ratioOf(subtractCents(current, before), before);
      const direction = change > 0 ? 'more' : 'less';
      return {
        intent,
        headline: `${change > 0 ? '+' : ''}${Math.round(change * 100)}%`,
        detail: `${format(current)} ${period.label} · ${format(before)} ${previous.label}`,
        rows: [
          { label: period.label, value: format(current) },
          { label: previous.label, value: format(before) },
          { label: 'Difference', value: `${format(absoluteCents(subtractCents(current, before)))} ${direction}` },
        ],
      };
    }

    case 'transaction-count': {
      const categoryId = detectCategory(query);
      const matching = categoryId
        ? scoped.filter((transaction) => transaction.categoryId === categoryId)
        : scoped;
      return {
        intent,
        headline: String(matching.length),
        detail: `${pluralize(matching.length, 'entry', 'entries')}${categoryId ? ` · ${getCategory(categoryId).label}` : ''} · ${period.label}`,
        rows: [],
      };
    }

    case 'recurring-total': {
      const out = sumCents(
        context.recurring
          .filter((rule) => !rule.paused && rule.amount < 0)
          .map((rule) => monthlyAmount(absoluteCents(rule.amount), rule.frequency)),
      );
      const incoming = sumCents(
        context.recurring
          .filter((rule) => !rule.paused && rule.amount > 0)
          .map((rule) => monthlyAmount(rule.amount, rule.frequency)),
      );

      return {
        intent,
        headline: format(out),
        detail: `${pluralize(context.recurring.length, 'rule', 'rules')} committed each month`,
        rows: [
          { label: 'Going out', value: format(out) },
          { label: 'Coming in', value: format(incoming) },
        ],
      };
    }

    case 'list-categories':
      return {
        intent,
        headline: String(EXPENSE_CATEGORIES.length),
        detail: 'expense categories you can record against',
        rows: EXPENSE_CATEGORIES.map((category) => ({ label: category.label })),
      };

    case 'unknown':
      return null;
  }
}

/* ---------------------------------------------------------------- helpers --- */

/** The subject of an answer, when the question did not name one itself. */
const IMPLIED_SUBJECT: Partial<Record<AssistantIntent, string>> = {
  'spend-total': 'All spending',
  'income-total': 'All income',
  'net-worth': 'Every account',
  'top-category': 'Spending',
  'top-merchant': 'Merchants',
  'biggest-expense': 'Largest single entry',
  'average-spend': 'Per day',
  'savings-rate': 'Kept of income',
  'budget-status': 'Against your limits',
  'compare-spending': 'Change in spending',
  'transaction-count': 'Entries',
  'recurring-total': 'Committed monthly',
  'list-categories': 'Categories',
};

/**
 * The parse, said back to the user.
 *
 * Built from the entities the question actually named, so it doubles as a check:
 * if it reads "Groceries · this month" and you asked about dining, you can see
 * the misreading immediately instead of distrusting the figure.
 */
function describeScope(
  intent: AssistantIntent,
  query: string,
  period: AssistantPeriod,
  context: AssistantContext,
): string {
  const parts: string[] = [];

  const categoryId = detectCategory(query);
  const merchant = detectMerchant(query, context.transactions);
  const account = detectAccount(query, context.accounts);

  if (categoryId) parts.push(getCategory(categoryId).label);
  else if (merchant) parts.push(merchant);
  else if (account) parts.push(account.name);
  else if (IMPLIED_SUBJECT[intent]) parts.push(IMPLIED_SUBJECT[intent]!);

  // The period deliberately stays out of here: `scope` answers "what did I read",
  // and `detail` answers "over what range". Putting it in both was the same
  // redundancy the rest of this redesign exists to remove.
  return parts.join(' · ');
}

function nothing(intent: AssistantIntent, periodLabel: string): AssistantBody {
  return {
    intent,
    headline: 'Nothing recorded',
    detail: `No entries ${periodLabel}`,
    rows: [],
  };
}

function categorySpend(
  categoryId: string,
  scoped: readonly Transaction[],
  period: AssistantPeriod,
  format: FormatCents,
): AssistantBody {
  const matching = spendOf(scoped).filter((transaction) => transaction.categoryId === categoryId);
  return {
    intent: 'category-spend',
    headline: format(totalOf(matching)),
    detail: `${pluralize(matching.length, 'entry', 'entries')} · ${period.label}`,
    rows: [],
  };
}

function merchantSpend(
  merchant: string,
  scoped: readonly Transaction[],
  period: AssistantPeriod,
  format: FormatCents,
): AssistantBody {
  const matching = scoped.filter(
    (transaction) => transaction.merchant?.trim().toLowerCase() === merchant.toLowerCase(),
  );
  return {
    intent: 'merchant-spend',
    headline: format(totalOf(spendOf(matching))),
    detail: `${pluralize(matching.length, 'visit', 'visits')} · ${period.label}`,
    rows: [],
  };
}

function budgetAnswer(
  query: string,
  context: AssistantContext,
  scoped: readonly Transaction[],
  format: FormatCents,
): AssistantBody {
  const categoryId = detectCategory(query);

  if (categoryId) {
    const budget = context.budgets.find((candidate) => candidate.categoryId === categoryId);
    if (!budget) {
      return {
        intent: 'budget-status',
        headline: 'No budget set',
        detail: `There is no limit for ${getCategory(categoryId).label}`,
        rows: [],
      };
    }

    const spent = totalOf(
      spendOf(scoped).filter((transaction) => transaction.categoryId === categoryId),
    );
    const over = compareCents(spent, budget.limit) > 0;

    return {
      intent: 'budget-status',
      headline: `${format(spent)} of ${format(budget.limit)}`,
      detail: over
        ? `Over by ${format(subtractCents(spent, budget.limit))}`
        : `${format(subtractCents(budget.limit, spent))} left`,
      rows: [],
    };
  }

  const overCount = context.budgets.filter((budget) => {
    const spent = totalOf(
      spendOf(scoped).filter((transaction) => transaction.categoryId === budget.categoryId),
    );
    return compareCents(spent, budget.limit) > 0;
  }).length;

  return {
    intent: 'budget-status',
    headline: overCount === 0 ? 'All within budget' : `${overCount} over budget`,
    detail: `${pluralize(context.budgets.length, 'budget', 'budgets')} · this month`,
    rows: [],
  };
}

function rankBy(
  transactions: readonly Transaction[],
  key: (transaction: Transaction) => string,
): { key: string; total: Cents }[] {
  const totals = new Map<string, Cents>();

  for (const transaction of transactions) {
    const bucket = key(transaction);
    totals.set(bucket, addCents(totals.get(bucket) ?? ZERO, absoluteCents(transaction.amount)));
  }

  return [...totals.entries()]
    .map(([bucket, total]) => ({ key: bucket, total }))
    .sort((left, right) => compareCents(right.total, left.total));
}

/** A recurring rule's amount expressed as a monthly figure, so frequencies can be
 *  added together. Approximate by design — a month is not a whole number of weeks. */
function monthlyAmount(amount: Cents, frequency: RecurringRule['frequency']): Cents {
  switch (frequency) {
    case 'daily':
      return scaleCents(amount, 30);
    case 'weekly':
      return scaleCents(amount, 52 / 12);
    case 'biweekly':
      return scaleCents(amount, 26 / 12);
    case 'yearly':
      return scaleCents(amount, 1 / 12);
    case 'monthly':
      return amount;
  }
}

function daysBetween(start: DateOnly, end: DateOnly): number {
  const millis = parseDateOnly(end).getTime() - parseDateOnly(start).getTime();
  return Math.round(millis / 86_400_000) + 1;
}
