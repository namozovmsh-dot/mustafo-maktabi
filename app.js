"use strict";
/* ======================= YORDAMCHI ======================= */
const $=s=>document.querySelector(s);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const LS={get(k,d){try{const v=localStorage.getItem("mm3_"+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem("mm3_"+k,JSON.stringify(v))}catch(e){}}};
function toast(t){const d=document.createElement("div");d.className="toast";d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),3000)}
const settings=Object.assign({mic:1,recLang:"uz-UZ",time:60,rate:0.85},LS.get("settings",{}));
function saveSettings(){LS.set("settings",settings)}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ---- IndexedDB: tayyor ovozlar ---- */
let dbp=null;
function db(){if(dbp)return dbp;dbp=new Promise((res,rej)=>{const r=indexedDB.open("mustafo",1);r.onupgradeneeded=()=>r.result.createObjectStore("clips");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});return dbp}
const clips={};let clipSrc=LS.get("clipSrc",{});
async function loadClips(){try{const d=await db();await new Promise(res=>{const tx=d.transaction("clips","readonly");const c=tx.objectStore("clips").openCursor();c.onsuccess=()=>{const cur=c.result;if(cur){clips[cur.key]=cur.value;cur.continue()}else res()};c.onerror=()=>res()})}catch(e){}}
async function putClip(id,blob,src){clips[id]=blob;clipSrc[id]=src;LS.set("clipSrc",clipSrc);try{const d=await db();await new Promise((res,rej)=>{const tx=d.transaction("clips","readwrite");tx.objectStore("clips").put(blob,id);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}catch(e){toast("Saqlab bo'lmadi")}}
async function delClip(id){delete clips[id];delete clipSrc[id];LS.set("clipSrc",clipSrc);try{const d=await db();d.transaction("clips","readwrite").objectStore("clips").delete(id)}catch(e){}}

/* ======================= OVOZ CHIQARISH ======================= */
const synth=window.speechSynthesis;let voices=[];
function loadVoices(){if(synth)voices=synth.getVoices()}
if(synth){loadVoices();synth.onvoiceschanged=loadVoices}
function voiceFor(lang){const l=lang.slice(0,2);const vs=voices.filter(v=>v.lang&&v.lang.toLowerCase().startsWith(l));
  return vs.find(v=>/premium|enhanced|milena|samantha|yelda|katya/i.test(v.name))||vs.find(v=>v.localService)||vs[0]}
let playToken=0;const audio=new Audio();audio.playsInline=true;
const face=$("#face"),bubble=$("#bubble");
/* Fotima opa yuzi: gapirganda og'iz, ko'z pirpiratish, kulish */
const mouthEl=$("#mouth");let flap=null;
/* haqiqiy rasm (fotima/1..8.jpg): 1 jilmaygan, 2-3 gapirayotgan, 5-6 kulayotgan, 8 ko'z yumgan */
const faceImg=$("#faceImg"),FR=[];let photo=false,shown=null;
Promise.all([1,2,3,4,5,6,7,8].map(i=>new Promise((ok,no)=>{const im=new Image();im.alt="";im.onload=()=>{FR[i]=im;ok()};im.onerror=no;im.src="fotima/"+i+".jpg"})))
  .then(()=>{FR.slice(1).forEach(im=>faceImg.appendChild(im));photo=true;faceImg.hidden=false;face.classList.add("photo");frame()}).catch(()=>{});
function frame(){if(!photo)return;const c=face.classList;
  const n=c.contains("happy")?(Date.now()%600<300?5:6):c.contains("blink")&&!mouthOpen?8:mouthOpen?(Math.random()<0.5?2:3):1;
  if(shown!==n){if(shown)FR[shown].classList.remove("on");FR[n].classList.add("on");shown=n}}
let mouthOpen=false;
function setMouth(o){mouthOpen=o>0.45;/* o: 0 yopiq tabassum .. 1 katta ochiq */
  const top=63-o*2,bot=top+5+o*10;mouthEl.setAttribute("d",`M43 ${top} Q50 ${top+1.5} 57 ${top} Q50 ${bot} 43 ${top}Z`);frame()}
function talking(on){face.classList.toggle("talk",on);clearInterval(flap);flap=null;
  if(on){let k=0;flap=setInterval(()=>{k++;setMouth(k%5===4?0.1:0.25+Math.random()*0.75)},photo?150:110)}else setMouth(0)}
function happyFace(){face.classList.remove("happy");void face.offsetWidth;face.classList.add("happy");frame();if(!flap)setMouth(0.6);setTimeout(()=>{face.classList.remove("happy");if(!flap)setMouth(0)},1500)}
(function blink(){setTimeout(()=>{face.classList.add("blink");frame();setTimeout(()=>{face.classList.remove("blink");frame()},140);blink()},2500+Math.random()*3000)})();
function stopAll(){playToken++;try{audio.pause()}catch(e){}if(synth)synth.cancel();talking(false)}
function ttsSay(text,lang,tok){return new Promise(res=>{
  if(!synth||tok!==playToken)return res();
  const u=new SpeechSynthesisUtterance(text);const v=voiceFor(lang);if(v)u.voice=v;u.lang=v?v.lang:lang;
  u.rate=lang.startsWith("uz")||lang.startsWith("tr")?0.85:+settings.rate;u.pitch=1.1;
  let done=false;const fin=()=>{if(!done){done=true;res()}};
  u.onend=fin;u.onerror=fin;setTimeout(fin,Math.max(3000,text.length*190));synth.speak(u)})}
function playBlob(blob,tok){return new Promise(res=>{
  if(tok!==playToken)return res();
  const url=URL.createObjectURL(blob);audio.src=url;
  const fin=()=>{audio.onended=audio.onerror=null;URL.revokeObjectURL(url);res()};
  audio.onended=fin;audio.onerror=fin;audio.play().catch(fin)})}
const clean=t=>t.replace(/\.\.\./g,"").trim();
/* bitta o'zbekcha gap: tayyor ovoz, bo'lmasa son bo'laklari, bo'lmasa iPad ovozi */
async function playUz(id,tok){
  if(clips[id])return playBlob(clips[id],tok);
  const m=/^w_n(\d+)$/.exec(id);
  if(m){const n=+m[1];if(n>20&&n<100&&n%10){const t=Math.floor(n/10)*10,u=n%10;
    if(clips["w_n"+t]&&clips["w_n"+u]){await playBlob(clips["w_n"+t],tok);return playBlob(clips["w_n"+u],tok)}}}
  const ph=PHRASES[id];if(ph)return ttsSay(clean(ph.text),voiceFor("uz")?"uz-UZ":"tr-TR",tok);
}
/* parts: "id", {ru}, {en}, {pause}, {fn} */
async function say(parts,showText){
  stopAll();const tok=playToken;talking(true);
  if(showText!==undefined)bubble.textContent=showText;
  for(const p of parts){
    if(tok!==playToken)return false;
    if(typeof p==="string"){if(showText===undefined&&PHRASES[p])bubble.textContent=clean(PHRASES[p].text);await playUz(p,tok)}
    else if(p.ru){await ttsSay(p.ru,"ru-RU",tok)}
    else if(p.en){await ttsSay(p.en,"en-US",tok)}
    else if(p.pause){await sleep(p.pause)}
    else if(p.fn){p.fn()}
    if(tok!==playToken)return false;
    await sleep(110);
  }
  talking(false);return tok===playToken;
}

/* ======================= MIKROFON: iPad nutq tanishi ======================= */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null,onHeard=null,micDenied=false,fastEnds=0;
const micEl=$("#mic"),heardEl=$("#heard");
function canListen(){return !!SR&&settings.mic==1&&!micDenied}
function listen(handler){
  stopListen();if(!canListen())return handler(null);
  onHeard=handler;
  try{
    rec=new SR();rec.lang=settings.recLang;rec.interimResults=true;rec.continuous=false;rec.maxAlternatives=3;
    let finalText="";const started=Date.now();
    rec.onresult=e=>{let t="",alts=[];for(const r of e.results){t+=r[0].transcript;for(let i=0;i<r.length;i++)alts.push(r[i].transcript)}heardEl.textContent="🗣 "+t;if(e.results[e.results.length-1].isFinal)finalText=alts.join(" | ")};
    rec.onerror=e=>{if(e.error==="language-not-supported"&&settings.recLang!=="ru-RU"){settings.recLang="ru-RU";saveSettings()}
      if(e.error==="not-allowed"||e.error==="service-not-allowed")micDenied=true;
      if(e.error==="audio-capture")aiOnly=true};
    rec.onend=()=>{micEl.classList.remove("on");const h=onHeard;onHeard=null;rec=null;
      if(!finalText&&Date.now()-started<700){if(++fastEnds>=5)micDenied=true}else fastEnds=0;
      if(h)setTimeout(()=>h(finalText||null),finalText?0:200)};
    rec.start();micEl.classList.add("on");
  }catch(e){micEl.classList.remove("on");onHeard=null;handler(null)}
}
function stopListen(){if(stopCap)stopCap();onHeard=null;if(rec){try{rec.abort()}catch(e){}}rec=null;micEl.classList.remove("on")}
const CYR={"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"j","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"x","ц":"ts","ч":"ch","ш":"sh","щ":"sh","ъ":"","ы":"i","ь":"","э":"e","ю":"yu","я":"ya","ў":"o","қ":"q","ғ":"g","ҳ":"h"};
function norm(s){return (s||"").toLowerCase().replace(/[а-яёўқғҳ]/g,ch=>CYR[ch]??ch).replace(/[ʻʼ'’`‘]/g,"").replace(/-/g," ").replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim()}
function lev(a,b){const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let p=Array.from({length:n+1},(_,i)=>i);for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[n]}
function scoreForm(text,form){
  if(!form)return 0;const t=" "+text+" ",f=norm(form);if(!f)return 0;
  if(t.includes(" "+f+" "))return 10+f.length;
  if(!f.includes(" ")&&f.length>=3){const tol=f.length>=6?2:1;for(const w of text.split(" "))if(w.length>=2&&lev(w,f)<=tol)return 5+f.length-lev(w,f)}
  return 0}
function matchAnswer(raw,options){
  const texts=raw.split("|").map(norm).filter(Boolean);let best=null,bs=0,tie=false;
  for(const o of options){let s=0;for(const t of texts)for(const f of o.forms)s=Math.max(s,scoreForm(t,f));
    if(s>bs){bs=s;best=o.key;tie=false}else if(s===bs&&s>0&&o.key!==best)tie=true}
  return bs>0&&!tie?best:null}
const REFUSE=["xohlamay","hohlamay","istamay","xoxlamay","zerikdim","charchadim","ne xochu","nexochu","ne budu","dont want","ustal","skuchno"];
function isRefusal(raw){const t=" "+norm(raw)+" ";return REFUSE.some(w=>t.includes(w))}
const formsOf=o=>({key:o.key,forms:[o.uz,o.ru,o.en,o.n!=null?String(o.n):null,o.L&&o.L.length>1?o.L:null]});
