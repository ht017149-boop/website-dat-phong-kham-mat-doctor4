const NAV_LINKS = [
  { id: 'home', label: 'Trang chủ', href: '#/' },
  { id: 'about', label: 'Giới thiệu', href: '#/gioi-thieu' },
  { id: 'services', label: 'Dịch vụ', href: '#/dich-vu' },
  { id: 'doctors', label: 'Bác sĩ', href: '#/doctors' },
  { id: 'contact', label: 'Liên hệ', href: '#/contact' },
]

export function renderHeader(active) {
  return `
  <div class="notice-strip" id="noticeStrip">
    🎉 <strong>Ưu đãi tháng này:</strong> Giảm 30% phí khám tổng quát khi đặt lịch online &nbsp;|&nbsp; Hotline: <strong>1800 1234</strong>
    <button class="notice-close" id="closeNotice" aria-label="Đóng thông báo">✕</button>
  </div>

  <nav class="navbar" id="navbar">
    <div class="nav-inner">
      <a href="#/" class="nav-logo" id="navLogo">
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
        <a href="#/dang-nhap" class="btn-login" id="navBtnLogin">Đăng nhập</a>
        <a href="#/dat-lich" class="btn-book-nav" id="navBtnBook">📅 Đặt lịch ngay</a>
      </div>

      <button class="nav-toggle" id="navToggle" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>
  `
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
          <li><a href="#/dich-vu">Khám mắt tổng quát</a></li>
          <li><a href="#/dich-vu">Phẫu thuật LASIK</a></li>
          <li><a href="#/dich-vu">Điều trị đục thủy tinh thể</a></li>
          <li><a href="#/dich-vu">Tư vấn kính mắt</a></li>
          <li><a href="#/dich-vu">Khám mắt trẻ em</a></li>
        </ul>
      </div>

      <div>
        <h4 class="footer-col-title">Thông tin</h4>
        <ul class="footer-links">
          <li><a href="#/gioi-thieu">Về chúng tôi</a></li>
          <li><a href="#/doctors">Đội ngũ bác sĩ</a></li>
          <li><a href="#/">Tin tức sức khỏe</a></li>
          <li><a href="#/">Câu hỏi thường gặp</a></li>
          <li><a href="#/">Tuyển dụng</a></li>
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
  `
}