/* Finestra modale per gli eventi. */
"use strict";

/* ==================== MODALE ==================== */
function showEvent(e){
  $("m-k").textContent = e.k;
  $("m-t").textContent = e.t;
  $("m-d").innerHTML = e.d;
  const w = $("m-opts"); w.innerHTML = "";
  e.opts.forEach(o => {
    const b = document.createElement("button");
    b.className = "opt2";
    b.innerHTML = '<span class="n">' + o.n + '</span><span class="d">' + o.d + '</span>';
    b.onclick = () => {
      const r = o.run() || {t:"", c:""};
      if(r.t) pushLog(r.t, r.c);
      $("modal").classList.remove("on");
      save(); renderGioco();
    };
    w.appendChild(b);
  });
  $("modal").classList.add("on");
}

