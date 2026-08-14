import { Stack } from 'expo-router';
import { cores } from '@/theme';

export default function AdminLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.branco } }} />;
}
