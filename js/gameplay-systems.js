const GAMEPLAY_STATE_VERSION=1;

function createGameplayState(){
 return {version:GAMEPLAY_STATE_VERSION};
}

function normalizeGameplayState(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return createGameplayState();
 return createGameplayState();
}
