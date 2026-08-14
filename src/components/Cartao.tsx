import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { cores, raio, sombra } from '@/theme';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
};

export function Cartao({ children, onPress, style }: Props) {
  if (!onPress) {
    return <View style={[styles.base, style]}>{children}</View>;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.base, { opacity: pressed ? 0.9 : 1 }, style]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: cores.branco,
    borderRadius: raio.lg,
    borderWidth: 1,
    borderColor: cores.borda,
    overflow: 'hidden',
    ...sombra,
  },
});
