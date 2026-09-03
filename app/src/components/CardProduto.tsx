import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Cartao } from '@/components/Cartao';
import { Texto } from '@/components/Texto';
import { formatarMoeda } from '@divine/shared';
import { cores, espaco } from '@/theme';
import type { Produto } from '@divine/shared';
import { imagemDoProduto } from '@/data/imagens';

type Props = {
  produto: Produto;
  onPress: () => void;
};

export function CardProduto({ produto, onPress }: Props) {
  return (
    <Cartao onPress={onPress} style={styles.cartao}>
      <Image source={imagemDoProduto(produto.id)} style={styles.foto} contentFit="cover" />
      <View style={styles.corpo}>
        <Texto peso="semibold" numberOfLines={2}>
          {produto.nome}
        </Texto>
        <Texto variante="legenda" cor={cores.cinzaEscuro} style={styles.rotuloPreco}>
          a partir de
        </Texto>
        <Texto peso="bold" cor={cores.vinho}>
          {formatarMoeda(produto.precoBase)}
        </Texto>
      </View>
    </Cartao>
  );
}

const styles = StyleSheet.create({
  cartao: { flex: 1 },
  foto: { width: '100%', height: 140 },
  corpo: { padding: espaco.md },
  rotuloPreco: { marginTop: espaco.sm },
});
