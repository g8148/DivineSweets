// Hooks de módulo para `node --test`.
//
// Duas coisas que o Metro faz no app e o Node não faz sozinho:
//
// 1. Resolver o alias `@/` do tsconfig. O Node ignora `compilerOptions.paths`,
//    então os imports `@/data/...` dos testes precisam ser mapeados à mão.
// 2. Tratar imagens importadas como um id de asset. O Metro devolve um número;
//    o Node tentaria interpretar o .jpg como código e quebraria.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raizApp = path.dirname(fileURLToPath(import.meta.url));
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

export async function resolve(especificador, contexto, proximo) {
  if (especificador.startsWith('@/')) {
    const url = resolverAlias(especificador);
    if (url) return { url, format: /\.(jpe?g|png)$/i.test(url) ? 'commonjs' : undefined, shortCircuit: true };
  }
  return proximo(especificador, contexto);
}

export async function load(url, contexto, proximo) {
  if (/\.(jpe?g|png)$/i.test(url)) {
    return { format: 'commonjs', source: 'module.exports = 1;', shortCircuit: true };
  }

  const resultado = await proximo(url, contexto);

  // `src/data/produtos.ts` chama `require()` em imagens, um idioma do Metro que
  // não existe em módulo ES. O Metro devolve o id numérico do asset; aqui a
  // chamada vira o mesmo literal. Some junto com o catálogo local na Task 2.
  if (url.endsWith('.ts') && resultado.source) {
    const fonte = resultado.source.toString();
    if (fonte.includes('require(')) {
      return {
        ...resultado,
        source: fonte.replace(/require\((['"])@\/assets\/[^'"]+\1\)/g, '1'),
      };
    }
  }

  return resultado;
}
