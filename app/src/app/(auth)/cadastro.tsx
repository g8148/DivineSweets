import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '@/auth/useAuth';
import { Botao } from '@/components/Botao';
import { Cabecalho } from '@/components/Cabecalho';
import { Campo } from '@/components/Campo';
import { Rolagem } from '@/components/Rolagem';
import { Texto } from '@/components/Texto';
import { apenasDigitos, mascararTelefone } from '@divine/shared';
import { cores, espaco } from '@/theme';

type Erros = { nome: string; telefone: string; email: string; senha: string };

const SEM_ERROS: Erros = { nome: '', telefone: '', email: '', senha: '' };

// O Better Auth recusa senha menor que isto no servidor, em inglês. Conferir
// aqui evita a viagem de rede e a mensagem estrangeira.
const MINIMO_SENHA = 8;

export default function Cadastro() {
  const { cadastrar } = useAuth();

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  // Só o fato de já ter havido uma tentativa fica guardado; as mensagens saem
  // do que está preenchido agora. Guardá-las em estado as deixava na tela
  // depois de o campo ter sido corrigido, até o toque seguinte no botão.
  const [tentouCadastrar, setTentouCadastrar] = useState(false);
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  const emailLimpo = email.trim();
  // O que vai para o servidor é só dígito; a pontuação é da tela. Assim o
  // número gravado não depende de como cada pessoa resolveu escrevê-lo.
  const digitos = apenasDigitos(telefone);

  const pendencias: Erros = {
    nome: nome.trim() ? '' : 'Campo obrigatório',
    telefone: !digitos ? 'Campo obrigatório' : digitos.length < 10 ? 'Telefone inválido' : '',
    email: !emailLimpo ? 'Campo obrigatório' : !emailLimpo.includes('@') ? 'E-mail inválido' : '',
    senha: !senha
      ? 'Campo obrigatório'
      : senha.length < MINIMO_SENHA
        ? `Use ao menos ${MINIMO_SENHA} caracteres`
        : '',
  };
  const erros = tentouCadastrar ? pendencias : SEM_ERROS;

  async function aoCadastrar() {
    setTentouCadastrar(true);
    setAviso('');
    if (Object.values(pendencias).some(Boolean)) return;

    setEnviando(true);
    try {
      await cadastrar({ nome: nome.trim(), email: emailLimpo, senha, telefone: digitos });
      // O cadastro já deixa a sessão aberta; a tela inicial decide para onde ir
      // a partir do papel que o servidor atribuiu.
      router.replace('/');
    } catch (erro) {
      setAviso(erro instanceof Error ? erro.message : 'Não foi possível criar a conta');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.tela}>
      <Cabecalho titulo="Criar conta" comVoltar />
      <Rolagem contentContainerStyle={styles.conteudo}>
        <Campo rotulo="Nome" valor={nome} aoMudar={setNome} erro={erros.nome} placeholder="Seu nome completo" />
        <Campo
          rotulo="Telefone"
          valor={telefone}
          aoMudar={(digitado) => setTelefone(mascararTelefone(digitado))}
          erro={erros.telefone}
          placeholder="(49) 99999-0000"
          teclado="phone-pad"
        />
        <Campo
          rotulo="E-mail"
          valor={email}
          aoMudar={setEmail}
          erro={erros.email}
          placeholder="voce@email.com"
          teclado="email-address"
        />
        <Campo
          rotulo="Senha"
          valor={senha}
          aoMudar={setSenha}
          erro={erros.senha}
          placeholder="Ao menos 8 caracteres"
          segura
        />

        {aviso ? (
          <Texto variante="legenda" cor={cores.alertaTexto} style={styles.aviso}>
            {aviso}
          </Texto>
        ) : null}

        <Botao
          titulo={enviando ? 'Criando…' : 'Criar conta'}
          onPress={aoCadastrar}
          desabilitado={enviando}
          style={styles.botao}
        />
      </Rolagem>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  conteudo: { padding: espaco.lg },
  aviso: { marginTop: espaco.sm },
  botao: { marginTop: espaco.md },
});
