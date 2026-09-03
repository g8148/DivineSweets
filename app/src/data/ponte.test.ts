import test from 'node:test';
import assert from 'node:assert/strict';
import { PONTE } from '@divine/shared';

test('o app resolve o workspace compartilhado', () => {
  assert.strictEqual(PONTE, 'shared-ok');
});
