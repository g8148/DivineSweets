import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminPedido, useAtualizarStatus } from '@/api/admin';
import { BlocoEntrega, BlocoProduto, BlocoValores } from '@/components/BlocosPedido';
import { Botao } from '@/components/Botao';
import { Cabecalho } from '@/components/Cabecalho';
import { Campo } from '@/components/Campo';
import { Cartao } from '@/components/Cartao';
import { LinhaResumo } from '@/components/LinhaResumo';
import { StatusStepper } from '@/components/StatusStepper';
import { Texto } from '@/components/Texto';
import { Vazio } from '@/components/Vazio';
import { Phone } from '@/components/icones';
import { numeroPedido } from '@divine/shared';
import { ORDEM_STATUS } from '@/data/status';
import { cores, espaco, raio } from '@/theme';
import type { StatusPedido } from '@divine/shared';

const PROXIMO_PASSO: Partial<Record<StatusPedido, string>> = {
  recebido: 'Iniciar produção',
  producao: 'Marcar como pronto',
  pronto: 'Marcar como entregue',
};

export default function DetalhePedidoAdmin() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pedido, isPending, isError, refetch } = useAdminPedido(id);
  const atualizar = useAtualizarStatus();
  const insets = useSafeAreaInsets();

  const [modalAberto, setModalAberto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [erroMotivo, setErroMotivo] = useState('');
  const [aviso, setAviso] = useState('');

  if (isPending) {
    return (
      <View style={styles.tela}>
        <Cabecalho titulo="Pedido" comVoltar />
        <ActivityIndicator color={cores.vinho} style={styles.carregando} />
      </View>
    );
  }

  if (isError || !pedido) {
    return (
      <View style={styles.tela}>
        <Cabecalho titulo="Pedido" comVoltar />
        <Vazio
          mensagem="Não foi possível carregar este pedido."
          acao={{ rotulo: 'Tentar novamente', aoTocar: () => refetch() }}
        />
      </View>
    );
  }

  const rotuloAvancar = PROXIMO_PASSO[pedido.status];
  const podeRecusar = pedido.status === 'recebido';

  async function mudarStatus(status: StatusPedido, motivoRecusa?: string) {
    setAviso('');
    try {
      await atualizar.mutateAsync({ id, status, motivoRecusa });
    } catch (erro) {
      setAviso(erro instanceof Error ? erro.message : 'Não foi possível mudar o status');
    }
  }

  function avancar() {
    if (!pedido) return;
    const proximo = ORDEM_STATUS[ORDEM_STATUS.indexOf(pedido.status) + 1];
    if (proximo) void mudarStatus(proximo);
  }

  async function confirmarRecusa() {
    // O servidor também exige o motivo; conferir aqui evita a ida de rede e dá
    // o erro ao lado do campo, e não numa faixa no rodapé.
    if (!motivo.trim()) {
      setErroMotivo('Informe o motivo da recusa');
      return;
    }
    setErroMotivo('');
    await mudarStatus('recusado', motivo.trim());
    setModalAberto(false);
    setMotivo('');
  }

  return (
    <View style={styles.tela}>
      <Cabecalho titulo={`Pedido #${numeroPedido(pedido.id)}`} comVoltar />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <Cartao style={styles.cartao}>
          <View style={styles.clienteLinha}>
            <View style={styles.clienteDados}>
              <Texto peso="semibold">{pedido.clienteNome}</Texto>
              <Texto variante="legenda" cor={cores.cinzaEscuro}>
                {pedido.clienteTelefone}
              </Texto>
            </View>
            <Pressable hitSlop={8} style={styles.telefone}>
              <Phone size={20} color={cores.vinho} strokeWidth={2} />
            </Pressable>
          </View>
        </Cartao>

        <Cartao style={styles.cartao}>
          <StatusStepper status={pedido.status} />
          {pedido.status === 'recusado' && pedido.motivoRecusa ? (
            <LinhaResumo rotulo="Motivo" valor={pedido.motivoRecusa} />
          ) : null}
        </Cartao>

        <BlocoProduto pedido={pedido} fotoGrande />
        <BlocoEntrega pedido={pedido} />
        <BlocoValores pedido={pedido} />
      </ScrollView>

      {(rotuloAvancar || podeRecusar) && (
        <View style={[styles.rodape, { paddingBottom: espaco.md + insets.bottom }]}>
          {aviso ? (
            <Texto variante="legenda" cor={cores.alertaTexto}>
              {aviso}
            </Texto>
          ) : null}
          {rotuloAvancar ? (
            <Botao
              titulo={atualizar.isPending ? 'Salvando…' : rotuloAvancar}
              onPress={avancar}
              desabilitado={atualizar.isPending}
            />
          ) : null}
          {podeRecusar ? (
            <Botao
              titulo="Recusar pedido"
              variante="perigo"
              desabilitado={atualizar.isPending}
              onPress={() => setModalAberto(true)}
            />
          ) : null}
        </View>
      )}

      <Modal visible={modalAberto} transparent animationType="fade" onRequestClose={() => setModalAberto(false)}>
        <View style={styles.fundoModal}>
          <View style={styles.caixaModal}>
            <Texto variante="subtitulo" peso="bold">
              Recusar pedido
            </Texto>
            <Texto variante="legenda" cor={cores.cinzaEscuro}>
              O cliente vê este texto na tela de acompanhamento.
            </Texto>
            <Campo
              rotulo="Motivo da recusa"
              valor={motivo}
              aoMudar={setMotivo}
              erro={erroMotivo}
              placeholder="Ex.: agenda lotada nessa data"
              multilinha
            />
            <Botao
              titulo={atualizar.isPending ? 'Salvando…' : 'Confirmar recusa'}
              variante="perigo"
              desabilitado={atualizar.isPending}
              onPress={confirmarRecusa}
            />
            <Botao titulo="Cancelar" variante="secundario" onPress={() => setModalAberto(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  conteudo: { padding: espaco.md, gap: espaco.md, paddingBottom: 160 },
  cartao: { padding: espaco.md },
  carregando: { marginTop: espaco.xl },
  clienteLinha: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  clienteDados: { flex: 1 },
  telefone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cores.rosaCreme,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rodape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: espaco.sm,
    backgroundColor: cores.branco,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    padding: espaco.md,
  },
  fundoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: espaco.lg,
  },
  caixaModal: {
    backgroundColor: cores.branco,
    borderRadius: raio.lg,
    padding: espaco.lg,
    gap: espaco.sm,
  },
});
