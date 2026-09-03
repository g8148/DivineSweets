import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { numeroPedido } from '@divine/shared';
import { Texto } from '@/components/Texto';
import { CircleCheck } from '@/components/icones';
import { cores, espaco } from '@/theme';

export default function Confirmado() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.tela}>
      <CircleCheck size={88} color={cores.vinho} strokeWidth={1.5} />

      <Texto variante="titulo" peso="bold" style={styles.titulo}>
        Pedido confirmado!
      </Texto>

      <Texto peso="semibold">Pedido #{numeroPedido(id)}</Texto>

      <Texto cor={cores.cinzaEscuro} style={styles.texto}>
        A confeiteira já recebeu seu pedido e vai começar a produção. Você acompanha o andamento em Meus
        Pedidos.
      </Texto>

      <View style={styles.botoes}>
        <Botao titulo="Acompanhar pedido" onPress={() => router.replace(`/(cliente)/pedido/${id}`)} />
        <Botao
          titulo="Voltar ao catálogo"
          variante="secundario"
          onPress={() => router.replace('/(cliente)/(tabs)/catalogo')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.rosaCreme,
    padding: espaco.lg,
  },
  titulo: { marginTop: espaco.lg, textAlign: 'center' },
  texto: { marginTop: espaco.md, textAlign: 'center', lineHeight: 22 },
  botoes: { alignSelf: 'stretch', gap: espaco.sm, marginTop: espaco.xl },
});
