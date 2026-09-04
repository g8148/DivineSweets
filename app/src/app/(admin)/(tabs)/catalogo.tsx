import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useAdminProdutos, useDesativarProduto, useSalvarProduto } from '@/api/admin';
import { montarUrl } from '@/api/client';
import type { ProdutoApi } from '@/api/produtos';
import { Cabecalho } from '@/components/Cabecalho';
import { Cartao } from '@/components/Cartao';
import { Texto } from '@/components/Texto';
import { Vazio } from '@/components/Vazio';
import { CirclePlus, SquarePen, Trash2 } from '@/components/icones';
import { categorias, formatarMoeda } from '@divine/shared';
import { cores, espaco, raio } from '@/theme';

export default function CatalogoAdmin() {
  const { data: produtos, isPending, isError, refetch, isRefetching } = useAdminProdutos();
  const desativar = useDesativarProduto();
  const salvar = useSalvarProduto();

  function confirmarDesativacao(produto: ProdutoApi) {
    Alert.alert(
      'Tirar do catálogo',
      // O texto diz o que de fato acontece. "Remover" faria a confeiteira achar
      // que o histórico de pedidos daquele doce sumiria junto.
      `${produto.nome} deixa de aparecer para os clientes. Os pedidos antigos continuam no histórico, e você pode reativá-lo depois.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tirar do catálogo', style: 'destructive', onPress: () => desativar.mutate(produto.id) },
      ],
    );
  }

  const ativos = (produtos ?? []).filter((p) => p.ativo).length;

  return (
    <View style={styles.tela}>
      <Cabecalho
        titulo="Catálogo"
        subtitulo={isPending ? 'Carregando…' : `${ativos} à venda de ${produtos?.length ?? 0}`}
        acao={
          <Pressable onPress={() => router.push('/(admin)/produto/novo')} hitSlop={8}>
            <CirclePlus size={24} color={cores.branco} strokeWidth={2} />
          </Pressable>
        }
      />

      {isPending ? (
        <ActivityIndicator color={cores.vinho} style={styles.carregando} />
      ) : isError ? (
        <Vazio
          mensagem="Não foi possível carregar o catálogo."
          acao={{ rotulo: 'Tentar novamente', aoTocar: () => refetch() }}
        />
      ) : (
        <FlatList
          data={produtos}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.lista}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={<Vazio mensagem="Nenhum produto no catálogo." />}
          renderItem={({ item }) => (
            <Cartao style={item.ativo ? styles.linha : styles.linhaInativa}>
              <Image
                source={
                  item.imagemUrl ? { uri: montarUrl(item.imagemUrl) } : require('@/assets/logomarca.jpg')
                }
                style={styles.miniatura}
                contentFit="cover"
              />

              <View style={styles.dados}>
                <Texto peso="semibold" numberOfLines={1}>
                  {item.nome}
                </Texto>
                <Texto variante="legenda" cor={cores.cinzaEscuro}>
                  {categorias.find((c) => c.id === item.categoria)?.nome} · {formatarMoeda(item.precoBase)}
                  {item.ativo ? '' : ' · fora do catálogo'}
                </Texto>
              </View>

              <Pressable onPress={() => router.push(`/(admin)/produto/${item.id}`)} hitSlop={8}>
                <SquarePen size={20} color={cores.vinho} strokeWidth={2} />
              </Pressable>

              {item.ativo ? (
                <Pressable onPress={() => confirmarDesativacao(item)} hitSlop={8}>
                  <Trash2 size={20} color={cores.alertaTexto} strokeWidth={2} />
                </Pressable>
              ) : (
                // Sem este atalho, tirar um produto do catálogo seria uma porta
                // de mão única pela interface.
                <Pressable
                  onPress={() => salvar.mutate({ id: item.id, dados: { ativo: true } })}
                  hitSlop={8}
                >
                  <Texto variante="legenda" peso="semibold" cor={cores.vinhoClaro}>
                    Reativar
                  </Texto>
                </Pressable>
              )}
            </Cartao>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  carregando: { marginTop: espaco.xl },
  lista: { padding: espaco.md, gap: espaco.md },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, padding: espaco.md },
  // Produto fora do catálogo aparece esmaecido: continua editável, mas não é o
  // que a confeiteira está vendendo hoje.
  linhaInativa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    padding: espaco.md,
    opacity: 0.55,
  },
  miniatura: { width: 56, height: 56, borderRadius: raio.md },
  dados: { flex: 1 },
});
