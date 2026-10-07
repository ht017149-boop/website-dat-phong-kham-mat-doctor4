import './css/style.css';
import './css/home.css';
import { renderHeader, renderFooter, setupHeaderEvents } from './components/layout.js';
import { setupBookingSystem } from './pages/booking.js';
import { initComments } from './pages/comments.js';

function init() {
  const header = document.getElementById('header-container');
  if (header) {
    let active = 'home';
    if (window.location.pathname.includes('gioi-thieu')) active = 'about';
    if (window.location.pathname.includes('lich-kham')) active = 'lookup';
    header.innerHTML = renderHeader(active);
  }

  const footer = document.getElementById('footer-container');
  if (footer) {
    footer.innerHTML = renderFooter();
  }

  setupHeaderEvents();
  setupBookingSystem();
  initComments();
}

init();

