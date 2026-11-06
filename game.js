"use strict";
/* ======================= DARS ======================= */
let stars=LS.get("stars",0);$("#stars").textContent=stars;
const menu=$("#menu"),stage=$("#stage"),show=$("#show"),wordsEl=$("#words"),choicesEl=$("#choices"),bottom=$("#bottom");
let session=0,quiz=null,sec=null,idleCount=0;
const prog=LS.get("prog",{});
function P_(id){return prog[id]||(prog[id]={pos:0,st:{},streak:0,newRun:0,why:"",lvl:1,lvlOk:0,doneSaid:0})}
function saveProg(){LS.set("prog",prog)}
function stat(it){const p=P_(it.sec);return p.st[it.key]||(p.st[it.key]={c:0,w:0})}

function addStar(n=1){stars+=n;LS.set("stars",stars);$("#stars").textContent=stars;
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;const c=$("#confetti");
  for(let i=0;i<10+n*6;i++){const e=document.createElement("i");e.textContent=rnd(["⭐","🎉","✨","🌟","🎈"]);e.style.left=Math.random()*100+"%";e.style.animationDelay=Math.random()*.4+"s";c.appendChild(e);setTimeout(()=>e.remove(),2100)}}

/* ---------- menyu ---------- */
function buildMenu(){
  menu.innerHTML="";
  SECTIONS.forEach(s=>{
    const b=document.createElement("button");b.className="topic";b.style.background=s.color;b.dataset.sec=s.id;
    const N=s.items.length,p=P_(s.id);const pct=N?Math.min(1,p.pos/N):0;
    b.innerHTML=`<span class="big">${esc(s.icon)}</span><span>${esc(s.name)}</span>${N?`<span class="pbar"><i style="width:${Math.round(pct*100)}%"></i></span>`:""}`;
    b.onclick=()=>openSection(s.id);menu.appendChild(b)});
}
function goMenu(){document.body.classList.remove("asking");session++;stopAll();stopListen();quiz=null;sec=null;buildMenu();menu.hidden=false;stage.hidden=true;bottom.hidden=true;$("#homeBtn").hidden=true;say(["tanla"])}
$("#homeBtn").onclick=goMenu;
$("#nextBtn").onclick=()=>{session++;stopAll();stopListen();quiz=null;nextStep()};
$("#repeatBtn").onclick=()=>{if(quiz)reAsk(quiz);else if(cur)teach(cur)};

async function openSection(id){
  sec=SEC_BY[id];session++;const my=session;quiz=null;
  menu.hidden=true;stage.hidden=false;bottom.hidden=false;$("#homeBtn").hidden=false;clearStage();
  const p=P_(id);const today=new Date().toISOString().slice(0,10);
  const parts=[];if(sec.kind!=="mix")parts.push("intro_"+id);
  if(sec.why&&p.why!==today){parts.push("why_"+id);p.why=today;saveProg()}
  if(parts.length&&!await say(parts))return;
  if(my===session)nextStep();
}

/* ---------- rasm chizish ---------- */
const SHAPES={circle:'<circle cx="50" cy="50" r="42"/>',square:'<rect x="10" y="10" width="80" height="80" rx="4"/>',triangle:'<polygon points="50,8 94,90 6,90"/>',
  rect:'<rect x="4" y="24" width="92" height="52" rx="4"/>',star:'<polygon points="50,5 61,38 96,38 68,59 79,93 50,72 21,93 32,59 4,38 39,38"/>',
  heart:'<path d="M50 88 C20 66 4 48 4 30 C4 16 15 6 28 6 C38 6 46 12 50 20 C54 12 62 6 72 6 C85 6 96 16 96 30 C96 48 80 66 50 88Z"/>',
  oval:'<ellipse cx="50" cy="50" rx="46" ry="30"/>',diamond:'<polygon points="50,4 94,50 50,96 6,50"/>'};
const shapeSvg=(it,size)=>`<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-label="${esc(it.uz)}"><g fill="${it.hex}" stroke="rgba(0,0,0,.25)" stroke-width="2">${SHAPES[it.shape]}</g></svg>`;
function picHtml(it,{big=true,count=false}={}){
  if(it.n!=null){
    const n=it.n;
    if(n<=20){const pic=it._pic||(it._pic=rnd(COUNT_PICS));return `<div class="pic${n>6?" many":""}${n>12?" lots":""}">${Array.from({length:n},(_,i)=>`<span data-i="${i}">${pic}</span>`).join("")}</div>`}
    const t=Math.floor(n/10),u=n%10;
    return `<div class="tens">${Array.from({length:t},(_,i)=>`<div class="bar" data-i="${i}">${"<b></b>".repeat(10)}</div>`).join("")}${u?`<div class="units">${"<b></b>".repeat(u)}</div>`:""}</div>`}
  if(it.hex&&!it.shape)return `<div class="blob" style="background:${it.hex}"></div>`;
  if(it.shape)return shapeSvg(it,big?220:90);
  if(it.badge)return `<div class="badge${big?"":" sm"}">${esc(it.badge)}<small>${esc(it.badgeNote||"")}</small></div>`;
  return `<div class="pic one">${it.pic}</div>`;
}
function choiceHtml(o,kind){
  if(kind==="numbers")return esc(o.n);
  if(o.shape)return shapeSvg(o,80);
  if(o.badge)return `<span style="font-size:44px">${esc(o.badge)}</span>`;
  return o.pic||"";
}
function clearStage(){show.innerHTML="";wordsEl.innerHTML="";choicesEl.innerHTML="";heardEl.textContent="";$("#gameBar").innerHTML=""}
function renderTeach(it){
  clearStage();document.body.classList.remove("asking");
  if(it.L)show.innerHTML=`<div class="big">${esc(it.L)}<span class="lo">${esc(it.L.toLowerCase())}</span></div><div class="pic one">${it.pic}</div>`;
  else if(it.n!=null)show.innerHTML=picHtml(it)+`<div class="big">${it.n}</div>`;
  else show.innerHTML=picHtml(it);
  wordsEl.innerHTML=`<span id="w-uz">${esc(it.uz)}</span><span id="w-ru">${esc(it.ru)}</span><span id="w-en">${esc(it.en)}</span>`;
}
function hl(id){wordsEl.querySelectorAll("span").forEach(s=>s.classList.toggle("on",s.id===id))}

/* ---------- o'rgatish ---------- */
let cur=null;
async function teach(it){
  cur=it;quiz=null;renderTeach(it);stopListen();const my=session;
  const p=P_(it.sec);const fast=p.streak>=3;
  bubble.textContent=`${it.L?it.L+" — ":""}${it.uz} · ${it.ru} · ${it.en}`;
  const steps=[["qara","w-uz"],[it.clip,"w-uz"]];
  /* 10 gacha sonlarni birga sanaymiz */
  if(it.n!=null&&it.n<=10&&!fast){steps.push(["sanaymiz",null]);for(let i=1;i<=it.n;i++)steps.push([{fn:()=>{const s=show.querySelector(`[data-i="${i-1}"]`);if(s)s.classList.add("on")}},null],["w_n"+i,null])}
  if(it.n!=null&&it.n>20&&!fast){const t=Math.floor(it.n/10);for(let i=1;i<=t;i++)steps.push([{fn:()=>{const b=show.querySelector(`.bar[data-i="${i-1}"]`);if(b)b.classList.add("on")}},null],["w_n"+i*10,null]);if(it.n%10)steps.push([it.clip,"w-uz"])}
  steps.push(["ruschasi","w-ru"],[{ru:it.ru},"w-ru"],["inglizchasi","w-en"],[{en:it.en},"w-en"]);
  if(!fast)steps.push(["birga","w-uz"],[it.clip,"w-uz"]);
  for(const [part,h] of steps){if(my!==session)return false;if(h)hl(h);if(!await say([part],bubble.textContent))return false}
  hl(null);return true;
}

/* ---------- savol ---------- */
function distractors(it,k){
  const s=SEC_BY[it.sec];
  if(it.n!=null){const set=new Set([it.n]);const max=Math.max(10,P_("son").pos>0?Math.max(...NUMBERS.slice(0,Math.max(1,P_("son").pos)).map(x=>x.n)):10);
    let guard=0;while(set.size<k+1&&guard++<200){const d=it.n<=20?Math.floor(Math.random()*5)-2:rnd([-10,10,-1,1,-2,2]);const v=it.n+d;if(v>=1&&v<=Math.max(max,it.n+2)&&v<=100)set.add(v)}
    return [...set].filter(v=>v!==it.n).map(v=>NUM_BY[v])}
  const look=o=>o.pic||o.hex+(o.shape||"")||o.badge;
  return shuffle(s.items.filter(o=>o.key!==it.key&&look(o)!==look(it))).slice(0,k);
}
function makeQuiz(it,{choicesN=3,mode}={}){
  const s=SEC_BY[it.sec];const kind=s.kind;
  if(!mode){if(kind==="words"||kind==="colors"||kind==="shapes")mode=Math.random()<0.5?"name":"find";else mode="pick"}
  const opts=shuffle([it,...distractors(it,choicesN-1)]);
  const topic=s.name;
  const question=kind==="letters"?`Ekranda ${it.L} harfi. Qaysi rasm shu harf bilan boshlanadi?`:kind==="numbers"?"Rasmda nechta narsa bor?":mode==="find"?`${it.uz} qayerda? (bola ekrandan topib bosishi kerak)`:"Bu nima?";
  return {it,opts,mode,kind,context:{topic,question},tries:0,my:session};
}
function renderQuiz(q){
  clearStage();document.body.classList.add("asking");const it=q.it;
  if(q.kind==="letters")show.innerHTML=`<div class="big">${esc(it.L)}<span class="lo">${esc(it.L.toLowerCase())}</span></div>`;
  else if(q.kind==="numbers")show.innerHTML=picHtml(it);
  else if(q.mode==="name")show.innerHTML=picHtml(it);
  if(q.mode==="name"&&!q.showChoices)return;
  q.opts.forEach(o=>{const b=document.createElement("button");b.className="choice"+(q.kind==="colors"?" sw":"")+(o.shape?" shp":"");b.dataset.key=o.key;
    if(q.kind==="colors")b.style.background=o.hex;else b.innerHTML=choiceHtml(o,q.kind);
    b.setAttribute("aria-label",o.uz);b.onclick=()=>answer(o.key);choicesEl.appendChild(b)});
}
function qParts(q){
  if(q.kind==="letters")return["s_harf"];if(q.kind==="numbers")return["s_son"];
  if(q.mode==="find")return[q.it.clip,"s_qayerda"];
  return[q.kind==="colors"?"s_rang":q.kind==="shapes"?"s_shakl":"s_nima"];
}
function qLabel(q){if(q.kind==="letters")return"Qaysi rasm shu harf bilan boshlanadi?";if(q.kind==="numbers")return"Bu nechta?";if(q.mode==="find")return`${q.it.uz} qayerda?`;return q.kind==="colors"?"Bu qaysi rang?":q.kind==="shapes"?"Bu qanday shakl?":"Bu nima?"}
let onQuizDone=null;
function ask(q,done){
  quiz=q;q.my=session;onQuizDone=done||null;
  if(q.mode==="name"&&!canListen()&&!aiReady())q.showChoices=true;
  renderQuiz(q);
  say(qParts(q),qLabel(q)).then(ok=>{if(ok&&quiz===q)waitAnswer()});
}
function reAsk(q){const my=session;q.showChoices=q.showChoices||q.tries>0;renderQuiz(q);say(qParts(q),qLabel(q)).then(ok=>{if(ok&&my===session&&quiz===q)waitAnswer()})}

async function waitAnswer(){
  if(!quiz)return;const my=session;const q=quiz;
  if(!canListen()&&!aiReady()){q.showChoices=true;if(!choicesEl.children.length)renderQuiz(q);return}
  const r=await hearOnce(q.opts.map(formsOf));
  if(my!==session||quiz!==q)return;
  if(r.matched)return answer(r.matched);
  if(r.wav&&aiReady()&&(q.aiCount||0)<2&&Date.now()-(window.__lastAi||0)>5000){
    q.aiCount=(q.aiCount||0)+1;window.__lastAi=Date.now();
    heardEl.textContent="🤔 …";
    try{const o=await aiUnderstand(q,r.wav,r.srText);if(my!==session||quiz!==q)return;
      heardEl.textContent=o.heard?"🗣 "+o.heard:"";idleCount=0;
      if(o.match&&q.opts.some(x=>x.key===o.match))return answer(o.match);
      if(o.intent==="silence")return waitAnswer();
      if(o.reply){if(await sayAI(o.reply)&&my===session&&quiz===q){await sleep(300);if(q.aiCount>=2)q.showChoices=true;return reAsk(q)}return}
    }catch(e){if(e.status===401||e.status===403){AI.on=0;toast("Gemini kaliti ishlamadi. Ota-ona panelini tekshiring.")}}
  }
  if(r.srText){idleCount=0;if(isRefusal(r.srText))return coax(q);return say(["eshitmadim"]).then(ok=>{if(ok&&my===session&&quiz===q)waitAnswer()})}
  if(r.wav)return say(["eshitmadim"]).then(ok=>{if(ok&&my===session&&quiz===q)waitAnswer()});
  idleCount++;
  if(q.mode==="name"&&!q.showChoices){q.showChoices=true;renderQuiz(q);return say(["bosib"]).then(ok=>{if(ok&&my===session&&quiz===q)waitAnswer()})}
  if(idleCount>=2){idleCount=0;return say([rnd(["kutish","e2","e5"])]).then(ok=>{if(ok&&my===session&&quiz===q)waitAnswer()})}
  return waitAnswer();
}
async function coax(q){const my=session;await say([rnd(["e1","e2","e3","e4","e5"])]);if(my===session&&quiz===q){q.showChoices=true;reAsk(q)}}

async function answer(key){
  const q=quiz;if(!q)return;const my=session;stopListen();
  const btn=choicesEl.querySelector(`[data-key="${CSS.escape(key)}"]`);
  const st=q.it.sec?stat(q.it):null;const p=q.it.sec?P_(q.it.sec):null;
  if(key===q.it.key){
    quiz=null;if(btn)btn.classList.add("right");addStar();happyFace();
    if(st){if(q.tries===0){st.c++;p.streak++}else p.streak=0;saveProg()}
    if(q.kind!=="math"){renderTeach(q.it);hl("w-uz")}
    await say([rnd(["t1","t2","t3","t4","t5","t6"])]);
    if(my!==session)return;
    if(q.kind!=="math"&&!(p&&p.streak>=3))await say([q.it.clip],`${q.it.uz} · ${q.it.ru} · ${q.it.en}`);
    if(my!==session)return;await sleep(350);
    if(my===session){const d=onQuizDone;onQuizDone=null;d?d(true,q):nextStep()}
  }else{
    if(btn)btn.classList.add("wrong");stopAll();
    if(st&&q.tries===0){st.w++;p.streak=0;saveProg()}
    q.tries++;
    const right=choicesEl.querySelector(`[data-key="${CSS.escape(q.it.key)}"]`);
    if(right)right.classList.add("hint");
    if(q.mode==="find"&&q.kind!=="math"){await say(["x_find",q.it.clip])}
    else await say([rnd(["x1","x2","x3"]),q.it.clip]);
    if(my!==session)return;
    await say(["ozing"]);if(my!==session)return;
    /* osonroq: 2 ta variant */
    if(q.opts.length>2){q.opts=shuffle([q.it,...q.opts.filter(o=>o.key!==q.it.key).slice(0,1)])}
    q.showChoices=true;quiz=q;reAsk(q);
  }
}

/* ---------- dars oqimi ---------- */
function learned(s){return s.items.slice(0,Math.min(P_(s.id).pos,s.items.length))}
function pickReview(s){const L=learned(s);if(!L.length)return null;
  const w=L.map(it=>{const st=P_(s.id).st[it.key]||{c:0,w:0};return 1+st.w*3+Math.max(0,3-st.c)});
  let r=Math.random()*w.reduce((a,b)=>a+b,0);for(let i=0;i<L.length;i++){r-=w[i];if(r<=0)return L[i]}return L[L.length-1]}
async function nextStep(){
  session++;const my=session;stopListen();idleCount=0;quiz=null;
  if(!sec)return;
  if(sec.kind==="math")return mathRound(my);
  if(sec.kind==="mix"){const pool=SECTIONS.filter(s=>s.items.length&&P_(s.id).pos>=3);
    if(!pool.length){clearStage();bubble.textContent="Avval boshqa bo'limlardan biroz o'rganamiz!";return say(["tanla"])}
    const s=rnd(pool);const it=pickReview(s);return ask(makeQuiz(it))}
  const p=P_(sec.id),N=sec.items.length,L=learned(sec).length;
  /* o'yin vaqti */
  if(p.newRun>=4&&L>=5){p.newRun=0;saveProg();
    if((sec.kind==="words"||sec.kind==="colors"||sec.kind==="shapes")&&L>=4&&Math.random()<0.5)return missingGame(my);
    return quickGame(my)}
  if(p.pos<N&&(L<2||Math.random()<0.65)){
    const it=sec.items[p.pos];p.pos++;p.newRun++;saveProg();
    if(L>0&&Math.random()<0.4){if(!await say([Math.random()<0.15?"til":"yangi"]))return}
    if(my!==session)return;
    if(!await teach(it)||my!==session)return;
    await sleep(400);if(my!==session)return;
    return ask(makeQuiz(it));
  }
  if(p.pos>=N&&!p.doneSaid){p.doneSaid=1;saveProg();if(!await say(["tamom"]))return}
  if(Math.random()<0.3){if(!await say(["takror"]))return}
  if(my!==session)return;
  const it=pickReview(sec);ask(makeQuiz(it));
}

/* O'yin: tez javob (5 ta savol) */
async function quickGame(my){
  clearStage();if(!await say(["s_tez"]))return;
  let k=0;const bar=$("#gameBar");
  const one=()=>{if(my!==session&&quiz==null&&k>0){} bar.innerHTML=Array.from({length:5},(_,i)=>`<i class="${i<k?"ok":""}"></i>`).join("");
    if(k>=5){addStar(3);say(["tez_ok"]).then(ok=>{if(ok)nextStep()});return}
    const it=pickReview(sec);ask(makeQuiz(it),()=>{k++;one()})};
  one();
}
/* O'yin: nima yo'qoldi? */
async function missingGame(my){
  const set=shuffle(learned(sec)).filter((o,i,a)=>a.findIndex(x=>(x.pic||x.hex)===(o.pic||o.hex))===i).slice(0,4);
  if(set.length<4)return quickGame(my);
  const gone=rnd(set);clearStage();
  show.innerHTML=`<div class="row4">${set.map(o=>`<div class="cell">${picHtml(o,{big:false})}</div>`).join("")}</div>`;
  if(!await say(["s_yumgin"])||my!==session)return;
  await sleep(1200);if(my!==session)return;
  show.innerHTML=`<div class="row4 cover">${set.map(()=>`<div class="cell">❓</div>`).join("")}</div>`;
  await sleep(1300);if(my!==session)return;
  show.innerHTML=`<div class="row4">${set.map(o=>`<div class="cell">${o===gone?"":picHtml(o,{big:false})}</div>`).join("")}</div>`;
  const others=distractors(gone,4).filter(o=>!set.includes(o)).slice(0,2);
  const q={it:gone,opts:shuffle([gone,...others]),mode:"find",kind:sec.kind,context:{topic:sec.name,question:"Qaysi biri yo'qoldi? Ekranda 3 ta qoldi."},tries:0,showChoices:true,my:session};
  quiz=q;onQuizDone=null;
  q.opts.forEach(o=>{const b=document.createElement("button");b.className="choice"+(q.kind==="colors"?" sw":"")+(o.shape?" shp":"");b.dataset.key=o.key;if(q.kind==="colors")b.style.background=o.hex;else b.innerHTML=choiceHtml(o,q.kind);b.onclick=()=>answer(o.key);choicesEl.appendChild(b)});
  say(["s_yoqoldi"],"Qaysi biri yo'qoldi?").then(ok=>{if(ok&&quiz===q)waitAnswer()});
}

/* ---------- matematika: bosqichlar ---------- */
const LEVELS=[null,{op:"+",max:5},{op:"+",max:10},{op:"-",max:10},{op:"+",max:20},{op:"-",max:20}];
async function mathRound(my){
  const p=P_("matem");const L=LEVELS[p.lvl]||LEVELS[5];
  let a,b,ans;
  if(L.op==="+"){a=1+Math.floor(Math.random()*(L.max-1));b=1+Math.floor(Math.random()*Math.max(1,L.max-a));ans=a+b}
  else{a=2+Math.floor(Math.random()*(L.max-1));b=1+Math.floor(Math.random()*(a-1));ans=a-b}
  const pic=rnd(COUNT_PICS);const ansIt=NUM_BY[ans]||{n:ans,uz:numUz(ans),ru:numRu(ans),en:numEn(ans),key:"n"+ans,clip:"w_n"+ans};
  const it=Object.assign({},ansIt,{clip:"w_n"+ans,sec:null});
  clearStage();
  const grp=n=>`<div class="grp">${`<span>${pic}</span>`.repeat(n)}</div>`;
  show.innerHTML=L.op==="+"?`<div class="pic many" style="flex-wrap:nowrap;align-items:center;gap:10px 26px">${grp(a)}<span class="op">+</span>${grp(b)}</div><div class="big sum">${a} + ${b} = ?</div>`
    :`<div class="pic many"><div class="grp">${Array.from({length:a},(_,i)=>`<span class="${i>=a-b?"gone":""}">${pic}</span>`).join("")}</div></div><div class="big sum">${a} − ${b} = ?</div>`;
  const set=new Set([ans]);let g=0;while(set.size<3&&g++<100){const v=ans+Math.floor(Math.random()*5)-2;if(v>=0&&v<=20)set.add(v)}
  const opts=shuffle([...set]).map(n=>({n,key:"n"+n,uz:numUz(n)||"nol",ru:numRu(n)||"ноль",en:numEn(n)||"zero"}));
  const q={it,opts,mode:"pick",kind:"math",context:{topic:"matematika",question:`${a} ${L.op==="+"?"qo'shuv":"ayiruv"} ${b} nechta bo'ladi?`},tries:0,showChoices:true,my:session};
  quiz=q;onQuizDone=(ok,qq)=>{if(qq.tries===0){p.lvlOk++;if(p.lvlOk>=6&&p.lvl<5){p.lvl++;p.lvlOk=0}}else p.lvlOk=Math.max(0,p.lvlOk-2);saveProg();nextStep()};
  opts.forEach(o=>{const bt=document.createElement("button");bt.className="choice";bt.dataset.key=o.key;bt.textContent=o.n;bt.onclick=()=>answer(o.key);choicesEl.appendChild(bt)});
  const story=L.op==="+"?rnd(["m_q1","m_q2"]):rnd(["m_a1","m_a2"]);
  const ok=await say([story,"w_n"+a,L.op==="+"?"qoshuv":"ayiruv","w_n"+b,L.op==="+"?"s_qosh":"s_ayir"],`${a} ${L.op==="+"?"+":"−"} ${b} = ?`);
  if(ok&&quiz===q)waitAnswer();
}

/* ======================= VAQT CHEKLOVI ======================= */
const today=()=>new Date().toISOString().slice(0,10);
let usage=LS.get("usage",{day:today(),sec:0});
setInterval(()=>{
  if(document.hidden||!$("#cover").hidden||!$("#rest").hidden||!$("#panel").hidden)return;
  if(usage.day!==today())usage={day:today(),sec:0};
  usage.sec+=5;LS.set("usage",usage);
  if(+settings.time>0&&usage.sec>=settings.time*60)restTime();
},5000);
async function restTime(){session++;stopListen();quiz=null;await say(["dam"]);$("#rest").hidden=false}
