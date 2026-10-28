import Ionicons from '@expo/vector-icons/Ionicons';
import { type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { ACCOUNT_KIND_LABELS, type Account } from '@/domain/models';
import type { Cents } from '@/domain/money';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { AmountText } from '@/components/ui/amount-text';
import { ListRow } from '@/components/ui/list-row';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** Account kinds are told apart by glyph, not by hue. */
export const KIND_ICONS: Record<Account['kind'], IoniconName> = {
  checking: 'card-outline',
  savings: 'wallet-outline',
  credit: 'albums-outline',
  investment: 'trending-up-outline',
  cash: 'cash-outline',
};

/** Account row with its live balance. */
export function AccountRow({
  account,
  balance,
  onPress,
  onLongPress,
  showDivider = true,
}: {
  account: Account;
  balance: Cents;
  onPress?: () => void;
  onLongPress?: () => void;
  showDivider?: boolean;
}) {
  const { t } = useTranslation();
  const subtitle = [t(ACCOUNT_KIND_LABELS[account.kind]), account.institution]
    .filter(Boolean)
    .join(' · ');

  return (
    <ListRow
      showDivider={showDivider}
      leading={<KindMark kind={account.kind} />}
      title={account.name}
      subtitle={account.archived ? `${subtitle} · Archived` : subtitle}
      trailing={<AmountText value={balance} type="amount" />}
      onPress={onPress}
      onLongPress={onLongPress}
    />
  );
}

/**
 * Soft pale disc holding the account's outlined glyph — the brief's icon
 * treatment, rather than the ruled square it used to be.
 */
export function KindMark({ kind, size = 40 }: { kind: Account['kind']; size?: number }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          backgroundColor: theme.tintMuted,
        },
      ]}>
      <Ionicons
        name={KIND_ICONS[kind]}
        size={Math.round(size * 0.46)}
        color={theme.sageText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
