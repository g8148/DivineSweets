import { copyFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalogo, categorias, grupos } from '@divine/shared';
import { config } from '../config.ts';
import { db } from './client.ts';
import { agendaConfig, gruposOpcoes, opcoes, produtos, produtosGrupos } from './schema.ts';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SEED_ASSETS = path.resolve(AQUI, '../../seed-assets/produtos');

/**
 * `uploads/` fica fora do Git, porque é onde entram as fotos que os clientes
 * mandam junto com o pedido. As fotos do catálogo precisam de um caminho
 * versionado para chegarem à VPS, e é o que `seed-assets/` é: a cópia que vive
 * no repositório. Daqui elas vão para o diretório que a API serve.
 */
async function restaurarImagensDoCatalogo() {
  const destino = path.join(config.uploadsDir, 'produtos');
  await mkdir(destino, { recursive: true });

  const arquivos = await readdir(SEED_ASSETS);
  for (const arquivo of arquivos) {
    await copyFile(path.join(SEED_ASSETS, arquivo), path.join(destino, arquivo));
  }
  return arquivos.length;
}

/**
 * Popula o banco com o catálogo que hoje mora em `@divine/shared`.
 *
 * É um catálogo de demonstração, não dado de produção: o seed restaura tudo ao
 * estado conhecido, e o que o sistema tiver mudado depois é descartável. Por
 * isso `onConflictDoUpdate` sobrescreve todos os campos em vez de preservar
 * alguns. O que ele não faz é duplicar nem apagar linha, então os pedidos que
 * apontam para esses produtos continuam de pé.
 */
export async function semear() {
  const imagens = await restaurarImagensDoCatalogo();

  for (const grupo of Object.values(grupos)) {
    await db
      .insert(gruposOpcoes)
      .values({ id: grupo.id, titulo: grupo.titulo, obrigatorio: grupo.obrigatorio })
      .onConflictDoUpdate({
        target: gruposOpcoes.id,
        set: { titulo: grupo.titulo, obrigatorio: grupo.obrigatorio },
      });

    for (const [i, opcao] of grupo.opcoes.entries()) {
      await db
        .insert(opcoes)
        .values({ id: opcao.id, grupoId: grupo.id, nome: opcao.nome, delta: opcao.delta, ordem: i })
        .onConflictDoUpdate({
          target: opcoes.id,
          set: { nome: opcao.nome, delta: opcao.delta, ordem: i, grupoId: grupo.id },
        });
    }
  }

  for (const [i, produto] of catalogo.entries()) {
    await db
      .insert(produtos)
      .values({
        id: produto.id,
        nome: produto.nome,
        categoria: produto.categoria,
        descricao: produto.descricao,
        precoBase: produto.precoBase,
        imagemUrl: `/uploads/produtos/${produto.id}.webp`,
        ordem: i,
        permiteMensagem: produto.permiteMensagem,
        permiteFoto: produto.permiteFoto,
      })
      .onConflictDoUpdate({
        target: produtos.id,
        set: {
          nome: produto.nome,
          categoria: produto.categoria,
          descricao: produto.descricao,
          precoBase: produto.precoBase,
          imagemUrl: `/uploads/produtos/${produto.id}.webp`,
          ordem: i,
          permiteMensagem: produto.permiteMensagem,
          permiteFoto: produto.permiteFoto,
          ativo: true,
        },
      });

    for (const [j, grupoId] of produto.gruposIds.entries()) {
      await db
        .insert(produtosGrupos)
        .values({ produtoId: produto.id, grupoId, ordem: j })
        .onConflictDoNothing();
    }
  }

  await db.insert(agendaConfig).values({ id: 1, limitePorDia: 5 }).onConflictDoNothing();

  console.log(
    `Seed concluído: ${catalogo.length} produtos, ${Object.keys(grupos).length} grupos, ` +
      `${categorias.length} categorias, ${imagens} imagens.`,
  );
}

// Permite `npm run db:seed` além do uso programático no deploy.
if (import.meta.main) {
  await semear();
  process.exit(0);
}
