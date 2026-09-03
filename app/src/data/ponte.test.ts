import test from 'node:test';
import assert from 'node:assert/strict';
import { TAXA_ENTREGA, formatarMoeda } from '@divine/shared';

// Guarda a resolução do workspace compartilhado a partir do app. Se o Metro ou
// o Node perderem o caminho para `shared/`, isto quebra antes das telas.
test('o app resolve o workspace compartilhado', () => {
  assert.strictEqual(TAXA_ENTREGA, 1000);
  assert.strictEqual(formatarMoeda(TAXA_ENTREGA), 'R$ 10,00');
});
