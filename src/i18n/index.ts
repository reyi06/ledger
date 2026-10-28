import type { Language } from '@/domain/settings';

/**
 * Interface strings, in English and Filipino.
 *
 * Deliberately a plain dictionary rather than an i18n library: the app has one
 * language pair, no runtime locale negotiation beyond a stored preference, and no
 * plural rules that `count === 1` does not already cover. A dependency here would
 * be more moving parts than the problem has.
 *
 * A missing key falls back to English and then to the key itself, so an
 * untranslated string shows up as `budgets.envelopes` in the UI rather than as a
 * blank — visible in review instead of silently absent.
 *
 * ## Translating this file
 *
 * The Filipino column is written for **context, not correspondence**. Several
 * terms are deliberately not the dictionary equivalent:
 *
 *  - `envelopes` is *sobre*. The envelope method is the one budgeting technique a
 *    Filipino household is most likely to already know by that name, so the
 *    literal "mga sobre" is also the most useful word.
 *  - `merchant` is *tindahan* — "shop". A person reading a spending list thinks
 *    "where did I spend", not "which merchant entity".
 *  - `insights` is *pagsusuri* — "examination". "Insights" as a loanword would be
 *    understood, but the screen is a review of your own figures.
 *  - `haptics` is *pag-vibrate*. The English word is jargon; the effect is what
 *    matters.
 *  - `cash` is *perang hawak* — "money held", which is what the account kind
 *    actually means, rather than the loanword.
 *  - `in` and `out` are *pumasok* and *lumabas* — the verbs for money arriving and
 *    leaving. They read as direction, which is the whole point of those tiles.
 */

export type TranslationParams = Record<string, string | number>;

type Dictionary = Record<string, string>;

const en: Dictionary = {
  /* Tabs */
  'tab.overview': 'Overview',
  'tab.activity': 'Activity',
  'tab.budgets': 'Budgets',
  'tab.insights': 'Insights',
  'tab.settings': 'Settings',

  /* Shared controls */
  'common.continue': 'Continue',
  'common.next': 'Next',
  'common.skip': 'Skip',
  'common.start': 'Start',
  'common.add': 'Add',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.duplicate': 'Duplicate',
  'common.close': 'Close',
  'common.done': 'Done',
  'common.all': 'All',
  'common.spent': 'Spent',
  'common.earned': 'Earned',
  'common.thisMonth': 'This month',
  'common.lastMonth': 'Last month',
  'common.allTime': 'All time',
  'common.in': 'In',
  'common.out': 'Out',
  'common.totals': 'Totals',
  'common.seeAll': 'See all',
  'common.addTransaction': 'Add transaction',
  'common.showBalances': 'Show balances',
  'common.hideBalances': 'Hide balances',
  'common.empty': 'Nothing here yet',
  'common.retry': 'Try again',
  'common.of': 'of',

  /* Onboarding */
  'welcome.yourName': 'Your name',
  'welcome.nameRequired': 'Enter your name',
  'pin.create': 'Choose a PIN',
  'pin.createBody': '{count} digits. You will need this every time you open Ledger.',
  'pin.confirm': 'Confirm your PIN',
  'pin.confirmBody': 'Enter the same PIN once more.',
  'pin.mismatch': 'Those PINs did not match. Try again.',
  'pin.matching': 'Matching…',
  'unlock.welcomeBack': 'Welcome back',
  'unlock.incorrect': 'Incorrect PIN',
  'unlock.deleteDigit': 'Delete digit',
  'unlock.useBiometrics': 'Unlock with {label}',

  /* Guided tour */
  'tour.step1.lead': 'This is',
  'tour.step1.emphasis': 'Ledger',
  'tour.step1.body':
    'A private ledger for your accounts, spending and budgets. Every figure is worked out on this device.',
  'tour.step2.lead': 'Everything at',
  'tour.step2.emphasis': 'a glance',
  'tour.step2.body':
    'Net worth across every account, what came in and went out this month, and where it went.',
  'tour.step3.lead': 'Every entry,',
  'tour.step3.emphasis': 'kept',
  'tour.step3.body':
    'The whole history, grouped by day and searchable. Long-press any entry to edit or duplicate it.',
  'tour.step4.lead': 'Budgets that',
  'tour.step4.emphasis': 'hold',
  'tour.step4.body':
    'Set a monthly limit for a category and watch the bar fill. Past the limit, it turns terracotta.',
  'tour.step5.lead': 'See the',
  'tour.step5.emphasis': 'shape',
  'tour.step5.body':
    'Savings rate, daily average, projected month-end, and what changed since last month.',
  'tour.step6.lead': 'Nothing',
  'tour.step6.emphasis': 'leaves',
  'tour.step6.body':
    'Nothing is sent anywhere. Your PIN unlocks a ledger that lives only on this phone.',
  'tour.step7.lead': 'Ready when',
  'tour.step7.emphasis': 'you are',
  'tour.step7.body':
    'Start by adding an account, then record your first transaction with the button in the corner.',

  /* Overview */
  'overview.netWorth': 'Net worth',
  'overview.spending': 'Spending',
  'overview.whereItWent': 'Where it went',
  'overview.recent': 'Recent',
  'overview.accounts': 'Accounts',
  'overview.manage': 'Manage',
  'overview.soFarThisMonth': 'so far this month',
  'overview.thatMonth': 'that month',
  'overview.emptyTitle': 'Nothing recorded yet',
  'overview.emptyBody': 'Add an account, then record your first transaction.',
  'overview.noAccounts': 'Add an account to start tracking balances.',
  'overview.noSpending': 'Nothing recorded this month yet.',

  /* Activity */
  'activity.entries': '{count} entry|{count} entries',
  'activity.periodAndTotals': 'Period and totals',
  'activity.nothingHere': 'Nothing here yet',
  'activity.nothingHereBody': 'Add a transaction to start building your history.',
  'activity.noMatches': 'No matches',
  'activity.noMatchesBody': 'Try a different search term or widen the date range.',
  'activity.searchPlaceholder': 'Search merchant, note or category',
  'activity.inOut': '{in} in · {out} out',
  'activity.selected': '{count} selected',
  'activity.selectHint': 'Hold a row to select several',
  'activity.deleteSelected': 'Delete {count} entries',
  'activity.deleteSelectedConfirm':
    'This removes {count} entries from your ledger. It cannot be undone.',
  'activity.actions': 'Transaction',

  /* Budgets */
  'budgets.budgetedOf': 'of {amount} budgeted',
  'budgets.overBy': 'over by {amount}',
  'budgets.envelopes': 'Envelopes',
  'budgets.addBudget': 'Add budget',
  'budgets.notBudgeted': 'Not budgeted',
  'budgets.noLimitSet': 'No limit set',
  'budgets.emptyTitle': 'No budgets yet',
  'budgets.emptyBody': 'Set a monthly limit for a category and this screen will track it for you.',
  'budgets.emptyAction': 'Create your first budget',
  'budgets.overCount': '{count} over',
  'budgets.limit': 'Monthly limit',
  'budgets.remove': 'Remove budget',

  /* Insights */
  'insights.savingsRate': 'Savings rate',
  'insights.spentAndIn': '{spent} spent of {in} that came in',
  'insights.theDetail': 'The detail',
  'insights.comparedToLastMonth': 'Compared to last month',
  'insights.comparedHint': 'Spending and income',
  'insights.spendingPace': 'Spending pace',
  'insights.projectedHint': 'Projected {amount} by month end',
  'insights.cumulativeHint': 'Cumulative spend across the month',
  'insights.categoryTrends': 'Category trends',
  'insights.categoriesMoved': '{count} category moved|{count} categories moved',
  'insights.nothingMoved': 'Nothing moved yet',
  'insights.topMerchants': 'Top merchants',
  'insights.merchants': '{count} merchant|{count} merchants',
  'insights.noMerchants': 'No merchants yet',
  'insights.biggestExpense': 'Biggest expense',
  'insights.nothingRecorded': 'Nothing recorded',
  'insights.habits': 'Habits',
  'insights.activeDaysHint': '{count} active days of {total}',
  'insights.activeDays': 'Active days',
  'insights.budgetUsed': 'Budget used',
  'insights.cumulativeSpend': 'Cumulative spend, day 1 to {days}',
  'insights.ofIncome': '{percent} of income',
  'insights.nothingToAnalyse': 'Nothing to analyse yet',
  'insights.nothingToAnalyseBody': 'Once you record some spending, trends will show up here.',
  'insights.noMerchantsBody': 'Merchants appear once you have named a few transactions.',
  'insights.thisMonth': 'This month',
  'insights.patterns': 'Patterns',
  'insights.selectedMonth': 'Selected month',
  'insights.daysOf': '{count} of {total} days',
  'insights.lastMonthValue': '{amount} last month',
  'insights.visits': '{count} visit|{count} visits',
  'insights.new': 'new',
  'insights.was': 'was {amount}',

  /* Settings */
  'settings.preferences': 'Preferences',
  'settings.appearance': 'Appearance',
  'settings.theme': 'Theme',
  'settings.currency': 'Currency',
  'settings.language': 'Language',
  'settings.security': 'Security',
  'settings.data': 'Data',
  'settings.exportCsv': 'Export as CSV',
  'settings.exportPreparing': 'Preparing export…',
  'settings.exportDescription': 'Save a CSV of every entry',
  'settings.exportFailed': 'Export failed',
  'settings.loadDemo': 'Load demo ledger',
  'settings.loadDemoDescription': 'Five months of sample accounts and transactions',
  'settings.loadDemoConfirm':
    'Your current accounts, transactions, budgets and rules will be replaced with the sample ledger.',
  'settings.eraseAll': 'Erase everything',
  'settings.eraseDescription': 'Delete all local data on this device',
  'settings.eraseConfirm':
    'This deletes every account, transaction, budget and rule stored on this device. It cannot be undone.',
  'settings.signOut': 'Sign out',
  'settings.signOutDescription': 'Remove your PIN and return to setup',
  'settings.signOutConfirm':
    'This removes your local profile and PIN. Your ledger data stays on the device.',
  'settings.addAccount': 'Add account',
  'settings.accountsEmpty': 'No accounts yet. Add one to start tracking balances.',
  'settings.automation': 'Automation',
  'settings.recurring': 'Recurring rules',
  'settings.recurringDescription': '{count} rules · {paused} paused',
  'settings.transfer': 'Transfer money',
  'settings.transferDescription': 'Move funds between your own accounts',
  'settings.replayTour': 'Replay the tour',
  'settings.replayTourDescription': 'See the seven-step introduction again',
  'settings.offline': 'On device',
  'settings.biometrics': 'Unlock with {label}',
  'settings.biometricsDescription': 'Use your device biometrics instead of the PIN',
  'settings.biometricsUnavailable': 'Not available on this device',
  'settings.changePin': 'Change PIN',
  'settings.autoLock': 'Auto-lock',
  'settings.lockNow': 'Lock now',
  'settings.hideBalances': 'Hide balances',
  'settings.hideBalancesDescription': 'Mask every amount until you reveal it',
  'settings.haptics': 'Vibration',
  'settings.hapticsDescription': 'Subtle feedback on taps and saves',
  'settings.version': 'Version {version} · offline-first',
  'settings.privacyNote':
    'No account, no network, no telemetry. Everything you see is computed from data stored on this device.',
  'settings.lockLedger': 'Lock Ledger',

  /* Auto-lock durations */
  'autolock.never': 'Never',
  'autolock.oneMinute': 'After 1 minute',
  'autolock.minutes': 'After {minutes} minutes',
  'autolock.oneHour': 'After 1 hour',

  /* Assistant */
  'assistant.title': 'Assistant',
  'assistant.subtitle': 'Answered on this device from your own ledger',
  'assistant.introTitle': 'Ask about your ledger',
  'assistant.introBody':
    'Spending, income, budgets, balances or trends. Every figure is worked out from your own entries, on this device.',
  'assistant.placeholder': 'How much did I spend on dining out?',
  'assistant.notUnderstood': 'I did not follow that one',
  'assistant.notUnderstoodBody':
    'I read a fixed set of questions rather than free conversation, so I will not guess at a number. Every suggestion on the rail below will work.',
  'assistant.send': 'Send',
  'assistant.q.spendMonth': 'How much did I spend this month?',
  'assistant.q.earnLast': 'How much did I earn last month?',
  'assistant.q.netWorth': 'What is my net worth?',
  'assistant.q.topCategory': 'Where did most of my money go?',
  'assistant.q.biggest': 'What was my biggest expense?',
  'assistant.q.dining': 'How much did I spend on dining out?',
  'assistant.q.budget': 'Am I over budget?',
  'assistant.q.supermarket': 'How much did I spend at the supermarket?',
  'assistant.q.average': 'What is my average daily spend?',
  'assistant.q.compare': 'How does this month compare to last?',
  'assistant.q.subscriptions': 'What are my subscriptions?',
  'assistant.q.count': 'How many times did I eat out this month?',

  /* Transactions */
  'transaction.new': 'New transaction',
  'transaction.edit': 'Edit transaction',
  'transaction.detail': 'Transaction',
  'transaction.amount': 'Amount',
  'transaction.merchant': 'Merchant',
  'transaction.merchantPlaceholder': 'Where was this?',
  'transaction.note': 'Note',
  'transaction.notePlaceholder': 'Anything worth remembering',
  'transaction.category': 'Category',
  'transaction.account': 'Account',
  'transaction.date': 'Date',
  'transaction.direction': 'Direction',
  'transaction.expense': 'Money out',
  'transaction.income': 'Money in',
  'transaction.delete': 'Delete transaction',
  'transaction.deleteConfirm': 'This removes the entry from your ledger. It cannot be undone.',
  'transaction.recorded': '{amount} · recorded {when}',
  'transaction.saveFailed': 'Could not save this entry',
  'transaction.details': 'Details',
  'transaction.saveChanges': 'Save changes',
  'transaction.noAccountsTitle': 'No accounts yet',
  'transaction.noAccountsBody': 'Create an account first, then you can record transactions against it.',
  'transaction.addAccount': 'Add an account',
  'transaction.today': 'Today',
  'transaction.yesterday': 'Yesterday',
  'transaction.twoDaysAgo': '2 days ago',
  'transaction.invalidAmount': 'Enter a valid amount',

  /* Accounts */
  'account.new': 'New account',
  'account.edit': 'Edit account',
  'account.name': 'Name',
  'account.namePlaceholder': 'Everyday Checking',
  'account.kind': 'Kind',
  'account.institution': 'Institution',
  'account.institutionPlaceholder': 'Optional',
  'account.openingBalance': 'Starting balance',
  'account.archive': 'Archive account',
  'account.archived': 'Archived',
  'account.delete': 'Delete account',
  'account.deleteConfirm': 'This also removes its transactions. It cannot be undone.',

  /* Transfer */
  'transfer.title': 'Transfer',
  'transfer.from': 'From',
  'transfer.to': 'To',
  'transfer.when': 'When',
  'transfer.sameAccount': 'Pick two different accounts',
  'transfer.submit': 'Move money',
  'transfer.notePlaceholder': 'Optional',
  'transfer.twoAccountsTitle': 'Two accounts needed',
  'transfer.twoAccountsBody':
    'A transfer moves money between two of your accounts. Add another account to continue.',
  'transfer.addAccount': 'Add an account',
  'transfer.amountPositive': 'Enter an amount greater than zero',

  /* Recurring */
  'recurring.title': 'Recurring',
  'recurring.new': 'New rule',
  'recurring.edit': 'Edit rule',
  'recurring.committed': 'Committed each month',
  'recurring.comingUp': 'Coming up',
  'recurring.allRules': 'All rules',
  'recurring.paused': 'Paused',
  'recurring.pause': 'Pause rule',
  'recurring.resume': 'Resume rule',
  'recurring.delete': 'Delete rule',
  'recurring.deleteConfirm': 'This removes the rule and its scheduled entries. It cannot be undone.',
  'recurring.frequency': 'How often',
  'recurring.startDate': 'Starting',
  'recurring.next': 'Next {date}',
  'recurring.emptyTitle': 'No recurring rules',
  'recurring.emptyBody': 'Set one up for rent, subscriptions, or anything that repeats.',

  /* Strings the first pass missed */
  'common.goBack': 'Go back',
  'transaction.notFound': 'Transaction not found',
  'transaction.notFoundBody': 'It may have been deleted.',
  'transaction.unknownAccount': 'Unknown account',
  'transaction.noNote': 'No note',
  'account.currentBalance': 'Current balance',
  'account.details': 'Details',
  'account.openingBalanceHint': 'Use a negative number for money you owe',
  'account.saveChanges': 'Save changes',
  'account.manage': 'Manage',
  'account.restore': 'Restore account',
  'recurring.net': 'Net',
  'recurring.monthlyNote':
    'Monthly equivalents, normalized across daily, weekly and yearly rules.',
  'recurring.fallbackTitle': 'Recurring entry',
  'recurring.createRule': 'Create a rule',
  'recurring.manageBody': 'Manage this recurring rule',
  'recurring.backfillNote': 'A start date in the past is backfilled immediately.',
  'recurring.label': 'Label',
  'recurring.labelPlaceholder': 'Rent, salary, streaming…',
  'budgets.edit': 'Edit budget',
  'budgets.new': 'New budget',
  'budgets.editorBody': 'Choose a category and limit',
  'budgets.pickCategory': 'Pick a category first',
  'budgets.invalidLimit': 'Enter a valid limit',
  'budgets.limitPositive': 'Enter a limit greater than zero',
  'budgets.spentThisMonth': 'Spent this month',
  'budgets.limitUsed': '{percent} of this limit used',
  'budgets.allBudgetsSet': 'Every expense category already has a budget.',
  'budgets.saveLimit': 'Save limit',
  'budgets.createBudget': 'Create budget',
  'pin.enterCurrent': 'Enter current PIN',
  'pin.yourPin': 'Your {count}-digit PIN',
  'pin.chooseNew': 'Choose a new PIN',
  'pin.digits': '{count} digits',
  'pin.confirmNew': 'Confirm new PIN',
  'pin.enterOnceMore': 'Enter it once more',
  'pin.currentIncorrect': 'Current PIN was incorrect',
  'error.code': 'Error 404',
  'datePicker.previousMonth': 'Previous month',
  'datePicker.nextMonth': 'Next month',
  'settings.never': 'Never',
  'settings.minutesShort': '{minutes}m',
  'weekday.0': 'S',
  'weekday.1': 'M',
  'weekday.2': 'T',
  'weekday.3': 'W',
  'weekday.4': 'T',
  'weekday.5': 'F',
  'weekday.6': 'S',

  /* Validation */
  'validation.amountRequired': 'Enter an amount',
  'validation.amountPositive': 'Enter an amount greater than zero',
  'validation.amountInvalid': 'Enter a valid amount',
  'validation.max40': 'Keep it under 40 characters',
  'validation.max60': 'Keep it under 60 characters',
  'validation.max200': 'Keep it under 200 characters',
  'validation.accountName': 'Give the account a name',
  'validation.openingBalance': 'Enter a starting balance',
  'validation.limitRequired': 'Enter a monthly limit',
  'validation.limitPositive': 'Enter a limit greater than zero',
  'frequency.daily': 'Every day',
  'frequency.weekly': 'Every week',
  'frequency.biweekly': 'Every 2 weeks',
  'frequency.monthly': 'Every month',
  'frequency.yearly': 'Every year',
  'accountKind.checking': 'Checking',
  'accountKind.savings': 'Savings',
  'accountKind.credit': 'Credit card',
  'accountKind.investment': 'Investment',
  'accountKind.cash': 'Cash',
  'theme.system': 'System',
  'theme.light': 'Light',
  'theme.dark': 'Dark',

  /* Errors */
  'error.title': 'Ledger hit a problem',
  'error.body': 'Your data is stored on this device and has not been affected. Reloading usually clears this.',
  'error.reload': 'Reload',
  'error.notFoundTitle': 'Nothing at this address',
  'error.notFoundBody': 'That screen does not exist.',
  'error.goHome': 'Back to the ledger',
};

const fil: Dictionary = {
  /* Tabs */
  'tab.overview': 'Buod',
  'tab.activity': 'Aktibidad',
  'tab.budgets': 'Badyet',
  'tab.insights': 'Pagsusuri',
  'tab.settings': 'Mga Setting',

  /* Shared controls */
  'common.continue': 'Magpatuloy',
  'common.next': 'Susunod',
  'common.skip': 'Laktawan',
  'common.start': 'Simulan',
  'common.add': 'Magdagdag',
  'common.save': 'I-save',
  'common.cancel': 'Kanselahin',
  'common.delete': 'Burahin',
  'common.edit': 'I-edit',
  'common.duplicate': 'Kopyahin',
  'common.close': 'Isara',
  'common.done': 'Tapos na',
  'common.all': 'Lahat',
  'common.spent': 'Ginastos',
  'common.earned': 'Kinita',
  'common.thisMonth': 'Ngayong buwan',
  'common.lastMonth': 'Nakaraang buwan',
  'common.allTime': 'Lahat ng panahon',
  'common.in': 'Pumasok',
  'common.out': 'Lumabas',
  'common.totals': 'Kabuuan',
  'common.seeAll': 'Tingnan lahat',
  'common.addTransaction': 'Magdagdag ng transaksyon',
  'common.showBalances': 'Ipakita ang balanse',
  'common.hideBalances': 'Itago ang balanse',
  'common.empty': 'Wala pa rito',
  'common.retry': 'Subukan muli',
  'common.of': 'sa',

  /* Onboarding */
  'welcome.yourName': 'Iyong pangalan',
  'welcome.nameRequired': 'Ilagay ang iyong pangalan',
  'pin.create': 'Pumili ng PIN',
  'pin.createBody': '{count} digit. Kakailanganin mo ito tuwing bubuksan ang Ledger.',
  'pin.confirm': 'Kumpirmahin ang PIN',
  'pin.confirmBody': 'Ilagay muli ang parehong PIN.',
  'pin.mismatch': 'Hindi magkapareho ang mga PIN. Subukan muli.',
  'pin.matching': 'Tinutugma…',
  'unlock.welcomeBack': 'Maligayang pagbabalik',
  'unlock.incorrect': 'Mali ang PIN',
  'unlock.deleteDigit': 'Burahin ang digit',
  'unlock.useBiometrics': 'I-unlock gamit ang {label}',

  /* Guided tour */
  'tour.step1.lead': 'Ito ang',
  'tour.step1.emphasis': 'Ledger',
  'tour.step1.body':
    'Isang pribadong ledger para sa iyong mga account, gastos at badyet. Kinukwenta ang lahat ng numero sa device na ito.',
  'tour.step2.lead': 'Lahat sa',
  'tour.step2.emphasis': 'isang tingin',
  'tour.step2.body':
    'Ang netong halaga sa lahat ng account, ang pumasok at lumabas ngayong buwan, at kung saan napunta.',
  'tour.step3.lead': 'Bawat entry,',
  'tour.step3.emphasis': 'nakatala',
  'tour.step3.body':
    'Ang buong kasaysayan, naka-grupo ayon sa araw at mahahanap. Pindutin nang matagal ang isang entry para i-edit o kopyahin.',
  'tour.step4.lead': 'Badyet na',
  'tour.step4.emphasis': 'kumakapit',
  'tour.step4.body':
    'Magtakda ng buwanang limitasyon sa isang kategorya at tingnan ang pagpuno ng bar. Kapag lumampas, nagiging terracotta ito.',
  'tour.step5.lead': 'Tingnan ang',
  'tour.step5.emphasis': 'hubog',
  'tour.step5.body':
    'Rate ng ipon, arawang average, tantyang katapusan ng buwan, at ang nagbago mula noong nakaraang buwan.',
  'tour.step6.lead': 'Walang',
  'tour.step6.emphasis': 'lumalabas',
  'tour.step6.body':
    'Walang ipinapadala kahit saan. Binubuksan ng iyong PIN ang isang ledger na nasa teleponong ito lamang.',
  'tour.step7.lead': 'Handa kapag',
  'tour.step7.emphasis': 'handa ka na',
  'tour.step7.body':
    'Magsimula sa pagdagdag ng account, tapos i-record ang unang transaksyon gamit ang button sa sulok.',

  /* Overview */
  'overview.netWorth': 'Netong halaga',
  'overview.spending': 'Gastos',
  'overview.whereItWent': 'Saan napunta',
  'overview.recent': 'Kamakailan',
  'overview.accounts': 'Mga account',
  'overview.manage': 'Pamahalaan',
  'overview.soFarThisMonth': 'ngayong buwan',
  'overview.thatMonth': 'ng buwang iyon',
  'overview.emptyTitle': 'Wala pang naitala',
  'overview.emptyBody': 'Magdagdag muna ng account, tapos i-record ang unang transaksyon.',
  'overview.noAccounts': 'Magdagdag ng account para masimulan ang balanse.',
  'overview.noSpending': 'Wala pang naitala ngayong buwan.',

  /* Activity */
  'activity.entries': '{count} entry|{count} entry',
  'activity.periodAndTotals': 'Panahon at kabuuan',
  'activity.nothingHere': 'Wala pa rito',
  'activity.nothingHereBody': 'Magdagdag ng transaksyon para magsimula ang kasaysayan.',
  'activity.noMatches': 'Walang tugma',
  'activity.noMatchesBody': 'Subukan ang ibang hinahanap o palawakin ang petsa.',
  'activity.searchPlaceholder': 'Maghanap ng tindahan, tala o kategorya',
  'activity.inOut': '{in} pumasok · {out} lumabas',
  'activity.selected': '{count} ang napili',
  'activity.selectHint': 'Pindutin nang matagal ang isang row para pumili ng marami',
  'activity.deleteSelected': 'Burahin ang {count} entry',
  'activity.deleteSelectedConfirm':
    'Aalisin nito ang {count} entry sa iyong ledger. Hindi na ito maibabalik.',
  'activity.actions': 'Transaksyon',

  /* Budgets */
  'budgets.budgetedOf': 'sa {amount} na badyet',
  'budgets.overBy': 'lampas ng {amount}',
  'budgets.envelopes': 'Mga sobre',
  'budgets.addBudget': 'Magdagdag ng badyet',
  'budgets.notBudgeted': 'Walang badyet',
  'budgets.noLimitSet': 'Walang limitasyong nakatakda',
  'budgets.emptyTitle': 'Wala pang badyet',
  'budgets.emptyBody':
    'Magtakda ng buwanang limitasyon sa isang kategorya at susubaybayan ito ng screen na ito.',
  'budgets.emptyAction': 'Gumawa ng unang badyet',
  'budgets.overCount': '{count} lampas',
  'budgets.limit': 'Buwanang limitasyon',
  'budgets.remove': 'Alisin ang badyet',

  /* Insights */
  'insights.savingsRate': 'Rate ng ipon',
  'insights.spentAndIn': '{spent} ang ginastos sa {in} na pumasok',
  'insights.theDetail': 'Ang detalye',
  'insights.comparedToLastMonth': 'Kumpara noong nakaraang buwan',
  'insights.comparedHint': 'Gastos at kita',
  'insights.spendingPace': 'Bilis ng gastos',
  'insights.projectedHint': 'Tantya: {amount} sa katapusan ng buwan',
  'insights.cumulativeHint': 'Kabuuang gastos sa buong buwan',
  'insights.categoryTrends': 'Takbo ng mga kategorya',
  'insights.categoriesMoved': '{count} kategorya ang gumalaw|{count} kategorya ang gumalaw',
  'insights.nothingMoved': 'Walang gumalaw pa',
  'insights.topMerchants': 'Pinakamagastusan',
  'insights.merchants': '{count} tindahan|{count} tindahan',
  'insights.noMerchants': 'Wala pang tindahan',
  'insights.biggestExpense': 'Pinakamalaking gastos',
  'insights.nothingRecorded': 'Wala pang naitala',
  'insights.habits': 'Mga gawi',
  'insights.activeDaysHint': '{count} araw na may galaw sa {total}',
  'insights.activeDays': 'Araw na may galaw',
  'insights.budgetUsed': 'Nagamit na badyet',
  'insights.cumulativeSpend': 'Kabuuang gastos, araw 1 hanggang {days}',
  'insights.ofIncome': '{percent} ng kita',
  'insights.nothingToAnalyse': 'Wala pang masusuri',
  'insights.nothingToAnalyseBody': 'Kapag may naitala nang gastos, lalabas ang takbo rito.',
  'insights.noMerchantsBody': 'Lalabas ang mga tindahan kapag may pangalan na ang ilang transaksyon.',
  'insights.thisMonth': 'Ngayong buwan',
  'insights.patterns': 'Mga pattern',
  'insights.selectedMonth': 'Piniling buwan',
  'insights.daysOf': '{count} ng {total} araw',
  'insights.lastMonthValue': '{amount} noong nakaraang buwan',
  'insights.visits': '{count} bisita|{count} bisita',
  'insights.new': 'bago',
  'insights.was': 'dati {amount}',

  /* Settings */
  'settings.preferences': 'Mga kagustuhan',
  'settings.appearance': 'Itsura',
  'settings.theme': 'Tema',
  'settings.currency': 'Pera',
  'settings.language': 'Wika',
  'settings.security': 'Seguridad',
  'settings.data': 'Data',
  'settings.exportCsv': 'I-export bilang CSV',
  'settings.exportPreparing': 'Inihahanda ang export…',
  'settings.exportDescription': 'I-save ang CSV ng lahat ng entry',
  'settings.exportFailed': 'Nabigo ang export',
  'settings.loadDemo': 'Mag-load ng demo',
  'settings.loadDemoDescription': 'Limang buwang halimbawang account at transaksyon',
  'settings.loadDemoConfirm':
    'Mapapalitan ng halimbawang ledger ang iyong mga account, transaksyon, badyet at tuntunin.',
  'settings.eraseAll': 'Burahin lahat',
  'settings.eraseDescription': 'Burahin ang lahat ng data sa device na ito',
  'settings.eraseConfirm':
    'Buburahin nito ang lahat ng account, transaksyon, badyet at tuntunin sa device na ito. Hindi na ito maibabalik.',
  'settings.signOut': 'Mag-sign out',
  'settings.signOutDescription': 'Alisin ang PIN at bumalik sa setup',
  'settings.signOutConfirm':
    'Aalisin nito ang iyong lokal na profile at PIN. Mananatili sa device ang iyong ledger.',
  'settings.addAccount': 'Magdagdag ng account',
  'settings.accountsEmpty': 'Wala pang account. Magdagdag para masimulan ang balanse.',
  'settings.automation': 'Awtomasyon',
  'settings.recurring': 'Mga umuulit na tuntunin',
  'settings.recurringDescription': '{count} tuntunin · {paused} naka-pause',
  'settings.transfer': 'Maglipat ng pera',
  'settings.transferDescription': 'Ilipat ang pondo sa pagitan ng iyong mga account',
  'settings.replayTour': 'Ulitin ang tour',
  'settings.replayTourDescription': 'Tingnan muli ang pitong hakbang',
  'settings.offline': 'Nasa device',
  'settings.biometrics': 'I-unlock gamit ang {label}',
  'settings.biometricsDescription': 'Gamitin ang biometrics ng device sa halip na PIN',
  'settings.biometricsUnavailable': 'Hindi available sa device na ito',
  'settings.changePin': 'Palitan ang PIN',
  'settings.autoLock': 'Awtomatikong pag-lock',
  'settings.lockNow': 'I-lock ngayon',
  'settings.hideBalances': 'Itago ang balanse',
  'settings.hideBalancesDescription': 'Takpan ang lahat ng halaga hanggang ipakita mo',
  'settings.haptics': 'Pag-vibrate',
  'settings.hapticsDescription': 'Bahagyang pag-vibrate sa pagpindot at pag-save',
  'settings.version': 'Bersyon {version} · offline-first',
  'settings.privacyNote':
    'Walang account, walang network, walang telemetry. Kinukwenta ang lahat ng nakikita mo mula sa data sa device na ito.',
  'settings.lockLedger': 'I-lock ang Ledger',

  /* Auto-lock durations */
  'autolock.never': 'Hindi kailanman',
  'autolock.oneMinute': 'Pagkatapos ng 1 minuto',
  'autolock.minutes': 'Pagkatapos ng {minutes} minuto',
  'autolock.oneHour': 'Pagkatapos ng 1 oras',

  /* Assistant */
  'assistant.title': 'Katulong',
  'assistant.subtitle': 'Sinasagot sa device na ito mula sa sarili mong ledger',
  'assistant.introTitle': 'Magtanong tungkol sa iyong ledger',
  'assistant.introBody':
    'Gastos, kita, badyet, balanse o takbo. Kinukwenta ang lahat ng numero mula sa sarili mong mga entry, sa device na ito.',
  'assistant.placeholder': 'Magkano ang ginastos ko sa kainan?',
  'assistant.notUnderstood': 'Hindi ko naintindihan iyon',
  'assistant.notUnderstoodBody':
    'Limitado ang mga tanong na nababasa ko, at hindi ako nanghuhula ng numero. Gumagana ang lahat ng mungkahi sa ibaba.',
  'assistant.send': 'Ipadala',
  'assistant.q.spendMonth': 'Magkano ang ginastos ko ngayong buwan?',
  'assistant.q.earnLast': 'Magkano ang kinita ko noong nakaraang buwan?',
  'assistant.q.netWorth': 'Magkano ang netong halaga ko?',
  'assistant.q.topCategory': 'Saan napunta ang karamihan ng pera ko?',
  'assistant.q.biggest': 'Ano ang pinakamalaking gastos ko?',
  'assistant.q.dining': 'Magkano ang ginastos ko sa kainan?',
  'assistant.q.budget': 'Lampas na ba ako sa badyet?',
  'assistant.q.supermarket': 'Magkano ang ginastos ko sa grocery?',
  'assistant.q.average': 'Magkano ang arawan kong gastos?',
  'assistant.q.compare': 'Kumusta ang buwang ito kumpara sa nakaraan?',
  'assistant.q.subscriptions': 'Ano ang mga subscription ko?',
  'assistant.q.count': 'Ilang beses akong kumain sa labas ngayong buwan?',

  /* Transactions */
  'transaction.new': 'Bagong transaksyon',
  'transaction.edit': 'I-edit ang transaksyon',
  'transaction.detail': 'Transaksyon',
  'transaction.amount': 'Halaga',
  'transaction.merchant': 'Tindahan',
  'transaction.merchantPlaceholder': 'Saan ito nangyari?',
  'transaction.note': 'Tala',
  'transaction.notePlaceholder': 'Anumang dapat tandaan',
  'transaction.category': 'Kategorya',
  'transaction.account': 'Account',
  'transaction.date': 'Petsa',
  'transaction.direction': 'Direksyon',
  'transaction.expense': 'Lumabas',
  'transaction.income': 'Pumasok',
  'transaction.delete': 'Burahin ang transaksyon',
  'transaction.deleteConfirm': 'Aalisin nito ang entry sa iyong ledger. Hindi na ito maibabalik.',
  'transaction.recorded': '{amount} · naitala {when}',
  'transaction.saveFailed': 'Hindi ma-save ang entry na ito',
  'transaction.details': 'Mga detalye',
  'transaction.saveChanges': 'I-save ang mga pagbabago',
  'transaction.noAccountsTitle': 'Wala pang account',
  'transaction.noAccountsBody':
    'Gumawa muna ng account, tapos puwede ka nang mag-record ng transaksyon.',
  'transaction.addAccount': 'Magdagdag ng account',
  'transaction.today': 'Ngayon',
  'transaction.yesterday': 'Kahapon',
  'transaction.twoDaysAgo': '2 araw ang nakalipas',
  'transaction.invalidAmount': 'Maglagay ng tamang halaga',

  /* Accounts */
  'account.new': 'Bagong account',
  'account.edit': 'I-edit ang account',
  'account.name': 'Pangalan',
  'account.namePlaceholder': 'Pang-araw-araw na account',
  'account.kind': 'Uri',
  'account.institution': 'Bangko',
  'account.institutionPlaceholder': 'Opsyonal',
  'account.openingBalance': 'Panimulang balanse',
  'account.archive': 'I-archive ang account',
  'account.archived': 'Naka-archive',
  'account.delete': 'Burahin ang account',
  'account.deleteConfirm': 'Mabubura rin ang mga transaksyon nito. Hindi na ito maibabalik.',

  /* Transfer */
  'transfer.title': 'Paglipat',
  'transfer.from': 'Mula sa',
  'transfer.to': 'Papunta sa',
  'transfer.when': 'Kailan',
  'transfer.sameAccount': 'Pumili ng dalawang magkaibang account',
  'transfer.submit': 'Ilipat ang pera',
  'transfer.notePlaceholder': 'Opsyonal',
  'transfer.twoAccountsTitle': 'Kailangan ng dalawang account',
  'transfer.twoAccountsBody':
    'Ang paglipat ay naglilipat ng pera sa pagitan ng dalawang account mo. Magdagdag ng isa pa para magpatuloy.',
  'transfer.addAccount': 'Magdagdag ng account',
  'transfer.amountPositive': 'Maglagay ng halagang mas malaki sa zero',

  /* Recurring */
  'recurring.title': 'Umuulit',
  'recurring.new': 'Bagong tuntunin',
  'recurring.edit': 'I-edit ang tuntunin',
  'recurring.committed': 'Nakatakda bawat buwan',
  'recurring.comingUp': 'Paparating',
  'recurring.allRules': 'Lahat ng tuntunin',
  'recurring.paused': 'Naka-pause',
  'recurring.pause': 'I-pause ang tuntunin',
  'recurring.resume': 'Ituloy ang tuntunin',
  'recurring.delete': 'Burahin ang tuntunin',
  'recurring.deleteConfirm': 'Aalisin nito ang tuntunin at ang mga nakatakdang entry. Hindi na ito maibabalik.',
  'recurring.frequency': 'Gaano kadalas',
  'recurring.startDate': 'Magsisimula',
  'recurring.next': 'Susunod {date}',
  'recurring.emptyTitle': 'Walang umuulit na tuntunin',
  'recurring.emptyBody':
    'Gumawa para sa upa, subscription, o anumang paulit-ulit na bayarin.',

  /* Strings the first pass missed */
  'common.goBack': 'Bumalik',
  'transaction.notFound': 'Hindi mahanap ang transaksyon',
  'transaction.notFoundBody': 'Baka nabura na ito.',
  'transaction.unknownAccount': 'Hindi kilalang account',
  'transaction.noNote': 'Walang tala',
  'account.currentBalance': 'Kasalukuyang balanse',
  'account.details': 'Mga detalye',
  'account.openingBalanceHint': 'Gumamit ng negatibong numero para sa utang',
  'account.saveChanges': 'I-save ang mga pagbabago',
  'account.manage': 'Pamahalaan',
  'account.restore': 'Ibalik ang account',
  'recurring.net': 'Neto',
  'recurring.monthlyNote':
    'Katumbas bawat buwan, pinapantay sa arawan, lingguhan at taunang tuntunin.',
  'recurring.fallbackTitle': 'Umuulit na entry',
  'recurring.createRule': 'Gumawa ng tuntunin',
  'recurring.manageBody': 'Pamahalaan ang umuulit na tuntuning ito',
  'recurring.backfillNote': 'Ang petsang nakalipas ay agad na nababalik.',
  'recurring.label': 'Pangalan',
  'recurring.labelPlaceholder': 'Upa, sahod, streaming…',
  'budgets.edit': 'I-edit ang badyet',
  'budgets.new': 'Bagong badyet',
  'budgets.editorBody': 'Pumili ng kategorya at limitasyon',
  'budgets.pickCategory': 'Pumili muna ng kategorya',
  'budgets.invalidLimit': 'Maglagay ng tamang limitasyon',
  'budgets.limitPositive': 'Maglagay ng limitasyong mas malaki sa zero',
  'budgets.spentThisMonth': 'Gastos ngayong buwan',
  'budgets.limitUsed': '{percent} ng limitasyong ito ang nagamit',
  'budgets.allBudgetsSet': 'May badyet na ang lahat ng kategorya ng gastos.',
  'budgets.saveLimit': 'I-save ang limitasyon',
  'budgets.createBudget': 'Gumawa ng badyet',
  'pin.enterCurrent': 'Ilagay ang kasalukuyang PIN',
  'pin.yourPin': 'Ang iyong {count}-digit na PIN',
  'pin.chooseNew': 'Pumili ng bagong PIN',
  'pin.digits': '{count} digit',
  'pin.confirmNew': 'Kumpirmahin ang bagong PIN',
  'pin.enterOnceMore': 'Ilagay muli',
  'pin.currentIncorrect': 'Mali ang kasalukuyang PIN',
  'error.code': 'Error 404',
  'datePicker.previousMonth': 'Nakaraang buwan',
  'datePicker.nextMonth': 'Susunod na buwan',
  'settings.never': 'Hindi kailanman',
  'settings.minutesShort': '{minutes}m',
  // Linggo, Lunes, Martes, Miyerkules, Huwebes, Biyernes, Sabado. The single
  // letters repeat, as they do in English — position carries the meaning.
  'weekday.0': 'L',
  'weekday.1': 'L',
  'weekday.2': 'M',
  'weekday.3': 'M',
  'weekday.4': 'H',
  'weekday.5': 'B',
  'weekday.6': 'S',

  /* Validation */
  'validation.amountRequired': 'Maglagay ng halaga',
  'validation.amountPositive': 'Maglagay ng halagang mas malaki sa zero',
  'validation.amountInvalid': 'Maglagay ng tamang halaga',
  'validation.max40': 'Panatilihing wala pang 40 karakter',
  'validation.max60': 'Panatilihing wala pang 60 karakter',
  'validation.max200': 'Panatilihing wala pang 200 karakter',
  'validation.accountName': 'Bigyan ng pangalan ang account',
  'validation.openingBalance': 'Maglagay ng panimulang balanse',
  'validation.limitRequired': 'Maglagay ng buwanang limitasyon',
  'validation.limitPositive': 'Maglagay ng limitasyong mas malaki sa zero',
  'frequency.daily': 'Arawan',
  'frequency.weekly': 'Lingguhan',
  'frequency.biweekly': 'Tuwing 2 linggo',
  'frequency.monthly': 'Buwanan',
  'frequency.yearly': 'Taunan',
  'accountKind.checking': 'Cheking',
  'accountKind.savings': 'Impok',
  'accountKind.credit': 'Kredito',
  'accountKind.investment': 'Pamumuhunan',
  'accountKind.cash': 'Perang hawak',
  'theme.system': 'Sistema',
  'theme.light': 'Maliwanag',
  'theme.dark': 'Madilim',

  /* Errors */
  'error.title': 'May naging problema ang Ledger',
  'error.body':
    'Nasa device na ito ang iyong data at hindi naapektuhan. Karaniwang naaayos ito sa pag-reload.',
  'error.reload': 'I-reload',
  'error.notFoundTitle': 'Walang laman ang address na ito',
  'error.notFoundBody': 'Wala ang screen na iyon.',
  'error.goHome': 'Bumalik sa ledger',
};

const DICTIONARIES: Record<Language, Dictionary> = { en, fil };

/**
 * Looks up a key and fills its placeholders.
 *
 * A value containing `|` is a plural pair, singular first, chosen by
 * `params.count`. That covers every plural the app has without pulling in a
 * plural-rule library.
 */
export function translate(language: Language, key: string, params?: TranslationParams): string {
  const template = DICTIONARIES[language][key] ?? DICTIONARIES.en[key] ?? key;

  const branch = template.includes('|')
    ? (template.split('|')[params?.count === 1 ? 0 : 1] ?? template)
    : template;

  if (!params) return branch;

  return branch.replace(/\{(\w+)\}/g, (match, name: string) =>
    params[name] === undefined ? match : String(params[name]),
  );
}
