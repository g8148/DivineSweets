import { useEffect } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Texto } from '@/components/Texto';
import { useAuth } from '@/state/AuthContext';
import { cores, espaco } from '@/theme';

export default function Splash() {
  const { usuario } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!usuario) {
        router.replace('/(auth)/login');
      } else if (usuario.perfil === 'admin') {
        router.replace('/(admin)/(tabs)/pedidos');
      } else {
        router.replace('/(cliente)/(tabs)/catalogo');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [usuario]);

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
