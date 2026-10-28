import Ionicons from '@expo/vector-icons/Ionicons';
import { type ComponentProps, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/controls';
import { Sheet } from '@/components/ui/sheet';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Destructive decisions, as their own surface.
 *
 * These replace the platform alert entirely. Three reasons, in order of weight:
 *
 *  1. **An alert cannot show what is being acted on.** "Delete this transaction?"
 *     asks the user to decide without showing them the amount, the merchant or the
 *     date. A sheet can, so the decision is made on facts rather than on memory.
 *  2. **`Alert` does not exist on the web target.** React Native Web ships it as
 *     `static alert() {}`, so every confirmation in the app silently did nothing
 *     there. A sheet is the app's own component and behaves the same everywhere.
 *  3. **It is the system's own language.** The alert was the one surface in the
 *     app that did not look like the app — a platform box with platform buttons,
 *     over a design built on arches, pills and paper.
 */

export interface ConfirmSheetProps {
  visible: boolean;
  onClose: () => void;
  /** The action, phrased as a verb: "Delete transaction". */
  title: string;
  /** What happens, and whether it can be undone. */
  body: string;
  /**
   * The thing being acted on, rendered so the decision is made on facts. A row,
   * a card, a summary — whatever the caller needs.
   */
  detail?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}

export function ConfirmSheet({
  visible,
  onClose,
  title,
  body,
  detail,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
}: ConfirmSheetProps) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={title}
      footer={
        <View style={styles.footer}>
          <Button
            title={confirmLabel}
            variant={destructive ? 'destructive' : 'primary'}
            onPress={() => {
              onClose();
              onConfirm();
            }}
          />
          <Button title={cancelLabel} variant="ghost" onPress={onClose} />
        </View>
      }>
      <View style={styles.body}>
        {detail ? (
          <View style={styles.detail} pointerEvents="none">
            {detail}
          </View>
        ) : null}
        <ThemedText type="body" themeColor="textSecondary">
          {body}
        </ThemedText>
      </View>
    </Sheet>
  );
}

export interface ActionSheetAction {
  label: string;
  icon?: IoniconName;
  destructive?: boolean;
  onPress: () => void;
}

/**
 * A short menu of actions on one record.
 *
 * Rows rather than buttons, because these are choices about a record rather than
 * a commit — the destructive one is the only thing here that acts immediately, and
 * it opens its own confirmation.
 */
export function ActionSheet({
  visible,
  onClose,
  title,
  subtitle,
  actions,
  cancelLabel,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  actions: readonly ActionSheetAction[];
  cancelLabel: string;
}) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      footer={<Button title={cancelLabel} variant="ghost" onPress={onClose} />}>
      <View style={styles.actions}>
        {actions.map((action) => (
          <Button
            key={action.label}
            title={action.label}
            icon={action.icon}
            variant={action.destructive ? 'destructive' : 'secondary'}
            onPress={() => {
              onClose();
              action.onPress();
            }}
            style={styles.action}
          />
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: Spacing.four,
  },
  detail: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  footer: {
    gap: Spacing.two,
  },
  actions: {
    gap: Spacing.two,
  },
  action: {
    justifyContent: 'flex-start',
  },
});
