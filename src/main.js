import './css/style.css';
import { renderHeader, renderFooter } from './components/layout.js';

function init() {
  const header = document.getElementById('header-container');
  if (header) {
    // determine active page based on pathname
    let active = 'home';
    if(window.location.pathname.includes('gioi-thieu')) active = 'about';
    header.innerHTML = renderHeader(active);
  }

  const footer = document.getElementById('footer-container');
  if (footer) {
    footer.innerHTML = renderFooter();
  }

  // Setup interactions (mobile menu, notices)
  const notice = document.getElementById('noticeStrip')
  const closeBtn = document.getElementById('closeNotice')
  const navbar = document.getElementById('navbar')
  const toggle = document.getElementById('navToggle')
  const menu = document.getElementById('navMenu')

  if (closeBtn && notice && navbar) {
    closeBtn.addEventListener('click', () => {
      notice.classList.add('hidden')
      navbar.classList.add('notice-gone')
      menu?.classList.add('notice-gone')
    })
  }

  toggle?.addEventListener('click', () => {
    toggle.classList.toggle('open')
    menu?.classList.toggle('open')
  })

  window.addEventListener('scroll', () => {
    if (!navbar) return
    navbar.classList.toggle('scrolled', window.scrollY > 10)
    if (menu) menu.classList.remove('open')
    if (toggle) toggle.classList.remove('open')
  })
}

init();
