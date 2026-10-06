const button = document.querySelector('.menu-button');
const nav = document.querySelector('.site-header nav');
const closeMenu = () => {
  nav.classList.remove('open');
  button.setAttribute('aria-expanded', 'false');
};
button.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  button.setAttribute('aria-expanded', open ? 'true' : 'false');
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.getElementById('year').textContent = new Date().getFullYear();

(() => {
  if (!window.anime?.animate) return;
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const topics = [...document.querySelectorAll('.splash, main > .section, .contact-screen')];
  const logo = document.querySelector('.splash-logo');
  const brandLogo = document.querySelector('.brand img');
  const explore = document.querySelector('.explore');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  root.classList.add('paging-ready');
  let animation = null;
  let momentum = null;
  let cleanupFlight = () => {};
  let wheelTimer;
  let wheelLatched = false;
  let wheelDistance = 0;
  let touch = null;
  let frame;

  const maximum = () => Math.max(0, root.scrollHeight - innerHeight);
  const stop = topic => Math.max(0, Math.min(maximum(),
    topic.getBoundingClientRect().top + scrollY - (topic.id === 'splash' ? 0 : header.offsetHeight)));
  const currentIndex = () => {
    let index = 0;
    topics.forEach((topic, i) => { if (stop(topic) <= scrollY + 3) index = i; });
    return index;
  };
  const readingEnd = index => Math.max(stop(topics[index]),
    topics[index].getBoundingClientRect().bottom + scrollY - innerHeight);
  const updateHeader = () => {
    const visible = scrollY > 2;
    root.classList.toggle('has-header', visible);
    header.inert = !visible && !animation;
  };
  const cancelMomentum = () => {
    momentum?.pause();
    momentum = null;
  };
  const cancel = () => {
    cancelMomentum();
    animation?.pause();
    animation = null;
    cleanupFlight();
    updateHeader();
  };
  const createFlight = (forward) => {
    root.classList.add('header-transition');
    header.inert = false;
    const splashRect = logo.getBoundingClientRect();
    const brandRect = brandLogo.getBoundingClientRect();
    const launchRect = { left: splashRect.left, top: splashRect.top + scrollY,
      width: splashRect.width, height: splashRect.height };
    const from = forward ? launchRect : brandRect;
    const to = forward ? brandRect : launchRect;
    const flight = logo.cloneNode();
    flight.className = 'launch-logo-flight';
    flight.alt = '';
    flight.setAttribute('aria-hidden', 'true');
    Object.assign(flight.style, { left: `${from.left}px`, top: `${from.top}px`,
      width: `${from.width}px`, height: `${from.height}px` });
    document.body.append(flight);
    logo.style.visibility = 'hidden';
    const exploreRect = explore.getBoundingClientRect();
    const exploreFlight = document.createElement('span');
    exploreFlight.className = 'explore launch-explore-flight';
    exploreFlight.innerHTML = explore.innerHTML;
    exploreFlight.setAttribute('aria-hidden', 'true');
    const launchExplore = { left: exploreRect.left, top: exploreRect.top + scrollY };
    const menuRect = (getComputedStyle(button).display === 'none' ? nav : button).getBoundingClientRect();
    Object.assign(exploreFlight.style, { left: `${launchExplore.left}px`, top: `${launchExplore.top}px`,
      right: 'auto', fontSize: getComputedStyle(explore).fontSize });
    document.body.append(exploreFlight);
    explore.style.visibility = 'hidden';
    cleanupFlight = () => {
      flight.remove(); exploreFlight.remove();
      logo.style.removeProperty('visibility'); explore.style.removeProperty('visibility');
      root.classList.remove('header-transition');
      header.style.removeProperty('--header-opacity'); header.style.removeProperty('--nav-opacity');
      cleanupFlight = () => {};
    };
    return progress => {
      const phase = forward ? progress : 1 - progress;
      flight.style.transform = `translate(${(to.left-from.left)*progress}px, ${(to.top-from.top)*progress}px) scale(${1+(to.width/from.width-1)*progress})`;
      exploreFlight.style.transform = `translate(${(menuRect.left-launchExplore.left)*phase}px, ${(menuRect.top-launchExplore.top)*phase}px)`;
      exploreFlight.style.opacity = Math.max(0, 1-phase*2);
      header.style.setProperty('--header-opacity', phase);
      header.style.setProperty('--nav-opacity', Math.max(0, (phase-0.35)/0.65));
    };
  };
  const moveTo = (y, focusTarget = null, instant = false) => {
    const fromY = scrollY;
    cancel();
    closeMenu();
    const launchTransition = (fromY < 3 && y > 3) || (y < 3 && fromY > 3);
    const finish = () => {
      animation = null;
      cleanupFlight();
      window.scrollTo(0, y);
      updateHeader();
      if (focusTarget) {
        focusTarget.setAttribute('tabindex', '-1');
        focusTarget.focus({ preventScroll: true });
      }
    };
    if (instant || reducedMotion.matches || Math.abs(y-fromY)<2) { finish(); return; }
    const renderFlight = launchTransition ? createFlight(y>3) : () => {};
    const state = { progress: 0 };
    renderFlight(0);
    animation = window.anime.animate(state, {
      progress: 1, duration: launchTransition ? 420 : 240, ease: 'outCubic',
      onRender: () => {
        window.scrollTo(0, fromY + (y-fromY)*state.progress);
        renderFlight(state.progress);
        updateHeader();
      }, onComplete: finish
    });
  };
  const blocked = target => nav.classList.contains('open') ||
    target?.closest('input, textarea, select, [contenteditable="true"], .site-header nav.open') ||
    window.getSelection()?.toString();
  const step = direction => {
    const index = currentIndex();
    const destination = Math.max(0, Math.min(topics.length-1, index+direction));
    if (destination !== index) moveTo(stop(topics[destination]));
  };
  window.addEventListener('wheel', event => {
    cancelMomentum();
    if (event.ctrlKey || Math.abs(event.deltaX)>Math.abs(event.deltaY) || blocked(event.target)) return;
    event.preventDefault();
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { wheelLatched=false; wheelDistance=0; }, 220);
    if (animation || wheelLatched) return;
    const delta = event.deltaY * (event.deltaMode===1 ? 16 : event.deltaMode===2 ? innerHeight : 1);
    const index = currentIndex();
    const start = stop(topics[index]);
    const end = readingEnd(index);
    if ((delta>0 && scrollY<end-3) || (delta<0 && scrollY>start+3)) {
      window.scrollTo(0, Math.max(start, Math.min(end, scrollY+delta)));
      if (scrollY<=start+3 || scrollY>=end-3) wheelLatched=true;
      return;
    }
    wheelDistance += delta;
    if (Math.abs(wheelDistance)>=30) { wheelLatched=true; step(Math.sign(wheelDistance)); }
  }, { passive:false });
  window.addEventListener('touchstart', event => {
    cancelMomentum();
    if (event.touches.length!==1 || blocked(event.target)) { touch=null; return; }
    const point=event.touches[0];
    const index=currentIndex();
    touch={x:point.clientX,y:point.clientY,last:point.clientY,index,
      start:stop(topics[index]),end:readingEnd(index),reading:false,done:false,
      velocity:0,lastTime:performance.now()};
  }, { passive:true });
  window.addEventListener('touchmove', event => {
    if (!touch || event.touches.length!==1) return;
    const point=event.touches[0];
    const dy=touch.y-point.clientY;
    if (Math.abs(point.clientX-touch.x)>Math.abs(dy)) return;
    event.preventDefault();
    if (animation || touch.done) return;
    const delta=touch.last-point.clientY;
    const now=performance.now();
    const elapsed=Math.max(8,now-touch.lastTime);
    touch.velocity=0.7*(delta/elapsed)+0.3*touch.velocity;
    touch.lastTime=now;
    touch.last=point.clientY;
    if (touch.reading || (dy>0 && scrollY<touch.end-3) || (dy<0 && scrollY>touch.start+3)) {
      touch.reading=true;
      window.scrollTo(0,Math.max(touch.start,Math.min(touch.end,scrollY+delta)));
    } else if (Math.abs(dy)>=40) { touch.done=true; step(Math.sign(dy)); }
  }, { passive:false });
  const coast = gesture => {
    if (!gesture?.reading || reducedMotion.matches || animation ||
        performance.now()-gesture.lastTime>100 || Math.abs(gesture.velocity)<0.08) return;
    const velocity=Math.max(-2.5,Math.min(2.5,gesture.velocity));
    const duration=Math.max(200,Math.min(350,200+Math.abs(velocity)*60));
    const start=stop(topics[gesture.index]),end=readingEnd(gesture.index);
    const destination=Math.max(start,Math.min(end,scrollY+velocity*duration/3));
    if (Math.abs(destination-scrollY)<2) return;
    const position={y:scrollY};
    momentum=window.anime.animate(position,{
      y:destination,duration,ease:'outCubic',
      onRender:()=>window.scrollTo(0,Math.max(start,Math.min(end,position.y))),
      onComplete:()=>{momentum=null;}
    });
  };
  window.addEventListener('touchend',event=>{
    if(event.touches.length) return;
    const gesture=touch;touch=null;coast(gesture);
  },{passive:true});
  window.addEventListener('touchcancel',()=>{touch=null;},{passive:true});
  window.addEventListener('keydown', event => {
    if (blocked(event.target) || event.altKey || event.ctrlKey || event.metaKey ||
        event.target.closest('a,button,summary')) return;
    const direction = ['ArrowDown','PageDown',' '].includes(event.key) ? (event.shiftKey ? -1 : 1) :
      ['ArrowUp','PageUp'].includes(event.key) ? -1 : 0;
    if (!direction && !['Home','End'].includes(event.key)) return;
    event.preventDefault();
    cancelMomentum();
    if (animation) return;
    if (event.key==='Home') { moveTo(0); return; }
    if (event.key==='End') { moveTo(stop(topics[topics.length-1])); return; }
    const index=currentIndex();
    const start=stop(topics[index]),end=readingEnd(index);
    if ((direction>0 && scrollY<end-3)||(direction<0 && scrollY>start+3)) {
      moveTo(Math.max(start,Math.min(end,scrollY+direction*(innerHeight-header.offsetHeight)*0.85)));
    } else step(direction);
  });
  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    if(event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash=link.getAttribute('href');
    const target=document.getElementById(hash.slice(1));
    if(!target) return;
    event.preventDefault();
    if(location.hash!==hash) history.pushState(null,'',hash);
    moveTo(stop(target),target);
  }));
  const restoreHistory = () => {
    const target=document.getElementById(location.hash.slice(1));
    moveTo(target ? stop(target) : 0,null,true);
  };
  window.addEventListener('popstate',restoreHistory);
  window.addEventListener('hashchange',restoreHistory);
  window.addEventListener('scroll',updateHeader,{passive:true});
  const refresh = () => {
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
      const index=currentIndex();
      const aligned=Math.abs(scrollY-stop(topics[index]))<3;
      cancel();
      root.style.setProperty('--header-height',`${header.offsetHeight}px`);
      if(aligned) window.scrollTo(0,stop(topics[index]));
      updateHeader();
    });
  };
  window.addEventListener('resize',refresh,{passive:true});
  document.querySelectorAll('.faq-item').forEach(item=>item.addEventListener('toggle',refresh));
  reducedMotion.addEventListener('change',refresh);
  window.addEventListener('pageshow',()=>moveTo(0,null,true));
  window.addEventListener('load',()=>moveTo(0,null,true));
  window.scrollTo(0,0);
  updateHeader();
})();
