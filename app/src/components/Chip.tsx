import { Pressable, StyleSheet } from 'react-native';
import { Texto } from '@/components/Texto';
import { cores, espaco, raio } from '@/theme';

type Props = {
  rotulo: string;
  selecionado: boolean;
  onPress: () => void;
  detalhe?: string;
  desabilitado?: boolean;
};

export function Chip({ rotulo, selecionado, onPress, detalhe, desabilitado = false }: Props) {
  const fundo = desabilitado ? cores.rosaClaro : selecionado ? cores.vinho : cores.rosaCreme;
  const corTexto = desabilitado ? cores.cinza : selecionado ? cores.branco : cores.vinho;

  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: fundo, borderColor: selecionado ? cores.vinho : cores.borda, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Texto variante="corpo" peso={selecionado ? 'semibold' : 'regular'} cor={corTexto}>
        {rotulo}
      </Texto>
      {detalhe ? (
        <Texto variante="legenda" cor={corTexto} style={styles.detalhe}>
          {detalhe}
        </Texto>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: raio.pill,
    paddingVertical: espaco.sm,
    paddingHorizontal: espaco.md,
    alignItems: 'center',
  },
  detalhe: { opacity: 0.8, marginTop: 2 },
});
