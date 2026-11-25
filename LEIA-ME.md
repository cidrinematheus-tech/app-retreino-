# ReTreino — módulo de treinamento do aluno

## Arquivos
- `treinamento.html`: página independente para aluno autenticado.
- `permissoes_modulo_aluno.sql`: permissões de tabela necessárias (mantém RLS).
- `supabase/functions/gerar-treino/index.ts`: função server-side para geração de sugestão por IA.

## 1. Publicar o HTML
Coloque `treinamento.html` e o `config.js` existente na mesma pasta publicada pelo GitHub Pages.
O `config.js` deve expor:
```js
window.RT_CFG = { url: "https://SEU-PROJETO.supabase.co", key: "SUA_CHAVE_PUBLICA" };
```
Use apenas a chave pública/publishable. Nunca use `sb_secret` ou `service_role` no navegador.

## 2. Permissões do Supabase
Revise as políticas RLS já existentes antes de executar `permissoes_modulo_aluno.sql`.
O módulo espera:
- `profiles`: aluno pode ler somente o próprio perfil;
- `plans`: aluno pode ler somente o próprio plano;
- `logs`: aluno pode inserir e consultar somente os próprios registros.
As políticas RLS enviadas anteriormente (`p_sel`, `pl_aluno`, `lg_aluno`) são a base esperada. Não desative RLS.
A tabela `logs` do schema informado não possui `coach_id`; a leitura do treinador depende da política `lg_coach` existente.

## 3. Configurar IA (necessário para o botão "Treinar com IA")
A IA não funciona apenas com o HTML. É necessário publicar uma Supabase Edge Function para manter a chave da OpenAI fora do navegador.

No projeto Supabase:
1. Instale/abra o Supabase CLI e faça login.
2. Crie/publice a função `gerar-treino` usando o arquivo em `supabase/functions/gerar-treino/index.ts`.
3. Configure o secret `OPENAI_API_KEY` no projeto Supabase (Edge Functions → Secrets).
4. A função usa as variáveis gerenciadas pelo Supabase `SUPABASE_URL` e `SUPABASE_ANON_KEY`.
5. Faça deploy da função `gerar-treino`.

Exemplo CLI (na pasta do projeto Supabase):
```bash
supabase functions deploy gerar-treino
supabase secrets set OPENAI_API_KEY=SUA_CHAVE_OPENAI
```
Não coloque a chave OpenAI no `config.js`, no HTML ou no GitHub.

## 4. Compatibilidade do plano
O módulo lê `plans.dias` como JSON. Tenta exibir estruturas comuns com `nome/name/dia/titulo` e `exercicios/exercises/itens`. Se seu aplicativo grava outro formato, ajuste `renderPlan()` no HTML para corresponder ao formato real.

## 5. Limitações e segurança
- O módulo é destinado a contas com `profiles.role = 'aluno'`.
- O registro de sessão grava em `logs` (`aluno_id`, `dia`, `minutos`, `pse`, `carga`, `detalhes`).
- A IA gera uma sugestão, não altera o plano oficial nem substitui avaliação do treinador.
- Antes de uso real, teste com conta fictícia de aluno e confirme as políticas RLS.
- Adicione limites de uso/rate limiting à Edge Function antes de disponibilizar IA em escala, para controlar custos.
