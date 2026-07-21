/* =========================================================================
   Outturn — marketing site behavior (vanilla, progressive enhancement)
   The page is fully readable, navigable, and the "aha" comprehensible with
   JS disabled (everything renders in final/resolved state). JS only adds:
   reveals, count-up, the citation expand toggle, the run-console playback,
   nav scroll-state + mobile sheet, and form validation + simulated success.
   ========================================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------------------
     Resolvable citation chips — the "click the evidence" mechanic.
     Reveal the source-row panel that is present-but-hidden in the HTML.
     ---------------------------------------------------------------------- */
  function initCitations() {
    var chips = document.querySelectorAll('.cite-chip');
    Array.prototype.forEach.call(chips, function (chip) {
      var panelId = chip.getAttribute('aria-controls');
      var panel = panelId ? document.getElementById(panelId) : null;
      if (!panel) return;
      // make the panel measurable but start collapsed
      panel.hidden = false;
      panel.style.maxHeight = '0px';
      panel.setAttribute('data-open', 'false');

      chip.addEventListener('click', function () {
        var open = chip.getAttribute('aria-expanded') === 'true';
        chip.setAttribute('aria-expanded', String(!open));
        if (open) {
          panel.style.maxHeight = '0px';
          panel.setAttribute('data-open', 'false');
        } else {
          panel.setAttribute('data-open', 'true');
          panel.style.maxHeight = reduceMotion ? 'none' : (panel.scrollHeight + 16) + 'px';
        }
      });
    });
  }

  /* ----------------------------------------------------------------------
     Count-up — a true reconciliation tick on the headline number(s).
     Elements: .countup with data-to="<integer>".
     ---------------------------------------------------------------------- */
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }

  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-to'));
    if (isNaN(target)) return;
    if (reduceMotion) { el.textContent = fmt(target); return; }
    var dur = 600, start = null;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(target);
    }
    requestAnimationFrame(tick);
  }

  /* ----------------------------------------------------------------------
     Run console — port of the product playSteps(): tick lines green in
     sequence. The lines render visible by default (failsafe); we stage them
     only when JS is present, then play on scroll-in.
     ---------------------------------------------------------------------- */
  function stageConsole(el) {
    if (reduceMotion) return;
    el.classList.add('staged');
  }
  function playConsole(el) {
    var lines = el.querySelectorAll('.step-line');
    if (reduceMotion || !el.classList.contains('staged')) {
      Array.prototype.forEach.call(lines, function (l) { l.classList.add('show'); });
      return;
    }
    var i = 0;
    function next() {
      if (i >= lines.length) return;
      var line = lines[i];
      line.classList.add('run', 'show');
      var prev = lines[i - 1];
      if (prev) prev.classList.remove('run');
      i++;
      setTimeout(function () {
        if (i - 1 >= 0 && lines[i - 1]) { /* keep */ }
        next();
      }, 230);
    }
    // clear the final "run" pulse on the last line shortly after
    next();
    setTimeout(function () {
      Array.prototype.forEach.call(lines, function (l) { l.classList.remove('run'); });
    }, 230 * (lines.length + 1));
  }

  /* ----------------------------------------------------------------------
     One IntersectionObserver drives all scroll reveals + triggers.
     ---------------------------------------------------------------------- */
  function initReveals() {
    var revealEls = document.querySelectorAll('.reveal, .stagger, .ledger-anim, .trace-path, .pull-quote, .hiw-step, [data-runconsole]');

    // stage consoles up-front so first paint shows them, then JS hides for play
    var consoles = document.querySelectorAll('[data-runconsole]');
    Array.prototype.forEach.call(consoles, stageConsole);

    if (!('IntersectionObserver' in window) || reduceMotion) {
      // no observer (or reduced motion): just show everything in final state
      Array.prototype.forEach.call(revealEls, function (el) { el.classList.add('in-view'); });
      Array.prototype.forEach.call(document.querySelectorAll('.countup'), function (el) {
        el.textContent = fmt(parseFloat(el.getAttribute('data-to')) || 0);
      });
      Array.prototype.forEach.call(consoles, function (el) {
        Array.prototype.forEach.call(el.querySelectorAll('.step-line'), function (l) { l.classList.add('show'); });
      });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('in-view');

        // fire count-ups contained within
        Array.prototype.forEach.call(el.querySelectorAll('.countup'), function (c) {
          if (!c.dataset.done) { c.dataset.done = '1'; countUp(c); }
        });
        if (el.classList.contains('countup') && !el.dataset.done) { el.dataset.done = '1'; countUp(el); }

        // play run console
        if (el.hasAttribute('data-runconsole') && !el.dataset.played) {
          el.dataset.played = '1';
          playConsole(el);
        }

        // most elements reveal once; the evidence ledger may re-play on scroll-back
        if (!el.hasAttribute('data-replay')) io.unobserve(el);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

    Array.prototype.forEach.call(revealEls, function (el) { io.observe(el); });

    // also observe standalone countups (e.g. hero) inside reveal containers
    Array.prototype.forEach.call(document.querySelectorAll('.countup'), function (c) { io.observe(c); });
  }

  /* ----------------------------------------------------------------------
     Nav: scroll-state, active-link highlighting, mobile sheet.
     ---------------------------------------------------------------------- */
  function initNav() {
    var nav = document.getElementById('nav');
    var toggle = document.getElementById('navToggle');
    var sheet = document.getElementById('navSheet');

    var onScroll = function () {
      if (window.scrollY > 24) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // mobile sheet toggle
    if (toggle && sheet) {
      var closeSheet = function () {
        sheet.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      };
      toggle.addEventListener('click', function () {
        var open = sheet.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });
      Array.prototype.forEach.call(sheet.querySelectorAll('a'), function (a) {
        a.addEventListener('click', closeSheet);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && sheet.classList.contains('open')) { closeSheet(); toggle.focus(); }
      });
    }

    // active-link highlighting via section observers
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav__links .nav__link'));
    var map = {};
    links.forEach(function (l) {
      var id = l.getAttribute('href').slice(1);
      if (id) map[id] = l;
    });
    if ('IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var l = map[entry.target.id];
          if (!l) return;
          if (entry.isIntersecting) {
            links.forEach(function (x) { x.classList.remove('active'); });
            l.classList.add('active');
          }
        });
      }, { threshold: 0, rootMargin: '-45% 0px -50% 0px' });
      Object.keys(map).forEach(function (id) {
        var sec = document.getElementById(id);
        if (sec) spy.observe(sec);
      });
    }
  }

  /* ----------------------------------------------------------------------
     Book-a-demo form — validation + simulated success.
     NO network call. See the TODO(backend) comment in index.html.
     ---------------------------------------------------------------------- */
  function initForm() {
    var form = document.getElementById('demoForm');
    if (!form) return;
    var submitBtn = document.getElementById('demoSubmit');
    var successPanel = document.getElementById('demoSuccess');
    var honeypot = form.querySelector('input[name="company_url"]');

    var validators = {
      name: function (v) { return v.trim().length >= 2; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
      company: function (v) { return v.trim().length >= 1; },
      role: function (v) { return v.trim().length >= 1; },
      incident: function (v) { return v.trim().length >= 10; }
    };

    function fieldWrap(input) { return input.closest('.field'); }

    function validateField(input) {
      var fn = validators[input.name];
      if (!fn) return true;
      var ok = fn(input.value);
      var wrap = fieldWrap(input);
      if (wrap) wrap.classList.toggle('invalid', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      return ok;
    }

    // validate on blur once touched
    Array.prototype.forEach.call(form.querySelectorAll('input, textarea'), function (input) {
      if (input.name === 'company_url') return;
      input.addEventListener('blur', function () { validateField(input); });
      input.addEventListener('input', function () {
        var wrap = fieldWrap(input);
        if (wrap && wrap.classList.contains('invalid')) validateField(input);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // honeypot: a real user never fills this. Silently no-op.
      if (honeypot && honeypot.value.trim() !== '') return;

      var fields = Array.prototype.slice.call(form.querySelectorAll('input, textarea'))
        .filter(function (i) { return i.name !== 'company_url'; });
      var firstInvalid = null;
      var allOk = true;
      fields.forEach(function (input) {
        var ok = validateField(input);
        if (!ok) { allOk = false; if (!firstInvalid) firstInvalid = input; }
      });

      if (!allOk) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      var data = new FormData(form);
      data.delete('company_url');
      data.append('_subject', 'Pilot request — getoutturn.ai');
      data.append('_cc', 'elif@getoutturn.ai');

      fetch('https://formsubmit.co/ajax/artun@getoutturn.ai', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: data
      }).then(function (res) {
        if (!res.ok) throw new Error('submit failed');
        form.hidden = true;
        if (successPanel) {
          successPanel.hidden = false;
          successPanel.setAttribute('tabindex', '-1');
          successPanel.focus();
        }
      }).catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Request a pilot';
        var err = form.querySelector('.form-card__error');
        if (!err) {
          err = document.createElement('p');
          err.className = 'form-card__error';
          err.setAttribute('role', 'alert');
          err.innerHTML = 'Something went wrong sending this — please email us directly at <a href="mailto:artun@getoutturn.ai">artun@getoutturn.ai</a>.';
          submitBtn.insertAdjacentElement('afterend', err);
        }
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  function init() {
    initCitations();
    initReveals();
    initNav();
    initForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* =========================================================================
   Live scroll demo (#demo) — scrollytelling + a genuinely interactive panel.
   The narration column drives the pinned panel's stage via IntersectionObserver;
   inside the panel: source chips, calculation toggle, option pills that change
   the money (and the measured outcome), approve → route → auto-advance.
   Progressive enhancement: no JS → narration readable, stage one visible.
   ========================================================================= */
(function () {
  'use strict';

  var root = document.getElementById('demo');
  if (!root) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var steps = Array.prototype.slice.call(root.querySelectorAll('.scrolly-step'));
  var stages = Array.prototype.slice.call(root.querySelectorAll('.dstage'));
  var railBtns = Array.prototype.slice.call(root.querySelectorAll('.demo-rail button'));
  var current = 0;
  var riskCounted = false;
  var barsPlayed = false;
  var option = 0;

  function $(id) { return document.getElementById(id); }

  /* ---- the two prepared options: the recommended transfer vs. the slower
     reorder. Switching updates decision, execution, and measured outcome —
     the record tracks whether the *decision* worked, not just the task. ---- */
  var SOURCES = [
    'POS · 09:12 · Dallas NorthPark sold 18 a week over the last 28 days.',
    'Inventory · 09:14 · Dallas on hand: 0 since Thursday · Houston Galleria: 240.',
    'SAP · 09:15 · No open PO for the style — a reorder lands in 2 weeks at best.',
    'Email · 08:46 · Courier runs Houston → Dallas daily · $150 a run.',
    'never_ship_a_stockout@v3 · your rule: flag any style selling over 10 a week that hits zero.'
  ];

  var OPTIONS = [
    {
      rec: 'Move 54 units from Houston — Dallas sells them, Houston won’t.',
      protectedVal: '$45,288',
      deadline: 'Today, 16:00',
      checks: [
        ['Donor store is safe', 'Houston keeps 186 units · 31 weeks of cover at 6 a week.', false],
        ['Cost within policy', 'One $150 courier run · 0.3% of the value protected.', false],
        ['Sources are current', 'All 5 sources refreshed this morning.', false]
      ],
      execH: 'The yes became a transfer draft in your allocation tool.',
      draft: 'Transfer draft TR-0042 created',
      ref: '54 units · Houston → Dallas · in your allocation tool.',
      owner: 'Store ops confirming receipt',
      execStatus: 'Courier booked on today’s run.',
      outcome: '+$2,812',
      caption: 'first-week sales from the transferred units — observed, not a causal claim · on pace to protect $45,288 over the season.',
      bars: [
        ['Arrived in Dallas', '54 / 54', 100],
        ['Sold in week one', '19 · 18/wk pace held', 95],
        ['Houston cover after', '31 weeks · healthy', 70]
      ],
      toast: 'Approved — routed to allocation with the context attached.'
    },
    {
      rec: 'Reorder from the vendor — lands in 2 weeks at best.',
      protectedVal: '$39,960',
      deadline: 'Vendor cutoff · Friday',
      checks: [
        ['Two stockout weeks first', '$5,328 of the risk is already unrecoverable before it lands.', true],
        ['Houston overstock stays', '240 units keep selling 6 a week — 40 weeks of cover.', true],
        ['Sources are current', 'All 5 sources refreshed this morning.', false]
      ],
      execH: 'The yes became a purchase order draft for your buyer.',
      draft: 'Purchase order draft PO-0042 created',
      ref: '54 units · vendor · lands in 2 weeks.',
      owner: 'Buyer confirming with the vendor',
      execStatus: 'Ship date requested · day 14.',
      outcome: '$0 so far',
      caption: 'nothing arrives before day 14 — week one already cost $2,664 in missed sales. The record keeps measuring.',
      bars: [
        ['Arrived in Dallas', '0 / 54', 4],
        ['Missed sales, week one', '$2,664', 50],
        ['Vendor ship date', 'day 14 · confirmed', 100]
      ],
      toast: 'Approved — PO routed to the buyer. The record will grade this call too.'
    }
  ];

  function renderOption() {
    var o = OPTIONS[option];
    $('dRec').textContent = o.rec;
    $('dProtected').textContent = o.protectedVal;
    $('dDeadline').textContent = o.deadline;
    $('dChecks').innerHTML = o.checks.map(function (c) {
      return '<div class="dcheck' + (c[2] ? ' dcheck--warn' : '') + '"><b>' +
        (c[2] ? '⚠ ' : '✓ ') + c[0] + '</b><span>' + c[1] + '</span></div>';
    }).join('');
    $('dExecH').textContent = o.execH;
    $('dDraft').textContent = o.draft;
    $('dRef').textContent = o.ref;
    $('dOwner').textContent = o.owner;
    $('dExecStatus').textContent = o.execStatus;
    $('dOutcome').textContent = o.outcome;
    $('dCaption').textContent = o.caption;
    $('dBars').innerHTML = o.bars.map(function (b) {
      return '<div class="dbar"><span>' + b[0] + '</span><div class="dtrack">' +
        '<div class="dfill" data-w="' + b[2] + '"></div></div><b>' + b[1] + '</b></div>';
    }).join('');
    barsPlayed = false;
    if (current === 4) playBars();
    Array.prototype.forEach.call(root.querySelectorAll('.dpill'), function (p) {
      p.classList.toggle('is-selected', Number(p.getAttribute('data-option')) === option);
    });
  }

  function playBars() {
    if (barsPlayed) return;
    barsPlayed = true;
    var fills = root.querySelectorAll('#dBars .dfill');
    window.setTimeout(function () {
      Array.prototype.forEach.call(fills, function (f) {
        f.style.width = f.getAttribute('data-w') + '%';
      });
    }, reduceMotion ? 0 : 180);
  }

  function countRisk() {
    if (riskCounted) return;
    riskCounted = true;
    var el = $('dRisk');
    if (reduceMotion) { el.textContent = '$45,288'; return; }
    var dur = 650, start = null;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = '$' + Math.round(45288 * eased).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = '$45,288';
    }
    requestAnimationFrame(tick);
  }

  function setStage(n) {
    if (n === current && stages[n].classList.contains('is-active')) return;
    current = n;
    stages.forEach(function (s, i) { s.classList.toggle('is-active', i === n); });
    railBtns.forEach(function (b, i) {
      b.classList.toggle('is-active', i === n);
      b.classList.toggle('is-done', i < n);
    });
    steps.forEach(function (s, i) { s.classList.toggle('is-active', i === n); });
    if (n === 1) countRisk();
    if (n === 4) playBars();
  }

  function goStep(n) {
    var t = steps[n];
    if (!t) return;
    if (!('IntersectionObserver' in window)) { setStage(n); return; }
    t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }

  function toast(msg) {
    var t = $('dToast');
    t.textContent = msg;
    t.classList.add('show');
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(function () { t.classList.remove('show'); }, 2400);
  }

  /* scroll drives the stage. On small screens the panel is pinned to the top,
     so the trigger band sits lower — where the narration is actually visible.
     Rebuilt when the layout crosses the breakpoint (resize / rotate). */
  if ('IntersectionObserver' in window) {
    var mq = window.matchMedia('(max-width: 960px)');
    var io = null;
    var buildObserver = function () {
      if (io) io.disconnect();
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          setStage(Number(entry.target.getAttribute('data-step')));
        });
      }, { rootMargin: mq.matches ? '-64% 0px -14% 0px' : '-42% 0px -42% 0px', threshold: 0 });
      steps.forEach(function (s) { io.observe(s); });
    };
    buildObserver();
    if (mq.addEventListener) mq.addEventListener('change', buildObserver);
  } else {
    steps.forEach(function (s) { s.classList.add('is-active'); });
  }

  /* rail + in-panel navigation buttons */
  Array.prototype.forEach.call(root.querySelectorAll('[data-go]'), function (b) {
    b.addEventListener('click', function () { goStep(Number(b.getAttribute('data-go'))); });
  });

  /* source chips */
  Array.prototype.forEach.call(root.querySelectorAll('.dsource'), function (b) {
    b.addEventListener('click', function () {
      Array.prototype.forEach.call(root.querySelectorAll('.dsource'), function (x) {
        x.classList.toggle('is-selected', x === b);
      });
      $('dSourceDetail').textContent = SOURCES[Number(b.getAttribute('data-src'))];
    });
  });

  /* calculation toggle */
  var calcBtn = $('dCalcToggle');
  calcBtn.addEventListener('click', function () {
    var m = $('dMath');
    var open = !m.hidden;
    m.hidden = open;
    calcBtn.setAttribute('aria-expanded', String(!open));
    calcBtn.textContent = open ? 'Show the calculation' : 'Hide the calculation';
  });

  /* option pills */
  Array.prototype.forEach.call(root.querySelectorAll('.dpill'), function (b) {
    b.addEventListener('click', function () {
      option = Number(b.getAttribute('data-option'));
      renderOption();
    });
  });

  /* approve → route → advance to execution */
  $('dApprove').addEventListener('click', function () {
    toast(OPTIONS[option].toast);
    window.setTimeout(function () { goStep(3); }, 500);
  });

  renderOption();
})();

/* Product-surface tabs (Fire Board · Decision Copilot · Decision Record) */
(function () {
  'use strict';
  function initTabs() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-tabs]'), function (wrap) {
      var btns = wrap.querySelectorAll('.tabs__btn');
      var panels = wrap.querySelectorAll('.tabs__panel');
      Array.prototype.forEach.call(btns, function (btn) {
        btn.addEventListener('click', function () {
          Array.prototype.forEach.call(btns, function (b) {
            b.classList.toggle('is-active', b === btn);
          });
          Array.prototype.forEach.call(panels, function (p) {
            p.classList.toggle('is-active', p.getAttribute('data-panel') === btn.getAttribute('data-tab'));
          });
        });
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTabs);
  } else {
    initTabs();
  }
})();
