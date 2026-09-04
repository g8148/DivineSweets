import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Hono } from 'hono';
import { describeRoute, resolver } from 'hono-openapi';
import sharp from 'sharp';
import { z } from 'zod';
import { config } from '../config.ts';
import { ErroApi } from '../erros.ts';
import { exigirSessao, type Variables } from '../middleware/sessao.ts';

const TAMANHO_MAXIMO = 8 * 1024 * 1024;

/** Lado maior da imagem gravada. A foto é referência para a confeiteira, não
 *  material de impressão: 1200px cobrem qualquer tela do app com folga. */
const LADO_MAXIMO = 1200;

const respostaSchema = z.object({ url: z.string() });

export const rotasUpload = new Hono<{ Variables: Variables }>().use('*', exigirSessao).post(
  '/',
  describeRoute({
    description:
      'Envia uma imagem de referência para o pedido. É reconvertida para WebP com no máximo 1200px.',
    responses: {
      201: {
        description: 'URL da imagem gravada',
        content: { 'application/json': { schema: resolver(respostaSchema) } },
      },
      400: { description: 'Arquivo ausente, grande demais ou não é imagem' },
      401: { description: 'Sem sessão' },
    },
  }),
  async (c) => {
    // O tamanho é conferido antes de ler o corpo: `formData()` carrega o arquivo
    // inteiro na memória, e um upload de centenas de MB derrubaria o processo
    // antes de qualquer validação. A VPS é compartilhada com outros projetos.
    const declarado = Number(c.req.header('content-length'));
    if (declarado > TAMANHO_MAXIMO) {
      throw new ErroApi(400, 'A imagem passa de 8 MB', 'arquivo_grande');
    }

    const form = await c.req.formData();
    const arquivo = form.get('arquivo');

    if (!(arquivo instanceof File)) {
      throw new ErroApi(400, 'Envie um arquivo no campo "arquivo"', 'arquivo_ausente');
    }
    if (arquivo.size > TAMANHO_MAXIMO) {
      throw new ErroApi(400, 'A imagem passa de 8 MB', 'arquivo_grande');
    }

    const entrada = Buffer.from(await arquivo.arrayBuffer());

    let saida: Buffer;
    try {
      saida = await sharp(entrada)
        // `rotate()` sem argumento aplica a orientação do EXIF. Sem ele, foto
        // tirada de lado no celular chega deitada para a confeiteira.
        .rotate()
        .resize(LADO_MAXIMO, LADO_MAXIMO, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      // O sharp decodifica de verdade, então isto é checagem de conteúdo, e não
      // de extensão ou de content-type — os dois vêm do cliente e mentem.
      throw new ErroApi(400, 'O arquivo enviado não é uma imagem válida', 'nao_e_imagem');
    }

    // Nome sorteado: usar o do cliente traria travessia de caminho e sobrescrita
    // do arquivo de outra pessoa de graça.
    const nome = `${randomUUID()}.webp`;
    await mkdir(config.uploadsDir, { recursive: true });
    await writeFile(path.join(config.uploadsDir, nome), saida);

    return c.json({ url: `/uploads/${nome}` }, 201);
  },
);
