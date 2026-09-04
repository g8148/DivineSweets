import { StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Texto } from '@/components/Texto';
import { Cake } from '@/components/icones';
import { cores, espaco } from '@/theme';

type Props = {
  mensagem: string;
  /** Botão opcional. Falha de rede sem saída deixa a tela num beco sem saída. */
  acao?: { rotulo: string; aoTocar: () => void };
};

export function Vazio({ mensagem, acao }: Props) {
  return (
    <View style={styles.base}>
      <Cake size={48} color={cores.cinza} strokeWidth={2} />
      <Texto cor={cores.cinzaEscuro} style={styles.mensagem}>
        {mensagem}
      </Texto>
      {acao ? (
        <Botao titulo={acao.rotulo} variante="secundario" onPress={acao.aoTocar} style={styles.botao} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { padding: espaco.xl, alignItems: 'center', justifyContent: 'center' },
  mensagem: { marginTop: espaco.md, textAlign: 'center' },
  botao: { marginTop: espaco.lg, alignSelf: 'stretch' },
});
