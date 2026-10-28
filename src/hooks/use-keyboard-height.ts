import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Height of the on-screen keyboard, in points, or 0 when it is hidden.
 *
 * `KeyboardAvoidingView` is not used anywhere in this app: under edge-to-edge
 * (the SDK 58 default) Android 15 ignores `adjustResize` and never resizes the
 * window, so the component's assumption breaks and whatever sits at the bottom of
 * the layout ends up behind the keyboard. Reading the height directly and padding
 * by it works on both platforms regardless of window behaviour.
 *
 * Shared by `Screen` and `Sheet`, because both own content with a text field in it.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, (event) =>
      setHeight(event.endCoordinates?.height ?? 0),
    );
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}
