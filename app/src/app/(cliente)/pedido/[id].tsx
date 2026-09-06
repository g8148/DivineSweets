import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { usePedido } from '@/api/pedidos';
import { BlocoEntrega, BlocoProduto, BlocoValores } from '@/components/BlocosPedido';
import { Cabecalho } from '@/components/Cabecalho';
import { Cartao } from '@/components/Cartao';
import { LinhaResumo } from '@/components/LinhaResumo';
import { StatusStepper } from '@/components/StatusStepper';
import { Texto } from '@/components/Texto';
import { Vazio } from '@/components/Vazio';
import { Bell } from '@/components/icones';
import { formatarTelefone, numeroPedido } from '@divine/shared';
import { cores, espaco, raio } from '@/theme';
import type { StatusPedido } from '@divine/shared';

const AVISOS: Record<Exclude<StatusPedido, 'recusado'>, string> = {
  recebido: 'Recebemos seu pedido! Em breve começamos a produção.',
  producao: 'Seu doce já está sendo preparado com carinho.',
  pronto: 'Seu pedido está pronto!',
  entregue: 'Pedido entregue. Obrigado pela preferência!',
};

export default function AcompanharPedido() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pedido, isPending, isError, refetch } = usePedido(id);

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

  const recusado = pedido.status === 'recusado';

  return (
    <View style={styles.tela}>
      <Cabecalho titulo={`Pedido #${numeroPedido(pedido.id)}`} comVoltar />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <Cartao style={styles.cartao}>
          <StatusStepper status={pedido.status} />
        </Cartao>

        <View style={[styles.aviso, { backgroundColor: recusado ? cores.alerta : cores.sucesso }]}>
          <Bell size={20} color={recusado ? cores.alertaTexto : cores.sucessoTexto} strokeWidth={2} />
          <Texto cor={recusado ? cores.alertaTexto : cores.sucessoTexto} style={styles.avisoTexto}>
            {recusado
              ? `Pedido recusado: ${pedido.motivoRecusa ?? 'sem motivo informado'}`
              : AVISOS[pedido.status as Exclude<StatusPedido, 'recusado'>]}
          </Texto>
        </View>

        <BlocoProduto pedido={pedido} />
        <BlocoEntrega pedido={pedido} />

        <Cartao style={styles.cartao}>
          <Texto peso="semibold">Contato</Texto>
          <LinhaResumo rotulo="Nome" valor={pedido.clienteNome} />
          <LinhaResumo rotulo="Telefone" valor={formatarTelefone(pedido.clienteTelefone)} />
        </Cartao>

        <BlocoValores pedido={pedido} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  conteudo: { padding: espaco.md, gap: espaco.md },
  carregando: { marginTop: espaco.xl },
  cartao: { padding: espaco.md },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    borderRadius: raio.md,
    padding: espaco.md,
  },
  avisoTexto: { flexShrink: 1 },
});
