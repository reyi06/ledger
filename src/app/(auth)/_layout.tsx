import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: 'unlock',
};

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }} />;
}
