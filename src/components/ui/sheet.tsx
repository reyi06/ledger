import { type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Elevation, Radius, Spacing } from '@/constants/theme';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { IconButton } from '@/components/ui/controls';

/**
 * Bottom sheet.
 *
 * The detail behind a summary row. Rounded at the crown and lifted on the
 * system's largest shadow, and it slides rather than appearing instantly — this
 * is the one place the old system's binary motion was most likely to feel abrupt.
 */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.overlay }]}
          onPress={onClose}
          accessibilityLabel="Close"
          accessibilityRole="button"
        />

        <View
          style={[
            styles.sheet,
            Elevation.xl,
            {
              backgroundColor: theme.backgroundElement,
              paddingBottom: insets.bottom + Spacing.four + keyboardHeight,
            },
          ]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <ThemedText type="subtitle">{title}</ThemedText>
              {subtitle ? (
                <ThemedText type="caption" themeColor="textSecondary">
                  {subtitle}
                </ThemedText>
              ) : null}
            </View>
            <IconButton icon="close" accessibilityLabel="Close" onPress={onClose} />
          </View>

          <View style={styles.body}>{children}</View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.four,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: Spacing.two,
  },
  body: {
    paddingTop: Spacing.two,
  },
  footer: {
    paddingTop: Spacing.four,
    gap: Spacing.two,
  },
});
