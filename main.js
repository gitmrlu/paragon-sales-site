/* Paragon AI site */
(() => {
  // Calendly link used by every "Book a Demo" button (the live site used this one on Contact).
  const DEMO_URL = 'https://calendly.com/evan-getpilot/30min';
  // Contact form endpoint (e.g. 'https://formspree.io/f/XXXX'). null = open the visitor's email app instead.
  const CONTACT_ENDPOINT = null;
  const CONTACT_EMAIL = 'hello@paragon.ai';

  document.documentElement.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* nav */
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 10);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  const toggle = $('.nav__toggle');
  toggle?.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  $$('.nav__links a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('is-open'); toggle?.setAttribute('aria-expanded', 'false'); }));

  /* reveals */
  const rv = $$('.reveal');
  if (reduce || !('IntersectionObserver' in window)) rv.forEach(e => e.classList.add('is-in'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    rv.forEach(e => io.observe(e));
  }

  /* scroll-linked: tour tilt + floating feature cards */
  const stage = $('[data-tilt]');
  const floats = $$('[data-float]');
  if (!reduce && (stage || floats.length)) {
    let ticking = false;
    const run = () => {
      const vh = innerHeight;
      if (stage) {
        const r = stage.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.9)));
        stage.style.transform = `perspective(1400px) rotateX(${(1 - p) * 16}deg) scale(${0.94 + p * 0.06})`;
      }
      floats.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const dir = parseFloat(el.dataset.float || 1) || 1;
        const off = ((r.top + r.height / 2) - vh / 2) * -0.06 * dir;
        el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
      });
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    addEventListener('resize', run); run();
  }

  /* product tour tabs */
  const tour = $('.tour');
  if (tour) {
    const tabs = $$('[role="tab"]', tour);
    const MS = 6000; tour.style.setProperty('--tour-ms', MS + 'ms');
    let idx = 0, timer = null, inView = false, userStopped = reduce;
    const select = (i, focus) => {
      idx = (i + tabs.length) % tabs.length;
      tabs.forEach((t, j) => {
        const on = j === idx, panel = document.getElementById(t.getAttribute('aria-controls'));
        t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
        panel.hidden = !on; panel.classList.toggle('is-active', on);
        const bar = $('.tour__bar', t); if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      });
      if (focus) tabs[idx].focus();
      schedule();
    };
    const schedule = () => { clearTimeout(timer); if (!userStopped && inView) timer = setTimeout(() => select(idx + 1), MS); };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { userStopped = true; tour.classList.add('is-paused'); select(i); });
      t.addEventListener('keydown', e => {
        const k = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 }[e.key];
        if (k) { e.preventDefault(); userStopped = true; tour.classList.add('is-paused'); select(idx + k, true); }
        if (e.key === 'Home') { e.preventDefault(); select(0, true); } if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
      });
    });
    if (reduce) tour.classList.add('is-paused');
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; tour.classList.toggle('is-paused', !inView || userStopped); schedule(); }, { threshold: .3 }).observe(tour);
    tour.addEventListener('mouseenter', () => { if (!userStopped) { clearTimeout(timer); tour.classList.add('is-paused'); } });
    tour.addEventListener('mouseleave', () => { if (!userStopped) { tour.classList.remove('is-paused'); select(idx); } });
  }

  /* how-it-works: light up output steps in sequence */
  const steps = $$('.flow__steps li');
  if (steps.length) {
    if (reduce) steps.forEach(s => s.classList.add('is-lit'));
    else { let i = 0; setInterval(() => { steps.forEach((s, j) => s.classList.toggle('is-lit', j === i)); i = (i + 1) % steps.length; }, 1400); steps[0].classList.add('is-lit'); }
  }

  /* demo modal (Calendly) */
  const modal = $('#demo-modal');
  let lastFocus = null;
  const openDemo = (email) => {
    const u = new URL(DEMO_URL);
    if (email) u.searchParams.set('email', email);
    $('#demo-direct').href = u.toString();
    u.searchParams.set('embed_domain', location.hostname || 'paragon.ai');
    u.searchParams.set('embed_type', 'Inline');
    u.searchParams.set('hide_gdpr_banner', '1');
    const body = $('.modal__body', modal);
    $$('iframe', body).forEach(f => f.remove());
    const f = document.createElement('iframe');
    f.title = 'Book a demo calendar'; f.src = u.toString(); f.loading = 'eager';
    f.addEventListener('load', () => $('.modal__loading', body)?.setAttribute('hidden', ''));
    $('.modal__loading', body)?.removeAttribute('hidden');
    body.appendChild(f);
    lastFocus = document.activeElement;
    modal.hidden = false; document.body.classList.add('modal-open');
    $('.modal__close', modal).focus();
  };
  const closeDemo = () => { modal.hidden = true; document.body.classList.remove('modal-open'); lastFocus?.focus?.(); };
  $$('[data-close]', modal).forEach(b => b.addEventListener('click', closeDemo));
  addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeDemo();
    if (e.key === 'Tab') {
      const f = $$('button, a[href], iframe', modal).filter(x => !x.hidden);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  $$('[data-demo]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); nav.classList.remove('is-open'); openDemo(); }));
  const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  $$('[data-demo-form]').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault();
    const input = $('input', form), err = $('.demo-form__err', form), v = input.value.trim();
    if (!validEmail(v)) { err.textContent = 'Please enter a valid email address.'; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
    err.textContent = ''; input.removeAttribute('aria-invalid'); openDemo(v);
  }));

  /* contact form */
  const cf = $('#contact-form');
  if (cf) cf.addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('.cform__err', cf); err.textContent = '';
    const fields = $$('input, textarea', cf); let bad = null;
    fields.forEach(f => { const ok = f.value.trim() && (f.type !== 'email' || validEmail(f.value.trim())); f.toggleAttribute('aria-invalid', !ok); if (!ok && !bad) bad = f; });
    if (bad) { err.textContent = 'Please fill in all fields with a valid email address.'; bad.focus(); return; }
    const data = Object.fromEntries(new FormData(cf));
    try {
      if (CONTACT_ENDPOINT) {
        const r = await fetch(CONTACT_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
        if (!r.ok) throw 0;
      } else {
        const body = `${data.message}\n\n${data.first_name} ${data.last_name}\n${data.email}`;
        location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Website enquiry from ' + data.first_name + ' ' + data.last_name)}&body=${encodeURIComponent(body)}`;
      }
      cf.classList.add('is-sent'); $('.cform__ok', cf).focus();
    } catch { err.textContent = 'Oops! Something went wrong while submitting the form. Please email ' + CONTACT_EMAIL + '.'; }
  });
})();
