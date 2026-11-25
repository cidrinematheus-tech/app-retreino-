-- ReTreino: permissões mínimas para o módulo do aluno.
-- Execute no Supabase SQL Editor. Mantém RLS ativo.
grant usage on schema public to authenticated;

grant select on table public.profiles to authenticated;
grant select on table public.plans to authenticated;
grant select, insert on table public.logs to authenticated;

-- O aluno só pode ler seu próprio plano; o treinador pode gerenciar
-- planos dos alunos vinculados conforme as políticas existentes.
grant select, insert, update, delete on table public.plans to authenticated;

-- Para o módulo do aluno registrar sessões, a política lg_aluno existente
-- permite inserir somente linhas cujo aluno_id seja o próprio auth.uid().
-- A política lg_aluno também permite ao aluno consultar/alterar/excluir
-- seus próprios registros; a política lg_coach permite leitura ao treinador.
