import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Cabecalho } from '@/components/Cabecalho';
import { Calendario } from '@/components/Calendario';
import { Campo } from '@/components/Campo';
import { Chip } from '@/components/Chip';
import { PrecoRodape } from '@/components/PrecoRodape';
import { Texto } from '@/components/Texto';
import { Vazio } from '@/components/Vazio';
import { motivoIndisponivel } from '@/data/disponibilidade';
import { formatarMoeda } from '@/data/format';
import { calcularTotal, TAXA_ENTREGA } from '@/data/pricing';
import { useAuth } from '@/state/AuthContext';
import { usePedidos } from '@/state/PedidosContext';
import { useRascunho } from '@/state/RascunhoPedidoContext';
import { cores, espaco } from '@/theme';

const HORARIOS = ['09:00', '10:30', '14:00', '15:30', '17:00', '19:00'];

type Erros = { data: string; hora: string; endereco: string };

const SEM_ERROS: Erros = { data: '', hora: '', endereco: '' };

export default function Entrega() {
  const { rascunho, entrega, definirEntrega } = useRascunho();
  const { produtosAdmin, agenda, ocupacao } = usePedidos();
  const { usuario } = useAuth();

  const [erros, setErros] = useState<Erros>(SEM_ERROS);

  const produto = produtosAdmin.find((p) => p.id === rascunho?.produtoId);

  if (!produto || !rascunho) {
    return (
      <View style={styles.tela}>
        <Cabecalho titulo="Data de entrega" comVoltar />
        <Vazio mensagem="Nenhum pedido em andamento." />
      </View>
    );
  }

  const total = calcularTotal(produto, rascunho, entrega.tipo);

  function aoRevisar() {
    const proximos: Erros = {
      data: entrega.data ? '' : 'Escolha uma data de entrega',
      hora: entrega.hora ? '' : 'Escolha um horário',
      endereco:
        entrega.tipo === 'entrega' && !entrega.endereco.trim() ? 'Informe o endereço de entrega' : '',
    };

    setErros(proximos);
    if (Object.values(proximos).some(Boolean)) return;

    router.push('/(cliente)/resumo');
  }

  return (
    <View style={styles.tela}>
      <Cabecalho titulo="Data de entrega" subtitulo={produto.nome} comVoltar />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <Calendario
          dataSelecionada={entrega.data}
          aoSelecionar={(data) => definirEntrega({ data })}
          avaliarDia={(iso) => motivoIndisponivel(iso, agenda, ocupacao, new Date())}
        />
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
            {usuario && usuario.enderecos.length > 0 && (
              <View style={styles.opcoes}>
                {usuario.enderecos.map((endereco) => (
                  <Chip
                    key={endereco}
                    rotulo={endereco}
                    selecionado={entrega.endereco === endereco}
                    onPress={() => definirEntrega({ endereco })}
                  />
                ))}
              </View>
            )}

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
      </ScrollView>

      <PrecoRodape valor={total} rotuloBotao="Revisar pedido" aoPressionar={aoRevisar} />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  conteudo: { padding: espaco.md, paddingBottom: 140, gap: espaco.lg },
  bloco: { gap: espaco.sm },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
});
