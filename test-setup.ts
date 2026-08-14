// `bun test` roda os módulos de dados fora do Metro, e `src/data/produtos.ts`
// usa `require()` de imagens. O Metro resolve isso para um número (o id do
// asset); o bun tentaria interpretar o .jpg como código e quebraria. Este
// plugin reproduz o comportamento do Metro para os testes.
import { plugin } from 'bun';

plugin({
  name: 'imagens-como-asset-id',
  setup(build) {
    build.onLoad({ filter: /\.(jpe?g|png)$/ }, () => ({
      contents: 'module.exports = 1;',
      loader: 'js',
    }));
  },
});
