-- Expand the combat-item catalog for both seasons.
-- Safe to run repeatedly. Existing purchases, equipment, gold and progression are untouched.

insert into public.sgz_shop_catalog
  (item_key,item_type,side,target_key,name,price,skin_class,enabled)
values
  ('tuntianScale','equipment','plants','s2Tuntian','屯田糧秤',150,null,true),
  ('crossbowMechanism','equipment','plants','s2Crossbow','連弩機括',210,null,true),
  ('shieldStuds','equipment','plants','s2Shield','虎衛盾釘',170,null,true),
  ('halberdEdge','equipment','plants','s2Halberd','拒馬長鋒',210,null,true),
  ('xiahouArmor','equipment','plants','s2Xiahou','獨目戰甲',240,null,true),
  ('dianweiHalberds','equipment','plants','s2DianWei','惡來雙戟',290,null,true),
  ('guojiaScroll','equipment','plants','s2GuoJia','先機竹簡',300,null,true),
  ('caoCaoBanner','equipment','plants','s2CaoCao','魏武令旗',340,null,true),
  ('redScarfBlade','equipment','zombies','normal','赤巾骨刃',100,null,true),
  ('corpseKingBoots','equipment','zombies','football','屍王鐵靴',170,null,true),
  ('jesterVest','equipment','zombies','jester','鬼鈴皮甲',170,null,true),
  ('bombPowder','equipment','zombies','bombJester','爆桶火藥',220,null,true),
  ('titanArmor','equipment','zombies','corpseTitan','屍旗鎧甲',300,null,true),
  ('stonePouch','equipment','zombies','peaZombie','飛石皮囊',220,null,true),
  ('necromancerCrown','equipment','zombies','necromancer','冥火法冠',320,null,true),
  ('ratFangCharm','equipment','zombies','s2Rat','群牙骨符',150,null,true),
  ('nailQuiver','equipment','zombies','s2Nail','腐釘箭匣',210,null,true),
  ('coffinIronBands','equipment','zombies','s2Coffin','棺盾鐵箍',230,null,true),
  ('medicNeedleKit','equipment','zombies','s2Medic','縫魂針囊',240,null,true),
  ('ramIronHead','equipment','zombies','s2Ram','破門鐵角',300,null,true),
  ('machaoSkill','skill','plants','machao','西涼突陣訣',320,null,true),
  ('zhangfeiSkill','skill','plants','zhangfei','長坂虎嘯',320,null,true),
  ('kongmingSkill','skill','plants','kongming','八陣天雷卷',350,null,true),
  ('crossbowVolley','skill','plants','s2Crossbow','連弩校射令',260,null,true),
  ('dianweiGuard','skill','plants','s2DianWei','帳前死衛訣',340,null,true),
  ('guojiaForesight','skill','plants','s2GuoJia','料敵先機策',340,null,true),
  ('bombJesterSkill','skill','zombies','bombJester','爆爆連環引',300,null,true),
  ('fireCatapultSkill','skill','zombies','fireCatapult','烈焰投石術',330,null,true),
  ('necromancerSkill','skill','zombies','necromancer','冥火招魂幡',350,null,true),
  ('medicStitching','skill','zombies','s2Medic','補肉縫骨秘術',320,null,true)
on conflict(item_key) do update set
  item_type=excluded.item_type,
  side=excluded.side,
  target_key=excluded.target_key,
  name=excluded.name,
  price=excluded.price,
  skin_class=excluded.skin_class,
  enabled=excluded.enabled;
