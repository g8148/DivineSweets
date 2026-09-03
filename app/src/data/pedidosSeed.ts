import { paraISO } from '@divine/shared';
import type { Pedido } from '@divine/shared';

function daquiADias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return paraISO(d);
}

export const pedidosSeed: Pedido[] = [
  {
    id: 'ped-001',
    clienteNome: 'Mariana Alves',
    clienteTelefone: '(49) 99912-4477',
    personalizacao: {
      produtoId: 'bolo-decorado',
      quantidade: 1,
      selecoes: {
        'tamanho-bolo': 'bolo-1-5kg',
        'sabor-massa': 'massa-red-velvet',
        recheio: 'recheio-ninho-nutella',
        cobertura: 'cobertura-pasta',
      },
      mensagem: 'Parabéns, Helena!',
      fotoUri: null,
    },
    entrega: { tipo: 'entrega', data: daquiADias(3), hora: '14:00', endereco: 'Rua das Flores, 220 — Centro' },
    total: 33200,
    status: 'producao',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'ped-002',
    clienteNome: 'Rafael Boeing',
    clienteTelefone: '(49) 99845-1290',
    personalizacao: {
      produtoId: 'cookie-brigadeiro-bacon',
      quantidade: 2,
      selecoes: { 'tamanho-caixa': 'caixa-12' },
      mensagem: '',
      fotoUri: null,
    },
    entrega: { tipo: 'retirada', data: daquiADias(4), hora: '09:30', endereco: '' },
    total: 21600,
    status: 'recebido',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'ped-003',
    clienteNome: 'Juliana Petry',
    clienteTelefone: '(49) 99701-8834',
    personalizacao: {
      produtoId: 'buque-doces',
      quantidade: 1,
      selecoes: { 'tamanho-buque': 'buque-m' },
      mensagem: 'Com carinho, da equipe',
      fotoUri: null,
    },
    entrega: { tipo: 'entrega', data: daquiADias(2), hora: '17:00', endereco: 'Av. Nereu Ramos, 1150' },
    total: 13400,
    status: 'pronto',
    criadoEm: new Date().toISOString(),
  },
];
