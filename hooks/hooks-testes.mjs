// Hooks de módulo para `node --test`.
//
// Duas coisas que o Metro faz no app e o Node não faz sozinho:
//
// 1. Resolver o alias `@/` do tsconfig. O Node ignora `compilerOptions.paths`,
//    então os imports `@/data/...` dos testes precisam ser mapeados à mão.
// 2. Tratar imagens importadas como um id de asset. O Metro devolve um número;
//    o Node tentaria interpretar o .jpg como código e quebraria. O `require()`
//    de imagem dentro de um .ts era reescrito aqui também, por causa do
//    `data/imagens.ts`; o arquivo saiu quando as fotos passaram a vir da API.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Os hooks vivem na raiz do monorepo; o alias `@/` é do workspace do app.
const raizApp = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'app');
const EXTENSOES = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];

function resolverAlias(especificador) {
  const relativo = especificador.slice(2);
  // `@/assets/*` aponta para a raiz do app; `@/*` aponta para `src/`.
  const base = relativo.startsWith('assets/') ? raizApp : path.join(raizApp, 'src');
  const bruto = path.join(base, relativo);

  for (const extensao of EXTENSOES) {
    const tentativa = bruto + extensao;
    if (existsSync(tentativa)) return pathToFileURL(tentativa).href;
  }
  return null;
}

// O Metro e o TypeScript aceitam import relativo sem extensão; o Node ESM não.
function resolverSemExtensao(especificador, contexto) {
  if (!especificador.startsWith('.') || !contexto.parentURL) return null;

  const base = path.dirname(fileURLToPath(contexto.parentURL));
  const bruto = path.resolve(base, especificador);

  for (const extensao of EXTENSOES.slice(1)) {
    const tentativa = bruto + extensao;
    if (existsSync(tentativa)) return pathToFileURL(tentativa).href;
  }
  return null;
}

export async function resolve(especificador, contexto, proximo) {
  if (especificador.startsWith('@/')) {
    const url = resolverAlias(especificador);
    if (url) {
      const ehImagem = /\.(jpe?g|png)$/i.test(url);
      return { url, format: ehImagem ? 'commonjs' : undefined, shortCircuit: true };
    }
  }

  const semExtensao = resolverSemExtensao(especificador, contexto);
  if (semExtensao) return { url: semExtensao, shortCircuit: true };

  return proximo(especificador, contexto);
}

export async function load(url, contexto, proximo) {
  if (/\.(jpe?g|png)$/i.test(url)) {
    return { format: 'commonjs', source: 'module.exports = 1;', shortCircuit: true };
  }

  return proximo(url, contexto);
}
