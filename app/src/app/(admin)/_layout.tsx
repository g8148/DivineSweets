import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/auth/useAuth';
import { cores } from '@/theme';

export default function AdminLayout() {
  const { usuario, carregando } = useAuth();

  if (carregando) return null;
  if (!usuario) return <Redirect href="/(auth)/login" />;
  // A guarda de tela é conforto, não segurança: quem forçasse a rota veria os
  // campos vazios, porque cada endpoint administrativo exige o papel de novo.
  if (usuario.perfil !== 'admin') return <Redirect href="/(cliente)/(tabs)/catalogo" />;

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.branco } }} />;
}
