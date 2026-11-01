const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/TTX55BZ3XZ';

(() => {
  window.__dd = 1;
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) root.classList.add('no-motion');

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  try {
    // ===== Year =====
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ===== Split display type into words (each word rises out of its line) =====
    const split = el => {
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      el.classList.add('is-split');
      words.forEach((w, i) => {
        if (i) el.appendChild(document.createTextNode(' '));
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = w;
        s.style.setProperty('--ci', i);
        el.appendChild(s);
      });
    };
    $$('.hero .split').forEach((el, k) => { split(el); el.style.setProperty('--cd', k * 160 + 'ms'); });

    // hero entrance after fonts are ready (never later than 1.2s)
    const hero = $('.hero');
    let started = false;
    const startHero = () => {
      if (started) return;
      started = true;
      requestAnimationFrame(() => {
        $$('.hero .split').forEach(el => el.classList.add('go'));
        hero.classList.add('loaded');
      });
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(startHero);
    setTimeout(startHero, 1200);

    // ===== Header: ink follows the chapter beneath it =====
    const header = $('#header');
    const fields = $$('[data-field]');
    const burger = $('#burger');
    const nav = $('#nav');
    const setMenu = open => {
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    window.matchMedia('(min-width: 1101px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

    // ===== Scroll-linked layer (one rAF) =====
    const band = $('#band');
    const bandImg = band ? $('img', band) : null;
    let lastY = window.scrollY;
    let vel = 0;
    let scrollTick = false;
    const pending = new Set();
    const contactEl = $('#contact');
    const bigLink = $('.contact__big');
    const onFrame = () => {
      scrollTick = false;
      const y = window.scrollY;
      const vh = window.innerHeight;
      // reveal everything that has entered the screen, including what a fast scroll jumped over
      pending.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.97) { el.classList.add('in'); pending.delete(el); }
      });
      if (bigLink && !bigLink.classList.contains('go') && contactEl.getBoundingClientRect().top < vh * 0.9) bigLink.classList.add('go');
      // header ink
      let cur = 'carmine';
      for (const s of fields) {
        const r = s.getBoundingClientRect();
        if (r.top <= 34 && r.bottom > 34) { cur = s.dataset.field; break; }
      }
      if (header.dataset.on !== cur) header.dataset.on = cur;
      // hero: the two lines slide apart, backward
      if (!reduce) hero.style.setProperty('--sp', clamp(y / vh, 0, 1).toFixed(4));
      // photo band parallax
      if (bandImg && !reduce) {
        const r = band.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh) {
          const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
          bandImg.style.setProperty('--by', ((p - 0.5) * r.height * 0.24).toFixed(1) + 'px');
          bandImg.style.setProperty('--bs', (1.04 + p * 0.08).toFixed(3));
        }
      }
      vel = vel * 0.8 + (y - lastY) * 0.2;
      lastY = y;
    };
    const requestFrame = () => { if (!scrollTick) { scrollTick = true; requestAnimationFrame(onFrame); } };
    window.addEventListener('scroll', requestFrame, { passive: true });
    window.addEventListener('resize', requestFrame);
    onFrame();

    // ===== Reveals =====
    $$('[data-r="line"]').forEach(h => {
      if (h.querySelector('.mask')) return;
      const inner = document.createElement('span');
      inner.innerHTML = h.innerHTML;
      h.textContent = '';
      const m = document.createElement('span');
      m.className = 'mask';
      m.appendChild(inner);
      h.appendChild(m);
    });
    $$('[data-stagger]').forEach(g => Array.from(g.children).forEach((c, i) => c.style.setProperty('--d', i * 70 + 'ms')));
    $$('.about__nums .num').forEach((n, i) => n.style.setProperty('--d', i * 120 + 'ms'));
    $$('.plan').forEach((p, i) => p.style.setProperty('--d', i * 110 + 'ms'));
    $$('.stage__p').forEach(p => p.style.setProperty('--d', '260ms'));
    $$('.stage').forEach(s => s.style.setProperty('--d', '0ms'));

    $$('[data-r], .stage, .pain').forEach(el => pending.add(el));
    onFrame();

    // ===== Count-up =====
    $$('[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      if (Number.isNaN(target) || reduce) return;
      el.textContent = '0';
      const cio = new IntersectionObserver(es => {
        es.forEach(e => {
          if (!e.isIntersecting) return;
          cio.disconnect();
          const t0 = performance.now();
          const tick = t => {
            const p = Math.min(1, (t - t0) / 1300);
            el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4)));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      }, { threshold: 0.6 });
      cio.observe(el);
    });

    // ===== Marquee: real figures, speeds up with the scroll, runs backward =====
    const track = $('#marquee');
    if (track && !reduce) {
      const unit = track.scrollWidth;
      const copies = Math.ceil((window.innerWidth * 2) / unit) + 1;
      const kids = Array.from(track.children);
      for (let c = 0; c < copies; c++) kids.forEach(k => track.appendChild(k.cloneNode(true)));
      let x = -unit;
      let last = performance.now();
      let visible = false;
      new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(track.parentElement);
      const loop = t => {
        const dt = Math.min(64, t - last) / 1000;
        last = t;
        if (visible) {
          x += (70 + Math.abs(vel) * 38) * dt;
          if (x >= 0) x -= unit;
          const sk = clamp(vel * 0.22, -9, 9);
          track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0) skewX(' + (-sk).toFixed(2) + 'deg)';
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    // ===== Niches: one name lit at a time =====
    const names = $$('#nichesP .n');
    if (names.length && !reduce) {
      let k = 0;
      let on = false;
      new IntersectionObserver(es => { on = es[0].isIntersecting; }, { threshold: 0.2 }).observe($('#nichesP'));
      setInterval(() => {
        if (!on) return;
        names.forEach(n => n.classList.remove('lit'));
        names[k++ % names.length].classList.add('lit');
      }, 1600);
    }

    // ===== Ledger: hover opens the details =====
    const ledger = $('#ledger');
    const peek = $('#peek');
    const rows = $$('.row');
    const peekMQ = window.matchMedia('(min-width: 1181px)');
    const activate = row => {
      if (!peekMQ.matches) return;
      rows.forEach(r => r.classList.toggle('is-active', r === row));
      ledger.classList.add('has-active');
      $('#peekBig').textContent = row.dataset.big;
      $('#peekTxt').textContent = row.dataset.txt;
      peek.style.setProperty('--py', row.offsetTop + 'px');
      if (!reduce) { peek.classList.remove('swap'); void peek.offsetWidth; peek.classList.add('swap'); }
    };
    const deactivate = () => {
      rows.forEach(r => r.classList.remove('is-active'));
      ledger.classList.remove('has-active');
    };
    rows.forEach(r => {
      r.addEventListener('mouseenter', () => activate(r));
      r.addEventListener('focus', () => activate(r));
    });
    ledger.addEventListener('mouseleave', deactivate);
    ledger.addEventListener('focusout', e => { if (!ledger.contains(e.relatedTarget)) deactivate(); });

    // ===== Calculator: from clients back to budget =====
    const cC = $('#cClients');
    const cV = $('#cConv');
    const cP = $('#cCpl');
    const outBudget = $('#rBudget');
    const bigP = outBudget.closest('.result__big');
    const nf = n => Math.round(n).toLocaleString('ru-RU');
    const fillOf = input => {
      const p = (input.value - input.min) / (input.max - input.min);
      input.parentElement.style.setProperty('--p', p.toFixed(4));
    };
    let shown = 67000;
    let raf = 0;
    const tweenTo = target => {
      cancelAnimationFrame(raf);
      const from = shown;
      const t0 = performance.now();
      const dur = reduce ? 0 : 520;
      const paint = v => {
        const txt = nf(v);
        outBudget.textContent = txt;
        bigP.style.setProperty('--len', (txt.length + 1.5).toFixed(1));
      };
      if (!dur) { shown = target; paint(shown); return; }
      const step = t => {
        const p = Math.min(1, (t - t0) / dur);
        shown = from + (target - from) * (1 - Math.pow(1 - p, 4));
        paint(shown);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const state = { service: '', calcUsed: false, summary: '' };
    const noteEl = $('#leadNote');
    const fCalc = $('#fCalc');
    const fService = $('#fService');
    const renderNote = () => {
      const parts = [];
      if (state.service) parts.push('Вас интересует: ' + state.service + '.');
      if (state.calcUsed) parts.push('К заявке приложен ваш расчёт: ' + state.summary + '.');
      noteEl.hidden = !parts.length;
      noteEl.textContent = parts.join(' ');
    };
    const recalc = () => {
      const clients = +cC.value;
      const conv = +cV.value;
      const cpl = +cP.value;
      const leads = Math.ceil(clients / (conv / 100));
      const budget = leads * cpl;
      const perDay = leads / 30;
      $('#oClients').textContent = clients;
      $('#oConv').textContent = conv + '%';
      $('#oCpl').textContent = nf(cpl) + ' ₽';
      $('#sClients').textContent = clients;
      $('#sLeads').textContent = nf(leads);
      $('#sCpl').textContent = nf(cpl);
      $('#sDay').textContent = (perDay >= 10 ? Math.round(perDay) : Math.round(perDay * 10) / 10).toString().replace('.', ',');
      [cC, cV, cP].forEach(fillOf);
      tweenTo(budget);
      state.summary = clients + ' клиентов в месяц, ' + conv + '% заявок в клиентов, заявка по ' + nf(cpl) + ' ₽: нужно ' + nf(leads) + ' заявок и ' + nf(budget) + ' ₽ рекламного бюджета в месяц';
      fCalc.value = state.summary;
      if (state.calcUsed) renderNote();
    };
    [cC, cV, cP].forEach(i => i.addEventListener('input', recalc));
    recalc();
    outBudget.textContent = nf(67000);
    $('#calcCta').addEventListener('click', () => { state.calcUsed = true; renderNote(); });
    $$('[data-service]').forEach(b => b.addEventListener('click', () => {
      state.service = b.dataset.service;
      fService.value = state.service;
      renderNote();
    }));

    // ===== Phone mask =====
    $$('input[type="tel"]').forEach(input => {
      input.addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.startsWith('8')) v = '7' + v.slice(1);
        if (!v.startsWith('7')) v = '7' + v;
        v = v.slice(0, 11);
        let out = '+7';
        if (v.length > 1) out += ' (' + v.slice(1, 4);
        if (v.length >= 4) out += ') ' + v.slice(4, 7);
        if (v.length >= 7) out += '-' + v.slice(7, 9);
        if (v.length >= 9) out += '-' + v.slice(9, 11);
        e.target.value = out;
      });
    });

    // ===== Form → Cloudflare Worker → Telegram =====
    const form = $('#leadForm');
    const status = $('#formStatus');
    const say = (msg, err) => { status.textContent = msg; status.classList.toggle('is-err', !!err); };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const orig = btn.textContent;
      const fd = new FormData(form);
      const payload = {};
      fd.forEach((v, k) => { payload[k] = v; });
      if (payload._gotcha) return;
      const digits = String(payload.phone || '').replace(/\D/g, '');
      if (!String(payload.name || '').trim()) { say('Напишите, как вас зовут.', true); $('#fName').focus(); return; }
      if (digits.length < 11) { say('Проверьте телефон: нужно 11 цифр.', true); $('#fPhone').focus(); return; }
      if (!$('#fAgree').checked) { say('Нужно согласие с политикой конфиденциальности.', true); return; }
      const bits = [];
      if (payload.niche) bits.push('Бизнес: ' + payload.niche);
      if (payload.service) bits.push('Услуга: ' + payload.service);
      if (payload.calc) bits.push('Расчёт: ' + payload.calc);
      payload.comment = bits.join('\n');
      say('');
      btn.disabled = true;
      btn.textContent = 'Отправляем…';
      try {
        const resp = await fetch(LEAD_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        btn.textContent = 'Заявка отправлена';
        say('Спасибо. Перезвоню в течение 10 минут, в рабочее время: пн–сб, 10–21.');
        form.classList.add('is-sent');
        form.reset();
      } catch (err) {
        console.error(err);
        btn.textContent = orig;
        btn.disabled = false;
        say('Не получилось отправить. Напишите в Telegram @dyominp или позвоните: 8 (931) 250-06-88.', true);
        return;
      }
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; form.classList.remove('is-sent'); }, 6000);
    });
  } catch (err) {
    // if anything above fails, never leave content hidden
    console.error(err);
    root.classList.remove('js');
  }
})();
