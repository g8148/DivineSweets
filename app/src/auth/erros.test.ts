import assert from 'node:assert/strict';
import test from 'node:test';
import { mensagemDeErroAuth } from './erros';

test('erro conhecido vira mensagem em português', () => {
  assert.strictEqual(
    mensagemDeErroAuth({ code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' }),
    'E-mail ou senha incorretos.',
  );
});

// A API limita /sign-in/email a 5 tentativas por minuto. Sem tradução, quem
// erra a senha cinco vezes lê "Too many requests" e não sabe que basta esperar.
test('limite de tentativas explica o que fazer', () => {
  assert.match(mensagemDeErroAuth({ status: 429, message: 'Too many requests' }), /Espere um minuto/);
});

test('erro desconhecido cai na mensagem do servidor', () => {
  assert.strictEqual(mensagemDeErroAuth({ code: 'ALGO_NOVO', message: 'Algo deu errado' }), 'Algo deu errado');
});

test('sem erro nenhum ainda devolve um texto exibível', () => {
  assert.ok(mensagemDeErroAuth(null).length > 0);
});
