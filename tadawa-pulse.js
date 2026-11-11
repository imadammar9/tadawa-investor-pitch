/* Tadawa pulse (heartbeat) for the deck template.
   Load after the template's script:  <script src="tadawa-pulse.js"></script>
   The template fires `slide:enter` / `slide:leave` on each <section class="slide">.

   Geometry comes from the pulse in the Tadawa logo: baseline, the "A" peak with its
   short crossbar, a dip below the line, back to baseline.

   Attributes on <div class="hb">:
     data-peak  0..1  where the peak sits across the element's width
     data-s           scale (1 = 126px peak height, 15px stroke)
     data-tone        white | dark | teal | faint | darkfaint
     data-loop        add to keep the trace looping on light slides (default: once)
     style="top:Ypx"  baseline position on the 1920x1080 stage (left/right/width optional)

   Every content slide with a footer logo (.foot img) automatically gets a small,
   faint pulse that runs into the logo, the way the line runs through the wordmark. */
(function(){
  var NS='http://www.w3.org/2000/svg';
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TONES={
    white:{base:'rgba(255,255,255,.38)',dash:'rgba(255,255,255,.38)',trace:'#ffffff'},
    dark:{base:'rgba(14,128,152,.62)',dash:'rgba(255,255,255,.55)',trace:'#7fbfcd'},
    teal:{base:'#0e8098',dash:'#231f20',trace:'#7fbfcd'},
    faint:{base:'rgba(14,128,152,.16)',dash:'rgba(14,128,152,.16)',trace:'rgba(14,128,152,.7)'},
    darkfaint:{base:'rgba(127,191,205,.16)',dash:'rgba(127,191,205,.16)',trace:'rgba(127,191,205,.75)'}
  };
  var slides=[].slice.call(document.querySelectorAll('#stage .slide'));

  /* footer pulse: small (s .3) and low (baseline 1016) so it never meets content,
     which ends at y 920 (the template keeps the bottom 160px for the footer) */
  /* The footer pulse runs BETWEEN the logo and the page number with a clear gap on
     both sides, never under the logo (feedback: the pulse must not touch the logo).
     Works for LTR and RTL by measuring where the logo and page number sit. */
  var GAP=48;
  slides.forEach(function(sl){
    var logo=sl.querySelector('.foot img');
    if(!logo||sl.querySelector('.hb[data-footer]')) return;
    var foot=logo.closest('.foot'), pg=foot.querySelector('.pg');
    var fl=foot.offsetLeft, fw=foot.offsetWidth||1664;
    /* logo width from its height and the logo's 2.05:1 ratio (the SVG may not be loaded yet) */
    var lh=parseFloat(getComputedStyle(logo).height)||54, lw=logo.offsetWidth||Math.round(lh*2.05);
    var rtl=getComputedStyle(foot).direction==='rtl';
    var pgW=pg?(pg.offsetWidth||60):0, start, end;
    if(!rtl){ start=fl+lw+GAP; end=fl+fw-pgW-GAP; }
    else    { start=fl+pgW+GAP; end=fl+fw-lw-GAP; }
    if(end-start<200) return;
    var hb=document.createElement('div'); hb.className='hb'; hb.setAttribute('data-footer','');
    hb.dataset.peak=rtl?'.88':'.12'; hb.dataset.s='.3'; hb.dataset.tone=sl.classList.contains('light')?'faint':'darkfaint';
    hb.style.cssText='top:1016px;left:'+start+'px;right:auto;width:'+(end-start)+'px';
    sl.insertBefore(hb,sl.firstChild);
  });

  function build(el){
    var s=+el.dataset.s||1, W=el.offsetWidth||1920, P=(+el.dataset.peak||.5)*W, t=TONES[el.dataset.tone]||TONES.white;
    var up=126*s, dn=44*s, sw=15*s, pad=sw+4, y0=pad+up, H=up+dn+pad*2;
    /* the footer pulse stays inside its box (round caps inset); slide pulses bleed past the edges */
    var ft=el.hasAttribute('data-footer'), x0=ft?sw/2:-30, x1=ft?W-sw/2:W+30;
    var d='M'+x0+' '+y0+' H'+(P-43*s)+' L'+P+' '+(y0-up)+' L'+(P+58*s)+' '+(y0+dn)+' L'+(P+79*s)+' '+y0+' H'+x1;
    var dash='M'+(P-13*s)+' '+(y0-16.6*s)+' H'+(P+6*s);
    var svg=document.createElementNS(NS,'svg');
    svg.setAttribute('width',W); svg.setAttribute('height',H); svg.setAttribute('viewBox','0 0 '+W+' '+H);
    svg.style.top=(-y0)+'px'; svg.setAttribute('aria-hidden','true');
    function p(dd,c,w){var e=document.createElementNS(NS,'path'); e.setAttribute('d',dd); e.setAttribute('stroke',c); e.setAttribute('stroke-width',w); svg.appendChild(e); return e;}
    el._base=p(d,t.base,sw); el._dash=p(dash,t.dash,sw); el._trace=p(d,t.trace,sw);
    el._trace.style.opacity=0;
    el.appendChild(svg);
  }
  document.querySelectorAll('#stage .hb').forEach(build);

  var running=[];
  function draw(el,delay){
    var L=el._base.getTotalLength();
    el._base.style.strokeDasharray=L;
    running.push(el._base.animate([{strokeDashoffset:L},{strokeDashoffset:0}],{duration:1900,delay:delay,easing:'cubic-bezier(.65,0,.35,1)',fill:'backwards'}));
    running.push(el._dash.animate([{opacity:0},{opacity:1}],{duration:400,delay:delay+1045,fill:'backwards'}));
  }
  /* a bright segment travels along the line: once on light slides (looping felt busy
     on white), looping on dark and teal slides */
  function trace(el,delay,once){
    var L=el._base.getTotalLength(), seg=Math.min(260,L*.14), tr=el._trace;
    tr.style.opacity=1; tr.style.strokeDasharray=seg+' '+(L+seg*2);
    running.push(tr.animate([{strokeDashoffset:seg},{strokeDashoffset:-L,offset:.72},{strokeDashoffset:-L}],
      {duration:Math.max(2600,L/0.75),delay:delay,iterations:once?1:Infinity,easing:'linear',fill:once?'both':'backwards'}));
  }
  slides.forEach(function(sl){
    sl.addEventListener('slide:enter',function(){
      if(reduce) return;
      var light=sl.classList.contains('light');
      sl.querySelectorAll('.hb').forEach(function(h,i){
        draw(h,120+i*180);
        trace(h,2200+i*300,light&&!h.hasAttribute('data-loop'));
      });
    });
    sl.addEventListener('slide:leave',function(){
      running.forEach(function(a){try{a.cancel()}catch(e){}}); running=[];
      sl.querySelectorAll('.hb').forEach(function(h){ if(h._trace) h._trace.style.opacity=0; });
    });
  });
  /* the first slide was shown before this script loaded */
  var on=document.querySelector('#stage .slide.on'); if(on) on.dispatchEvent(new CustomEvent('slide:enter'));
})();
