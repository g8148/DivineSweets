import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { agendaInicial, type Agenda } from '@/data/agenda';
import { contarOcupacao } from '@divine/shared';
import { pedidosSeed } from '@/data/pedidosSeed';
import { catalogo as produtosIniciais } from '@divine/shared';
import { ORDEM_STATUS } from '@/data/status';
import type { Pedido, Produto } from '@divine/shared';

type NovoPedido = Omit<Pedido, 'id' | 'criadoEm' | 'status'>;

type PedidosValor = {
  pedidos: Pedido[];
  agenda: Agenda;
  ocupacao: Record<string, number>;
  criarPedido: (dados: NovoPedido) => string;
  avancarStatus: (id: string) => void;
  recusarPedido: (id: string, motivo: string) => void;
  bloquearData: (iso: string) => void;
  desbloquearData: (iso: string) => void;
  definirLimite: (n: number) => void;
  produtosAdmin: Produto[];
  salvarProduto: (produto: Produto) => void;
  removerProduto: (id: string) => void;
};

const PedidosContext = createContext<PedidosValor | null>(null);

export function PedidosProvider({ children }: { children: ReactNode }) {
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosSeed);
  const [agenda, setAgenda] = useState<Agenda>(agendaInicial);
  const [produtosAdmin, setProdutosAdmin] = useState<Produto[]>(produtosIniciais);

  // Derivado, nunca um estado à parte: ocupação que não acompanha `pedidos`
  // deixaria o calendário mentindo sobre os dias lotados.
  const ocupacao = useMemo(() => contarOcupacao(pedidos), [pedidos]);

  const criarPedido = useCallback((dados: NovoPedido): string => {
    const id = `ped-${Date.now()}`;
    const pedido: Pedido = {
      ...dados,
      id,
      criadoEm: new Date().toISOString(),
      status: 'recebido',
    };
    setPedidos((atuais) => [pedido, ...atuais]);
    return id;
  }, []);

  const avancarStatus = useCallback((id: string) => {
    setPedidos((atuais) =>
      atuais.map((pedido) => {
        if (pedido.id !== id) return pedido;
        if (pedido.status === 'entregue' || pedido.status === 'recusado') return pedido;
        const indice = ORDEM_STATUS.indexOf(pedido.status);
        const proximo = ORDEM_STATUS[indice + 1];
        return proximo ? { ...pedido, status: proximo } : pedido;
      }),
    );
  }, []);

  const recusarPedido = useCallback((id: string, motivo: string) => {
    setPedidos((atuais) =>
      atuais.map((pedido) =>
        pedido.id === id && pedido.status === 'recebido'
          ? { ...pedido, status: 'recusado', motivoRecusa: motivo }
          : pedido,
      ),
    );
  }, []);

  const bloquearData = useCallback((iso: string) => {
    setAgenda((atual) =>
      atual.datasBloqueadas.includes(iso)
        ? atual
        : { ...atual, datasBloqueadas: [...atual.datasBloqueadas, iso] },
    );
  }, []);

  const desbloquearData = useCallback((iso: string) => {
    setAgenda((atual) => ({
      ...atual,
      datasBloqueadas: atual.datasBloqueadas.filter((d) => d !== iso),
    }));
  }, []);

  const definirLimite = useCallback((n: number) => {
    if (!Number.isInteger(n) || n < 1) return;
    setAgenda((atual) => ({ ...atual, limitePorDia: n }));
  }, []);

  const salvarProduto = useCallback((produto: Produto) => {
    setProdutosAdmin((atuais) => {
      const existe = atuais.some((p) => p.id === produto.id);
      return existe ? atuais.map((p) => (p.id === produto.id ? produto : p)) : [...atuais, produto];
    });
  }, []);

  const removerProduto = useCallback((id: string) => {
    setProdutosAdmin((atuais) => atuais.filter((p) => p.id !== id));
  }, []);

  const valor = useMemo(
    () => ({
      pedidos,
      agenda,
      ocupacao,
      criarPedido,
      avancarStatus,
      recusarPedido,
      bloquearData,
      desbloquearData,
      definirLimite,
      produtosAdmin,
      salvarProduto,
      removerProduto,
    }),
    [
      pedidos,
      agenda,
      ocupacao,
      criarPedido,
      avancarStatus,
      recusarPedido,
      bloquearData,
      desbloquearData,
      definirLimite,
      produtosAdmin,
      salvarProduto,
      removerProduto,
    ],
  );

  return <PedidosContext.Provider value={valor}>{children}</PedidosContext.Provider>;
}

export function usePedidos(): PedidosValor {
  const contexto = useContext(PedidosContext);
  if (!contexto) throw new Error('usePedidos precisa estar dentro de PedidosProvider');
  return contexto;
}
