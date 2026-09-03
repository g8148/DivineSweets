import { useMemo } from 'react';
import { router } from 'expo-router';
import { SectionList, StyleSheet, View } from 'react-native';
import { Cabecalho } from '@/components/Cabecalho';
import { CardPedido } from '@/components/CardPedido';
import { Texto } from '@/components/Texto';
import { Vazio } from '@/components/Vazio';
import { useAuth } from '@/state/AuthContext';
import { usePedidos } from '@/state/PedidosContext';
import { cores, espaco } from '@/theme';
import type { Pedido } from '@divine/shared';

const EM_ANDAMENTO: Pedido['status'][] = ['recebido', 'producao', 'pronto'];

export default function MeusPedidos() {
  const { pedidos } = usePedidos();
  const { usuario } = useAuth();

  const secoes = useMemo(() => {
    const meus = pedidos.filter((p) => p.clienteNome === usuario?.nome);
    const andamento = meus.filter((p) => EM_ANDAMENTO.includes(p.status));
    const historico = meus.filter((p) => !EM_ANDAMENTO.includes(p.status));

    return [
      { title: 'Em andamento', data: andamento },
      { title: 'Histórico', data: historico },
    ].filter((secao) => secao.data.length > 0);
  }, [pedidos, usuario]);

  return (
    <View style={styles.tela}>
      <Cabecalho titulo="Meus Pedidos" />

      <SectionList
        sections={secoes}
        keyExtractor={(pedido) => pedido.id}
        contentContainerStyle={styles.lista}
        renderSectionHeader={({ section }) => (
          <Texto peso="semibold" style={styles.secao}>
            {section.title}
          </Texto>
        )}
        renderItem={({ item }) => (
          <CardPedido pedido={item} onPress={() => router.push(`/(cliente)/pedido/${item.id}`)} />
        )}
        ListEmptyComponent={
          <Vazio mensagem="Você ainda não fez nenhum pedido. Que tal escolher um doce?" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  lista: { padding: espaco.md, gap: espaco.md },
  secao: {
    backgroundColor: cores.rosaClaro,
    paddingVertical: espaco.sm,
    paddingHorizontal: espaco.md,
    marginHorizontal: -espaco.md,
  },
});
