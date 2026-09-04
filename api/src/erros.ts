/**
 * Erro com status HTTP. O `codigo` é lido pelo app para distinguir falhas que
 * pedem tratamento diferente — `data_indisponivel`, por exemplo, reabre o
 * calendário em vez de só mostrar a mensagem.
 *
 * Os campos são declarados explicitamente porque o Node executa TypeScript
 * apenas removendo os tipos, e `constructor(public status: number)` exigiria
 * uma transformação de verdade.
 */
export class ErroApi extends Error {
  status: number;
  codigo?: string;

  constructor(status: number, message: string, codigo?: string) {
    super(message);
    this.name = 'ErroApi';
    this.status = status;
    this.codigo = codigo;
  }
}

type Issue = {
  message: string;
  code?: string;
  keys?: readonly string[];
  path?: readonly (PropertyKey | { key: PropertyKey })[];
};

/** `['selecoes', 0, 'id']` → `'selecoes.0.id'`, aceitando as duas formas que o
 *  standard-schema permite para cada segmento. */
function caminho(path: Issue['path']): string {
  if (!path?.length) return '';
  return path
    .map((seg) => String(seg !== null && typeof seg === 'object' ? seg.key : seg))
    .join('.');
}

/**
 * Converte a falha do validador de rota num `ErroApi`, para o 400 sair no mesmo
 * `{ erro, codigo }` que o resto da API. Sem isso o corpo é o objeto cru do
 * validador, e o app teria de tratar duas formas diferentes de erro.
 *
 * Recebe a lista de issues direto: o `hono-openapi` segue o standard-schema,
 * onde `resultado.error` já é o array — não é um `ZodError` com `.issues`.
 */
export function erroDeValidacao(issues: readonly unknown[], codigo: string): ErroApi {
  const primeiro = issues[0] as Issue | undefined;
  if (!primeiro) return new ErroApi(400, 'Requisição inválida', codigo);

  // Mensagem própria: a do Zod para chave extra vem em inglês, e ela é a que o
  // cliente vê ao tentar mandar `total` num schema que recalcula o preço.
  if (primeiro.code === 'unrecognized_keys') {
    const chaves = primeiro.keys?.join(', ') ?? '';
    return new ErroApi(400, `Campo não aceito nesta requisição: ${chaves}`, codigo);
  }

  const campo = caminho(primeiro.path);
  return new ErroApi(400, campo ? `${campo}: ${primeiro.message}` : primeiro.message, codigo);
}
