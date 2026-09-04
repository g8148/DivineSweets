import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/api/queries';
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
      {/* O TanStack Query é o dono do estado de servidor: cache, revalidação e
          invalidação. O único Context que sobrou é o do rascunho, que é estado
          de tela — o pedido que está sendo montado ainda não existe no
          servidor. */}
      <QueryClientProvider client={queryClient}>
        <RascunhoPedidoProvider>
          {/* Ícones escuros por padrão: as telas sem Cabecalho são claras. O
              Cabecalho monta o seu próprio StatusBar claro sobre o vinho. */}
          <StatusBar style="dark" />
          <Stack
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.branco }}}
          />
        </RascunhoPedidoProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
