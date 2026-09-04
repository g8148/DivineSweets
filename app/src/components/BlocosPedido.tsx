// Cartões compartilhados entre o acompanhamento do cliente e o detalhe do
// admin — as duas telas descrevem o mesmo pedido.
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { montarUrl } from '@/api/client';
import type { PedidoApi } from '@/api/pedidos';
import { Cartao } from '@/components/Cartao';
import { LinhaResumo } from '@/components/LinhaResumo';
import { Texto } from '@/components/Texto';
import { diaDaSemana, formatarData, formatarMoeda } from '@divine/shared';
import { cores, espaco, raio } from '@/theme';

/**
 * As seleções vêm do próprio pedido, já com título e nome gravados no momento
 * da compra. Resolver os títulos no catálogo de hoje faria um pedido antigo
 * mudar de descrição quando a confeiteira renomeasse um grupo.
 */
export function BlocoProduto({ pedido, fotoGrande = false }: { pedido: PedidoApi; fotoGrande?: boolean }) {
  return (
    <Cartao style={styles.cartao}>
      <Texto peso="semibold">Produto</Texto>

      <View style={styles.produto}>
        <Image
          source={
            pedido.produtoImagemUrl
              ? { uri: montarUrl(pedido.produtoImagemUrl) }
              : require('@/assets/logomarca.jpg')
          }
          style={styles.miniatura}
          contentFit="cover"
        />
        <Texto peso="semibold" style={styles.nome}>
          {pedido.produtoNome}
        </Texto>
      </View>

      {pedido.selecoes.map((s) => (
        <LinhaResumo key={`${s.grupoTitulo}-${s.opcaoNome}`} rotulo={s.grupoTitulo} valor={s.opcaoNome} />
      ))}
      <LinhaResumo rotulo="Quantidade" valor={String(pedido.quantidade)} />
      {pedido.mensagem ? <LinhaResumo rotulo="Mensagem" valor={`“${pedido.mensagem}”`} /> : null}

      {pedido.fotoUrl ? (
        <Image
          source={{ uri: montarUrl(pedido.fotoUrl) }}
          style={fotoGrande ? styles.fotoGrande : styles.fotoPequena}
          contentFit="cover"
        />
      ) : null}
    </Cartao>
  );
}

export function BlocoEntrega({ pedido }: { pedido: PedidoApi }) {
  return (
    <Cartao style={styles.cartao}>
      <Texto peso="semibold">Entrega</Texto>
      <LinhaResumo
        rotulo="Como receber"
        valor={pedido.tipoEntrega === 'entrega' ? 'Entrega' : 'Retirada na loja'}
      />
      <LinhaResumo
        rotulo="Data"
        valor={`${formatarData(pedido.dataEntrega)} (${diaDaSemana(pedido.dataEntrega)})`}
      />
      <LinhaResumo rotulo="Horário" valor={pedido.horaEntrega} />
      {pedido.endereco ? <LinhaResumo rotulo="Endereço" valor={pedido.endereco} /> : null}
    </Cartao>
  );
}

/**
 * Os três valores vêm gravados no pedido, e não recalculados. Uma taxa de
 * entrega que mudasse de valor reescreveria o histórico de todo mundo.
 */
export function BlocoValores({ pedido }: { pedido: PedidoApi }) {
  return (
    <Cartao style={styles.cartao}>
      <Texto peso="semibold">Valores</Texto>
      <LinhaResumo rotulo="Subtotal" valor={formatarMoeda(pedido.subtotal)} />
      <LinhaResumo rotulo="Taxa de entrega" valor={formatarMoeda(pedido.taxaEntrega)} />
      <View style={styles.totalLinha}>
        <Texto variante="subtitulo" peso="bold">
          Total
        </Texto>
        <Texto variante="preco" peso="bold" cor={cores.vinho}>
          {formatarMoeda(pedido.total)}
        </Texto>
      </View>
    </Cartao>
  );
}

const styles = StyleSheet.create({
  cartao: { padding: espaco.md },
  produto: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, paddingVertical: espaco.sm },
  miniatura: { width: 64, height: 64, borderRadius: raio.md },
  nome: { flexShrink: 1 },
  fotoPequena: { width: 80, height: 80, borderRadius: raio.md, marginTop: espaco.sm },
  fotoGrande: { width: '100%', height: 200, borderRadius: raio.md, marginTop: espaco.sm },
  totalLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    marginTop: espaco.sm,
    paddingTop: espaco.md,
  },
});
