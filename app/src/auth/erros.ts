/**
 * Traduz a falha de autenticação do Better Auth para o texto que a tela mostra.
 *
 * O cliente do Better Auth **não lança** em erro: ele devolve `{ data, error }`.
 * Um `try/catch` em volta da chamada não pegaria nada, e o toque em "Entrar"
 * pareceria não fazer efeito. Quem chama precisa olhar o `error` — é o que
 * `useAuth` faz, convertendo em exceção com esta mensagem.
 */
export type ErroAuth = { status?: number; code?: string; message?: string } | null | undefined;

const POR_CODIGO: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'E-mail ou senha incorretos.',
  USER_ALREADY_EXISTS: 'Já existe uma conta com este e-mail.',
  PASSWORD_TOO_SHORT: 'A senha precisa de ao menos 8 caracteres.',
  INVALID_EMAIL: 'E-mail inválido.',
};

export function mensagemDeErroAuth(erro: ErroAuth): string {
  if (!erro) return 'Não foi possível completar a operação.';

  // O limite de tentativas é do servidor e a resposta vem em inglês. Sem esta
  // linha, quem erra a senha cinco vezes recebe "Too many requests" e não sabe
  // que basta esperar.
  if (erro.status === 429) {
    return 'Muitas tentativas seguidas. Espere um minuto e tente de novo.';
  }

  const traduzido = erro.code ? POR_CODIGO[erro.code] : undefined;
  return traduzido ?? erro.message ?? 'Não foi possível completar a operação.';
}
