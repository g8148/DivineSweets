import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useMeusPedidos } from '@/api/pedidos';
import { useAuth } from '@/auth/useAuth';
import { Botao } from '@/components/Botao';
import { Cabecalho } from '@/components/Cabecalho';
import { Cartao } from '@/components/Cartao';
import { LinhaResumo } from '@/components/LinhaResumo';
import { Texto } from '@/components/Texto';
import { cores, espaco } from '@/theme';

export default function Perfil() {
  const { usuario, sair } = useAuth();
  const { data: pedidos, isPending } = useMeusPedidos();

  async function sairDaConta() {
    // `sair` limpa o cache do Query junto com a sessão; sem isso o próximo
    // login enxergaria os pedidos de quem saiu.
    await sair();
    router.replace('/(auth)/login');
  }

  return (
    <View style={styles.tela}>
      <Cabecalho titulo="Perfil" subtitulo={usuario?.email} />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <Cartao style={styles.cartao}>
          {/* Somente leitura: a API não expõe edição de perfil, e um formulário
              que não salva em lugar nenhum seria pior do que não existir. */}
          <Texto peso="semibold">Dados pessoais</Texto>
          <LinhaResumo rotulo="Nome" valor={usuario?.nome ?? ''} />
          <LinhaResumo rotulo="E-mail" valor={usuario?.email ?? ''} />
          <LinhaResumo rotulo="Telefone" valor={usuario?.telefone ?? ''} />
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.branco },
  conteudo: { padding: espaco.md, gap: espaco.md, paddingBottom: espaco.xxl },
  cartao: { padding: espaco.md },
  carregando: { alignSelf: 'flex-start', paddingVertical: espaco.sm },
});
