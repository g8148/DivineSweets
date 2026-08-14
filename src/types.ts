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
  imagem: number;
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

export type Pedido = {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  personalizacao: Personalizacao;
  entrega: Entrega;
  total: number;
  status: StatusPedido;
  criadoEm: string;
  motivoRecusa?: string;
};

export type Perfil = 'cliente' | 'admin';

export type Usuario = {
  nome: string;
  email: string;
  telefone: string;
  perfil: Perfil;
  enderecos: string[];
};
