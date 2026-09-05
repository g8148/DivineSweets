import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { Hono } from 'hono';
import { describeRoute } from 'hono-openapi';
import { config } from '../config.ts';
import { ErroApi } from '../erros.ts';

/** Nome com que o APK chega ao aparelho, e não o nome que ele tem em disco. */
const NOME_DO_ARQUIVO = 'divine-sweets.apk';

/**
 * O Android reconhece o pacote por este tipo. Servi-lo como
 * `application/octet-stream` faz alguns navegadores salvarem o arquivo sem
 * oferecer a instalação.
 */
const TIPO_APK = 'application/vnd.android.package-archive';

async function descreverApk() {
  try {
    const info = await stat(config.apkPath);
    return info.isFile() ? info : null;
  } catch {
    // Arquivo ausente é o estado normal em desenvolvimento: o APK é gerado na
    // máquina de quem compila e enviado à VPS, e nunca entra no Git.
    return null;
  }
}

function formatarTamanho(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function paginaComApk(tamanho: string, data: string, versao: string) {
  return `<!doctype html>
<html lang="pt-BR">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Divine Sweets — baixar o aplicativo</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center;
         background: #fdf3f5; color: #4a1f2b;
         font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 30rem; padding: 2rem 1.5rem; text-align: center; }
  h1 { font-size: 1.6rem; margin: 0 0 .25rem; }
  p { margin: .5rem 0; }
  .meta { color: #8a6b74; font-size: .9rem; }
  a.baixar { display: inline-block; margin: 1.5rem 0 .5rem; padding: .9rem 2rem;
             background: #7b2c40; color: #fff; text-decoration: none;
             border-radius: .75rem; font-weight: 600; }
  ol { text-align: left; color: #6b4a54; font-size: .95rem; padding-left: 1.2rem; }
</style>
<main>
  <h1>Divine Sweets</h1>
  <p>Aplicativo de encomendas para Android.</p>
  <a class="baixar" href="/app/${NOME_DO_ARQUIVO}?v=${versao}">Baixar o APK</a>
  <p class="meta">${tamanho} &middot; publicado em ${data}</p>
  <h2 style="font-size:1rem;margin-top:2rem">Como instalar</h2>
  <ol>
    <li>Toque em <strong>Baixar o APK</strong> e confirme o download.</li>
    <li>Abra o arquivo baixado.</li>
    <li>O Android vai pedir permissão para instalar de fonte desconhecida:
        autorize o navegador e volte.</li>
    <li>Toque em <strong>Instalar</strong>.</li>
  </ol>
</main>
</html>`;
}

const paginaSemApk = `<!doctype html>
<html lang="pt-BR">
<meta charset="utf-8">
<title>Divine Sweets</title>
<body style="font:16px system-ui;padding:2rem;color:#4a1f2b">
<h1>Nenhuma versão publicada ainda</h1>
<p>O aplicativo ainda não foi enviado ao servidor.</p>
</body></html>`;

export const rotasApp = new Hono()
  .get('/', async (c) => {
    const info = await descreverApk();
    if (!info) return c.html(paginaSemApk, 503);

    return c.html(
      paginaComApk(
        formatarTamanho(info.size),
        info.mtime.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        // O link carrega a data de publicação do arquivo. O `Cache-Control` que
        // mandamos não basta: o Cloudflare guarda o APK na borda por conta da
        // extensão e reescreve o cabeçalho para `max-age=14400` — uma versão
        // nova seguiria quatro horas invisível, com o nome do arquivo igual ao
        // da anterior. Publicação nova muda o `mtime`, o endereço muda junto e
        // a borda não tem o que devolver de velho.
        String(Math.floor(info.mtimeMs)),
      ),
    );
  })
  .get(
    `/${NOME_DO_ARQUIVO}`,
    describeRoute({
      description: 'Baixa o APK do aplicativo Android.',
      responses: {
        200: { description: 'O pacote instalável' },
        503: { description: 'Nenhuma versão publicada no servidor' },
      },
    }),
    async (c) => {
      const info = await descreverApk();
      if (!info) throw new ErroApi(503, 'Nenhuma versão publicada ainda', 'apk_ausente');

      // Em fluxo, e não lido inteiro na memória: o APK passa de 50 MB, e a VPS
      // é compartilhada com outros projetos.
      const corpo = Readable.toWeb(createReadStream(config.apkPath)) as ReadableStream;

      return c.body(corpo, 200, {
        'Content-Type': TIPO_APK,
        'Content-Length': String(info.size),
        'Content-Disposition': `attachment; filename="${NOME_DO_ARQUIVO}"`,
        // O APK muda a cada entrega e o nome não: sem isto o navegador
        // reinstalaria a versão que já tem em cache.
        'Cache-Control': 'no-cache',
      });
    },
  );
