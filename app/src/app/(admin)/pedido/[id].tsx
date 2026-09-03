import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { usePedidos } from '@/state/PedidosContext';
import { cores, espaco, raio } from '@/theme';
import type { StatusPedido } from '@divine/shared';

const PROXIMO_PASSO: Partial<Record<StatusPedido, string>> = {
  recebido: 'Iniciar produção',
  producao: 'Marcar como pronto',
  pronto: 'Marcar como entregue',
};

export default function DetalhePedidoAdmin() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pedidos, produtosAdmin, avancarStatus, recusarPedido } = usePedidos();
  const insets = useSafeAreaInsets();

  const [modalAberto, setModalAberto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [erroMotivo, setErroMotivo] = useState('');

  const pedido = pedidos.find((p) => p.id === id);

  if (!pedido) {
    return (
      <View style={styles.tela}>
        <Cabecalho titulo="Pedido" comVoltar />
        <Vazio mensagem="Pedido não encontrado." />
      </View>
    );
  }

  const produto = produtosAdmin.find((p) => p.id === pedido.personalizacao.produtoId);
  const rotuloAvancar = PROXIMO_PASSO[pedido.status];
  const podeRecusar = pedido.status === 'recebido';

  function confirmarRecusa() {
    if (!motivo.trim()) {
      setErroMotivo('Informe o motivo da recusa');
      return;
    }
    recusarPedido(pedido!.id, motivo.trim());
    setModalAberto(false);
    setMotivo('');
    setErroMotivo('');
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

        <BlocoProduto produto={produto} pedido={pedido} fotoGrande />
        <BlocoEntrega pedido={pedido} />
        <BlocoValores pedido={pedido} />
      </ScrollView>

      {(rotuloAvancar || podeRecusar) && (
        <View style={[styles.rodape, { paddingBottom: espaco.md + insets.bottom }]}>
          {rotuloAvancar ? <Botao titulo={rotuloAvancar} onPress={() => avancarStatus(pedido.id)} /> : null}
          {podeRecusar ? (
            <Botao titulo="Recusar pedido" variante="perigo" onPress={() => setModalAberto(true)} />
          ) : null}
        </View>
      )}

      <Modal visible={modalAberto} transparent animationType="fade" onRequestClose={() => setModalAberto(false)}>
        <View style={styles.fundoModal}>
          <View style={styles.caixaModal}>
            <Texto variante="subtitulo" peso="bold">
              Recusar pedido
            </Texto>
            <Campo
              rotulo="Motivo da recusa"
              valor={motivo}
              aoMudar={setMotivo}
              erro={erroMotivo}
              placeholder="Ex.: agenda lotada nessa data"
              multilinha
            />
            <Botao titulo="Confirmar recusa" variante="perigo" onPress={confirmarRecusa} />
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
