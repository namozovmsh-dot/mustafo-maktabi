"use strict";
/* Mustafo maktabi — darslar mazmuni. Har so'z: uz (o'zbekcha), ru, en, pic (rasm). */

/* ---------- sonlar 1–100 ---------- */
const UZ1=["","bir","ikki","uch","to'rt","besh","olti","yetti","sakkiz","to'qqiz"];
const UZ10=["","o'n","yigirma","o'ttiz","qirq","ellik","oltmish","yetmish","sakson","to'qson"];
const RU1=["","один","два","три","четыре","пять","шесть","семь","восемь","девять","десять","одиннадцать","двенадцать","тринадцать","четырнадцать","пятнадцать","шестнадцать","семнадцать","восемнадцать","девятнадцать"];
const RU10=["","десять","двадцать","тридцать","сорок","пятьдесят","шестьдесят","семьдесят","восемьдесят","девяносто"];
const EN1=["","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
const EN10=["","ten","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
function numUz(n){if(n===100)return"yuz";const t=Math.floor(n/10),u=n%10;return [UZ10[t],UZ1[u]].filter(Boolean).join(" ")}
function numRu(n){if(n===100)return"сто";if(n<20)return RU1[n];const t=Math.floor(n/10),u=n%10;return [RU10[t],RU1[u]].filter(Boolean).join(" ")}
function numEn(n){if(n===100)return"one hundred";if(n<20)return EN1[n];const t=Math.floor(n/10),u=n%10;return u?EN10[t]+"-"+EN1[u]:EN10[t]}
/* o'rganish tartibi: 1–10, 11–20, o'nliklar, keyin qolganlari */
const NUM_ORDER=(()=>{const a=[];for(let i=1;i<=20;i++)a.push(i);for(let t=30;t<=100;t+=10)a.push(t);for(let i=21;i<100;i++)if(i%10)a.push(i);return a})();
const NUMBERS=NUM_ORDER.map(n=>({n,uz:numUz(n),ru:numRu(n),en:numEn(n),key:"n"+n}));
const NUM_BY={};NUMBERS.forEach(x=>NUM_BY[x.n]=x);
const COUNT_PICS=["🍎","🚗","⚽","🐟","🍬","⭐","🐥","🎈","🍌","🧸","🍓","🦆"];

/* ---------- bo'limlar ---------- */
const W=(uz,ru,en,pic)=>({uz,ru,en,pic});
const SECTIONS=[
 {id:"harf",name:"Harflar",icon:"Aa",color:"#E2603F",kind:"letters",
  why:"Harflarni bilsang, kitobni o'zing o'qiysan va hech kimni kutmaysan!",
  items:[["A","ari","пчела","bee","🐝"],["B","baliq","рыба","fish","🐟"],["D","daraxt","дерево","tree","🌳"],["E","echki","коза","goat","🐐"],["F","fil","слон","elephant","🐘"],["G","gul","цветок","flower","🌸"],["H","hilol","месяц","moon","🌙"],["I","it","собака","dog","🐕"],["J","jo'ja","цыплёнок","chick","🐥"],["K","kitob","книга","book","📖"],["L","limon","лимон","lemon","🍋"],["M","mushuk","кошка","cat","🐈"],["N","non","хлеб","bread","🍞"],["O","olma","яблоко","apple","🍎"],["P","poyezd","поезд","train","🚂"],["Q","quyosh","солнце","sun","☀️"],["R","ruchka","ручка","pen","🖊️"],["S","sabzi","морковь","carrot","🥕"],["T","tuxum","яйцо","egg","🥚"],["U","uy","дом","house","🏠"],["V","velosiped","велосипед","bicycle","🚲"],["X","xo'roz","петух","rooster","🐓"],["Y","yulduz","звезда","star","⭐"],["Z","zebra","зебра","zebra","🦓"],["O'","o'rdak","утка","duck","🦆"],["G'","g'oz","гусь","goose","🪿"],["Sh","sher","лев","lion","🦁"],["Ch","chumoli","муравей","ant","🐜"],["Ng","qo'ng'iroq","колокольчик","bell","🔔"]]
   .map(([L,uz,ru,en,pic])=>({L,uz,ru,en,pic,say:L==="Ng"?"Ng. Qo'ng'iroq so'zida bor.":`${L}. ${uz}.`}))},
 {id:"son",name:"Sonlar",icon:"123",color:"#3C8DDB",kind:"numbers",
  why:"Sanashni bilsang, o'yinchoqlaringni sanaysan, do'konda nechta konfet olishni bilasan!",items:NUMBERS},
 {id:"meva",name:"Mevalar",icon:"🍎",color:"#E0457B",kind:"words",
  why:"Mevalarni bilsang, bozorda onangga yordam berasan!",
  items:[W("olma","яблоко","apple","🍎"),W("nok","груша","pear","🍐"),W("banan","банан","banana","🍌"),W("uzum","виноград","grapes","🍇"),W("tarvuz","арбуз","watermelon","🍉"),W("qovun","дыня","melon","🍈"),W("apelsin","апельсин","orange","🍊"),W("limon","лимон","lemon","🍋"),W("qulupnay","клубника","strawberry","🍓"),W("gilos","черешня","cherry","🍒"),W("shaftoli","персик","peach","🍑"),W("ananas","ананас","pineapple","🍍"),W("kivi","киви","kiwi","🥝"),W("mango","манго","mango","🥭"),W("kokos","кокос","coconut","🥥"),W("yashil olma","зелёное яблоко","green apple","🍏"),W("ko'k meva","черника","blueberry","🫐"),W("avokado","авокадо","avocado","🥑"),W("zaytun","оливка","olive","🫒"),W("yong'oq","орех","nut","🌰")]},
 {id:"hayvon",name:"Hayvonlar",icon:"🐻",color:"#2FA36B",kind:"words",
  why:"Hayvonlarni bilsang, hayvonot bog'ida hammasini o'zing tanib olasan!",
  items:[W("mushuk","кошка","cat","🐈"),W("it","собака","dog","🐕"),W("sigir","корова","cow","🐄"),W("ot","лошадь","horse","🐎"),W("qo'y","овца","sheep","🐑"),W("echki","коза","goat","🐐"),W("tovuq","курица","hen","🐔"),W("xo'roz","петух","rooster","🐓"),W("jo'ja","цыплёнок","chick","🐥"),W("o'rdak","утка","duck","🦆"),W("quyon","кролик","rabbit","🐇"),W("eshak","осёл","donkey","🫏"),W("tuya","верблюд","camel","🐫"),W("sher","лев","lion","🦁"),W("yo'lbars","тигр","tiger","🐅"),W("ayiq","медведь","bear","🐻"),W("bo'ri","волк","wolf","🐺"),W("tulki","лиса","fox","🦊"),W("fil","слон","elephant","🐘"),W("maymun","обезьяна","monkey","🐒"),W("zebra","зебра","zebra","🦓"),W("jirafa","жираф","giraffe","🦒"),W("kenguru","кенгуру","kangaroo","🦘"),W("timsoh","крокодил","crocodile","🐊"),W("toshbaqa","черепаха","turtle","🐢"),W("baliq","рыба","fish","🐟"),W("delfin","дельфин","dolphin","🐬"),W("kit","кит","whale","🐋"),W("boyqush","сова","owl","🦉"),W("kapalak","бабочка","butterfly","🦋"),W("sichqon","мышь","mouse","🐭"),W("pingvin","пингвин","penguin","🐧")]},
 {id:"rang",name:"Ranglar",icon:"🎨",color:"#D94C8A",kind:"colors",
  why:"Ranglarni bilsang, chiroyli rasmlar chizasan!",
  items:[["qizil","красный","red","#E53935"],["ko'k","синий","blue","#1E6FD9"],["sariq","жёлтый","yellow","#FDD835"],["yashil","зелёный","green","#2E9D4F"],["oq","белый","white","#FFFFFF"],["qora","чёрный","black","#222222"],["pushti","розовый","pink","#F48FB1"],["to'q sariq","оранжевый","orange","#FB8C00"],["binafsha","фиолетовый","purple","#8E44AD"],["jigarrang","коричневый","brown","#8D5524"],["kulrang","серый","grey","#9E9E9E"]].map(([uz,ru,en,hex])=>({uz,ru,en,hex}))},
 {id:"shakl",name:"Shakllar",icon:"🔷",color:"#5A6BD8",kind:"shapes",
  why:"Shakllarni bilsang, kubiklardan katta qal'a qurasan!",
  items:[["doira","круг","circle","circle","#E53935"],["kvadrat","квадрат","square","square","#1E6FD9"],["uchburchak","треугольник","triangle","triangle","#2E9D4F"],["to'rtburchak","прямоугольник","rectangle","rect","#FB8C00"],["yulduz","звезда","star","star","#F5B800"],["yurak","сердце","heart","heart","#E0457B"],["oval","овал","oval","oval","#8E44AD"],["romb","ромб","diamond","diamond","#00A3A3"]].map(([uz,ru,en,shape,hex])=>({uz,ru,en,shape,hex}))},
 {id:"sabzavot",name:"Sabzavotlar",icon:"🥕",color:"#E07B12",kind:"words",
  why:"Sabzavotlar seni kuchli qiladi. Ularni bilsang, oshxonada yordam berasan!",
  items:[W("sabzi","морковь","carrot","🥕"),W("kartoshka","картошка","potato","🥔"),W("piyoz","лук","onion","🧅"),W("sarimsoq","чеснок","garlic","🧄"),W("pomidor","помидор","tomato","🍅"),W("bodring","огурец","cucumber","🥒"),W("karam","капуста","cabbage","🥬"),W("brokkoli","брокколи","broccoli","🥦"),W("makkajo'xori","кукуруза","corn","🌽"),W("achchiq qalampir","острый перец","chili","🌶️"),W("bulg'or qalampiri","сладкий перец","bell pepper","🫑"),W("baqlajon","баклажан","eggplant","🍆"),W("no'xat","горох","peas","🫛"),W("qo'ziqorin","гриб","mushroom","🍄"),W("oshqovoq","тыква","pumpkin","🎃"),W("zanjabil","имбирь","ginger","🫚")]},
 {id:"tana",name:"Tana a'zolari",icon:"👂",color:"#C2577A",kind:"words",
  why:"Tanangni bilsang, qayering og'risa, onangga aytib bera olasan!",
  items:[W("ko'z","глаз","eye","👁️"),W("quloq","ухо","ear","👂"),W("burun","нос","nose","👃"),W("og'iz","рот","mouth","👄"),W("til","язык","tongue","👅"),W("tish","зуб","tooth","🦷"),W("yuz","лицо","face","🙂"),W("qo'l","рука","hand","✋"),W("barmoq","палец","finger","☝️"),W("oyoq","нога","foot","🦶"),W("miya","мозг","brain","🧠")]},
 {id:"oila",name:"Oila",icon:"👨‍👩‍👦",color:"#B05FD0",kind:"words",
  why:"Oilang — eng yaqin odamlaring. Ularni uch tilda chaqira olasan!",
  items:[W("ota","папа","dad","👨"),W("ona","мама","mom","👩"),W("aka","старший брат","big brother","🧑"),W("opa","старшая сестра","big sister","👱‍♀️"),W("uka","младший брат","little brother","👦"),W("singil","младшая сестра","little sister","👧"),W("buva","дедушка","grandpa","👴"),W("buvi","бабушка","grandma","👵"),W("chaqaloq","малыш","baby","👶")]},
 {id:"transport",name:"Transport",icon:"🚗",color:"#3B7D9E",kind:"words",
  why:"Mashinalarni bilsang, katta bo'lganda haydovchi ham, uchuvchi ham bo'la olasan!",
  items:[W("mashina","машина","car","🚗"),W("avtobus","автобус","bus","🚌"),W("poyezd","поезд","train","🚂"),W("samolyot","самолёт","airplane","✈️"),W("kema","корабль","ship","🚢"),W("qayiq","лодка","boat","⛵"),W("velosiped","велосипед","bicycle","🚲"),W("mototsikl","мотоцикл","motorcycle","🏍️"),W("vertolyot","вертолёт","helicopter","🚁"),W("raketa","ракета","rocket","🚀"),W("yuk mashinasi","грузовик","truck","🚚"),W("tez yordam","скорая помощь","ambulance","🚑"),W("o't o'chirish mashinasi","пожарная машина","fire truck","🚒"),W("traktor","трактор","tractor","🚜")]},
 {id:"kiyim",name:"Kiyimlar",icon:"👕",color:"#7A8C2E",kind:"words",
  why:"Kiyimlarni bilsang, ertalab o'zing kiyinasan!",
  items:[W("futbolka","футболка","T-shirt","👕"),W("ko'ylak","платье","dress","👗"),W("shim","брюки","trousers","👖"),W("shortik","шорты","shorts","🩳"),W("kurtka","куртка","coat","🧥"),W("kepka","кепка","cap","🧢"),W("qo'lqop","перчатки","gloves","🧤"),W("sharf","шарф","scarf","🧣"),W("paypoq","носки","socks","🧦"),W("krossovka","кроссовки","sneakers","👟"),W("etik","сапоги","boots","👢"),W("ko'zoynak","очки","glasses","👓"),W("ryukzak","рюкзак","backpack","🎒")]},
 {id:"vaqt",name:"Vaqt",icon:"⏰",color:"#4C7FBF",kind:"words",
  why:"Vaqtni bilsang, qachon bog'chaga, qachon o'yinga borishni bilasan!",
  items:[W("qish","зима","winter","❄️"),W("bahor","весна","spring","🌷"),W("yoz","лето","summer","🏖️"),W("kuz","осень","autumn","🍂"),W("ertalab","утро","morning","🌅"),W("kunduzi","день","day","🌞"),W("kechqurun","вечер","evening","🌇"),W("kechasi","ночь","night","🌙"),
   ...["dushanba","seshanba","chorshanba","payshanba","juma","shanba","yakshanba"].map((d,i)=>({uz:d,ru:["понедельник","вторник","среда","четверг","пятница","суббота","воскресенье"][i],en:["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][i],badge:String(i+1),badgeNote:"kun"}))]},
 {id:"qarama",name:"Qarama-qarshi",icon:"↔️",color:"#9A6A3A",kind:"words",
  why:"Bu so'zlar bilan hamma narsani aytib bera olasan: katta, kichik, issiq, sovuq!",
  items:[W("katta","большой","big","🐘"),W("kichik","маленький","small","🐭"),W("issiq","горячий","hot","🔥"),W("sovuq","холодный","cold","🧊"),W("baland","высокий","tall","🦒"),W("past","низкий","short","🐢"),W("uzun","длинный","long","🐍"),W("qisqa","короткий","short","🐛"),W("tez","быстрый","fast","🐆"),W("sekin","медленный","slow","🐌"),W("xursand","весёлый","happy","😀"),W("xafa","грустный","sad","😢"),W("ochiq","открытый","open","📖"),W("yopiq","закрытый","closed","📕"),W("kun","день","day","☀️"),W("tun","ночь","night","🌃")]},
 {id:"odob",name:"Odob so'zlari",icon:"🙏",color:"#2E9C8E",kind:"words",
  why:"Odobli bolani hamma yaxshi ko'radi!",
  items:[W("salom","привет","hello","👋"),W("rahmat","спасибо","thank you","🙏"),W("iltimos","пожалуйста","please","🥺"),W("kechirasiz","извините","sorry","😔"),W("xayr","пока","goodbye","🙋"),W("xayrli tong","доброе утро","good morning","🌅"),W("xayrli tun","спокойной ночи","good night","😴"),W("yoqimli ishtaha","приятного аппетита","enjoy your meal","🍽️")]},
 {id:"matem",name:"Matematika",icon:"2+1",color:"#8A5CD6",kind:"math",
  why:"Qo'shishni bilsang, Muhammad va Mustafo bilan konfetni teng bo'lasan!",items:[]},
 {id:"aralash",name:"Aralash",icon:"🎲",color:"#C98A12",kind:"mix",why:"",items:[]}
];
SECTIONS.forEach(s=>{
  s.items.forEach((it,i)=>{it.sec=s.id;it.idx=i;it.key=it.key||(s.id+"_"+i);it.clip="w_"+it.key;
    if(!it.say)it.say=it.uz.charAt(0).toUpperCase()+it.uz.slice(1)+".";});
});
const SEC_BY={};SECTIONS.forEach(s=>SEC_BY[s.id]=s);

/* ---------- o'qituvchining o'zbekcha gaplari (AI ovozida tayyorlanadi yoki ota-ona yozadi) ---------- */
const PHRASES={};
function P(id,grp,text){PHRASES[id]={grp,text}}
P("salom","Umumiy","Assalomu alaykum, Mustafo! Men Fotima opaman. Keling, birga o'ynaymiz va o'rganamiz!");
P("tanla","Umumiy","Bugun nimani o'rganamiz? Rasmni bos!");
P("qara","Umumiy","Mustafo, qara! Bu...");
P("ruschasi","Umumiy","Ruschasi...");
P("inglizchasi","Umumiy","Inglizchasi...");
P("birga","Umumiy","Qani, birga aytamiz!");
P("sanaymiz","Umumiy","Keling, birga sanaymiz!");
P("yangi","Umumiy","Zo'r! Endi yangisini o'rganamiz!");
P("takror","Umumiy","Esingdami? Bir tekshirib ko'ramiz!");
P("til","Umumiy","Uch tilni bilsang, dunyodagi hamma bolalar bilan do'st bo'lasan!");
P("s_son","Savollar","Qani, ayt-chi, bu nechta?");
P("s_harf","Savollar","Qaysi rasm shu harf bilan boshlanadi?");
P("s_nima","Savollar","Bu nima? Ayt-chi!");
P("s_rang","Savollar","Bu qaysi rang?");
P("s_shakl","Savollar","Bu qanday shakl?");
P("s_qayerda","Savollar","...qayerda? Topib bos-chi!");
P("s_yumgin","O'yinlar","Yaxshilab qara va eslab qol! Endi ko'zingni yum!");
P("s_yoqoldi","O'yinlar","Endi qara! Qaysi biri yo'qoldi?");
P("s_tez","O'yinlar","Tez javob o'yini! Beshta savol. Tayyormisan?");
P("tez_ok","O'yinlar","Qoyil! Beshtasini ham topding! Senga katta yulduz!");
P("qoshuv","Matematika","qo'shuv");
P("ayiruv","Matematika","ayiruv");
P("s_qosh","Matematika","Hammasi nechta bo'ldi?");
P("s_ayir","Matematika","Nechta qoldi?");
P("m_q1","Matematika","Muhammadda olmalar bor edi. Sen unga yana berding. Qani, sanaymiz!");
P("m_q2","Matematika","Do'sting Mustafo mashinalarini olib keldi. Muhammad ham olib keldi. Hammasi nechta bo'ldi?");
P("m_a1","Matematika","Muhammadda konfetlar bor edi. U bir nechtasini do'sting Mustafoga berdi. Nechta qoldi?");
P("m_a2","Matematika","Sen sharlar olding. Bir nechtasi uchib ketdi. Nechta qoldi?");
P("t1","Maqtov","Barakalla, polvonim! To'g'ri!");
P("t2","Maqtov","Ofarin, Mustafo! Sen juda aqllisan!");
P("t3","Maqtov","Ha, to'g'ri! Qoyil!");
P("t4","Maqtov","Zo'r! Senga yana bitta yulduzcha!");
P("t5","Maqtov","Voy-bo'y, qanday aqlli bola! To'ppa-to'g'ri!");
P("t6","Maqtov","Muhammad va Mustafo ham sen bilan faxrlanadi!");
P("x1","To'g'rilash","Yaxshi urinding! Lekin aslida bu...");
P("x2","To'g'rilash","Deyarli topding, polvonim! Aslida bu...");
P("x3","To'g'rilash","Voy, rasmcha kulib yubordi! Aslida bu...");
P("x_find","To'g'rilash","Voy, mana u qayerda ekan! Qara!");
P("ozing","To'g'rilash","Endi o'zing qilib ko'r!");
P("e1","Erkalash","Voy, qo'zichog'im charchadimi? Keling, bitta sirli o'yin o'ynaymiz!");
P("e2","Erkalash","Bilasanmi, buni faqat eng aqlli bolalar topa oladi. Sen topasanmi?");
P("e3","Erkalash","Faqat bitta savol, keyin senga katta yulduzcha beraman!");
P("e4","Erkalash","Mustafo, men sen bilan o'ynashni juda yaxshi ko'raman. Yana bittasini qilamizmi?");
P("e5","Erkalash","Muhammad buni bilarmikan? Keling, sen birinchi bo'lib top!");
P("kutish","Erkalash","Mustafo, qayerdasan? Men seni kutyapman!");
P("eshitmadim","Erkalash","Voy, eshitmay qoldim. Yana bir marta ayt-chi!");
P("bosib","Erkalash","Aytishni xohlamasang, rasmni bosib ko'rsat!");
P("tamom","Erkalash","Barakalla! Bu bo'limdagi hamma narsani o'rganding! Endi takrorlaymiz!");
P("dam","Erkalash","Bugun juda yaxshi o'qiding, polvonim! Endi ko'zlaring dam olsin. Ko'rishguncha!");
SECTIONS.forEach(s=>{if(s.kind!=="mix"){P("intro_"+s.id,"Bo'limlar",`Keling, ${s.name.toLowerCase()}ni o'rganamiz!`.replace("matematikani","misollar yechishni").replace("odob so'zlarini","odob so'zlarini").replace("qarama-qarshini","qarama-qarshi so'zlarni").replace("vaqtni","vaqtni"));
  if(s.why)P("why_"+s.id,"Bo'limlar",s.why)}});
SECTIONS.forEach(s=>s.items.forEach(it=>P(it.clip,s.name,it.say)));
const PHRASE_IDS=Object.keys(PHRASES);
