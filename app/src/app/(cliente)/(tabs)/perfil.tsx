import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Cabecalho } from '@/components/Cabecalho';
import { Campo } from '@/components/Campo';
import { Cartao } from '@/components/Cartao';
import { LinhaResumo } from '@/components/LinhaResumo';
import { Texto } from '@/components/Texto';
import { MapPin } from '@/components/icones';
import { useAuth } from '@/state/AuthContext';
import { usePedidos } from '@/state/PedidosContext';
import { cores, espaco } from '@/theme';

export default function Perfil() {
  const { usuario, atualizarUsuario, adicionarEndereco, sair } = useAuth();
  const { pedidos } = usePedidos();

  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [telefone, setTelefone] = useState(usuario?.telefone ?? '');
  const [erroNome, setErroNome] = useState('');
  const [erroTelefone, setErroTelefone] = useState('');
  const [novoEndereco, setNovoEndereco] = useState('');

  const meusPedidos = pedidos.filter((p) => p.clienteNome === usuario?.nome);

  function abrirEdicao() {
    setNome(usuario?.nome ?? '');
    setEmail(usuario?.email ?? '');
    setTelefone(usuario?.telefone ?? '');
    setErroNome('');
    setErroTelefone('');
    setEditando(true);
  }

  function salvar() {
    const problemaNome = nome.trim() ? '' : 'Campo obrigatório';
    const problemaTelefone = telefone.trim() ? '' : 'Campo obrigatório';

    setErroNome(problemaNome);
    setErroTelefone(problemaTelefone);
    if (problemaNome || problemaTelefone) return;

    atualizarUsuario({ nome: nome.trim(), email: email.trim(), telefone });
    setEditando(false);
  }

  function adicionar() {
    adicionarEndereco(novoEndereco);
    setNovoEndereco('');
  }

  function sairDaConta() {
    sair();
    router.replace('/(auth)/login');
  }

  return (
    <View style={styles.tela}>
      <Cabecalho titulo="Perfil" subtitulo={usuario?.email} />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <Cartao style={styles.cartao}>
          <View style={styles.tituloLinha}>
            <Texto peso="semibold">Dados pessoais</Texto>
            {!editando && (
              <Pressable onPress={abrirEdicao} hitSlop={8}>
                <Texto variante="legenda" peso="semibold" cor={cores.vinhoClaro}>
                  Editar
                </Texto>
              </Pressable>
            )}
          </View>

          {editando ? (
            <View style={styles.formulario}>
              <Campo rotulo="Nome" valor={nome} aoMudar={setNome} erro={erroNome} />
              <Campo rotulo="E-mail" valor={email} aoMudar={setEmail} teclado="email-address" />
              <Campo
                rotulo="Telefone"
                valor={telefone}
                aoMudar={setTelefone}
                erro={erroTelefone}
                teclado="phone-pad"
              />
              <View style={styles.botoesLinha}>
                <Botao titulo="Salvar" onPress={salvar} style={styles.botaoMeio} />
                <Botao
                  titulo="Cancelar"
                  variante="secundario"
                  onPress={() => setEditando(false)}
                  style={styles.botaoMeio}
                />
              </View>
            </View>
          ) : (
            <>
              <LinhaResumo rotulo="Nome" valor={usuario?.nome ?? ''} />
              <LinhaResumo rotulo="E-mail" valor={usuario?.email ?? ''} />
              <LinhaResumo rotulo="Telefone" valor={usuario?.telefone ?? ''} />
            </>
          )}
        </Cartao>

        <Cartao style={styles.cartao}>
          <Texto peso="semibold">Endereços salvos</Texto>

          {usuario && usuario.enderecos.length > 0 ? (
            usuario.enderecos.map((endereco) => (
              <View key={endereco} style={styles.endereco}>
                <MapPin size={18} color={cores.vinho} strokeWidth={2} />
                <Texto style={styles.enderecoTexto}>{endereco}</Texto>
              </View>
            ))
          ) : (
            <Texto variante="legenda" cor={cores.cinzaEscuro} style={styles.vazio}>
              Nenhum endereço salvo ainda.
            </Texto>
          )}

          <Campo
            rotulo="Novo endereço"
            valor={novoEndereco}
            aoMudar={setNovoEndereco}
            placeholder="Rua, número, bairro"
          />
          <Botao titulo="Adicionar" variante="secundario" onPress={adicionar} />
        </Cartao>

        <Cartao style={styles.cartao}>
          <Texto peso="semibold">Resumo da conta</Texto>
          <LinhaResumo rotulo="Pedidos feitos" valor={String(meusPedidos.length)} />
          <Pressable onPress={() => router.push('/(cliente)/(tabs)/pedidos')} hitSlop={8}>
            <Texto variante="legenda" peso="semibold" cor={cores.vinhoClaro}>
              Ver histórico completo
            </Texto>
          </Pressable>
        </Cartao>

        <Botao titulo="Sair da conta" variante="perigo" onPress={sairDaConta} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  conteudo: { padding: espaco.md, gap: espaco.md, paddingBottom: espaco.xxl },
  cartao: { padding: espaco.md },
  tituloLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formulario: { marginTop: espaco.md },
  botoesLinha: { flexDirection: 'row', gap: espaco.sm },
  botaoMeio: { flex: 1 },
  endereco: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm, paddingVertical: espaco.sm },
  enderecoTexto: { flexShrink: 1 },
  vazio: { paddingVertical: espaco.sm },
});
