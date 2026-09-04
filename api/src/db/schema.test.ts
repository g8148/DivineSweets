import test from 'node:test';
import assert from 'node:assert/strict';
import { getTableColumns } from 'drizzle-orm';
import { pedidos, pedidoSelecoes, produtos } from './schema.ts';

test('valores monetários são inteiros, nunca decimais', () => {
  for (const coluna of [
    getTableColumns(produtos).precoBase,
    getTableColumns(pedidos).subtotal,
    getTableColumns(pedidos).taxaEntrega,
    getTableColumns(pedidos).total,
  ]) {
    assert.strictEqual(coluna.dataType, 'number');
    assert.strictEqual(coluna.columnType, 'PgInteger');
  }
});

test('a data de entrega é date, não timestamp', () => {
  assert.strictEqual(getTableColumns(pedidos).dataEntrega.columnType, 'PgDateString');
});

test('as seleções guardam snapshot, não só referência', () => {
  const colunas = getTableColumns(pedidoSelecoes);
  assert.ok(colunas.grupoTitulo);
  assert.ok(colunas.opcaoNome);
  assert.ok(colunas.delta);
});
