"use strict";
/* ======================= OTA-ONA PANELI ======================= */
function holdButton(el,fn,ms=1600){let t=null;
  const start=e=>{e.preventDefault();el.classList.add("holding");t=setTimeout(()=>{el.classList.remove("holding");fn()},ms)};
  const end=()=>{el.classList.remove("holding");clearTimeout(t)};
  el.addEventListener("pointerdown",start);["pointerup","pointerleave","pointercancel"].forEach(ev=>el.addEventListener(ev,end));
  el.addEventListener("contextmenu",e=>e.preventDefault())}
holdButton($("#gear"),openPanel);
holdButton($("#unlockBtn"),()=>{usage.sec=0;LS.set("usage",usage);$("#rest").hidden=true;goMenu()});

function openPanel(){session++;stopAll();stopListen();quiz=null;$("#panel").hidden=false;
  $("#aiKey").value=AI.key?"••••••••"+AI.key.slice(-4):"";
  const vs=$("#aiVoice");vs.innerHTML=VOICES.map(([v,d])=>`<option value="${v}">${v} — ${d}</option>`).join("");vs.value=AI.voice;
  $("#aiOn").value=String(AI.on);
  ["mic","recLang","time","rate","aiMax"].forEach(k=>{$("#set_"+k).value=String(settings[k])});
  $("#micNote").textContent=SR?"Mikrofon birinchi marta ruxsat so'raydi: \"Ruxsat berish\"ni bosing. Agar iPad o'zbekchani yomon tushunsa, \"Ruscha\"ni tanlab ko'ring: o'zbekcha \"uch\" desa ham tushunadi.":"Bu brauzerda nutqni tanish yo'q. Gemini kaliti bo'lsa, AI tinglaydi; aks holda Mustafo bosib javob beradi.";
  const fs=$("#recFilter");if(!fs.options.length){fs.innerHTML=[...new Set(PHRASE_IDS.map(id=>PHRASES[id].grp))].map(g=>`<option>${esc(g)}</option>`).join("")}
  renderGen();renderRecList();renderProgress()}
$("#closePanel").onclick=()=>{stopRecording(true);
  ["mic","time","aiMax"].forEach(k=>settings[k]=+$("#set_"+k).value);settings.recLang=$("#set_recLang").value;settings.rate=+$("#set_rate").value;saveSettings();
  AI.on=+$("#aiOn").value;LS.set("aiOn",AI.on);
  $("#panel").hidden=true;goMenu()};

/* ---- Gemini ---- */
$("#aiSave").onclick=()=>{const v=$("#aiKey").value.trim();if(!v||v.startsWith("••")){toast("Kalitni kiriting");return}
  AI.key=v;LS.set("aiKey",v);AI.on=1;LS.set("aiOn",1);$("#aiOn").value="1";$("#aiKey").value="••••••••"+v.slice(-4);toast("Kalit saqlandi");renderGen()};
$("#aiVoice").onchange=()=>{AI.voice=$("#aiVoice").value;LS.set("aiVoice",AI.voice);renderGen()};
$("#aiTest").onclick=async()=>{if(!AI.key){toast("Avval kalitni kiriting");return}
  $("#aiStatus").textContent="Tayyorlanmoqda…";
  try{const b=await aiTTS("Assalomu alaykum, Mustafo! Men Fotima opaman. Bugun olma, nok va uzumni o'rganamiz!");stopAll();playBlob(b,playToken);$("#aiStatus").textContent="Ishladi. Ovoz yoqdimi?"}
  catch(e){$("#aiStatus").textContent=e.status===429?"Limit: bir daqiqadan keyin yana urinib ko'ring.":e.status===400||e.status===401||e.status===403?"Kalit ishlamadi. To'g'ri nusxalanganini tekshiring.":"Xato: "+e.message}};
function renderGen(){
  const total=PHRASE_IDS.length,ready=PHRASE_IDS.filter(id=>clips[id]&&(clipSrc[id]==="rec"||clipSrc[id]==="ai:"+AI.voice)).length;
  $("#genBar").style.width=(ready/total*100)+"%";
  $("#genCount").textContent=`${ready} / ${total} ta gap tayyor`;
  $("#genBtn").textContent=GEN.running?"■ To'xtatish":(ready<total?"▶ Fotima opa ovozini tayyorlash":"✓ Hammasi tayyor");
  $("#genBtn").disabled=!AI.key||(!GEN.running&&ready>=total);
  $("#genNote").textContent=GEN.running&&GEN.stopReason==="wait"?"Tekin limit: biroz kutib, o'zi davom etadi…":GEN.running?"Tayyorlanmoqda… Panelni yopsangiz ham davom etadi.":GEN.stopReason==="limit"?"Bugungi tekin limit tugadi. Ertaga shu tugmani yana bosing, qolganidan davom etadi.":GEN.stopReason==="key"?"Kalit ishlamadi.":GEN.stopReason.startsWith("error")?"Xato bo'ldi: "+GEN.stopReason.slice(6):"Har bir gap bir marta tayyorlanadi va iPad'da saqlanadi.";
}
$("#genBtn").onclick=()=>{if(GEN.running){GEN.running=false;return}runGen(()=>{if(!$("#panel").hidden){renderGen();renderRecList()}});renderGen()};

/* ---- o'z ovozingiz ---- */
let mr=null,chunks=[],recStream=null,recId=null;
$("#recFilter").onchange=renderRecList;
function renderRecList(){
  const g=$("#recFilter").value;const list=$("#recList");list.innerHTML="";
  PHRASE_IDS.filter(id=>PHRASES[id].grp===g).forEach(id=>{
    const d=document.createElement("div");d.className="li";const src=clipSrc[id];
    d.innerHTML=`<b class="${clips[id]?"ok":"no"}">${clips[id]?(src==="rec"?"🎙":"✓"):"○"}</b><span></span><button class="small rec">●</button><button class="small play">▶</button><button class="small del">✕</button>`;
    d.querySelector("span").textContent=clean(PHRASES[id].text);
    d.querySelector(".play").disabled=!clips[id];d.querySelector(".del").disabled=!clips[id];
    d.querySelector(".play").onclick=()=>{stopAll();playBlob(clips[id],playToken)};
    d.querySelector(".del").onclick=async()=>{await delClip(id);renderRecList();renderGen()};
    const rb=d.querySelector(".rec");if(recId===id){rb.classList.add("live");rb.textContent="■"}
    rb.onclick=()=>toggleRecord(id);list.appendChild(d)});
}
async function toggleRecord(id){
  if(mr&&mr.state==="recording"){const same=recId===id;stopRecording(false);if(same)return}
  if(!navigator.mediaDevices||!window.MediaRecorder){toast("Bu brauzerda ovoz yozib bo'lmaydi");return}
  try{recStream=recStream||await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}})}catch(e){toast("Mikrofon: "+e.name+". Sozlamalarda ruxsat bering");return}
  chunks=[];const type=["audio/mp4","audio/webm;codecs=opus","audio/webm"].find(t=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t));
  mr=new MediaRecorder(recStream,type?{mimeType:type}:undefined);recId=id;
  mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
  mr.onstop=async()=>{const rid=recId;recId=null;if(!mr._cancel&&chunks.length){await putClip(rid,new Blob(chunks,{type:mr.mimeType||type||"audio/mp4"}),"rec");toast("Saqlandi ✓")}renderRecList();renderGen()};
  mr.start();renderRecList();
}
function stopRecording(cancel){if(mr&&mr.state==="recording"){mr._cancel=cancel;mr.stop()}}

/* ---- mikrofon tekshiruvi ---- */
$("#micTest").onclick=async()=>{const L=$("#micLog");L.hidden=false;L.textContent="";const log=t=>{L.textContent+=t+"\n"};
  $("#micTest").disabled=true;stopAll();stopListen();
  try{
    log("Ilova: "+(navigator.standalone?"bosh ekrandan":"Safari ichida")+" · "+(navigator.userAgent.match(/OS [\d_]+/)||[""])[0]);
    log("Nutqni tanish (iPad): "+(SR?"bor":"YO'Q")+" · micDenied="+micDenied+" · aiOnly="+(typeof aiOnly!=="undefined"?aiOnly:"-"));
    log("Ovoz yozish (MediaRecorder): "+(window.MediaRecorder?"bor":"YO'Q"));
    let st;try{st=await navigator.mediaDevices.getUserMedia({audio:true});log("1) Mikrofon ruxsati: ✓")}
    catch(e){log("1) Mikrofon ruxsati: ✗ "+e.name+" "+(e.message||""));throw 0}
    log("2) 3 soniya gapiring…");
    const C=window.AudioContext||window.webkitAudioContext;const c=new C();await c.resume();const src=c.createMediaStreamSource(st),an=c.createAnalyser();an.fftSize=2048;src.connect(an);
    const d=new Float32Array(an.fftSize);let mx=0;const t0=Date.now();while(Date.now()-t0<3000){an.getFloatTimeDomainData(d);let s=0;for(const x of d)s+=x*x;mx=Math.max(mx,Math.sqrt(s/d.length));await sleep(50)}
    log("   Ovoz balandligi: "+mx.toFixed(3)+(mx>0.02?" ✓ eshitildi":" ✗ juda past yoki jim"));
    st.getTracks().forEach(t=>t.stop());c.close();
    if(SR){const ok={};
      for(const lang of ["uz-UZ","ru-RU"]){
        log(`3) iPad nutq tanishi (${lang==="uz-UZ"?"o'zbekcha":"ruscha"}): 5 soniya ichida "olma" deng…`);
        const r=await new Promise(res=>{let out="",err="",done=false;const fin=()=>{if(!done){done=true;res({out,err})}};const x=new SR();x.lang=lang;x.interimResults=true;
          x.onresult=e=>{out="";for(const q of e.results)out+=q[0].transcript};x.onerror=e=>{err=e.error};x.onend=fin;
          try{x.start()}catch(e){err="start: "+e.message;fin()}setTimeout(()=>{try{x.stop()}catch(e){}},5000);setTimeout(()=>{err=err||"javob kelmadi";try{x.abort()}catch(e){}fin()},8000)});
        log("   "+(r.out?"✓ eshitdi: \""+r.out+"\"":"✗ eshitmadi"+(r.err?" (xato: "+r.err+")":"")));ok[lang]=!!r.out}
      if(!ok["uz-UZ"]&&ok["ru-RU"]){settings.recLang="ru-RU";saveSettings();$("#set_recLang").value="ru-RU";log("→ iPad ruscha tinglashga o'tkazildi (o'zbekcha so'zlarni ham tushunadi).")}
      micDenied=false;fastEnds=0}
    log("Tayyor. Shu yozuvning rasmini yuboring.");
  }catch(e){if(e!==0)log("Xato: "+(e&&e.message||e))}
  $("#micTest").disabled=false};

/* ---- natijalar ---- */
function renderProgress(){
  const el=$("#progList");el.innerHTML="";
  SECTIONS.filter(s=>s.items.length).forEach(s=>{const p=P_(s.id);const N=s.items.length;const L=Math.min(p.pos,N);
    const weak=s.items.filter(it=>{const st=p.st[it.key];return st&&st.w>st.c}).map(it=>it.uz).slice(0,6);
    const d=document.createElement("div");d.className="li";
    d.innerHTML=`<span><b>${esc(s.name)}</b>: ${L} / ${N} o'rganildi${weak.length?` · qiynalyapti: ${esc(weak.join(", "))}`:""}</span>`;el.appendChild(d)});
  const m=P_("matem");const d=document.createElement("div");d.className="li";d.innerHTML=`<span><b>Matematika</b>: ${m.lvl}-bosqich (5 tadan)</span>`;el.appendChild(d);
  $("#usageNote").textContent=`Bugun: ${Math.round((usage.day===today()?usage.sec:0)/60)} daqiqa`;
}
$("#resetProg").onclick=()=>{if(!$("#resetProg").dataset.armed){$("#resetProg").dataset.armed="1";$("#resetProg").textContent="Ishonchingiz komilmi? Yana bosing";return}
  for(const k in prog)delete prog[k];saveProg();stars=0;LS.set("stars",0);$("#stars").textContent=0;delete $("#resetProg").dataset.armed;$("#resetProg").textContent="Natijalarni nolga";renderProgress();toast("Natijalar nolga tushirildi")};

/* ---- zaxira ---- */
$("#exportBtn").onclick=async()=>{
  const out={app:"mustafo-maktabi",v:3,clipSrc,prog,stars,clips:{}};for(const id of Object.keys(clips))out.clips[id]=await blobB64(clips[id]).then(b=>"data:"+(clips[id].type||"audio/wav")+";base64,"+b);
  const blob=new Blob([JSON.stringify(out)],{type:"application/json"});const file=new File([blob],"mustafo-zaxira.json",{type:"application/json"});
  if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:"Mustafo maktabi zaxirasi"});return}catch(e){if(e.name==="AbortError")return}}
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="mustafo-zaxira.json";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)};
$("#importIn").onchange=async e=>{const f=e.target.files[0];if(!f)return;
  try{const j=JSON.parse(await f.text());let n=0;
    for(const [id,data] of Object.entries(j.clips||{})){if(!PHRASES[id])continue;const blob=await (await fetch(data)).blob();await putClip(id,blob,(j.clipSrc&&j.clipSrc[id])||"rec");n++}
    if(j.prog){Object.assign(prog,j.prog);saveProg()}if(j.stars!=null){stars=j.stars;LS.set("stars",stars);$("#stars").textContent=stars}
    toast(n+" ta ovoz tiklandi");renderGen();renderRecList();renderProgress()}catch(err){toast("Faylni o'qib bo'lmadi")}
  e.target.value=""};

/* ======================= BOSHLASH ======================= */
$("#goBtn").onclick=async()=>{
  try{audio.src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";audio.play().catch(()=>{})}catch(e){}
  if(synth){const u=new SpeechSynthesisUtterance(" ");u.volume=0;synth.speak(u)}
  loadVoices();
  if(AI.key&&AI.on==1){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();actx.resume()}catch(e){}ensureMic()}
  if(+settings.time>0&&usage.day===today()&&usage.sec>=settings.time*60){$("#cover").hidden=true;$("#rest").hidden=false;return}
  $("#cover").hidden=true;
  await say(["salom"]);goMenu();
};
loadClips().then(()=>{if(AI.key&&PHRASE_IDS.some(id=>!clips[id]))runGen()});
buildMenu();
if("serviceWorker" in navigator&&location.protocol==="https:")navigator.serviceWorker.register("sw.js").catch(()=>{});
window.__mm={matchAnswer,norm,isRefusal,SECTIONS,PHRASE_IDS};
