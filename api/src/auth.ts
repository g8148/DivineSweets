import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { expo } from '@better-auth/expo';
import { config } from './config.ts';
import { db } from './db/client.ts';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  baseURL: config.baseUrl,
  secret: config.authSecret,
  emailAndPassword: { enabled: true },
  // Sem limite, /sign-in/email vira alvo de força bruta: o endpoint é público
  // e o custo de tentar é zero para quem ataca.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/sign-up/email': { window: 300, max: 5 },
    },
  },
  user: {
    additionalFields: {
      telefone: { type: 'string', required: false, defaultValue: '' },
      // `input: false` impede que o cadastro traga `role: "admin"` no corpo da
      // requisição. Promover alguém é operação manual, feita direto no banco.
      role: { type: 'string', required: false, defaultValue: 'cliente', input: false },
    },
  },
  trustedOrigins: [
    'divinesweets://',
    ...(config.ambiente === 'development' ? ['exp://', 'exp://**'] : []),
  ],
  plugins: [expo()],
});
