/* ============================================================
   src/components/layout.js — Doctor4 Eye Clinic
   Header & Footer components + Navigation & Auth status
   ============================================================ */

const NAV_LINKS = [
  { id: 'home', label: 'Trang chủ', href: '/index.html' },
  { id: 'about', label: 'Giới thiệu', href: '/gioi-thieu.html' },
  { id: 'services', label: 'Dịch vụ', href: '/index.html#dich-vu' },
  { id: 'doctors', label: 'Bác sĩ', href: '/index.html#doctors' },
  { id: 'contact', label: 'Liên hệ', href: '/index.html#contact' },
];

export function getCurrentUser() {
  try {
    const session = localStorage.getItem('doctor4_session') || sessionStorage.getItem('doctor4_session');
    return session ? JSON.parse(session) : null;
  } catch (e) {
    return null;
  }
}

export function renderHeader(active) {
  const user = getCurrentUser();

  const userActionHtml = user
    ? `
      <div class="nav-user-wrapper" id="navUserWrapper">
        <button class="nav-user-btn" id="navUserBtn" aria-label="Menu tài khoản">
          <span class="nav-user-avatar">${user.name ? user.name.charAt(0).toUpperCase() : '👤'}</span>
          <span class="nav-user-name">${user.name || 'Tài khoản'}</span>
          <span style="font-size: 0.7rem;">▼</span>
        </button>
        <div class="nav-user-dropdown" id="navUserDropdown">
          <div style="padding: 0.5rem 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08);">
            <div style="font-weight: 700; color: #fff; font-size: 0.9rem;">${user.name}</div>
            <div style="color: #94A3B8; font-size: 0.78rem;">${user.email || user.phone}</div>
          </div>
          ${user.role === 'admin' ? `<a href="/admin/index.html" class="nav-dropdown-item">📊 Quản trị Admin</a>` : ''}
          <a href="/index.html#dat-lich" class="nav-dropdown-item">📅 Lịch khám của tôi</a>
          <div class="nav-dropdown-divider"></div>
          <button class="nav-dropdown-item text-danger" id="navBtnLogout">🚪 Đăng xuất</button>
        </div>
      </div>
    `
    : `
      <a href="/dang-nhap.html" class="btn-login" id="navBtnLogin">Đăng nhập</a>
    `;

  return `
  <div class="notice-strip" id="noticeStrip">
    🎉 <strong>Ưu đãi tháng này:</strong> Giảm 30% phí khám tổng quát khi đặt lịch online &nbsp;|&nbsp; Hotline: <strong>1800 1234</strong>
    <button class="notice-close" id="closeNotice" aria-label="Đóng thông báo">✕</button>
  </div>

  <nav class="navbar" id="navbar">
    <div class="nav-inner">
      <a href="/index.html" class="nav-logo" id="navLogo">
        <div class="logo-icon">👁️</div>
        <div class="logo-text">
          <span class="logo-name">Doctor<span>4</span></span>
          <span class="logo-sub">Eye Clinic</span>
        </div>
      </a>

      <ul class="nav-menu" id="navMenu">
        ${NAV_LINKS.map(
          (l) =>
            `<li><a href="${l.href}" class="nav-link${active === l.id ? ' active' : ''}" data-nav="${l.id}">${l.label}</a></li>`
        ).join('')}
      </ul>

      <div class="nav-actions">
        ${userActionHtml}
        <a href="/index.html#dat-lich" class="btn-book-nav" id="navBtnBook">📅 Đặt lịch ngay</a>
      </div>

      <button class="nav-toggle" id="navToggle" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>
  `;
}

export function setupHeaderEvents() {
  const notice = document.getElementById('noticeStrip');
  const closeBtn = document.getElementById('closeNotice');
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  const userBtn = document.getElementById('navUserBtn');
  const userDropdown = document.getElementById('navUserDropdown');
  const logoutBtn = document.getElementById('navBtnLogout');

  if (closeBtn && notice && navbar) {
    closeBtn.addEventListener('click', () => {
      notice.classList.add('hidden');
      navbar.classList.add('notice-gone');
      menu?.classList.add('notice-gone');
    });
  }

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      menu.classList.toggle('open');
    });
  }

  // Toggle user menu dropdown
  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!userDropdown.contains(e.target) && !userBtn.contains(e.target)) {
        userDropdown.classList.remove('show');
      }
    });
  }

  // Handle logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('doctor4_session');
      sessionStorage.removeItem('doctor4_session');
      window.location.reload();
    });
  }

  window.addEventListener('scroll', () => {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 10);
    if (menu) menu.classList.remove('open');
    if (toggle) toggle.classList.remove('open');
  });
}

export function renderFooter() {
  return `
  <footer class="footer" id="contact">
    <div class="footer-top">
      <div class="footer-brand">
        <div class="nav-logo">
          <div class="logo-icon">👁️</div>
          <div class="logo-text">
            <span class="logo-name">Doctor<span>4</span></span>
            <span class="logo-sub">Eye Clinic</span>
          </div>
        </div>
        <p class="footer-tagline">Phòng khám mắt chuyên nghiệp hàng đầu Việt Nam. Cam kết dịch vụ y tế chất lượng cao, tận tâm và đáng tin cậy.</p>
        <div class="footer-socials">
          <a href="#" class="social-btn" aria-label="Facebook">📘</a>
          <a href="#" class="social-btn" aria-label="YouTube">▶️</a>
          <a href="#" class="social-btn" aria-label="Zalo">💬</a>
          <a href="#" class="social-btn" aria-label="Instagram">📸</a>
        </div>
      </div>

      <div>
        <h4 class="footer-col-title">Dịch vụ</h4>
        <ul class="footer-links">
          <li><a href="/index.html#dich-vu">Khám mắt tổng quát</a></li>
          <li><a href="/index.html#dich-vu">Phẫu thuật LASIK</a></li>
          <li><a href="/index.html#dich-vu">Điều trị đục thủy tinh thể</a></li>
          <li><a href="/index.html#dich-vu">Tư vấn kính mắt</a></li>
          <li><a href="/index.html#dich-vu">Khám mắt trẻ em</a></li>
        </ul>
      </div>

      <div>
        <h4 class="footer-col-title">Thông tin</h4>
        <ul class="footer-links">
          <li><a href="/gioi-thieu.html">Về chúng tôi</a></li>
          <li><a href="/index.html#doctors">Đội ngũ bác sĩ</a></li>
          <li><a href="/index.html">Tin tức sức khỏe</a></li>
          <li><a href="/index.html">Câu hỏi thường gặp</a></li>
          <li><a href="/dang-nhap.html">Tài khoản thành viên</a></li>
        </ul>
      </div>

      <div>
        <h4 class="footer-col-title">Liên hệ</h4>
        <div class="footer-contact-items">
          <div class="footer-contact-item">
            <span class="contact-icon">📍</span>
            <div class="contact-info">
              <strong>Địa chỉ</strong>
              123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh
            </div>
          </div>
          <div class="footer-contact-item">
            <span class="contact-icon">📞</span>
            <div class="contact-info">
              <strong>Hotline</strong>
              1800 1234 (miễn phí, 7:00 – 21:00)
            </div>
          </div>
          <div class="footer-contact-item">
            <span class="contact-icon">✉️</span>
            <div class="contact-info">
              <strong>Email</strong>
              info@doctor4.vn
            </div>
          </div>
          <div class="footer-contact-item">
            <span class="contact-icon">🕐</span>
            <div class="contact-info">
              <strong>Giờ làm việc</strong>
              Thứ Hai – Chủ Nhật: 7:00 – 20:00
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <p class="footer-copy">© 2026 <span>Doctor4 Eye Clinic</span>. Tất cả quyền được bảo lưu.</p>
      <nav class="footer-policies">
        <a href="#">Chính sách bảo mật</a>
        <a href="#">Điều khoản sử dụng</a>
        <a href="#">Cookie</a>
      </nav>
    </div>
  </footer>
  `;
}