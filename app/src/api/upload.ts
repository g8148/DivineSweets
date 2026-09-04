import { useMutation } from '@tanstack/react-query';
import { apiFetch } from './client';

/**
 * Envia uma imagem local e devolve o caminho que a API passa a servir.
 *
 * Serve às duas pontas: a foto de referência que o cliente anexa ao pedido e a
 * foto do produto que a confeiteira cadastra. O servidor reconverte tudo para
 * WebP, então o nome e o tipo declarados aqui são só formalidade do multipart.
 */
export function useEnviarImagem() {
  return useMutation({
    mutationFn: (uri: string) => {
      const form = new FormData();
      // O React Native aceita este objeto no lugar de um File.
      form.append('arquivo', { uri, name: 'imagem.jpg', type: 'image/jpeg' } as never);
      return apiFetch<{ url: string }>('/api/upload', { method: 'POST', body: form });
    },
  });
}
