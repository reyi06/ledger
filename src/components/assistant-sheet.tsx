import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import {
  answerQuery,
  SUGGESTED_QUESTIONS,
  type AssistantAnswer,
  type AssistantContext,
} from '@/domain/assistant';
import { currentMonthKey, today } from '@/lib/date';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import {
  useAccounts,
  useBudgets,
  useMoney,
  useOverview,
  useRecurringRules,
  useTransactions,
} from '@/store/hooks';
import { ThemedText } from '@/components/themed-text';
import { PressableSurface, Reveal } from '@/components/motion';
import { IconButton } from '@/components/ui/controls';
import { TextField } from '@/components/ui/inputs';
import { Sheet } from '@/components/ui/sheet';

type ChatMessage =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; answer: AssistantAnswer | null };

/**
 * How long the reply takes to arrive.
 *
 * The figure is already computed when this timer starts — nothing is being waited
 * on. It exists because an answer that appears in the same frame as the question
 * reads as a lookup table, while a brief beat plus a fade-up reads as a reply. It
 * is presentation, and it is deliberately short enough not to waste anyone's time.
 */
const REPLY_BEAT_MS = 380;

/**
 * The assistant, as a chat.
 *
 * The transcript is the whole state: a question goes in, an answer comes back, and
 * both stay on screen so a follow-up has something to refer to. Nothing is
 * remembered between questions beyond what you can see.
 *
 * Every figure comes from `src/domain/assistant.ts`, which is deterministic: the
 * same question always produces the same number, computed from the ledger on the
 * device. Each answer leads with the parse it understood — "Dining out" — so a
 * misreading is visible rather than buried behind a wrong number.
 *
 * The suggested questions sit on a rail directly above the composer rather than
 * inside the thread. They are an affordance, not a message: keeping them out of
 * the transcript means they cannot be mistaken for something the assistant said,
 * they stay reachable once the thread has scrolled, and the range of what the
 * assistant can answer is always on screen.
 */
export function AssistantSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();

  const transactions = useTransactions();
  const budgets = useBudgets();
  const recurring = useRecurringRules();
  const accounts = useAccounts();
  const overview = useOverview(currentMonthKey());
  const { format } = useMoney();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);

  const nextId = useRef(0);
  const reply = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thread = useRef<ComponentRef<typeof ScrollView>>(null);

  // A reply in flight when the sheet closes would set state on a gone component.
  useEffect(
    () => () => {
      if (reply.current) clearTimeout(reply.current);
    },
    [],
  );

  const takeId = () => {
    nextId.current += 1;
    return nextId.current;
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    const context: AssistantContext = {
      transactions,
      budgets,
      recurring,
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
        balance: overview.accountBalanceOf(account),
      })),
      today: today(),
    };

    const answer = answerQuery(trimmed, context, (value, options) => format(value, options));

    setMessages((current) => [...current, { id: takeId(), role: 'user', text: trimmed }]);
    setDraft('');
    setThinking(true);

    reply.current = setTimeout(() => {
      setMessages((current) => [...current, { id: takeId(), role: 'assistant', answer }]);
      setThinking(false);
    }, REPLY_BEAT_MS);
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('assistant.title')}
      subtitle={t('assistant.subtitle')}>
      <View style={styles.body}>
        <ScrollView
          ref={thread}
          style={{ maxHeight: Math.round(windowHeight * 0.42) }}
          contentContainerStyle={styles.thread}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => thread.current?.scrollToEnd({ animated: true })}>
          {messages.length === 0 ? (
            <Reveal>
              <View style={[styles.intro, { backgroundColor: theme.tintMuted }]}>
                <ThemedText type="subtitle">{t('assistant.introTitle')}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('assistant.introBody')}
                </ThemedText>
              </View>
            </Reveal>
          ) : null}

          {messages.map((message) =>
            message.role === 'user' ? (
              <Reveal key={message.id} distance={10}>
                <View style={[styles.question, { backgroundColor: theme.tint }]}>
                  <ThemedText type="small" style={{ color: theme.onTint }}>
                    {message.text}
                  </ThemedText>
                </View>
              </Reveal>
            ) : (
              <Reveal key={message.id} distance={10}>
                {message.answer ? (
                  <View style={[styles.answer, { backgroundColor: theme.surfaceAlt }]}>
                    <View style={[styles.scope, { backgroundColor: theme.tintMuted }]}>
                      <ThemedText type="label" style={{ color: theme.sageText }}>
                        {message.answer.scope}
                      </ThemedText>
                    </View>

                    <ThemedText type="title" style={styles.figure}>
                      {message.answer.headline}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {message.answer.detail}
                    </ThemedText>

                    {message.answer.rows.length > 0 ? (
                      <View style={styles.rows}>
                        {message.answer.rows.map((row) => (
                          <View key={row.label} style={styles.row}>
                            <ThemedText
                              type="small"
                              themeColor="textSecondary"
                              numberOfLines={1}
                              style={styles.rowLabel}>
                              {row.label}
                            </ThemedText>
                            {row.value ? (
                              <ThemedText type="amount">{row.value}</ThemedText>
                            ) : null}
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={[styles.answer, { backgroundColor: theme.surfaceAlt }]}>
                    <ThemedText type="subtitle">{t('assistant.notUnderstood')}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('assistant.notUnderstoodBody')}
                    </ThemedText>
                  </View>
                )}
              </Reveal>
            ),
          )}

          {thinking ? (
            <View style={[styles.answer, styles.thinking, { backgroundColor: theme.surfaceAlt }]}>
              <Thinking />
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}
            keyboardShouldPersistTaps="handled">
            {SUGGESTED_QUESTIONS.map((question) => (
              <PressableSurface
                key={question.query}
                onPress={() => send(question.query)}
                accessibilityRole="button"
                style={[styles.chip, { backgroundColor: theme.tintMuted }]}>
                <ThemedText type="small" style={{ color: theme.sageText }} numberOfLines={1}>
                  {t(question.labelKey)}
                </ThemedText>
              </PressableSurface>
            ))}
          </ScrollView>

          <View style={styles.composer}>
            <View style={styles.field}>
              <TextField
                value={draft}
                onChangeText={setDraft}
                placeholder={t('assistant.placeholder')}
                autoCorrect={false}
                returnKeyType="send"
                onSubmitEditing={() => send(draft)}
              />
            </View>

            <IconButton
              icon="arrow-up"
              accessibilityLabel={t('assistant.send')}
              inverted
              onPress={() => send(draft)}
            />
          </View>
        </View>
      </View>
    </Sheet>
  );
}

/** Three dots, peaking in sequence — the beat before a reply lands. */
function Thinking() {
  const theme = useTheme();
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 900,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: Platform.OS !== 'web',
      }),
    );

    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ranges: readonly number[][] = [
    [0.35, 1, 0.35, 0.35],
    [0.35, 0.35, 1, 0.35],
    [0.35, 0.35, 0.35, 1],
  ];

  return (
    <View style={styles.dots}>
      {ranges.map((outputRange, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: theme.sageText,
              opacity: pulse.interpolate({
                inputRange: [0, 0.33, 0.66, 1],
                outputRange,
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: Spacing.three,
  },
  thread: {
    gap: Spacing.three,
    paddingBottom: Spacing.one,
  },
  intro: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.lg,
  },
  question: {
    alignSelf: 'flex-end',
    maxWidth: '86%',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.lg,
  },
  answer: {
    alignSelf: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.lg,
  },
  scope: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    marginBottom: Spacing.one,
  },
  figure: {
    marginBottom: Spacing.half,
  },
  rows: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowLabel: {
    flexShrink: 1,
  },
  thinking: {
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.five,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: Radius.pill,
  },
  footer: {
    gap: Spacing.two,
  },
  /** Bleeds to the sheet's edges so the rail reads as scrollable. */
  rail: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.one,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  field: {
    flex: 1,
  },
});
