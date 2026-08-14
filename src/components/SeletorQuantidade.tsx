import { Pressable, StyleSheet, View } from 'react-native';
import { Texto } from '@/components/Texto';
import { Minus, Plus } from '@/components/icones';
import { cores, espaco } from '@/theme';

type Props = {
  valor: number;
  aoMudar: (valor: number) => void;
  min?: number;
  max?: number;
};

export function SeletorQuantidade({ valor, aoMudar, min = 1, max = 20 }: Props) {
  const noMinimo = valor <= min;
  const noMaximo = valor >= max;

  return (
    <View style={styles.linha}>
      <Pressable
        onPress={() => aoMudar(valor - 1)}
        disabled={noMinimo}
        style={[styles.botao, { backgroundColor: noMinimo ? cores.rosaClaro : cores.rosaCreme }]}
      >
        <Minus size={18} color={noMinimo ? cores.cinza : cores.vinho} strokeWidth={2} />
      </Pressable>

      <Texto variante="subtitulo" peso="bold" style={styles.valor}>
        {valor}
      </Texto>

      <Pressable
        onPress={() => aoMudar(valor + 1)}
        disabled={noMaximo}
        style={[styles.botao, { backgroundColor: noMaximo ? cores.rosaClaro : cores.rosaCreme }]}
      >
        <Plus size={18} color={noMaximo ? cores.cinza : cores.vinho} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  botao: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  valor: { minWidth: 32, textAlign: 'center' },
});
