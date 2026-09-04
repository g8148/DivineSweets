import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, SectionList, StyleSheet, View } from 'react-native';
import { useAdminPedidos } from '@/api/admin';
import type { PedidoApi } from '@/api/pedidos';
import { useAuth } from '@/auth/useAuth';
import { Cabecalho } from '@/components/Cabecalho';
import { CardPedido } from '@/components/CardPedido';
import { Chip } from '@/components/Chip';
import { Texto } from '@/components/Texto';
import { Vazio } from '@/components/Vazio';
import { diaDaSemana, formatarData } from '@divine/shared';
import { cores, espaco } from '@/theme';
import type { StatusPedido } from '@divine/shared';

const FILTROS: { id: StatusPedido | 'todos'; rotulo: string }[] = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'recebido', rotulo: 'Recebidos' },
  { id: 'producao', rotulo: 'Em produção' },
  { id: 'pronto', rotulo: 'Prontos' },
  { id: 'entregue', rotulo: 'Entregues' },
];

export default function PainelPedidos() {
  const [filtro, setFiltro] = useState<StatusPedido | 'todos'>('todos');
  // O filtro vai ao servidor: a lista cresce sem limite, e trazer tudo para
  // filtrar no aparelho pesaria justo no dia mais movimentado.
  const { data: pedidos, isPending, isError, refetch, isRefetching } = useAdminPedidos(
    filtro === 'todos' ? undefined : filtro,
  );
  const { sair } = useAuth();

  async function sairDaConta() {
    await sair();
    router.replace('/(auth)/login');
  }

  const ativos = (pedidos ?? []).filter(
    (p) => p.status !== 'entregue' && p.status !== 'recusado',
  ).length;

  // Agrupado por data de entrega: é a pergunta que a confeiteira faz ao abrir o
  // painel — o que precisa sair hoje, e o que sai depois.
  const secoes = useMemo(() => {
    const porData = (pedidos ?? []).reduce<Record<string, PedidoApi[]>>((acc, p) => {
      (acc[p.dataEntrega] ??= []).push(p);
      return acc;
    }, {});

    return Object.keys(porData)
      .sort()
      .map((data) => ({ title: data, data: porData[data] }));
  }, [pedidos]);

  const cabecalho = (
    <Cabecalho
      titulo="Painel de Pedidos"
      subtitulo={isPending ? 'Carregando…' : `${ativos} pedidos ativos`}
      acao={
        <Pressable onPress={sairDaConta} hitSlop={8}>
          <Texto variante="legenda" peso="semibold" cor={cores.branco}>
            Sair
          </Texto>
        </Pressable>
      }
    />
  );

  return (
    <View style={styles.tela}>
      {cabecalho}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtrosScroll}
        contentContainerStyle={styles.filtros}
      >
        {FILTROS.map((f) => (
          <Chip key={f.id} rotulo={f.rotulo} selecionado={filtro === f.id} onPress={() => setFiltro(f.id)} />
        ))}
      </ScrollView>

      {isPending ? (
        <ActivityIndicator color={cores.vinho} style={styles.carregando} />
      ) : isError ? (
        <Vazio
          mensagem="Não foi possível carregar os pedidos. Verifique sua conexão."
          acao={{ rotulo: 'Tentar novamente', aoTocar: () => refetch() }}
        />
      ) : (
        <SectionList
          sections={secoes}
          keyExtractor={(pedido) => pedido.id}
          contentContainerStyle={styles.lista}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderSectionHeader={({ section }) => (
            <Texto peso="semibold" style={styles.secao}>
              {formatarData(section.title)} — {diaDaSemana(section.title)}
            </Texto>
          )}
          renderItem={({ item }) => (
            <CardPedido
              pedido={item}
              mostrarCliente
              onPress={() => router.push(`/(admin)/pedido/${item.id}`)}
            />
          )}
          ListEmptyComponent={<Vazio mensagem="Nenhum pedido neste filtro." />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  filtrosScroll: { flexGrow: 0, flexShrink: 0 },
  filtros: { gap: espaco.sm, padding: espaco.md, alignItems: 'center' },
  carregando: { marginTop: espaco.xl },
  lista: { padding: espaco.md, paddingTop: 0, gap: espaco.md },
  secao: {
    backgroundColor: cores.rosaClaro,
    paddingVertical: espaco.sm,
    paddingHorizontal: espaco.md,
    marginHorizontal: -espaco.md,
  },
});
