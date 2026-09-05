import test from 'node:test';
import assert from 'node:assert/strict';
import {
  apenasDigitos,
  centavosDeTexto,
  descreverSelecoesDeGrupos,
  formatarCentavos,
  formatarData,
  formatarMoeda,
  formatarTelefone,
  mascararMoeda,
  mascararTelefone,
  paraISO,
} from './format.ts';

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

test('máscara de telefone se acomoda ao comprimento enquanto se digita', () => {
  assert.strictEqual(mascararTelefone(''), '');
  assert.strictEqual(mascararTelefone('4'), '(4');
  assert.strictEqual(mascararTelefone('49'), '(49');
  assert.strictEqual(mascararTelefone('4999'), '(49) 99');
  // Oito dígitos depois do DDD ainda são um fixo: 4+4.
  assert.strictEqual(mascararTelefone('4933221100'), '(49) 3322-1100');
  // O nono dígito reacomoda o corte para 5+4.
  assert.strictEqual(mascararTelefone('49999990000'), '(49) 99999-0000');
});

test('máscara de telefone ignora o que passa de onze dígitos', () => {
  assert.strictEqual(mascararTelefone('4999999000012345'), '(49) 99999-0000');
  assert.strictEqual(mascararTelefone('(49) 99999-0000'), '(49) 99999-0000');
});

// O que está gravado no banco é só dígito. Quem veio de outro formato — um
// cadastro antigo, um número estrangeiro — aparece cru: recortado no lugar
// errado seria pior do que sem pontuação.
test('telefone só ganha máscara quando tem cara de brasileiro', () => {
  assert.strictEqual(formatarTelefone('49999990000'), '(49) 99999-0000');
  assert.strictEqual(formatarTelefone('4933221100'), '(49) 3322-1100');
  assert.strictEqual(formatarTelefone('123'), '123');
  assert.strictEqual(formatarTelefone('+1 202 555 0100 ramal 7'), '+1 202 555 0100 ramal 7');
  assert.strictEqual(formatarTelefone(''), '');
});

test('máscara de dinheiro preenche pela direita', () => {
  assert.strictEqual(mascararMoeda(''), '');
  assert.strictEqual(mascararMoeda('4'), '0,04');
  assert.strictEqual(mascararMoeda('450'), '4,50');
  assert.strictEqual(mascararMoeda('123450'), '1.234,50');
  // Apagar um dígito de "12,34" devolve "1,23": o texto reentra na máscara.
  assert.strictEqual(mascararMoeda('12,3'), '1,23');
});

test('centavos saem do texto mascarado', () => {
  assert.strictEqual(centavosDeTexto('1.234,50'), 123450);
  assert.strictEqual(centavosDeTexto('0,04'), 4);
  assert.strictEqual(centavosDeTexto(''), null);
  assert.strictEqual(centavosDeTexto('R$'), null);
});

test('centavos sem o cifrão para os campos que já dizem a moeda', () => {
  assert.strictEqual(formatarCentavos(123450), '1.234,50');
  assert.strictEqual(formatarCentavos(5), '0,05');
});

test('só os dígitos sobrevivem à limpeza', () => {
  assert.strictEqual(apenasDigitos('(49) 99999-0000'), '49999990000');
  assert.strictEqual(apenasDigitos('R$ 1.234,50'), '123450');
});
