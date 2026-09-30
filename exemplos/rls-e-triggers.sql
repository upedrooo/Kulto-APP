-- ---------------------------------------------------------------------------
-- Kulto · segurança e regra de negócio dentro do banco
--
-- Trechos reais do schema, escolhidos porque mostram a decisão central da
-- arquitetura: o cliente fala direto com o Postgres, e é o Postgres que
-- decide o que cada um vê e o que cada um pode fazer.
--
-- O app carrega apenas a `anon key`, que sozinha não abre nada. A
-- `service_role`, que ignora RLS, existe só nas variáveis de ambiente das
-- Edge Functions.
-- ---------------------------------------------------------------------------


-- 1 · VISIBILIDADE EM CAMADAS -----------------------------------------------
--
-- Uma review é visível quando:
--   · é sua, sempre;
--   · é pública E o perfil do autor é público;
--   · é "só para seguidores" E você segue o autor.
--
-- Repare no segundo caso: não basta a review ser pública. Se a pessoa fechar
-- o perfil, as reviews públicas dela fecham junto — a regra é composta, e
-- fica composta num lugar só. Espalhar isso pelas telas seria garantir que
-- uma delas esqueceria metade.

create policy "reviews_select" on reviews
  for select
  using (
    auth.uid() = author_id
    or (
      visibility = 'public'
      and exists (
        select 1 from profiles p
        where p.id = reviews.author_id and p.visibility = 'public'
      )
    )
    or (
      visibility = 'followers'
      and exists (
        select 1 from follows f
        where f.follower_id = auth.uid() and f.following_id = reviews.author_id
      )
    )
  );


-- 2 · REGRA DE NEGÓCIO QUE NÃO SE BURLA -------------------------------------
--
-- O nome de usuário só pode mudar a cada 14 dias.
--
-- Isso poderia ser uma verificação no formulário. Seria uma sugestão: quem
-- abrisse o console trocaria o @ quantas vezes quisesse, e cada troca quebra
-- os links que apontam para o perfil.
--
-- Como trigger, a regra vale para qualquer caminho até a tabela.

create or replace function enforce_username_cooldown()
returns trigger
language plpgsql
as $$
declare
  espera constant interval := interval '14 days';
begin
  if new.username is not distinct from old.username then
    -- Não mexeu no @: preserva a data, aconteça o que acontecer no resto da
    -- linha (nome, bio, foto). Sem isto, editar a bio zeraria a contagem.
    new.username_changed_at := old.username_changed_at;
    return new;
  end if;

  -- auth.uid() nulo = SQL Editor ou service_role, isto é, suporte arrumando
  -- algo à mão. A regra existe para pedido vindo de gente logada.
  if auth.uid() is not null
     and old.username_changed_at is not null
     and old.username_changed_at > now() - espera then
    raise exception 'Troca de @ só a cada 14 dias.' using errcode = 'P0001';
  end if;

  new.username_changed_at := now();
  return new;
end;
$$;

-- O app reconhece o P0001 e traduz em "tente de novo em N dias", com a conta
-- feita a partir do `username_changed_at` que ele já tem em mãos.


-- 3 · NOTIFICAÇÃO COMO EFEITO DO DADO, NÃO COMO CHAMADA ---------------------
--
-- Ninguém "envia" notificação no Kulto. Elas nascem de triggers: o dado
-- mudou, a notificação existe. O cliente assina a tabela por Realtime e a
-- tela atualiza sozinha.
--
-- A vantagem é que não há caminho que esqueça de notificar. Seguir alguém
-- por qualquer meio — tela, script, importação — gera a notificação.

create or replace function notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notifications (recipient_id, type, actor_id)
  values (new.following_id, 'follow', new.follower_id);
  return new;
end;
$$;


-- 4 · A CURTIDA QUE NÃO VIRA SPAM -------------------------------------------
--
-- Curtir, descurtir e curtir de novo geraria três notificações iguais. O
-- trigger da curtida checa se já houve aviso da mesma pessoa, na mesma
-- review, nas últimas 24 horas — e se houve, não insere de novo.
--
-- Esta é a parte que decide; o insert vem depois.

if exists (
  select 1 from notifications n
  where n.recipient_id = review_author
    and n.type = 'like'
    and n.actor_id = new.user_id
    and n.data->>'review_id' = new.review_id::text
    and n.created_at > now() - interval '24 hours'
) then
  return new;
end if;

-- No app, as curtidas que sobram ainda são agrupadas por review antes de
-- virar linha na tela — ver exemplos/notificacoes-agrupadas.ts.


-- 5 · O CACHE DE OBRAS ------------------------------------------------------
--
-- `works` não é catálogo: é o que sobrou das buscas em TMDB, Open Library e
-- IGDB. A chave única por (fonte, id externo) é o que impede a mesma obra de
-- existir duas vezes quando duas pessoas a avaliam no mesmo minuto.

create table works (
  id uuid primary key default gen_random_uuid(),
  source work_source not null,
  external_id text not null,
  vertical vertical_type not null,
  title text not null,
  year int,
  poster_url text,
  metadata jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  unique (source, external_id)
);
