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
   Live demo (#demo) - click-through Decision Records.
   One record, five gated steps; a decision library (same record shape,
   other decisions) and a rules view (legible rules + taught corrections,
   nothing live without a named approval). Progressive enhancement: without
   JS the stockout case renders statically on stage one.
   ========================================================================= */
(function () {
  'use strict';

  var root = document.getElementById('demo');
  if (!root) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var all = function (sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); };

  /* Every figure below is demo-seeded and internally consistent:
     the shown math recomputes each headline number. */
  var CASES = {
    stockout: {
      id: 'RD-0051', type: 'Stockout', alert: 'Monday 08:30 · Power BI alert',
      title: 'The linen suit vest is out of stock in 9 stores.',
      lead: 'Its matching suit pants keep selling — 1 in 4 pants buyers takes the vest too.',
      thread: [
        ['08:31 · #trading', 'BI bot', 'Vest unavailable in 9 stores.', true],
        ['08:47', 'Merch lead', '@Alex can you take a look?', false]
      ],
      threadEnd: 'Friday — still out · no owner · nothing measured',
      riskLabel: 'Set sales at risk', risk: '$27,222',
      facts: [['Matching pants selling', '312'], ['Set purchase rate', '25%'], ['Vest price', '$349'], ['Vests online', '184']],
      sources: [
        ['POS sales', 'POS · 09:12 · 312 pants selling in the 9 stores. 1 in 4 buyers adds the vest.'],
        ['Store stock', 'Inventory · 09:14 · Vest on hand across the 9 stores: 0.'],
        ['Online stock', 'E-commerce · 09:15 · 184 vests sellable online.'],
        ['Email', 'Email · 08:46 · E-commerce lead: keep at least 65% of vest stock online.'],
        ['Rule KRL-04', 'KRL-04 · v4 · Sellable online stock never falls below 65%.']
      ],
      math: '312 matching pants × 25% set rate × $349 vest price = <b>$27,222 set sales at risk</b><br />Computed in code from the rows above. Not a demand forecast.',
      scenarioLabel: 'Stock to keep online:',
      times: ['09:26', '09:27'],
      options: [
        {
          label: '65% · company rule',
          rec: 'Transfer 64 vests to the 9 stores before the weekend.',
          protectedVal: '$22,336', deadline: 'Today, 16:00',
          checks: [['Online floor holds', '120 vests stay online · 65.2%'], ['9 stores fully covered', '64 vests match store-level pants sales'], ['Rule applied', 'KRL-04 · v4']],
          execH: 'The yes became a transfer draft in your order system.',
          draft: 'Transfer draft TR-0051 created', ref: '64 vests · online DC → 9 stores',
          owner: 'Store ops confirming receipt', exec: '61 of 64 shipped; 3 being resolved.',
          outcome: '+$18,846', caption: '7-day sales from the transferred vests (54 × $349). Observed, not a causal claim.',
          bars: [['Arrived in stores', '61 / 64', 95], ['Sold in 7 days', '54 / 61', 88], ['Kept online', '120 · 65.2%', 65]],
          memory: 'RD-0051 now cites what the 65% floor actually did. The next broken set opens with it.',
          toast: 'Approved. The draft is routed to store ops with the context attached.'
        },
        {
          label: '70% · more conservative',
          rec: 'Transfer 55 vests, keep a larger online buffer.',
          protectedVal: '$19,195', deadline: 'Today, 16:00',
          checks: [['Online floor holds higher', '129 vests stay online · 70.1%'], ['6 of 9 stores fully covered', '55 vests · 3 stores partly covered'], ['Rule applied', 'KRL-04 · v4']],
          execH: 'The yes became a smaller transfer draft — the 70% version.',
          draft: 'Transfer draft TR-0051 created', ref: '55 vests · online DC → 9 stores',
          owner: 'Store ops confirming receipt', exec: '53 of 55 shipped; 2 being resolved.',
          outcome: '+$16,403', caption: '7-day sales under the conservative floor (47 × $349). Observed, not a causal claim.',
          bars: [['Arrived in stores', '53 / 55', 96], ['Sold in 7 days', '47 / 53', 89], ['Kept online', '129 · 70.1%', 70]],
          memory: 'The conservative call is on the record too — graded against the 65% option.',
          toast: 'Approved. The 70% call is recorded; the record grades it too.'
        }
      ]
    },
    phantom: {
      id: 'RD-0047', type: 'Phantom inventory', alert: 'Tuesday 08:54 · allocation plan check',
      title: '480 units are allocated to stores. The warehouse has received 0.',
      lead: 'The allocation plan counts units that are still on a truck as sellable stock.',
      thread: [
        ['08:55 · #supply', 'Allocation bot', 'ALC-214 ready: 480 units to 8 stores.', false],
        ['09:02', 'Planner', 'Truck is due today — should be fine 🤞', false]
      ],
      threadEnd: 'Thursday — 8 store plans built on units that never arrived',
      riskLabel: 'Misallocation risk', risk: '$42,720',
      facts: [['Purchase order', '480'], ['Warehouse receipt', '0'], ['Target stores', '8'], ['Unit cost', '$89']],
      sources: [
        ['Allocation plan', 'ALC-214 · 08:50 · 480 units allocated to 8 stores.'],
        ['Purchase order', 'PO-1042 · 480 units still in transit.'],
        ['Warehouse', 'WMS · 08:52 · Units received: 0.'],
        ['Supplier email', 'Email · 07:58 · Truck expected today, 14:00.'],
        ['Rule KRL-11', 'KRL-11 · v2 · No store allocation before warehouse receipt.']
      ],
      math: '480 allocated − 0 received = <b>480 units that don’t exist yet</b><br />480 × $89 = <b>$42,720 misallocation risk</b>',
      scenarioLabel: 'What happens to the plan:',
      times: ['09:04', '09:05'],
      options: [
        {
          label: 'Hold until receipt · rule',
          rec: 'Hold all 480 units until the warehouse confirms receipt.',
          protectedVal: '$42,720', deadline: 'Now',
          checks: [['Rule applied', 'KRL-11 · v2 — added after a recorded miss'], ['Plan kept intact', 'ALC-214 held, not deleted'], ['Sources fresh', '4 systems read in the last 10 minutes']],
          execH: 'The plan is on hold in your allocation tool.',
          draft: 'Hold placed on ALC-214', ref: '480 units · release on receipt',
          owner: 'Warehouse team watching receipt', exec: 'Truck arrived 14:10; receipt in progress.',
          outcome: '+$42,720', caption: 'Value held back from stores that could not have sold it yet. Observed, not a causal claim.',
          bars: [['Units held', '480 / 480', 100], ['Shipped to wrong stores', '0', 2], ['Received next day', '480 / 480', 100]],
          memory: 'KRL-11 exists because a plan like this once shipped. The rule carries its scar.',
          toast: 'Hold approved. Release is tied to warehouse receipt.'
        },
        {
          label: 'Recheck tomorrow 09:00',
          rec: 'Keep the hold and read the receipt again tomorrow morning.',
          protectedVal: '$42,720', deadline: 'Tomorrow, 09:00',
          checks: [['Rule applied', 'KRL-11 · v2'], ['Follow-up on the record', 'Tomorrow, 09:00'], ['Plan kept intact', 'ALC-214 held']],
          execH: 'The hold stands; a follow-up check is on the record.',
          draft: 'Follow-up check created', ref: 'ALC-214 · tomorrow 09:00',
          owner: 'Warehouse team watching receipt', exec: 'Plan paused; units still in transit.',
          outcome: '+$42,720', caption: 'Value held back from stores that could not have sold it yet. Observed, not a causal claim.',
          bars: [['Units held', '480 / 480', 100], ['Shipped to wrong stores', '0', 2], ['Received next day', '480 / 480', 100]],
          memory: 'The 24-hour recheck is recorded; it becomes a rule only with a named approval.',
          toast: 'Hold kept. The recheck is on the record.'
        }
      ]
    },
    promo: {
      id: 'RD-0032', type: 'Promotion', alert: 'Thursday 10:06 · campaign report',
      title: 'The “buy 2” promotion sells — and misses its margin target.',
      lead: 'Sales are up 18% — but margin runs 11 points under target in 12 stores.',
      thread: [
        ['10:07 · #commercial', 'Campaign bot', 'Sales +18% 🎉', false],
        ['10:24', 'Finance', 'Margin is 11 points under target in 12 stores…', false]
      ],
      threadEnd: 'Weekend — the campaign runs on, nobody owns the trade-off',
      riskLabel: 'Margin below target', risk: '$22,740',
      facts: [['Sales growth', '+18%'], ['Margin vs target', '−11 pts'], ['Days left', '5'], ['Stores below target', '12']],
      sources: [
        ['Campaign results', '9 days of sales and margin, by store.'],
        ['Size availability', 'M/L broken in the 12 stores below target.'],
        ['Finance target', 'Campaign margin target: 42%.'],
        ['Store list', 'The same 12 stores show the same pattern.'],
        ['Rule KRL-13', 'KRL-13 · v3 · Review campaign scope when margin falls below 42%.']
      ],
      math: '$22,740 margin below target − $1,260 cost of changing scope = <b>$21,480 estimated recoverable</b>',
      scenarioLabel: 'Campaign scope:',
      times: ['10:41', '10:42'],
      options: [
        {
          label: 'Keep strong stores · rule',
          rec: 'Keep the promotion only where size runs are full.',
          protectedVal: '$21,480', deadline: 'Today, 14:00',
          checks: [['Margin back on target', 'Expected store margin: 43%'], ['Sizes can serve it', 'Full runs in the remaining stores'], ['Rule applied', 'KRL-13 · v3']],
          execH: 'The scope change landed as a draft in your campaign tool.',
          draft: 'Scope draft CMP-219 created', ref: '12 stores out · effective 14:00',
          owner: 'Commercial team releasing the change', exec: 'Scope updated in 12 of 12 stores.',
          outcome: '+$12,410', caption: '5-day margin recovered — $9,070 below the $21,480 estimate. The miss is on the record.',
          bars: [['Stores updated', '12 / 12', 100], ['Margin vs target', '+6.1 pts', 55], ['Sales kept', '91%', 91]],
          memory: 'The estimate missed by $9,070. The estimate was corrected — with a named approval, on the record.',
          toast: 'Approved. The record grades the estimate, not just the action.'
        },
        {
          label: 'Stop in the 12 stores',
          rec: 'Stop the promotion in the 12 stores below target.',
          protectedVal: '$22,740', deadline: 'Today, 14:00',
          checks: [['Margin loss stops', '12 stores out of scope'], ['Full-price sales tracked', 'Watching for the drop'], ['Rule applied', 'KRL-13 · v3']],
          execH: 'The stop landed as a draft in your campaign tool.',
          draft: 'Stop draft CMP-219 created', ref: '12 stores · effective 14:00',
          owner: 'Commercial team releasing the change', exec: 'Promotion stopped in 12 of 12 stores.',
          outcome: '+$14,890', caption: '5-day margin recovered after the stop. Observed, not a causal claim.',
          bars: [['Stores updated', '12 / 12', 100], ['Margin vs target', '+7.4 pts', 67], ['Sales kept', '84%', 84]],
          memory: 'Stopping kept more margin and cost more sales. Both trade-offs are on the record.',
          toast: 'Approved. Both options stay comparable on the record.'
        }
      ]
    },
    parity: {
      id: 'RD-0028', type: 'Price parity', alert: 'Friday 11:22 · price parity check',
      title: 'Web and store prices differ on 37 products.',
      lead: 'Outside campaigns, web and store prices must match. On these they don’t.',
      thread: [
        ['11:23 · #ecom', 'Support', 'Customers see two prices on the same dress 😬', false],
        ['11:40', 'E-com lead', 'Store list is stale — pricing owns this?', false]
      ],
      threadEnd: 'Weekend — prices stay split across 23 stores',
      riskLabel: 'Weekly exposure', risk: '$17,390',
      facts: [['Products mismatched', '37'], ['In active campaigns', '6'], ['Stores affected', '23'], ['Avg. weekly exposure', '$470 / product']],
      sources: [
        ['Web prices', 'E-commerce price list · 11:18.'],
        ['Store prices', 'POS price list · 11:19.'],
        ['Campaigns', '6 of the 37 are in active campaigns.'],
        ['Email', 'Pricing team: publish window today, 18:00.'],
        ['Rule KRL-08', 'KRL-08 · v1 · Web and store prices match outside campaigns.']
      ],
      math: '37 × $470 weekly exposure = <b>$17,390 at stake</b><br />6 campaign products excluded → 31 × $470 = <b>$14,570 correctable today</b>',
      scenarioLabel: 'Correction scope:',
      times: ['11:56', '11:57'],
      options: [
        {
          label: '31 products now · rule',
          rec: 'Match web and store prices on the 31 non-campaign products at 18:00.',
          protectedVal: '$14,570', deadline: 'Today, 18:00',
          checks: [['Campaigns untouched', '6 products stay out of scope'], ['Publish window booked', 'Today, 18:00'], ['Rule applied', 'KRL-08 · v1']],
          execH: 'The price change landed as a draft in your pricing tool.',
          draft: 'Price draft PRC-442 created', ref: '31 products · 23 stores · 18:00',
          owner: 'Pricing team releasing at 18:00', exec: 'Published 18:02; verified in 23 of 23 stores.',
          outcome: '+$13,240', caption: '7-day exposure closed after matching. Observed, not a causal claim.',
          bars: [['Products matched', '31 / 31', 100], ['Stores verified', '23 / 23', 100], ['Parity complaints', '−62%', 62]],
          memory: 'The nightly parity check now cites this record when it fires.',
          toast: 'Approved. 31 products queued for the 18:00 window.'
        },
        {
          label: 'All 37 at 18:00',
          rec: 'Match all 37, campaign products included, at 18:00.',
          protectedVal: '$17,390', deadline: 'Today, 18:00',
          checks: [['Needs one more yes', 'Commercial approval pending on 6 campaign products'], ['Publish window booked', 'Today, 18:00'], ['Rule applied', 'KRL-08 · v1']],
          execH: 'The bulk change waits on one more named approval.',
          draft: 'Bulk draft PRC-442 created', ref: '37 products · 23 stores · 18:00',
          owner: 'Commercial approving the 6 campaign items', exec: '31 published; 6 held for approval.',
          outcome: '+$15,110', caption: '7-day exposure closed, campaign items included. Observed, not a causal claim.',
          bars: [['Products matched', '37 / 37', 100], ['Stores verified', '23 / 23', 100], ['Parity complaints', '−68%', 68]],
          memory: 'The extra approval step is on the record — the chain is auditable.',
          toast: 'Approved. Six campaign items wait on a commercial yes.'
        }
      ]
    }
  };

  var RULES = [
    ['KRL-04 · v4', 'Sellable online stock never falls below 65%.', 'Company rule · named approval on record'],
    ['KRL-11 · v2', 'No store allocation before warehouse receipt.', 'Added after a recorded miss · RD-0033'],
    ['KRL-13 · v3', 'Review campaign scope when margin falls below 42%.', 'Company correction · named approval on record'],
    ['KRL-08 · v1', 'Web and store prices match outside campaigns.', 'Built-in retail pack · read it line by line']
  ];

  var active = 'stockout', option = 0, current = 0, view = 'flow', barsPlayed = false;
  var steps = Array.prototype.slice.call(root.querySelectorAll('.scrolly-step'));

  function toast(msg) {
    var t = $('dToast');
    t.textContent = msg;
    t.classList.add('show');
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(function () { t.classList.remove('show'); }, 2400);
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

  function showStage(n) {
    current = Number(n);
    all('.dstage').forEach(function (s, i) { s.classList.toggle('is-active', i === current); });
    all('.demo-rail button').forEach(function (b, i) {
      b.classList.toggle('is-active', i === current);
      b.classList.toggle('is-done', i < current);
    });
    steps.forEach(function (s, i) { s.classList.toggle('is-active', i === current); });
    if (current === 4) playBars();
  }

  /* scroll the matching narration step into view; the observer swaps the stage */
  function goStep(n) {
    var t = steps[n];
    if (!t || !('IntersectionObserver' in window)) { showStage(Number(n)); return; }
    t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }

  function showView(name) {
    view = name;
    var sc = root.querySelector('.scrolly');
    if (sc) sc.classList.toggle('is-offflow', name !== 'flow');
    all('.dview').forEach(function (v) { v.classList.toggle('is-active', v.getAttribute('data-view') === name); });
    all('.demo-panel__nav button').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-viewgo') === name); });
    if (name === 'cases') renderCases();
    if (name === 'rules') renderRules();
  }

  function renderOption() {
    var o = CASES[active].options[option];
    var t = CASES[active].times;
    $('dRec').textContent = o.rec;
    $('dProtected').textContent = o.protectedVal;
    $('dDeadline').textContent = o.deadline;
    $('dChecks').innerHTML = o.checks.map(function (c) {
      return '<div class="dcheck"><b>✓ ' + c[0] + '</b><span>' + c[1] + '</span></div>';
    }).join('');
    $('dExecH').textContent = o.execH;
    $('dTimeline').innerHTML =
      '<div class="devent devent--done"><small>' + t[0] + '</small><b>Approved by Alex</b><span>Decision and rationale recorded.</span></div>' +
      '<div class="devent devent--done"><small>' + t[1] + '</small><b>' + o.draft + '</b><span>' + o.ref + '</span></div>' +
      '<div class="devent devent--now"><small>Today</small><b>' + o.owner + '</b><span>' + o.exec + '</span></div>' +
      '<div class="devent"><small>+7 days</small><b>Outcome will be measured</b><span>The same systems are read again.</span></div>';
    $('dOutcome').textContent = o.outcome;
    $('dCaption').textContent = o.caption;
    $('dBars').innerHTML = o.bars.map(function (b) {
      return '<div class="dbar"><span>' + b[0] + '</span><div class="dtrack">' +
        '<div class="dfill" data-w="' + b[2] + '"></div></div><b>' + b[1] + '</b></div>';
    }).join('');
    $('dMemory').textContent = o.memory;
    barsPlayed = false;
    if (current === 4) playBars();
    all('.dpill').forEach(function (p) {
      var sel = Number(p.getAttribute('data-option')) === option;
      p.classList.toggle('is-selected', sel);
      p.setAttribute('aria-checked', String(sel));
    });
  }

  function renderCase() {
    var c = CASES[active];
    $('dAlert').textContent = c.alert;
    $('dTitle0').textContent = c.title;
    $('dLead0').textContent = c.lead;
    $('dThread').innerHTML = c.thread.map(function (m) {
      return '<div class="dmsg"><small>' + m[0] + '</small><b>' + m[1] + '</b> ' + m[2] +
        (m[3] ? ' <span class="dattach">📎 screenshot.png</span>' : '') + '</div>';
    }).join('') + '<div class="dsys">' + c.threadEnd + '</div>';
    $('dRecTag').textContent = 'Outturn · ' + c.id;
    $('dKicker1').textContent = c.id + ' · context, cited';
    $('dRiskLabel').textContent = c.riskLabel;
    $('dRisk').textContent = c.risk;
    $('dFacts').innerHTML = c.facts.map(function (f) {
      return '<div class="dfact"><span>' + f[0] + '</span><b>' + f[1] + '</b></div>';
    }).join('');
    $('dSources').innerHTML = c.sources.map(function (s, i) {
      return '<button type="button" class="dsource' + (i === 0 ? ' is-selected' : '') + '" data-src="' + i + '">' + s[0] + '</button>';
    }).join('');
    $('dSourceDetail').textContent = c.sources[0][1];
    all('.dsource').forEach(function (b) {
      b.addEventListener('click', function () {
        all('.dsource').forEach(function (x) { x.classList.toggle('is-selected', x === b); });
        $('dSourceDetail').textContent = c.sources[Number(b.getAttribute('data-src'))][1];
      });
    });
    $('dMath').innerHTML = c.math;
    $('dMath').hidden = true;
    $('dCalcToggle').textContent = 'Show the calculation';
    $('dCalcToggle').setAttribute('aria-expanded', 'false');
    $('dKicker2').textContent = c.id + ' · a human decides';
    $('dScenarioLabel').textContent = c.scenarioLabel;
    $('dOpt0').textContent = c.options[0].label;
    $('dOpt1').textContent = c.options[1].label;
    $('dKicker3').textContent = c.id + ' · routed to execution';
    $('dKicker4').textContent = c.id + ' · 7 days later';
    renderOption();
  }

  function renderCases() {
    $('dCaseList').innerHTML = Object.keys(CASES).map(function (k) {
      var c = CASES[k];
      return '<button type="button" class="dcase" data-case="' + k + '">' +
        '<small>' + c.type + (k === active ? ' · open' : '') + '</small>' +
        '<b>' + c.title + '</b>' +
        '<span class="dcase__amount">' + c.risk + '</span>' +
        '<span class="dcase__arrow" aria-hidden="true">›</span></button>';
    }).join('');
    all('[data-case]').forEach(function (b) {
      b.addEventListener('click', function () {
        active = b.getAttribute('data-case');
        option = 0;
        renderCase();
        showView('flow');
        goStep(0);
      });
    });
  }

  function renderRules() {
    $('dRuleList').innerHTML = RULES.map(function (r) {
      return '<div class="drule"><b>' + r[0] + '</b><p>' + r[1] + '</p><span>' + r[2] + '</span></div>';
    }).join('');
  }

  /* wire up */
  all('[data-go]').forEach(function (b) {
    b.addEventListener('click', function () { goStep(Number(b.getAttribute('data-go'))); });
  });
  all('.demo-rail button').forEach(function (b, i) {
    b.addEventListener('click', function () { goStep(i); });
  });
  all('[data-viewgo]').forEach(function (b) {
    b.addEventListener('click', function () { showView(b.getAttribute('data-viewgo')); });
  });
  all('.dpill').forEach(function (b) {
    b.addEventListener('click', function () {
      option = Number(b.getAttribute('data-option'));
      renderOption();
    });
  });
  $('dCalcToggle').addEventListener('click', function () {
    var m = $('dMath');
    var open = !m.hidden;
    m.hidden = open;
    $('dCalcToggle').setAttribute('aria-expanded', String(!open));
    $('dCalcToggle').textContent = open ? 'Show the calculation' : 'Hide the calculation';
  });
  $('dApprove').addEventListener('click', function () {
    toast(CASES[active].options[option].toast);
    window.setTimeout(function () { goStep(3); }, 500);
  });
  $('dNewRule').addEventListener('click', function () {
    $('dRuleForm').hidden = false;
    $('dRuleInput').focus();
  });
  $('dCancelRule').addEventListener('click', function () {
    $('dRuleForm').hidden = true;
    $('dRuleInput').value = '';
  });
  $('dSaveRule').addEventListener('click', function () {
    var v = $('dRuleInput').value.trim();
    if (!v) { $('dRuleInput').focus(); return; }
    RULES.unshift(['KRL-' + String(11 + RULES.length) + ' · v1', v, 'Pending approval — takes effect only with a named yes']);
    $('dRuleInput').value = '';
    $('dRuleForm').hidden = true;
    renderRules();
    toast('Submitted. It takes effect only after a named approval.');
  });

  /* scroll drives the stage; the trigger band sits lower on small screens
     where the panel is pinned to the top. Rebuilt on breakpoint change. */
  if ('IntersectionObserver' in window) {
    var mq = window.matchMedia('(max-width: 960px)');
    var io = null;
    var buildObserver = function () {
      if (io) io.disconnect();
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          if (view !== 'flow') return;
          showStage(Number(entry.target.getAttribute('data-step')));
        });
      }, { rootMargin: mq.matches ? '-64% 0px -14% 0px' : '-42% 0px -42% 0px', threshold: 0 });
      steps.forEach(function (s) { io.observe(s); });
    };
    buildObserver();
    if (mq.addEventListener) mq.addEventListener('change', buildObserver);
  } else {
    steps.forEach(function (s) { s.classList.add('is-active'); });
  }

  renderCase();
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
