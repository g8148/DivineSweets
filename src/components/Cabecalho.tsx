import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Texto } from '@/components/Texto';
import { ChevronLeft } from '@/components/icones';
import { cores, espaco } from '@/theme';

type Props = {
  titulo: string;
  subtitulo?: string;
  comVoltar?: boolean;
  acao?: ReactNode;
};

/**
 * Telas alcançadas por `replace` (a de acompanhamento, vinda da confirmação)
 * ficam na raiz da pilha, e ali `back()` não é atendido por navegador nenhum.
 * A rota `/` reencaminha conforme o perfil, então serve de casa universal.
 */
function voltar() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}

export function Cabecalho({ titulo, subtitulo, comVoltar = false, acao }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.base, { paddingTop: insets.top + espaco.sm }]}>
      <StatusBar style="light" />
      {comVoltar && (
        <Pressable onPress={voltar} hitSlop={12} style={styles.voltar}>
          <ChevronLeft size={24} color={cores.branco} strokeWidth={2} />
        </Pressable>
      )}

      <View style={styles.textos}>
        <Texto variante="subtitulo" peso="bold" cor={cores.branco}>
          {titulo}
        </Texto>
        {subtitulo ? (
          <Texto variante="legenda" cor={cores.rosaCreme}>
            {subtitulo}
          </Texto>
        ) : null}
      </View>

      {acao ? <View style={styles.acao}>{acao}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: cores.vinho,
    paddingHorizontal: espaco.md,
    paddingBottom: espaco.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
  },
  voltar: { paddingRight: espaco.xs },
  textos: { flex: 1 },
  acao: { marginLeft: espaco.sm },
});
