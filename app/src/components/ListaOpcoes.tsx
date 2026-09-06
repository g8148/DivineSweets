import { Seletor } from '@/components/Seletor';
import { formatarMoeda } from '@divine/shared';
import type { Opcao } from '@divine/shared';

type Props = {
  opcoes: Opcao[];
  selecionadaId: string | undefined;
  aoSelecionar: (opcaoId: string) => void;
};

/**
 * As opções de um grupo de personalização, no desenho do `Seletor`.
 *
 * O que este componente acrescenta é só o dinheiro: o acréscimo gravado no
 * banco vira o detalhe alinhado à direita, e a opção sem acréscimo não fica
 * mostrando "+ R$ 0,00".
 */
export function ListaOpcoes({ opcoes, selecionadaId, aoSelecionar }: Props) {
  return (
    <Seletor
      itens={opcoes.map((opcao) => ({
        id: opcao.id,
        rotulo: opcao.nome,
        detalhe: opcao.delta > 0 ? `+ ${formatarMoeda(opcao.delta)}` : undefined,
      }))}
      selecionadoId={selecionadaId}
      aoSelecionar={aoSelecionar}
    />
  );
}
