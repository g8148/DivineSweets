import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import test, { after } from 'node:test';
import sharp from 'sharp';
import { criarApp } from '../app.ts';
import { config } from '../config.ts';
import { autenticar, limparUsuariosDeTeste } from '../testes/sessao.ts';

const app = criarApp();

/** Arquivos gravados pelos testes, para não deixar lixo em `uploads/`. */
const gravados: string[] = [];

after(async () => {
  await Promise.all(gravados.map((nome) => rm(path.join(config.uploadsDir, nome), { force: true })));
  await limparUsuariosDeTeste();
});

function imagem(largura: number, altura: number, formato: 'png' | 'jpeg' = 'png') {
  return sharp({
    create: { width: largura, height: altura, channels: 3, background: '#721d24' },
  })
    [formato]()
    .toBuffer();
}

async function enviar(corpo: Blob, nome: string, headers: Record<string, string> = {}) {
  const form = new FormData();
  form.append('arquivo', corpo, nome);
  return app.request('/api/upload', { method: 'POST', body: form, headers });
}

async function enviarLogado(corpo: Blob, nome: string) {
  const { Cookie } = await autenticar();
  const res = await enviar(corpo, nome, { Cookie });
  if (res.status === 201) {
    const { url } = await res.clone().json();
    gravados.push(path.basename(url));
  }
  return res;
}

test('sem sessão o upload responde 401', async () => {
  const res = await enviar(new Blob([await imagem(80, 80)]), 'foto.png');
  assert.equal(res.status, 401);
});

test('aceita imagem e devolve a URL do webp', async () => {
  const res = await enviarLogado(new Blob([await imagem(1600, 1200)]), 'foto.png');

  assert.equal(res.status, 201);
  const { url } = await res.json();
  assert.match(url, /^\/uploads\/[\w-]+\.webp$/);
});

test('recusa arquivo que não é imagem', async () => {
  const res = await enviarLogado(new Blob(['isto não é imagem']), 'texto.txt');
  assert.equal(res.status, 400);
  assert.equal((await res.json()).codigo, 'nao_e_imagem');
});

test('recusa requisição sem o campo arquivo', async () => {
  const { Cookie } = await autenticar();
  const form = new FormData();
  form.append('outro', 'coisa');
  const res = await app.request('/api/upload', { method: 'POST', body: form, headers: { Cookie } });

  assert.equal(res.status, 400);
  assert.equal((await res.json()).codigo, 'arquivo_ausente');
});

test('converte para webp e reduz o lado maior a 1200px', async () => {
  const res = await enviarLogado(new Blob([await imagem(1600, 1200, 'jpeg')]), 'foto.jpg');
  const { url } = await res.json();

  const gravado = await readFile(path.join(config.uploadsDir, path.basename(url)));
  const meta = await sharp(gravado).metadata();

  // Não basta a extensão no nome: o arquivo em disco precisa ser WebP mesmo.
  assert.equal(meta.format, 'webp');
  assert.equal(meta.width, 1200);
  assert.equal(meta.height, 900);
});

test('não amplia imagem menor que o limite', async () => {
  const res = await enviarLogado(new Blob([await imagem(300, 200)]), 'pequena.png');
  const { url } = await res.json();

  const meta = await sharp(await readFile(path.join(config.uploadsDir, path.basename(url))))
    .metadata();
  assert.equal(meta.width, 300);
  assert.equal(meta.height, 200);
});

test('a imagem enviada é servida em /uploads', async () => {
  const res = await enviarLogado(new Blob([await imagem(400, 400)]), 'foto.png');
  const { url } = await res.json();

  const servida = await app.request(url);
  assert.equal(servida.status, 200);
  assert.equal(servida.headers.get('content-type'), 'image/webp');
});

test('o catálogo do seed é servido a partir da mesma pasta', async () => {
  // Se `UPLOADS_DIR` voltar a depender do diretório de trabalho, o seed grava
  // numa pasta e o servidor procura em outra — e some a foto de todo o catálogo.
  const res = await app.request('/uploads/produtos/bolo-chocolate.webp');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'image/webp');
});

test('não serve arquivo fora da pasta de uploads', async () => {
  const res = await app.request('/uploads/../.env');
  assert.notEqual(res.status, 200);
});

test('endireita foto tirada de lado, seguindo o EXIF', async () => {
  // Orientação 6 é o retrato do celular gravado como paisagem — o caso mais
  // comum de foto que chega deitada.
  const deitada = await sharp({
    create: { width: 900, height: 600, channels: 3, background: '#721d24' },
  })
    // `withMetadata` grava a orientação; `withExif({ IFD0: ... })` sozinho não —
    // o sharp relê o arquivo como orientação 1 e o teste passaria sem girar nada.
    .withMetadata({ orientation: 6 })
    .jpeg()
    .toBuffer();

  const res = await enviarLogado(new Blob([deitada]), 'celular.jpg');
  const { url } = await res.json();

  const meta = await sharp(
    await readFile(path.join(config.uploadsDir, path.basename(url))),
  ).metadata();

  // 900x600 girado vira 600x900: o `rotate()` aplicou a orientação.
  assert.equal(meta.width, 600);
  assert.equal(meta.height, 900);
});
