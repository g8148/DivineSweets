import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Cabecalho } from '@/components/Cabecalho';
import { Cartao } from '@/components/Cartao';
import { Texto } from '@/components/Texto';
import { Vazio } from '@/components/Vazio';
import { CirclePlus, SquarePen, Trash2 } from '@/components/icones';
import { formatarMoeda } from '@/data/format';
import { categorias } from '@/data/produtos';
import { usePedidos } from '@/state/PedidosContext';
import { cores, espaco, raio } from '@/theme';
import type { Produto } from '@/types';

export default function CatalogoAdmin() {
  const { produtosAdmin, removerProduto } = usePedidos();

  function confirmarRemocao(produto: Produto) {
    Alert.alert('Remover produto', `Tem certeza que deseja remover ${produto.nome} do catálogo?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removerProduto(produto.id) },
    ]);
  }

  return (
    <View style={styles.tela}>
      <Cabecalho
        titulo="Catálogo"
        subtitulo={`${produtosAdmin.length} produtos`}
        acao={
          <Pressable onPress={() => router.push('/(admin)/produto/novo')} hitSlop={8}>
            <CirclePlus size={24} color={cores.branco} strokeWidth={2} />
          </Pressable>
        }
      />

      <FlatList
        data={produtosAdmin}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={<Vazio mensagem="Nenhum produto no catálogo." />}
        renderItem={({ item }) => (
          <Cartao style={styles.linha}>
            <Image source={item.imagem} style={styles.miniatura} contentFit="cover" />

            <View style={styles.dados}>
              <Texto peso="semibold" numberOfLines={1}>
                {item.nome}
              </Texto>
              <Texto variante="legenda" cor={cores.cinzaEscuro}>
                {categorias.find((c) => c.id === item.categoria)?.nome} · {formatarMoeda(item.precoBase)}
              </Texto>
            </View>

            <Pressable onPress={() => router.push(`/(admin)/produto/${item.id}`)} hitSlop={8}>
              <SquarePen size={20} color={cores.vinho} strokeWidth={2} />
            </Pressable>
            <Pressable onPress={() => confirmarRemocao(item)} hitSlop={8}>
              <Trash2 size={20} color={cores.alertaTexto} strokeWidth={2} />
            </Pressable>
          </Cartao>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  lista: { padding: espaco.md, gap: espaco.md },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, padding: espaco.md },
  miniatura: { width: 56, height: 56, borderRadius: raio.md },
  dados: { flex: 1 },
});
