// As fotos dos produtos moram no bundle enquanto o catálogo é local. A partir
// da Task 18 o catálogo vem da API e cada produto traz sua própria URL; este
// mapa some junto.
const IMAGENS: Record<string, number> = {
  'cookie-pistache': require('@/assets/produtos/cookie-pistache.jpg'),
  'cookie-chocomenta': require('@/assets/produtos/cookie-chocomenta.jpg'),
  'cookie-limao-morango': require('@/assets/produtos/cookie-limao-morango.jpg'),
  'cookie-choco-laranja': require('@/assets/produtos/cookie-choco-laranja.jpg'),
  'cookie-brigadeiro-bacon': require('@/assets/produtos/cookie-brigadeiro-bacon.jpg'),
  'cookie-amendoim': require('@/assets/produtos/cookie-amendoim-1.jpeg'),
  'cookie-sonho-de-valsa': require('@/assets/produtos/cookies-sonho-de-valsa.jpg'),
  'bolo-chocolate': require('@/assets/produtos/chocolate-tradicional.jpg'),
  'bolo-decorado': require('@/assets/produtos/decorado.jpg'),
  'brownie': require('@/assets/produtos/brownie.jpg'),
  'buque-doces': require('@/assets/produtos/buquet.jpeg'),
  'ovo-pascoa': require('@/assets/produtos/ovo-pascoa.jpg'),
  'panetone': require('@/assets/produtos/natal-normal.jpg'),
  'biscoito-natal': require('@/assets/produtos/natal-pintado.jpg'),
};

export const IMAGEM_PADRAO = require('@/assets/logomarca.jpg');

export function imagemDoProduto(id: string): number {
  return IMAGENS[id] ?? IMAGEM_PADRAO;
}
