import { Image } from 'expo-image';
import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '@/auth/useAuth';
import { Texto } from '@/components/Texto';
import { cores, espaco } from '@/theme';

export default function Splash() {
  const { usuario, carregando } = useAuth();

  // A sessão vem do SecureStore, que é assíncrono. Enquanto ela não resolve, a
  // marca fica na tela: sem esta espera o app piscaria o login antes de
  // reconhecer quem já estava logado. O tempo mínimo de 1,2s do protótipo saiu
  // — agora a espera é a real, e não uma encenação.
  if (!carregando) {
    if (!usuario) return <Redirect href="/(auth)/login" />;
    return (
      <Redirect
        href={usuario.perfil === 'admin' ? '/(admin)/(tabs)/pedidos' : '/(cliente)/(tabs)/catalogo'}
      />
    );
  }

  return (
    <View style={styles.tela}>
      <Image source={require('@/assets/logomarca.jpg')} style={styles.logo} contentFit="cover" />
      <Texto variante="titulo" peso="bold" style={styles.nome}>
        Divine Sweets
      </Texto>
      <Texto cor={cores.vinhoClaro}>Doceria Afetiva</Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.rosaCreme },
  logo: { width: 140, height: 140, borderRadius: 70 },
  nome: { marginTop: espaco.lg },
});
