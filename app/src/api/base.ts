/**
 * As partes do cliente HTTP que não dependem do Expo.
 *
 * `client.ts` importa o Better Auth, que importa o `expo-secure-store` e só
 * carrega dentro do app. Separando estas duas peças, elas continuam cobertas
 * por `node --test`, que é onde a montagem da URL e o formato do erro são
 * verificados.
 */

/**
 * Lida a cada chamada, e não uma vez no topo do módulo: o Expo substitui
 * `process.env.EXPO_PUBLIC_API_URL` por texto em tempo de build onde quer que a
 * expressão apareça, e assim o teste consegue exercitar o caso da variável
 * ausente. A barra final é aparada porque ela costuma ser digitada à mão.
 */
function base() {
  return (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
}

/**
 * Erro de resposta da API, com o `codigo` que o servidor manda junto.
 *
 * O código existe para a tela decidir o que fazer sem depender do texto: um 409
 * `data_indisponivel` manda o cliente de volta ao calendário, enquanto os outros
 * 409 apenas exibem a mensagem.
 */
export class ApiError extends Error {
  // Campos declarados e atribuídos à mão: o Node roda TypeScript apagando os
  // tipos, sem transformar nada, e `constructor(public status: number)` é
  // sintaxe que gera código — ela falha com ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX.
  status: number;
  codigo?: string;

  constructor(status: number, message: string, codigo?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
  }
}

/**
 * `EXPO_PUBLIC_API_URL` é substituída no bundle em tempo de build. Faltando
 * ela, todo `fetch` iria para um caminho relativo e falharia com "Network
 * request failed" — mensagem que não diz o que houve. Este erro diz.
 */
export function montarUrl(caminho: string) {
  const raiz = base();
  if (!raiz) {
    throw new Error(
      'EXPO_PUBLIC_API_URL não foi definida. Copie app/.env.example para app/.env e aponte para a API.',
    );
  }
  return `${raiz}${caminho.startsWith('/') ? caminho : `/${caminho}`}`;
}

/** Se a base está configurada. As telas usam para avisar em vez de quebrar. */
export function temApiConfigurada() {
  return base().length > 0;
}
