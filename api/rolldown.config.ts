import { defineConfig } from 'rolldown';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { dependencies } = require('./package.json') as { dependencies: Record<string, string> };

// Tudo que veio do npm fica externo e é resolvido em node_modules no servidor.
// A exceção é `@divine/shared`: é TypeScript sem build próprio, então precisa
// ser embutido no bundle — o Node não saberia resolvê-lo a partir de `dist/`.
const externos = Object.keys(dependencies).filter((nome) => nome !== '@divine/shared');

export default defineConfig({
  input: 'src/index.ts',
  platform: 'node',
  external: [/^node:/, ...externos.map((nome) => new RegExp(`^${nome}(/|$)`))],
  output: {
    dir: 'dist',
    format: 'esm',
    entryFileNames: 'index.js',
  },
});
