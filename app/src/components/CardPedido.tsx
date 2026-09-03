import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Cartao } from '@/components/Cartao';
import { Texto } from '@/components/Texto';
import { formatarData, formatarMoeda } from '@/data/format';
import { buscarProduto } from '@/data/produtos';
import { cores, espaco, raio } from '@/theme';
import type { Pedido, StatusPedido } from '@/types';

export const CORES_STATUS: Record<StatusPedido, { fundo: string; texto: string; rotulo: string }> = {
  recebido: { fundo: cores.rosaCreme, texto: cores.vinho, rotulo: 'Recebido' },
  producao: { fundo: '#fde8cd', texto: '#8a5a12', rotulo: 'Em produção' },
  pronto: { fundo: cores.sucesso, texto: cores.sucessoTexto, rotulo: 'Pronto' },
  entregue: { fundo: '#e6e6e6', texto: cores.cinzaEscuro, rotulo: 'Entregue' },
  recusado: { fundo: cores.alerta, texto: cores.alertaTexto, rotulo: 'Recusado' },
};

type Props = {
  pedido: Pedido;
  onPress: () => void;
  /** No painel admin a linha principal é o cliente, não o produto. */
  mostrarCliente?: boolean;
};

export function CardPedido({ pedido, onPress, mostrarCliente = false }: Props) {
  const produto = buscarProduto(pedido.personalizacao.produtoId);
  const status = CORES_STATUS[pedido.status];

  return (
    <Cartao onPress={onPress} style={styles.cartao}>
      {produto ? <Image source={produto.imagem} style={styles.miniatura} contentFit="cover" /> : null}

      <View style={styles.centro}>
        <Texto peso="semibold" numberOfLines={1}>
          {mostrarCliente ? pedido.clienteNome : (produto?.nome ?? 'Produto removido')}
        </Texto>
        <Texto variante="legenda" cor={cores.cinzaEscuro} numberOfLines={1}>
          {mostrarCliente ? (produto?.nome ?? 'Produto removido') : `Entrega em ${formatarData(pedido.entrega.data)}`}
        </Texto>
        <Texto peso="bold" cor={cores.vinho}>
          {formatarMoeda(pedido.total)}
        </Texto>
      </View>

      <View style={[styles.etiqueta, { backgroundColor: status.fundo }]}>
        <Texto variante="legenda" peso="semibold" cor={status.texto}>
          {status.rotulo}
        </Texto>
      </View>
    </Cartao>
  );
}

const styles = StyleSheet.create({
  cartao: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, padding: espaco.md },
  miniatura: { width: 56, height: 56, borderRadius: raio.md },
  centro: { flex: 1, gap: 2 },
  etiqueta: { paddingVertical: espaco.xs, paddingHorizontal: espaco.sm, borderRadius: raio.pill },
});
