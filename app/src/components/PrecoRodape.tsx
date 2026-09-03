import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '@/components/Botao';
import { Texto } from '@/components/Texto';
import { formatarMoeda } from '@divine/shared';
import { cores, espaco } from '@/theme';

type Props = {
  valor: number;
  rotuloBotao: string;
  aoPressionar: () => void;
  desabilitado?: boolean;
};

export function PrecoRodape({ valor, rotuloBotao, aoPressionar, desabilitado = false }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.base, { paddingBottom: espaco.md + insets.bottom }]}>
      <View>
        <Texto variante="legenda" cor={cores.cinzaEscuro}>
          Total
        </Texto>
        <Texto variante="preco" peso="bold" cor={cores.vinho}>
          {formatarMoeda(valor)}
        </Texto>
      </View>

      <Botao titulo={rotuloBotao} onPress={aoPressionar} desabilitado={desabilitado} style={styles.botao} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaco.md,
    backgroundColor: cores.branco,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    padding: espaco.md,
  },
  botao: { flexShrink: 1 },
});
