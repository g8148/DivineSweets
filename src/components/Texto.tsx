import { StyleSheet, Text, type TextProps } from 'react-native';
import { cores, fonte, tamanhoFonte } from '@/theme';

type Variante = 'titulo' | 'subtitulo' | 'corpo' | 'legenda' | 'preco';
type Peso = 'regular' | 'semibold' | 'bold';

type Props = TextProps & {
  variante?: Variante;
  peso?: Peso;
  cor?: string;
};

export function Texto({ variante = 'corpo', peso = 'regular', cor = cores.vinho, style, ...rest }: Props) {
  return (
    <Text
      style={[
        styles.base,
        { fontSize: tamanhoFonte[variante], fontFamily: fonte[peso], color: cor },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});
