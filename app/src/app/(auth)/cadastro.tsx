import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Cabecalho } from '@/components/Cabecalho';
import { Campo } from '@/components/Campo';
import { useAuth } from '@/state/AuthContext';
import { cores, espaco } from '@/theme';

type Erros = { nome: string; telefone: string; email: string; senha: string };

const SEM_ERROS: Erros = { nome: '', telefone: '', email: '', senha: '' };

export default function Cadastro() {
  const { cadastrar } = useAuth();

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<Erros>(SEM_ERROS);

  function aoCadastrar() {
    const emailLimpo = email.trim();
    const digitos = telefone.replace(/\D/g, '');

    const proximos: Erros = {
      nome: nome.trim() ? '' : 'Campo obrigatório',
      telefone: !digitos ? 'Campo obrigatório' : digitos.length < 10 ? 'Telefone inválido' : '',
      email: !emailLimpo ? 'Campo obrigatório' : !emailLimpo.includes('@') ? 'E-mail inválido' : '',
      senha: senha ? '' : 'Campo obrigatório',
    };

    setErros(proximos);
    if (Object.values(proximos).some(Boolean)) return;

    cadastrar({ nome: nome.trim(), email: emailLimpo, telefone });
    router.replace('/(cliente)/(tabs)/catalogo');
  }

  return (
    <View style={styles.tela}>
      <Cabecalho titulo="Criar conta" comVoltar />
      <ScrollView contentContainerStyle={styles.conteudo}>
        <Campo rotulo="Nome" valor={nome} aoMudar={setNome} erro={erros.nome} placeholder="Seu nome completo" />
        <Campo
          rotulo="Telefone"
          valor={telefone}
          aoMudar={setTelefone}
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
        <Campo rotulo="Senha" valor={senha} aoMudar={setSenha} erro={erros.senha} placeholder="••••••" segura />

        <Botao titulo="Criar conta" onPress={aoCadastrar} style={styles.botao} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  conteudo: { padding: espaco.lg },
  botao: { marginTop: espaco.md },
});
