/* ================= STATE & UTILS ================= */
let LANG=(()=>{
  try{const saved=localStorage.getItem('preferredLanguage');if(saved&&['en','ko','ja'].includes(saved))return saved;}catch(e){}
  const bl=((navigator.languages&&navigator.languages[0])||navigator.language||'en').slice(0,2).toLowerCase();
  return['ko','ja'].includes(bl)?bl:'en';
})();
const $=q=>document.querySelector(q), $$=q=>document.querySelectorAll(q);
const T=()=>I18N[LANG];
const path=(o,p)=>p.split('.').reduce((a,k)=>a&&a[k],o);
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function oneLineSummary(text){
  const s=String(text||'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
  if(!s)return '';
  const m=s.match(/^.{18,170}?(?:[.!?。！？]|다\.)/);
  const first=(m?m[0]:s).trim();
  return first.length>170?first.slice(0,167)+'...':first;
}
function setSummary(id,text){
  const el=document.getElementById(id);
  if(!el)return;
  const s=oneLineSummary(text);
  el.textContent=s;
  const labels={ko:'요약',ja:'要約',en:'Summary'};
  el.dataset.label=(T().summaryLabel)||labels[LANG]||'Summary';
  el.classList.toggle('hide',!s);
}


const tjState={date:null};
const sjState={v:null,hr:-1,view:'saju'};
const tarotState={deck:null,flipped:[false,false,false]};
const zState={sign:-1};
const dailyState={result:null};

/* ================= STATIC DATA ================= */
const STEMS=[
 {h:'甲',r:'Gap',el:'wood',p:0},{h:'乙',r:'Eul',el:'wood',p:1},{h:'丙',r:'Byeong',el:'fire',p:0},{h:'丁',r:'Jeong',el:'fire',p:1},
 {h:'戊',r:'Mu',el:'earth',p:0},{h:'己',r:'Gi',el:'earth',p:1},{h:'庚',r:'Gyeong',el:'metal',p:0},{h:'辛',r:'Sin',el:'metal',p:1},
 {h:'壬',r:'Im',el:'water',p:0},{h:'癸',r:'Gye',el:'water',p:1}];
const BR=[
 {h:'子',el:'water'},{h:'丑',el:'earth'},{h:'寅',el:'wood'},{h:'卯',el:'wood'},{h:'辰',el:'earth'},{h:'巳',el:'fire'},
 {h:'午',el:'fire'},{h:'未',el:'earth'},{h:'申',el:'metal'},{h:'酉',el:'metal'},{h:'戌',el:'earth'},{h:'亥',el:'water'}];
const EL_KR={wood:'木',fire:'火',earth:'土',metal:'金',water:'水'};
const HOURS=['23:00–01:00','01:00–03:00','03:00–05:00','05:00–07:00','07:00–09:00','09:00–11:00','11:00–13:00','13:00–15:00','15:00–17:00','17:00–19:00','19:00–21:00','21:00–23:00'];
const SIGN_SYM=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const SIGN_RANGE=['03.21–04.19','04.20–05.20','05.21–06.20','06.21–07.22','07.23–08.22','08.23–09.22','09.23–10.22','10.23–11.21','11.22–12.21','12.22–01.19','01.20–02.18','02.19–03.20'];
const SIGN_IMG=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'].map(n=>`img/zodiac/zodiac-${n}.webp`);
const Z_HOURS=['07:00–09:00','09:00–11:00','13:00–15:00','15:00–17:00','19:00–21:00','21:00–23:00'];
const ROMAN=['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];

/* ================= LUNAR CONVERSION (KASI-verified, 1919–2030) ================= */
/* Solar→Korean lunar. Verified day-for-day against Korea Astronomy & Space Science Institute data. */
const LUNAR_START=1919, LUNAR_EPOCH=Date.UTC(1919,0,1);
const LUNAR_TBL=[64338,3474,3365,47693,2390,693,38317,1748,3497,23954,3730,52518,1319,2647,45750,2778,1748,28329,1865,63123,2707,1323,51803,2413,2922,39764,2980,2889,23187,2709,62763,1325,2733,46442,3506,3492,32073,3402,72341,2710,1366,51893,2773,1746,36517,3749,3658,27798,2715,62806,1386,2905,46930,1874,1829,38475,2635,70315,685,1387,52073,3497,3474,39717,3365,88653,2646,694,54701,1748,3497,48530,3730,3366,27222,2647,70326,2906,1748,44745,1865,1683,38183,1323,2651,21850,874,64341,2980,2889,47763,2709,1325,27229,2733,79274,1490,3493,48458,3402,2709,38189,1366,2741,21930,1746,52901,3749,3658,44182,3227,1370];
const LUNAR_BASE=[31,415,769,1123,1507,1861,2215,2600,2954,3309,3693,4047,4430,4784,5139,5523,5878,6232,6616,6970,7354,7708,8062,8446,8801,9156,9540,9894,10248,10632,10986,11370,11724,12079,12463,12818,13172,13556,13910,14294,14648,15002,15386,15741,16095,16479,16834,17188,17571,17926,18310,18664,19019,19403,19757,20111,20495,20849,21233,21587,21942,22326,22681,23035,23419,23773,24157,24511,24865,25250,25604,25959,26343,26697,27051,27434,27789,28173,28528,28882,29266,29620,29974,30358,30712,31067,31451,31805,32190,32544,32898,33282,33636,33990,34374,34729,35113,35467,35822,36206,36560,36914,37298,37652,38007,38391,38745,39129,39484,39838,40221,40576];
function lunarMonthsOf(yi){
  const val=LUNAR_TBL[yi], leap=val>>13, flags=val&0x1fff, seq=[];
  for(let m=1;m<=12;m++){seq.push([m,false]); if(leap===m)seq.push([m,true]);}
  return seq.map((mm,i)=>({m:mm[0],leap:mm[1],days:((flags>>i)&1)?30:29}));
}
function toLunar(y,m,d){
  const dayIdx=Math.round((Date.UTC(y,m-1,d)-LUNAR_EPOCH)/86400000);
  if(dayIdx<LUNAR_BASE[0])return null;
  let yi=-1;
  for(let i=0;i<LUNAR_BASE.length;i++){if(LUNAR_BASE[i]<=dayIdx)yi=i;else break;}
  if(yi<0||yi>=LUNAR_TBL.length)return null;
  let rem=dayIdx-LUNAR_BASE[yi];
  for(const mo of lunarMonthsOf(yi)){
    if(rem<mo.days)return {ly:LUNAR_START+yi,lm:mo.m,ld:rem+1,leap:mo.leap};
    rem-=mo.days;
  }
  return null;
}
/* render lunar banner into a target element; returns lunar obj or null */
function showLunar(targetId, solarStr){
  const L=T().lunar, el=$('#'+targetId);
  const [y,m,d]=solarStr.split('-').map(Number);
  const lu=toLunar(y,m,d);
  if(!lu){ el.innerHTML=`<span class="lntxt">${L.out}</span>`; return null; }
  const dateStr=L.fmt(lu.ly,lu.lm,lu.ld,lu.leap);
  el.innerHTML=`<span class="lntxt">${L.intro}<span class="lndate">${dateStr}</span>${lu.leap?`<span class="lnleap">${L.leap}</span>`:''}${L.outro}<span class="lnhelp">${L.help}</span></span>`;
  return lu;
}


/* ================= LANGUAGE ================= */
function applyLang(l){
  LANG=l;
  document.documentElement.lang=l;
  $$('[data-i18n]').forEach(el=>{const v=path(T(),el.dataset.i18n);if(typeof v==='string')el.innerHTML=v;});
  $$('.langs button').forEach(b=>b.classList.toggle('on',b.dataset.lang===l));
  // stats
  $('#stats').innerHTML=T().stats.map(s=>`<div class="stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join('');
  // ticker (decorative, multilingual hanja)
  const tick=['福',T().nav.cta,'運','命','愛','財','壽'].map(()=>'').join('');
  const items=[['福','FORTUNE'],['命','DESTINY'],['運','LUCK'],['愛','LOVE'],['財','WEALTH'],['壽','LONGEVITY']];
  const half=items.map(i=>`<span class="kr">${i[0]}</span><span>${i[1]}</span><span class="s">✦</span>`).join('');
  $('#ticker').innerHTML=half+half;
  // hour select
  const sel=$('#sj-hour'),prev=sel.value||'-1';
  sel.innerHTML=`<option value="-1">${T().saju.unknown}</option>`+HOURS.map((t,i)=>`<option value="${i*2}">${t} · ${BR[i].h} ${T().saju.animals[i]}</option>`).join('');
  sel.value=prev;
  // zodiac grid
  const onIdx=zState.sign;
  $('#zgrid').innerHTML=T().zodiac.names.map((n,i)=>`<button class="zbtn ${i===onIdx?'on':''}" data-i="${i}" aria-label="${n} ${SIGN_RANGE[i]}"><span class="zart"><img src="${SIGN_IMG[i]}" alt="${n}" loading="lazy"><span class="zmeta"><span class="sym">${SIGN_SYM[i]}</span><span class="nm">${n}</span><span class="dt">${SIGN_RANGE[i]}</span></span></span></button>`).join('');
  bindZodiac();
  // re-render live results
  const dailySaved=readDailyStored(l);
  if(dailySaved)renderDaily(dailySaved);
  else{$('#daily-out').classList.add('hide');dailyState.result=null;}
  if(tjState.date)renderTojeong();
  if(sjState.v)renderSaju();
  renderTarot();
  if(zState.sign>=0)renderZodiac();
}
$$('.langs button').forEach(b=>b.addEventListener('click',()=>{try{localStorage.setItem('preferredLanguage',b.dataset.lang);}catch(e){}applyLang(b.dataset.lang);}));

/* ================= TABS ================= */
function openTab(name){
  $$('.tab').forEach(t=>t.classList.toggle('active',t.dataset.t===name));
  $$('.panel').forEach(p=>p.classList.toggle('show',p.id==='p-'+name));
}
$$('.tab').forEach(t=>t.addEventListener('click',()=>openTab(t.dataset.t)));
$$('[data-open]').forEach(c=>c.addEventListener('click',()=>{
  openTab(c.dataset.open);
  document.getElementById('room')?.scrollIntoView({behavior:'smooth'});
}));

/* ================= DAILY FORTUNE ================= */
const DAILY_WORKER_ENDPOINT='/api/daily-fortune';
function localDateKey(d=new Date()){
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function dailyStorageKey(lang=LANG){return `dailyFortuneResult_${lang}`;}
function trackDailyEvent(name,params={}){
  if(typeof window.gtag==='function')window.gtag('event',name,{feature:'daily_fortune',language:LANG,...params});
}
function normalizeDailyFortune(x,lang,date){
  const f=x&&typeof x==='object'?x:{};
  return {
    language:f.language||lang,date:f.date||date,
    headline:f.headline||'',overall:f.overall||'',relationship:f.relationship||'',
    workMoney:f.workMoney||'',condition:f.condition||'',caution:f.caution||'',
    action:f.action||'',keyword:f.keyword||'',moodColor:f.moodColor||'',
    rhythmNumber:Number(f.rhythmNumber)||1,related:f.related||['saju','tojeong','zodiac','tarot']
  };
}
function readDailyStored(lang=LANG,date=localDateKey()){
  try{
    const saved=JSON.parse(localStorage.getItem(dailyStorageKey(lang))||'null');
    if(saved&&saved.date===date&&saved.language===lang&&saved.fortune)return saved.fortune;
  }catch(e){}
  return null;
}
function writeDailyStored(fortune,lang=LANG,date=localDateKey(),source='worker'){
  try{localStorage.setItem(dailyStorageKey(lang),JSON.stringify({date,language:lang,source,fortune}));}catch(e){}
}
function fallbackDailyFortune(lang=LANG,date=localDateKey()){
  const L=I18N[lang].daily,items=L.fallbacks||[];
  const base=items[hash(`${lang}:${date}`)%items.length]||items[0];
  return normalizeDailyFortune(base,lang,date);
}
async function requestDailyFortune(lang=LANG,date=localDateKey()){
  if(location.search.includes('dailyMock=1'))throw new Error('mock mode');
  const res=await fetch(DAILY_WORKER_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language:lang,date,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Seoul'})});
  if(!res.ok)throw new Error(`daily worker ${res.status}`);
  return normalizeDailyFortune(await res.json(),lang,date);
}
function renderDaily(fortune){
  const f=normalizeDailyFortune(fortune,LANG,localDateKey());
  dailyState.result=f;
  $('#daily-headline').textContent=f.headline;
  $('#daily-overall').textContent=f.overall;
  $('#daily-relationship').textContent=f.relationship;
  $('#daily-workMoney').textContent=f.workMoney;
  $('#daily-condition').textContent=f.condition;
  $('#daily-caution').textContent=f.caution;
  $('#daily-action').textContent=f.action;
  $('#daily-keyword').textContent=f.keyword;
  $('#daily-moodColor').textContent=f.moodColor;
  $('#daily-rhythmNumber').textContent=f.rhythmNumber;
  setSummary('daily-summary',f.headline);
  $('#daily-out').classList.remove('hide');
}
async function loadDailyFortune(){
  const lang=LANG,date=localDateKey(),L=T().daily;
  trackDailyEvent('daily_fortune_click');
  const cached=readDailyStored(lang,date);
  if(cached){
    $('#daily-status').textContent=L.statusCached;
    renderDaily(cached);
    trackDailyEvent('daily_fortune_view',{source:'cache'});
    return;
  }
  $('#daily-status').textContent=L.statusLoading;
  try{
    const fortune=await requestDailyFortune(lang,date);
    writeDailyStored(fortune,lang,date,'worker');
    $('#daily-status').textContent=L.statusSaved;
    renderDaily(fortune);
    trackDailyEvent('daily_fortune_view',{source:'worker'});
  }catch(e){
    const fortune=fallbackDailyFortune(lang,date);
    writeDailyStored(fortune,lang,date,'fallback');
    $('#daily-status').textContent=L.statusFallback;
    renderDaily(fortune);
    trackDailyEvent('daily_fortune_view',{source:'fallback'});
  }
}
$('#daily-go').addEventListener('click',loadDailyFortune);

/* ================= TOJEONG ================= */
$('#tj-go').addEventListener('click',()=>{
  const d=getDateValue('tj');
  if(!d){$('#tj-year').focus();return;}
  tjState.date=d;
  renderTojeong();
  $('#tj-out').scrollIntoView({behavior:'smooth',block:'nearest'});
});
function renderTojeong(){
  const L=T().tj;
  const lu=showLunar('tj-lunar',tjState.date);
  const seed = lu ? `L${lu.ly}-${lu.leap?'i':''}${lu.lm}-${lu.ld}` : tjState.date;
  const h=hash(seed+'2026');
  const a=h%8,b=(h>>>3)%6,c=(h>>>6)%3;
  $('#tj-gua').textContent=L.gua(a+1,b+1,c+1);
  $('#tj-verse').innerHTML=`<span>${L.open[a]}</span><span>${L.mid[b]}</span><span>${L.end[c]}</span>`;
  $('#tj-cmh').textContent=L.cmHead;
  if(L.cmA&&L.cmB&&L.cmC){
    const ca=h%L.cmA.length,cb=(h>>>4)%L.cmB.length,cc=(h>>>8)%L.cmC.length;
    const labels=L.cmLabels||['Flow','Advice','Key'];
    setSummary('tj-summary',L.cmA[ca]);
    $('#tj-cm').innerHTML=[L.cmA[ca],L.cmB[cb],L.cmC[cc]].map((txt,i)=>`<div class="tj-cm-part"><b>${labels[i]}</b><p>${txt}</p></div>`).join('');
  }else{
    setSummary('tj-summary',L.cm&&L.cm[a]);
    $('#tj-cm').textContent=L.cm[a];
  }
  const w=55+(h>>>9)%45,l=55+(h>>>13)%45,he=55+(h>>>17)%45;
  $('#tj-seasonh').textContent=L.seasonHead;
  const sk=['s-sp','s-su','s-au','s-wi'],sg=['春','夏','秋','冬'];
  $('#tj-seasons').innerHTML=L.seasons.map((arr,i)=>{
    const pick=arr[(h>>>(3*(i+1)))%arr.length];
    return `<div class="season ${sk[i]}"><div class="sg">${sg[i]}</div><h5>${L.seasonNames[i]}</h5><p>${pick}</p></div>`;
  }).join('');
  $('#tj-out').classList.remove('hide');
  requestAnimationFrame(()=>{
    $('#m-wealth').style.width=w+'%';$('#m-love').style.width=l+'%';$('#m-health').style.width=he+'%';
    $('#t-wealth').textContent=w+'%';$('#t-love').textContent=l+'%';$('#t-health').textContent=he+'%';
  });
}

/* ================= SAJU ================= */
$('#sj-go').addEventListener('click',()=>{
  const v=getDateValue('sj');
  if(!v){$('#sj-year').focus();return;}
  sjState.v=v;sjState.hr=Number($('#sj-hour').value);sjState.view='saju';
  renderSaju();
  $('#sj-out').scrollIntoView({behavior:'smooth',block:'nearest'});
});
function renderSaju(){
  const [y,m,d]=sjState.v.split('-').map(Number),hr=sjState.hr,L=T().saju;
  showLunar('sj-lunar',sjState.v);
  let yy=(m<2||(m===2&&d<4))?y-1:y;
  const ys=((yy-4)%10+10)%10,yb=((yy-4)%12+12)%12;
  let am=(d>=6)?m:m-1;if(am<1)am=12;
  const mb=am%12,fromYin=((mb-2)+12)%12,ms=((ys%5)*2+2+fromYin)%10;
  const days=Math.round((Date.UTC(y,m-1,d)-Date.UTC(2000,0,7))/86400000);
  const di=((days%60)+60)%60,ds=di%10,db=di%12;
  let ps=[{t:0,s:ys,b:yb},{t:1,s:ms,b:mb},{t:2,s:ds,b:db,me:true}];
  if(hr>=0){const hb=Math.floor(((hr+1)%24)/2)%12;ps.push({t:3,s:((ds%5)*2+hb)%10,b:hb});}
  if(L.yearTxt){
    const titleParts=t=>String(t||'').split(/\s*(?:-|\u2013|\u2014)\s*/);
    const titleMain=t=>titleParts(t)[0].trim();
    const titleSub=t=>titleParts(t).slice(1).join(' - ').trim();
    const cards=[
      {view:'master',title:titleMain(L.h1),sub:titleSub(L.h1),S:STEMS[ds]},
      {view:'year',title:titleMain(L.h4),sub:titleSub(L.h4),S:STEMS[ys],B:BR[yb],bi:yb},
      {view:'month',title:titleMain(L.h5),sub:titleSub(L.h5),S:STEMS[ms],B:BR[mb],bi:mb},
      {view:'day',title:titleMain(L.h7||L.h1),sub:titleSub(L.h7||L.h1),S:STEMS[ds],B:BR[db],bi:db},
      {view:'saju',title:titleMain(L.h6),sub:titleSub(L.h6),summary:true}
    ];
    $('#sj-pillars').innerHTML=cards.map(c=>{
      const active=sjState.view===c.view;
      if(c.summary){
        return `<div class="pillar clickable ${active?'on':''}" data-sj-view="${c.view}"><h4>${c.title}</h4><div class="hj el-fire">&#21629;</div><div class="rom">FOUR PILLARS</div><div class="mini">${c.sub}</div></div>`;
      }
      const stem=`<div class="hj el-${c.S.el}">${c.S.h}</div><div class="rom">${c.S.r} &middot; ${L.el[c.S.el]}</div>`;
      const branch=c.B?`<div class="hj el-${c.B.el}">${c.B.h}</div><div class="rom">${L.animals[c.bi]}</div>`:`<div class="mini">${c.sub}</div>`;
      return `<div class="pillar clickable ${active?'on':''}" data-sj-view="${c.view}"><h4>${c.title}</h4>${stem}${branch}</div>`;
    }).join('');
  }else{
    $('#sj-pillars').innerHTML=ps.map(p=>{
      const S=STEMS[p.s],B=BR[p.b];
      return `<div class="pillar ${p.me?'me':''}">${p.me?`<span class="youb">${L.you}</span>`:''}
        <h4>${L.pillars[p.t]}</h4>
        <div class="hj el-${S.el}">${S.h}</div><div class="rom">${S.r} · ${L.el[S.el]}</div>
        <div class="hj el-${B.el}">${B.h}</div><div class="rom">${L.animals[p.b]}</div>
      </div>`;
    }).join('')+(hr<0?`<div class="pillar"><h4>${L.pillars[3]}</h4><div class="hj" style="opacity:.25">?</div><div class="rom">${L.unknownHour}</div><div class="hj" style="opacity:.25">?</div><div class="rom">&mdash;</div></div>`:'');
  }
  // element census
  const cnt={wood:0,fire:0,earth:0,metal:0,water:0};
  ps.forEach(p=>{cnt[STEMS[p.s].el]++;cnt[BR[p.b].el]++;});
  const sorted=Object.entries(cnt).sort((a,b)=>b[1]-a[1]);
  const dom=sorted[0][0],lack=sorted.filter(e=>e[1]===0).map(e=>L.el[e[0]]);
  $('#sj-elcount').innerHTML=Object.entries(cnt).map(([el,n])=>
    `<span class="elchip"><span class="el-${el}" style="font-family:var(--kr);font-weight:600">${EL_KR[el]}</span>${L.el[el]} &times; ${n}</span>`).join('');

  // 1) day pillar + day master
  const me=STEMS[ds];
  if(L.dayTxt){
    $('#sj-dayh').textContent=`${L.h7} - ${me.h} ${me.r} - ${L.pol[me.p]} ${L.el[me.el]}`;
    $('#sj-daytext').textContent=L.dayTxt[ds];
  }
  $('#sj-dm').textContent=`${L.h1} - ${me.h} ${me.r} - ${L.pol[me.p]} ${L.el[me.el]}`;
  $('#sj-dmtext').textContent=L.dmTxt[ds];

  // 2) element balance
  $('#sj-elh').textContent=L.h2;
  $('#sj-text').textContent=L.txt[dom]+(lack.length?L.lack(lack.join(', ')):L.balanced);
  // 3) yin-yang — yang stems (p===0) + yang branches (even index: 子寅辰午申戌)
  const total=ps.length*2;let yang=0;
  ps.forEach(p=>{if(STEMS[p.s].p===0)yang++;if(p.b%2===0)yang++;});
  $('#sj-yyh').textContent=L.yyHead;
  const ratio=yang/total;
  $('#sj-yy').textContent= ratio>=0.62?L.yy.yang(yang,total): ratio<=0.38?L.yy.yin(yang,total): L.yy.bal(yang,total);
  if(L.yearTxt){
    $('#sj-sjh').textContent=L.h6;
    $('#sj-sjtext').textContent=L.sajuTxt[yb];
    $('#sj-yrh').textContent=L.h4;
    $('#sj-yrtext').textContent=L.yearTxt[ys];
    $('#sj-moh').textContent=L.h5;
    $('#sj-motext').textContent=L.monthTxt[ms];
    $('#sj-choice').innerHTML='';
    $('#sj-choice').classList.add('hide');
    const topViews=['master','year','month','day','saju'];
    if(!topViews.includes(sjState.view))sjState.view='saju';
    const showSajuView=view=>{
      if(!topViews.includes(view))view='saju';
      sjState.view=view;
      const map={master:'sj-master',year:'sj-yr',month:'sj-mo',day:'sj-day-read',saju:'sj-sj'};
      const summaryMap={master:L.dmTxt[ds],year:L.yearTxt[ys],month:L.monthTxt[ms],day:L.dayTxt&&L.dayTxt[ds],saju:L.sajuTxt[yb]};
      ['sj-master','sj-yr','sj-mo','sj-day-read','sj-sj','sj-el','sj-yinyang'].forEach(id=>$('#'+id).classList.add('hide'));
      $('#'+map[view]).classList.remove('hide');
      setSummary('sj-summary',summaryMap[view]);
      $$('#sj-pillars .pillar[data-sj-view]').forEach(el=>el.classList.toggle('on',el.dataset.sjView===view));
    };
    $$('#sj-pillars .pillar[data-sj-view]').forEach(el=>el.addEventListener('click',()=>showSajuView(el.dataset.sjView)));
    showSajuView(sjState.view);
  }else{
    ['sj-sj','sj-yr','sj-mo','sj-day-read','sj-choice'].forEach(id=>$('#'+id).classList.add('hide'));
    ['sj-master','sj-el','sj-yinyang'].forEach(id=>$('#'+id).classList.remove('hide'));
  }
  $('#sj-out').classList.remove('hide');
}

/* ================= TAROT ================= */
function dealTarot(){
  const idx=[...Array(22).keys()].sort(()=>Math.random()-.5).slice(0,3);
  tarotState.deck=idx;tarotState.flipped=[false,false,false];
  renderTarot();
}
function cardMeaningHTML(L,ci,visible){
  if(L.tldr){
    const tags=L.tags[ci].join(' ');
    return `<div class="card-meaning${visible?' visible':''}">
      <p class="card-tldr">${L.tldr[ci]}</p>
      <p class="card-tags">${tags}</p>
      <blockquote class="card-mystical">${L.mean[ci]}</blockquote>
    </div>`;
  }
  return `<div class="card-meaning${visible?' visible':''}">${L.mean[ci]}</div>`;
}
function renderTarot(){
  if(!tarotState.deck)return;
  const L=T().tarot;
  $('#tarot-row').innerHTML=tarotState.deck.map((ci,i)=>`
    <div class="tslot"><p class="pos">${L.pos[i]}</p>
      <div class="tcard ${tarotState.flipped[i]?'flip':''}" data-i="${i}" role="button" tabindex="0" aria-label="${L.pos[i]}">
        <div class="tinner">
          <div class="tface tback"><img src="img/tarot-back.webp" alt="" loading="lazy" draggable="false"></div>
          <div class="tface tfront">
            <img class="card-img" src="img/tarot-${String(ci).padStart(2,'0')}.webp" alt="${L.names[ci]}" loading="lazy" draggable="false">
            <div class="card-overlay"><span class="num">${ROMAN[ci]}</span><span class="nm">${L.names[ci]}</span></div>
          </div>
        </div>
      </div>
      ${cardMeaningHTML(L,ci,tarotState.flipped[i])}
    </div>`).join('');
  $$('.tcard').forEach(el=>{
    const flip=()=>{
      tarotState.flipped[el.dataset.i]=true;
      el.classList.add('flip');
      const meaning=el.closest('.tslot').querySelector('.card-meaning');
      if(meaning)requestAnimationFrame(()=>meaning.classList.add('visible'));
      $('#tarot-reading-panel').classList.add('hide');
    };
    el.addEventListener('click',flip);
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip();}});
  });
}
function renderReadingPanel(){
  const L=T().tarot;
  const panel=$('#tarot-reading-panel');
  if(!tarotState.deck){panel.classList.add('hide');return;}
  const posLabels=L.pos;
  const labels=L.detailLabels||{};
  const detail=(key,ci)=>L[key]&&L[key][ci]?`<div class="treading-detail"><b>${labels[key]||key}</b><p>${L[key][ci]}</p></div>`:'';
  const slots=tarotState.deck.map((ci,i)=>{
    const hasTldr=!!L.tldr;
    return `<div class="treading-slot">
      <p class="treading-pos">${posLabels[i]}</p>
      <p class="treading-name">${ROMAN[ci]} ${L.names[ci]}</p>
      ${hasTldr?`<p class="treading-tldr">${L.tldr[ci]}</p>
      <blockquote class="treading-mystical">${L.mean[ci]}</blockquote>
      ${detail('basic',ci)}
      ${detail('loveRead',ci)}
      ${detail('workMoney',ci)}
      <p class="treading-action"><b>${labels.advice||''}</b>${L.action[ci]}</p>
      ${detail('caution',ci)}`
      :`<p class="treading-action">${L.mean[ci]}</p>`}
    </div>`;
  }).join('');
  const title=L.readingTitle||(L.tldr?'세 장의 카드가 말하는 이야기':'Your three-card reading');
  const sub=L.readingSub||(L.tldr?'과거, 현재, 미래의 흐름을 한눈에 정리했습니다.':'Past · Present · Future');
  const label=L.summaryLabel||(T().summaryLabel)||'Summary';
  const summary=L.tldr?`<div class="treading-summary"><b>${label}</b>${L.tldr[tarotState.deck[1]]}</div>`:'';
  const faq=L.faq?`<div class="treading-faq"><h4>${labels.faq||'FAQ'}</h4>${L.faq.map(x=>`<details><summary>${x.q}</summary><p>${x.a}</p></details>`).join('')}</div>`:'';
  const links=L.relatedLinks?`<div class="treading-related"><h4>${labels.links||''}</h4>${L.relatedLinks.map(x=>`<button type="button" data-open="${x.t}">${x.label}</button>`).join('')}</div>`:'';
  panel.innerHTML=`<div class="treading-hd"><h3>${title}</h3><p>${sub}</p>${summary}</div>
    <div class="treading-slots">${slots}</div>
    ${faq}
    ${links}
    <button class="treading-close" id="treading-close">${L.close||'Close'}</button>`;
  panel.classList.remove('hide');
  $('#treading-close').addEventListener('click',()=>panel.classList.add('hide'));
  $$('.treading-related button').forEach(b=>b.addEventListener('click',()=>{
    openTab(b.dataset.open);
    document.getElementById('room').scrollIntoView({behavior:'smooth'});
  }));
  panel.scrollIntoView({behavior:'smooth',block:'nearest'});
}
$('#tarot-again').addEventListener('click',()=>{dealTarot();$('#tarot-reading-panel').classList.add('hide');});
$('#tarot-interpret').addEventListener('click',renderReadingPanel);
dealTarot();

/* ================= ZODIAC ================= */
const today=new Date(),todayKey=today.toISOString().slice(0,10);
function bindZodiac(){
  $$('.zbtn').forEach(b=>b.addEventListener('click',()=>{
    $$('.zbtn').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    zState.sign=Number(b.dataset.i);
    renderZodiac();
    $('#zout').scrollIntoView({behavior:'smooth',block:'nearest'});
  }));
}
function renderZodiac(){
  const i=zState.sign,L=T().zodiac;
  const h=hash(I18N.en.zodiac.names[i]+todayKey);
  $('#z-sym').textContent=SIGN_SYM[i];
  $('#z-name').textContent=L.names[i];
  $('#z-date').textContent=SIGN_RANGE[i]+' · '+today.toLocaleDateString(T().locale,{year:'numeric',month:'long',day:'numeric',weekday:'short'});
  setSummary('z-summary',(L.signGen&&L.signGen[i])||L.gen[h%L.gen.length]);
  const zJoin=(specific,daily)=>specific?`${specific} ${daily}`:daily;
  $('#z-general').textContent=zJoin(L.signGen&&L.signGen[i],L.gen[h%L.gen.length]);
  $('#z-love').textContent=zJoin(L.signLove&&L.signLove[i],L.love[(h>>>4)%L.love.length]);
  $('#z-work').textContent=zJoin(L.signWork&&L.signWork[i],L.work[(h>>>7)%L.work.length]);
  $('#z-whisper').textContent=zJoin(L.signWhisper&&L.signWhisper[i],L.whisper[(h>>>10)%L.whisper.length]);
  $('#z-num').textContent=(h>>>13)%99+1;
  $('#z-col').textContent=L.colors[(h>>>16)%L.colors.length];
  $('#z-hour').textContent=Z_HOURS[(h>>>19)%Z_HOURS.length];
  $('#zout').classList.remove('hide');
}

/* ================= SCROLL REVEAL ================= */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12});
$$('.reveal').forEach(el=>io.observe(el));

/* ================= INIT ================= */
function buildDateSelects(prefix){
  const currYear=new Date().getFullYear();
  const Y=document.getElementById(prefix+'-year');
  const M=document.getElementById(prefix+'-month');
  const D=document.getElementById(prefix+'-day');
  Y.innerHTML='<option value="">Year</option>'+
    Array.from({length:currYear-1919},(_,i)=>currYear-i)
      .map(y=>`<option value="${y}">${y}</option>`).join('');
  M.innerHTML='<option value="">Month</option>'+
    ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      .map((m,i)=>`<option value="${String(i+1).padStart(2,'0')}">${m}</option>`).join('');
  function updateDays(){
    const y=+Y.value||2000,mo=+M.value||1;
    const max=new Date(y,mo,0).getDate();
    const prev=D.value;
    D.innerHTML='<option value="">Day</option>'+
      Array.from({length:max},(_,i)=>i+1)
        .map(d=>`<option value="${String(d).padStart(2,'0')}">${d}</option>`).join('');
    if(prev&&+prev<=max)D.value=prev;
  }
  updateDays();
  Y.addEventListener('change',updateDays);
  M.addEventListener('change',updateDays);
}
function getDateValue(prefix){
  const y=document.getElementById(prefix+'-year').value;
  const m=document.getElementById(prefix+'-month').value;
  const d=document.getElementById(prefix+'-day').value;
  return(y&&m&&d)?`${y}-${m}-${d}`:'';
}
buildDateSelects('tj');
buildDateSelects('sj');

/* ================= ZODIAC FINDER ================= */
function zodiacIdx(m,d){
  const v=m*100+d;
  if(v>=321){
    if(v<420)return 0;if(v<521)return 1;if(v<621)return 2;
    if(v<723)return 3;if(v<823)return 4;if(v<923)return 5;
    if(v<1023)return 6;if(v<1122)return 7;if(v<1222)return 8;
    return 9;
  }
  if(v<120)return 9;if(v<219)return 10;return 11;
}
const zM=document.getElementById('z-month');
const zD=document.getElementById('z-day');
zM.innerHTML='<option value="">Month</option>'+
  ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    .map((m,i)=>`<option value="${i+1}">${m}</option>`).join('');
zD.innerHTML='<option value="">Day</option>'+
  Array.from({length:31},(_,i)=>i+1)
    .map(d=>`<option value="${d}">${d}</option>`).join('');
function onZodiacFinder(){
  const m=+zM.value,d=+zD.value;
  if(!m||!d)return;
  const idx=zodiacIdx(m,d);
  $$('.zbtn').forEach(b=>b.classList.toggle('on',+b.dataset.i===idx));
  zState.sign=idx;
  renderZodiac();
  document.getElementById('zout').scrollIntoView({behavior:'smooth',block:'nearest'});
}
zM.addEventListener('change',onZodiacFinder);
zD.addEventListener('change',onZodiacFinder);

applyLang(LANG);
