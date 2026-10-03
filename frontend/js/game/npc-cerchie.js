(function(root){
  "use strict";

  function persona(p){
    if(!p || typeof p!=="object" || Array.isArray(p) ||
       typeof p.id!=="string" || !p.id.trim())
      throw new TypeError("PERSONA valida con id obbligatorio");
    return p;
  }

  function personeValide(persone){
    if(!Array.isArray(persone))
      throw new TypeError("persone deve essere un array");

    const out=[];
    const ids=new Set();
    for(const p of persone){
      persona(p);
      if(ids.has(p.id))
        throw new RangeError("id PERSONA duplicato: "+p.id);
      ids.add(p.id);
      out.push(p);
    }
    return out;
  }

  function legamiApi(){
    const api=root&&root.ADF_NPC_LEGAMI;
    if(!api || typeof api.legami!=="function")
      throw new Error("ADF_NPC_LEGAMI non disponibile");
    return api;
  }

  function grafo(persone){
    const list=personeValide(persone);
    const byId=new Map(list.map(p=>[p.id,p]));
    const api=legamiApi();
    const sociali=new Map();
    const adj=new Map();

    for(const p of list){
      const ids=new Set(
        api.legami(p,{coPresenza:true})
          .map(x=>String(x.personId))
          .filter(id=>id!==p.id && byId.has(id))
      );
      sociali.set(p.id,ids);
      adj.set(p.id,new Set());
    }

    /* Una cerchia è struttura sociale condivisa, non una percezione
       unilaterale. L'arco entra nel grafo solo se è registrato in entrambe
       le direzioni ed è adatto alla co-presenza da entrambi i lati. */
    for(const p of list){
      for(const otherId of sociali.get(p.id)){
        if(p.id>=otherId) continue;
        if(!sociali.get(otherId).has(p.id)) continue;
        adj.get(p.id).add(otherId);
        adj.get(otherId).add(p.id);
      }
    }

    return {list,byId,adj};
  }

  function blocchiBiconnessi(adj){
    const disc=new Map();
    const low=new Map();
    const parent=new Map();
    const stack=[];
    const blocchi=[];
    let tempo=0;

    const estrai=(a,b)=>{
      const edges=[];
      while(stack.length){
        const e=stack.pop();
        edges.push(e);
        if((e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a)) break;
      }
      if(edges.length) blocchi.push(edges);
    };

    const dfs=u=>{
      disc.set(u,++tempo);
      low.set(u,disc.get(u));

      for(const v of [...adj.get(u)].sort()){
        if(!disc.has(v)){
          parent.set(v,u);
          stack.push([u,v]);
          dfs(v);
          low.set(u,Math.min(low.get(u),low.get(v)));

          if(low.get(v)>=disc.get(u)) estrai(u,v);
        }else if(parent.get(u)!==v && disc.get(v)<disc.get(u)){
          low.set(u,Math.min(low.get(u),disc.get(v)));
          stack.push([u,v]);
        }
      }
    };

    for(const id of [...adj.keys()].sort()){
      if(disc.has(id)) continue;
      dfs(id);
      if(stack.length){
        const edges=[];
        while(stack.length) edges.push(stack.pop());
        blocchi.push(edges);
      }
    }

    return blocchi;
  }

  function snapshotBlocco(edges){
    const ids=new Set();
    const edgeKeys=new Set();
    for(const [a,b] of edges){
      ids.add(a); ids.add(b);
      edgeKeys.add(a<b?a+"\u0000"+b:b+"\u0000"+a);
    }
    const membri=[...ids].sort();
    if(membri.length<3) return null;

    const archi=edgeKeys.size;
    const possibili=membri.length*(membri.length-1)/2;
    return Object.freeze({
      key:"cerchia:"+membri.join("|"),
      memberIds:Object.freeze(membri),
      size:membri.length,
      edgeCount:archi,
      density:possibili?archi/possibili:0
    });
  }

  function cerchie(persone){
    const g=grafo(persone);
    const out=blocchiBiconnessi(g.adj)
      .map(snapshotBlocco)
      .filter(Boolean)
      .sort((a,b)=>
        (b.size-a.size) ||
        (b.density-a.density) ||
        a.key.localeCompare(b.key)
      );
    return Object.freeze(out);
  }

  function idPersona(v){
    if(typeof v==="string" && v.trim()) return v.trim();
    return persona(v).id;
  }

  function perPersona(p,persone){
    const id=idPersona(p);
    return Object.freeze(
      cerchie(persone).filter(c=>c.memberIds.includes(id))
    );
  }

  function compagniDiCerchia(p,persone){
    const id=idPersona(p);
    const ids=new Set();
    for(const c of perPersona(id,persone))
      for(const memberId of c.memberIds)
        if(memberId!==id) ids.add(memberId);

    const byId=new Map(personeValide(persone).map(x=>[x.id,x]));
    return Object.freeze(
      [...ids].sort().map(x=>byId.get(x)).filter(Boolean)
    );
  }

  function appartenenze(persone){
    const out=new Map();
    for(const c of cerchie(persone)){
      for(const id of c.memberIds){
        if(!out.has(id)) out.set(id,[]);
        out.get(id).push(c.key);
      }
    }
    return Object.freeze(
      [...out.entries()]
        .sort((a,b)=>a[0].localeCompare(b[0]))
        .map(([personId,circleKeys])=>Object.freeze({
          personId,
          circleKeys:Object.freeze(circleKeys.slice().sort())
        }))
    );
  }

  root.ADF_NPC_CERCHIE=Object.freeze({
    cerchie,
    perPersona,
    compagniDiCerchia,
    appartenenze
  });
})(typeof window!=="undefined"?window:globalThis);
