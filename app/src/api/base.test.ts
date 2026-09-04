import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError, montarUrl } from './base';

process.env.EXPO_PUBLIC_API_URL = 'http://192.168.0.10:8100/';

test('monta a URL a partir da base configurada', () => {
  assert.match(montarUrl('/api/produtos'), /\/api\/produtos$/);
});

// A base vem de uma variável de ambiente e costuma ser digitada à mão com barra
// no fim. Sem a normalização, a URL sairia com "//api/produtos".
test('barra sobrando na base não vira barra dupla', () => {
  assert.strictEqual(montarUrl('/api/produtos').includes('//api/'), false);
});

test('ApiError carrega status e código para a tela decidir a mensagem', () => {
  const erro = new ApiError(409, 'Data indisponível', 'data_indisponivel');
  assert.strictEqual(erro.status, 409);
  assert.strictEqual(erro.codigo, 'data_indisponivel');
  assert.strictEqual(erro.message, 'Data indisponível');
  assert.ok(erro instanceof Error);
});

// Sem a variável, todo fetch iria para um caminho relativo e falharia com
// "Network request failed" — mensagem que não diz o que houve nem como
// corrigir. É o erro mais provável de quem clona o repositório.
test('base ausente falha dizendo o que configurar', () => {
  const anterior = process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_API_URL;
  try {
    assert.throws(() => montarUrl('/api/produtos'), /EXPO_PUBLIC_API_URL/);
  } finally {
    process.env.EXPO_PUBLIC_API_URL = anterior;
  }
});
