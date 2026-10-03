(function(root){
  "use strict";

  const catalogo=new Map();

  function persona(p){
    if(!p || typeof p!=="object" || Array.isArray(p) ||
       typeof p.id!=="string" || !p.id.trim())
      throw new TypeError("PERSONA valida con id obbligatorio");
    return p;
  }

  function cittaId(v,nome="cittaId"){
    if(typeof v!=="string" || !v.trim())
      throw new TypeError(nome+" obbligatorio");
    const id=v.trim().toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9]+/g,"-")
      .replace(/^-+|-+$/g,"");
    if(!id) throw new TypeError(nome+" non valido");
    return id;
  }

  function giorno(v,nome="giorno"){
    let n=null;
    if(typeof v==="number") n=v;
    else if(typeof v==="string" && /^\d+$/.test(v.trim())) n=Number(v.trim());
    if(!Number.isSafeInteger(n) || n<=0)
      throw new TypeError(nome+" deve essere un giorno assoluto positivo");
    return n;
  }

  function fonte(v){
    if(typeof v!=="string" || !v.trim())
      throw new TypeError("fonte obbligatoria");
    return v.trim();
  }

  function registraCitta(raw){
    if(!raw || typeof raw!=="object") throw new TypeError("citta non valida");
    const id=cittaId(raw.id);
    const n=typeof raw.n==="string" && raw.n.trim() ? raw.n.trim() : id;
    const esistente=catalogo.get(id);
    if(esistente && esistente.n!==n)
      throw new RangeError("citta gia registrata con nome diverso: "+id);
    const item=Object.freeze({id,n});
    catalogo.set(id,item);
    return item;
  }

  function registraCatalogo(lista){
    if(!Array.isArray(lista)) throw new TypeError("catalogo deve essere un array");
    return lista.map(registraCitta);
  }

  function citta(id){
    if(id==null || String(id).trim()==="") return null;
    return catalogo.get(cittaId(String(id))) || null;
  }

  function origine(p){
    persona(p);
    const raw=p.identita && p.identita.provenienza;
    if(raw==null) return null;
    if(typeof raw==="string")
      return Object.freeze({cittaId:cittaId(raw),fonte:"legacy:identita.provenienza"});
    if(typeof raw!=="object" || Array.isArray(raw))
      throw new TypeError("identita.provenienza non valida");
    return Object.freeze({
      cittaId:cittaId(raw.cittaId),
      fonte:fonte(raw.fonte)
    });
  }

  function impostaOrigine(p,id,source){
    persona(p);
    const nuovo={cittaId:cittaId(id),fonte:fonte(source)};
    const attuale=origine(p);
    if(attuale){
      if(attuale.cittaId!==nuovo.cittaId)
        throw new RangeError("provenienza gia definita per "+p.id);
      return attuale;
    }
    if(p.identita==null) p.identita={};
    if(typeof p.identita!=="object" || Array.isArray(p.identita))
      throw new TypeError("p.identita deve essere un oggetto");
    p.identita.provenienza={...nuovo};
    return Object.freeze({...nuovo});
  }

  function listaPosizioni(p,{crea=false}={}){
    persona(p);
    if(p.geografia==null){
      if(!crea) return [];
      p.geografia={posizioni:[]};
    }
    if(typeof p.geografia!=="object" || Array.isArray(p.geografia))
      throw new TypeError("p.geografia deve essere un oggetto");
    if(p.geografia.posizioni==null){
      if(!crea) return [];
      p.geografia.posizioni=[];
    }
    if(!Array.isArray(p.geografia.posizioni))
      throw new TypeError("p.geografia.posizioni deve essere un array");
    return p.geografia.posizioni;
  }

  function normalizzaPosizione(raw){
    if(!raw || typeof raw!=="object" || Array.isArray(raw))
      throw new TypeError("posizione non valida");
    return {
      cittaId:cittaId(raw.cittaId),
      dalGiorno:giorno(raw.dalGiorno,"dalGiorno"),
      fonte:fonte(raw.fonte)
    };
  }

  function posizioni(p){
    return listaPosizioni(p).map(normalizzaPosizione)
      .sort((a,b)=>a.dalGiorno-b.dalGiorno)
      .map(x=>Object.freeze({...x}));
  }

  function posizioneEsplicita(p,g){
    const oggi=giorno(g);
    let scelta=null;
    for(const x of posizioni(p)){
      if(x.dalGiorno>oggi) break;
      scelta=x;
    }
    return scelta;
  }

  function legacyCitta(p){
    const raw=p&&p.mondo&&p.mondo.cittaAttuale!=null
      ? p.mondo.cittaAttuale
      : p&&p.cittaAttuale!=null ? p.cittaAttuale
      : p&&p.citta!=null ? p.citta
      : null;
    if(raw==null || String(raw).trim()==="") return null;
    return cittaId(String(raw));
  }

  function posizione(p,g){
    persona(p);
    const esplicita=posizioneEsplicita(p,g);
    if(esplicita)
      return Object.freeze({...esplicita,esplicita:true});
    const legacy=legacyCitta(p);
    if(!legacy) return null;
    return Object.freeze({
      cittaId:legacy,
      dalGiorno:null,
      fonte:p.mondo&&p.mondo.cittaAttuale!=null ? "legacy:mondo.cittaAttuale"
        : p.cittaAttuale!=null ? "legacy:cittaAttuale"
        : "legacy:citta",
      esplicita:false
    });
  }

  function cittaAttuale(p,g){
    const pos=posizione(p,g);
    return pos ? pos.cittaId : null;
  }

  function conflittoGiorno(lista,nuovo){
    const stesso=lista.find(x=>normalizzaPosizione(x).dalGiorno===nuovo.dalGiorno);
    if(!stesso) return null;
    const n=normalizzaPosizione(stesso);
    if(n.cittaId===nuovo.cittaId) return n;
    throw new RangeError("due citta diverse nello stesso giorno per "+nuovo.dalGiorno);
  }

  function sposta(p,raw){
    persona(p);
    const nuovo=normalizzaPosizione(raw);
    const dest=listaPosizioni(p,{crea:true});
    const esistente=conflittoGiorno(dest,nuovo);
    if(esistente) return Object.freeze({...esistente});

    const prima=posizione(p,Math.max(1,nuovo.dalGiorno-1));
    if(prima && prima.cittaId===nuovo.cittaId)
      return Object.freeze({
        cittaId:prima.cittaId,
        dalGiorno:prima.dalGiorno,
        fonte:prima.fonte
      });

    dest.push({...nuovo});
    dest.sort((a,b)=>Number(a.dalGiorno)-Number(b.dalGiorno));
    return Object.freeze({...nuovo});
  }

  function visita(p,raw){
    persona(p);
    if(!raw || typeof raw!=="object") throw new TypeError("visita non valida");
    const dal=giorno(raw.dalGiorno,"dalGiorno");
    const al=giorno(raw.alGiorno,"alGiorno");
    if(al<=dal) throw new RangeError("alGiorno deve essere successivo a dalGiorno");
    const destinazione=cittaId(raw.cittaId);
    const src=fonte(raw.fonte);
    const ritorno=raw.ritornoCittaId!=null
      ? cittaId(raw.ritornoCittaId,"ritornoCittaId")
      : cittaAttuale(p,Math.max(1,dal-1));
    if(!ritorno) throw new RangeError("citta di ritorno sconosciuta");
    if(ritorno===destinazione)
      throw new RangeError("visita senza cambio citta");

    const esistenti=posizioni(p);
    const interni=esistenti.filter(x=>x.dalGiorno>dal && x.dalGiorno<al);
    if(interni.length)
      throw new RangeError("visita sovrapposta a spostamenti gia programmati");

    const alDal=esistenti.find(x=>x.dalGiorno===dal);
    if(alDal && alDal.cittaId!==destinazione)
      throw new RangeError("spostamento incompatibile al giorno di partenza");
    const alRitorno=esistenti.find(x=>x.dalGiorno===al);
    if(alRitorno && alRitorno.cittaId!==ritorno)
      throw new RangeError("spostamento incompatibile al giorno di ritorno");

    const partenza=sposta(p,{cittaId:destinazione,dalGiorno:dal,fonte:src});
    const rientro=sposta(p,{
      cittaId:ritorno,
      dalGiorno:al,
      fonte:src+":rientro"
    });
    return Object.freeze({partenza,rientro});
  }

  root.ADF_NPC_GEOGRAFIA=Object.freeze({
    registraCitta,
    registraCatalogo,
    citta,
    origine,
    impostaOrigine,
    posizioni,
    posizione,
    cittaAttuale,
    sposta,
    visita
  });
})(typeof window!=="undefined"?window:globalThis);
