import { useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/auth/client';
import { mensagemDeErroAuth, type ErroAuth } from './erros';

export type UsuarioSessao = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  perfil: 'cliente' | 'admin';
};

/** O usuário como o Better Auth devolve: `name` e `role`, mais os campos extras. */
type UsuarioDaSessao = {
  id: string;
  name: string;
  email: string;
  telefone?: string | null;
  role?: string | null;
};

/**
 * O cliente do Better Auth devolve `{ data, error }` em vez de lançar. As telas
 * usam `try/catch`, então a conversão acontece aqui — sem ela, um login errado
 * seria silencioso.
 */
async function exigir<T>(promessa: Promise<{ data: T | null; error?: ErroAuth }>): Promise<T> {
  const { data, error } = await promessa;
  if (error || !data) throw new Error(mensagemDeErroAuth(error));
  return data;
}

export function useAuth() {
  const { data, isPending } = authClient.useSession();
  const queryClient = useQueryClient();

  const u = data?.user as UsuarioDaSessao | undefined;

  // `perfil` é o nome que as telas já leem; o servidor chama de `role`. A
  // comparação é explícita: qualquer valor que não seja 'admin' é cliente, e
  // não há como um papel desconhecido virar acesso administrativo.
  const usuario: UsuarioSessao | null = u
    ? {
        id: u.id,
        nome: u.name,
        email: u.email,
        telefone: u.telefone ?? '',
        perfil: u.role === 'admin' ? 'admin' : 'cliente',
      }
    : null;

  return {
    usuario,
    carregando: isPending,

    entrar: (email: string, senha: string) =>
      exigir(authClient.signIn.email({ email, password: senha })),

    cadastrar: (dados: { nome: string; email: string; senha: string; telefone: string }) =>
      exigir(
        authClient.signUp.email({
          name: dados.nome,
          email: dados.email,
          password: dados.senha,
          // `telefone` é campo extra declarado no servidor; o tipo do cliente
          // não o conhece sem inferência a partir do `auth` da API.
          telefone: dados.telefone,
        } as Parameters<typeof authClient.signUp.email>[0]),
      ),

    sair: async () => {
      await authClient.signOut();
      // Sem isto, o próximo login veria em cache os pedidos do usuário anterior
      // até a primeira revalidação — o pior tipo de vazamento, o que parece
      // funcionar.
      queryClient.clear();
    },
  };
}
