import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { montarUrl } from '@/api/client';
import { Cartao } from '@/components/Cartao';
import { Texto } from '@/components/Texto';
import { formatarMoeda } from '@divine/shared';
import { cores, espaco } from '@/theme';

type Props = {
  produto: { id: string; nome: string; precoBase: number; imagemUrl: string | null };
  onPress: () => void;
};

/**
 * A foto vem do servidor por URL relativa (`/uploads/...`), e não mais do
 * bundle. O produto que a confeiteira acabou de cadastrar nasce sem imagem —
 * daí o recurso à logomarca, para o card não abrir um buraco na grade.
 */
export function CardProduto({ produto, onPress }: Props) {
  return (
    <Cartao onPress={onPress} style={styles.cartao}>
      <Image
        source={produto.imagemUrl ? { uri: montarUrl(produto.imagemUrl) } : require('@/assets/logomarca.jpg')}
        style={styles.foto}
        contentFit="cover"
        transition={200}
      />
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
