import { Pressable, StyleSheet, View } from 'react-native';
import { Texto } from '@/components/Texto';
import { formatarMoeda } from '@divine/shared';
import { cores, espaco, raio } from '@/theme';
import type { Opcao } from '@divine/shared';

type Props = {
  opcoes: Opcao[];
  selecionadaId: string | undefined;
  aoSelecionar: (opcaoId: string) => void;
};

/**
 * Escolha única em linhas de largura total. Os acréscimos ficam todos alinhados
 * na mesma coluna à direita, o que deixa a comparação de preço imediata — era o
 * que se perdia quando as opções eram pílulas de largura variável.
 */
export function ListaOpcoes({ opcoes, selecionadaId, aoSelecionar }: Props) {
  return (
    <View style={styles.lista}>
      {opcoes.map((opcao) => {
        const selecionada = opcao.id === selecionadaId;
        return (
          <Pressable
            key={opcao.id}
            onPress={() => aoSelecionar(opcao.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: selecionada }}
            style={({ pressed }) => [
              styles.linha,
              {
                borderColor: selecionada ? cores.vinho : cores.borda,
                backgroundColor: selecionada ? cores.rosaClaro : cores.branco,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View style={[styles.radio, { borderColor: selecionada ? cores.vinho : cores.cinza }]}>
              {selecionada ? <View style={styles.miolo} /> : null}
            </View>
            <Texto peso={selecionada ? 'semibold' : 'regular'} style={styles.nome}>
              {opcao.nome}
            </Texto>
            {opcao.delta > 0 ? (
              <Texto
                variante="legenda"
                peso="semibold"
                cor={selecionada ? cores.vinho : cores.cinzaEscuro}
              >
                + {formatarMoeda(opcao.delta)}
              </Texto>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { gap: espaco.sm },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    borderWidth: 1,
    borderRadius: raio.md,
    paddingVertical: espaco.md,
    paddingHorizontal: espaco.md,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miolo: { width: 10, height: 10, borderRadius: 5, backgroundColor: cores.vinho },
  nome: { flex: 1 },
});
