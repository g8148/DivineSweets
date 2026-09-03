import { StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { Texto } from '@/components/Texto';
import { cores, espaco, fonte, raio, tamanhoFonte } from '@/theme';

type Props = {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  erro?: string;
  placeholder?: string;
  multilinha?: boolean;
  maxLength?: number;
  teclado?: KeyboardTypeOptions;
  segura?: boolean;
};

export function Campo({
  rotulo,
  valor,
  aoMudar,
  erro,
  placeholder,
  multilinha = false,
  maxLength,
  teclado,
  segura = false,
}: Props) {
  return (
    <View style={styles.container}>
      <Texto variante="legenda" peso="semibold" style={styles.rotulo}>
        {rotulo}
      </Texto>

      <TextInput
        value={valor}
        onChangeText={aoMudar}
        placeholder={placeholder}
        placeholderTextColor={cores.cinza}
        multiline={multilinha}
        maxLength={maxLength}
        keyboardType={teclado}
        secureTextEntry={segura}
        style={[
          styles.input,
          multilinha && styles.multilinha,
          { borderColor: erro ? cores.alertaTexto : cores.borda },
        ]}
      />

      {maxLength !== undefined && (
        <Texto variante="legenda" cor={cores.cinzaEscuro} style={styles.contador}>
          {valor.length}/{maxLength}
        </Texto>
      )}

      {erro ? (
        <Texto variante="legenda" cor={cores.alertaTexto} style={styles.erro}>
          {erro}
        </Texto>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: espaco.md },
  rotulo: { marginBottom: espaco.xs },
  input: {
    borderWidth: 1,
    borderRadius: raio.md,
    backgroundColor: cores.rosaClaro,
    padding: espaco.md,
    fontFamily: fonte.regular,
    fontSize: tamanhoFonte.corpo,
    color: cores.vinho,
  },
  multilinha: { minHeight: 88, textAlignVertical: 'top' },
  contador: { textAlign: 'right', marginTop: espaco.xs },
  erro: { marginTop: espaco.xs },
});
