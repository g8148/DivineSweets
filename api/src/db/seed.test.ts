import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogo, grupos } from '@divine/shared';
import { db } from './client.ts';
import { opcoes, produtos, produtosGrupos } from './schema.ts';
import { semear } from './seed.ts';

// Por id, e não por contagem: os testes de administração criam produtos
// temporários em paralelo, e um total exato acusaria falha por causa deles.
async function idsNoBanco() {
  return new Set((await db.select({ id: produtos.id }).from(produtos)).map((l) => l.id));
}

test('semear popula os 14 produtos do catálogo', async () => {
  await semear();
  const ids = await idsNoBanco();
  for (const produto of catalogo) {
    assert.ok(ids.has(produto.id), `${produto.id} faltou no banco`);
  }
});

// Rodar o seed faz parte do deploy. Se ele duplicasse, cada publicação
// multiplicaria o catálogo em vez de atualizá-lo. As contagens ignoram o que
// não veio do catálogo: os testes de administração criam produtos e vínculos
// temporários em paralelo com este arquivo.
test('semear é idempotente: rodar duas vezes não duplica', async () => {
  await semear();
  await semear();

  const idsDoCatalogo = new Set(catalogo.map((p) => p.id));
  const linhas = (await db.select({ id: produtos.id }).from(produtos)).filter((l) =>
    idsDoCatalogo.has(l.id),
  );
  assert.strictEqual(linhas.length, catalogo.length);

  const totalOpcoes = Object.values(grupos).reduce((n, g) => n + g.opcoes.length, 0);
  assert.strictEqual((await db.select().from(opcoes)).length, totalOpcoes);

  const totalVinculos = catalogo.reduce((n, p) => n + p.gruposIds.length, 0);
  const vinculos = (await db.select().from(produtosGrupos)).filter((v) =>
    idsDoCatalogo.has(v.produtoId),
  );
  assert.strictEqual(vinculos.length, totalVinculos);
});

const doCatalogo = (linha: { id: string }) => catalogo.some((p) => p.id === linha.id);

test('os preços chegam ao banco em centavos', async () => {
  await semear();
  const linhas = (await db.select().from(produtos)).filter(doCatalogo);
  for (const linha of linhas) {
    assert.ok(Number.isInteger(linha.precoBase), `${linha.id} não é inteiro`);
    // O produto mais barato do catálogo passa de R$ 10,00; um valor abaixo
    // disso denunciaria preço gravado em reais.
    assert.ok(linha.precoBase > 1000, `${linha.id} = ${linha.precoBase} parece estar em reais`);
  }
});

test('todo produto aponta para uma imagem em /uploads', async () => {
  await semear();
  const linhas = (await db.select().from(produtos)).filter(doCatalogo);
  for (const linha of linhas) {
    assert.match(linha.imagemUrl ?? '', /^\/uploads\/produtos\/.+\.webp$/);
  }
});
