const button = document.querySelector('.menu-button');
const nav = document.querySelector('.site-header nav');
button.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  button.setAttribute('aria-expanded', open ? 'true' : 'false');
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  button.setAttribute('aria-expanded', 'false');
}));
document.getElementById('year').textContent = new Date().getFullYear();

// Native scrolling remains in charge; Anime.js only settles nearby topic edges.
(() => {
  if (!window.anime?.animate) return;
  const header = document.querySelector('.site-header');
  const topics = [...document.querySelectorAll('.splash, main > .section, .contact-screen')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.documentElement.classList.add('scroll-settling');
  let animation = null;
  let idleTimer = 0;
  let userScrolling = false;
  let touching = false;
  let suppressedUntil = 0;
  let layoutFrame = 0;

  const usableHeight = () => Math.max(1, window.innerHeight - header.offsetHeight);
  const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const targetY = element => Math.max(0, Math.min(maxScroll(),
    element.getBoundingClientRect().top + window.scrollY - (element.id === 'splash' ? 0 : header.offsetHeight)));
  const stopAnimation = () => {
    window.clearTimeout(idleTimer);
    animation?.pause();
    animation = null;
  };
  const suppress = (duration = 500) => {
    stopAnimation();
    userScrolling = false;
    suppressedUntil = performance.now() + duration;
  };
  const moveTo = (y, animate = true, focusTarget = null) => {
    stopAnimation();
    userScrolling = false;
    const finish = () => {
      animation = null;
      suppressedUntil = performance.now() + 60;
      if (focusTarget) {
        focusTarget.setAttribute('tabindex', '-1');
        focusTarget.focus({ preventScroll: true });
      }
    };
    if (!animate || reducedMotion.matches || Math.abs(window.scrollY - y) < 2) {
      window.scrollTo(0, y);
      finish();
      return;
    }
    const position = { y: window.scrollY };
    animation = window.anime.animate(position, {
      y, duration: 180, ease: 'outCubic',
      onRender: () => window.scrollTo(0, position.y),
      onComplete: finish
    });
  };
  const settle = () => {
    window.clearTimeout(idleTimer);
    if (!userScrolling || animation || touching || reducedMotion.matches ||
        performance.now() < suppressedUntil || nav.classList.contains('open') ||
        window.getSelection()?.toString()) return;
    userScrolling = false;
    const y = window.scrollY;
    const height = usableHeight();
    // Reading inside a tall topic must never pull the reader back to its heading.
    const insideLongTopic = topics.some(topic => {
      const start = targetY(topic);
      const bottom = topic.getBoundingClientRect().bottom + y;
      return bottom - start - header.offsetHeight > height + 2 &&
        y > start + 2 && y < bottom - window.innerHeight - 2;
    });
    if (insideLongTopic) return;
    const closest = topics.map(targetY).reduce((best, stop) =>
      Math.abs(stop - y) < Math.abs(best - y) ? stop : best);
    if (Math.abs(closest - y) > 2 && Math.abs(closest - y) <= height * 0.5) moveTo(closest);
  };
  const markInput = () => {
    stopAnimation();
    suppressedUntil = 0;
    userScrolling = true;
  };
  window.addEventListener('wheel', markInput, { passive: true });
  window.addEventListener('pointerdown', markInput, { passive: true });
  window.addEventListener('touchstart', () => { touching = true; markInput(); }, { passive: true });
  const endTouch = () => { touching = false; idleTimer = window.setTimeout(settle, 60); };
  window.addEventListener('touchend', endTouch, { passive: true });
  window.addEventListener('touchcancel', endTouch, { passive: true });
  window.addEventListener('keydown', () => suppress(), { passive: true });
  document.addEventListener('focusin', () => suppress());
  button.addEventListener('click', () => suppress());
  window.addEventListener('scroll', () => {
    if (!userScrolling || animation) return;
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(settle, 60);
  }, { passive: true });
  window.addEventListener('scrollend', settle, { passive: true });

  const refreshLayout = () => {
    suppress();
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    });
  };
  new ResizeObserver(refreshLayout).observe(header);
  window.addEventListener('resize', refreshLayout, { passive: true });
  window.visualViewport?.addEventListener('resize', refreshLayout, { passive: true });
  document.querySelectorAll('img').forEach(img => img.addEventListener('load', refreshLayout));
  document.querySelectorAll('.faq-item').forEach(item => item.addEventListener('toggle', refreshLayout));
  reducedMotion.addEventListener('change', () => suppress());

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
          event.shiftKey || event.altKey) return;
      const hash = link.getAttribute('href');
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      event.preventDefault();
      nav.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
      if (location.hash !== hash) history.pushState(null, '', hash);
      moveTo(targetY(target), true, target);
    });
  });
  const restoreHash = () => {
    suppress();
    requestAnimationFrame(() => {
      const target = document.getElementById(location.hash.slice(1));
      if (target) moveTo(targetY(target), false);
    });
  };
  window.addEventListener('hashchange', restoreHash);
  window.addEventListener('popstate', restoreHash);
  window.addEventListener('load', () => { refreshLayout(); if (location.hash) restoreHash(); });
  refreshLayout();
})();
