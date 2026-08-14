import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Entrega, Personalizacao } from '@/types';

const ENTREGA_INICIAL: Entrega = { tipo: 'retirada', data: '', hora: '', endereco: '' };

type RascunhoValor = {
  rascunho: Personalizacao | null;
  entrega: Entrega;
  iniciar: (produtoId: string) => void;
  atualizar: (parcial: Partial<Personalizacao>) => void;
  definirEntrega: (parcial: Partial<Entrega>) => void;
  limpar: () => void;
};

const RascunhoContext = createContext<RascunhoValor | null>(null);

export function RascunhoPedidoProvider({ children }: { children: ReactNode }) {
  const [rascunho, setRascunho] = useState<Personalizacao | null>(null);
  const [entrega, setEntrega] = useState<Entrega>(ENTREGA_INICIAL);

  const iniciar = useCallback((produtoId: string) => {
    setRascunho({ produtoId, quantidade: 1, selecoes: {}, mensagem: '', fotoUri: null });
    // Entrar num produto novo não pode herdar a data escolhida no pedido anterior.
    setEntrega(ENTREGA_INICIAL);
  }, []);

  const atualizar = useCallback((parcial: Partial<Personalizacao>) => {
    setRascunho((atual) => (atual ? { ...atual, ...parcial } : atual));
  }, []);

  const definirEntrega = useCallback((parcial: Partial<Entrega>) => {
    setEntrega((atual) => ({ ...atual, ...parcial }));
  }, []);

  const limpar = useCallback(() => {
    setRascunho(null);
    setEntrega(ENTREGA_INICIAL);
  }, []);

  const valor = useMemo(
    () => ({ rascunho, entrega, iniciar, atualizar, definirEntrega, limpar }),
    [rascunho, entrega, iniciar, atualizar, definirEntrega, limpar],
  );

  return <RascunhoContext.Provider value={valor}>{children}</RascunhoContext.Provider>;
}

export function useRascunho(): RascunhoValor {
  const contexto = useContext(RascunhoContext);
  if (!contexto) throw new Error('useRascunho precisa estar dentro de RascunhoPedidoProvider');
  return contexto;
}
