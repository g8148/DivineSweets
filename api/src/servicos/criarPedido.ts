import { randomUUID } from 'node:crypto';
import { TAXA_ENTREGA, motivoIndisponivel, somarPreco, type CriarPedido } from '@divine/shared';
import { sql } from 'drizzle-orm';
import { db } from '../db/client.ts';
import { pedidoSelecoes, pedidos } from '../db/schema.ts';
import { ErroApi } from '../erros.ts';
import type { Usuario } from '../middleware/sessao.ts';
import { carregarProduto } from '../rotas/produtos.ts';
import { carregarAgenda, contarOcupacao } from './agenda.ts';
import { montarPedido } from './lerPedidos.ts';

const MOTIVOS: Record<string, string> = {
  passado: 'Essa data já passou.',
  antecedencia: 'Precisamos de ao menos 48 horas de antecedência.',
  bloqueada: 'Não estamos produzindo nessa data.',
  lotada: 'A agenda desse dia já está cheia.',
};

type Selecao = {
  grupoId: string;
  opcaoId: string;
  grupoTitulo: string;
  opcaoNome: string;
  delta: number;
};

/**
 * Confere as seleções contra os grupos que o produto tem no banco e devolve o
 * snapshot a gravar. Título, nome e delta são copiados porque o pedido precisa
 * continuar legível mesmo depois que o catálogo mudar.
 */
function conferirSelecoes(
  produto: NonNullable<Awaited<ReturnType<typeof carregarProduto>>>,
  selecoes: Record<string, string>,
): Selecao[] {
  const grupoDoProduto = new Set(produto.grupos.map((g) => g.id));

  for (const grupoId of Object.keys(selecoes)) {
    if (!grupoDoProduto.has(grupoId)) {
      throw new ErroApi(400, `Opção inválida para este produto: ${grupoId}`, 'selecao_invalida');
    }
  }

  const snapshot: Selecao[] = [];

  for (const grupo of produto.grupos) {
    const opcaoId = selecoes[grupo.id];

    if (!opcaoId) {
      if (grupo.obrigatorio) {
        throw new ErroApi(400, `Escolha uma opção em "${grupo.titulo}"`, 'grupo_obrigatorio');
      }
      continue;
    }

    const opcao = grupo.opcoes.find((o) => o.id === opcaoId);
    if (!opcao) throw new ErroApi(400, `Opção inválida em "${grupo.titulo}"`, 'selecao_invalida');

    snapshot.push({
      grupoId: grupo.id,
      opcaoId: opcao.id,
      grupoTitulo: grupo.titulo,
      opcaoNome: opcao.nome,
      delta: opcao.delta,
    });
  }

  return snapshot;
}

export async function criarPedido(usuario: Usuario, dados: CriarPedido) {
  const produto = await carregarProduto(dados.produtoId);
  if (!produto) throw new ErroApi(404, 'Produto não encontrado', 'nao_encontrado');

  const snapshot = conferirSelecoes(produto, dados.selecoes);

  if (dados.tipoEntrega === 'entrega' && !dados.endereco) {
    throw new ErroApi(400, 'Informe o endereço de entrega', 'endereco_obrigatorio');
  }

  // O preço sai do catálogo no banco e das opções recém-conferidas, nunca do
  // corpo da requisição — `criarPedidoSchema` é `.strict()` e nem aceita campo
  // monetário, mas a garantia de verdade é esta conta aqui.
  const subtotal = somarPreco(
    produto.precoBase,
    snapshot.map((s) => s.delta),
    dados.quantidade,
  );
  // A taxa é do pedido, não da unidade: três bolos numa entrega são uma viagem.
  const taxaEntrega = dados.tipoEntrega === 'entrega' ? TAXA_ENTREGA : 0;

  return db.transaction(async (tx) => {
    // Serializa as criações para a mesma data. Sem isso, dois pedidos
    // simultâneos leem a mesma contagem, cada um se acha dentro do limite e o
    // dia termina com uma encomenda a mais do que a produção dá conta.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${dados.dataEntrega}))`);

    // A agenda é reconferida aqui, e não na tela: entre abrir o calendário e
    // tocar em confirmar, a data pode ter sido bloqueada ou lotada.
    const agenda = await carregarAgenda(tx);
    const ocupacao = await contarOcupacao([dados.dataEntrega], tx);
    const motivo = motivoIndisponivel(dados.dataEntrega, agenda, ocupacao, new Date());

    if (motivo) throw new ErroApi(409, MOTIVOS[motivo] ?? 'Data indisponível', 'data_indisponivel');

    const id = randomUUID();

    const [pedido] = await tx
      .insert(pedidos)
      .values({
        id,
        usuarioId: usuario.id,
        produtoId: produto.id,
        produtoNome: produto.nome,
        quantidade: dados.quantidade,
        mensagem: dados.mensagem ?? null,
        fotoUrl: dados.fotoUrl ?? null,
        tipoEntrega: dados.tipoEntrega,
        dataEntrega: dados.dataEntrega,
        horaEntrega: dados.horaEntrega,
        endereco: dados.endereco ?? null,
        subtotal,
        taxaEntrega,
        total: subtotal + taxaEntrega,
        status: 'recebido',
      })
      .returning();

    if (snapshot.length > 0) {
      await tx
        .insert(pedidoSelecoes)
        .values(snapshot.map((s, ordem) => ({ id: randomUUID(), pedidoId: id, ordem, ...s })));
    }

    // Mesmo formato da leitura: o app não deve precisar de dois tipos para o
    // pedido que acabou de criar e o que ele lê depois.
    return montarPedido(
      pedido,
      snapshot.map(({ grupoTitulo, opcaoNome, delta }) => ({ grupoTitulo, opcaoNome, delta })),
      { nome: usuario.nome, telefone: usuario.telefone },
      produto.imagemUrl,
    );
  });
}
