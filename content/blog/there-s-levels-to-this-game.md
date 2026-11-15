---
title: "There's levels to this game."
date: 2026-11-15
summary: "LLM from scratch without all the stuff that came after like reasoning, MOE, and RL instruction fine-tuning and safety alignment."
tags: ["LLM from Scratch","Attention","Tokenization","Token Embeddings","Positional Embeddings"]
---

![Bare bones LLM from scratch](/images/blog/there-s-levels-to-this-game/llm-building-stages.svg)

The Image shown is a basic example of how things go when you want to build and train an LLM from Scratch.

Data Preprocessing plays a major role in how the LLM behaves after training (obviously).

Narrowed scope.
Bare bones architecture on which one call do all the magic to form Claude code level intelligence from here.

Let me go through the Stage 1, step 1 : 

***Data Preprocessing*** :

Tokenization

Tokens to Token Embeddings ( Vector Embeddings ) 

Addition of Positional Embeddings to Token Embeddings 

**Tokenization**

Why ? 

Dumb LLM doesn't understand words. It needs numbers. 
So we convert the words into numbers. Technically.

A neural network trained to convert words(more specifically subwords) into tokens is required. So OpenAI made BPE Tokenizer ( Byte Pair Encoding ). How does this work, 
here's an rough idea.

Considering 4 words in a corpus that repeated x times as mentioned below.

<iframe title="BPE walkthrough" loading="lazy" style="width:100%;height:760px;border:0;display:block" srcdoc="<!DOCTYPE html>
<html lang=&quot;en&quot;><head><meta charset=&quot;utf-8&quot;><meta name=&quot;viewport&quot; content=&quot;width=device-width,initial-scale=1&quot;></head>
<body style=&quot;margin:0;background:transparent;font-family:system-ui,-apple-system,sans-serif&quot;>
<style>
.bpe{--bd:rgba(128,128,128,.4);--card:rgba(128,128,128,.12);--mut:color-mix(in srgb,currentColor 62%,transparent);--dim:color-mix(in srgb,currentColor 40%,transparent);--ac:#3b82f6;--acbg:rgba(59,130,246,.16);color:inherit;max-width:680px;margin:0 auto;font-size:16px;line-height:1.5;box-sizing:border-box}
.bpe *{box-sizing:border-box}
.bpe button{font:inherit;font-size:14px;color:inherit;background:transparent;border:1px solid var(--bd);border-radius:6px;padding:6px 12px;cursor:pointer}
.bpe button:hover{background:var(--card)}
.bpe button:focus-visible{outline:2px solid var(--ac);outline-offset:2px}
.bpe-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 12px}
.bpe-mut{color:var(--mut);font-size:13px}
.bpe-bar .bpe-mut{margin-left:auto}
.bpe-hd{font-weight:600;min-height:26px;margin:0 0 12px}
.bpe-hd small{font-weight:400;color:var(--mut);font-size:13px}
.bpe-words{display:flex;flex-direction:column;gap:8px;margin:0 0 20px}
.bpe-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.bpe-lab{width:84px;font-size:13px;color:var(--mut)}
.bpe-chips{display:flex;gap:4px;flex-wrap:wrap}
.bpe-chip,.bpe-tok{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.bpe-chip{font-size:13px;padding:3px 8px;border-radius:4px;border:1px solid var(--bd);background:var(--card)}
.bpe-chip.new{border-color:var(--ac);background:var(--acbg)}
.bpe-cap{margin:0 0 8px}
.bpe-vocab{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:8px;margin:0 0 20px}
.bpe-card{border:1px solid var(--bd);border-radius:8px;padding:8px 10px}
.bpe-card.hit{border-color:var(--ac)}
.bpe-top{display:flex;justify-content:space-between;align-items:baseline}
.bpe-tok{font-size:14px}
.bpe-card.zero .bpe-tok{text-decoration:line-through}
.bpe-card.zero .bpe-tok,.bpe-card.zero .bpe-n{color:var(--dim)}
.bpe-n{font-weight:600}
.bpe-delta{font-size:12px;color:var(--mut);min-height:18px}
.bpe-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.bpe-stat{background:var(--card);border-radius:8px;padding:12px 14px}
.bpe-stat b{display:block;font-size:24px;font-weight:600;line-height:1.3}
</style>
<div class=&quot;bpe&quot; id=&quot;bpe-demo&quot;>
  <div class=&quot;bpe-bar&quot;>
    <button type=&quot;button&quot; data-bk>Back</button>
    <button type=&quot;button&quot; data-nx>Next merge</button>
    <button type=&quot;button&quot; data-rs>Reset</button>
    <span class=&quot;bpe-mut&quot; data-st></span>
  </div>
  <div class=&quot;bpe-hd&quot; data-hd aria-live=&quot;polite&quot;></div>
  <div class=&quot;bpe-words&quot; data-wd></div>
  <p class=&quot;bpe-mut bpe-cap&quot;>Token counts across the corpus</p>
  <div class=&quot;bpe-vocab&quot; data-vb></div>
  <div class=&quot;bpe-stats&quot;>
    <div class=&quot;bpe-stat&quot;><span class=&quot;bpe-mut&quot;>Tokens in use</span><b data-m1></b></div>
    <div class=&quot;bpe-stat&quot;><span class=&quot;bpe-mut&quot;>Tokens to write the whole corpus</span><b data-m2></b></div>
  </div>
</div>
<script>
(function () {
  var root = document.getElementById(&quot;bpe-demo&quot;);
  var q = function (s) { return root.querySelector(s); };
  var WORDS = [[&quot;old&quot;, 7], [&quot;older&quot;, 3], [&quot;finest&quot;, 9], [&quot;lowest&quot;, 4]];
  var MERGES = [[&quot;e&quot;, &quot;s&quot;], [&quot;es&quot;, &quot;t&quot;], [&quot;est&quot;, &quot;</w>&quot;], [&quot;o&quot;, &quot;l&quot;], [&quot;ol&quot;, &quot;d&quot;]];
  var esc = function (s) { return s.replace(/</g, &quot;&amp;lt;&quot;).replace(/>/g, &quot;&amp;gt;&quot;); };
  var count = function (c) {
    var m = {};
    c.forEach(function (x) { x.t.forEach(function (t) { m[t] = (m[t] || 0) + x.f; }); });
    return m;
  };
  var cur = WORDS.map(function (p) { return { w: p[0], f: p[1], t: p[0].split(&quot;&quot;).concat(&quot;</w>&quot;) }; });
  var order = [&quot;o&quot;, &quot;l&quot;, &quot;d&quot;, &quot;e&quot;, &quot;r&quot;, &quot;f&quot;, &quot;i&quot;, &quot;n&quot;, &quot;s&quot;, &quot;t&quot;, &quot;w&quot;, &quot;</w>&quot;];
  var S = [{ c: cur, m: count(cur), fresh: null }];
  MERGES.forEach(function (mg) {
    var a = mg[0], b = mg[1], pc = 0;
    cur = cur.map(function (x) {
      var t = [];
      for (var i = 0; i < x.t.length; i++) {
        if (x.t[i] === a &amp;&amp; x.t[i + 1] === b) { t.push(a + b); i++; pc += x.f; }
        else t.push(x.t[i]);
      }
      return { w: x.w, f: x.f, t: t };
    });
    order.push(a + b);
    S.push({ c: cur, m: count(cur), fresh: a + b, mg: mg, pc: pc });
  });
  var k = 0;
  function draw() {
    var s = S[k], p = k ? S[k - 1].m : null, n = 12 + k;
    q(&quot;[data-st]&quot;).textContent = &quot;Step &quot; + k + &quot; of &quot; + MERGES.length;
    q(&quot;[data-hd]&quot;).innerHTML = k
      ? &quot;Merge &quot; + k + &quot;: <span class=\&quot;bpe-tok\&quot;>&quot; + esc(s.mg[0]) + &quot; + &quot; + esc(s.mg[1]) + &quot; \u2192 &quot; + esc(s.fresh) + &quot;</span> <small>(pair seen &quot; + s.pc + &quot; times)</small>&quot;
      : &quot;Start: every word is split into characters plus an end-of-word marker&quot;;
    q(&quot;[data-wd]&quot;).innerHTML = s.c.map(function (x) {
      return &quot;<div class=\&quot;bpe-row\&quot;><span class=\&quot;bpe-lab\&quot;>&quot; + x.w + &quot; \u00d7&quot; + x.f + &quot;</span><span class=\&quot;bpe-chips\&quot;>&quot; +
        x.t.map(function (t) { return &quot;<span class=\&quot;bpe-chip&quot; + (t === s.fresh ? &quot; new&quot; : &quot;&quot;) + &quot;\&quot;>&quot; + esc(t) + &quot;</span>&quot;; }).join(&quot;&quot;) +
        &quot;</span></div>&quot;;
    }).join(&quot;&quot;);
    q(&quot;[data-vb]&quot;).innerHTML = order.slice(0, n).map(function (t) {
      var c = s.m[t] || 0, pv = p ? (p[t] || 0) : 0, isNew = t === s.fresh, ch = p &amp;&amp; !isNew &amp;&amp; c !== pv;
      var d = isNew ? &quot;new: &quot; + c : ch ? pv + &quot; \u2212 &quot; + (pv - c) + &quot; = &quot; + c : &quot;&quot;;
      return &quot;<div class=\&quot;bpe-card&quot; + (isNew || ch ? &quot; hit&quot; : &quot;&quot;) + (c ? &quot;&quot; : &quot; zero&quot;) + &quot;\&quot;><div class=\&quot;bpe-top\&quot;><span class=\&quot;bpe-tok\&quot;>&quot; +
        esc(t) + &quot;</span><span class=\&quot;bpe-n\&quot;>&quot; + c + &quot;</span></div><div class=\&quot;bpe-delta\&quot;>&quot; + d + &quot;</div></div>&quot;;
    }).join(&quot;&quot;);
    q(&quot;[data-m1]&quot;).textContent = order.slice(0, n).filter(function (t) { return s.m[t] > 0; }).length;
    q(&quot;[data-m2]&quot;).textContent = s.c.reduce(function (a, x) { return a + x.f * x.t.length; }, 0);
  }
  q(&quot;[data-nx]&quot;).addEventListener(&quot;click&quot;, function () { if (k < MERGES.length) { k++; draw(); } });
  q(&quot;[data-bk]&quot;).addEventListener(&quot;click&quot;, function () { if (k > 0) { k--; draw(); } });
  q(&quot;[data-rs]&quot;).addEventListener(&quot;click&quot;, function () { k = 0; draw(); });
  draw();
})();
</script>
<script>
(function(){
  try{document.body.style.color=getComputedStyle(parent.document.body).color}catch(e){}
  function fit(){try{frameElement.style.height=document.documentElement.scrollHeight+&quot;px&quot;}catch(e){}}
  if(window.ResizeObserver){new ResizeObserver(fit).observe(document.body)}
  window.addEventListener(&quot;load&quot;,fit);
})();
</script>
</body></html>"></iframe>  
So BPE helps this way.

**Tokens to Token Embedding Bridge**

Why ? 

Tokens by themselves have no similarity or meaning when compared with other tokens.

Lets say there is a word "King" -> token id : 38, another "Man" -> token id : 143

There is no relation between the two words in any sense.  So if those two are converted into embeddings, their similarity will surface based on dimensions of the embedding.

<iframe title="Token embedding walkthrough" loading="lazy" style="width:100%;height:760px;border:0;display:block" srcdoc="<!DOCTYPE html>
<html lang=&quot;en&quot;><head><meta charset=&quot;utf-8&quot;><meta name=&quot;viewport&quot; content=&quot;width=device-width,initial-scale=1&quot;></head>
<body style=&quot;margin:0;background:transparent;font-family:system-ui,-apple-system,sans-serif&quot;>
<style>
.emb{--bd:rgba(128,128,128,.4);--card:rgba(128,128,128,.12);--mut:color-mix(in srgb,currentColor 62%,transparent);--ac:#3b82f6;--acbg:rgba(59,130,246,.16);color:inherit;max-width:680px;margin:0 auto;font-size:16px;line-height:1.5;box-sizing:border-box}
.emb *{box-sizing:border-box}
.emb button,.emb select{font:inherit;font-size:14px;color:inherit;background:transparent;border:1px solid var(--bd);border-radius:6px;padding:6px 12px}
.emb button{cursor:pointer}
.emb button:hover{background:var(--card)}
.emb button:focus-visible,.emb select:focus-visible{outline:2px solid var(--ac);outline-offset:2px}
.emb select option{color:#111;background:#fff}
.emb [hidden]{display:none!important}
.emb-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}
.emb-tabs button[aria-pressed=true]{border-color:var(--ac);background:var(--acbg)}
.emb-lead{margin:0 0 14px;min-height:48px}
.emb-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 12px}
.emb-mut{color:var(--mut);font-size:13px}
.emb-row{display:grid;grid-template-columns:52px 1fr 44px 96px;gap:10px;align-items:center;padding:4px 8px;border-radius:6px;border:1px solid transparent}
.emb-row.sel{border-color:var(--ac);background:var(--acbg)}
.emb-w,.emb-id,.emb-t td,.emb-trace{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.emb-w,.emb-id{font-size:13px}
.emb-track{height:8px;background:var(--card);border-radius:4px;overflow:hidden}
.emb-track i{display:block;height:100%;background:var(--mut)}
.emb-tag{font-size:12px;color:var(--mut)}
.emb-v{margin:12px 0 0}
.emb-t{width:100%;border-collapse:collapse;font-size:14px}
.emb-t th{text-align:left;font-weight:600;color:var(--mut);font-size:13px;padding:6px 8px;border-bottom:1px solid var(--bd)}
.emb-t td{padding:6px 8px;border-bottom:1px solid var(--bd)}
.emb-t .n{text-align:right}
.emb-t tr.sel td{background:var(--acbg)}
.emb-trace{margin:12px 0 0;padding:10px 12px;background:var(--card);border-radius:8px;font-size:14px;overflow-x:auto}
.emb-svg{width:100%;height:auto;display:block;border:1px solid var(--bd);border-radius:8px}
.emb-svg text{font-family:inherit}
.emb-leg{display:flex;gap:14px;flex-wrap:wrap;margin:8px 0 12px;font-size:13px;color:var(--mut)}
.emb-leg i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px}
.emb-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0 0 10px}
.emb-stat{background:var(--card);border-radius:8px;padding:12px 14px}
.emb-stat b{display:block;font-size:24px;font-weight:600;line-height:1.3}
</style>
<div class=&quot;emb&quot; id=&quot;emb-demo&quot;>
<div class=&quot;emb-tabs&quot;><button type=&quot;button&quot; data-tab=&quot;0&quot;>1. IDs</button><button type=&quot;button&quot; data-tab=&quot;1&quot;>2. Lookup</button><button type=&quot;button&quot; data-tab=&quot;2&quot;>3. Training</button></div>
<p class=&quot;emb-lead&quot; data-lead></p>
<section data-p=&quot;0&quot;>
<div class=&quot;emb-bar&quot;><label class=&quot;emb-mut&quot;>Pick a word <select data-s0></select></label></div>
<div data-b0></div>
<p class=&quot;emb-v&quot; data-v0></p>
</section>
<section data-p=&quot;1&quot;>
<div class=&quot;emb-bar&quot;><label class=&quot;emb-mut&quot;>Look up <select data-s1></select></label></div>
<table class=&quot;emb-t&quot;><thead><tr><th>Token</th><th class=&quot;n&quot;>ID</th><th class=&quot;n&quot;>x</th><th class=&quot;n&quot;>y</th></tr></thead><tbody data-b1></tbody></table>
<div class=&quot;emb-trace&quot; data-v1></div>
</section>
<section data-p=&quot;2&quot;>
<div class=&quot;emb-bar&quot;><button type=&quot;button&quot; data-t1>Train 1 step</button><button type=&quot;button&quot; data-t10>Train 10 steps</button><button type=&quot;button&quot; data-rr>Re-randomize</button><span class=&quot;emb-mut&quot; data-n></span></div>
<svg class=&quot;emb-svg&quot; viewBox=&quot;0 0 400 260&quot; data-svg role=&quot;img&quot; aria-label=&quot;Two-dimensional map of six word embeddings&quot;></svg>
<div class=&quot;emb-leg&quot;><span><i style=&quot;background:#3b82f6&quot;></i>royalty</span><span><i style=&quot;background:#e0752c&quot;></i>animals</span><span><i style=&quot;background:#22a06b&quot;></i>fruit</span></div>
<div class=&quot;emb-bar&quot;><label class=&quot;emb-mut&quot;>Nearest to <select data-s2></select></label><span data-v2></span></div>
<div class=&quot;emb-stats&quot;>
<div class=&quot;emb-stat&quot;><span class=&quot;emb-mut&quot;>Avg distance within a group</span><b data-w></b></div>
<div class=&quot;emb-stat&quot;><span class=&quot;emb-mut&quot;>Avg distance across groups</span><b data-a></b></div>
</div>
<p class=&quot;emb-mut&quot; style=&quot;margin:0&quot;>Real models use hundreds of numbers per token. This toy uses 2 so we can draw it.</p>
</section>
<div class=&quot;emb-bar&quot; style=&quot;margin:14px 0 0&quot;><button type=&quot;button&quot; data-nx></button></div>
</div>
<script>
(function(){
var root=document.getElementById(&quot;emb-demo&quot;);
var q=function(s){return root.querySelector(s)};
var W=[
{w:&quot;king&quot;,id:311,g:0,t:[-.65,.55]},
{w:&quot;cat&quot;,id:1204,g:1,t:[.6,.45]},
{w:&quot;apple&quot;,id:1207,g:2,t:[-.1,-.65]},
{w:&quot;pear&quot;,id:4100,g:2,t:[.05,-.75]},
{w:&quot;dog&quot;,id:5561,g:1,t:[.72,.3]},
{w:&quot;queen&quot;,id:8900,g:0,t:[-.5,.7]}];
var GC=[&quot;#3b82f6&quot;,&quot;#e0752c&quot;,&quot;#22a06b&quot;];
var LEAD=[&quot;A tokenizer turns every word into an ID. The ID is only a label: the word's position in the vocabulary.&quot;,&quot;A bare number can't carry meaning, so each ID points to a row in a table of numbers. That row is the token's embedding.&quot;,&quot;Training nudges those rows so words used in similar ways end up near each other. This is a simulation of that effect.&quot;];
var NEXT=[&quot;Next: the lookup table&quot;,&quot;Next: training&quot;,&quot;&quot;];
var sel=[&quot;cat&quot;,&quot;dog&quot;,&quot;cat&quot;],E,steps=0,tab=0,run=0;
function rnd(){return Math.random()*1.8-.9}
function reset(){E=W.map(function(){return [rnd(),rnd()]});steps=0}
function f2(n){var s=n.toFixed(2);return s===&quot;-0.00&quot;?&quot;0.00&quot;:s}
function get(w){return W.filter(function(o){return o.w===w})[0]}
function dist(a,b){return Math.sqrt(Math.pow(a[0]-b[0],2)+Math.pow(a[1]-b[1],2))}
function opts(i){var s=q(&quot;[data-s&quot;+i+&quot;]&quot;);s.innerHTML=W.map(function(o){return '<option value=&quot;'+o.w+'&quot;>'+o.w+'</option>'}).join(&quot;&quot;);s.value=sel[i]}
function p0(){
var me=get(sel[0]),near=null,gap=1e9,mate=null;
W.forEach(function(o){if(o===me)return;var d=Math.abs(o.id-me.id);if(d<gap){gap=d;near=o}if(o.g===me.g)mate=o});
var mg=Math.abs(mate.id-me.id);
q(&quot;[data-b0]&quot;).innerHTML=W.map(function(o){var tag=o===me?&quot;&quot;:o===near?&quot;closest ID&quot;:o===mate?&quot;same meaning&quot;:&quot;&quot;;
return '<div class=&quot;emb-row'+(o===me?' sel':'')+'&quot;><span class=&quot;emb-w&quot;>'+o.w+'</span><span class=&quot;emb-track&quot;><i style=&quot;width:'+(o.id/90)+'%&quot;></i></span><span class=&quot;emb-id&quot;>'+o.id+'</span><span class=&quot;emb-tag&quot;>'+tag+'</span></div>'}).join(&quot;&quot;);
q(&quot;[data-v0]&quot;).innerHTML='By ID, the closest word to <b>'+me.w+'</b> is <b>'+near.w+'</b> (gap '+gap.toLocaleString(&quot;en-US&quot;)+'). By meaning it should be <b>'+mate.w+'</b> (gap '+mg.toLocaleString(&quot;en-US&quot;)+'). The gap between IDs says nothing about meaning.';
}
function p1(){
var me=get(sel[1]);
q(&quot;[data-b1]&quot;).innerHTML=W.map(function(o,i){var e=E[i];return '<tr'+(o===me?' class=&quot;sel&quot;':'')+'><td>'+o.w+'</td><td class=&quot;n&quot;>'+o.id+'</td><td class=&quot;n&quot;>'+f2(e[0])+'</td><td class=&quot;n&quot;>'+f2(e[1])+'</td></tr>'}).join(&quot;&quot;)+'<tr><td colspan=&quot;4&quot; class=&quot;emb-mut&quot;>\u2026 one row for every other ID in the vocabulary</td></tr>';
var e=E[W.indexOf(me)];
q(&quot;[data-v1]&quot;).textContent='&quot;'+me.w+'&quot; \u2192 ID '+me.id+' \u2192 row '+me.id+' \u2192 ('+f2(e[0])+', '+f2(e[1])+')';
}
function px(e){return [200+e[0]*170,130-e[1]*105]}
function p2(){
var mi=W.indexOf(get(sel[2])),bi=-1,bd=1e9,w=0,wn=0,a=0,an=0,i,j,k,d;
for(i=0;i<W.length;i++)for(j=i+1;j<W.length;j++){d=dist(E[i],E[j]);if(W[i].g===W[j].g){w+=d;wn++}else{a+=d;an++}}
for(k=0;k<W.length;k++){if(k===mi)continue;d=dist(E[mi],E[k]);if(d<bd){bd=d;bi=k}}
var pa=px(E[mi]),pb=px(E[bi]);
var s='<line x1=&quot;200&quot; y1=&quot;10&quot; x2=&quot;200&quot; y2=&quot;250&quot; stroke=&quot;rgba(128,128,128,.3)&quot;/><line x1=&quot;15&quot; y1=&quot;130&quot; x2=&quot;385&quot; y2=&quot;130&quot; stroke=&quot;rgba(128,128,128,.3)&quot;/>';
s+='<line x1=&quot;'+pa[0]+'&quot; y1=&quot;'+pa[1]+'&quot; x2=&quot;'+pb[0]+'&quot; y2=&quot;'+pb[1]+'&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;1.5&quot; stroke-dasharray=&quot;4 4&quot;/>';
W.forEach(function(o,n){var p=px(E[n]);
s+='<circle cx=&quot;'+p[0]+'&quot; cy=&quot;'+p[1]+'&quot; r=&quot;7&quot; fill=&quot;'+GC[o.g]+'&quot;'+(n===mi?' stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot;':'')+'/><text x=&quot;'+(p[0]+11)+'&quot; y=&quot;'+(p[1]+4)+'&quot; font-size=&quot;12&quot; fill=&quot;currentColor&quot;>'+o.w+'</text>'});
q(&quot;[data-svg]&quot;).innerHTML=s;
q(&quot;[data-w]&quot;).textContent=f2(w/wn);
q(&quot;[data-a]&quot;).textContent=f2(a/an);
q(&quot;[data-n]&quot;).textContent=&quot;Training steps: &quot;+steps;
q(&quot;[data-v2]&quot;).textContent=W[bi].w+&quot; (distance &quot;+f2(bd)+&quot;), &quot;+(W[bi].g===W[mi].g?&quot;same group&quot;:&quot;different group&quot;);
}
function draw(){
q(&quot;[data-lead]&quot;).textContent=LEAD[tab];
[0,1,2].forEach(function(i){q(&quot;[data-p='&quot;+i+&quot;']&quot;).hidden=i!==tab;q(&quot;[data-tab='&quot;+i+&quot;']&quot;).setAttribute(&quot;aria-pressed&quot;,i===tab)});
var nx=q(&quot;[data-nx]&quot;);nx.hidden=tab===2;nx.textContent=NEXT[tab];
if(tab===0)p0();else if(tab===1)p1();else p2();
}
function go(to){
var my=++run,from=E.map(function(e){return e.slice()}),t0=null;
if(window.matchMedia&amp;&amp;matchMedia(&quot;(prefers-reduced-motion: reduce)&quot;).matches){E=to;draw();return}
function f(ts){if(my!==run)return;if(!t0)t0=ts;var p=Math.min(1,(ts-t0)/550),k=1-Math.pow(1-p,3);
E=to.map(function(e,i){return [from[i][0]+(e[0]-from[i][0])*k,from[i][1]+(e[1]-from[i][1])*k]});
draw();if(p<1)requestAnimationFrame(f)}
requestAnimationFrame(f);
}
function train(n){
var to=E.map(function(e){return e.slice()}),i;
for(i=0;i<n;i++)to=to.map(function(e,j){return [e[0]+.25*(W[j].t[0]-e[0])+(Math.random()-.5)*.03,e[1]+.25*(W[j].t[1]-e[1])+(Math.random()-.5)*.03]});
steps+=n;go(to);
}
[0,1,2].forEach(function(i){
q(&quot;[data-tab='&quot;+i+&quot;']&quot;).onclick=function(){tab=i;draw()};
q(&quot;[data-s&quot;+i+&quot;]&quot;).onchange=function(){sel[i]=this.value;draw()};
opts(i);
});
q(&quot;[data-nx]&quot;).onclick=function(){tab=Math.min(2,tab+1);draw()};
q(&quot;[data-t1]&quot;).onclick=function(){train(1)};
q(&quot;[data-t10]&quot;).onclick=function(){train(10)};
q(&quot;[data-rr]&quot;).onclick=function(){run++;reset();draw()};
reset();draw();
})();
</script>
<script>
(function(){
  try{document.body.style.color=getComputedStyle(parent.document.body).color}catch(e){}
  function fit(){try{frameElement.style.height=document.documentElement.scrollHeight+&quot;px&quot;}catch(e){}}
  if(window.ResizeObserver){new ResizeObserver(fit).observe(document.body)}
  window.addEventListener(&quot;load&quot;,fit);
})();
</script>
</body></html>"></iframe>


**Addition of Positional Embeddings to Token Embeddings**

Why ?

Ex : "*The cat sat on the table*" and "*the table sat on the cat*"  have same vector embeddings. So that really makes it crazy for an LLM to understand which sat on which.


<iframe title="Positional embeddings walkthrough" loading="lazy" style="width:100%;height:820px;border:0;display:block" srcdoc="<!DOCTYPE html>
<html lang=&quot;en&quot;><head><meta charset=&quot;utf-8&quot;><meta name=&quot;viewport&quot; content=&quot;width=device-width,initial-scale=1&quot;></head>
<body style=&quot;margin:0;background:transparent;font-family:system-ui,-apple-system,sans-serif&quot;>
<style>
.pe{--bd:rgba(128,128,128,.4);--card:rgba(128,128,128,.12);--mut:color-mix(in srgb,currentColor 62%,transparent);--ac:#3b82f6;--acbg:rgba(59,130,246,.16);color:inherit;max-width:680px;margin:0 auto;font-size:16px;line-height:1.5;box-sizing:border-box}
.pe *{box-sizing:border-box}
.pe button,.pe select{font:inherit;font-size:14px;color:inherit;background:transparent;border:1px solid var(--bd);border-radius:6px;padding:6px 12px}
.pe button{cursor:pointer}
.pe button:hover{background:var(--card)}
.pe button:focus-visible,.pe select:focus-visible,.pe input:focus-visible{outline:2px solid var(--ac);outline-offset:2px}
.pe select option{color:#111;background:#fff}
.pe [hidden]{display:none!important}
.pe-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}
.pe-tabs button[aria-pressed=true]{border-color:var(--ac);background:var(--acbg)}
.pe-lead{margin:0 0 14px;min-height:48px}
.pe-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 12px}
.pe-mut{color:var(--mut);font-size:13px}
.pe-line{display:flex;gap:10px;align-items:flex-start;margin:0 0 10px}
.pe-lab{width:16px;padding-top:6px;font-weight:600}
.pe-chips{display:flex;gap:6px;flex-wrap:wrap;flex:1}
.pe-chip{display:flex;flex-direction:column;gap:1px;border:1px solid var(--bd);border-radius:8px;padding:6px 8px;background:var(--card);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;min-width:84px}
.pe-chip.sel{border-color:var(--ac);background:var(--acbg)}
.pe-chip b{font-size:13px;font-weight:600}
.pe-chip em{font-style:normal;color:var(--mut)}
.pe-chip .m{color:var(--mut)}
.pe-svg{width:100%;height:auto;display:block;border:1px solid var(--bd);border-radius:8px}
.pe-svg text{font-family:inherit}
.pe-leg{display:flex;gap:14px;flex-wrap:wrap;margin:8px 0 12px;font-size:13px;color:var(--mut)}
.pe-leg i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px}
.pe-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0 0 12px}
.pe-stat{background:var(--card);border-radius:8px;padding:12px 14px}
.pe-stat b{display:block;font-size:24px;font-weight:600;line-height:1.3}
.pe-vd{margin:0 0 4px}
</style>
<div class=&quot;pe&quot; id=&quot;pe-demo&quot;>
<div class=&quot;pe-tabs&quot;><button type=&quot;button&quot; data-tab=&quot;0&quot;>1. No positions</button><button type=&quot;button&quot; data-tab=&quot;1&quot;>2. Add positions</button></div>
<p class=&quot;pe-lead&quot; data-lead></p>
<div class=&quot;pe-bar&quot;><label class=&quot;pe-mut&quot;>Sentence B <select data-sb></select></label><button type=&quot;button&quot; data-sh>Shuffle</button><label class=&quot;pe-mut&quot; data-sl>Position strength <input type=&quot;range&quot; min=&quot;0&quot; max=&quot;1.5&quot; step=&quot;0.05&quot; value=&quot;1&quot; data-sr> <span data-sv></span></label></div>
<div data-rows></div>
<div class=&quot;pe-bar&quot; style=&quot;margin-top:14px&quot;><label class=&quot;pe-mut&quot;>Look at the output for <select data-sw></select></label></div>
<svg class=&quot;pe-svg&quot; viewBox=&quot;0 0 400 240&quot; data-svg role=&quot;img&quot; aria-label=&quot;Output vector for one word in sentence A and sentence B&quot;></svg>
<div class=&quot;pe-leg&quot;><span><i style=&quot;background:#3b82f6&quot;></i>output in sentence A</span><span><i style=&quot;background:#e0752c&quot;></i>output in sentence B</span></div>
<div class=&quot;pe-stats&quot;>
<div class=&quot;pe-stat&quot;><span class=&quot;pe-mut&quot; data-dl></span><b data-d></b></div>
<div class=&quot;pe-stat&quot;><span class=&quot;pe-mut&quot;>Average over all words</span><b data-av></b></div>
</div>
<p class=&quot;pe-vd&quot; data-vd></p>
<div class=&quot;pe-bar&quot; style=&quot;margin:12px 0 0&quot;><button type=&quot;button&quot; data-nx>Next: add positions</button></div>
</div>
<script>
(function(){
var root=document.getElementById(&quot;pe-demo&quot;);
var q=function(s){return root.querySelector(s)};
var E={the:[.2,.9],cat:[.9,.4],sat:[-.6,.7],on:[-.8,-.3],table:[.5,-.8]};
var A=&quot;the cat sat on the table&quot;.split(&quot; &quot;);
var PRE=[&quot;the table sat on the cat&quot;,&quot;the cat on the table sat&quot;,&quot;sat on the table the cat&quot;];
var WS=[&quot;cat&quot;,&quot;sat&quot;,&quot;on&quot;,&quot;table&quot;];
var LEAD=[&quot;Attention mixes the vectors of all tokens at once, and nothing in that mixing knows which token came first. Shuffle sentence B and watch the output.&quot;,&quot;Add a position vector to each token's embedding before attention. Now the same word at a different position enters attention as a different vector.&quot;];
var B=PRE[0].split(&quot; &quot;),bsel=&quot;0&quot;,custom=null,word=&quot;cat&quot;,tab=0,str=1;
function f2(n){var s=n.toFixed(2);return s===&quot;-0.00&quot;?&quot;0.00&quot;:s}
function v(a){return &quot;(&quot;+f2(a[0])+&quot;, &quot;+f2(a[1])+&quot;)&quot;}
function dist(a,b){return Math.sqrt(Math.pow(a[0]-b[0],2)+Math.pow(a[1]-b[1],2))}
function X(S,s){return S.map(function(w,i){return [E[w][0]+s*Math.sin(i),E[w][1]+s*Math.cos(i)]})}
function out(S,w,s){
var x=X(S,s),i=S.indexOf(w),sc=x.map(function(u){return (x[i][0]*u[0]+x[i][1]*u[1])/Math.SQRT2}),m=Math.max.apply(null,sc),ex=sc.map(function(u){return Math.exp(u-m)}),z=0,a=0,b=0;
ex.forEach(function(e,j){z+=e;a+=e*x[j][0];b+=e*x[j][1]});
return [a/z,b/z];
}
function chips(S,lab,s){
return '<div class=&quot;pe-line&quot;><span class=&quot;pe-lab&quot;>'+lab+'</span><div class=&quot;pe-chips&quot;>'+S.map(function(w,i){
var e=E[w],p=[s*Math.sin(i),s*Math.cos(i)];
var body=tab===0?'<span>'+v(e)+'</span>':'<span class=&quot;m&quot;>e '+v(e)+'</span><span class=&quot;m&quot;>p '+v(p)+'</span><span>= '+v([e[0]+p[0],e[1]+p[1]])+'</span>';
return '<div class=&quot;pe-chip'+(w===word?' sel':'')+'&quot;><b>'+w+(tab?' <em>#'+i+'</em>':'')+'</b>'+body+'</div>'}).join(&quot;&quot;)+'</div></div>';
}
function px(p){return [200+p[0]*46,120-p[1]*46]}
function optsB(){
var h=PRE.map(function(t,i){return '<option value=&quot;'+i+'&quot;>'+t+'</option>'}).join(&quot;&quot;);
if(custom)h+='<option value=&quot;c&quot;>'+custom.join(&quot; &quot;)+'</option>';
var s=q(&quot;[data-sb]&quot;);s.innerHTML=h;s.value=bsel;
}
function draw(){
var s=tab===0?0:str;
q(&quot;[data-lead]&quot;).textContent=LEAD[tab];
[0,1].forEach(function(i){q(&quot;[data-tab='&quot;+i+&quot;']&quot;).setAttribute(&quot;aria-pressed&quot;,i===tab)});
q(&quot;[data-sl]&quot;).hidden=tab===0;
q(&quot;[data-sv]&quot;).textContent=f2(str);
q(&quot;[data-nx]&quot;).hidden=tab===1;
q(&quot;[data-rows]&quot;).innerHTML=chips(A,&quot;A&quot;,s)+chips(B,&quot;B&quot;,s);
var oa=out(A,word,s),ob=out(B,word,s),d=dist(oa,ob),tot=0;
WS.forEach(function(w){tot+=dist(out(A,w,s),out(B,w,s))});
var avg=tot/WS.length,pa=px(oa),pb=px(ob);
var g='<line x1=&quot;200&quot; y1=&quot;8&quot; x2=&quot;200&quot; y2=&quot;232&quot; stroke=&quot;rgba(128,128,128,.3)&quot;/><line x1=&quot;8&quot; y1=&quot;120&quot; x2=&quot;392&quot; y2=&quot;120&quot; stroke=&quot;rgba(128,128,128,.3)&quot;/>';
g+='<line x1=&quot;'+pa[0]+'&quot; y1=&quot;'+pa[1]+'&quot; x2=&quot;'+pb[0]+'&quot; y2=&quot;'+pb[1]+'&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;1.5&quot; stroke-dasharray=&quot;4 4&quot;/>';
g+='<circle cx=&quot;'+pb[0]+'&quot; cy=&quot;'+pb[1]+'&quot; r=&quot;8&quot; fill=&quot;#e0752c&quot;/><circle cx=&quot;'+pa[0]+'&quot; cy=&quot;'+pa[1]+'&quot; r=&quot;8&quot; fill=&quot;#3b82f6&quot;/>';
g+='<text x=&quot;'+(pa[0]+12)+'&quot; y=&quot;'+(pa[1]-8)+'&quot; font-size=&quot;12&quot; fill=&quot;currentColor&quot;>A</text><text x=&quot;'+(pb[0]+12)+'&quot; y=&quot;'+(pb[1]+16)+'&quot; font-size=&quot;12&quot; fill=&quot;currentColor&quot;>B</text>';
q(&quot;[data-svg]&quot;).innerHTML=g;
q(&quot;[data-dl]&quot;).textContent=&quot;Output difference for &quot;+word;
q(&quot;[data-d]&quot;).textContent=f2(d);
q(&quot;[data-av]&quot;).textContent=f2(avg);
q(&quot;[data-vd]&quot;).textContent=avg<0.005
?(tab===0?&quot;Both sentences hand the model the same six vectors, only in a different order. The output for &quot;+word+&quot; is identical, so the model can't tell who sat on whom.&quot;:&quot;With position strength at 0 we're back to identical outputs.&quot;)
:&quot;The output for &quot;+word+&quot; now depends on where it sits, so the two sentences look different to the model.&quot;;
}
q(&quot;[data-sb]&quot;).onchange=function(){bsel=this.value;B=(bsel===&quot;c&quot;?custom:PRE[+bsel].split(&quot; &quot;)).slice();draw()};
q(&quot;[data-sh]&quot;).onclick=function(){
var c,k=0;
do{c=A.slice();for(var i=c.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=c[i];c[i]=c[j];c[j]=t}k++}while((c.join(&quot; &quot;)===A.join(&quot; &quot;)||c.join(&quot; &quot;)===B.join(&quot; &quot;))&amp;&amp;k<50);
custom=c;bsel=&quot;c&quot;;B=c.slice();optsB();draw();
};
q(&quot;[data-sr]&quot;).oninput=function(){str=+this.value;draw()};
q(&quot;[data-sw]&quot;).innerHTML=WS.map(function(w){return '<option value=&quot;'+w+'&quot;>'+w+'</option>'}).join(&quot;&quot;);
q(&quot;[data-sw]&quot;).onchange=function(){word=this.value;draw()};
[0,1].forEach(function(i){q(&quot;[data-tab='&quot;+i+&quot;']&quot;).onclick=function(){tab=i;draw()}});
q(&quot;[data-nx]&quot;).onclick=function(){tab=1;draw()};
optsB();draw();
})();
</script>
<script>
(function(){
  try{document.body.style.color=getComputedStyle(parent.document.body).color}catch(e){}
  function fit(){try{frameElement.style.height=document.documentElement.scrollHeight+&quot;px&quot;}catch(e){}}
  if(window.ResizeObserver){new ResizeObserver(fit).observe(document.body)}
  window.addEventListener(&quot;load&quot;,fit);
})();
</script>
</body></html>"></iframe>


That's it for today. 

Asking why ? has been really entertaining for me. I feel that I should have asked that earlier.
