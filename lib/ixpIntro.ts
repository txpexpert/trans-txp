// lib/ixpIntro.ts — animation d'ouverture du logo IXP en 3D, partagée par l'accueil actuel et la démo.
// INTRO IXP — animation d'ouverture du logo en 3D (Three.js, chargé à la demande).
// Le logo s'assemble, éclate en I / X / P, se regroupe, puis le calque s'efface et
// le visiteur entre sur la page d'accueil. Bouton « Passer » et touche Échap.
// Jouée une fois par session (sessionStorage 'ixp-intro-seen'), jamais si
// l'utilisateur a demandé de réduire les animations.
// ─────────────────────────────────────────────────────────────────────────────
export const introCss = `
/* ═══════════ INTRO IXP — logo 3D animé à l'ouverture (calque au-dessus du site) ═══════════ */
#ixp-intro{position:fixed;inset:0;z-index:100000;background:radial-gradient(120% 90% at 50% 45%,#24539f 0%,#163d82 50%,#0f2f68 100%),#163d82;transition:opacity .7s ease;color:#f4f7fc}
#ixp-intro.ixp-off{display:none}
#ixp-intro.ixp-out{opacity:0;pointer-events:none}
#ixp-stage{position:absolute;inset:0;width:100%;height:100%;display:block}
#ixp-intro .ixp-cap,#ixp-intro .ixp-word{position:absolute;left:16px;right:16px;text-align:center;font-family:'DM Sans',Arial,Helvetica,sans-serif;font-weight:700;margin:0;opacity:0;transform:translateY(8px);transition:opacity .35s,transform .35s;pointer-events:none}
#ixp-intro .ixp-cap{bottom:18%;font-size:clamp(22px,3.4vw,36px);letter-spacing:.04em}
#ixp-intro .ixp-cap b{color:#e2343a;font-weight:700}
#ixp-intro .ixp-word{bottom:20%;font-size:clamp(20px,2.8vw,30px);letter-spacing:.06em}
#ixp-intro .ixp-word span{color:#e2343a}
#ixp-intro .ixp-on{opacity:1;transform:none}
#ixp-intro .ixp-skip{position:absolute;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 20px);font-family:'DM Sans',Arial,sans-serif;font-size:13px;letter-spacing:.08em;color:#f4f7fc;background:rgba(255,255,255,.08);border:1px solid rgba(244,247,252,.22);padding:9px 16px;border-radius:4px;cursor:pointer}
#ixp-intro .ixp-skip:hover{background:rgba(255,255,255,.16)}
#ixp-intro .ixp-skip:focus-visible{outline:2px solid #f4f7fc;outline-offset:2px}
`;

export const introHTML = `
<!-- ═══════════ INTRO IXP — calque d'ouverture (masqué si déjà vu dans la session) ═══════════ -->
<div id="ixp-intro" role="dialog" aria-label="Animation d'ouverture Import-eXPert">
  <canvas id="ixp-stage" aria-hidden="true"></canvas>
  <p class="ixp-cap" id="ixp-cap" aria-live="polite"></p>
  <p class="ixp-word" id="ixp-word">I<span>mport-e</span>XP<span>ert</span></p>
  <button class="ixp-skip" id="ixp-skip" type="button">Passer →</button>
</div>
<script>(function(){var d=document.getElementById('ixp-intro');if(!d)return;var skip=false;try{skip=window.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}try{if(window.IXP_INTRO_ONCE!==false&&sessionStorage.getItem('ixp-intro-seen')==='1')skip=true}catch(e){}if(skip){d.className='ixp-off'}else{document.documentElement.style.overflow='hidden'}})();</script>
`;

export const introScript = `
/* ═══════════ INTRO IXP — logo 3D : assemblage, éclatement I / X / P, regroupement, entrée sur le site ═══════════ */
(function(){
  var root = document.getElementById('ixp-intro');
  if (!root || root.className === 'ixp-off') return;

  var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  var SEEN_KEY = 'ixp-intro-seen';
  var canvas = document.getElementById('ixp-stage');
  var cap = document.getElementById('ixp-cap');
  var word = document.getElementById('ixp-word');
  var LETTERS = ['I','X','P'];
  var CAPTIONS = ['<b>I</b>mporter','e<b>X</b>pertise','<b>P</b>rocédures'];
  var entered = false, running = false, renderer = null;

  /* Entrée sur le site : le calque s'efface et la page d'accueil apparaît */
  function enter(fast){
    if (entered) return; entered = true;
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch(e){}
    root.classList.add('ixp-out');
    document.documentElement.style.overflow = '';
    setTimeout(function(){
      running = false;
      root.className = 'ixp-off';
      if (renderer) { try { renderer.dispose(); } catch(e){} }
    }, fast ? 350 : 750);
  }
  document.getElementById('ixp-skip').addEventListener('click', function(){ enter(true); });
  window.addEventListener('keydown', function(e){ if (e.key === 'Escape') enter(true); });

  /* Three.js chargé à la demande ; si le chargement échoue, on entre directement */
  var guard = setTimeout(function(){ if (!running) enter(true); }, 6000);
  if (window.THREE) start();
  else {
    var s = document.createElement('script');
    s.src = THREE_URL; s.async = true;
    s.onload = start; s.onerror = function(){ enter(true); };
    document.head.appendChild(s);
  }

  function start(){
    if (entered) return;
    clearTimeout(guard);
    var THREE = window.THREE;
    try { renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true}); }
    catch(e){ enter(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x163d82, 14, 32);
    var camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    scene.add(new THREE.AmbientLight(0xbfd0f0, 0.5));
    var key = new THREE.DirectionalLight(0xffffff, 0.95); key.position.set(4, 6, 8); scene.add(key);
    var fill = new THREE.DirectionalLight(0x9fb8e8, 0.35); fill.position.set(-5, 2, 6); scene.add(fill);
    var rim = new THREE.PointLight(0xe2343a, 1.4, 30); rim.position.set(-6, -3, 4); scene.add(rim);
    var group = new THREE.Group(); scene.add(group);

    /* Contours vectoriels des lettres (hauteur 10) : servent au logo lisse et au découpage en cubes */
    var GAP = 1.6, WIDTHS = [2.2, 9, 7.45];
    var TOTAL_U = WIDTHS[0] + WIDTHS[1] + WIDTHS[2] + GAP*2;
    var K = 6.4/TOTAL_U;
    var offsets = [], ox = -TOTAL_U/2;
    WIDTHS.forEach(function(w){ offsets.push(ox); ox += w + GAP; });

    function letterShape(li){
      var o = offsets[li];
      function X(u){ return (u + o)*K; } function Y(v){ return (v - 5)*K; }
      var sh = new THREE.Shape();
      if (li === 0){
        sh.moveTo(X(0),Y(0)); sh.lineTo(X(2.2),Y(0)); sh.lineTo(X(2.2),Y(10)); sh.lineTo(X(0),Y(10)); sh.lineTo(X(0),Y(0));
      } else if (li === 1){
        var pts = [[0,0],[2.7,0],[4.5,3.1],[6.3,0],[9,0],[5.9,5],[9,10],[6.3,10],[4.5,6.9],[2.7,10],[0,10],[3.1,5]];
        sh.moveTo(X(pts[0][0]),Y(pts[0][1]));
        for (var i=1;i<pts.length;i++) sh.lineTo(X(pts[i][0]),Y(pts[i][1]));
        sh.lineTo(X(0),Y(0));
      } else {
        sh.moveTo(X(0),Y(0)); sh.lineTo(X(2.4),Y(0)); sh.lineTo(X(2.4),Y(3.9)); sh.lineTo(X(4.4),Y(3.9));
        sh.absarc(X(4.4),Y(6.95),3.05*K,-Math.PI/2,Math.PI/2,false);
        sh.lineTo(X(0),Y(10)); sh.lineTo(X(0),Y(0));
        var h = new THREE.Path();
        h.moveTo(X(2.4),Y(5.9)); h.lineTo(X(4.2),Y(5.9));
        h.absarc(X(4.2),Y(6.95),1.05*K,-Math.PI/2,Math.PI/2,false);
        h.lineTo(X(2.4),Y(8.0)); h.lineTo(X(2.4),Y(5.9));
        sh.holes.push(h);
      }
      return sh;
    }

    /* Logo lisse : une extrusion biseautée par lettre */
    var DEPTH = 0.26;
    var solids = LETTERS.map(function(_, li){
      var g = new THREE.ExtrudeGeometry(letterShape(li), {depth:DEPTH, bevelEnabled:true, bevelThickness:.035, bevelSize:.025, bevelSegments:4, curveSegments:40});
      g.translate(0, 0, -DEPTH/2);
      var m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({color:0xffffff, roughness:.28, metalness:.06, transparent:true, opacity:0}));
      m.visible = false; group.add(m);
      return m;
    });

    /* Découpage en cubes à partir des mêmes contours */
    function sample(cell){
      var W = 1000, H = 400, ppw = 130;
      var c = document.createElement('canvas'); c.width = W; c.height = H;
      var g = c.getContext('2d'), out = [];
      LETTERS.forEach(function(_, li){
        g.clearRect(0,0,W,H); g.fillStyle = '#fff'; g.beginPath();
        var sh = letterShape(li);
        [sh.getPoints(48)].concat(sh.holes.map(function(hh){ return hh.getPoints(48); })).forEach(function(pts){
          pts.forEach(function(p, i){ var x = W/2 + p.x*ppw, y = H/2 - p.y*ppw; if (i) g.lineTo(x,y); else g.moveTo(x,y); });
          g.closePath();
        });
        g.fill('evenodd');
        var d = g.getImageData(0,0,W,H).data, step = cell*ppw;
        for (var y=step/2; y<H; y+=step) for (var x=step/2; x<W; x+=step)
          if (d[((y|0)*W+(x|0))*4+3] > 128) out.push({x:(x-W/2)/ppw, y:-(y-H/2)/ppw, letter:li});
      });
      return out;
    }

    var narrow = window.innerWidth < 760;
    var cell = narrow ? 0.13 : 0.085;
    var pts = sample(cell), layers = [-0.5, 0.5], N = pts.length*layers.length;
    var mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshStandardMaterial({color:0xffffff, roughness:.35, metalness:.1}), N);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    group.add(mesh);
    var base = new Float32Array(N*3), letter = new Uint8Array(N), dir = new Float32Array(N*3), rot = new Float32Array(N*3), cloud = new Float32Array(N*3), far = new Float32Array(N*3);
    var centers = [0,0,0], counts = [0,0,0], col = new THREE.Color(), k = 0;
    pts.forEach(function(p){ layers.forEach(function(z){
      base[k*3]=p.x; base[k*3+1]=p.y; base[k*3+2]=z*cell*1.4; letter[k]=p.letter;
      centers[p.letter]+=p.x; counts[p.letter]++;
      var th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1), r=2.5+Math.random()*3.5;
      dir[k*3]=Math.sin(ph)*Math.cos(th)*r; dir[k*3+1]=Math.sin(ph)*Math.sin(th)*r; dir[k*3+2]=Math.cos(ph)*r;
      for (var a=0;a<3;a++) rot[k*3+a]=(Math.random()-.5)*6;
      var cr=7+Math.random()*7, ct=Math.random()*Math.PI*2;
      far[k*3]=Math.cos(ct)*cr; far[k*3+1]=(Math.random()-.5)*10; far[k*3+2]=-6-Math.random()*10;
      var R=9+Math.random()*9, t2=Math.random()*Math.PI*2, p2=Math.acos(2*Math.random()-1);
      cloud[k*3]=Math.sin(p2)*Math.cos(t2)*R; cloud[k*3+1]=Math.sin(p2)*Math.sin(t2)*R*.7; cloud[k*3+2]=Math.cos(p2)*R-4;
      var sh=.88+Math.random()*.12; col.setRGB(sh,sh,Math.min(1,sh+.03)); mesh.setColorAt(k,col);
      k++;
    }); });
    for (var ci=0;ci<3;ci++) centers[ci] /= Math.max(1, counts[ci]);
    var size = cell*.92;

    /* États cibles : nuage, logo, lettre I, X ou P mise en avant */
    function state(name){
      var P = new Float32Array(N*3), S = new Float32Array(N);
      var nar = window.innerWidth < 760, focusS = nar ? 1.5 : 2.0, lift = nar ? 1.6 : 1.1;
      var solid = [null,null,null], fi = LETTERS.indexOf(name);
      if (name === 'logo') for (var li=0; li<3; li++) solid[li] = {x:0, y:lift, s:1};
      if (fi >= 0) solid[fi] = {x:-centers[fi]*focusS, y:lift*.6, s:focusS};
      for (var i=0;i<N;i++){
        var j=i*3, bx=base[j], by=base[j+1], bz=base[j+2];
        if (name === 'cloud'){ P[j]=cloud[j]; P[j+1]=cloud[j+1]; P[j+2]=cloud[j+2]; S[i]=.5; }
        else if (name === 'logo'){ P[j]=bx; P[j+1]=by+lift; P[j+2]=bz; S[i]=1; }
        else if (letter[i] === fi){ P[j]=(bx-centers[fi])*focusS; P[j+1]=by*focusS+lift*.6; P[j+2]=bz*focusS; S[i]=focusS; }
        else { P[j]=far[j]; P[j+1]=far[j+1]; P[j+2]=far[j+2]; S[i]=.5; }
      }
      return {P:P, S:S, solid:solid};
    }

    /* Scénario minuté (secondes). Le dernier temps de pause affiche le nom, puis on entre sur le site. */
    var script = [
      {to:'logo', dur:1.4, hold:.6,  burst:0},
      {to:'I',    dur:.75, hold:.6,  burst:1, cap:0},
      {to:'X',    dur:.75, hold:.6,  burst:1, cap:1},
      {to:'P',    dur:.75, hold:.6,  burst:1, cap:2},
      {to:'logo', dur:.9,  hold:1.1, burst:1, word:true}
    ];
    var frames;
    function prepare(){ frames = [state('cloud')].concat(script.map(function(s){ return state(s.to); })); }
    function ease(t){ return t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; }
    function clamp01(v){ return Math.max(0, Math.min(1, v)); }
    function at(sec){
      var acc = 0;
      for (var i=0;i<script.length;i++){
        var s = script[i];
        if (sec < acc + s.dur){ var raw=(sec-acc)/s.dur; return {a:i, b:i+1, raw:raw, t:ease(raw), burst:s.burst, cap:raw > .55 ? s.cap : undefined}; }
        acc += s.dur;
        if (sec < acc + s.hold) return {a:i+1, b:i+1, raw:1, t:0, burst:0, cap:s.cap, word:s.word};
        acc += s.hold;
      }
      return null;
    }

    var dummy = new THREE.Object3D(), lastCap = null, t0;
    function setCap(c){
      if (c === lastCap) return; lastCap = c;
      if (c === undefined) cap.classList.remove('ixp-on');
      else { cap.innerHTML = CAPTIONS[c]; cap.classList.add('ixp-on'); }
    }

    function loop(now){
      if (!running) return;
      requestAnimationFrame(loop);
      var f = at((now - t0)/1000);
      if (!f){ enter(false); f = {a:script.length, b:script.length, raw:1, t:0, burst:0}; }
      var A = frames[f.a], B = frames[f.b], t = f.t, burst = f.burst*Math.sin(Math.PI*t);

      /* fondu cubes → logo lisse en fin de mouvement */
      var holding = f.a === f.b, useB = holding || f.raw >= .5;
      var cfg = useB ? B.solid : A.solid;
      var alpha = holding ? 1 : (useB ? clamp01((f.raw - .78)/.22) : clamp01(1 - f.raw/.12));
      for (var li=0; li<3; li++){
        var m = solids[li], c = cfg[li];
        if (!c || alpha <= 0){ m.visible = false; continue; }
        m.visible = true; m.material.opacity = alpha;
        m.position.set(c.x, c.y, 0); m.scale.setScalar(c.s);
      }
      for (var i=0;i<N;i++){
        var j=i*3;
        dummy.position.set(
          A.P[j]+(B.P[j]-A.P[j])*t + dir[j]*burst,
          A.P[j+1]+(B.P[j+1]-A.P[j+1])*t + dir[j+1]*burst,
          A.P[j+2]+(B.P[j+2]-A.P[j+2])*t + dir[j+2]*burst);
        dummy.rotation.set(rot[j]*burst, rot[j+1]*burst, rot[j+2]*burst);
        var covered = cfg[letter[i]] ? alpha : 0;
        dummy.scale.setScalar(size*(A.S[i]+(B.S[i]-A.S[i])*t)*(1 - covered));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      setCap(f.cap);
      word.classList.toggle('ixp-on', !!f.word || entered);
      if (f.word) group.rotation.y += (Math.sin(now*.0012)*.08 - group.rotation.y)*.05;
      renderer.render(scene, camera);
    }

    function resize(){
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.position.set(0, 0, window.innerWidth < 760 ? 21 : 15);
      camera.updateProjectionMatrix();
      prepare();
    }
    window.addEventListener('resize', function(){ if (running) resize(); });

    resize();
    running = true;
    t0 = performance.now();
    requestAnimationFrame(loop);
  }
})();
`;
