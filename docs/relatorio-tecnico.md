# Relatório Técnico — Divine Sweets

**Componente curricular:** Desenvolvimento Mobile
**Atividade Avaliativa 2 — Atividade Problematizadora**
**Autores:** Carine Renostro, Gabriel Giacobbo e Thuaina Alexandra Maia
**Repositório:** https://github.com/g8148/DivineSweets
**Aplicativo:** https://api-divinesweets.gabrie.dev/app

---

## 1. O problema

Uma confeitaria que trabalha por encomenda atende hoje pelo WhatsApp. O
atendimento acontece em conversa solta, e disso vêm três problemas concretos:

1. **O preço é calculado de cabeça.** Cada recheio, cobertura e tamanho altera o
   valor. Somar isso no meio de uma conversa erra, e o erro sai do bolso de
   alguém.
2. **A agenda não existe em lugar nenhum.** Não há como saber quantos pedidos já
   foram aceitos para o próximo sábado. Aceita-se mais do que cabe na produção,
   e alguém fica sem o bolo.
3. **O cliente não sabe em que pé está o pedido.** Ele pergunta, e alguém tem de
   parar de produzir para responder.

O aplicativo ataca os três: o preço é calculado pelo sistema, a agenda tem
limite por dia e bloqueio de datas, e o pedido tem um status que o cliente
acompanha sozinho.

## 2. Requisitos atendidos

Retomados da Atividade Avaliativa 1, com os mockups em [`docs/mockups/`](mockups/).

**Cliente**

- Cadastro e login com sessão persistente
- Catálogo de doces, filtrado por categoria
- Detalhe do produto com descrição e preço-base
- Personalização por grupos de opções, com o total recalculado a cada escolha
- Escolha de data e horário de entrega, limitada às datas disponíveis
- Retirada na loja ou entrega com taxa
- Envio de foto de referência
- Resumo com o total antes de confirmar
- Acompanhamento do pedido em quatro etapas
- Histórico de pedidos
- Perfil com edição dos dados pessoais (nome e telefone)

**Administração**

- Fila de pedidos com filtro por status
- Avanço de etapa e recusa com justificativa
- Contato direto com o cliente (ligação)
- CRUD do catálogo, com upload de imagem e exclusão lógica
- Montagem dos grupos de personalização por produto
- Agenda: bloqueio de datas e limite de pedidos por dia

## 3. Arquitetura

```
┌─────────────────────┐         HTTPS          ┌──────────────────────┐
│   app/  (Android)   │ ─────────────────────► │  api/  (VPS Ubuntu)  │
│  Expo / React Native│ ◄───────────────────── │   Hono + Node 24     │
└─────────┬───────────┘      JSON + cookie     └──────────┬───────────┘
          │                                               │
          │        ┌──────────────────────┐               │
          └───────►│      shared/         │◄──────────────┘
                   │  preço, agenda,      │
                   │  validação, tipos    │
                   └──────────────────────┘                │
                                                  ┌────────▼─────────┐
                                                  │   PostgreSQL 16  │
                                                  │  127.0.0.1:7520  │
                                                  └──────────────────┘
```

Monorepo com três pacotes em *workspaces* do npm. São **8.894 linhas** de
TypeScript versionadas: 4.541 no aplicativo, 3.368 na API e 956 no pacote
compartilhado.

### Por que um pacote compartilhado

Esta é a decisão estrutural do projeto. Duas regras precisam existir dos dois
lados:

- **O preço.** A tela mostra o total enquanto a pessoa escolhe; o servidor
  calcula o total que será cobrado. Se as duas fórmulas fossem escritas
  separadamente, um dia divergiriam — e o cliente veria um valor e pagaria
  outro.
- **A disponibilidade da data.** O calendário precisa pintar de cinza os dias
  indisponíveis; o servidor precisa recusar um pedido nesses dias. Mesmo
  raciocínio.

`shared/` resolve isso com funções puras, sem dependência de rede ou de banco,
testáveis isoladamente. `somarPreco` e `motivoIndisponivel` são chamadas pelos
dois lados. A regra de negócio existe uma vez só.

Isso resolve também um risco de segurança: **o cliente nunca envia o preço**. O
schema de criação de pedido recusa qualquer campo de valor vindo do aplicativo
(há um teste específico para isso). O servidor recarrega o produto do banco,
confere as opções escolhidas e calcula o total ele mesmo. O que o aplicativo
mostra é uma previsão; o que vale é o que o servidor computou.

## 4. Tecnologias e por que cada uma

| Camada | Escolha | Motivo |
| --- | --- | --- |
| Aplicativo | Expo SDK 57, React Native 0.86 | Um código para Android e iOS; o Expo cuida do build nativo, das fontes e do acesso à câmera sem configuração manual de Gradle |
| Navegação | Expo Router | Rotas por arquivo, com grupos `(cliente)` / `(admin)` / `(auth)` que espelham a autorização na própria estrutura de pastas |
| Estado de servidor | TanStack Query | Cache, revalidação e estados de carregamento/erro sem escrever `useEffect` para cada chamada |
| API | Hono | Framework HTTP leve, tipado ponta a ponta, com validação e OpenAPI integrados |
| Banco | PostgreSQL 16 + Drizzle ORM | Tipos do banco derivados do schema em TypeScript; migrações versionadas |
| Autenticação | Better Auth + `@better-auth/expo` | Sessão por cookie no servidor, guardada em `expo-secure-store` no aparelho |
| Validação | Zod 4 | Um schema serve ao mesmo tempo de validação em execução e de tipo TypeScript |
| Imagens | sharp | Reconversão para WebP no servidor |

O enunciado cita Android Studio, Java e Gradle. O projeto usa o **Android SDK e
o Gradle** — o build de release é gerado localmente por `expo run:android` e
produz um APK nativo assinado. A camada de interface é escrita em
TypeScript/React Native em vez de Java, escolha justificada pela reutilização
das regras de negócio com o servidor, que é o ponto central da arquitetura.

## 5. Modelo de dados

Doze tabelas, três migrações versionadas em `api/drizzle/`.

| Tabela | Papel |
| --- | --- |
| `user`, `session`, `account`, `verification` | Autenticação (geridas pelo Better Auth) |
| `produtos` | Catálogo, com `ativo` para exclusão lógica |
| `grupos_opcoes` | Grupo de personalização (ex.: "Recheio") |
| `opcoes` | Opção dentro do grupo, com `delta` de preço |
| `produtos_grupos` | Quais grupos cada produto tem |
| `pedidos` | O pedido, com valores e status |
| `pedido_selecoes` | As escolhas feitas naquele pedido |
| `agenda_bloqueios` | Datas em que não se produz |
| `agenda_config` | Limite de pedidos por dia |

### Três decisões de modelagem

**Dinheiro em centavos, como inteiro.** Nenhum valor monetário é ponto
flutuante. `R$ 45,90` é gravado como `4590`. Ponto flutuante não representa
decimais exatamente — `0.1 + 0.2` não é `0.3` — e num sistema que soma
acréscimos repetidamente o erro se acumula. A formatação para exibição acontece
só na borda, em `formatarMoeda`.

**Data como texto `YYYY-MM-DD`, sem fuso.** A data de entrega é um dia do
calendário, não um instante. Gravada como `timestamp`, um pedido para o dia 10
feito às 22h vira dia 9 ou 11 dependendo do fuso de quem lê. A coluna é `date`
em modo string, e o schema recusa explicitamente uma data com fuso — há um teste
para isso.

**As escolhas do pedido são um instantâneo.** `pedido_selecoes` copia o título
do grupo, o nome da opção e o `delta` no momento do pedido, em vez de apenas
referenciar as tabelas do catálogo. Sem isso, editar o preço de um recheio hoje
reescreveria o valor de pedidos fechados no mês passado. Pela mesma razão,
`pedidos.produto_nome` é copiado, e um usuário com pedidos não pode ser apagado
— a chave estrangeira não tem `onDelete`, e o banco bloqueia.

## 6. A API

Documentação OpenAPI gerada do próprio código, navegável em
[`/docs`](https://api-divinesweets.gabrie.dev/docs).

### Público

| Método | Rota | O que faz |
| --- | --- | --- |
| `GET` | `/health` | Saúde do serviço (usada pelo deploy) |
| `GET` | `/api/produtos` | Catálogo ativo |
| `GET` | `/api/produtos/:id` | Produto com grupos e opções |
| `GET` | `/api/agenda/disponibilidade` | Datas indisponíveis e o motivo de cada uma |
| `GET` | `/app` | Página de download do APK |

### Autenticado

| Método | Rota | O que faz |
| --- | --- | --- |
| `POST` | `/api/pedidos` | Cria o pedido (preço calculado no servidor) |
| `GET` | `/api/pedidos` | Pedidos do próprio usuário |
| `GET` | `/api/pedidos/:id` | Detalhe, restrito ao dono |
| `POST` | `/api/upload` | Foto de referência, reconvertida para WebP |

### Administração

| Método | Rota | O que faz |
| --- | --- | --- |
| `GET` | `/api/admin/pedidos` | Fila completa |
| `GET` | `/api/admin/pedidos/:id` | Detalhe com dados de contato |
| `PATCH` | `/api/admin/pedidos/:id` | Avança o status ou recusa com justificativa |
| `GET` `POST` `PATCH` `DELETE` | `/api/admin/produtos` | CRUD do catálogo |
| `GET` | `/api/admin/grupos` | Grupos de personalização disponíveis |
| `GET` `POST` `DELETE` | `/api/admin/agenda/bloqueios` | Datas bloqueadas |
| `GET` `PATCH` | `/api/admin/agenda/config` | Limite de pedidos por dia |

### Erros

Toda falha sai no mesmo formato, `{ erro, codigo }`. O `codigo` existe para a
tela decidir o que fazer sem depender do texto da mensagem: um `409` com
`data_indisponivel` devolve o cliente ao calendário, enquanto os demais `409`
apenas exibem o aviso. Se o texto mudasse, o comportamento continuaria correto.

## 7. Autenticação e autorização

Sessão por cookie emitida pelo Better Auth e guardada no aparelho pelo
`expo-secure-store` — armazenamento cifrado do sistema operacional, não
`AsyncStorage` em texto claro.

A autorização tem **dois middlewares encadeados**:

- `exigirSessao` — resolve a sessão e coloca o usuário no contexto. Aqui o papel
  é normalizado: só a string exata `'admin'` promove; qualquer outro valor no
  banco (nulo, vazio, lixo) vira `'cliente'`.
- `exigirAdmin` — recusa com `403` quem não é administrador.

O campo `role` é declarado com `input: false` no Better Auth: **não há caminho
pela API para alguém se promover**. Nem no cadastro, nem na edição de perfil. A
promoção é um `UPDATE` manual no banco, feito por quem tem acesso ao servidor.

Isso foi verificado contra o servidor, e não apenas assumido: `POST
/api/auth/update-user` com `{"role":"admin"}` no corpo, partindo de uma sessão
de cliente legítima, é recusado com `FIELD_NOT_ALLOWED` — a requisição inteira
falha, o nome e o telefone enviados junto também não são gravados.

É esse mesmo endpoint que a edição de perfil usa. O aplicativo envia apenas
`name` e `telefone`; o e-mail fica de fora porque é a identidade de login e a
troca exigiria verificar o endereço novo.

No aplicativo, a autorização aparece na estrutura de rotas. Os grupos
`(auth)`, `(cliente)` e `(admin)` têm cada um seu `_layout.tsx`, que redireciona
quem não deveria estar ali. Mas isso é conveniência de navegação, não segurança:
**toda rota administrativa é verificada no servidor**, independentemente do que
o aplicativo faça. Um APK modificado não ganha nada.

## 8. Integração aplicativo ↔ API

O cliente HTTP foi dividido em dois arquivos de propósito. `client.ts` importa o
Better Auth, que puxa o `expo-secure-store` e só carrega dentro do aplicativo.
`base.ts` tem o que não depende do Expo — montagem da URL e formato do erro — e
por isso continua coberto por `node --test`.

As chamadas ficam em `app/src/api/`, uma por área, e são consumidas pelas telas
através do TanStack Query. Isso dá cache, revalidação e estados de
carregamento/erro sem `useEffect` manual em cada tela.

Duas armadilhas encontradas na integração:

**A variável de ambiente é substituída em tempo de build.** O Expo troca
`process.env.EXPO_PUBLIC_API_URL` por texto literal onde a expressão aparecer.
Ela é lida dentro de uma função, e não no topo do módulo, para que o teste
consiga exercitar o caso de a variável estar ausente. E, faltando ela, o erro
lançado diz exatamente o que fazer — sem isso, todo `fetch` iria para um caminho
relativo e falharia com um genérico "Network request failed".

**Upload como `multipart/form-data`.** A foto é enviada em requisição separada,
que devolve uma URL; o pedido guarda a URL. Assim, refazer o pedido depois de um
erro de validação não obriga a subir a imagem de novo.

## 9. Princípios de UX aplicados

**Não deixar errar.** Telefone e preço têm máscara aplicada enquanto se digita
— o telefone vira `(49) 99999-9999` e o preço do catálogo se formata em reais. O calendário não oferece datas indisponíveis — em vez de
aceitar e recusar depois, ele já mostra o dia em cinza com o motivo ("agenda
cheia", "não produzimos nessa data"). Prevenir o erro é melhor do que reportá-lo.

**O preço sempre à vista.** Um rodapé fixo acompanha a personalização e atualiza
o total a cada escolha. A pessoa nunca chega ao resumo e se surpreende.

**Feedback de estado, não tela em branco.** Cada lista tem três estados
desenhados: carregando, vazia (com texto que explica o que fazer) e com erro
(com botão de tentar de novo).

**O status como linha do tempo.** O acompanhamento é um *stepper* de quatro
etapas — Recebido, Em produção, Pronto, Entregue — e não um rótulo de texto. A
posição na linha comunica progresso de relance.

**Correções feitas a partir de uso real.** Três ajustes saíram de testar o
aplicativo no aparelho, e não do desenho original:

1. *Campo escondido atrás do teclado.* Em modo ponta a ponta, o Android desenha
   o aplicativo sob as barras do sistema e o teclado sobe **por cima** do
   conteúdo: o campo no fim do formulário sumia e a pessoa digitava às cegas.
   Resolvido com `react-native-keyboard-controller` — a abordagem que a própria
   documentação do Expo recomenda para formulários — encapsulado num componente
   `Rolagem` usado por todas as telas com campo de digitar.
2. *Senha sem como conferir.* Adicionado o olho de revelar. Ao revelar, o campo
   desliga a autocorreção: com o texto à mostra, o Android passaria a guardar a
   senha digitada no dicionário do teclado.
3. *Seletores em pílula pouco legíveis.* As escolhas que ficam gravadas (horário,
   forma de recebimento, pagamento, categoria) passaram de pílulas arredondadas
   para linhas de largura total com rádio. Ocupa mais altura, e em troca o rótulo
   não quebra e os acréscimos de preço ficam todos alinhados na mesma coluna, o
   que torna a comparação imediata. Os **filtros** continuam em pílula
   horizontal: em coluna, empurrariam para fora da tela justamente a lista que
   filtram.

## 10. Testes

**135 testes automatizados**, com o executor nativo do Node (`node --test`), sem
dependência de framework externo. Distribuídos assim:

| Área | Testes | O que cobrem |
| --- | ---: | --- |
| `shared/` | 34 | Preço, disponibilidade, formatação e schemas |
| `api/servicos/` | 28 | Criação de pedido, leitura restrita ao dono, agenda |
| `api/rotas/` | 53 | Rotas com banco real, incluindo autorização |
| `api/db/`, `api/middleware/`, montagem | 11 | Schema, seed, resolução de sessão e as rotas montadas |
| `app/` | 9 | Cliente HTTP, tradução de erros de autenticação |

A ênfase está nas regras que, se quebrarem, custam dinheiro ou expõem dados:
que o preço não vem do cliente, que um usuário não lê o pedido de outro, que a
rota administrativa recusa quem não é administrador, que a data não escorrega de
fuso, que o upload recusa endereço externo e travessia de caminho.

Os testes de rota sobem a aplicação inteira contra um PostgreSQL real, em vez de
usar simulacros. Um simulacro de banco confirma a chamada que você imaginou, não
a que o banco aceita.

## 11. Publicação

A API roda numa VPS Ubuntu ARM64 **compartilhada com outros projetos**, e isso
condicionou várias escolhas:

- **Nada em porta padrão.** API em `127.0.0.1:8100`, Postgres em
  `127.0.0.1:7520` — os dois em *loopback*, sem porta aberta para a internet.
- **Node próprio.** O sistema tem Node 22, exigido por outros projetos; este
  precisa da 24. Em vez de trocar o Node de todos, a versão 24 fica em
  `/opt/node24` e entra no `PATH` apenas dentro do `deploy.sh` e do serviço.
- **Exposição por Cloudflare Tunnel.** O túnel liga `gabrie.dev` à porta local.
  Não há porta aberta no *firewall*, e o certificado TLS é gerenciado.
- **Serviço gerenciado por systemd**, com reinício automático.
- **Backups com `umask 077`** (permissão 0600): os dumps contêm e-mails e hashes
  de senha, e a máquina é compartilhada.

O `deploy` é automatizado por GitHub Actions: um *push* na `main` conecta por
SSH, atualiza o código, roda migrações, reinicia o serviço e **verifica a saúde**
— se `/health` não responder, o deploy falha em vez de deixar o serviço quebrado
no ar.

O APK é publicado em `/app`, uma página simples de download. O endereço leva um
parâmetro de versão (`?v=<timestamp>`) porque a borda da Cloudflare guarda em
cache arquivos `.apk` por extensão e reescreve o `Cache-Control` da origem —
sem o parâmetro, quem baixasse depois de uma atualização receberia o APK antigo.

## 12. Problemas enfrentados e soluções

**O preço podia divergir entre tela e cobrança.** Uma primeira versão resolvia
os acréscimos contra um catálogo escrito no código do aplicativo. Editar o preço
de uma opção no servidor fazia a tela mostrar um total diferente do cobrado. A
função passou a resolver os deltas contra o produto que a API devolveu, e a
versão que usava o catálogo estático foi removida — ela causou o mesmo defeito
duas vezes, no servidor e no aplicativo.

**A antecedência mudava de resposta ao longo do dia.** Medida da hora atual, uma
data podia estar disponível de manhã e indisponível à tarde. Passou a ser medida
do início de hoje até o início do dia escolhido: um dia inteiro está disponível
ou não, e com 48 horas o primeiro dia livre é sempre D+2.

**Foto chegando deitada.** Foto tirada com o celular de lado tem a orientação no
EXIF, não nos pixels. Sem tratar, a confeiteira recebia a imagem virada. O
`sharp` aplica a orientação antes de redimensionar.

**Upload capaz de derrubar o processo.** `formData()` carrega o arquivo inteiro
na memória. Um envio de centenas de MB derrubaria o serviço — e a máquina é
compartilhada. O `Content-Length` passou a ser conferido **antes** de ler o
corpo. A validação do conteúdo é feita pelo `sharp`, que decodifica de verdade:
extensão e `content-type` vêm do cliente e mentem. E o nome do arquivo é
sorteado, porque usar o nome enviado traria travessia de caminho e sobrescrita
do arquivo de outra pessoa de graça.

**Build que reaproveitava o endereço antigo.** `EXPO_PUBLIC_API_URL` não é
entrada da tarefa do Gradle: trocar o endereço não invalida o pacote JavaScript
já compilado, e um build seguinte "bem-sucedido" saía com o endereço anterior
embutido. Detectado ao inspecionar o bundle dentro do APK. O procedimento agora
apaga o bundle antes e confere o endereço depois — documentado em
`infra/README.md`.

**Ordem das opções mudando entre pedidos.** Sem coluna de ordem, o `SELECT`
devolvia as seleções na ordem que o Postgres quisesse, e o detalhe mostrava
"Recheio, Tamanho, Cobertura" num pedido e outra sequência no seguinte. Uma
coluna `ordem` fixou a apresentação.

## 13. Limitações conhecidas

- **Pagamento não é processado.** A tela registra a forma escolhida (PIX ou na
  entrega); a cobrança acontece fora do aplicativo. Integrar um provedor real
  exigiria conta de cobrança e tratamento de dados sensíveis, fora do escopo.
- **Sem notificação push.** O cliente vê o status ao abrir o aplicativo.
- **Android apenas.** O código é multiplataforma, mas o build de iOS exige conta
  paga de desenvolvedor Apple, e não foi gerado nem testado.
- **APK assinado com chave de depuração.** Suficiente para instalação direta;
  publicação na Play Store exigiria chave de release dedicada.
- **Testado em emulador** (Pixel 9 Pro, Android 16). Não houve teste em aparelho
  físico sobre rede móvel real.
- **Um único perfil administrativo.** Não há distinção entre confeiteira,
  atendente e entregador.
- **Sem agenda de endereços.** O perfil permite editar os dados pessoais, mas
  não guarda uma lista de endereços: o endereço de entrega é digitado a cada
  pedido e fica gravado no próprio pedido. Um cliente que sempre recebe no mesmo
  lugar redigita o endereço toda vez. A tabela e a tela existiriam sem
  dificuldade técnica — faltou tempo dentro do prazo da entrega.

## 14. Conclusão

O aplicativo cobre o fluxo completo das duas pontas — do cliente que monta a
encomenda à confeiteira que a produz — sobre uma API própria com banco
relacional, autenticação, autorização por papel e deploy automatizado.

A decisão que mais moldou o resultado foi o pacote compartilhado. Ela nasceu de
um problema prático (o total na tela precisa bater com o cobrado) e acabou
definindo a fronteira de confiança do sistema: **o aplicativo mostra, o servidor
decide**. É por isso que o preço não trafega do cliente para o servidor, que a
disponibilidade é reconferida na criação do pedido e que o papel administrativo
não pode ser atribuído por nenhuma rota. O aplicativo é a interface; a
autoridade está do outro lado.
