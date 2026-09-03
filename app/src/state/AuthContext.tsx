import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Perfil, Usuario } from '@divine/shared';

type DadosCadastro = { nome: string; email: string; telefone: string };

type AuthValor = {
  usuario: Usuario | null;
  entrar: (email: string, senha: string, perfil: Perfil) => void;
  cadastrar: (dados: DadosCadastro) => void;
  sair: () => void;
  atualizarUsuario: (parcial: Partial<Usuario>) => void;
  adicionarEndereco: (endereco: string) => void;
};

const AuthContext = createContext<AuthValor | null>(null);

function nomeAPartirDoEmail(email: string): string {
  const parte = email.split('@')[0] ?? '';
  if (!parte) return 'Cliente';
  return parte.charAt(0).toUpperCase() + parte.slice(1);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  // Autenticação simulada: o protótipo não tem backend, então qualquer senha
  // serve e o perfil vem do que a tela de login informou.
  const entrar = useCallback((email: string, _senha: string, perfil: Perfil) => {
    setUsuario({
      nome: nomeAPartirDoEmail(email),
      email,
      telefone: '(49) 99999-0000',
      perfil,
      enderecos: ['Rua das Palmeiras, 45 — Centro'],
    });
  }, []);

  const cadastrar = useCallback(({ nome, email, telefone }: DadosCadastro) => {
    setUsuario({ nome, email, telefone, perfil: 'cliente', enderecos: [] });
  }, []);

  const sair = useCallback(() => setUsuario(null), []);

  const atualizarUsuario = useCallback((parcial: Partial<Usuario>) => {
    setUsuario((atual) => (atual ? { ...atual, ...parcial } : atual));
  }, []);

  const adicionarEndereco = useCallback((endereco: string) => {
    const limpo = endereco.trim();
    if (!limpo) return;
    setUsuario((atual) => {
      if (!atual) return atual;
      if (atual.enderecos.includes(limpo)) return atual;
      return { ...atual, enderecos: [...atual.enderecos, limpo] };
    });
  }, []);

  const valor = useMemo(
    () => ({ usuario, entrar, cadastrar, sair, atualizarUsuario, adicionarEndereco }),
    [usuario, entrar, cadastrar, sair, atualizarUsuario, adicionarEndereco],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValor {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return contexto;
}
