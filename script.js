
const button = document.querySelector('.menu-button');
const nav = document.querySelector('.site-header nav');
button.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  button.setAttribute('aria-expanded', open ? 'true' : 'false');
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  button.setAttribute('aria-expanded','false');
}));
document.getElementById('year').textContent = new Date().getFullYear();
