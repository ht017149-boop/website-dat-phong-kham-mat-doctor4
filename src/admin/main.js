/* ============================================================
   src/admin/main.js — Doctor4 Eye Clinic
   Controller trung tâm cho Trang Quản trị Admin
   ============================================================ */

import '../css/admin.css';
import { AdminAuth } from './admin-auth.js';
import { DoctorManager, SAMPLE_AVATARS } from './doctor-manager.js';

// Khởi tạo container chính
const appRoot = document.getElementById('admin-app') || document.body;

// Trạng thái hiện tại của ứng dụng Admin
let currentTab = 'doctors'; // 'doctors' | 'dashboard' | 'appointments' | 'settings'
let filterState = {
  query: '',
  specialty: 'all',
  status: 'all'
};
let doctorToDelete = null;
let doctorToEdit = null;
let doctorToView = null;

// Khởi chạy ứng dụng
function init() {
  if (AdminAuth.isAuthenticated()) {
    renderAdminPortal();
  } else {
    renderLoginView();
  }
}

// ─────────────────────────────────────────────────────────────
// 1. GIAO DIỆN ĐĂNG NHẬP ADMIN (TÁCH BIỆT HOÀN TOÀN)
// ─────────────────────────────────────────────────────────────
function renderLoginView() {
  appRoot.innerHTML = `
    <div class="adm-login-wrapper">
      <div class="adm-login-bg-glow"></div>
      
      <div class="adm-login-card">
        <div class="adm-login-header">
          <div class="adm-login-logo">👁️</div>
          <h1>Doctor4 Admin</h1>
          <p>Hệ thống Quản trị & Điều hành Phòng khám Mắt</p>
        </div>

        <form id="adm-login-form">
          <div class="adm-form-group">
            <label class="adm-form-label" for="adm-username">Tài khoản quản trị</label>
            <div class="adm-input-icon-wrap">
              <span class="adm-input-icon">🛡️</span>
              <input 
                type="text" 
                id="adm-username" 
                class="adm-input" 
                placeholder="Nhập 'admin' hoặc email" 
                value="admin"
                required 
                autocomplete="username"
              />
            </div>
          </div>

          <div class="adm-form-group">
            <label class="adm-form-label" for="adm-password">Mật khẩu</label>
            <div class="adm-input-icon-wrap">
              <span class="adm-input-icon">🔒</span>
              <input 
                type="password" 
                id="adm-password" 
                class="adm-input" 
                placeholder="Nhập mật khẩu (123456)" 
                value="123456"
                required 
                autocomplete="current-password"
              />
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--adm-text-muted); cursor: pointer;">
              <input type="checkbox" id="adm-remember" checked style="accent-color: var(--adm-primary);"> Ghi nhớ đăng nhập
            </label>
          </div>

          <button type="submit" class="adm-btn-primary" id="adm-btn-submit">
            <span>Đăng nhập Quản trị</span>
            <span>→</span>
          </button>
        </form>

        <div class="adm-demo-account-hint">
          <div style="font-weight: 600; color: #fff; margin-bottom: 4px;">🔑 Thông tin đăng nhập mặc định:</div>
          <div>Tài khoản: <strong>admin</strong> (hoặc admin@doctor4.vn)</div>
          <div>Mật khẩu: <strong>123456</strong></div>
          <button type="button" class="adm-quick-fill-btn" id="btn-quick-fill">⚡ Tự động điền tài khoản</button>
        </div>

        <a href="/" class="adm-back-to-site">← Quay về trang chủ website Doctor4</a>
      </div>
    </div>
    <div id="adm-toast-container" class="adm-toast-container"></div>
  `;

  // Gắn sự kiện Form đăng nhập
  const form = document.getElementById('adm-login-form');
  const quickFillBtn = document.getElementById('btn-quick-fill');

  quickFillBtn?.addEventListener('click', () => {
    document.getElementById('adm-username').value = 'admin';
    document.getElementById('adm-password').value = '123456';
    showToast('Đã điền tài khoản & mật khẩu mẫu!', 'info');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const userVal = document.getElementById('adm-username').value.trim();
    const passVal = document.getElementById('adm-password').value.trim();
    const rememberVal = document.getElementById('adm-remember').checked;

    const res = AdminAuth.login(userVal, passVal, rememberVal);
    if (res.success) {
      showToast('Đăng nhập thành công! Chào mừng Quản trị viên.', 'success');
      setTimeout(() => {
        renderAdminPortal();
      }, 500);
    } else {
      showToast(res.message, 'error');
    }
  });
}

// ─────────────────────────────────────────────────────────────
// 2. GIAO DIỆN CHÍNH ADMIN PORTAL (LAYOUT & CHỨC NĂNG)
// ─────────────────────────────────────────────────────────────
function renderAdminPortal() {
  const admin = AdminAuth.getAdminUser() || { displayName: 'Quản Trị Viên', role: 'Super Admin' };
  const allDocs = DoctorManager.getDoctors();

  appRoot.innerHTML = `
    <div class="adm-layout">
      <!-- Sidebar -->
      <aside class="adm-sidebar" id="adm-sidebar">
        <div class="adm-sidebar-brand">
          <div class="adm-brand-icon">👁️</div>
          <div class="adm-brand-text">
            <h2>Doctor4</h2>
            <span class="adm-brand-badge">ADMIN PORTAL</span>
          </div>
        </div>

        <div class="adm-nav">
          <div class="adm-nav-heading">Quản lý chuyên môn</div>
          
          <div class="adm-nav-item ${currentTab === 'doctors' ? 'active' : ''}" data-tab="doctors">
            <span class="adm-nav-icon">👨‍⚕️</span>
            <span>Quản lý Bác sĩ</span>
            <span class="adm-nav-tag" id="nav-doc-count">${allDocs.length}</span>
          </div>

          <div class="adm-nav-item ${currentTab === 'appointments' ? 'active' : ''}" data-tab="appointments">
            <span class="adm-nav-icon">📅</span>
            <span>Lịch hẹn khám</span>
          </div>

          <div class="adm-nav-heading">Hệ thống</div>

          <div class="adm-nav-item ${currentTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
            <span class="adm-nav-icon">📊</span>
            <span>Tổng quan thống kê</span>
          </div>

          <div class="adm-nav-item ${currentTab === 'settings' ? 'active' : ''}" data-tab="settings">
            <span class="adm-nav-icon">⚙️</span>
            <span>Cài đặt hệ thống</span>
          </div>
        </div>

        <div class="adm-sidebar-footer">
          <div class="adm-user-card">
            <div class="adm-user-avatar">AD</div>
            <div class="adm-user-info">
              <div class="adm-user-name">${admin.displayName}</div>
              <div class="adm-user-role">${admin.role}</div>
            </div>
            <button class="adm-btn-logout-icon" id="btn-logout" title="Đăng xuất">🚪</button>
          </div>
        </div>
      </aside>

      <!-- Main Area -->
      <div class="adm-main-wrap">
        <!-- Top Header -->
        <header class="adm-header">
          <div class="adm-header-left">
            <button class="adm-mobile-toggle" id="btn-toggle-sidebar">☰</button>
            <div class="adm-breadcrumb">
              <span>Trang quản trị</span>
              <span>/</span>
              <span class="adm-breadcrumb-active" id="breadcrumb-title">
                ${currentTab === 'doctors' ? 'Quản lý Bác sĩ mắt' : 'Bảng điều khiển'}
              </span>
            </div>
          </div>

          <div class="adm-header-right">
            <button class="adm-header-btn" id="btn-reset-db" title="Khôi phục danh sách bác sĩ mẫu ban đầu">
              <span>🔄 Khôi phục mẫu</span>
            </button>
            <a href="/" target="_blank" class="adm-header-btn">
              <span>🌐 Xem Website</span>
              <span>↗</span>
            </a>
          </div>
        </header>

        <!-- Dynamic Content View -->
        <main class="adm-content" id="adm-main-content">
          ${renderTabContent()}
        </main>
      </div>
    </div>

    <!-- Modals Container -->
    <div id="adm-modals-root"></div>

    <!-- Toast Notifications -->
    <div id="adm-toast-container" class="adm-toast-container"></div>
  `;

  bindPortalEvents();
}

// ─────────────────────────────────────────────────────────────
// 3. RENDER NỘI DUNG TỪNG TAB
// ─────────────────────────────────────────────────────────────
function renderTabContent() {
  if (currentTab === 'doctors') {
    return renderDoctorManagementView();
  } else if (currentTab === 'dashboard') {
    return renderDashboardView();
  } else if (currentTab === 'appointments') {
    return renderAppointmentsPlaceholderView();
  } else {
    return renderSettingsPlaceholderView();
  }
}

// Tab: QUẢN LÝ BÁC SĨ (CRUD TOÀN DIỆN)
function renderDoctorManagementView() {
  const allDocs = DoctorManager.getDoctors();
  const filteredDocs = DoctorManager.filterDoctors(allDocs, filterState);

  // Thống kê nhanh
  const totalDocs = allDocs.length;
  const activeDocs = allDocs.filter(d => d.status === 'active').length;
  const totalPatients = allDocs.reduce((sum, d) => sum + (d.patientsCount || 0), 0);
  const avgExp = totalDocs ? (allDocs.reduce((sum, d) => sum + (d.experience || 0), 0) / totalDocs).toFixed(1) : 0;

  return `
    <div class="adm-page-header">
      <div class="adm-page-title">
        <h1>Quản lý Đội ngũ Bác sĩ Mắt</h1>
        <p>Thêm mới, chỉnh sửa thông tin, ca trực, chuyên khoa và quản lý trạng thái hoạt động của bác sĩ</p>
      </div>
      <button class="adm-btn-create" id="btn-open-create-modal">
        <span>➕ Thêm Bác Sĩ Mới</span>
      </button>
    </div>

    <!-- Thống kê nhanh 4 Cards -->
    <div class="adm-stats-grid">
      <div class="adm-stat-card">
        <div class="adm-stat-icon primary">👨‍⚕️</div>
        <div class="adm-stat-meta">
          <h3>Tổng số Bác sĩ</h3>
          <div class="stat-val">${totalDocs}</div>
        </div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon success">🟢</div>
        <div class="adm-stat-meta">
          <h3>Bác sĩ Đang Trực</h3>
          <div class="stat-val">${activeDocs}</div>
        </div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon warning">👥</div>
        <div class="adm-stat-meta">
          <h3>Bệnh nhân đã phục vụ</h3>
          <div class="stat-val">${totalPatients.toLocaleString('vi-VN')}+</div>
        </div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon accent">🎓</div>
        <div class="adm-stat-meta">
          <h3>Kinh nghiệm trung bình</h3>
          <div class="stat-val">${avgExp} năm</div>
        </div>
      </div>
    </div>

    <!-- Toolbar: Tìm kiếm & Lọc chuyên khoa -->
    <div class="adm-toolbar">
      <div class="adm-filters-left">
        <div class="adm-search-input-wrap">
          <span class="adm-search-icon">🔍</span>
          <input 
            type="text" 
            id="filter-search" 
            placeholder="Tìm theo tên bác sĩ, chuyên khoa, SĐT..." 
            value="${escapeHtml(filterState.query)}"
          />
        </div>

        <select class="adm-select" id="filter-specialty">
          <option value="all" ${filterState.specialty === 'all' ? 'selected' : ''}>Tất cả chuyên khoa</option>
          <option value="lasik" ${filterState.specialty === 'lasik' ? 'selected' : ''}>Phẫu thuật LASIK / SMILE</option>
          <option value="glocom" ${filterState.specialty === 'glocom' ? 'selected' : ''}>Glôcôm & Võng mạc</option>
          <option value="cataract" ${filterState.specialty === 'cataract' ? 'selected' : ''}>Đục thủy tinh thể (Phaco)</option>
          <option value="pediatric" ${filterState.specialty === 'pediatric' ? 'selected' : ''}>Nhãn khoa Trẻ em & Khúc xạ</option>
          <option value="general" ${filterState.specialty === 'general' ? 'selected' : ''}>Khám Mắt Tổng Quát</option>
        </select>

        <select class="adm-select" id="filter-status">
          <option value="all" ${filterState.status === 'all' ? 'selected' : ''}>Tất cả trạng thái</option>
          <option value="active" ${filterState.status === 'active' ? 'selected' : ''}>Đang trực khám</option>
          <option value="busy" ${filterState.status === 'busy' ? 'selected' : ''}>Bận phẫu thuật</option>
          <option value="off" ${filterState.status === 'off' ? 'selected' : ''}>Tạm nghỉ / Phép</option>
        </select>
      </div>

      <div style="font-size: 13px; color: var(--adm-text-muted);">
        Hiển thị: <strong>${filteredDocs.length}</strong> / ${allDocs.length} bác sĩ
      </div>
    </div>

    <!-- Table danh sách bác sĩ -->
    <div class="adm-table-container">
      ${filteredDocs.length === 0 ? `
        <div class="adm-empty-state">
          <div class="adm-empty-icon">🔎</div>
          <h3>Không tìm thấy bác sĩ phù hợp</h3>
          <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc.</p>
        </div>
      ` : `
        <table class="adm-table">
          <thead>
            <tr>
              <th>Bác sĩ / Học vị</th>
              <th>Chuyên khoa & Phòng khám</th>
              <th>Kinh nghiệm</th>
              <th>Liên hệ & Ca trực</th>
              <th>Trạng thái</th>
              <th style="text-align: right;">Hành động</th>
            </tr>
          </thead>
          <tbody>
            ${filteredDocs.map(doc => renderDoctorRow(doc)).join('')}
          </tbody>
        </table>
      `}
    </div>
  `;
}

function renderDoctorRow(doc) {
  const statusBadges = {
    active: '<span class="adm-badge adm-badge-active"><span class="adm-badge-dot"></span> Đang trực</span>',
    busy: '<span class="adm-badge adm-badge-busy"><span class="adm-badge-dot"></span> Bận mổ</span>',
    off: '<span class="adm-badge adm-badge-off"><span class="adm-badge-dot"></span> Nghỉ trực</span>'
  };

  return `
    <tr data-doc-id="${doc.id}">
      <td>
        <div class="adm-doc-cell">
          <img src="${doc.avatar || SAMPLE_AVATARS[0]}" alt="${doc.name}" class="adm-doc-avatar" onerror="this.src='${SAMPLE_AVATARS[0]}'"/>
          <div class="adm-doc-name-group">
            <span class="adm-doc-name">${escapeHtml(doc.name)}</span>
            <span class="adm-doc-degree">${escapeHtml(doc.degree)}</span>
          </div>
        </div>
      </td>
      <td>
        <span class="adm-spec-tag">${escapeHtml(doc.specialty)}</span>
        <div style="font-size: 12px; color: var(--adm-text-dim); margin-top: 4px;">📍 ${escapeHtml(doc.room)}</div>
      </td>
      <td>
        <div style="font-weight: 600; color: #fff;">🎓 ${doc.experience} năm KN</div>
        <div style="font-size: 12px; color: var(--adm-warning); margin-top: 2px;">⭐ ${doc.rating || 5.0} (${doc.reviewsCount || 0} ĐG)</div>
      </td>
      <td>
        <div style="color: #fff; font-size: 13px;">📞 ${escapeHtml(doc.phone)}</div>
        <div style="font-size: 12px; color: var(--adm-text-muted); margin-top: 2px;">🕒 ${escapeHtml(doc.schedule)}</div>
      </td>
      <td>
        <div style="cursor: pointer;" class="btn-toggle-status" data-id="${doc.id}" title="Nhấn để đổi nhanh trạng thái">
          ${statusBadges[doc.status] || statusBadges.active}
        </div>
      </td>
      <td>
        <div class="adm-actions" style="justify-content: flex-end;">
          <button class="adm-btn-action view btn-view-doc" data-id="${doc.id}" title="Xem chi tiết hồ sơ">
            👁️
          </button>
          <button class="adm-btn-action edit btn-edit-doc" data-id="${doc.id}" title="Chỉnh sửa thông tin">
            ✏️
          </button>
          <button class="adm-btn-action delete btn-delete-doc" data-id="${doc.id}" title="Xóa bác sĩ">
            🗑️
          </button>
        </div>
      </td>
    </tr>
  `;
}

// Tab: BẢNG ĐIỀU KHIỂN THỐNG KÊ
function renderDashboardView() {
  const allDocs = DoctorManager.getDoctors();
  return `
    <div class="adm-page-header">
      <div class="adm-page-title">
        <h1>Bảng Điều Khiển Tổng Quan</h1>
        <p>Báo cáo hoạt động phòng khám, số ca khám và trạng thái nhân sự</p>
      </div>
    </div>

    <div class="adm-stats-grid">
      <div class="adm-stat-card">
        <div class="adm-stat-icon primary">📅</div>
        <div class="adm-stat-meta">
          <h3>Tổng lịch hẹn hôm nay</h3>
          <div class="stat-val">42 ca</div>
        </div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon success">👨‍⚕️</div>
        <div class="adm-stat-meta">
          <h3>Bác sĩ đang hoạt động</h3>
          <div class="stat-val">${allDocs.filter(d => d.status === 'active').length} / ${allDocs.length}</div>
        </div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon warning">⭐</div>
        <div class="adm-stat-meta">
          <h3>Tỉ lệ hài lòng</h3>
          <div class="stat-val">99.2%</div>
        </div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon accent">🏥</div>
        <div class="adm-stat-meta">
          <h3>Phòng khám hoạt động</h3>
          <div class="stat-val">5 Phòng</div>
        </div>
      </div>
    </div>

    <div style="background: var(--adm-bg-surface); border: 1px solid var(--adm-border); border-radius: var(--adm-radius-lg); padding: 24px; margin-top: 24px;">
      <h3 style="color: #fff; margin-bottom: 12px;">📊 Lịch trực phòng khám mắt Doctor4</h3>
      <p style="color: var(--adm-text-muted); font-size: 14px; margin-bottom: 20px;">
        Đội ngũ gồm ${allDocs.length} bác sĩ chuyên khoa phụ trách các phòng mổ LASIK, Phaco, Glôcôm và Nhãn nhi.
      </p>
      <button class="adm-btn-create" onclick="document.querySelector('[data-tab=\\'doctors\\']').click()">
        👉 Chuyển sang Quản lý danh sách Bác sĩ
      </button>
    </div>
  `;
}

function renderAppointmentsPlaceholderView() {
  return `
    <div class="adm-page-header">
      <div class="adm-page-title">
        <h1>Quản lý Lịch Hẹn Khám Mắt</h1>
        <p>Danh sách các ca đặt lịch khám từ bệnh nhân trực tuyến</p>
      </div>
    </div>
    <div style="background: var(--adm-bg-surface); border: 1px solid var(--adm-border); border-radius: var(--adm-radius-lg); padding: 40px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 12px;">📅</div>
      <h3 style="color: #fff; margin-bottom: 8px;">Dữ liệu lịch hẹn đang được đồng bộ</h3>
      <p style="color: var(--adm-text-muted); font-size: 14px;">Bệnh nhân đặt lịch trực tiếp trên trang chủ sẽ xuất hiện tại đây.</p>
    </div>
  `;
}

function renderSettingsPlaceholderView() {
  return `
    <div class="adm-page-header">
      <div class="adm-page-title">
        <h1>Cài Đặt Hệ Thống</h1>
        <p>Cấu hình tài khoản quản trị và thông số phòng khám</p>
      </div>
    </div>
    <div style="background: var(--adm-bg-surface); border: 1px solid var(--adm-border); border-radius: var(--adm-radius-lg); padding: 24px; max-width: 600px;">
      <h3 style="color: #fff; margin-bottom: 16px;">Tài khoản Quản trị viên</h3>
      <div style="color: var(--adm-text-muted); font-size: 14px; line-height: 1.8;">
        <div>Tên hiển thị: <strong style="color: #fff;">Quản Trị Viên (Admin)</strong></div>
        <div>Tên đăng nhập: <strong style="color: var(--adm-primary);">admin</strong></div>
        <div>Mật khẩu: <strong style="color: var(--adm-primary);">123456</strong></div>
        <div>Email quản trị: <strong style="color: #fff;">admin@doctor4.vn</strong></div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// 4. MODALS (THÊM, SỬA, XÓA, XEM CHI TIẾT)
// ─────────────────────────────────────────────────────────────
function openDoctorModal(doc = null) {
  const isEdit = !!doc;
  doctorToEdit = doc;

  const modalRoot = document.getElementById('adm-modals-root');
  modalRoot.innerHTML = `
    <div class="adm-modal-overlay" id="adm-modal-overlay">
      <div class="adm-modal">
        <div class="adm-modal-header">
          <h3>${isEdit ? '✏️ Chỉnh sửa thông tin Bác sĩ' : '➕ Thêm Bác sĩ Mới'}</h3>
          <button class="adm-modal-close" id="btn-close-modal">✕</button>
        </div>

        <form id="adm-doctor-form">
          <div class="adm-modal-body">
            <!-- Họ tên & Học vị -->
            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-form-label">Họ và tên bác sĩ *</label>
                <input 
                  type="text" 
                  id="doc-form-name" 
                  class="adm-input adm-input-no-icon" 
                  placeholder="VD: Nguyễn Văn A" 
                  value="${doc ? escapeHtml(doc.name) : ''}" 
                  required 
                />
              </div>

              <div class="adm-form-group">
                <label class="adm-form-label">Học vị / Học hàm *</label>
                <input 
                  type="text" 
                  id="doc-form-degree" 
                  class="adm-input adm-input-no-icon" 
                  placeholder="VD: BS. CKII, TS. Bác sĩ..." 
                  value="${doc ? escapeHtml(doc.degree) : 'BS. Chuyên khoa I'}" 
                  required 
                />
              </div>
            </div>

            <!-- Chuyên khoa & Mã chuyên khoa -->
            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-form-label">Chuyên khoa *</label>
                <select id="doc-form-specialty-code" class="adm-input adm-input-no-icon">
                  <option value="lasik" ${doc?.specialtyCode === 'lasik' ? 'selected' : ''}>Phẫu thuật LASIK / SMILE</option>
                  <option value="glocom" ${doc?.specialtyCode === 'glocom' ? 'selected' : ''}>Glôcôm & Võng mạc</option>
                  <option value="cataract" ${doc?.specialtyCode === 'cataract' ? 'selected' : ''}>Đục thủy tinh thể (Phaco)</option>
                  <option value="pediatric" ${doc?.specialtyCode === 'pediatric' ? 'selected' : ''}>Nhãn khoa Trẻ em & Khúc xạ</option>
                  <option value="general" ${doc?.specialtyCode === 'general' ? 'selected' : ''}>Khám Mắt Tổng Quát</option>
                </select>
              </div>

              <div class="adm-form-group">
                <label class="adm-form-label">Tên hiển thị chuyên khoa *</label>
                <input 
                  type="text" 
                  id="doc-form-specialty" 
                  class="adm-input adm-input-no-icon" 
                  placeholder="VD: Nhãn khoa – Phẫu thuật LASIK" 
                  value="${doc ? escapeHtml(doc.specialty) : 'Nhãn khoa – Phẫu thuật LASIK'}" 
                  required 
                />
              </div>
            </div>

            <!-- Kinh nghiệm & Phòng khám -->
            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-form-label">Số năm kinh nghiệm</label>
                <input 
                  type="number" 
                  id="doc-form-exp" 
                  class="adm-input adm-input-no-icon" 
                  min="0" 
                  max="60" 
                  value="${doc ? doc.experience : 10}" 
                />
              </div>

              <div class="adm-form-group">
                <label class="adm-form-label">Phòng khám / Phòng trực</label>
                <input 
                  type="text" 
                  id="doc-form-room" 
                  class="adm-input adm-input-no-icon" 
                  placeholder="VD: Phòng 102 - Khám Glôcôm" 
                  value="${doc ? escapeHtml(doc.room) : 'Phòng 101 - Khám Mắt Chuyên Sâu'}" 
                />
              </div>
            </div>

            <!-- Số điện thoại & Email -->
            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-form-label">Số điện thoại liên hệ</label>
                <input 
                  type="text" 
                  id="doc-form-phone" 
                  class="adm-input adm-input-no-icon" 
                  placeholder="VD: 0912 345 678" 
                  value="${doc ? escapeHtml(doc.phone) : '0912 000 999'}" 
                />
              </div>

              <div class="adm-form-group">
                <label class="adm-form-label">Email làm việc</label>
                <input 
                  type="email" 
                  id="doc-form-email" 
                  class="adm-input adm-input-no-icon" 
                  placeholder="VD: bacsi@doctor4.vn" 
                  value="${doc ? escapeHtml(doc.email) : 'doctor@doctor4.vn'}" 
                />
              </div>
            </div>

            <!-- Lịch trực & Trạng thái -->
            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-form-label">Lịch làm việc</label>
                <input 
                  type="text" 
                  id="doc-form-schedule" 
                  class="adm-input adm-input-no-icon" 
                  placeholder="VD: Thứ 2, 4, 6 (08:00 - 17:00)" 
                  value="${doc ? escapeHtml(doc.schedule) : 'Thứ 2 - Thứ 6 (08:00 - 17:00)'}" 
                />
              </div>

              <div class="adm-form-group">
                <label class="adm-form-label">Trạng thái hiện tại</label>
                <select id="doc-form-status" class="adm-input adm-input-no-icon">
                  <option value="active" ${doc?.status === 'active' ? 'selected' : ''}>🟢 Đang trực khám</option>
                  <option value="busy" ${doc?.status === 'busy' ? 'selected' : ''}>🟡 Bận phẫu thuật</option>
                  <option value="off" ${doc?.status === 'off' ? 'selected' : ''}>⚪ Tạm nghỉ / Nghỉ phép</option>
                </select>
              </div>
            </div>

            <!-- Ảnh đại diện -->
            <div class="adm-form-group">
              <label class="adm-form-label">Ảnh đại diện (URL ảnh hoặc chọn mẫu)</label>
              <div class="adm-avatar-preview-wrap">
                <img id="avatar-preview-img" src="${doc?.avatar || SAMPLE_AVATARS[0]}" class="adm-avatar-large" alt="Preview"/>
                <div style="flex: 1;">
                  <input 
                    type="url" 
                    id="doc-form-avatar" 
                    class="adm-input adm-input-no-icon" 
                    placeholder="Dán link ảnh tại đây..." 
                    value="${doc?.avatar || SAMPLE_AVATARS[0]}" 
                  />
                  <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;">
                    ${SAMPLE_AVATARS.map((url, i) => `
                      <img 
                        src="${url}" 
                        class="btn-pick-sample-avatar" 
                        data-url="${url}"
                        style="width: 28px; height: 28px; border-radius: 6px; cursor: pointer; border: 1px solid var(--adm-border);"
                        title="Chọn ảnh mẫu ${i + 1}"
                      />
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>

            <!-- Giới thiệu / Bio -->
            <div class="adm-form-group">
              <label class="adm-form-label">Mô tả giới thiệu / Thành tựu nổi bật</label>
              <textarea 
                id="doc-form-bio" 
                class="adm-input adm-input-no-icon" 
                rows="3" 
                placeholder="Giới thiệu kinh nghiệm và chuyên môn của bác sĩ..."
              >${doc ? escapeHtml(doc.bio) : ''}</textarea>
            </div>
          </div>

          <div class="adm-modal-footer">
            <button type="button" class="adm-btn-secondary" id="btn-cancel-modal">Hủy bỏ</button>
            <button type="submit" class="adm-btn-create">
              <span>💾 ${isEdit ? 'Lưu thay đổi' : 'Thêm Bác sĩ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Gắn sự kiện modal
  const overlay = document.getElementById('adm-modal-overlay');
  const closeBtn = document.getElementById('btn-close-modal');
  const cancelBtn = document.getElementById('btn-cancel-modal');
  const form = document.getElementById('adm-doctor-form');
  const avatarInput = document.getElementById('doc-form-avatar');
  const avatarPreview = document.getElementById('avatar-preview-img');

  const closeModal = () => { modalRoot.innerHTML = ''; };

  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Chọn ảnh mẫu
  modalRoot.querySelectorAll('.btn-pick-sample-avatar').forEach(img => {
    img.addEventListener('click', () => {
      const url = img.getAttribute('data-url');
      avatarInput.value = url;
      avatarPreview.src = url;
    });
  });

  avatarInput?.addEventListener('input', () => {
    avatarPreview.src = avatarInput.value || SAMPLE_AVATARS[0];
  });

  // Tự động gợi ý tên chuyên khoa khi đổi select
  const specCodeSelect = document.getElementById('doc-form-specialty-code');
  const specTextInput = document.getElementById('doc-form-specialty');
  specCodeSelect?.addEventListener('change', () => {
    const mapName = {
      lasik: 'Nhãn khoa – Phẫu thuật LASIK',
      glocom: 'Glôcôm – Bệnh võng mạc',
      cataract: 'Đục thủy tinh thể – Phẫu thuật Phaco',
      pediatric: 'Nhãn khoa trẻ em – Khúc xạ',
      general: 'Khám Mắt Tổng Quát & Đo Khúc Xạ'
    };
    if (mapName[specCodeSelect.value]) {
      specTextInput.value = mapName[specCodeSelect.value];
    }
  });

  // Submit form
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const docData = {
      name: document.getElementById('doc-form-name').value,
      degree: document.getElementById('doc-form-degree').value,
      specialtyCode: document.getElementById('doc-form-specialty-code').value,
      specialty: document.getElementById('doc-form-specialty').value,
      experience: document.getElementById('doc-form-exp').value,
      room: document.getElementById('doc-form-room').value,
      phone: document.getElementById('doc-form-phone').value,
      email: document.getElementById('doc-form-email').value,
      schedule: document.getElementById('doc-form-schedule').value,
      status: document.getElementById('doc-form-status').value,
      avatar: document.getElementById('doc-form-avatar').value,
      bio: document.getElementById('doc-form-bio').value
    };

    if (isEdit) {
      DoctorManager.updateDoctor(doc.id, docData);
      showToast(`Đã cập nhật thông tin bác sĩ ${docData.name}!`, 'success');
    } else {
      DoctorManager.createDoctor(docData);
      showToast(`Đã thêm bác sĩ mới: ${docData.name}!`, 'success');
    }

    closeModal();
    refreshMainView();
  });
}

// Modal Xem Chi Tiết Bác Sĩ
function openDoctorViewModal(doc) {
  const modalRoot = document.getElementById('adm-modals-root');
  modalRoot.innerHTML = `
    <div class="adm-modal-overlay" id="adm-modal-overlay">
      <div class="adm-modal" style="max-width: 500px;">
        <div class="adm-modal-header">
          <h3>👨‍⚕️ Hồ sơ Bác sĩ</h3>
          <button class="adm-modal-close" id="btn-close-view-modal">✕</button>
        </div>
        <div class="adm-modal-body" style="text-align: center;">
          <img src="${doc.avatar}" alt="${doc.name}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid var(--adm-primary); margin-bottom: 12px;"/>
          <h2 style="color: #fff; font-size: 20px;">${escapeHtml(doc.name)}</h2>
          <p style="color: var(--adm-primary); font-weight: 600; font-size: 14px; margin-bottom: 16px;">${escapeHtml(doc.degree)}</p>

          <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 16px; text-align: left; font-size: 13px; line-height: 1.8;">
            <div>🏥 <strong>Chuyên khoa:</strong> ${escapeHtml(doc.specialty)}</div>
            <div>📍 <strong>Phòng khám:</strong> ${escapeHtml(doc.room)}</div>
            <div>🎓 <strong>Kinh nghiệm:</strong> ${doc.experience} năm (${doc.patientsCount || 0}+ ca khám)</div>
            <div>📞 <strong>Điện thoại:</strong> ${escapeHtml(doc.phone)}</div>
            <div>✉️ <strong>Email:</strong> ${escapeHtml(doc.email)}</div>
            <div>🕒 <strong>Lịch trực:</strong> ${escapeHtml(doc.schedule)}</div>
            <div>⭐ <strong>Đánh giá:</strong> ${doc.rating || 5.0} / 5.0 (${doc.reviewsCount || 0} lượt)</div>
          </div>

          <div style="margin-top: 16px; text-align: left; font-size: 13px; color: var(--adm-text-muted); background: rgba(56, 189, 248, 0.05); padding: 12px; border-radius: 8px;">
            💬 <em>"${escapeHtml(doc.bio || 'Chưa có thông tin giới thiệu.')}"</em>
          </div>
        </div>
        <div class="adm-modal-footer">
          <button type="button" class="adm-btn-secondary" id="btn-close-view-footer">Đóng</button>
          <button type="button" class="adm-btn-create" id="btn-view-to-edit">✏️ Chỉnh sửa bác sĩ này</button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { modalRoot.innerHTML = ''; };
  document.getElementById('btn-close-view-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-close-view-footer')?.addEventListener('click', closeModal);
  document.getElementById('adm-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'adm-modal-overlay') closeModal();
  });
  document.getElementById('btn-view-to-edit')?.addEventListener('click', () => {
    closeModal();
    openDoctorModal(doc);
  });
}

// Modal Xác Nhận Xóa Bác Sĩ
function openDeleteConfirmModal(doc) {
  doctorToDelete = doc;
  const modalRoot = document.getElementById('adm-modals-root');
  modalRoot.innerHTML = `
    <div class="adm-modal-overlay" id="adm-modal-overlay">
      <div class="adm-modal" style="max-width: 440px;">
        <div class="adm-modal-header" style="border-bottom: none; padding-bottom: 0;">
          <h3 style="color: var(--adm-danger);">⚠️ Xác nhận xóa Bác sĩ</h3>
          <button class="adm-modal-close" id="btn-close-del-modal">✕</button>
        </div>
        <div class="adm-modal-body" style="text-align: center; padding: 24px;">
          <div style="font-size: 48px; margin-bottom: 12px;">🗑️</div>
          <p style="color: #fff; font-size: 15px; margin-bottom: 8px;">
            Bạn có chắc chắn muốn xóa bác sĩ <strong>${escapeHtml(doc.name)}</strong> không?
          </p>
          <p style="color: var(--adm-text-dim); font-size: 13px;">
            Hành động này sẽ xóa dữ liệu bác sĩ khỏi hệ thống quản lý.
          </p>
        </div>
        <div class="adm-modal-footer" style="justify-content: center;">
          <button type="button" class="adm-btn-secondary" id="btn-cancel-del">Hủy bỏ</button>
          <button type="button" class="adm-btn-danger" id="btn-confirm-delete">Xác nhận Xóa</button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { modalRoot.innerHTML = ''; };
  document.getElementById('btn-close-del-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-del')?.addEventListener('click', closeModal);
  document.getElementById('adm-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'adm-modal-overlay') closeModal();
  });

  document.getElementById('btn-confirm-delete')?.addEventListener('click', () => {
    DoctorManager.deleteDoctor(doc.id);
    showToast(`Đã xóa bác sĩ ${doc.name} khỏi hệ thống.`, 'info');
    closeModal();
    refreshMainView();
  });
}

// ─────────────────────────────────────────────────────────────
// 5. EVENT BINDINGS & TOAST
// ─────────────────────────────────────────────────────────────
function bindPortalEvents() {
  // Chuyển Tab Sidebar
  document.querySelectorAll('.adm-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.getAttribute('data-tab');
      if (tab) {
        currentTab = tab;
        document.querySelectorAll('.adm-nav-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        
        const titleEl = document.getElementById('breadcrumb-title');
        if (titleEl) {
          titleEl.textContent = tab === 'doctors' ? 'Quản lý Bác sĩ mắt' : 
                                tab === 'dashboard' ? 'Tổng quan thống kê' : 
                                tab === 'appointments' ? 'Lịch hẹn khám' : 'Cài đặt hệ thống';
        }
        refreshMainView();
      }
    });
  });

  // Mobile Toggle Sidebar
  document.getElementById('btn-toggle-sidebar')?.addEventListener('click', () => {
    document.getElementById('adm-sidebar')?.classList.toggle('open');
  });

  // Đăng xuất
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi trang Quản trị Admin?')) {
      AdminAuth.logout();
      showToast('Đã đăng xuất tài khoản Admin.', 'info');
      setTimeout(() => {
        renderLoginView();
      }, 400);
    }
  });

  // Khôi phục Database Bác Sĩ Mẫu
  document.getElementById('btn-reset-db')?.addEventListener('click', () => {
    if (confirm('Khôi phục lại danh sách bác sĩ ban đầu của phòng khám?')) {
      DoctorManager.resetToDefault();
      showToast('Đã khôi phục danh sách bác sĩ mẫu thành công!', 'success');
      refreshMainView();
    }
  });

  bindDoctorTableEvents();
}

function bindDoctorTableEvents() {
  // Nút mở modal Thêm mới
  document.getElementById('btn-open-create-modal')?.addEventListener('click', () => {
    openDoctorModal(null);
  });

  // Tìm kiếm
  const searchInput = document.getElementById('filter-search');
  searchInput?.addEventListener('input', (e) => {
    filterState.query = e.target.value;
    refreshDoctorTableOnly();
  });

  // Lọc Chuyên khoa
  const specSelect = document.getElementById('filter-specialty');
  specSelect?.addEventListener('change', (e) => {
    filterState.specialty = e.target.value;
    refreshDoctorTableOnly();
  });

  // Lọc Trạng thái
  const statusSelect = document.getElementById('filter-status');
  statusSelect?.addEventListener('change', (e) => {
    filterState.status = e.target.value;
    refreshDoctorTableOnly();
  });

  // Nút xem chi tiết
  document.querySelectorAll('.btn-view-doc').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      const doc = DoctorManager.getDoctorById(id);
      if (doc) openDoctorViewModal(doc);
    });
  });

  // Nút sửa
  document.querySelectorAll('.btn-edit-doc').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const doc = DoctorManager.getDoctorById(id);
      if (doc) openDoctorModal(doc);
    });
  });

  // Nút xóa
  document.querySelectorAll('.btn-delete-doc').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const doc = DoctorManager.getDoctorById(id);
      if (doc) openDeleteConfirmModal(doc);
    });
  });

  // Nút toggle trạng thái nhanh
  document.querySelectorAll('.btn-toggle-status').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const doc = DoctorManager.getDoctorById(id);
      if (!doc) return;
      const nextStatus = doc.status === 'active' ? 'busy' : doc.status === 'busy' ? 'off' : 'active';
      DoctorManager.updateDoctor(id, { status: nextStatus });
      showToast(`Đã chuyển trạng thái bác sĩ ${doc.name} sang: ${nextStatus === 'active' ? 'Đang trực' : nextStatus === 'busy' ? 'Bận mổ' : 'Nghỉ trực'}`, 'info');
      refreshMainView();
    });
  });
}

function refreshMainView() {
  const contentEl = document.getElementById('adm-main-content');
  if (contentEl) {
    contentEl.innerHTML = renderTabContent();
    bindDoctorTableEvents();
  }
  const countTag = document.getElementById('nav-doc-count');
  if (countTag) {
    countTag.textContent = DoctorManager.getDoctors().length;
  }
}

function refreshDoctorTableOnly() {
  if (currentTab !== 'doctors') return;
  const contentEl = document.getElementById('adm-main-content');
  if (contentEl) {
    contentEl.innerHTML = renderTabContent();
    bindDoctorTableEvents();
    // Giữ focus lại ô search
    const searchInput = document.getElementById('filter-search');
    if (searchInput) {
      searchInput.focus();
      const val = searchInput.value;
      searchInput.value = '';
      searchInput.value = val;
    }
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('adm-toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `adm-toast ${type}`;
  toast.innerHTML = `
    <span>${icons[type] || 'ℹ️'}</span>
    <span style="flex: 1;">${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Khởi chạy khi DOM load xong
document.addEventListener('DOMContentLoaded', init);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}
