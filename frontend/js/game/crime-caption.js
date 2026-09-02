/* Didascalie dinamiche della schermata crime. */
"use strict";
(function(){
  const CAPTIONS = [{"id": "r001", "q": "Cash rules everything around me.", "by": "Wu-Tang Clan", "track": "C.R.E.A.M.", "tags": ["money", "dirty", "power"]}, {"id": "r002", "q": "Protect ya neck.", "by": "Wu-Tang Clan", "track": "Protect Ya Neck", "tags": ["crew", "danger"]}, {"id": "r003", "q": "I bomb atomically, Socrates' philosophies and hypotheses.", "by": "Wu-Tang Clan", "track": "Triumph", "tags": ["rep", "power"]}, {"id": "r004", "q": "Wu-Tang Clan ain't nuthing ta fuck wit.", "by": "Wu-Tang Clan", "track": "Wu-Tang Clan Ain't Nuthing ta F' Wit", "tags": ["crew", "danger", "rep"]}, {"id": "r005", "q": "I grew up on the crime side.", "by": "Wu-Tang Clan", "track": "C.R.E.A.M.", "tags": ["dirty", "city", "danger"]}, {"id": "r006", "q": "Cash still rules.", "by": "Raekwon", "track": "Cash Still Rules / Scary Hours", "tags": ["money", "dirty"]}, {"id": "r007", "q": "Birthdays was the worst days, now we sip champagne.", "by": "The Notorious B.I.G.", "track": "Juicy", "tags": ["money", "power", "luxury"]}, {"id": "r008", "q": "It was all a dream.", "by": "The Notorious B.I.G.", "track": "Juicy", "tags": ["base", "rep", "power"]}, {"id": "r009", "q": "Mo money, mo problems.", "by": "The Notorious B.I.G.", "track": "Mo Money Mo Problems", "tags": ["money", "power", "heat"]}, {"id": "r010", "q": "Damn right I like the life I live.", "by": "The Notorious B.I.G.", "track": "Juicy", "tags": ["money", "power", "luxury"]}, {"id": "r011", "q": "Sky's the limit.", "by": "The Notorious B.I.G.", "track": "Sky's the Limit", "tags": ["rep", "power"]}, {"id": "r012", "q": "Who shot ya?", "by": "The Notorious B.I.G.", "track": "Who Shot Ya?", "tags": ["gun", "danger", "heat"]}, {"id": "r013", "q": "Gimme the loot.", "by": "The Notorious B.I.G.", "track": "Gimme the Loot", "tags": ["money", "heist", "danger"]}, {"id": "r014", "q": "Never let no one know how much dough you hold.", "by": "The Notorious B.I.G.", "track": "Ten Crack Commandments", "tags": ["money", "dirty", "danger"]}, {"id": "r015", "q": "All eyez on me.", "by": "2Pac", "track": "All Eyez on Me", "tags": ["rep", "heat", "power"]}, {"id": "r016", "q": "Picture me rollin'.", "by": "2Pac", "track": "Picture Me Rollin'", "tags": ["car", "rep", "power"]}, {"id": "r017", "q": "California knows how to party.", "by": "2Pac", "track": "California Love", "tags": ["city", "power", "rep"]}, {"id": "r018", "q": "I ain't a killer, but don't push me.", "by": "2Pac", "track": "Hail Mary", "tags": ["gun", "danger", "heat"]}, {"id": "r019", "q": "They got money for wars, but can't feed the poor.", "by": "2Pac", "track": "Keep Ya Head Up", "tags": ["money", "city", "danger"]}, {"id": "r020", "q": "Only God can judge me.", "by": "2Pac", "track": "Only God Can Judge Me", "tags": ["law", "danger", "rep"]}, {"id": "r021", "q": "It's just me against the world, baby.", "by": "2Pac", "track": "Me Against the World", "tags": ["danger", "heat", "rep"]}, {"id": "r022", "q": "Come with me, Hail Mary, run quick, see.", "by": "2Pac", "track": "Hail Mary", "tags": ["danger", "heat", "gun"]}, {"id": "r023", "q": "The world is yours.", "by": "Nas", "track": "The World Is Yours", "tags": ["rep", "power", "base"]}, {"id": "r024", "q": "Sleep is the cousin of death.", "by": "Nas", "track": "N.Y. State of Mind", "tags": ["danger", "heat", "base"]}, {"id": "r025", "q": "I never sleep, cause sleep is the cousin of death.", "by": "Nas", "track": "N.Y. State of Mind", "tags": ["danger", "heat"]}, {"id": "r026", "q": "All I need is one mic.", "by": "Nas", "track": "One Mic", "tags": ["base", "rep", "danger"]}, {"id": "r027", "q": "Life's a bitch and then you die.", "by": "Nas", "track": "Life's a Bitch", "tags": ["danger", "arrest", "base"]}, {"id": "r028", "q": "If I ruled the world.", "by": "Nas", "track": "If I Ruled the World", "tags": ["power", "empire", "rep"]}, {"id": "r029", "q": "I switched my motto, instead of sayin' fuck tomorrow.", "by": "Nas", "track": "The World Is Yours", "tags": ["rep", "danger", "base"]}, {"id": "r030", "q": "Can't knock the hustle.", "by": "Jay-Z", "track": "Can't Knock the Hustle", "tags": ["money", "rep", "power"]}, {"id": "r031", "q": "Allow me to reintroduce myself.", "by": "Jay-Z", "track": "Public Service Announcement", "tags": ["rep", "power"]}, {"id": "r032", "q": "I'm not a businessman, I'm a business, man.", "by": "Jay-Z", "track": "Diamonds from Sierra Leone (Remix)", "tags": ["business", "money", "power"]}, {"id": "r033", "q": "I got 99 problems but a bitch ain't one.", "by": "Jay-Z", "track": "99 Problems", "tags": ["heat", "law", "danger"]}, {"id": "r034", "q": "Money, cash, hoes.", "by": "Jay-Z", "track": "Money, Cash, Hoes", "tags": ["money", "power"]}, {"id": "r035", "q": "I don't know how to sleep, I gotta eat.", "by": "Jay-Z", "track": "Hard Knock Life", "tags": ["money", "base", "danger"]}, {"id": "r036", "q": "Can I live?", "by": "Jay-Z", "track": "Can I Live", "tags": ["danger", "law"]}, {"id": "r037", "q": "Many men wish death upon me.", "by": "50 Cent", "track": "Many Men", "tags": ["danger", "heat", "rep"]}, {"id": "r038", "q": "Get rich or die tryin'.", "by": "50 Cent", "track": "Get Rich or Die Tryin'", "tags": ["money", "rep", "danger"]}, {"id": "r039", "q": "Find me in the club, bottle full of bub.", "by": "50 Cent", "track": "In Da Club", "tags": ["money", "luxury", "rep"]}, {"id": "r040", "q": "I get money.", "by": "50 Cent", "track": "I Get Money", "tags": ["money", "power"]}, {"id": "r041", "q": "Hate it or love it, the underdog's on top.", "by": "The Game", "track": "Hate It or Love It", "tags": ["rep", "power", "base"]}, {"id": "r042", "q": "Home of the drive-bys, where they palm them .45s.", "by": "The Game", "track": "How We Do", "tags": ["city", "gun", "danger"]}, {"id": "r043", "q": "You only get one shot, do not miss your chance.", "by": "Eminem", "track": "Lose Yourself", "tags": ["rep", "danger", "base"]}, {"id": "r044", "q": "Snap back to reality.", "by": "Eminem", "track": "Lose Yourself", "tags": ["danger", "base"]}, {"id": "r045", "q": "Success is my only option, failure's not.", "by": "Eminem", "track": "Lose Yourself", "tags": ["rep", "power"]}, {"id": "r046", "q": "Guess who's back, back again, Shady's back, tell a friend.", "by": "Eminem", "track": "Without Me", "tags": ["rep", "power", "base"]}, {"id": "r047", "q": "Till the roof comes off, till the lights go out.", "by": "Eminem", "track": "Till I Collapse", "tags": ["danger", "rep", "power"]}, {"id": "r048", "q": "Still not loving police.", "by": "Dr. Dre", "track": "Still D.R.E.", "tags": ["police", "heat", "city"]}, {"id": "r049", "q": "With so much drama in the L-B-C.", "by": "Snoop Dogg", "track": "Gin and Juice", "tags": ["city", "danger", "crew"]}, {"id": "r050", "q": "Nothing comes out when they move their lips.", "by": "Dr. Dre", "track": "Forgot About Dre", "tags": ["rep", "danger", "crew"]}, {"id": "r051", "q": "Mind on my money, money on my mind.", "by": "Snoop Dogg", "track": "Gin and Juice", "tags": ["money", "power"]}, {"id": "r052", "q": "I got the Rolly on my arm.", "by": "Snoop Dogg", "track": "Drop It Like It's Hot", "tags": ["money", "luxury", "power"]}, {"id": "r053", "q": "Rollin' down the street, smokin' indo.", "by": "Snoop Dogg", "track": "Gin and Juice", "tags": ["city", "car", "danger"]}, {"id": "r054", "q": "Today was a good day.", "by": "Ice Cube", "track": "It Was a Good Day", "tags": ["base", "city", "rep"]}, {"id": "r055", "q": "Check yourself before you wreck yourself.", "by": "Ice Cube", "track": "Check Yo Self", "tags": ["danger", "heat", "rep"]}, {"id": "r056", "q": "No vaseline.", "by": "Ice Cube", "track": "No Vaseline", "tags": ["danger", "rep"]}, {"id": "r057", "q": "Straight outta Compton, crazy motherfucker named Ice Cube.", "by": "N.W.A.", "track": "Straight Outta Compton", "tags": ["city", "crew", "rep"]}, {"id": "r058", "q": "Fuck tha police.", "by": "N.W.A.", "track": "Fuck tha Police", "tags": ["police", "heat", "danger"]}, {"id": "r059", "q": "Cruisin' down the street in my six-fo'.", "by": "Eazy-E", "track": "Boyz-n-the-Hood", "tags": ["car", "city", "danger"]}, {"id": "r060", "q": "Ain't no such things as halfway crooks.", "by": "Mobb Deep", "track": "Shook Ones, Pt. II", "tags": ["crew", "danger", "rep"]}, {"id": "r061", "q": "Survival of the fittest.", "by": "Mobb Deep", "track": "Survival of the Fittest", "tags": ["danger", "heat", "crew"]}, {"id": "r062", "q": "There's a war going on outside.", "by": "Mobb Deep", "track": "Survival of the Fittest", "tags": ["danger", "heat", "police"]}, {"id": "r063", "q": "Y'all gon' make me lose my mind.", "by": "DMX", "track": "Party Up", "tags": ["danger", "heat"]}, {"id": "r064", "q": "Stop, drop, shut 'em down, open up shop.", "by": "DMX", "track": "Ruff Ryders' Anthem", "tags": ["crew", "danger", "power"]}, {"id": "r065", "q": "Damn, it feels good to be a gangsta.", "by": "Geto Boys", "track": "Damn It Feels Good to Be a Gangsta", "tags": ["power", "rep", "crew"]}, {"id": "r066", "q": "Mind playing tricks on me.", "by": "Geto Boys", "track": "Mind Playing Tricks on Me", "tags": ["heat", "danger"]}, {"id": "r067", "q": "One day you're here, baby, and then you're gone.", "by": "UGK", "track": "One Day", "tags": ["danger", "heat", "base"]}, {"id": "r068", "q": "I sit alone in my four-cornered room staring at candles.", "by": "Geto Boys", "track": "Mind Playing Tricks on Me", "tags": ["heat", "danger", "arrest"]}, {"id": "r069", "q": "Even the sun goes down, heroes eventually die.", "by": "OutKast", "track": "Aquemini", "tags": ["danger", "rep", "power"]}, {"id": "r070", "q": "I'm just so fresh, so clean.", "by": "OutKast", "track": "So Fresh, So Clean", "tags": ["money", "luxury", "rep"]}, {"id": "r071", "q": "Every day I'm hustlin'.", "by": "Rick Ross", "track": "Hustlin'", "tags": ["money", "business", "power"]}, {"id": "r072", "q": "Same old shit, just a different day.", "by": "Ace Hood", "track": "Hustle Hard", "tags": ["money", "base", "danger"]}, {"id": "r073", "q": "I put on for my city, on-on for my city.", "by": "Jeezy", "track": "Put On", "tags": ["city", "rep", "power"]}, {"id": "r074", "q": "My president is black, my Lambo's blue.", "by": "Jeezy", "track": "My President", "tags": ["money", "luxury", "power"]}, {"id": "r075", "q": "Keys open doors.", "by": "Clipse", "track": "Keys Open Doors", "tags": ["dirty", "business", "money"]}, {"id": "r076", "q": "If you know, you know.", "by": "Pusha T", "track": "If You Know You Know", "tags": ["dirty", "power", "rep"]}, {"id": "r077", "q": "Thinking of a master plan.", "by": "Eric B. & Rakim", "track": "Paid in Full", "tags": ["business", "organization", "power"]}, {"id": "r078", "q": "I make big money, I drive big cars.", "by": "Geto Boys", "track": "Mind Playing Tricks on Me", "tags": ["money", "car", "power"]}, {"id": "r079", "q": "Real G's move in silence like lasagna.", "by": "Lil Wayne", "track": "6 Foot 7 Foot", "tags": ["crew", "danger", "power"]}, {"id": "r080", "q": "Life is a bitch, and death is her sister.", "by": "Lil Wayne", "track": "6 Foot 7 Foot", "tags": ["danger", "arrest", "heat"]}, {"id": "r081", "q": "Money on my mind.", "by": "Lil Wayne", "track": "Money on My Mind", "tags": ["money", "dirty"]}, {"id": "r082", "q": "I got ice in my veins, blood in my eyes.", "by": "Lil Wayne", "track": "Drop the World", "tags": ["danger", "heat", "rep"]}, {"id": "r083", "q": "No one man should have all that power.", "by": "Kanye West", "track": "Power", "tags": ["power", "empire", "rep"]}, {"id": "r084", "q": "Can't tell me nothing.", "by": "Kanye West", "track": "Can't Tell Me Nothing", "tags": ["power", "rep", "money"]}, {"id": "r085", "q": "Having money's not everything, not having it is.", "by": "Kanye West", "track": "Good Life", "tags": ["money", "base", "power"]}, {"id": "r086", "q": "Money trees is the perfect place for shade.", "by": "Kendrick Lamar", "track": "Money Trees", "tags": ["money", "dirty", "power"]}, {"id": "r087", "q": "We gon' be alright.", "by": "Kendrick Lamar", "track": "Alright", "tags": ["danger", "arrest", "base"]}, {"id": "r088", "q": "Sit down, be humble.", "by": "Kendrick Lamar", "track": "HUMBLE.", "tags": ["rep", "power"]}, {"id": "r089", "q": "Started from the bottom, now we're here.", "by": "Drake", "track": "Started From the Bottom", "tags": ["rep", "power", "base"]}, {"id": "r090", "q": "Know yourself, know your worth.", "by": "Drake", "track": "0 to 100 / The Catch Up", "tags": ["rep", "power"]}, {"id": "r091", "q": "I got enemies, got a lot of enemies.", "by": "Drake", "track": "Energy", "tags": ["danger", "heat", "rep"]}, {"id": "r092", "q": "No new friends.", "by": "Drake", "track": "No New Friends", "tags": ["crew", "danger"]}, {"id": "r093", "q": "How much money you got? A lot.", "by": "21 Savage", "track": "a lot", "tags": ["money", "power", "dirty"]}, {"id": "r094", "q": "Grinding all my life, sacrifice, hustle paid the price.", "by": "Nipsey Hussle", "track": "Grinding All My Life", "tags": ["money", "rep", "power"]}, {"id": "r095", "q": "The marathon continues.", "by": "Nipsey Hussle", "track": "The Marathon", "tags": ["rep", "power", "base"]}, {"id": "r096", "q": "Dedication, hard work plus patience.", "by": "Nipsey Hussle", "track": "Dedication", "tags": ["rep", "power", "base"]}, {"id": "r097", "q": "I've been up for a long time.", "by": "Travis Scott", "track": "Antidote", "tags": ["night", "danger", "rep"]}, {"id": "r098", "q": "I'm not a star, somebody lied.", "by": "Rick Ross", "track": "I'm Not a Star", "tags": ["power", "money", "rep"]}, {"id": "r099", "q": "I serve the base.", "by": "Future", "track": "I Serve the Base", "tags": ["dirty", "business", "danger"]}, {"id": "r100", "q": "Chase a check, never chase a bitch.", "by": "Future", "track": "Mask Off", "tags": ["money", "power", "dirty"]}, {"id": "r101", "q": "I make a call and it's war.", "by": "Pop Smoke", "track": "Dior", "tags": ["crew", "danger", "power"]}, {"id": "r102", "q": "If you don't know, now you know.", "by": "The Notorious B.I.G.", "track": "Juicy", "tags": ["rep", "power", "base"]}, {"id": "r103", "q": "The one in front of the gun lives forever.", "by": "Kendrick Lamar", "track": "Money Trees", "tags": ["gun", "danger", "rep"]}, {"id": "r104", "q": "A fuck nigga, that's that shit I don't like.", "by": "Chief Keef", "track": "I Don't Like", "tags": ["crew", "danger", "rep"]}, {"id": "r105", "q": "I used to pray for times like this.", "by": "Meek Mill", "track": "Dreams and Nightmares", "tags": ["rep", "power", "base"]}, {"id": "r106", "q": "I got five on it.", "by": "Luniz", "track": "I Got 5 on It", "tags": ["money", "dirty", "crew"]}, {"id": "r107", "q": "I got my mind made up, come on.", "by": "2Pac", "track": "Got My Mind Made Up", "tags": ["rep", "danger", "power"]}, {"id": "r108", "q": "No such thing as a life better than yours.", "by": "J. Cole", "track": "Love Yourz", "tags": ["base", "rep"]}, {"id": "r109", "q": "I got loyalty, got royalty inside my DNA.", "by": "Kendrick Lamar", "track": "DNA.", "tags": ["crew", "rep", "power"]}, {"id": "r110", "q": "This is a celly, that's a tool.", "by": "Childish Gambino", "track": "This Is America", "tags": ["gun", "danger", "city"]}, {"id": "r111", "q": "I be that pretty motherfucker.", "by": "A$AP Rocky", "track": "Peso", "tags": ["rep", "luxury", "money"]}, {"id": "r112", "q": "It ain't where you're from, it's where you're at.", "by": "Rakim", "track": "In the Ghetto", "tags": ["city", "rep", "power"]}, {"id": "r113", "q": "Survival of the fittest, only the strong survive.", "by": "Mobb Deep", "track": "Survival of the Fittest", "tags": ["danger", "crew", "rep"]}, {"id": "r114", "q": "I just wanna see the sun shine tomorrow.", "by": "Mac Miller", "track": "Best Day Ever", "tags": ["base", "rep"]}, {"id": "r115", "q": "Day and night, I toss and turn.", "by": "Kid Cudi", "track": "Day 'n' Nite", "tags": ["night", "heat", "danger"]}, {"id": "r116", "q": "I'm on the pursuit of happiness.", "by": "Kid Cudi", "track": "Pursuit of Happiness", "tags": ["rep", "power", "base"]}, {"id": "r117", "q": "Last name Ever, first name Greatest.", "by": "Drake", "track": "Forever", "tags": ["rep", "power", "luxury"]}, {"id": "r118", "q": "Hold up, wait a minute, y'all thought I was finished?", "by": "Meek Mill", "track": "Dreams and Nightmares", "tags": ["rep", "danger", "power"]}];

  let recent = [];
  let seenCounts = {};
  try{
    recent = JSON.parse(sessionStorage.getItem("crimeRapRecent") || "[]");
    seenCounts = JSON.parse(sessionStorage.getItem("crimeRapSeen") || "{}");
  }catch(e){ recent=[]; seenCounts={}; }

  function ctx(){
    let s = {};
    try{
      if(typeof crimeVisualState === "function") s = crimeVisualState();
      else if(typeof state !== "undefined") s = state;
    }catch(e){}
    const tags = new Set(["base"]);
    try{ for(const t of (window.__CRIME_BG_TAGS||[])) tags.add(t); }catch(e){}
    const heat = Number(s.heat||0), rep = Number(s.rep||0);
    const dirty = Number(s.dirty ?? s.sporchi ?? 0);
    const men = Number(s.men ?? s.uomini ?? 0);
    const prot = Number(s.protection ?? s.prot ?? 0);
    const city = String(s.city||"provincia").toLowerCase();
    const owned = s.owned || s.attivita || {};

    if(heat>=45) tags.add("heat");
    if(heat>=70){tags.add("police");tags.add("raid");tags.add("danger")}
    if(rep>=35) tags.add("rep");
    if(rep>=65){tags.add("power");tags.add("organization")}
    if(dirty>=1200){tags.add("money");tags.add("dirty")}
    if(dirty>=4000) tags.add("launder");
    if(men>=2) tags.add("crew");
    if(prot>=2) tags.add("protection");
    if(s.gun || s.ferro) tags.add("gun");
    if(s.lawyer || s.avvocato) tags.add("law");
    if(Number(s.precedents ?? s.precedenti ?? 0)>0){tags.add("law");tags.add("precedents")}
    if(s.arrest || s.arresto){tags.add("arrest");tags.add("law")}
    if(Object.values(owned).some(Boolean)){tags.add("business");tags.add("launder")}
    if(city!=="provincia") tags.add("city");
    if(city.includes("milano")) tags.add("organization");
    if(city.includes("los") || s.goat){tags.add("empire");tags.add("luxury");tags.add("power")}
    return tags;
  }

  function pick(){
    const active = ctx();

    // Cooldown molto più lungo: una barra appena vista non può ricomparire.
    const hardCooldown = new Set(recent.slice(-28));

    let candidates = CAPTIONS.filter(c => !hardCooldown.has(c.id));
    // Se per qualche motivo il pool filtrato diventasse troppo piccolo,
    // riduciamo gradualmente il cooldown invece di ripetere subito.
    if(candidates.length < 18){
      const softCooldown = new Set(recent.slice(-12));
      candidates = CAPTIONS.filter(c => !softCooldown.has(c.id));
    }

    const pool = candidates.map(c=>{
      let w = 1;
      let matches = 0;
      for(const t of c.tags) if(active.has(t)) matches++;
      w += matches * 1.25;

      // Le condizioni del gameplay pesano, ma non abbastanza da schiacciare
      // la varietà e far uscire sempre le stesse barre.
      if(active.has("arrest") && c.tags.includes("arrest")) w *= 1.8;
      if(active.has("heat") && c.tags.includes("heat")) w *= 1.35;
      if(active.has("power") && c.tags.includes("power")) w *= 1.25;

      // Ogni volta che una barra è già uscita nella sessione viene
      // progressivamente penalizzata.
      const seen = Number(seenCounts[c.id] || 0);
      w *= 1 / (1 + seen * 0.72);
      return [c, Math.max(.025,w)];
    });

    let total = pool.reduce((a,x)=>a+x[1],0);
    let r = Math.random()*total;
    let chosen = pool[0]?.[0] || CAPTIONS[Math.floor(Math.random()*CAPTIONS.length)];

    for(const [c,w] of pool){
      r -= w;
      if(r<=0){ chosen=c; break; }
    }

    recent.push(chosen.id);
    if(recent.length > 36) recent = recent.slice(-36);
    seenCounts[chosen.id] = Number(seenCounts[chosen.id] || 0) + 1;

    try{
      sessionStorage.setItem("crimeRapRecent", JSON.stringify(recent));
      sessionStorage.setItem("crimeRapSeen", JSON.stringify(seenCounts));
    }catch(e){}

    return chosen;
  }

  function refresh(immediate){
    const p=document.getElementById("crimeCaption");
    const a=document.getElementById("crimeCaptionSource");
    if(!p||!a) return;
    const c=pick();
    const apply=()=>{
      p.textContent=c.q;
      a.textContent="— "+c.by+(c.track ? " · "+c.track : "");
      p.classList.remove("caption-out");
      a.classList.remove("caption-out");
    };
    if(immediate){apply();return;}
    p.classList.add("caption-out");
    a.classList.add("caption-out");
    setTimeout(apply,180);
  }

  window.refreshCrimeCaption=refresh;
  refresh(true);

  const btn=document.getElementById("labCaption");
  if(btn) btn.addEventListener("click",()=>refresh(false));
})();
