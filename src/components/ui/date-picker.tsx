import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Line, Spacing } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import {
  addMonths,
  currentMonthKey,
  daysInMonth,
  firstWeekdayOfMonth,
  formatMonthLong,
  monthKeyOf,
  parseDateOnly,
} from '@/lib/date';
import type { DateOnly, MonthKey } from '@/domain/primitives';
import { ThemedText } from '@/components/themed-text';
import { IconButton } from '@/components/ui/controls';
import { PressableSurface } from '@/components/motion';

const WEEKDAY_KEYS = [
  'weekday.0',
  'weekday.1',
  'weekday.2',
  'weekday.3',
  'weekday.4',
  'weekday.5',
  'weekday.6',
] as const;

/**
 * Inline calendar.
 *
 * Built as a ruled grid rather than a floating picker, so it behaves identically
 * on every platform and can sit inside a form without opening a second surface.
 * The selected day is an inverted cell.
 */
export function DatePicker({
  value,
  onChange,
  maxDate,
}: {
  value: DateOnly;
  onChange: (date: DateOnly) => void;
  maxDate?: DateOnly;
}) {
  const theme = useTheme();
  const haptics = useHaptics();
  const { t } = useTranslation();
  const [visibleMonth, setVisibleMonth] = useState<MonthKey>(monthKeyOf(value));

  const total = daysInMonth(visibleMonth);
  const leading = firstWeekdayOfMonth(visibleMonth);
  const selectedDay = monthKeyOf(value) === visibleMonth ? parseDateOnly(value).getDate() : null;
  const todayKey = currentMonthKey();
  const todayDay = new Date().getDate();
  const canGoForward = visibleMonth < currentMonthKey();

  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: total }, (_, index) => index + 1),
  ];

  return (
    <View style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          accessibilityLabel={t('datePicker.previousMonth')}
          onPress={() => setVisibleMonth(addMonths(visibleMonth, -1))}
        />
        <ThemedText type="label">{formatMonthLong(visibleMonth)}</ThemedText>
        <IconButton
          icon="arrow-forward"
          accessibilityLabel={t('datePicker.nextMonth')}
          onPress={() => canGoForward && setVisibleMonth(addMonths(visibleMonth, 1))}
        />
      </View>

      <View style={[styles.weekdays, { borderTopColor: theme.border }]}>
        {WEEKDAY_KEYS.map((key) => (
          <View key={key} style={styles.cell}>
            <ThemedText type="caption" themeColor="textTertiary">
              {t(key)}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (day === null) {
            return (
              <View
                key={`empty-${index}`}
                style={[styles.cell, styles.gridCell, { borderColor: theme.borderLight }]}
              />
            );
          }

          const date = `${visibleMonth}-${String(day).padStart(2, '0')}` as DateOnly;
          const isSelected = selectedDay === day;
          const isToday = visibleMonth === todayKey && day === todayDay;
          const isDisabled = maxDate !== undefined && date > maxDate;

          return (
            <PressableSurface
              key={date}
              disabled={isDisabled}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: isDisabled }}
              onPress={() => {
                haptics.select();
                onChange(date);
              }}
              style={[
                styles.cell,
                styles.gridCell,
                {
                  borderColor: theme.borderLight,
                  backgroundColor: isSelected ? theme.inverted : 'transparent',
                },
              ]}>
              <ThemedText
                type="amount"
                style={{
                  color: isSelected
                    ? theme.onInverted
                    : isDisabled
                      ? theme.textTertiary
                      : theme.text,
                  textDecorationLine: isToday && !isSelected ? 'underline' : 'none',
                  opacity: isDisabled ? 0.4 : 1,
                }}>
                {String(day).padStart(2, '0')}
              </ThemedText>
            </PressableSurface>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: Line.thin,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.two,
  },
  weekdays: {
    flexDirection: 'row',
    borderTopWidth: Line.thin,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCell: {
    borderRightWidth: Line.hairline,
    borderBottomWidth: Line.hairline,
  },
});
