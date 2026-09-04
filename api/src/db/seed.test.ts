import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogo, grupos } from '@divine/shared';
import { db } from './client.ts';
import { opcoes, produtos, produtosGrupos } from './schema.ts';
import { semear } from './seed.ts';

test('semear popula os 14 produtos do catálogo', async () => {
  await semear();
  const linhas = await db.select().from(produtos);
  assert.strictEqual(linhas.length, catalogo.length);
});

// Rodar o seed faz parte do deploy. Se ele duplicasse, cada publicação
// multiplicaria o catálogo em vez de atualizá-lo.
test('semear é idempotente: rodar duas vezes não duplica', async () => {
  await semear();
  await semear();
  const linhas = await db.select().from(produtos);
  assert.strictEqual(linhas.length, catalogo.length);
  const totalOpcoes = Object.values(grupos).reduce((n, g) => n + g.opcoes.length, 0);
  assert.strictEqual((await db.select().from(opcoes)).length, totalOpcoes);
  const totalVinculos = catalogo.reduce((n, p) => n + p.gruposIds.length, 0);
  assert.strictEqual((await db.select().from(produtosGrupos)).length, totalVinculos);
});

test('os preços chegam ao banco em centavos', async () => {
  await semear();
  const linhas = await db.select().from(produtos);
  for (const linha of linhas) {
    assert.ok(Number.isInteger(linha.precoBase), `${linha.id} não é inteiro`);
    // O produto mais barato do catálogo passa de R$ 10,00; um valor abaixo
    // disso denunciaria preço gravado em reais.
    assert.ok(linha.precoBase > 1000, `${linha.id} = ${linha.precoBase} parece estar em reais`);
  }
});

test('todo produto aponta para uma imagem em /uploads', async () => {
  await semear();
  const linhas = await db.select().from(produtos);
  for (const linha of linhas) {
    assert.match(linha.imagemUrl ?? '', /^\/uploads\/produtos\/.+\.webp$/);
  }
});
