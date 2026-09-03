import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/state/AuthContext';
import { PedidosProvider } from '@/state/PedidosContext';
import { RascunhoPedidoProvider } from '@/state/RascunhoPedidoContext';
import { cores } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontesCarregadas] = useFonts({
    'Montserrat-Regular': require('@/assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-SemiBold': require('@/assets/fonts/Montserrat-SemiBold.ttf'),
    'Montserrat-Bold': require('@/assets/fonts/Montserrat-Bold.ttf'),
  });

  useEffect(() => {
    if (fontesCarregadas) SplashScreen.hideAsync();
  }, [fontesCarregadas]);

  if (!fontesCarregadas) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PedidosProvider>
          <RascunhoPedidoProvider>
            {/* Ícones escuros por padrão: as telas sem Cabecalho são claras. O
                Cabecalho monta o seu próprio StatusBar claro sobre o vinho. */}
            <StatusBar style="dark" />
            <Stack
              screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.branco }}}
            />
          </RascunhoPedidoProvider>
        </PedidosProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
