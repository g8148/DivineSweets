import { StyleSheet, View } from 'react-native';
import { Texto } from '@/components/Texto';
import { cores, espaco } from '@/theme';

export function LinhaResumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={styles.linha}>
      <Texto cor={cores.cinzaEscuro}>{rotulo}</Texto>
      <Texto peso="semibold" cor={cores.vinho} style={styles.valor}>
        {valor}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: espaco.md,
    paddingVertical: espaco.sm,
  },
  valor: { flexShrink: 1, textAlign: 'right' },
});
