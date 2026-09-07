import { useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useMeusPedidos } from '@/api/pedidos';
import { useAuth } from '@/auth/useAuth';
import { Botao } from '@/components/Botao';
import { Cabecalho } from '@/components/Cabecalho';
import { Campo } from '@/components/Campo';
import { Cartao } from '@/components/Cartao';
import { LinhaResumo } from '@/components/LinhaResumo';
import { Rolagem } from '@/components/Rolagem';
import { Texto } from '@/components/Texto';
import { apenasDigitos, formatarTelefone, mascararTelefone } from '@divine/shared';
import { cores, espaco } from '@/theme';

export default function Perfil() {
  const { usuario, sair, atualizarPerfil } = useAuth();
  const { data: pedidos, isPending } = useMeusPedidos();

  const [editando, setEditando] = useState(false);

  async function sairDaConta() {
    // `sair` limpa o cache do Query junto com a sessão; sem isso o próximo
    // login enxergaria os pedidos de quem saiu.
    await sair();
    router.replace('/(auth)/login');
  }

  return (
    <View style={styles.tela}>
      <Cabecalho titulo="Perfil" subtitulo={usuario?.email} />

      {/* Rolagem, e não ScrollView: em edição há campos de digitar, e o teclado
          do Android sobe por cima deles. */}
      <Rolagem contentContainerStyle={styles.conteudo}>
        <Cartao style={styles.cartao}>
          <View style={styles.cabecalhoCartao}>
            <Texto peso="semibold">Dados pessoais</Texto>
            {editando ? null : (
              <Pressable onPress={() => setEditando(true)} hitSlop={8}>
                <Texto variante="legenda" peso="semibold" cor={cores.vinhoClaro}>
                  Editar
                </Texto>
              </Pressable>
            )}
          </View>

          {editando && usuario ? (
            <FormularioDados
              nomeInicial={usuario.nome}
              telefoneInicial={usuario.telefone}
              aoSalvar={atualizarPerfil}
              aoFechar={() => setEditando(false)}
            />
          ) : (
            <>
              <LinhaResumo rotulo="Nome" valor={usuario?.nome ?? ''} />
              <LinhaResumo rotulo="E-mail" valor={usuario?.email ?? ''} />
              <LinhaResumo rotulo="Telefone" valor={formatarTelefone(usuario?.telefone ?? '')} />
            </>
          )}
        </Cartao>

        <Cartao style={styles.cartao}>
          <Texto peso="semibold">Resumo da conta</Texto>
          {isPending ? (
            <ActivityIndicator color={cores.vinho} style={styles.carregando} />
          ) : (
            <LinhaResumo rotulo="Pedidos feitos" valor={String(pedidos?.length ?? 0)} />
          )}
          <Pressable onPress={() => router.push('/(cliente)/(tabs)/pedidos')} hitSlop={8}>
            <Texto variante="legenda" peso="semibold" cor={cores.vinhoClaro}>
              Ver histórico completo
            </Texto>
          </Pressable>
        </Cartao>

        <Botao titulo="Sair da conta" variante="perigo" onPress={sairDaConta} />
      </Rolagem>
    </View>
  );
}

/**
 * O e-mail não entra no formulário: é a identidade de login, e trocá-lo pediria
 * verificação do endereço novo. Nome e telefone são o que o próprio cliente
 * corrige — e o telefone é por onde a confeiteira liga quando o pedido fica
 * pronto, então um número errado custa caro.
 */
function FormularioDados({
  nomeInicial,
  telefoneInicial,
  aoSalvar,
  aoFechar,
}: {
  nomeInicial: string;
  telefoneInicial: string;
  aoSalvar: (dados: { nome: string; telefone: string }) => Promise<void>;
  aoFechar: () => void;
}) {
  const [nome, setNome] = useState(nomeInicial);
  const [telefone, setTelefone] = useState(mascararTelefone(telefoneInicial));
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState('');

  // Mesmas regras do cadastro: o telefone é guardado só com dígitos, e a
  // máscara existe apenas na tela.
  const digitos = apenasDigitos(telefone);
  const pendencias = {
    nome: !nome.trim() ? 'Campo obrigatório' : '',
    telefone: !digitos ? 'Campo obrigatório' : digitos.length < 10 ? 'Telefone inválido' : '',
  };
  const erros = tentouSalvar ? pendencias : { nome: '', telefone: '' };

  async function salvar() {
    setTentouSalvar(true);
    setAviso('');
    if (Object.values(pendencias).some(Boolean)) return;

    setSalvando(true);
    try {
      await aoSalvar({ nome: nome.trim(), telefone: digitos });
      aoFechar();
    } catch (erro) {
      setAviso(erro instanceof Error ? erro.message : 'Não foi possível salvar os dados');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.formulario}>
      <Campo
        rotulo="Nome"
        valor={nome}
        aoMudar={setNome}
        erro={erros.nome}
        placeholder="Seu nome completo"
      />
      <Campo
        rotulo="Telefone"
        valor={telefone}
        aoMudar={(digitado) => setTelefone(mascararTelefone(digitado))}
        erro={erros.telefone}
        placeholder="(49) 99999-0000"
        teclado="phone-pad"
      />

      {aviso ? (
        <Texto variante="legenda" cor={cores.alertaTexto} style={styles.aviso}>
          {aviso}
        </Texto>
      ) : null}

      <View style={styles.acoes}>
        <Botao
          titulo="Cancelar"
          variante="secundario"
          onPress={aoFechar}
          desabilitado={salvando}
          style={styles.acao}
        />
        <Botao
          titulo={salvando ? 'Salvando…' : 'Salvar'}
          onPress={salvar}
          desabilitado={salvando}
          style={styles.acao}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  conteudo: { padding: espaco.md, gap: espaco.md, paddingBottom: espaco.xxl },
  cartao: { padding: espaco.md },
  cabecalhoCartao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  carregando: { alignSelf: 'flex-start', paddingVertical: espaco.sm },
  formulario: { marginTop: espaco.sm },
  aviso: { marginBottom: espaco.sm },
  acoes: { flexDirection: 'row', gap: espaco.sm },
  acao: { flex: 1 },
});
