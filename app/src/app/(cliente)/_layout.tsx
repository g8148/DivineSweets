import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/auth/useAuth';
import { cores } from '@/theme';

export default function ClienteLayout() {
  const { usuario, carregando } = useAuth();

  // A guarda é aqui, no layout do grupo, e não em cada tela: assim uma tela
  // nova nasce protegida sem que ninguém precise lembrar de protegê-la.
  if (carregando) return null;
  if (!usuario) return <Redirect href="/(auth)/login" />;

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.branco } }} />;
}
