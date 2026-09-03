import { useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Texto } from '@/components/Texto';
import { useAuth } from '@/state/AuthContext';
import { cores, espaco } from '@/theme';

export default function Login() {
  const { entrar } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [souConfeiteira, setSouConfeiteira] = useState(false);
  const [erroEmail, setErroEmail] = useState('');
  const [erroSenha, setErroSenha] = useState('');

  function aoEntrar() {
    const emailLimpo = email.trim();
    const problemaEmail = !emailLimpo
      ? 'Informe seu e-mail'
      : !emailLimpo.includes('@')
        ? 'E-mail inválido'
        : '';
    const problemaSenha = !senha ? 'Informe sua senha' : '';

    setErroEmail(problemaEmail);
    setErroSenha(problemaSenha);
    if (problemaEmail || problemaSenha) return;

    const perfil = souConfeiteira ? 'admin' : 'cliente';
    entrar(emailLimpo, senha, perfil);
    router.replace(perfil === 'admin' ? '/(admin)/(tabs)/pedidos' : '/(cliente)/(tabs)/catalogo');
  }

  return (
    <ScrollView contentContainerStyle={styles.conteudo} style={styles.tela}>
      <Image source={require('@/assets/logomarca.jpg')} style={styles.logo} contentFit="cover" />

      <Texto variante="titulo" peso="bold" style={styles.titulo}>
        Divine Sweets
      </Texto>
      <Texto variante="legenda" cor={cores.cinzaEscuro} style={styles.subtitulo}>
        Entre para fazer sua encomenda
      </Texto>

      <Campo
        rotulo="E-mail"
        valor={email}
        aoMudar={setEmail}
        erro={erroEmail}
        placeholder="voce@email.com"
        teclado="email-address"
      />
      <Campo rotulo="Senha" valor={senha} aoMudar={setSenha} erro={erroSenha} placeholder="••••••" segura />

      <View style={styles.linhaSwitch}>
        <Switch
          value={souConfeiteira}
          onValueChange={setSouConfeiteira}
          trackColor={{ false: cores.borda, true: cores.vinhoClaro }}
          thumbColor={cores.vinho}
        />
        <Texto>Sou confeiteira</Texto>
      </View>

      <Botao titulo="Entrar" onPress={aoEntrar} style={styles.botao} />

      <Pressable onPress={() => router.push('/(auth)/cadastro')} style={styles.link}>
        <Texto variante="legenda" cor={cores.vinhoClaro}>
          Não tem conta? Cadastre-se
        </Texto>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: { backgroundColor: cores.branco },
  conteudo: { flexGrow: 1, justifyContent: 'center', padding: espaco.lg },
  logo: { width: 96, height: 96, borderRadius: 48, alignSelf: 'center' },
  titulo: { textAlign: 'center', marginTop: espaco.md },
  subtitulo: { textAlign: 'center', marginBottom: espaco.xl },
  linhaSwitch: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, marginBottom: espaco.lg },
  botao: { marginBottom: espaco.md },
  link: { alignItems: 'center', paddingVertical: espaco.sm },
});
