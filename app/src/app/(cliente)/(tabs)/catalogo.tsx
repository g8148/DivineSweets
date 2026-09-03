import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Cabecalho } from '@/components/Cabecalho';
import { CardProduto } from '@/components/CardProduto';
import { Chip } from '@/components/Chip';
import { Vazio } from '@/components/Vazio';
import { Search } from '@/components/icones';
import { categorias } from '@divine/shared';
import { usePedidos } from '@/state/PedidosContext';
import { cores, espaco, fonte, raio, tamanhoFonte } from '@/theme';

const normalizar = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function Catalogo() {
  const { produtosAdmin } = usePedidos();
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todos');

  const filtrados = useMemo(
    () =>
      produtosAdmin.filter((p) => {
        const casaCategoria = categoriaAtiva === 'todos' || p.categoria === categoriaAtiva;
        const casaBusca = normalizar(p.nome).includes(normalizar(busca.trim()));
        return casaCategoria && casaBusca;
      }),
    [produtosAdmin, categoriaAtiva, busca],
  );

  return (
    <View style={styles.tela}>
      <Cabecalho titulo="Divine Sweets" subtitulo="Doceria Afetiva" />

      <View style={styles.busca}>
        <Search size={20} color={cores.cinzaEscuro} strokeWidth={2} />
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar doce..."
          placeholderTextColor={cores.cinza}
          style={styles.buscaInput}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriasScroll}
        contentContainerStyle={styles.categorias}
      >
        <Chip rotulo="Todos" selecionado={categoriaAtiva === 'todos'} onPress={() => setCategoriaAtiva('todos')} />
        {categorias.map((categoria) => (
          <Chip
            key={categoria.id}
            rotulo={categoria.nome}
            selecionado={categoriaAtiva === categoria.id}
            onPress={() => setCategoriaAtiva(categoria.id)}
          />
        ))}
      </ScrollView>

      <FlatList
        data={filtrados}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.coluna}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <CardProduto produto={item} onPress={() => router.push(`/(cliente)/produto/${item.id}`)} />
        )}
        ListEmptyComponent={<Vazio mensagem="Nenhum doce encontrado com esse nome." />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    backgroundColor: cores.rosaClaro,
    borderRadius: raio.pill,
    paddingHorizontal: espaco.md,
    marginHorizontal: espaco.md,
    marginTop: espaco.md,
  },
  buscaInput: {
    flex: 1,
    paddingVertical: espaco.sm + 2,
    fontFamily: fonte.regular,
    fontSize: tamanhoFonte.corpo,
    color: cores.vinho,
  },
  // Sem flexGrow/flexShrink zerados, a faixa horizontal é comprimida pela lista
  // abaixo e os rótulos dos chips ficam cortados.
  categoriasScroll: { flexGrow: 0, flexShrink: 0 },
  categorias: { gap: espaco.sm, paddingHorizontal: espaco.md, paddingVertical: espaco.md, alignItems: 'center' },
  coluna: { gap: espaco.md },
  lista: { padding: espaco.md, paddingTop: 0, gap: espaco.md },
});
