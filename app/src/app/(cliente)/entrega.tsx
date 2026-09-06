import { useCallback, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useDisponibilidade } from '@/api/agenda';
import { useProduto } from '@/api/produtos';
import { Cabecalho } from '@/components/Cabecalho';
import { Calendario } from '@/components/Calendario';
import { Campo } from '@/components/Campo';
import { Chip } from '@/components/Chip';
import { PrecoRodape } from '@/components/PrecoRodape';
import { Rolagem } from '@/components/Rolagem';
import { Texto } from '@/components/Texto';
import { Vazio } from '@/components/Vazio';
import { calcularTotal, formatarMoeda, TAXA_ENTREGA } from '@divine/shared';
import { useRascunho } from '@/state/RascunhoPedidoContext';
import { cores, espaco } from '@/theme';

const HORARIOS = ['09:00', '10:30', '14:00', '15:30', '17:00', '19:00'];

type Erros = { data: string; hora: string; endereco: string };

const SEM_ERROS: Erros = { data: '', hora: '', endereco: '' };

// Pelo fuso local, e não por `toISOString`: perto da meia-noite o UTC já está
// no mês seguinte e o calendário abriria num mês diferente do que ele desenha.
function mesDeHoje() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
}

export default function Entrega() {
  const { rascunho, entrega, definirEntrega } = useRascunho();
  const { data: produto, isPending: carregandoProduto } = useProduto(rascunho?.produtoId ?? '');

  const [mes, setMes] = useState(mesDeHoje);
  const { data: disponibilidade, isFetching } = useDisponibilidade(mes);

  // Guardar as mensagens em estado as deixava na tela depois de a pessoa
  // escolher a data: o aviso só sumiria no toque seguinte em "Revisar pedido".
  // O que fica guardado é só o fato de já ter havido uma tentativa; as
  // mensagens saem do que está preenchido agora.
  const [tentouRevisar, setTentouRevisar] = useState(false);

  const porData = useMemo(
    () => new Map((disponibilidade?.dias ?? []).map((d) => [d.data, d])),
    [disponibilidade],
  );

  // Estável: o Calendario avisa o mês dentro de um efeito, e uma função nova a
  // cada render o dispararia sem parar.
  const avaliarDia = useCallback(
    (iso: string) => {
      const dia = porData.get(iso);
      // Dia que o servidor ainda não descreveu fica indisponível até a resposta
      // chegar. Liberar por padrão deixaria o cliente escolher uma data que o
      // envio recusaria depois, já no fim do fluxo.
      return dia ? dia.motivo : 'bloqueada';
    },
    [porData],
  );

  // O rascunho vem antes da espera: sem ele a consulta do produto fica
  // desabilitada e `isPending` nunca vira falso — a tela giraria para sempre.
  if (!rascunho) {
    return (
      <View style={styles.tela}>
        <Cabecalho titulo="Data de entrega" comVoltar />
        <Vazio mensagem="Nenhum pedido em andamento." />
      </View>
    );
  }

  if (carregandoProduto) {
    return (
      <View style={styles.tela}>
        <Cabecalho titulo="Data de entrega" comVoltar />
        <ActivityIndicator color={cores.vinho} style={styles.carregando} />
      </View>
    );
  }

  if (!produto) {
    return (
      <View style={styles.tela}>
        <Cabecalho titulo="Data de entrega" comVoltar />
        <Vazio mensagem="Não foi possível carregar este doce." />
      </View>
    );
  }

  const total = calcularTotal(produto, rascunho, entrega.tipo);

  const pendencias: Erros = {
    data: entrega.data ? '' : 'Escolha uma data de entrega',
    hora: entrega.hora ? '' : 'Escolha um horário',
    endereco:
      entrega.tipo === 'entrega' && !entrega.endereco.trim() ? 'Informe o endereço de entrega' : '',
  };
  const erros = tentouRevisar ? pendencias : SEM_ERROS;

  function aoRevisar() {
    setTentouRevisar(true);
    if (Object.values(pendencias).some(Boolean)) return;

    router.push('/(cliente)/resumo');
  }

  return (
    <View style={styles.tela}>
      <Cabecalho titulo="Data de entrega" subtitulo={produto.nome} comVoltar />

      <Rolagem contentContainerStyle={styles.conteudo}>
        <View>
          <Calendario
            dataSelecionada={entrega.data}
            aoSelecionar={(data) => definirEntrega({ data })}
            avaliarDia={avaliarDia}
            aoMudarMes={setMes}
          />
          {isFetching ? (
            <ActivityIndicator color={cores.vinho} style={styles.carregandoAgenda} />
          ) : null}
        </View>
        {erros.data ? (
          <Texto variante="legenda" cor={cores.alertaTexto}>
            {erros.data}
          </Texto>
        ) : null}

        <View style={styles.bloco}>
          <Texto peso="semibold">Horário</Texto>
          <View style={styles.opcoes}>
            {HORARIOS.map((hora) => (
              <Chip
                key={hora}
                rotulo={hora}
                selecionado={entrega.hora === hora}
                onPress={() => definirEntrega({ hora })}
              />
            ))}
          </View>
          {erros.hora ? (
            <Texto variante="legenda" cor={cores.alertaTexto}>
              {erros.hora}
            </Texto>
          ) : null}
        </View>

        <View style={styles.bloco}>
          <Texto peso="semibold">Como você quer receber</Texto>
          <View style={styles.opcoes}>
            <Chip
              rotulo="Retirar na loja"
              selecionado={entrega.tipo === 'retirada'}
              onPress={() => definirEntrega({ tipo: 'retirada' })}
            />
            <Chip
              rotulo="Entrega"
              detalhe={`+ ${formatarMoeda(TAXA_ENTREGA)}`}
              selecionado={entrega.tipo === 'entrega'}
              onPress={() => definirEntrega({ tipo: 'entrega' })}
            />
          </View>
        </View>

        {entrega.tipo === 'entrega' && (
          <View style={styles.bloco}>
            {/* Os endereços salvos saíram: o servidor não guarda agenda de
                endereços, e uma lista que o protótipo inventava daria a
                impressão de que o app lembra do que não lembra. */}
            <Campo
              rotulo="Endereço de entrega"
              valor={entrega.endereco}
              aoMudar={(endereco) => definirEntrega({ endereco })}
              erro={erros.endereco}
              placeholder="Rua, número, bairro e complemento"
              multilinha
            />
          </View>
        )}
      </Rolagem>

      <PrecoRodape valor={total} rotuloBotao="Revisar pedido" aoPressionar={aoRevisar} />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  conteudo: { padding: espaco.md, paddingBottom: 140, gap: espaco.lg },
  carregando: { marginTop: espaco.xl },
  carregandoAgenda: { marginTop: espaco.sm },
  bloco: { gap: espaco.sm },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
});
