import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { montarUrl } from '@/api/client';
import { useProduto } from '@/api/produtos';
import { Botao } from '@/components/Botao';
import { Cabecalho } from '@/components/Cabecalho';
import { Texto } from '@/components/Texto';
import { Vazio } from '@/components/Vazio';
import { categorias, formatarMoeda } from '@divine/shared';
import { useRascunho } from '@/state/RascunhoPedidoContext';
import { cores, espaco } from '@/theme';

export default function DetalheProduto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: produto, isPending, isError, refetch } = useProduto(id);
  const { iniciar } = useRascunho();
  const insets = useSafeAreaInsets();

  if (isPending) {
    return (
      <View style={styles.tela}>
        <Cabecalho titulo="Produto" comVoltar />
        <ActivityIndicator color={cores.vinho} style={styles.carregando} />
      </View>
    );
  }

  if (isError || !produto) {
    return (
      <View style={styles.tela}>
        <Cabecalho titulo="Produto" comVoltar />
        <Vazio
          mensagem="Não foi possível carregar este doce."
          acao={{ rotulo: 'Tentar novamente', aoTocar: () => refetch() }}
        />
      </View>
    );
  }

  const nomeCategoria = categorias.find((c) => c.id === produto.categoria)?.nome ?? '';

  function aoPersonalizar() {
    if (!produto) return;
    iniciar(produto.id);
    router.push(`/(cliente)/personalizar/${produto.id}`);
  }

  return (
    <View style={styles.tela}>
      <Cabecalho titulo={produto.nome} comVoltar />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <Image
          source={produto.imagemUrl ? { uri: montarUrl(produto.imagemUrl) } : require('@/assets/logomarca.jpg')}
          style={styles.foto}
          contentFit="cover"
          transition={200}
        />

        <View style={styles.corpo}>
          <Texto variante="titulo" peso="bold">
            {produto.nome}
          </Texto>
          <Texto variante="legenda" cor={cores.cinzaEscuro} style={styles.categoria}>
            {nomeCategoria}
          </Texto>

          <Texto style={styles.descricao}>{produto.descricao}</Texto>

          <Texto variante="legenda" cor={cores.cinzaEscuro} style={styles.rotuloPreco}>
            A partir de
          </Texto>
          <Texto variante="preco" peso="bold" cor={cores.vinho}>
            {formatarMoeda(produto.precoBase)}
          </Texto>
        </View>
      </ScrollView>

      <View style={[styles.rodape, { paddingBottom: espaco.md + insets.bottom }]}>
        <Botao titulo="Personalizar e Pedir" onPress={aoPersonalizar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  conteudo: { paddingBottom: 96 },
  carregando: { marginTop: espaco.xl },
  foto: { width: '100%', height: 280 },
  corpo: { padding: espaco.lg },
  categoria: { marginTop: espaco.xs },
  descricao: { marginTop: espaco.md, lineHeight: 22 },
  rotuloPreco: { marginTop: espaco.lg },
  rodape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: cores.branco,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    padding: espaco.md,
  },
});
