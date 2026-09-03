import { useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '@/components/Botao';
import { Cabecalho } from '@/components/Cabecalho';
import { Cartao } from '@/components/Cartao';
import { Chip } from '@/components/Chip';
import { LinhaResumo } from '@/components/LinhaResumo';
import { Texto } from '@/components/Texto';
import { Vazio } from '@/components/Vazio';
import { Copy } from '@/components/icones';
import { diaDaSemana, formatarData, formatarMoeda } from '@divine/shared';
import { descreverSelecoes } from '@divine/shared';
import { calcularSubtotal, calcularTotal, TAXA_ENTREGA } from '@divine/shared';
import { useAuth } from '@/state/AuthContext';
import { usePedidos } from '@/state/PedidosContext';
import { useRascunho } from '@/state/RascunhoPedidoContext';
import { cores, espaco, raio } from '@/theme';
import { imagemDoProduto } from '@/data/imagens';

const CODIGO_PIX =
  '00020126580014BR.GOV.BCB.PIX0136divine-sweets-doceria5204000053039865802BR';

export default function Resumo() {
  const { rascunho, entrega, limpar } = useRascunho();
  const { produtosAdmin, criarPedido } = usePedidos();
  const { usuario, adicionarEndereco } = useAuth();
  const insets = useSafeAreaInsets();

  const [pagamento, setPagamento] = useState<'pix' | 'entrega'>('pix');
  const [copiado, setCopiado] = useState(false);
  const timerCopia = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerCopia.current) clearTimeout(timerCopia.current);
  }, []);

  const produto = produtosAdmin.find((p) => p.id === rascunho?.produtoId);

  if (!produto || !rascunho) {
    return (
      <View style={styles.tela}>
        <Cabecalho titulo="Resumo do pedido" comVoltar />
        <Vazio mensagem="Nenhum pedido em andamento." />
      </View>
    );
  }

  const subtotal = calcularSubtotal(produto, rascunho);
  const taxa = entrega.tipo === 'entrega' ? TAXA_ENTREGA : 0;
  const total = calcularTotal(produto, rascunho, entrega.tipo);
  const selecoes = descreverSelecoes(produto, rascunho);

  function copiarPix() {
    // Simulação declarada (RN09): o protótipo não integra com nenhum PSP.
    setCopiado(true);
    if (timerCopia.current) clearTimeout(timerCopia.current);
    timerCopia.current = setTimeout(() => setCopiado(false), 2000);
  }

  function confirmar() {
    if (!rascunho || !usuario) return;

    const id = criarPedido({
      clienteNome: usuario.nome,
      clienteTelefone: usuario.telefone,
      personalizacao: rascunho,
      entrega,
      total,
    });

    if (entrega.tipo === 'entrega') adicionarEndereco(entrega.endereco);
    limpar();
    // Sem descartar a pilha, o botão voltar do Android leva de volta às telas do
    // rascunho que acabaram de ser limpas.
    router.dismissAll();
    router.replace({ pathname: '/(cliente)/confirmado', params: { id } });
  }

  return (
    <View style={styles.tela}>
      <Cabecalho titulo="Resumo do pedido" comVoltar />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <Cartao style={styles.cartao}>
          <Texto peso="semibold">Produto</Texto>
          <View style={styles.produto}>
            <Image source={imagemDoProduto(produto.id)} style={styles.miniatura} contentFit="cover" />
            <Texto peso="semibold" style={styles.nomeProduto}>
              {produto.nome}
            </Texto>
          </View>

          {selecoes.map((s) => (
            <LinhaResumo key={s.rotulo} rotulo={s.rotulo} valor={s.valor} />
          ))}
          <LinhaResumo rotulo="Quantidade" valor={String(rascunho.quantidade)} />
          {rascunho.mensagem ? <LinhaResumo rotulo="Mensagem" valor={`“${rascunho.mensagem}”`} /> : null}
          {rascunho.fotoUri ? (
            <Image source={{ uri: rascunho.fotoUri }} style={styles.referencia} contentFit="cover" />
          ) : null}
        </Cartao>

        <Cartao style={styles.cartao}>
          <Texto peso="semibold">Entrega</Texto>
          <LinhaResumo
            rotulo="Como receber"
            valor={entrega.tipo === 'entrega' ? 'Entrega' : 'Retirada na loja'}
          />
          <LinhaResumo
            rotulo="Data"
            valor={`${formatarData(entrega.data)} (${diaDaSemana(entrega.data)})`}
          />
          <LinhaResumo rotulo="Horário" valor={entrega.hora} />
          {entrega.tipo === 'entrega' ? (
            <LinhaResumo rotulo="Endereço" valor={entrega.endereco} />
          ) : null}
        </Cartao>

        <Cartao style={styles.cartao}>
          <Texto peso="semibold">Contato</Texto>
          <LinhaResumo rotulo="Nome" valor={usuario?.nome ?? ''} />
          <LinhaResumo rotulo="Telefone" valor={usuario?.telefone ?? ''} />
        </Cartao>

        <Cartao style={styles.cartao}>
          <Texto peso="semibold">Valores</Texto>
          <LinhaResumo rotulo="Subtotal" valor={formatarMoeda(subtotal)} />
          <LinhaResumo rotulo="Taxa de entrega" valor={formatarMoeda(taxa)} />
          <View style={styles.totalLinha}>
            <Texto variante="subtitulo" peso="bold">
              Total
            </Texto>
            <Texto variante="preco" peso="bold" cor={cores.vinho}>
              {formatarMoeda(total)}
            </Texto>
          </View>
        </Cartao>

        <Cartao style={styles.cartao}>
          <Texto peso="semibold">Pagamento</Texto>
          <View style={styles.opcoes}>
            <Chip rotulo="PIX" selecionado={pagamento === 'pix'} onPress={() => setPagamento('pix')} />
            <Chip
              rotulo="Na entrega"
              selecionado={pagamento === 'entrega'}
              onPress={() => setPagamento('entrega')}
            />
          </View>

          {pagamento === 'pix' && (
            <View style={styles.pix}>
              <Texto variante="legenda" cor={cores.cinzaEscuro} numberOfLines={2} style={styles.codigo}>
                {CODIGO_PIX}
              </Texto>
              <Botao
                titulo={copiado ? 'Código copiado!' : 'Copiar código PIX'}
                onPress={copiarPix}
                variante="secundario"
                icone={<Copy size={20} color={cores.vinho} strokeWidth={2} />}
              />
            </View>
          )}
        </Cartao>
      </ScrollView>

      <View style={[styles.rodape, { paddingBottom: espaco.md + insets.bottom }]}>
        <Botao titulo="Confirmar Pedido" onPress={confirmar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  conteudo: { padding: espaco.md, paddingBottom: 110, gap: espaco.md },
  cartao: { padding: espaco.md },
  produto: { flexDirection: 'row', alignItems: 'center', gap: espaco.md, paddingVertical: espaco.sm },
  miniatura: { width: 64, height: 64, borderRadius: raio.md },
  nomeProduto: { flexShrink: 1 },
  referencia: { width: 80, height: 80, borderRadius: raio.md, marginTop: espaco.sm },
  totalLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    marginTop: espaco.sm,
    paddingTop: espaco.md,
  },
  opcoes: { flexDirection: 'row', gap: espaco.sm, paddingVertical: espaco.sm },
  pix: { gap: espaco.sm },
  codigo: {
    fontFamily: 'monospace',
    backgroundColor: cores.rosaClaro,
    borderRadius: raio.sm,
    padding: espaco.sm,
  },
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
