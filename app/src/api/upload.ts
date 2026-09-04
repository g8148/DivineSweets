import { useMutation } from '@tanstack/react-query';
import { File as ArquivoLocal } from 'expo-file-system';
import { apiFetch } from './client';

/**
 * Envia uma imagem local e devolve o caminho que a API passa a servir.
 *
 * Serve às duas pontas: a foto de referência que o cliente anexa ao pedido e a
 * foto do produto que a confeiteira cadastra. O servidor reconverte tudo para
 * WebP, então o nome declarado aqui é só formalidade do multipart.
 *
 * O arquivo vai como `File` do `expo-file-system`, e não como o
 * `{ uri, name, type }` que o React Native aceita. O `fetch` instalado como
 * global pelo Expo monta o multipart em JavaScript e só sabe ler partes que
 * exponham `bytes()`; com o objeto de `uri` ele lança "Unsupported FormDataPart
 * implementation" e o pedido com foto falha inteiro, sem chegar ao servidor.
 */
export function useEnviarImagem() {
  return useMutation({
    mutationFn: (uri: string) => {
      const form = new FormData();
      form.append('arquivo', new ArquivoLocal(uri) as unknown as Blob, 'imagem.jpg');
      return apiFetch<{ url: string }>('/api/upload', { method: 'POST', body: form });
    },
  });
}
