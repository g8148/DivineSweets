import { StyleSheet, View } from 'react-native';
import { Texto } from '@/components/Texto';
import { Cake } from '@/components/icones';
import { cores, espaco } from '@/theme';

export function Vazio({ mensagem }: { mensagem: string }) {
  return (
    <View style={styles.base}>
      <Cake size={48} color={cores.cinza} strokeWidth={2} />
      <Texto cor={cores.cinzaEscuro} style={styles.mensagem}>
        {mensagem}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { padding: espaco.xl, alignItems: 'center', justifyContent: 'center' },
  mensagem: { marginTop: espaco.md, textAlign: 'center' },
});
