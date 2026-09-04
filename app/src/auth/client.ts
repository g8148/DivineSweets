import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

/**
 * O cookie de sessão vive no SecureStore, e não em memória: fechar e reabrir o
 * app tem de manter quem já estava logado. O `scheme` casa com o de `app.json`
 * e com os `trustedOrigins` do servidor.
 */
export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  plugins: [
    expoClient({
      scheme: 'divinesweets',
      storagePrefix: 'divinesweets',
      storage: SecureStore,
    }),
  ],
});
