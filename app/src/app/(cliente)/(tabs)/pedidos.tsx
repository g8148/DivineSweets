import { useMemo } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, SectionList, StyleSheet, View } from 'react-native';
import { useMeusPedidos } from '@/api/pedidos';
import { Cabecalho } from '@/components/Cabecalho';
import { CardPedido } from '@/components/CardPedido';
import { Texto } from '@/components/Texto';
import { Vazio } from '@/components/Vazio';
import { cores, espaco } from '@/theme';
import type { StatusPedido } from '@divine/shared';

const EM_ANDAMENTO: StatusPedido[] = ['recebido', 'producao', 'pronto'];

export default function MeusPedidos() {
  // A lista já vem só com os pedidos de quem está logado: o filtro é do SQL,
  // pelo dono da sessão. Comparar nomes no aparelho, como fazia o protótipo,
  // misturaria os pedidos de dois clientes homônimos.
  const { data: pedidos, isPending, isError, refetch, isRefetching } = useMeusPedidos();

  const secoes = useMemo(() => {
    const todos = pedidos ?? [];
    return [
      { title: 'Em andamento', data: todos.filter((p) => EM_ANDAMENTO.includes(p.status)) },
      { title: 'Histórico', data: todos.filter((p) => !EM_ANDAMENTO.includes(p.status)) },
    ].filter((secao) => secao.data.length > 0);
  }, [pedidos]);

  if (isPending) {
    return (
      <View style={styles.tela}>
        <Cabecalho titulo="Meus Pedidos" />
        <ActivityIndicator color={cores.vinho} style={styles.carregando} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.tela}>
        <Cabecalho titulo="Meus Pedidos" />
        <Vazio
          mensagem="Não foi possível carregar seus pedidos. Verifique sua conexão."
          acao={{ rotulo: 'Tentar novamente', aoTocar: () => refetch() }}
        />
      </View>
    );
  }

  return (
    <View style={styles.tela}>
      <Cabecalho titulo="Meus Pedidos" />

      <SectionList
        sections={secoes}
        keyExtractor={(pedido) => pedido.id}
        contentContainerStyle={styles.lista}
        // Puxar para atualizar é como o cliente confere se o status andou: quem
        // muda o pedido é a confeiteira, do outro lado.
        refreshing={isRefetching}
        onRefresh={refetch}
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
  carregando: { marginTop: espaco.xl },
  lista: { padding: espaco.md, gap: espaco.md },
  secao: {
    backgroundColor: cores.rosaClaro,
    paddingVertical: espaco.sm,
    paddingHorizontal: espaco.md,
    marginHorizontal: -espaco.md,
  },
});
