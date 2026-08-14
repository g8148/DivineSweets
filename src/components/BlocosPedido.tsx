// Cartões compartilhados entre o resumo do cliente, o acompanhamento e o
// detalhe do admin — as três telas descrevem o mesmo pedido.
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Cartao } from '@/components/Cartao';
import { LinhaResumo } from '@/components/LinhaResumo';
import { Texto } from '@/components/Texto';
import { diaDaSemana, formatarData, formatarMoeda } from '@/data/format';
import { descreverSelecoes } from '@/data/opcoes';
import { TAXA_ENTREGA } from '@/data/pricing';
import { cores, espaco, raio } from '@/theme';
import type { Pedido, Produto } from '@/types';

export function BlocoProduto({
  produto,
  pedido,
  fotoGrande = false,
}: {
  produto: Produto | undefined;
  pedido: Pedido;
  fotoGrande?: boolean;
}) {
  const { personalizacao } = pedido;
  const selecoes = produto ? descreverSelecoes(produto, personalizacao) : [];

  return (
    <Cartao style={styles.cartao}>
      <Texto peso="semibold">Produto</Texto>

      <View style={styles.produto}>
        {produto ? <Image source={produto.imagem} style={styles.miniatura} contentFit="cover" /> : null}
        <Texto peso="semibold" style={styles.nome}>
          {produto?.nome ?? 'Produto removido do catálogo'}
        </Texto>
      </View>

      {selecoes.map((s) => (
        <LinhaResumo key={s.rotulo} rotulo={s.rotulo} valor={s.valor} />
      ))}
      <LinhaResumo rotulo="Quantidade" valor={String(personalizacao.quantidade)} />
      {personalizacao.mensagem ? (
        <LinhaResumo rotulo="Mensagem" valor={`“${personalizacao.mensagem}”`} />
      ) : null}

      {personalizacao.fotoUri ? (
        <Image
          source={{ uri: personalizacao.fotoUri }}
          style={fotoGrande ? styles.fotoGrande : styles.fotoPequena}
          contentFit="cover"
        />
      ) : null}
    </Cartao>
  );
}

export function BlocoEntrega({ pedido }: { pedido: Pedido }) {
  const { entrega } = pedido;

  return (
    <Cartao style={styles.cartao}>
      <Texto peso="semibold">Entrega</Texto>
      <LinhaResumo
        rotulo="Como receber"
        valor={entrega.tipo === 'entrega' ? 'Entrega' : 'Retirada na loja'}
      />
      <LinhaResumo rotulo="Data" valor={`${formatarData(entrega.data)} (${diaDaSemana(entrega.data)})`} />
      <LinhaResumo rotulo="Horário" valor={entrega.hora} />
      {entrega.tipo === 'entrega' ? <LinhaResumo rotulo="Endereço" valor={entrega.endereco} /> : null}
    </Cartao>
  );
}

export function BlocoValores({ pedido }: { pedido: Pedido }) {
  const taxa = pedido.entrega.tipo === 'entrega' ? TAXA_ENTREGA : 0;

  return (
    <Cartao style={styles.cartao}>
      <Texto peso="semibold">Valores</Texto>
      <LinhaResumo rotulo="Subtotal" valor={formatarMoeda(pedido.total - taxa)} />
      <LinhaResumo rotulo="Taxa de entrega" valor={formatarMoeda(taxa)} />
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
