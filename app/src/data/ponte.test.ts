import { expect, test } from 'bun:test';
import { PONTE } from '@divine/shared';

test('o app resolve o workspace compartilhado', () => {
  expect(PONTE).toBe('shared-ok');
});
