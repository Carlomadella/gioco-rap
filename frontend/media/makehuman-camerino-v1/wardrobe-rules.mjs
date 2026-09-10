export const WARDROBE_SLOT_IDS = Object.freeze([
  'tops',
  'bottoms',
  'dresses',
  'underwear',
  'shoes',
  'outerwear',
  'clothesOther',
  'armsleeves',
  'glasses',
  'hats',
  'gloves',
  'masks',
  'jewelry',
  'equipment'
]);

const DEFAULT_OCCUPIES = Object.freeze({
  tops:['tops'],
  bottoms:['bottoms'],
  // Un vestito/completo intero prende anche gli spazi parte alta + parte bassa.
  dresses:['dresses','tops','bottoms'],
  underwear:['underwear'],
  shoes:['shoes'],
  outerwear:['outerwear'],
  clothesOther:['clothesOther'],
  armsleeves:['armsleeves'],
  glasses:['glasses'],
  hats:['hats'],
  gloves:['gloves'],
  masks:['masks'],
  jewelry:['jewelry'],
  equipment:['equipment']
});

const RESTORE_PRIORITY = Object.freeze({
  dresses:100,
  bottoms:70,
  tops:70,
  shoes:60,
  outerwear:50,
  underwear:40,
  armsleeves:30,
  masks:25,
  hats:25,
  glasses:25,
  gloves:25,
  jewelry:20,
  equipment:10,
  clothesOther:1
});

function uniqueStrings(values){
  return [...new Set((Array.isArray(values)?values:[])
    .map(v=>String(v||'').trim())
    .filter(Boolean))];
}

export function createWardrobeItem(slotId,raw,rule={}){
  slotId=String(slotId||'').trim();
  raw=String(raw||'').trim();
  if(!slotId || !raw) return null;

  const customOccupies=uniqueStrings(rule?.occupies);
  const occupies=customOccupies.length
    ? customOccupies
    : [...(DEFAULT_OCCUPIES[slotId]||[slotId])];

  // Lo slot fisico della select deve essere sempre occupato dall'asset stesso.
  if(!occupies.includes(slotId)) occupies.unshift(slotId);

  return {
    slotId,
    raw,
    occupies:uniqueStrings(occupies),
    exclusiveWith:uniqueStrings(rule?.exclusiveWith),
    allowWith:uniqueStrings(rule?.allowWith),
    reason:String(rule?.reason||'').trim()
  };
}

function overlaps(a,b){
  const set=new Set(a||[]);
  return (b||[]).some(value=>set.has(value));
}

export function wardrobeItemsConflict(candidate,existing){
  if(!candidate || !existing || candidate.slotId===existing.slotId) return false;

  // Eccezione esplicita: permette combinazioni che una regola generale
  // potrebbe altrimenti bloccare.
  if(
    candidate.allowWith.includes(existing.slotId) ||
    existing.allowWith.includes(candidate.slotId)
  ) return false;

  if(overlaps(candidate.occupies,existing.occupies)) return true;

  if(
    candidate.exclusiveWith.includes(existing.slotId) ||
    existing.exclusiveWith.includes(candidate.slotId)
  ) return true;

  return false;
}

export function findWardrobeConflicts(candidate,equippedItems=[]){
  if(!candidate) return [];
  const conflicts=[];

  for(const existing of equippedItems){
    if(!existing || !existing.raw) continue;
    if(wardrobeItemsConflict(candidate,existing)) conflicts.push(existing);
  }

  const seen=new Set();
  return conflicts.filter(item=>{
    if(seen.has(item.slotId)) return false;
    seen.add(item.slotId);
    return true;
  });
}

export function canEquipCandidate(candidate,equippedItems=[]){
  if(!candidate) {
    return {ok:false,reason:'Asset guardaroba non valido.',conflicts:[]};
  }

  return {
    ok:true,
    reason:'',
    conflicts:findWardrobeConflicts(candidate,equippedItems)
  };
}

export function resolveWardrobeConflicts(candidate,equippedItems=[]){
  const result=canEquipCandidate(candidate,equippedItems);
  return {
    ...result,
    clearSlots:result.conflicts.map(item=>item.slotId)
  };
}

export function normalizeWardrobeSelections(selections,getRule=()=>({})){
  const source={};
  for(const slotId of WARDROBE_SLOT_IDS){
    source[slotId]=String(selections?.[slotId]||'');
  }

  const proposed=[];
  for(const slotId of WARDROBE_SLOT_IDS){
    const raw=source[slotId];
    if(!raw) continue;
    const item=createWardrobeItem(slotId,raw,getRule(raw,slotId)||{});
    if(item) proposed.push(item);
  }

  // Gli asset multi-slot (vestiti interi, pantaloni+stivali, ecc.) hanno
  // precedenza nel recupero di vecchi salvataggi incompatibili.
  proposed.sort((a,b)=>{
    const occupiedDelta=b.occupies.length-a.occupies.length;
    if(occupiedDelta) return occupiedDelta;
    const priorityDelta=(RESTORE_PRIORITY[b.slotId]||0)-(RESTORE_PRIORITY[a.slotId]||0);
    if(priorityDelta) return priorityDelta;
    return WARDROBE_SLOT_IDS.indexOf(a.slotId)-WARDROBE_SLOT_IDS.indexOf(b.slotId);
  });

  const accepted=[];
  const normalized=Object.fromEntries(WARDROBE_SLOT_IDS.map(id=>[id,'']));
  const dropped=[];

  for(const item of proposed){
    const conflicts=findWardrobeConflicts(item,accepted);
    if(conflicts.length){
      dropped.push({
        slotId:item.slotId,
        raw:item.raw,
        conflicts:conflicts.map(c=>c.slotId)
      });
      continue;
    }

    accepted.push(item);
    normalized[item.slotId]=item.raw;
  }

  return {slots:normalized,items:accepted,dropped};
}
