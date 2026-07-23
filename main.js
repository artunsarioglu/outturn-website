/* =========================================================================
   Outturn - marketing site behavior (vanilla, progressive enhancement)
   The page is fully readable, navigable, and the "aha" comprehensible with
   JS disabled (everything renders in final/resolved state). JS only adds:
   reveals, count-up, the citation expand toggle, the run-console playback,
   nav scroll-state + mobile sheet, and form validation + simulated success.
   ========================================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------------------
     Resolvable citation chips - the "click the evidence" mechanic.
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
     Count-up - a true reconciliation tick on the headline number(s).
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
     Run console - port of the product playSteps(): tick lines green in
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
     Book-a-demo form - validation + simulated success.
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
      data.append('_subject', 'Pilot request - getoutturn.ai');
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
          err.innerHTML = 'Something went wrong sending this - please email us directly at <a href="mailto:artun@getoutturn.ai">artun@getoutturn.ai</a>.';
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
   Live scroll demo (#demo) - scrollytelling + a genuinely interactive panel.
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

  /* ---- the broken-set case: pants selling, matching vest gone in 9
     stores. The two options frame the commercial outcome: protect store
     availability or protect online availability. Switching updates decision, execution,
     and measured outcome - the record tracks whether the *decision* worked,
     not just the task. ---- */
  var SOURCES = [
    'POS · 09:12 · 312 pants selling in the 9 stores. 1 in 4 buyers adds the vest.',
    'Inventory · 09:14 · Vest on hand across the 9 stores: 0.',
    'E-commerce · 09:15 · 184 vests sellable online.',
    'Email · 08:46 · E-commerce lead: at least 65% of vest stock must stay sellable online.',
    'keep_online_above_65@v4 · your rule: sellable online stock never falls below 65%.',
    'Decision memory · 3 similar broken-set decisions reviewed. Transfers protected set sales while keeping the online floor.'
  ];

  var OPTIONS = [
    {
      rec: 'Transfer 64 vests to the nine stores before the weekend.',
      why: 'This option protects the highest amount of expected set sales while maintaining the company’s online inventory floor.',
      protectedVal: '$22,336',
      deadline: 'Today, 16:00',
      checks: [
        ['Company policy satisfied', '120 vests remain online. 65.2% online availability is maintained. The nine priority stores receive full coverage.', false]
      ],
      execH: 'The yes became a store-transfer draft in your order system.',
      draft: 'Transfer draft TR-0051 created',
      ref: '64 vests · online DC → 9 stores · in your order system.',
      owner: 'Store ops confirming receipt',
      execStatus: '61 of 64 shipped on today’s runs; 3 being resolved.',
      outcome: '+$18,846',
      caption: '7-day sales from the transferred vests. Observed, not a causal claim. The pants they complete keep selling.',
      bars: [
        ['Arrived in the 9 stores', '61 / 64', 95],
        ['Vests sold in 7 days', '54 / 61', 88],
        ['Online stock kept', '120 · 65.2%', 65]
      ],
      toast: 'Approved. 64 vests routed to store ops with the context attached.'
    },
    {
      rec: 'Transfer 55 vests and retain a larger online inventory buffer.',
      why: 'This option preserves more online availability, while reducing the number of stores fully covered and the estimated value protected.',
      protectedVal: '$18,420',
      deadline: 'Today, 16:00',
      checks: [
        ['Company policy satisfied', '129 vests remain online. 70.1% online availability is maintained. Six priority stores receive full coverage.', false]
      ],
      execH: 'The yes became a smaller transfer draft. The 70% floor version.',
      draft: 'Transfer draft TR-0051 created',
      ref: '55 vests · online DC → 9 stores · in your order system.',
      owner: 'Store ops confirming receipt',
      execStatus: '53 of 55 shipped on today’s runs; 2 being resolved.',
      outcome: '+$16,403',
      caption: '7-day sales under the more conservative floor. Fewer sets completed in week one. The record keeps measuring.',
      bars: [
        ['Arrived in the 9 stores', '53 / 55', 96],
        ['Vests sold in 7 days', '47 / 53', 89],
        ['Online stock kept', '129 · 70.1%', 70]
      ],
      toast: 'Approved. The 70% floor call is recorded. The record will grade it too.'
    }
  ];

  function renderOption() {
    var o = OPTIONS[option];
    $('dRec').textContent = o.rec;
    $('dDecisionWhy').textContent = o.why;
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
    if (current === 5) playBars();
    Array.prototype.forEach.call(root.querySelectorAll('.doption'), function (p) {
      var selected = Number(p.getAttribute('data-option')) === option;
      p.classList.toggle('is-selected', selected);
      p.setAttribute('aria-checked', String(selected));
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
    if (reduceMotion) { el.textContent = '$27,222'; return; }
    var dur = 650, start = null;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = '$' + Math.round(27222 * eased).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = '$27,222';
    }
    requestAnimationFrame(tick);
  }

  /* Narration step → lifecycle rail. Step 1 is the off-loop counterfactual
     (the same decision dying in a thread), so it maps to no rail stage. */
  var RAIL_OF_STEP = [0, -1, 1, 2, 3, 4];

  function setStage(n) {
    if (n === current && stages[n].classList.contains('is-active')) return;
    current = n;
    var r = RAIL_OF_STEP[n];
    root.querySelector('.demo-panel').classList.toggle('is-today', r === -1);
    stages.forEach(function (s, i) { s.classList.toggle('is-active', i === n); });
    railBtns.forEach(function (b, i) {
      b.classList.toggle('is-active', i === r);
      b.classList.toggle('is-done', r === -1 ? i === 0 : i < r);
    });
    steps.forEach(function (s, i) { s.classList.toggle('is-active', i === n); });
    if (n === 2) countRisk();
    if (n === 5) playBars();
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
     so the trigger band sits lower - where the narration is actually visible.
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
    calcBtn.textContent = open ? 'Inspect the evidence' : 'Hide the evidence';
  });

  /* commercial option cards */
  Array.prototype.forEach.call(root.querySelectorAll('.doption'), function (b) {
    b.addEventListener('click', function () {
      option = Number(b.getAttribute('data-option'));
      renderOption();
    });
  });

  $('dChooseAlternative').addEventListener('click', function () {
    option = 1;
    renderOption();
    var selected = root.querySelector('.doption.is-selected');
    if (selected) selected.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  });

  /* approve → route → advance to execution */
  $('dApprove').addEventListener('click', function () {
    toast(OPTIONS[option].toast);
    window.setTimeout(function () { goStep(4); }, 500);
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
