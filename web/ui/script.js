(function () {
  var CFG = {
    "tips": [],
    "tipInterval": 8000,
    "simulate": true,        
    "volume": 0.45,
    "slideInterval": 7000,
    "showPhase": true,
    "handoff": true,
    "countdownLabelDone": "NOW"
  };
  var fill    = document.querySelector('[data-fill]');
  var buffer  = document.querySelector('[data-fill-buffer]');
  var circle  = document.querySelector('[data-circle-fill]');
  var segWrap = document.querySelector('[data-segments]');
  var segs    = segWrap ? Array.prototype.slice.call(segWrap.children) : [];
  var pcts    = document.querySelectorAll('[data-pct]');
  var real    = false;
  var len     = 0;

  if (circle) {
    len = circle.getTotalLength();
    circle.style.strokeDasharray  = len;
    circle.style.strokeDashoffset = len;
  }
  function render(f) {
    f = Math.max(0, Math.min(1, f));
    if (fill)   fill.style.width   = (f * 100) + '%';
    if (buffer) buffer.style.width = Math.min(100, f * 100 * 1.35) + '%';
    if (circle) circle.style.strokeDashoffset = len * (1 - f);
    if (segs.length) {
      var n = Math.round(f * segs.length);
      for (var s = 0; s < segs.length; s++) {
        segs[s].className = s < n ? 'on' : '';
      }
    }
    for (var i = 0; i < pcts.length; i++) {
      pcts[i].textContent = Math.round(f * 100) + '%';
    }
  }
  var phaseEl = document.querySelector('.ls-prog-label');
  var PHASES = {
    startInitFunction:      "STARTING",
    startInitFunctionOrder: "STARTING",
    initFunctionInvoking:   "INITIALIZING",
    initFunctionInvoked:    "INITIALIZING",
    startDataFileEntries:   "LOADING WORLD",
    performMapLoadFunction: "LOADING MAP",
    onDataFileEntry:        "LOADING WORLD",
    endDataFileEntries:     "ALMOST THERE"
  };
  function fadeOut() {
    var root  = document.querySelector('.ls-root');
    if (root) root.className += ' ls-out';
    var media = document.querySelectorAll('video, audio');
    var steps = 9;
    var t = setInterval(function () {
      steps--;
      for (var m = 0; m < media.length; m++) {
        try { media[m].volume = Math.max(0, media[m].volume - 0.12); } catch (e) {}
      }
      if (steps <= 0) clearInterval(t);
    }, 90);
  }
  window.addEventListener('message', function (e) {
    var item = e.data || {};
    if (item.eventName === 'loadProgress' && typeof item.loadFraction === 'number') {
      real = true;
      render(item.loadFraction);
    }
    if (CFG.showPhase && phaseEl && item.eventName && PHASES[item.eventName]) {
      phaseEl.textContent = PHASES[item.eventName];
    }
    if (item.eventName === 'BLFadeOut') {
      fadeOut();
    }
  });

  if (CFG.simulate) {
    var f = 0;
    var timer = setInterval(function () {
      if (real) { clearInterval(timer); return; }
      f += Math.random() * 0.025 + 0.003;
      if (f >= 0.97) f = 0.97;
      render(f);
    }, 200);
  } else {
    render(0);
  }
  var slides = document.querySelectorAll('[data-slide]');
  if (slides.length > 1) {
    var si = 0;
    slides[0].className += ' on';
    setInterval(function () {
      slides[si].className = slides[si].className.replace(/ ?\bon\b/, '').replace(/ ?\balt\b/, '');
      si = (si + 1) % slides.length;
      slides[si].className += ' on' + (si % 2 ? ' alt' : '');
    }, CFG.slideInterval);
  }
  var clockEl = document.querySelector('[data-clock]');
  if (clockEl) {
    var tickClock = function () {
      var d = new Date();
      clockEl.textContent =
        ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    };
    tickClock();
    setInterval(tickClock, 15000);
  }
  var cdEl = document.querySelector('[data-countdown]');
  if (cdEl) {
    var wrap   = cdEl.closest ? cdEl.closest('[data-countdown-target]') : null;
    var target = new Date(wrap ? wrap.getAttribute('data-countdown-target') : '');
    var tickCd = function () {
      var ms = target.getTime() - Date.now();
      if (!isFinite(ms))  { cdEl.textContent = '—'; return; }
      if (ms <= 0)        { cdEl.textContent = CFG.countdownLabelDone; return; }
      var dd = Math.floor(ms / 86400000);
      var hh = Math.floor(ms / 3600000) % 24;
      var mm = Math.floor(ms / 60000)   % 60;
      var ss = Math.floor(ms / 1000)    % 60;
      cdEl.textContent = dd > 0
        ? (dd + 'd ' + hh + 'h ' + mm + 'm')
        : (('0' + hh).slice(-2) + ':' + ('0' + mm).slice(-2) + ':' + ('0' + ss).slice(-2));
    };
    tickCd();
    setInterval(tickCd, 1000);
  }
  var tipEl = document.querySelector('[data-tip]');
  if (tipEl && CFG.tips.length) {
    var ti = 0;
    tipEl.textContent = CFG.tips[0];
    if (CFG.tips.length > 1) {
      setInterval(function () {
        tipEl.style.opacity = '0';
        setTimeout(function () {
          ti = (ti + 1) % CFG.tips.length;
          tipEl.textContent = CFG.tips[ti];
          tipEl.style.opacity = '1';
        }, 400);
      }, CFG.tipInterval);
    }
  }
  function openExternal(url) {
    if (!url) return;
    if (typeof invokeNative !== 'undefined') {
      try { invokeNative('openUrl', url); return; } catch (e) {}
    }
    window.open(url, '_blank');
  }
  var extlinks = document.querySelectorAll('[data-extlink]');
  for (var li = 0; li < extlinks.length; li++) {
    (function (el) {
      el.addEventListener('click', function (ev) {
        ev.preventDefault();
        openExternal(el.getAttribute('data-extlink'));
      });
    })(extlinks[li]);
  }
  var bgvid  = document.querySelector('video.ls-bg-media');
  var music  = document.getElementById('ls-music');
  var inGame = (typeof invokeNative !== 'undefined');
  if (bgvid) {
    var pvv = bgvid.play();
    if (pvv && pvv.catch) pvv.catch(function () {
      bgvid.muted = true;
      var r = bgvid.play();
      if (r && r.catch) r.catch(function () {});
    });
  }

  var snd = music || bgvid || null;
  if (bgvid && bgvid !== snd) bgvid.muted = true;

  if (snd) {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem('ls_audio') || 'null'); } catch (e) {}
    var vol = (saved && typeof saved.v === 'number') ? saved.v : CFG.volume;

    var persist = function () {
      try {
        localStorage.setItem('ls_audio', JSON.stringify({ v: vol, m: snd.muted ? 1 : 0 }));
      } catch (e) {}
    };

    var playSnd = function () {
      var p = snd.play();
      if (p && p.catch) p.catch(function () {});
    };

    snd.volume = vol;
    snd.muted  = !inGame || (saved ? saved.m === 1 : false);
    playSnd();

    var ac      = document.querySelector('[data-audio]');
    var reflect = function () {
      if (ac) ac.setAttribute('data-muted', snd.muted ? '1' : '0');
    };
    reflect();

    if (ac) {
      var tgl   = ac.querySelector('[data-audio-toggle]');
      var range = ac.querySelector('[data-audio-range]');

      var paint = function () {
        if (range) {
          var pct = Math.round(vol * 100);
          range.value = pct;
          range.style.background =
            'linear-gradient(to right, var(--accent) ' + pct + '%, rgba(255,255,255,.22) ' + pct + '%)';
        }
      };
      paint();

      if (tgl) tgl.addEventListener('click', function () {
        snd.muted = !snd.muted;
        reflect();
        if (!snd.muted) { snd.volume = vol; playSnd(); }
        persist();
      });

      if (range) range.addEventListener('input', function () {
        vol = Math.max(0, Math.min(1, (Number(range.value) || 0) / 100));
        snd.volume = vol;
        if (snd.muted) { snd.muted = false; reflect(); }
        playSnd();
        paint();
        persist();
      });
    }
  }
})();
