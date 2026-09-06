import { useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { useAuth } from '@/auth/useAuth';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Rolagem } from '@/components/Rolagem';
import { Texto } from '@/components/Texto';
import { cores, espaco } from '@/theme';

export default function Login() {
  const { entrar } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  // Guardado é só o fato de já ter havido uma tentativa: as mensagens são
  // derivadas do que está preenchido agora e somem assim que o campo é
  // corrigido, sem esperar o toque seguinte em "Entrar".
  const [tentouEntrar, setTentouEntrar] = useState(false);
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  const emailLimpo = email.trim();
  const problemaEmail = !emailLimpo
    ? 'Informe seu e-mail'
    : !emailLimpo.includes('@')
      ? 'E-mail inválido'
      : '';
  const problemaSenha = !senha ? 'Informe sua senha' : '';
  const erroEmail = tentouEntrar ? problemaEmail : '';
  const erroSenha = tentouEntrar ? problemaSenha : '';

  async function aoEntrar() {
    setTentouEntrar(true);
    setAviso('');
    if (problemaEmail || problemaSenha) return;

    setEnviando(true);
    try {
      await entrar(emailLimpo, senha);
      // Sem destino fixo: quem decide é o papel que o servidor devolveu, e a
      // tela inicial já sabe ler a sessão. O seletor "sou confeiteira" saiu
      // daqui — dizer-se admin no login nunca deu acesso a nada.
      router.replace('/');
    } catch (erro) {
      setAviso(erro instanceof Error ? erro.message : 'Não foi possível entrar');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Rolagem contentContainerStyle={styles.conteudo} style={styles.tela}>
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

      {aviso ? (
        <Texto variante="legenda" cor={cores.alertaTexto} style={styles.aviso}>
          {aviso}
        </Texto>
      ) : null}

      <Botao
        titulo={enviando ? 'Entrando…' : 'Entrar'}
        onPress={aoEntrar}
        desabilitado={enviando}
        style={styles.botao}
      />

      <Pressable onPress={() => router.push('/(auth)/cadastro')} style={styles.link}>
        <Texto variante="legenda" cor={cores.vinhoClaro}>
          Não tem conta? Cadastre-se
        </Texto>
      </Pressable>
    </Rolagem>
  );
}

const styles = StyleSheet.create({
  tela: { backgroundColor: cores.branco },
  conteudo: { flexGrow: 1, justifyContent: 'center', padding: espaco.lg },
  logo: { width: 96, height: 96, borderRadius: 48, alignSelf: 'center' },
  titulo: { textAlign: 'center', marginTop: espaco.md },
  subtitulo: { textAlign: 'center', marginBottom: espaco.xl },
  aviso: { marginBottom: espaco.md },
  botao: { marginBottom: espaco.md },
  link: { alignItems: 'center', paddingVertical: espaco.sm },
});
