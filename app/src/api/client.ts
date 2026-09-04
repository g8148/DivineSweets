import { authClient } from '@/auth/client';
import { ApiError, montarUrl } from './base';

export { ApiError, montarUrl, temApiConfigurada } from './base';

export async function apiFetch<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  // O Better Auth guarda a sessão no SecureStore e não no jar de cookies do
  // WebView; o cabeçalho é montado à mão. `credentials: 'omit'` é obrigatório:
  // com 'include' o React Native tenta o próprio jar e atrapalha o cookie manual.
  const cookies = await authClient.getCookie();

  const res = await fetch(montarUrl(caminho), {
    ...init,
    credentials: 'omit',
    headers: {
      // FormData define o próprio Content-Type, com o boundary. Fixá-lo aqui
      // faria o servidor não conseguir separar as partes do upload.
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      Cookie: cookies,
      ...init.headers,
    },
  });

  if (!res.ok) {
    // A API responde `{ erro, codigo }`, mas um 502 do proxy vem em HTML: o
    // catch evita que a falha de rede apareça como erro de parse de JSON.
    const corpo = await res.json().catch(() => ({}) as { erro?: string; codigo?: string });
    throw new ApiError(
      res.status,
      corpo.erro ?? 'Não foi possível completar a operação',
      corpo.codigo,
    );
  }

  // 204 não tem corpo; `res.json()` estouraria.
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
