import './style.css'
import { renderHeader, renderFooter } from './layout.js'
import { renderHome } from './pages/home.js'
import { renderAbout } from './pages/about.js'

const routes = {
  '/': { title: 'Trang chủ', render: renderHome, active: 'home' },
  '/gioi-thieu': { title: 'Giới thiệu', render: renderAbout, active: 'about' },
  '/dich-vu': { title: 'Dịch vụ', render: renderHome, active: 'services', anchor: 'dich-vu' },
  '/doctors': { title: 'Bác sĩ', render: renderHome, active: 'doctors', anchor: 'doctors' },
  '/dat-lich': { title: 'Đặt lịch', render: renderHome, active: 'home', anchor: 'dat-lich' },
  '/dang-nhap': { title: 'Đăng nhập', render: renderHome, active: 'home' },
}

function parseHash() {
  const hash = location.hash.replace(/^#/, '') || '/'
  return hash.startsWith('/') ? hash : '/' + hash
}

function scrollToAnchor(id) {
  const el = document.getElementById(id)
  if (!el) return
  requestAnimationFrame(() => {
    const offset = -80
    const top = el.getBoundingClientRect().top + window.scrollY + offset
    window.scrollTo({ top, behavior: 'smooth' })
  })
}

function setupInteractions() {
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

function render() {
  const routeDef = routes[parseHash()] || routes['/']
  document.title = `${routeDef.title} – Doctor4 Phòng Khám Mắt`

  const app = document.querySelector('#app')
  app.innerHTML = `
    ${renderHeader(routeDef.active)}
    ${routeDef.render()}
    ${renderFooter()}
  `

  setupInteractions()

  if (routeDef.anchor) {
    scrollToAnchor(routeDef.anchor)
  } else {
    window.scrollTo({ top: 0 })
  }
}

window.addEventListener('hashchange', render)
render()