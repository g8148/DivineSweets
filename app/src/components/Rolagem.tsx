import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { espaco } from '@/theme';
import type { ComponentProps } from 'react';

type Props = ComponentProps<typeof KeyboardAwareScrollView>;

/**
 * A rolagem das telas com campo de digitar.
 *
 * No Android o app é desenhado de ponta a ponta, por baixo das barras do
 * sistema, e o teclado sobe *em cima* do conteúdo: o campo que estava no fim da
 * tela some atrás dele e a pessoa digita às cegas. Esta rolagem escuta a altura
 * do teclado e leva o campo em foco para cima dele.
 *
 * É o componente que a documentação do Expo recomenda para formulários. O
 * `KeyboardAvoidingView` do React Native, que seria a alternativa, precisa de
 * ajuste diferente por plataforma e é justamente no modo ponta a ponta que ele
 * erra a conta.
 */
export function Rolagem(props: Props) {
  return (
    // A folga entre o campo e o teclado: colado no teclado o campo fica legível
    // mas o erro logo abaixo dele, não.
    <KeyboardAwareScrollView bottomOffset={espaco.lg} {...props} />
  );
}
