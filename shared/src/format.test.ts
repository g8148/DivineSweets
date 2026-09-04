import test from 'node:test';
import assert from 'node:assert/strict';
import { descreverSelecoesDeGrupos, formatarMoeda, formatarData, paraISO } from './format.ts';

test('formata centavos como reais com vírgula decimal', () => {
  assert.strictEqual(formatarMoeda(6200), 'R$ 62,00');
  assert.strictEqual(formatarMoeda(1000), 'R$ 10,00');
  assert.strictEqual(formatarMoeda(123456), 'R$ 1.234,56');
  assert.strictEqual(formatarMoeda(5), 'R$ 0,05');
});

test('formata data ISO como brasileira', () => {
  assert.strictEqual(formatarData('2026-08-13'), '13/08/2026');
});

test('converte Date para ISO local', () => {
  assert.strictEqual(paraISO(new Date(2026, 7, 13)), '2026-08-13');
});

const gruposDaApi = [
  { id: 'tamanho-bolo', titulo: 'Tamanho', opcoes: [{ id: 'bolo-1kg', nome: '1 kg' }] },
  { id: 'recheio', titulo: 'Recheio', opcoes: [{ id: 'recheio-ninho', nome: 'Ninho' }] },
];

test('descreve as seleções na ordem dos grupos do produto', () => {
  const descricao = descreverSelecoesDeGrupos(gruposDaApi, {
    recheio: 'recheio-ninho',
    'tamanho-bolo': 'bolo-1kg',
  });
  assert.deepStrictEqual(descricao, [
    { rotulo: 'Tamanho', valor: '1 kg' },
    { rotulo: 'Recheio', valor: 'Ninho' },
  ]);
});

// Rascunho aberto antes de a opção ser removida do catálogo. Exibir "undefined"
// no resumo do pedido seria pior do que omitir a linha.
test('seleção que não existe mais é omitida, e não exibida como vazia', () => {
  const descricao = descreverSelecoesDeGrupos(gruposDaApi, { 'tamanho-bolo': 'opcao-apagada' });
  assert.deepStrictEqual(descricao, []);
});
