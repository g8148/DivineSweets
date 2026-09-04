// Converte as fotos do bundle do app para as imagens de seed da API.
// O mapa id -> arquivo é lido de app/src/data/imagens.ts: sete dos catorze
// nomes de arquivo não batem com o id do produto (buquet -> buque-doces,
// natal-normal -> panetone, ...), então derivar por nome erraria a metade.
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const raiz = '/home/hay/unoesc/DivineSweets';
const fonte = readFileSync(path.join(raiz, 'app/src/data/imagens.ts'), 'utf8');
const mapa = [...fonte.matchAll(/'([^']+)':\s*require\('@\/assets\/produtos\/([^']+)'\)/g)];

const destino = path.join(raiz, 'api/seed-assets/produtos');
mkdirSync(destino, { recursive: true });

for (const [, id, arquivo] of mapa) {
  const saida = path.join(destino, `${id}.webp`);
  const info = await sharp(path.join(raiz, 'app/assets/produtos', arquivo))
    .resize(800, 800, { fit: 'cover' })
    .webp({ quality: 82 })
    .toFile(saida);
  console.log(`${arquivo} -> ${id}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)}kB`);
}
console.log(`\n${mapa.length} imagens convertidas.`);
