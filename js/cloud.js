function initSupabaseClient(force=false){if(supabaseClient&&!force)return supabaseClient;const url=SUPABASE_URL.trim().replace(/\/+$/,''),key=SUPABASE_ANON_KEY.trim();if(!url||!key||!window.supabase){supabaseClient=null;accountStatus('雲端尚未連線；目前使用本機存檔。',true);return null}supabaseClient=window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return supabaseClient}
function getDeviceId(){let id=localStorage.getItem(DEVICE_KEY);if(!id){id=(globalThis.crypto?.randomUUID?.()||`dev-${Date.now()}-${Math.random().toString(36).slice(2)}`);localStorage.setItem(DEVICE_KEY,id)}return id}
function getDeviceName(){const ua=navigator.userAgent||'',browser=ua.includes('Edg')?'Edge':ua.includes('Chrome')?'Chrome':ua.includes('Safari')?'Safari':'Browser',mobile=/iPhone|iPad|Android/i.test(ua)?'手機/平板':'電腦';return `${browser} ${mobile}`}
function lockFresh(lock){return !!(lock?.deviceId&&Date.now()-(Date.parse(lock.activeSeenAt||0)||0)<120000)}
function isThisDevice(lock=playerProfile.syncLock){return lock?.deviceId===getDeviceId()}
function markActiveDevice(){playerProfile.syncLock={deviceId:getDeviceId(),deviceName:getDeviceName(),activeSeenAt:new Date().toISOString()}}
function profileTime(p){return Date.parse(p?.updatedAt||0)||0}
function cloudRowTime(row){return Math.max(Date.parse(row?.updated_at||0)||0,profileTime(row?.profile||{}))}
function isRpcMissing(error){return error?.code==='PGRST202'||/Could not find the function|schema cache/i.test(error?.message||'')}
function rpcResult(data){return Array.isArray(data)?data[0]:data}
function applyCloudResult(data,applyProfile=true){const row=rpcResult(data);if(!row)return null;const incomingVersion=Number(row.save_version||0),canApply=!!(row.profile&&applyProfile&&incomingVersion>=cloudSaveVersion);if(canApply){playerProfile=normalizeProfile(row.profile);playerProfile.updatedAt=row.updated_at||playerProfile.updatedAt}if(row.profile){playerProfile.cloudOwnerUserId=currentUser?.id||playerProfile.cloudOwnerUserId||'';playerProfile.syncLock={deviceId:row.active_device_id||'',deviceName:row.active_device_name||'',activeSeenAt:row.active_seen_at||''};saveProfile(true,false,false)}cloudSaveVersion=Math.max(cloudSaveVersion,incomingVersion);cloudLockOwned=row.active_device_id===getDeviceId();return row}
function cloudErrorMessage(error){const msg=error?.message||String(error||'未知錯誤');if(isRpcMissing(error))return '雲端資料庫尚未套用正式同步升級，已停止不安全的雲端寫入。';if(/DEVICE_LOCKED|active device/i.test(msg))return '另一台裝置正在同步；這台目前為唯讀。若要繼續，請按「接管此裝置」。';if(/VERSION_CONFLICT/i.test(msg))return '雲端資料已被更新，請先使用雲端資料後再操作。';return msg}
async function claimCloudDevice(takeover=false,applyProfile=true){try{if(!currentUser)return false;const client=initSupabaseClient(),owner=playerProfile.cloudOwnerUserId,initial=owner&&owner!==currentUser.id?normalizeProfile({}):normalizeProfile(playerProfile);const {data,error}=await client.rpc('sgz_claim_device',{p_device_id:getDeviceId(),p_device_name:getDeviceName(),p_takeover:takeover,p_initial_profile:initial});if(error)throw error;applyCloudResult(data,applyProfile);cloudLockOwned=true;startCloudHeartbeat();subscribeCloudOwnership();accountStatus(takeover?'已接管此裝置並取得雲端同步權限。':'這台裝置已取得雲端同步權限。');renderProfileStats?.();return true}catch(error){cloudLockOwned=false;accountStatus(cloudErrorMessage(error),true);renderProfileStats?.();return false}}
async function heartbeatCloudDevice(){if(!currentUser||!cloudLockOwned)return false;const {data,error}=await initSupabaseClient().rpc('sgz_heartbeat',{p_device_id:getDeviceId()});if(error){cloudLockOwned=false;clearInterval(cloudHeartbeatTimer);accountStatus(cloudErrorMessage(error),true);renderProfileStats?.();return false}applyCloudResult(data,false);return true}
function startCloudHeartbeat(){clearInterval(cloudHeartbeatTimer);cloudHeartbeatTimer=setInterval(()=>heartbeatCloudDevice(),30000)}
async function releaseCloudDevice(){clearInterval(cloudHeartbeatTimer);cloudLockOwned=false;if(!currentUser||!supabaseClient)return;await supabaseClient.rpc('sgz_release_device',{p_device_id:getDeviceId()}).catch?.(()=>{})}
function subscribeCloudOwnership(){if(!supabaseClient||!currentUser||!supabaseClient.channel)return;if(cloudRealtimeChannel)supabaseClient.removeChannel(cloudRealtimeChannel);cloudRealtimeChannel=supabaseClient.channel(`sgz-owner-${currentUser.id}`).on('postgres_changes',{event:'UPDATE',schema:'public',table:CLOUD_TABLE,filter:`user_id=eq.${currentUser.id}`},payload=>{const owner=payload.new?.active_device_id;if(owner&&owner!==getDeviceId()){cloudLockOwned=false;clearInterval(cloudHeartbeatTimer);accountStatus('此帳號已由另一台裝置接管；這台已切換為唯讀。',true);renderProfileStats?.()}}).subscribe()}
async function pushCloudProfile(manual=true){try{if(!currentUser){if(manual)accountStatus('請先登入帳號，再上傳雲端。',true);return false}if(!cloudLockOwned&&!await claimCloudDevice(false))return false;playerProfile.cloudOwnerUserId=currentUser.id;playerProfile.updatedAt=new Date().toISOString();const {data,error}=await initSupabaseClient().rpc('sgz_save_profile',{p_device_id:getDeviceId(),p_profile:normalizeProfile(playerProfile),p_expected_version:cloudSaveVersion});if(error)throw error;applyCloudResult(data);accountStatus(`${manual?'已同步雲端':'已自動同步雲端'}：${new Date().toLocaleString('zh-TW',{hour12:false})}`);return true}catch(error){const conflict=/VERSION_CONFLICT/i.test(error?.message||''),locked=/DEVICE_LOCKED/i.test(error?.message||'');if(locked)cloudLockOwned=false;if(conflict)await pullCloudProfile(false,'force');accountStatus('雲端同步失敗：'+cloudErrorMessage(error),true);return false}}
async function pullCloudProfile(manual=true,mode='auto'){try{const client=initSupabaseClient();if(!client||!currentUser){if(manual)accountStatus('請先登入帳號，再載入雲端。',true);return false}const {data,error}=await client.from(CLOUD_TABLE).select('*').eq('user_id',currentUser.id).eq('game',SAVE_GAME_ID).maybeSingle();if(error)throw error;if(!data){if(!await claimCloudDevice(true))return false;return pushCloudProfile(false)}const cloudProfile=normalizeProfile(data.profile||{}),localTs=profileTime(playerProfile),cloudTs=cloudRowTime(data);cloudSaveVersion=Number(data.save_version||0);cloudProfile.syncLock={deviceId:data.active_device_id||cloudProfile.syncLock?.deviceId||'',deviceName:data.active_device_name||cloudProfile.syncLock?.deviceName||'',activeSeenAt:data.active_seen_at||cloudProfile.syncLock?.activeSeenAt||''};const preserveLocal=mode!=='force'&&playerProfile.cloudOwnerUserId===currentUser.id&&localTs>cloudTs+1000;playerProfile=preserveLocal?playerProfile:cloudProfile;saveProfile(true,false,false);const claimed=await claimCloudDevice(false,!preserveLocal);if(claimed&&preserveLocal)await pushCloudProfile(false);else if(!claimed)accountStatus('已載入雲端資料；另一台裝置仍在同步，這台暫時唯讀。',true);else accountStatus(`已從雲端載入：${new Date(cloudTs||Date.now()).toLocaleString('zh-TW',{hour12:false})}`);return true}catch(error){accountStatus('雲端載入失敗：'+cloudErrorMessage(error),true);return false}}
async function startCloudMatch(level,faction){
 const battle=state,season=battle?.season||currentSeason;cloudMatchId=null;if(!currentUser)return;
 try{
  if(!cloudLockOwned&&!await claimCloudDevice(false))return;
  if(battle!==state)return;
  const rpc=season===2?'sgz_start_season2_match':'sgz_start_match';
  const {data,error}=await initSupabaseClient().rpc(rpc,{p_device_id:getDeviceId(),p_level:level,p_faction:faction});
  if(battle!==state)return;
  if(error)throw error;
  cloudMatchId=data;persistBattleState();
 }catch(error){accountStatus('雲端對戰紀錄建立失敗：'+cloudErrorMessage(error),true)}
}
function cloudMatchMinimumMs(faction,level){return (faction==='zombies'?8:30+Math.max(1,Number(level)||1)*6)*1000}
async function waitForCloudMatchVerification(waitMs){const deadline=Date.now()+waitMs,update=()=>{const seconds=Math.max(1,Math.ceil((deadline-Date.now())/1000));if(!$('modal')?.classList.contains('show')||!state?.over)return;$('modalTitle').textContent='⏳ 戰果確認中';$('modalText').textContent=`快速破關成功，安全檢查倒數 ${seconds} 秒；完成後會自動顯示戰果。`;if($('modalNext'))$('modalNext').textContent=`確認中（${seconds} 秒）…`};update();const countdown=setInterval(update,250);try{await new Promise(resolve=>setTimeout(resolve,waitMs))}finally{clearInterval(countdown)}}
async function claimCloudMatchReward(win,usedKeys=[]){
  if(!currentUser)return false;
  if(!win){cloudMatchId=null;accountStatus('本場未過關，不發放雲端戰利品。');return true}
  if(!cloudMatchId){accountStatus('本場沒有有效的雲端對戰紀錄，正在還原雲端進度。',true);await pullCloudProfile(false,'force');return false}
  const matchId=cloudMatchId,characterKey=usedKeys.find(key=>/^[a-zA-Z0-9_]+$/.test(key))||null;
  const claim=()=>initSupabaseClient().rpc('sgz_claim_level_reward',{p_device_id:getDeviceId(),p_match_id:matchId,p_character_key:characterKey});
  let {data,error}=await claim();
  if(error&&/MATCH_TOO_SHORT/i.test(error?.message||'')){
    const minimumMs=cloudMatchMinimumMs(state?.faction,state?.level),elapsed=Date.now()-(state?.cloudMatchStartedAt||Date.now()),waitMs=Math.max(250,minimumMs-elapsed+1200);
    accountStatus(`戰果驗證中，約 ${Math.ceil(waitMs/1000)} 秒後自動完成；請留在結算畫面。`);
    await waitForCloudMatchVerification(waitMs);
    ({data,error}=await claim());
  }
  if(error){cloudMatchId=null;accountStatus('戰利品同步失敗：'+cloudErrorMessage(error),true);await pullCloudProfile(false,'force');return false}
  cloudMatchId=null;applyCloudResult(data);updateProgressUI();return true
}
function scheduleCloudSave(){if(!currentUser||!supabaseClient)return;clearTimeout(cloudSaveTimer);cloudSaveTimer=setTimeout(()=>pushCloudProfile(false),1200)}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&cloudLockOwned)heartbeatCloudDevice()});
