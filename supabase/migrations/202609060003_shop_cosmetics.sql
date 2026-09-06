-- Expand the cosmetic catalog and persist one active item per cosmetic slot.
-- Safe to run repeatedly.

alter table public.sgz_shop_catalog
  add column if not exists cosmetic_slot text not null default 'frame'
  check (cosmetic_slot in ('frame','ornament','battlefield'));

insert into public.sgz_shop_catalog
  (item_key,item_type,side,target_key,name,price,skin_class,enabled,cosmetic_slot)
values
  ('jadeSealFrame','skin','plants','all','玉璽金框',160,'skin-jade-frame',true,'frame'),
  ('peachBloomFrame','skin','plants','all','桃園花框',160,'skin-peach-frame',true,'frame'),
  ('moonSilverFrame','skin','zombies','all','月影銀框',160,'skin-moon-frame',true,'frame'),
  ('bloodMoonBoneFrame','skin','zombies','all','血月骨框',220,'skin-blood-frame',true,'frame'),
  ('guanyuDragonCrown','skin','plants','firepea','關羽青龍冠',220,'ornament-guanyu-crown',true,'ornament'),
  ('zhaoyunIcePlume','skin','plants','zhaoyun','趙雲冰晶翎',190,'ornament-zhaoyun-ice',true,'ornament'),
  ('zhangfeiTigerGuard','skin','plants','zhangfei','張飛虎首肩甲',190,'ornament-zhangfei-tiger',true,'ornament'),
  ('liubeiJadePendant','skin','plants','liubei','劉備仁德玉佩',220,'ornament-liubei-jade',true,'ornament'),
  ('jesterGhostBell','skin','zombies','jester','小丑鬼面鈴',180,'ornament-jester-bell',true,'ornament'),
  ('titanCorpseCrown','skin','zombies','corpseTitan','巨魁屍王冠',230,'ornament-titan-crown',true,'ornament'),
  ('peachPetals','skin','plants','all','桃園花瓣',130,'battlefield-peach-petals',true,'battlefield'),
  ('redCliffEmbers','skin','plants','all','赤壁火星',180,'battlefield-redcliff-embers',true,'battlefield'),
  ('hanGoldenRain','skin','plants','all','漢室金雨',230,'battlefield-han-gold',true,'battlefield'),
  ('ghostFireField','skin','zombies','all','幽都鬼火',130,'battlefield-ghost-fire',true,'battlefield'),
  ('bloodMoonAsh','skin','zombies','all','血月飛灰',180,'battlefield-blood-ash',true,'battlefield'),
  ('frostNightField','skin','zombies','all','寒夜霜晶',230,'battlefield-frost',true,'battlefield')
on conflict(item_key) do update set
  item_type=excluded.item_type,
  side=excluded.side,
  target_key=excluded.target_key,
  name=excluded.name,
  price=excluded.price,
  skin_class=excluded.skin_class,
  enabled=excluded.enabled,
  cosmetic_slot=excluded.cosmetic_slot;

create or replace function public.sgz_activate_skin(p_device_id text, p_item_key text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.sgz_profiles%rowtype;
  v_item public.sgz_shop_catalog%rowtype;
  v_inv jsonb;
  v_slot text;
begin
  select * into v_row
  from public.sgz_profiles
  where user_id=v_uid
  for update;

  if v_row.active_device_id is distinct from p_device_id
     or v_row.active_seen_at <= now()-interval '120 seconds' then
    raise exception 'DEVICE_LOCKED';
  end if;

  select * into v_item
  from public.sgz_shop_catalog
  where item_key=p_item_key and enabled and item_type='skin';
  if not found then raise exception 'ITEM_NOT_FOUND'; end if;

  v_inv := coalesce(v_row.profile->'inventory','{}'::jsonb);
  if coalesce((v_inv #>> array['skins',p_item_key])::integer,0)<1 then
    raise exception 'NOT_OWNED';
  end if;

  v_slot := coalesce(nullif(v_item.cosmetic_slot,''),'frame');
  v_inv := jsonb_set(v_inv,'{activeCosmetics}',coalesce(v_inv->'activeCosmetics','{}'::jsonb),true);
  v_inv := jsonb_set(v_inv,array['activeCosmetics',v_item.side],coalesce(v_inv #> array['activeCosmetics',v_item.side],'{}'::jsonb),true);
  v_inv := jsonb_set(v_inv,array['activeCosmetics',v_item.side,v_slot],to_jsonb(coalesce(v_item.skin_class,'')),true);

  -- Keep the legacy frame field in sync for old clients and old save codes.
  if v_slot='frame' then
    v_inv := jsonb_set(v_inv,'{activeSkins}',coalesce(v_inv->'activeSkins','{}'::jsonb),true);
    v_inv := jsonb_set(v_inv,array['activeSkins',v_item.side],to_jsonb(coalesce(v_item.skin_class,'')),true);
  end if;

  update public.sgz_profiles
  set profile=jsonb_set(v_row.profile,'{inventory}',v_inv,true),
      save_version=save_version+1,
      active_seen_at=now(),
      updated_at=now()
  where user_id=v_uid;

  return public.sgz_profile_response(v_uid);
end $$;

revoke all on function public.sgz_activate_skin(text,text) from public, anon;
grant execute on function public.sgz_activate_skin(text,text) to authenticated;
