import { useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { ApiError, montarUrl } from '@/api/client';
import { useCriarPedido } from '@/api/pedidos';
import { useEnviarImagem } from '@/api/upload';
import { useProduto } from '@/api/produtos';
import { useAuth } from '@/auth/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '@/components/Botao';
import { Cabecalho } from '@/components/Cabecalho';
import { Cartao } from '@/components/Cartao';
import { LinhaResumo } from '@/components/LinhaResumo';
import { Seletor } from '@/components/Seletor';
import { Texto } from '@/components/Texto';
import { Vazio } from '@/components/Vazio';
import { Copy } from '@/components/icones';
import { diaDaSemana, formatarData, formatarMoeda, formatarTelefone } from '@divine/shared';
import { descreverSelecoesDeGrupos } from '@divine/shared';
import { calcularSubtotal, calcularTotal, TAXA_ENTREGA } from '@divine/shared';
import { useRascunho } from '@/state/RascunhoPedidoContext';
import { cores, espaco, raio } from '@/theme';
import type { ItemDeSelecao } from '@/components/Seletor';

const CODIGO_PIX =
  '00020126580014BR.GOV.BCB.PIX0136divine-sweets-doceria5204000053039865802BR';

type Pagamento = 'pix' | 'entrega';

const PAGAMENTOS: ItemDeSelecao<Pagamento>[] = [
  { id: 'pix', rotulo: 'PIX' },
  { id: 'entrega', rotulo: 'Na entrega' },
];

export default function Resumo() {
  const { rascunho, entrega, limpar } = useRascunho();
  const { data: produto, isPending: carregandoProduto } = useProduto(rascunho?.produtoId ?? '');
  const { usuario } = useAuth();
  const criar = useCriarPedido();
  const enviarFoto = useEnviarImagem();
  const insets = useSafeAreaInsets();

  const [pagamento, setPagamento] = useState<Pagamento>('pix');
  const [copiado, setCopiado] = useState(false);
  const [aviso, setAviso] = useState('');
  const timerCopia = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerCopia.current) clearTimeout(timerCopia.current);
  }, []);

  // Antes da espera do produto: sem rascunho a consulta fica desabilitada e
  // `isPending` nunca resolve.
  if (!rascunho) {
    return (
      <View style={styles.tela}>
        <Cabecalho titulo="Resumo do pedido" comVoltar />
        <Vazio mensagem="Nenhum pedido em andamento." />
      </View>
    );
  }

  if (carregandoProduto) {
    return (
      <View style={styles.tela}>
        <Cabecalho titulo="Resumo do pedido" comVoltar />
        <ActivityIndicator color={cores.vinho} style={styles.carregando} />
      </View>
    );
  }

  if (!produto) {
    return (
      <View style={styles.tela}>
        <Cabecalho titulo="Resumo do pedido" comVoltar />
        <Vazio mensagem="Não foi possível carregar este doce." />
      </View>
    );
  }

  // Os valores aqui são só para conferência: quem calcula o que será cobrado é
  // o servidor, a partir do próprio catálogo. Se divergirem, quem vale é ele.
  const subtotal = calcularSubtotal(produto, rascunho);
  const taxa = entrega.tipo === 'entrega' ? TAXA_ENTREGA : 0;
  const total = calcularTotal(produto, rascunho, entrega.tipo);
  const selecoes = descreverSelecoesDeGrupos(produto.grupos, rascunho.selecoes);
  const enviando = criar.isPending || enviarFoto.isPending;

  function copiarPix() {
    // Simulação declarada (RN09): o protótipo não integra com nenhum PSP.
    setCopiado(true);
    if (timerCopia.current) clearTimeout(timerCopia.current);
    timerCopia.current = setTimeout(() => setCopiado(false), 2000);
  }

  async function confirmar() {
    if (!rascunho) return;
    setAviso('');

    try {
      // A foto primeiro: o pedido guarda a URL devolvida pelo upload, não o
      // arquivo. Falhando aqui, nenhum pedido é criado — melhor do que um
      // pedido gravado sem a referência que o cliente anexou.
      const fotoUrl = rascunho.fotoUri
        ? (await enviarFoto.mutateAsync(rascunho.fotoUri)).url
        : undefined;

      const pedido = await criar.mutateAsync({
        produtoId: rascunho.produtoId,
        quantidade: rascunho.quantidade,
        selecoes: rascunho.selecoes,
        mensagem: rascunho.mensagem || undefined,
        fotoUrl,
        tipoEntrega: entrega.tipo,
        dataEntrega: entrega.data,
        horaEntrega: entrega.hora,
        endereco: entrega.tipo === 'entrega' ? entrega.endereco : undefined,
      });

      limpar();
      // Sem descartar a pilha, o botão voltar do Android leva de volta às telas
      // do rascunho que acabaram de ser limpas.
      router.dismissAll();
      router.replace({ pathname: '/(cliente)/confirmado', params: { id: pedido.id } });
    } catch (erro) {
      // 409 é a data que lotou entre a escolha no calendário e este toque.
      // Mandar de volta ao calendário é a única saída útil: repetir o envio
      // daria o mesmo erro.
      if (erro instanceof ApiError && erro.status === 409) {
        setAviso(erro.message);
        router.back();
        return;
      }
      setAviso(erro instanceof Error ? erro.message : 'Não foi possível enviar o pedido');
    }
  }

  return (
    <View style={styles.tela}>
      <Cabecalho titulo="Resumo do pedido" comVoltar />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <Cartao style={styles.cartao}>
          <Texto peso="semibold">Produto</Texto>
          <View style={styles.produto}>
            <Image
              source={
                produto.imagemUrl ? { uri: montarUrl(produto.imagemUrl) } : require('@/assets/logomarca.jpg')
              }
              style={styles.miniatura}
              contentFit="cover"
            />
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
          <LinhaResumo rotulo="Telefone" valor={formatarTelefone(usuario?.telefone ?? '')} />
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
          <Seletor itens={PAGAMENTOS} selecionadoId={pagamento} aoSelecionar={setPagamento} />

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
        {aviso ? (
          <Texto variante="legenda" cor={cores.alertaTexto} style={styles.aviso}>
            {aviso}
          </Texto>
        ) : null}
        <Botao
          titulo={enviando ? 'Enviando…' : 'Confirmar Pedido'}
          onPress={confirmar}
          desabilitado={enviando}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  conteudo: { padding: espaco.md, paddingBottom: 110, gap: espaco.md },
  carregando: { marginTop: espaco.xl },
  aviso: { marginBottom: espaco.sm },
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
