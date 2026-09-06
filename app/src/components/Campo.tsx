import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { Texto } from '@/components/Texto';
import { Eye, EyeOff } from '@/components/icones';
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
  // Cada campo guarda o seu próprio estado: quem digita decide ver a senha
  // ali, e o campo seguinte continua escondido. Nasce escondida — quem está no
  // ônibus não precisa esconder nada antes de digitar.
  const [revelada, setRevelada] = useState(false);
  const escondendo = segura && !revelada;
  const Olho = revelada ? EyeOff : Eye;

  return (
    <View style={styles.container}>
      <Texto variante="legenda" peso="semibold" style={styles.rotulo}>
        {rotulo}
      </Texto>

      <View>
        <TextInput
          value={valor}
          onChangeText={aoMudar}
          placeholder={placeholder}
          placeholderTextColor={cores.cinza}
          multiline={multilinha}
          maxLength={maxLength}
          keyboardType={teclado}
          secureTextEntry={escondendo}
          // Com a senha à mostra o Android passa a sugerir correções e guarda a
          // palavra digitada no dicionário do teclado. E o e-mail com inicial
          // maiúscula é o erro de login mais comum no celular.
          autoCorrect={segura ? false : undefined}
          autoCapitalize={segura || teclado === 'email-address' ? 'none' : undefined}
          style={[
            styles.input,
            multilinha && styles.multilinha,
            segura && styles.comOlho,
            { borderColor: erro ? cores.alertaTexto : cores.borda },
          ]}
        />

        {segura ? (
          <Pressable
            onPress={() => setRevelada((atual) => !atual)}
            hitSlop={8}
            style={styles.olho}
            accessibilityRole="button"
            accessibilityLabel={revelada ? 'Ocultar a senha' : 'Mostrar a senha'}
          >
            <Olho size={20} color={cores.cinzaEscuro} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>

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
  // O texto para antes do ícone: sem isto uma senha longa passa por baixo dele.
  comOlho: { paddingRight: espaco.xl + espaco.md },
  olho: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: espaco.xl + espaco.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contador: { textAlign: 'right', marginTop: espaco.xs },
  erro: { marginTop: espaco.xs },
});
