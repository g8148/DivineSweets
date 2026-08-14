import { Stack } from 'expo-router';
import { cores } from '@/theme';

export default function ClienteLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.branco } }} />;
}
