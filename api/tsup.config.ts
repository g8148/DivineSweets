import { defineConfig } from 'tsup';

// `noExternal` embute o `shared/`, que é TypeScript sem build próprio e não
// pode ser resolvido em runtime pelo Node a partir de `dist/`.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  clean: true,
  noExternal: ['@divine/shared'],
});
