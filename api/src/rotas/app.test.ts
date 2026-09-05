import assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test, { after } from 'node:test';
import { criarApp } from '../app.ts';
import { config } from '../config.ts';

const app = criarApp();

/** Conteúdo qualquer: a rota serve bytes, não interpreta o pacote. */
const CONTEUDO = Buffer.from('PK pacote de mentira');

async function comApk() {
  await mkdir(path.dirname(config.apkPath), { recursive: true });
  await writeFile(config.apkPath, CONTEUDO);
}

async function semApk() {
  await rm(config.apkPath, { force: true });
}

after(semApk);

test('sem APK publicado, a página avisa e o download responde 503', async () => {
  await semApk();

  const pagina = await app.request('/app');
  assert.strictEqual(pagina.status, 503);
  assert.match(await pagina.text(), /Nenhuma versão publicada/);

  const arquivo = await app.request('/app/divine-sweets.apk');
  assert.strictEqual(arquivo.status, 503);
});

test('a página de download aponta para o arquivo e mostra o tamanho', async () => {
  await comApk();

  const res = await app.request('/app');
  assert.strictEqual(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes('0.0 MB'));

  // O link carrega a data de publicação: sem isso o Cloudflare serviria por
  // horas o APK antigo, já que o nome do arquivo não muda entre entregas.
  const link = html.match(/href="(\/app\/divine-sweets\.apk\?v=\d+)"/);
  assert.ok(link, `a página não trouxe o link versionado:\n${html}`);
});

test('o download responde igual com ou sem a versão no endereço', async () => {
  await comApk();

  const semVersao = await app.request('/app/divine-sweets.apk');
  const comVersao = await app.request('/app/divine-sweets.apk?v=123456');

  assert.strictEqual(semVersao.status, 200);
  assert.strictEqual(comVersao.status, 200);
  assert.deepStrictEqual(
    Buffer.from(await comVersao.arrayBuffer()),
    Buffer.from(await semVersao.arrayBuffer()),
  );
});

// O Android só oferece a instalação quando o tipo é este; como
// `application/octet-stream` o navegador apenas salva o arquivo.
test('o APK sai como pacote Android, com o tamanho declarado', async () => {
  await comApk();

  const res = await app.request('/app/divine-sweets.apk');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('content-type'), 'application/vnd.android.package-archive');
  assert.strictEqual(res.headers.get('content-length'), String(CONTEUDO.length));
  assert.ok((res.headers.get('content-disposition') ?? '').includes('filename="divine-sweets.apk"'));

  const baixado = Buffer.from(await res.arrayBuffer());
  assert.deepStrictEqual(baixado, CONTEUDO);
});

// O nome do arquivo é sempre o mesmo e o conteúdo muda a cada entrega: sem
// isto o navegador reinstalaria a versão que já tem em cache.
test('o download pede que não se guarde em cache', async () => {
  await comApk();
  const res = await app.request('/app/divine-sweets.apk');
  assert.strictEqual(res.headers.get('cache-control'), 'no-cache');
});
