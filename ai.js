"use strict";
/* ======================= AI (Gemini, tekin kalit) ======================= */
const AI={key:LS.get("aiKey",""),voice:LS.get("aiVoice","Leda"),on:LS.get("aiOn",1),cooldownUntil:0,
  textModels:["gemini-3.8-flash","gemini-3.5-flash-lite","gemini-2.5-flash"],ttsModels:["gemini-3.8-flash-tts","gemini-3.1-flash-tts-preview","gemini-3.8-flash-lite-tts","gemini-2.5-flash-preview-tts"]};
const VOICES=[["Leda","yosh, quvnoq"],["Aoede","yengil, mayin"],["Zephyr","yorqin"],["Kore","aniq, ishonchli"],["Callirrhoe","xotirjam"],["Despina","silliq"],["Laomedeia","jo'shqin"],["Achernar","yumshoq"],["Sulafat","iliq"],["Vindemiatrix","nozik"]];
const GBASE="https://generativelanguage.googleapis.com/v1beta/";
/* kunlik jonli AI javoblar chegarasi (pulni tejash) */
let aiUse=LS.get("aiUse",{day:"",n:0});
function aiLeft(){const d=new Date().toDateString();if(aiUse.day!==d)aiUse={day:d,n:0};const mx=+settings.aiMax;return mx===0||aiUse.n<mx}
function aiCount(){aiLeft();aiUse.n++;LS.set("aiUse",aiUse)}
function aiReady(){return !!AI.key&&AI.on==1&&aiLeft()&&Date.now()>AI.cooldownUntil&&navigator.onLine!==false}
class AiErr extends Error{constructor(m,status){super(m);this.status=status}}
async function gpost(path,body,ms=25000){
  const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),ms);
  try{const r=await fetch(GBASE+path,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":AI.key},body:JSON.stringify(body),signal:ctl.signal});
    const j=await r.json().catch(()=>({}));
    if(!r.ok){const msg=(j.error&&j.error.message)||("HTTP "+r.status);if(r.status===429&&!/tts/.test(String(body.model||path)))AI.cooldownUntil=Date.now()+60000;throw new AiErr(msg,r.status)}
    return j}finally{clearTimeout(t)}}
const fatal=e=>e&&(e.status===429||e.status===401||e.status===403);
function collect(j,type){const out=[];(function walk(o){if(!o||typeof o!=="object")return;if(Array.isArray(o)){o.forEach(walk);return}
  if(type==="text"&&typeof o.text==="string"&&(o.type==="text"||!o.type))out.push(o.text);
  if(type==="audio"&&((o.type==="audio"&&o.data)||(o.inlineData&&o.inlineData.data)||(o.inline_data&&o.inline_data.data)))out.push(o.inlineData||o.inline_data||o);
  for(const k in o)if(k!=="input")walk(o[k])})(j);return out}
function jsonFrom(t){const m=t&&t.match(/\{[\s\S]*\}/);if(!m)return null;try{return JSON.parse(m[0])}catch(e){return null}}
const UNDERSTAND_SCHEMA={type:"object",properties:{heard:{type:"string"},match:{type:["string","null"]},intent:{type:"string",enum:["answer","refusal","question","chat","unclear","silence"]},reply:{type:"string"}},required:["heard","match","intent","reply"]};
async function aiText(prompt,wavB64){
  let lastErr;
  for(const m of AI.textModels){
    try{const input=[{type:"text",text:prompt}];if(wavB64)input.push({type:"audio",data:wavB64,mime_type:"audio/wav"});
      const j=await gpost("interactions",{model:m,input,response_format:{type:"text",mime_type:"application/json",schema:UNDERSTAND_SCHEMA}});
      const o=jsonFrom(j.output_text||collect(j,"text").join("\n"));if(o)return o;
    }catch(e){lastErr=e;if(fatal(e))throw e}
    try{const parts=[{text:prompt}];if(wavB64)parts.push({inline_data:{mime_type:"audio/wav",data:wavB64}});
      const j=await gpost(`models/${m}:generateContent`,{contents:[{role:"user",parts}],generationConfig:{responseMimeType:"application/json"}});
      const o=jsonFrom(collect(j,"text").join("\n"));if(o)return o;
    }catch(e){lastErr=e;if(fatal(e))throw e}
  }
  throw lastErr||new AiErr("javob yo'q")}
function pcmToWav(bytes,rate=24000){const b=new ArrayBuffer(44+bytes.length),v=new DataView(b);const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
  w(0,"RIFF");v.setUint32(4,36+bytes.length,true);w(8,"WAVEfmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,"data");v.setUint32(40,bytes.length,true);new Uint8Array(b,44).set(bytes);return new Blob([b],{type:"audio/wav"})}
const b64bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const asWav=bytes=>String.fromCharCode(...bytes.slice(0,4))==="RIFF"?new Blob([bytes],{type:"audio/wav"}):pcmToWav(bytes);
const TTS_STYLE="Yosh, mehribon va quvnoq qiz-o'qituvchi ovozida, sof o'zbek tilida, sekin va aniq, 5 yoshli bolaga gapirgandek";
const ttsCool={};/* har bir model uchun alohida limit */
async function ttsOne(m,text,style,voice){
  try{const j=await gpost("interactions",{model:m,input:[{type:"user_input",content:[{type:"text",text,annotations:[{type:"speech_metadata",style}]}]}],response_format:{type:"audio",mime_type:"audio/wav"},generation_config:{speech_config:[{voice}]}},90000);
    const a=collect(j,"audio").pop();if(a)return asWav(b64bytes(a.data));
  }catch(e){if(fatal(e))throw e}
  const j=await gpost(`models/${m}:generateContent`,{model:m,contents:[{parts:[{text:`${style}:\n${text}`}]}],generationConfig:{responseModalities:["AUDIO"],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:voice}}}}},90000);
  const a=collect(j,"audio").pop();if(a)return asWav(b64bytes(a.data));throw new AiErr("ovoz yo'q")}
async function aiTTS(text,voice,style){
  voice=voice||AI.voice;style=style||TTS_STYLE;let lastErr,limited=0;
  for(const m of AI.ttsModels){
    if(Date.now()<(ttsCool[m]||0)){limited++;continue}
    try{return await ttsOne(m,text,style,voice)}
    catch(e){lastErr=e;
      if(e.status===401||e.status===403)throw e;
      if(e.status===429){limited++;ttsCool[m]=Date.now()+(/day|daily|per_day|PerDay/i.test(e.message)?6*3600e3:65000);continue}}
  }
  if(limited===AI.ttsModels.length){const e=new AiErr("limit",429);e.daily=AI.ttsModels.every(m=>(ttsCool[m]||0)-Date.now()>3600e3);throw e}
  throw lastErr||new AiErr("ovoz yo'q")}

/* bir so'rovda bir nechta gap: qatorlar orasida jimlik, keyin jimlikdan bo'lib olamiz */
const BATCH_STYLE=TTS_STYLE+". Har bir qatorni alohida gap qilib o'qi, qatorlar orasida 2 soniya butunlay jim tur. Qator raqamlari yoki boshqa hech narsa qo'shma";
async function wavPcm(blob){const buf=new Uint8Array(await blob.arrayBuffer());const v=new DataView(buf.buffer);
  if(String.fromCharCode(...buf.slice(0,4))!=="RIFF")return {rate:24000,pcm:new Int16Array(buf.buffer,0,buf.length>>1)};
  let o=12,rate=24000;while(o+8<=buf.length){const id=String.fromCharCode(...buf.slice(o,o+4)),sz=v.getUint32(o+4,true);
    if(id==="fmt ")rate=v.getUint32(o+12,true);if(id==="data"){const len=Math.min(sz,buf.length-o-8)>>1;return {rate,pcm:new Int16Array(buf.buffer.slice(o+8,o+8+len*2))}}o+=8+sz+(sz&1)}
  return null}
function splitPcm(pcm,rate,texts){
  const N=texts.length,fl=Math.round(rate*0.02),F=Math.floor(pcm.length/fl);if(F<N*10)return null;
  const rms=new Float32Array(F);for(let f=0;f<F;f++){let s=0;for(let i=f*fl;i<(f+1)*fl;i++){const x=pcm[i]/32768;s+=x*x}rms[f]=Math.sqrt(s/fl)}
  const sorted=Array.from(rms).sort((a,b)=>a-b);const th=Math.max(0.006,sorted[Math.floor(F*0.95)]*0.07);
  const loud=f=>rms[f]>th;let first=0;while(first<F&&!loud(first))first++;let last=F-1;while(last>=0&&!loud(last))last--;if(last-first<N*10)return null;
  const gaps=[];let st=-1;for(let f=first;f<=last;f++){if(!loud(f)){if(st<0)st=f}else if(st>=0){gaps.push({s:st,e:f,len:f-st});st=-1}}
  if(N===1)return cutRanges([[first,last]]);
  const byLen=gaps.slice().sort((a,b)=>b.len-a.len);if(byLen.length<N-1)return null;
  const chosen=byLen.slice(0,N-1),rest=byLen[N-1];
  const minChosen=chosen[N-2].len;if(minChosen<20)return null;/* <400ms */
  if(rest&&rest.len*1.25>minChosen)return null;/* noaniq: gap ichidagi pauza bilan teng */
  chosen.sort((a,b)=>a.s-b.s);const ranges=[];let a=first;for(const g of chosen){ranges.push([a,g.s-1]);a=g.e}ranges.push([a,last]);
  /* uzunlik va harf soni mos kelishini tekshirish */
  const rat=ranges.map(([x,y],i)=>(y-x+1)/Math.max(4,texts[i].length));const med=rat.slice().sort((p,q)=>p-q)[Math.floor(N/2)];
  if(rat.some(r=>r<med*0.33||r>med*3))return null;
  return cutRanges(ranges);
  function cutRanges(rs){const pad=Math.round(rate*0.12);return rs.map(([x,y])=>{const s=Math.max(0,x*fl-pad),e=Math.min(pcm.length,(y+1)*fl+pad);
    return pcmToWav(new Uint8Array(pcm.slice(s,e).buffer),rate)})}
}
async function aiTTSBatch(texts,voice){
  if(texts.length===1)return [await aiTTS(texts[0],voice)];
  const blob=await aiTTS(texts.join("\n"),voice,BATCH_STYLE);const w=await wavPcm(blob);if(!w)return null;
  return splitPcm(w.pcm,w.rate,texts)}

/* ---- ovozni o'zimiz yozib olamiz (AI tinglashi uchun) ---- */
let actx=null,micStream=null,capHandler=null,aiOnly=false,stopCap=null;
async function ensureMic(){
  if(micStream&&micStream.active)return true;
  try{micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}})}catch(e){return false}
  actx=actx||new (window.AudioContext||window.webkitAudioContext)();if(actx.state==="suspended")await actx.resume().catch(()=>{});
  const src=actx.createMediaStreamSource(micStream);const proc=actx.createScriptProcessor(4096,1,1);src.connect(proc);proc.connect(actx.destination);
  proc.onaudioprocess=e=>{if(capHandler)capHandler(e.inputBuffer.getChannelData(0))};
  micStream.getAudioTracks().forEach(t=>t.onended=()=>{micStream=null});
  return true}
function capture(){
  return new Promise(res=>{
    if(!micStream||!actx)return res(null);
    const rate=actx.sampleRate,frameMs=4096/rate*1000;let pre=[],buf=[],started=false,silent=0,total=0,speech=0,floor=0.006;
    const done=v=>{capHandler=null;stopCap=null;res(v)};
    stopCap=()=>done(null);
    capHandler=data=>{
      const f=new Float32Array(data);let s=0;for(let i=0;i<f.length;i++)s+=f[i]*f[i];const rms=Math.sqrt(s/f.length);total+=frameMs;
      const th=Math.max(0.018,floor*3);
      if(!started){floor=floor*0.95+rms*0.05;pre.push(f);if(pre.length>3)pre.shift();
        if(rms>th){started=true;buf=pre.slice();buf.push(f);speech=frameMs}else if(total>11000)done(null);return}
      buf.push(f);if(rms>th){silent=0;speech+=frameMs}else silent+=frameMs;
      if((silent>=900&&speech>=250)||buf.length*frameMs>9000)done(speech>=250?encodeWav(buf,rate):null)};
  })}
function encodeWav(chunks,rate){const len=chunks.reduce((a,c)=>a+c.length,0);const all=new Float32Array(len);let o=0;for(const c of chunks){all.set(c,o);o+=c.length}
  const ratio=rate/16000,n=Math.floor(len/ratio),pcm=new Int16Array(n);for(let i=0;i<n;i++){const x=Math.max(-1,Math.min(1,all[Math.floor(i*ratio)]));pcm[i]=x<0?x*0x8000:x*0x7FFF}
  return pcmToWav(new Uint8Array(pcm.buffer),16000)}
function blobB64(b){return new Promise(r=>{const f=new FileReader();f.onload=()=>r(String(f.result).split(",")[1]);f.readAsDataURL(b)})}

/* bitta javobni eshitish: iPad tanishi (tez) + AI uchun yozuv */
function hearOnce(forms){
  return new Promise(async res=>{
    const useCap=aiReady()&&await ensureMic();
    const useSR=canListen()&&!aiOnly;
    let srText=null,wav=null,srDone=!useSR,capDone=!useCap,matched=null;
    const fin=()=>{if(srDone&&capDone)res({srText,wav,matched})};
    if(!useSR&&!useCap)return res({srText:null,wav:null,matched:null});
    if(useCap)capture().then(b=>{wav=b;capDone=true;fin()});
    if(useSR)listen(t=>{srText=t;srDone=true;if(t){const k=matchAnswer(t,forms);if(k){matched=k;if(stopCap)stopCap()}}fin()});
  })}
async function aiUnderstand(q,wav,srText){
  const c=q.context;
  const prompt=`Sen 5 yoshli bolaga dars o'tayotgan mehribon, hazilkash o'qituvchi Fotima opasan. Bola o'zbek tilida gapiradi, ba'zan ruscha yoki inglizcha so'z aytadi. U biroz erka va uyatchan.
Dars: ${c.topic}. Hozirgi savol: ${c.question}
Ekrandagi variantlar (kalit: so'zlar): ${q.opts.map(o=>`${o.key}: ${[o.n,o.L,o.uz,o.ru,o.en].filter(x=>x!=null).join(" / ")}`).join("; ")}
To'g'ri javob: ${q.it.key} (${[q.it.uz,q.it.ru,q.it.en].join(" / ")})
iPad eshitgan matn (xato bo'lishi mumkin): "${srText||""}"
Ilova qilingan audio — bolaning ovozi. Diqqat bilan tingla.
JSON qaytar:
- heard: bola aytgan gap (o'zbek lotin yozuvida).
- match: bola variantlardan birini (istalgan tilda yoki raqam bilan) aytgan bo'lsa, o'sha variant kaliti; aks holda null. To'g'ri-noto'g'riligidan qat'i nazar, aytganini yoz.
- intent: answer | refusal (xohlamayapti, zerikdi, charchadi) | question (biror narsa so'rayapti) | chat (boshqa gap) | unclear | silence.
- reply: match null bo'lsa, bolaga 1–2 ta juda qisqa gap: sof o'zbek tilida, lotin yozuvida, mehribon va quvnoq. Savol bo'lsa, oddiy qilib javob ber. Xohlamasa, erkalab, o'yin qilib qiziqtir. Oxirida darsga qaytar. Emoji, rus yoki ingliz so'zi ishlatma. Bolaga "polvonim", "qo'zichog'im" de. Qo'rqinchli yoki kattalar mavzusini muloyimlik bilan darsga bur. match bor bo'lsa, reply bo'sh.`;
  return aiText(prompt,wav?await blobB64(wav):null)}
async function sayAI(text){
  const my=session;bubble.textContent=text;
  try{const blob=await aiTTS(text);if(my!==session)return false;stopAll();const tok=playToken;talking(true);bubble.textContent=text;await playBlob(blob,tok);talking(false);return tok===playToken}
  catch(e){if(my!==session)return false;stopAll();const tok=playToken;talking(true);await ttsSay(text,voiceFor("uz")?"uz-UZ":"tr-TR",tok);talking(false);return tok===playToken}}

/* ---- AI ovozini oldindan tayyorlash (fon rejimida) ---- */
const GEN={running:false,stopReason:"",done:0};
async function runGen(onTick){
  if(GEN.running||!AI.key)return;GEN.running=true;GEN.stopReason="";
  try{
    let fails=0,size=10;
    while(GEN.running){
      const todo=PHRASE_IDS.filter(id=>!(clips[id]&&(clipSrc[id]==="rec"||clipSrc[id]==="ai:"+AI.voice)));
      if(!todo.length){GEN.stopReason="done";break}
      const batch=todo.slice(0,size),texts=batch.map(id=>clean(PHRASES[id].text));
      try{const blobs=await aiTTSBatch(texts);
        if(!blobs){size=Math.max(1,Math.floor(size/2));continue}/* bo'lib bo'lmadi: kichikroq guruh */
        for(let i=0;i<batch.length;i++)await putClip(batch[i],blobs[i],"ai:"+AI.voice);
        fails=0;GEN.done+=batch.length;onTick&&onTick();if(size<10)size++}
      catch(e){
        if(e.status===401||e.status===403||(e.status===400&&/key/i.test(e.message))){GEN.stopReason="key";break}
        if(e.status===429){if(e.daily){GEN.stopReason="limit";break}GEN.stopReason="wait";onTick&&onTick();await sleep(20000);GEN.stopReason="";continue}
        fails++;if(fails>=5){GEN.stopReason="error:"+e.message;break}size=Math.max(1,Math.floor(size/2));await sleep(3000)}
      await sleep(1500);
    }
  }finally{GEN.running=false;onTick&&onTick()}
}
