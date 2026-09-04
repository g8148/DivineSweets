export type Categoria = 'cookies' | 'bolos' | 'brownies' | 'sazonais';

export type Opcao = {
  id: string;
  nome: string;
  delta: number;
};

export type GrupoOpcao = {
  id: string;
  titulo: string;
  obrigatorio: boolean;
  opcoes: Opcao[];
};

export type Produto = {
  id: string;
  nome: string;
  categoria: Categoria;
  descricao: string;
  precoBase: number;
  gruposIds: string[];
  permiteMensagem: boolean;
  permiteFoto: boolean;
};

export type Personalizacao = {
  produtoId: string;
  quantidade: number;
  selecoes: Record<string, string>;
  mensagem: string;
  fotoUri: string | null;
};

export type Entrega = {
  tipo: 'entrega' | 'retirada';
  data: string;
  hora: string;
  endereco: string;
};

export type StatusPedido = 'recebido' | 'producao' | 'pronto' | 'entregue' | 'recusado';

// O pedido em si não é tipado aqui: o formato que vale é o `pedidoSchema` de
// `schemas.ts`, que é o mesmo que a API publica. Um segundo tipo de pedido neste
// arquivo seria uma cópia divergindo em silêncio.

export type Agenda = {
  datasBloqueadas: string[];
  limitePorDia: number;
};
