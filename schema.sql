-- ReTreino · rode este arquivo inteiro no Supabase (SQL Editor → New query → Run)

create table profiles(
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('treinador','aluno')),
  name text not null,
  coach_id uuid references profiles(id) on delete set null,
  coach_nome text,
  invite_code text unique,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);
create table plans(
  aluno_id uuid primary key references profiles(id) on delete cascade,
  coach_id uuid not null references profiles(id),
  dias jsonb not null default '[]',
  updated_at timestamptz default now()
);
create table tests(
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references profiles(id) on delete cascade,
  coach_id uuid not null references profiles(id),
  tipo text not null,
  x text default '',
  dados jsonb default '{}',
  resultado jsonb not null default '[]',
  created_at timestamptz default now()
);
create table logs(
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references profiles(id) on delete cascade,
  dia text, minutos int, pse numeric, carga int,
  detalhes jsonb default '[]',
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table plans enable row level security;
alter table tests enable row level security;
alter table logs enable row level security;

-- perfis: cada um vê o próprio; o treinador vê os alunos vinculados a ele
create policy p_sel on profiles for select using (id = auth.uid() or coach_id = auth.uid());
create policy p_upd on profiles for update using (id = auth.uid() or coach_id = auth.uid());
revoke insert, delete, update on profiles from authenticated, anon;
grant update (name, data) on profiles to authenticated;

-- treino
create policy pl_coach on plans for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid() and exists (select 1 from profiles p where p.id = aluno_id and p.coach_id = auth.uid()));
create policy pl_aluno on plans for select using (aluno_id = auth.uid());

-- avaliações
create policy t_coach on tests for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid() and exists (select 1 from profiles p where p.id = aluno_id and p.coach_id = auth.uid()));
create policy t_aluno on tests for select using (aluno_id = auth.uid());

-- registros de treino
create policy lg_aluno on logs for all using (aluno_id = auth.uid()) with check (aluno_id = auth.uid());
create policy lg_coach on logs for select using (exists (select 1 from profiles p where p.id = aluno_id and p.coach_id = auth.uid()));

-- cria o perfil automaticamente quando a conta é criada
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id, role, name, invite_code) values (
    new.id,
    case when new.raw_user_meta_data->>'role' = 'treinador' then 'treinador' else 'aluno' end,
    coalesce(nullif(new.raw_user_meta_data->>'name',''), 'Sem nome'),
    case when new.raw_user_meta_data->>'role' = 'treinador' then upper(substr(md5(random()::text || new.id::text), 1, 8)) end
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- vincula o aluno logado ao treinador dono do código de convite
create function vincular(codigo text) returns text language plpgsql security definer set search_path = public as $$
declare c profiles;
begin
  select * into c from profiles where invite_code = upper(trim(codigo)) and role = 'treinador';
  if not found then raise exception 'Código inválido'; end if;
  update profiles set coach_id = c.id, coach_nome = c.name where id = auth.uid() and role = 'aluno';
  return c.name;
end $$;
grant execute on function vincular(text) to authenticated;
