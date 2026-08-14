import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Texto } from '@/components/Texto';
import { cores, espaco, raio } from '@/theme';


type Variante = 'primario' | 'secundario' | 'perigo';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  desabilitado?: boolean;
  style?: ViewStyle;
  icone?: ReactNode;
};

const fundo: Record<Variante, string> = {
  primario: cores.vinho,
  secundario: cores.rosaCreme,
  perigo: cores.alerta,
};

const texto: Record<Variante, string> = {
  primario: cores.branco,
  secundario: cores.vinho,
  perigo: cores.alertaTexto,
};

export function Botao({
  titulo,
  onPress,
  variante = 'primario',
  desabilitado = false,
  style,
  icone,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: desabilitado ? cores.cinza : fundo[variante],
          opacity: pressed ? 0.85 : 1,
          // Sem a borda, o secundário some quando o fundo da tela também é
          // rosa (a tela de pedido confirmado, por exemplo).
          borderColor: variante === 'secundario' && !desabilitado ? cores.borda : 'transparent',
        },
        style,
      ]}
    >
      {icone}
      <Texto peso="semibold" cor={desabilitado ? cores.branco : texto[variante]}>
        {titulo}
      </Texto>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: espaco.md,
    paddingHorizontal: espaco.lg,
    borderRadius: raio.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: espaco.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
