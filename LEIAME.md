# ReTreino · como colocar no ar

O site roda no GitHub Pages. Contas, vínculo aluno–treinador e dados ficam no Supabase (gratuito).

## 1. Criar o Supabase (uma vez)
1. Em supabase.com, crie um projeto.
2. Vá em **SQL Editor → New query**, cole o conteúdo de `schema.sql` e clique em **Run**.
3. Vá em **Project Settings → API** e copie a **Project URL** e a chave **anon public**.
4. Abra `config.js` e cole os dois valores entre as aspas.
5. Em **Authentication → URL Configuration**, coloque em *Site URL* o endereço do seu site (ex.: `https://cidrinematheus-tech.github.io/retreino-app/`).
6. Para testar rápido: em **Authentication → Providers → Email**, desligue *Confirm email*. Depois você pode ligar de novo.

## 2. Subir no GitHub
Envie todos os arquivos para a raiz do repositório (Add file → Upload files) e deixe o Pages ativo (Settings → Pages → branch `main`, pasta `/ (root)`).

## 3. Usar
- Treinador: crie a conta em `conta.html` escolhendo "Sou treinador". No Painel, copie o link de convite.
- Aluno: abre o link de convite, cria a conta e já fica vinculado ao treinador.

## Arquivos
index.html (página inicial) · conta.html (entrar/criar conta) · treinador.html + treinador.js · aluno.html + aluno.js · core.js · app.css · config.js · schema.sql · manifest.json · sw.js · logo.png · icon-192.png · icon-512.png

## Observações
- A chave `anon` é pública por padrão. A proteção dos dados vem das regras (RLS) do `schema.sql`: o aluno só vê os próprios dados e o treinador só vê os alunos vinculados a ele.
- São dados de saúde. Peça o consentimento dos alunos para guardar as avaliações e mantenha o projeto Supabase só com você como administrador.
