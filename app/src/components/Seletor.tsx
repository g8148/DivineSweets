import { Pressable, StyleSheet, View } from 'react-native';
import { Texto } from '@/components/Texto';
import { Check } from '@/components/icones';
import { cores, espaco, raio } from '@/theme';

// O `id` é o parâmetro de tipo, e não `string`: assim o seletor de forma de
// entrega devolve `TipoEntrega` e o de categoria devolve `Categoria`, sem
// nenhum `as` na tela.
export type ItemDeSelecao<T extends string = string> = {
  id: T;
  rotulo: string;
  /** Texto alinhado à direita: um acréscimo de preço, um "obrigatório". */
  detalhe?: string;
};

type PropsUnica<T extends string> = {
  itens: readonly ItemDeSelecao<T>[];
  selecionadoId: T | undefined;
  aoSelecionar: (id: T) => void;
};

type PropsMultipla<T extends string> = {
  itens: readonly ItemDeSelecao<T>[];
  selecionadosIds: readonly T[];
  aoAlternar: (id: T) => void;
};

/**
 * Escolha única em linhas de largura total.
 *
 * Ocupa mais altura do que as pílulas que havia antes, e é o que se ganha: o
 * rótulo tem a linha inteira e não quebra, os detalhes ficam todos alinhados na
 * mesma coluna à direita — o que torna a comparação imediata — e a marca de
 * seleção é um rádio, e não só uma mudança de cor de fundo.
 *
 * Vale para o que a pessoa escolhe *para guardar*. Filtro que fica em cima de
 * uma lista continua sendo pílula em fila horizontal: em coluna, os filtros
 * empurrariam para fora da tela justamente a lista que eles filtram.
 */
export function Seletor<T extends string>({ itens, selecionadoId, aoSelecionar }: PropsUnica<T>) {
  return (
    <View style={styles.lista}>
      {itens.map((item) => (
        <Linha
          key={item.id}
          item={item}
          selecionado={item.id === selecionadoId}
          papel="radio"
          onPress={() => aoSelecionar(item.id)}
        />
      ))}
    </View>
  );
}

/** O mesmo desenho para escolher vários — a marca é um quadrado com visto. */
export function SeletorMultiplo<T extends string>({
  itens,
  selecionadosIds,
  aoAlternar,
}: PropsMultipla<T>) {
  return (
    <View style={styles.lista}>
      {itens.map((item) => (
        <Linha
          key={item.id}
          item={item}
          selecionado={selecionadosIds.includes(item.id)}
          papel="checkbox"
          onPress={() => aoAlternar(item.id)}
        />
      ))}
    </View>
  );
}

function Linha({
  item,
  selecionado,
  papel,
  onPress,
}: {
  item: ItemDeSelecao;
  selecionado: boolean;
  papel: 'radio' | 'checkbox';
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={papel}
      accessibilityState={{ selected: selecionado, checked: selecionado }}
      style={({ pressed }) => [
        styles.linha,
        {
          borderColor: selecionado ? cores.vinho : cores.borda,
          backgroundColor: selecionado ? cores.rosaClaro : cores.branco,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.marca,
          papel === 'radio' ? styles.marcaRedonda : styles.marcaQuadrada,
          {
            borderColor: selecionado ? cores.vinho : cores.cinza,
            backgroundColor: selecionado && papel === 'checkbox' ? cores.vinho : 'transparent',
          },
        ]}
      >
        {selecionado ? (
          papel === 'radio' ? (
            <View style={styles.miolo} />
          ) : (
            <Check size={14} color={cores.branco} strokeWidth={3} />
          )
        ) : null}
      </View>

      <Texto peso={selecionado ? 'semibold' : 'regular'} style={styles.rotulo}>
        {item.rotulo}
      </Texto>

      {item.detalhe ? (
        <Texto
          variante="legenda"
          peso="semibold"
          cor={selecionado ? cores.vinho : cores.cinzaEscuro}
        >
          {item.detalhe}
        </Texto>
      ) : null}
    </Pressable>
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
  marca: { width: 20, height: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  marcaRedonda: { borderRadius: 10 },
  marcaQuadrada: { borderRadius: raio.sm / 2 },
  miolo: { width: 10, height: 10, borderRadius: 5, backgroundColor: cores.vinho },
  rotulo: { flex: 1 },
});
