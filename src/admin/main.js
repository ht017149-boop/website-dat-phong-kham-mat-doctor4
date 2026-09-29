/* ============================================================
   src/admin/main.js — Doctor4 Eye Clinic
   Controller trung tâm cho Trang Quản trị Admin
   Quản lý 10 Bác Sĩ & Hệ thống 10 Phòng Khám Chuyên Biệt
   ============================================================ */

import '../css/admin.css';
import { AdminAuth } from './admin-auth.js';
import { DoctorManager, SAMPLE_AVATARS } from './doctor-manager.js';
import { AppointmentManager } from './appointment-manager.js';
import { CLINIC_ROOMS, CLINIC_SERVICES } from '../data/clinic-data.js';

// Khởi tạo container chính
const appRoot = document.getElementById('admin-app') || document.body;

// Trạng thái hiện tại của ứng dụng Admin
let currentTab = 'doctors'; // 'doctors' | 'appointments' | 'rooms' | 'dashboard' | 'settings'
let docFilterState = {
  query: '',
  specialty: 'all',
  status: 'all'
};
let appFilterState = {
  query: '',
  status: 'all',
  roomId: 'all'
};

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
          <p>Hệ thống Quản trị 10 Phòng Khám & Đội ngũ Bác Sĩ</p>
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
      }, 400);
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
  const allApps = AppointmentManager.getAppointments();

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
            <span>Quản lý 10 Bác sĩ</span>
            <span class="adm-nav-tag" id="nav-doc-count">${allDocs.length}</span>
          </div>

          <div class="adm-nav-item ${currentTab === 'appointments' ? 'active' : ''}" data-tab="appointments">
            <span class="adm-nav-icon">📅</span>
            <span>Lịch hẹn & Xếp phòng</span>
            <span class="adm-nav-tag" style="background: var(--adm-warning); color: #000;" id="nav-app-count">${allApps.length}</span>
          </div>

          <div class="adm-nav-item ${currentTab === 'rooms' ? 'active' : ''}" data-tab="rooms">
            <span class="adm-nav-icon">🏥</span>
            <span>Sơ đồ 10 Phòng khám</span>
            <span class="adm-nav-tag" style="background: var(--adm-success); color: #000;">10</span>
          </div>

          <div class="adm-nav-heading">Hệ thống</div>

          <div class="adm-nav-item ${currentTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
            <span class="adm-nav-icon">📊</span>
            <span>Bảng điều khiển KPI</span>
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
                ${getTabTitle(currentTab)}
              </span>
            </div>
          </div>

          <div class="adm-header-right">
            <button class="adm-header-btn" id="btn-reset-db" title="Khôi phục toàn bộ danh sách 10 bác sĩ & lịch hẹn mẫu">
              <span>🔄 Khôi phục mẫu gốc</span>
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

function getTabTitle(tab) {
  switch (tab) {
    case 'doctors': return 'Quản lý Đội ngũ 10 Bác sĩ mắt';
    case 'appointments': return 'Quản lý Lịch hẹn & Phân bổ Xếp phòng';
    case 'rooms': return 'Sơ đồ 10 Phòng khám mắt chuyên biệt';
    case 'dashboard': return 'Bảng điều khiển tổng quan';
    default: return 'Cài đặt hệ thống';
  }
}

// ─────────────────────────────────────────────────────────────
// 3. RENDER NỘI DUNG TỪNG TAB
// ─────────────────────────────────────────────────────────────
function renderTabContent() {
  if (currentTab === 'doctors') return renderDoctorManagementView();
  if (currentTab === 'appointments') return renderAppointmentsManagementView();
  if (currentTab === 'rooms') return renderRoomsDiagramView();
  if (currentTab === 'dashboard') return renderDashboardView();
  return renderSettingsPlaceholderView();
}

// ── TAB 1: QUẢN LÝ 10 BÁC SĨ (CRUD) ──────────────────────────
function renderDoctorManagementView() {
  const allDocs = DoctorManager.getDoctors();
  const filteredDocs = DoctorManager.filterDoctors(allDocs, docFilterState);

  const totalDocs = allDocs.length;
  const activeDocs = allDocs.filter(d => d.status === 'active').length;
  const totalPatients = allDocs.reduce((sum, d) => sum + (d.patientsCount || 0), 0);
  const avgExp = totalDocs ? (allDocs.reduce((sum, d) => sum + (d.experience || 0), 0) / totalDocs).toFixed(1) : 0;

  return `
    <div class="adm-page-header">
      <div class="adm-page-title">
        <h1>Quản lý Đội ngũ Bác Sĩ (${totalDocs} Bác Sĩ)</h1>
        <p>Phân bổ 10 phòng khám, ca trực và quản lý bác sĩ cùng khám chuyên sâu các bệnh lý mắt</p>
      </div>
      <button class="adm-btn-create" id="btn-open-create-modal">
        <span>➕ Thêm Bác Sĩ Mới</span>
      </button>
    </div>

    <!-- 4 Stats Card -->
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
          <div class="stat-val">${activeDocs} / ${totalDocs}</div>
        </div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon warning">👥</div>
        <div class="adm-stat-meta">
          <h3>Bệnh nhân đã khám</h3>
          <div class="stat-val">${totalPatients.toLocaleString('vi-VN')}+</div>
        </div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon accent">🏥</div>
        <div class="adm-stat-meta">
          <h3>Phòng khám phụ trách</h3>
          <div class="stat-val">10 Phòng</div>
        </div>
      </div>
    </div>

    <!-- Toolbar: Tìm kiếm & Lọc -->
    <div class="adm-toolbar">
      <div class="adm-filters-left">
        <div class="adm-search-input-wrap">
          <span class="adm-search-icon">🔍</span>
          <input 
            type="text" 
            id="filter-search-doc" 
            placeholder="Tìm theo tên bác sĩ, phòng khám, SĐT..." 
            value="${escapeHtml(docFilterState.query)}"
          />
        </div>

        <select class="adm-select" id="filter-specialty-doc">
          <option value="all" ${docFilterState.specialty === 'all' ? 'selected' : ''}>Tất cả chuyên khoa</option>
          <option value="lasik" ${docFilterState.specialty === 'lasik' ? 'selected' : ''}>Phẫu thuật LASIK / SMILE (Phòng 101, 102)</option>
          <option value="cataract" ${docFilterState.specialty === 'cataract' ? 'selected' : ''}>Đục thủy tinh thể / Phaco (Phòng 104, 105)</option>
          <option value="glocom" ${docFilterState.specialty === 'glocom' ? 'selected' : ''}>Glôcôm & Đo nhãn áp (Phòng 103)</option>
          <option value="pediatric" ${docFilterState.specialty === 'pediatric' ? 'selected' : ''}>Nhãn khoa Trẻ em & Ortho-K (Phòng 106)</option>
          <option value="cornea" ${docFilterState.specialty === 'cornea' ? 'selected' : ''}>Viêm giác mạc & Khô mắt (Phòng 107)</option>
          <option value="retina" ${docFilterState.specialty === 'retina' ? 'selected' : ''}>Võng mạc & Đáy mắt (Phòng 108)</option>
          <option value="oculoplastic" ${docFilterState.specialty === 'oculoplastic' ? 'selected' : ''}>Tạo hình thẩm mỹ mắt (Phòng 109)</option>
          <option value="general" ${docFilterState.specialty === 'general' ? 'selected' : ''}>Khám tổng quát & Cấp cứu (Phòng 110)</option>
        </select>

        <select class="adm-select" id="filter-status-doc">
          <option value="all" ${docFilterState.status === 'all' ? 'selected' : ''}>Tất cả trạng thái</option>
          <option value="active" ${docFilterState.status === 'active' ? 'selected' : ''}>Đang trực khám</option>
          <option value="busy" ${docFilterState.status === 'busy' ? 'selected' : ''}>Bận phẫu thuật</option>
          <option value="off" ${docFilterState.status === 'off' ? 'selected' : ''}>Tạm nghỉ / Phép</option>
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
          <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn chuyên khoa khác.</p>
        </div>
      ` : `
        <table class="adm-table">
          <thead>
            <tr>
              <th>Bác sĩ / Học vị</th>
              <th>Chuyên khoa</th>
              <th>Phòng khám (101-110)</th>
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
      </td>
      <td>
        <div style="font-weight: 600; color: #38bdf8;">📍 ${escapeHtml(doc.room || 'Phòng 110')}</div>
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

// ── TAB 2: QUẢN LÝ LỊCH HẸN & XẾP PHÒNG ──────────────────────
function renderAppointmentsManagementView() {
  const allApps = AppointmentManager.getAppointments();
  const filteredApps = AppointmentManager.filterAppointments(allApps, appFilterState);

  const pendingCount = allApps.filter(a => a.status === 'pending').length;
  const inProgressCount = allApps.filter(a => a.status === 'in_progress').length;
  const confirmedCount = allApps.filter(a => a.status === 'confirmed').length;
  const completedCount = allApps.filter(a => a.status === 'completed').length;

  return `
    <div class="adm-page-header">
      <div class="adm-page-title">
        <h1>Quản lý Lịch Hẹn & Xếp Phòng Khám</h1>
        <p>Tiếp nhận ca khám, phân bổ 10 phòng khám chuyên biệt (Phòng 101 - 110) và chỉ định bác sĩ phụ trách</p>
      </div>
      <button class="adm-btn-create" id="btn-open-create-app-modal">
        <span>➕ Tạo Lịch Hẹn Mới</span>
      </button>
    </div>

    <!-- Thống kê trạng thái ca khám -->
    <div class="adm-stats-grid">
      <div class="adm-stat-card">
        <div class="adm-stat-icon warning">⏳</div>
        <div class="adm-stat-meta">
          <h3>Chờ xếp phòng / duyệt</h3>
          <div class="stat-val">${pendingCount}</div>
        </div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon primary">📅</div>
        <div class="adm-stat-meta">
          <h3>Đã xếp phòng & giờ</h3>
          <div class="stat-val">${confirmedCount}</div>
        </div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon accent">🩺</div>
        <div class="adm-stat-meta">
          <h3>Đang khám tại phòng</h3>
          <div class="stat-val">${inProgressCount}</div>
        </div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon success">✅</div>
        <div class="adm-stat-meta">
          <h3>Đã hoàn thành khám</h3>
          <div class="stat-val">${completedCount}</div>
        </div>
      </div>
    </div>

    <!-- Toolbar Lọc lịch hẹn -->
    <div class="adm-toolbar">
      <div class="adm-filters-left">
        <div class="adm-search-input-wrap">
          <span class="adm-search-icon">🔍</span>
          <input 
            type="text" 
            id="filter-search-app" 
            placeholder="Tìm theo Mã hẹn, Tên BN, SĐT, Bác sĩ..." 
            value="${escapeHtml(appFilterState.query)}"
          />
        </div>

        <select class="adm-select" id="filter-room-app">
          <option value="all" ${appFilterState.roomId === 'all' ? 'selected' : ''}>Tất cả 10 Phòng khám</option>
          ${CLINIC_ROOMS.map(r => `
            <option value="${r.id}" ${appFilterState.roomId === r.id ? 'selected' : ''}>${r.number} - ${r.name}</option>
          `).join('')}
        </select>

        <select class="adm-select" id="filter-status-app">
          <option value="all" ${appFilterState.status === 'all' ? 'selected' : ''}>Tất cả trạng thái</option>
          <option value="pending" ${appFilterState.status === 'pending' ? 'selected' : ''}>Chờ duyệt / Chờ xếp phòng</option>
          <option value="confirmed" ${appFilterState.status === 'confirmed' ? 'selected' : ''}>Đã xếp phòng & xác nhận</option>
          <option value="in_progress" ${appFilterState.status === 'in_progress' ? 'selected' : ''}>Đang khám tại phòng</option>
          <option value="completed" ${appFilterState.status === 'completed' ? 'selected' : ''}>Đã hoàn thành khám</option>
          <option value="cancelled" ${appFilterState.status === 'cancelled' ? 'selected' : ''}>Đã hủy hẹn</option>
        </select>
      </div>

      <div style="font-size: 13px; color: var(--adm-text-muted);">
        Tổng cộng: <strong>${filteredApps.length}</strong> ca hẹn
      </div>
    </div>

    <!-- Table Lịch hẹn -->
    <div class="adm-table-container">
      ${filteredApps.length === 0 ? `
        <div class="adm-empty-state">
          <div class="adm-empty-icon">📅</div>
          <h3>Không tìm thấy lịch hẹn nào</h3>
          <p>Chưa có ca đặt lịch phù hợp với bộ lọc hiện tại.</p>
        </div>
      ` : `
        <table class="adm-table">
          <thead>
            <tr>
              <th>Mã Hẹn & Bệnh Nhân</th>
              <th>Bệnh lý & Dịch vụ</th>
              <th>Bác sĩ chỉ định</th>
              <th>Phòng khám (101-110)</th>
              <th>Ngày & Giờ khám</th>
              <th>Trạng thái</th>
              <th style="text-align: right;">Hành động & Xếp phòng</th>
            </tr>
          </thead>
          <tbody>
            ${filteredApps.map(app => renderAppointmentRow(app)).join('')}
          </tbody>
        </table>
      `}
    </div>
  `;
}

function renderAppointmentRow(app) {
  const statusHtml = {
    pending: '<span class="adm-badge adm-badge-busy"><span class="adm-badge-dot"></span> Chờ xếp phòng</span>',
    confirmed: '<span class="adm-badge adm-badge-active"><span class="adm-badge-dot"></span> Đã xếp phòng</span>',
    in_progress: '<span class="adm-badge" style="background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.3);"><span class="adm-badge-dot" style="background:#818cf8;"></span> Đang khám</span>',
    completed: '<span class="adm-badge adm-badge-active"><span class="adm-badge-dot"></span> Đã khám xong</span>',
    cancelled: '<span class="adm-badge adm-badge-off"><span class="adm-badge-dot"></span> Đã hủy</span>'
  };

  return `
    <tr data-app-id="${app.id}">
      <td>
        <div style="font-weight: 700; color: var(--adm-primary); font-size: 12px; font-family: monospace;">${app.id}</div>
        <div style="font-weight: 600; color: #fff; font-size: 14px; margin-top: 2px;">${escapeHtml(app.patientName)}</div>
        <div style="color: var(--adm-text-muted); font-size: 12px;">📞 ${escapeHtml(app.patientPhone)}</div>
      </td>
      <td>
        <span class="adm-spec-tag">${escapeHtml(app.serviceName || 'Khám Mắt')}</span>
        <div style="font-size: 12px; color: var(--adm-text-dim); margin-top: 4px; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(app.symptoms)}">
          💬 ${escapeHtml(app.symptoms || 'Khám thông thường')}
        </div>
      </td>
      <td>
        <div style="font-weight: 600; color: #fff;">👨‍⚕️ ${escapeHtml(app.doctorName)}</div>
      </td>
      <td>
        <div style="font-weight: 700; color: #38bdf8; font-size: 13px;">
          📍 ${escapeHtml(app.roomName || 'Phòng 101')}
        </div>
      </td>
      <td>
        <div style="color: #fff; font-weight: 500;">📅 ${escapeHtml(app.date)}</div>
        <div style="color: var(--adm-warning); font-size: 12px; font-weight: 600; margin-top: 2px;">🕒 ${escapeHtml(app.timeSlot)}</div>
      </td>
      <td>
        ${statusHtml[app.status] || statusHtml.pending}
      </td>
      <td>
        <div class="adm-actions" style="justify-content: flex-end;">
          <button class="adm-btn-action edit btn-assign-room" data-id="${app.id}" title="Xếp / Đổi phòng khám & Bác sĩ">
            🏥
          </button>
          <button class="adm-btn-action edit btn-edit-app" data-id="${app.id}" title="Chỉnh sửa thông tin lịch hẹn">
            ✏️
          </button>
          <button class="adm-btn-action delete btn-delete-app" data-id="${app.id}" title="Hủy ca hẹn">
            🗑️
          </button>
        </div>
      </td>
    </tr>
  `;
}

// ── TAB 3: SƠ ĐỒ & QUẢN LÝ 10 PHÒNG KHÁM CHUYÊN BIỆT ─────────
function renderRoomsDiagramView() {
  const roomsOverview = AppointmentManager.getRoomsOverview();

  return `
    <div class="adm-page-header">
      <div class="adm-page-title">
        <h1>Quản lý Hệ Thống Phòng Khám Mắt (${roomsOverview.length} Phòng)</h1>
        <p>Theo dõi tình trạng hoạt động thực tế, trang thiết bị, bác sĩ trực và phân bổ phòng cho bệnh nhân</p>
      </div>
      <button class="adm-btn-create" id="btn-open-create-room-modal">
        <span>➕ Thêm Phòng Khám Mới</span>
      </button>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
      ${roomsOverview.map(r => `
        <div style="background: var(--adm-bg-surface); border: 1px solid ${r.isOccupied ? 'var(--adm-border-active)' : 'var(--adm-border)'}; border-radius: var(--adm-radius-lg); padding: 20px; box-shadow: var(--adm-shadow-sm); position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: ${r.isOccupied ? 'var(--adm-primary)' : 'var(--adm-border)'};"></div>
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <span style="font-size: 11px; font-weight: 700; background: rgba(56, 189, 248, 0.15); color: var(--adm-primary); padding: 2px 8px; border-radius: 4px;">
                ${r.floor}
              </span>
              <h3 style="color: #fff; font-size: 17px; margin-top: 6px;">${r.number}: ${r.name}</h3>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="adm-badge ${r.isOccupied ? 'adm-badge-active' : 'adm-badge-off'}">
                <span class="adm-badge-dot"></span> ${r.isOccupied ? 'Đang mở' : 'Trống'}
              </span>
              <button class="adm-btn-action edit btn-edit-room" data-room-id="${r.id}" title="Sửa thông tin phòng">
                ✏️
              </button>
            </div>
          </div>

          <div style="font-size: 12px; color: var(--adm-text-muted); margin-bottom: 14px; line-height: 1.6;">
            <div>🔬 <strong>Thiết bị chính:</strong> ${r.equipment}</div>
          </div>

          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--adm-border); border-radius: var(--adm-radius-md); padding: 12px; margin-bottom: 12px;">
            <div style="font-size: 12px; font-weight: 600; color: var(--adm-text-muted); margin-bottom: 6px;">Bác sĩ phụ trách phòng:</div>
            ${r.doctors.length > 0 ? r.doctors.map(d => `
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <img src="${d.avatar}" style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover;" onerror="this.src='${SAMPLE_AVATARS[0]}'"/>
                <span style="font-size: 13px; color: #fff; font-weight: 500;">${d.name}</span>
                <span style="font-size: 11px; color: ${d.status === 'active' ? 'var(--adm-success)' : 'var(--adm-text-dim)'}; margin-left: auto;">
                  ${d.status === 'active' ? '🟢 Đang trực' : d.status === 'busy' ? '🟡 Bận mổ' : '⚪ Nghỉ'}
                </span>
              </div>
            `).join('') : '<div style="font-size: 12px; color: var(--adm-text-dim);">Chưa phân bổ bác sĩ trực cố định</div>'}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
            <span style="color: var(--adm-text-muted);">Bệnh nhân đang chờ: <strong style="color: #38bdf8;">${r.activeCount} ca</strong></span>
            <button class="adm-btn-create btn-room-view-apps" data-room-id="${r.id}" style="padding: 6px 12px; font-size: 12px;">
              Xem bệnh nhân tại phòng →
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── TAB 4: BẢNG ĐIỀU KHIỂN KPI ──────────────────────────────
function renderDashboardView() {
  const allDocs = DoctorManager.getDoctors();
  const allApps = AppointmentManager.getAppointments();

  return `
    <div class="adm-page-header">
      <div class="adm-page-title">
        <h1>Bảng Điều Khiển Tổng Quan</h1>
        <p>Báo cáo hoạt động phòng khám mắt Doctor4, công suất 10 phòng và đội ngũ 10 bác sĩ</p>
      </div>
    </div>

    <div class="adm-stats-grid">
      <div class="adm-stat-card">
        <div class="adm-stat-icon primary">📅</div>
        <div class="adm-stat-meta">
          <h3>Tổng lịch hẹn trong hệ thống</h3>
          <div class="stat-val">${allApps.length} ca</div>
        </div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon success">👨‍⚕️</div>
        <div class="adm-stat-meta">
          <h3>Đội ngũ Bác sĩ chuyên khoa</h3>
          <div class="stat-val">${allDocs.length} Bác sĩ</div>
        </div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon warning">🏥</div>
        <div class="adm-stat-meta">
          <h3>Hệ thống phòng khám chuyên sâu</h3>
          <div class="stat-val">10 Phòng (101 - 110)</div>
        </div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon accent">⭐</div>
        <div class="adm-stat-meta">
          <h3>Chất lượng điều trị</h3>
          <div class="stat-val">4.9 / 5.0</div>
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 24px;">
      <div style="background: var(--adm-bg-surface); border: 1px solid var(--adm-border); border-radius: var(--adm-radius-lg); padding: 24px;">
        <h3 style="color: #fff; margin-bottom: 16px;">🏥 Phân bổ bác sĩ cùng khám theo nhóm bệnh</h3>
        <div style="color: var(--adm-text-muted); font-size: 13px; line-height: 2;">
          <div>• <strong>Phẫu thuật LASIK / SMILE:</strong> BS. CKII Nguyễn Minh Quân (P101) & BS. CKI Đỗ Phương Thảo (P102)</div>
          <div>• <strong>Đục thủy tinh thể (Phaco):</strong> ThS. BS Lê Hoàng Phúc (P104) & TS. BS Hoàng Quốc Bảo (P105)</div>
          <div>• <strong>Glôcôm & Đáy mắt:</strong> TS. BS Trần Thị Lan Anh (P103) & BS. CKII Đặng Tuấn Kiệt (P108)</div>
          <div>• <strong>Nhãn Nhi & Giác Mạc:</strong> BS. CKI Phạm Thu Hà (P106) & ThS. BS Ngô Mỹ Linh (P107)</div>
          <div>• <strong>Thẩm Mỹ Mắt & Cấp Cứu:</strong> ThS. BS Nguyễn Mai Trang (P109) & ThS. BS Vũ Đức Mạnh (P110)</div>
        </div>
      </div>

      <div style="background: var(--adm-bg-surface); border: 1px solid var(--adm-border); border-radius: var(--adm-radius-lg); padding: 24px;">
        <h3 style="color: #fff; margin-bottom: 16px;">⚡ Thao tác nhanh</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button class="adm-btn-create" onclick="document.querySelector('[data-tab=\\'appointments\\']').click()">
            📅 Quản lý Lịch Hẹn & Xếp Phòng
          </button>
          <button class="adm-btn-secondary" onclick="document.querySelector('[data-tab=\\'doctors\\']').click()">
            👨‍⚕️ Quản lý Đội ngũ Bác Sĩ
          </button>
          <button class="adm-btn-secondary" onclick="document.querySelector('[data-tab=\\'rooms\\']').click()">
            🏥 Xem Sơ Đồ 10 Phòng Khám
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderSettingsPlaceholderView() {
  return `
    <div class="adm-page-header">
      <div class="adm-page-title">
        <h1>Cài Đặt Hệ Thống Phòng Khám</h1>
        <p>Cấu hình tài khoản quản trị và thông số hoạt động</p>
      </div>
    </div>
    <div style="background: var(--adm-bg-surface); border: 1px solid var(--adm-border); border-radius: var(--adm-radius-lg); padding: 24px; max-width: 600px;">
      <h3 style="color: #fff; margin-bottom: 16px;">Tài khoản Quản trị viên</h3>
      <div style="color: var(--adm-text-muted); font-size: 14px; line-height: 2;">
        <div>Tên hiển thị: <strong style="color: #fff;">Quản Trị Viên (Admin)</strong></div>
        <div>Tên đăng nhập: <strong style="color: var(--adm-primary);">admin</strong></div>
        <div>Mật khẩu: <strong style="color: var(--adm-primary);">123456</strong></div>
        <div>Email quản trị: <strong style="color: #fff;">admin@doctor4.vn</strong></div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// 4. MODALS (THÊM/SỬA BÁC SĨ, XẾP PHÒNG LỊCH HẸN)
// ─────────────────────────────────────────────────────────────
function openDoctorModal(doc = null) {
  const isEdit = !!doc;
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

            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-form-label">Chuyên khoa *</label>
                <select id="doc-form-specialty-code" class="adm-input adm-input-no-icon">
                  <option value="lasik" ${doc?.specialtyCode === 'lasik' ? 'selected' : ''}>Phẫu thuật LASIK / SMILE</option>
                  <option value="cataract" ${doc?.specialtyCode === 'cataract' ? 'selected' : ''}>Đục thủy tinh thể (Phaco)</option>
                  <option value="glocom" ${doc?.specialtyCode === 'glocom' ? 'selected' : ''}>Glôcôm & Đo nhãn áp</option>
                  <option value="pediatric" ${doc?.specialtyCode === 'pediatric' ? 'selected' : ''}>Nhãn khoa Trẻ em & Ortho-K</option>
                  <option value="cornea" ${doc?.specialtyCode === 'cornea' ? 'selected' : ''}>Viêm giác mạc & Khô mắt</option>
                  <option value="retina" ${doc?.specialtyCode === 'retina' ? 'selected' : ''}>Võng mạc & Đáy mắt</option>
                  <option value="oculoplastic" ${doc?.specialtyCode === 'oculoplastic' ? 'selected' : ''}>Tạo hình thẩm mỹ mắt</option>
                  <option value="general" ${doc?.specialtyCode === 'general' ? 'selected' : ''}>Khám Mắt Tổng Quát</option>
                </select>
              </div>

              <div class="adm-form-group">
                <label class="adm-form-label">Phòng khám chỉ định (101 - 110) *</label>
                <select id="doc-form-room-id" class="adm-input adm-input-no-icon">
                  ${CLINIC_ROOMS.map(r => `
                    <option value="${r.id}" ${doc?.roomId === r.id ? 'selected' : ''}>${r.number} - ${r.name}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-form-label">Tên hiển thị chuyên khoa *</label>
                <input 
                  type="text" 
                  id="doc-form-specialty" 
                  class="adm-input adm-input-no-icon" 
                  value="${doc ? escapeHtml(doc.specialty) : 'Nhãn khoa – Phẫu thuật LASIK'}" 
                  required 
                />
              </div>

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
            </div>

            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-form-label">Số điện thoại</label>
                <input 
                  type="text" 
                  id="doc-form-phone" 
                  class="adm-input adm-input-no-icon" 
                  value="${doc ? escapeHtml(doc.phone) : '0912 000 999'}" 
                />
              </div>

              <div class="adm-form-group">
                <label class="adm-form-label">Email</label>
                <input 
                  type="email" 
                  id="doc-form-email" 
                  class="adm-input adm-input-no-icon" 
                  value="${doc ? escapeHtml(doc.email) : 'doctor@doctor4.vn'}" 
                />
              </div>
            </div>

            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-form-label">Lịch làm việc</label>
                <input 
                  type="text" 
                  id="doc-form-schedule" 
                  class="adm-input adm-input-no-icon" 
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

            <div class="adm-form-group">
              <label class="adm-form-label">Ảnh đại diện</label>
              <div class="adm-avatar-preview-wrap">
                <img id="avatar-preview-img" src="${doc?.avatar || SAMPLE_AVATARS[0]}" class="adm-avatar-large" alt="Preview"/>
                <div style="flex: 1;">
                  <input 
                    type="url" 
                    id="doc-form-avatar" 
                    class="adm-input adm-input-no-icon" 
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

            <div class="adm-form-group">
              <label class="adm-form-label">Mô tả giới thiệu bác sĩ</label>
              <textarea 
                id="doc-form-bio" 
                class="adm-input adm-input-no-icon" 
                rows="2"
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

  const closeModal = () => { modalRoot.innerHTML = ''; };
  document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal')?.addEventListener('click', closeModal);

  modalRoot.querySelectorAll('.btn-pick-sample-avatar').forEach(img => {
    img.addEventListener('click', () => {
      const url = img.getAttribute('data-url');
      document.getElementById('doc-form-avatar').value = url;
      document.getElementById('avatar-preview-img').src = url;
    });
  });

  document.getElementById('adm-doctor-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const roomId = document.getElementById('doc-form-room-id').value;
    const roomObj = CLINIC_ROOMS.find(r => r.id === roomId);

    const docData = {
      name: document.getElementById('doc-form-name').value,
      degree: document.getElementById('doc-form-degree').value,
      specialtyCode: document.getElementById('doc-form-specialty-code').value,
      specialty: document.getElementById('doc-form-specialty').value,
      roomId: roomId,
      room: roomObj ? `${roomObj.number} - ${roomObj.name}` : 'Phòng 110',
      experience: document.getElementById('doc-form-exp').value,
      phone: document.getElementById('doc-form-phone').value,
      email: document.getElementById('doc-form-email').value,
      schedule: document.getElementById('doc-form-schedule').value,
      status: document.getElementById('doc-form-status').value,
      avatar: document.getElementById('doc-form-avatar').value,
      bio: document.getElementById('doc-form-bio').value
    };

    if (isEdit) {
      DoctorManager.updateDoctor(doc.id, docData);
      showToast(`Đã cập nhật bác sĩ ${docData.name}!`, 'success');
    } else {
      DoctorManager.createDoctor(docData);
      showToast(`Đã thêm bác sĩ mới: ${docData.name}!`, 'success');
    }

    closeModal();
    refreshMainView();
  });
}

// Modal Xếp phòng & Đổi Bác Sĩ cho Lịch Hẹn
function openAssignRoomModal(app) {
  const modalRoot = document.getElementById('adm-modals-root');
  const allDocs = DoctorManager.getDoctors();
  const rooms = CLINIC_ROOMS;

  modalRoot.innerHTML = `
    <div class="adm-modal-overlay" id="adm-modal-overlay">
      <div class="adm-modal" style="max-width: 540px;">
        <div class="adm-modal-header">
          <h3>🏥 Phân Bổ Phòng & Bác Sĩ: ${escapeHtml(app.patientName)}</h3>
          <button class="adm-modal-close" id="btn-close-assign-modal">✕</button>
        </div>

        <form id="adm-assign-form">
          <div class="adm-modal-body">
            <div style="background: rgba(56, 189, 248, 0.08); padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 13px;">
              <div>Mã hẹn: <strong style="color: var(--adm-primary); font-family: monospace;">${app.id}</strong></div>
              <div>Bệnh nhân: <strong>${escapeHtml(app.patientName)}</strong> (📞 ${escapeHtml(app.patientPhone)})</div>
              <div>Bệnh lý / Nhu cầu: <span style="color: #fff;">${escapeHtml(app.serviceName || app.symptoms)}</span></div>
            </div>

            <div class="adm-form-group">
              <label class="adm-form-label">Chọn Phòng Khám Phù Hợp (10 Phòng) *</label>
              <select id="assign-room-id" class="adm-input adm-input-no-icon">
                ${rooms.map(r => `
                  <option value="${r.id}" ${app.roomId === r.id ? 'selected' : ''}>
                    ${r.number}: ${r.name} (${r.floor})
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="adm-form-group">
              <label class="adm-form-label">Chỉ Định Bác Sĩ Khám *</label>
              <select id="assign-doctor-id" class="adm-input adm-input-no-icon">
                ${allDocs.map(d => `
                  <option value="${d.id}" ${String(app.doctorId) === String(d.id) ? 'selected' : ''}>
                    ${d.name} (${d.degree}) — ${d.specialty}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-form-label">Ngày khám</label>
                <input type="date" id="assign-date" class="adm-input adm-input-no-icon" value="${app.date}" required/>
              </div>

              <div class="adm-form-group">
                <label class="adm-form-label">Khung giờ khám</label>
                <select id="assign-time" class="adm-input adm-input-no-icon">
                  <option value="08:00 - 09:00" ${app.timeSlot === '08:00 - 09:00' ? 'selected' : ''}>08:00 - 09:00 (Sáng)</option>
                  <option value="09:00 - 10:00" ${app.timeSlot === '09:00 - 10:00' ? 'selected' : ''}>09:00 - 10:00 (Sáng)</option>
                  <option value="10:00 - 11:00" ${app.timeSlot === '10:00 - 11:00' ? 'selected' : ''}>10:00 - 11:00 (Sáng)</option>
                  <option value="13:30 - 14:30" ${app.timeSlot === '13:30 - 14:30' ? 'selected' : ''}>13:30 - 14:30 (Chiều)</option>
                  <option value="14:30 - 15:30" ${app.timeSlot === '14:30 - 15:30' ? 'selected' : ''}>14:30 - 15:30 (Chiều)</option>
                  <option value="15:30 - 17:00" ${app.timeSlot === '15:30 - 17:00' ? 'selected' : ''}>15:30 - 17:00 (Chiều)</option>
                </select>
              </div>
            </div>

            <div class="adm-form-group">
              <label class="adm-form-label">Trạng thái ca khám</label>
              <select id="assign-status" class="adm-input adm-input-no-icon">
                <option value="pending" ${app.status === 'pending' ? 'selected' : ''}>⏳ Chờ xếp phòng</option>
                <option value="confirmed" ${app.status === 'confirmed' ? 'selected' : ''}>📅 Đã xếp phòng & xác nhận</option>
                <option value="in_progress" ${app.status === 'in_progress' ? 'selected' : ''}>🩺 Đang khám tại phòng</option>
                <option value="completed" ${app.status === 'completed' ? 'selected' : ''}>✅ Đã hoàn thành khám</option>
                <option value="cancelled" ${app.status === 'cancelled' ? 'selected' : ''}>❌ Hủy lịch hẹn</option>
              </select>
            </div>
          </div>

          <div class="adm-modal-footer">
            <button type="button" class="adm-btn-secondary" id="btn-cancel-assign">Hủy</button>
            <button type="submit" class="adm-btn-create">
              <span>💾 Lưu & Xếp Phòng Khám</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const closeModal = () => { modalRoot.innerHTML = ''; };
  document.getElementById('btn-close-assign-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-assign')?.addEventListener('click', closeModal);

  document.getElementById('adm-assign-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const updateData = {
      roomId: document.getElementById('assign-room-id').value,
      doctorId: document.getElementById('assign-doctor-id').value,
      date: document.getElementById('assign-date').value,
      timeSlot: document.getElementById('assign-time').value,
      status: document.getElementById('assign-status').value
    };

    AppointmentManager.updateAppointment(app.id, updateData);
    showToast(`Đã xếp phòng & cập nhật ca hẹn ${app.id}!`, 'success');
    closeModal();
    refreshMainView();
  });
}

// Modal Thêm Lịch Hẹn Thủ Công từ Admin
function openCreateAppointmentModal() {
  const modalRoot = document.getElementById('adm-modals-root');
  const allDocs = DoctorManager.getDoctors();
  const rooms = CLINIC_ROOMS;
  const services = CLINIC_SERVICES;

  modalRoot.innerHTML = `
    <div class="adm-modal-overlay" id="adm-modal-overlay">
      <div class="adm-modal" style="max-width: 560px;">
        <div class="adm-modal-header">
          <h3>➕ Tiếp Nhận Đặt Lịch Khám Mắt</h3>
          <button class="adm-modal-close" id="btn-close-new-app">✕</button>
        </div>

        <form id="adm-new-app-form">
          <div class="adm-modal-body">
            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-form-label">Tên bệnh nhân *</label>
                <input type="text" id="new-app-name" class="adm-input adm-input-no-icon" placeholder="VD: Trần Văn B" required/>
              </div>

              <div class="adm-form-group">
                <label class="adm-form-label">Số điện thoại *</label>
                <input type="tel" id="new-app-phone" class="adm-input adm-input-no-icon" placeholder="VD: 0912 345 678" required/>
              </div>
            </div>

            <div class="adm-form-group">
              <label class="adm-form-label">Dịch vụ / Bệnh lý mắt *</label>
              <select id="new-app-service" class="adm-input adm-input-no-icon">
                ${services.map(s => `
                  <option value="${s.code}" data-name="${s.name}" data-room="${s.roomId}">${s.name}</option>
                `).join('')}
              </select>
            </div>

            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-form-label">Chỉ định Bác sĩ</label>
                <select id="new-app-doc" class="adm-input adm-input-no-icon">
                  ${allDocs.map(d => `
                    <option value="${d.id}">${d.name} — ${d.specialty}</option>
                  `).join('')}
                </select>
              </div>

              <div class="adm-form-group">
                <label class="adm-form-label">Phòng khám (101 - 110)</label>
                <select id="new-app-room" class="adm-input adm-input-no-icon">
                  ${rooms.map(r => `
                    <option value="${r.id}">${r.number} - ${r.name}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-form-label">Ngày khám</label>
                <input type="date" id="new-app-date" class="adm-input adm-input-no-icon" value="${new Date().toISOString().split('T')[0]}" required/>
              </div>

              <div class="adm-form-group">
                <label class="adm-form-label">Khung giờ</label>
                <select id="new-app-time" class="adm-input adm-input-no-icon">
                  <option value="08:30 - 09:30">08:30 - 09:30</option>
                  <option value="09:30 - 10:30">09:30 - 10:30</option>
                  <option value="10:30 - 11:30">10:30 - 11:30</option>
                  <option value="14:00 - 15:00">14:00 - 15:00</option>
                  <option value="15:00 - 16:30">15:00 - 16:30</option>
                </select>
              </div>
            </div>

            <div class="adm-form-group">
              <label class="adm-form-label">Mô tả triệu chứng bệnh</label>
              <textarea id="new-app-symptoms" class="adm-input adm-input-no-icon" rows="2" placeholder="Ghi chú triệu chứng hoặc yêu cầu khám..."></textarea>
            </div>
          </div>

          <div class="adm-modal-footer">
            <button type="button" class="adm-btn-secondary" id="btn-cancel-new-app">Hủy bỏ</button>
            <button type="submit" class="adm-btn-create">
              <span>➕ Tạo Lịch Hẹn</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const closeModal = () => { modalRoot.innerHTML = ''; };
  document.getElementById('btn-close-new-app')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-new-app')?.addEventListener('click', closeModal);

  // Tự động gán phòng & bác sĩ khi chọn dịch vụ
  const srvSelect = document.getElementById('new-app-service');
  srvSelect?.addEventListener('change', () => {
    const opt = srvSelect.selectedOptions[0];
    const targetRoomId = opt.getAttribute('data-room');
    if (targetRoomId) {
      document.getElementById('new-app-room').value = targetRoomId;
    }
  });

  document.getElementById('adm-new-app-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const opt = srvSelect.selectedOptions[0];
    const newApp = AppointmentManager.createAppointment({
      patientName: document.getElementById('new-app-name').value,
      patientPhone: document.getElementById('new-app-phone').value,
      serviceCode: srvSelect.value,
      serviceName: opt.getAttribute('data-name'),
      doctorId: document.getElementById('new-app-doc').value,
      roomId: document.getElementById('new-app-room').value,
      date: document.getElementById('new-app-date').value,
      timeSlot: document.getElementById('new-app-time').value,
      symptoms: document.getElementById('new-app-symptoms').value,
      status: 'confirmed'
    });

    showToast(`Đã tạo lịch hẹn thành công với mã: ${newApp.id}!`, 'success');
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
            <div>📍 <strong>Phòng khám trực:</strong> <span style="color: #38bdf8; font-weight: 600;">${escapeHtml(doc.room)}</span></div>
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
  document.getElementById('btn-view-to-edit')?.addEventListener('click', () => {
    closeModal();
    openDoctorModal(doc);
  });
}

// Modal Xóa Bác Sĩ
function openDeleteDoctorModal(doc) {
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
            Hành động này sẽ xóa bác sĩ khỏi danh sách điều hành phòng khám.
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

  document.getElementById('btn-confirm-delete')?.addEventListener('click', () => {
    DoctorManager.deleteDoctor(doc.id);
    showToast(`Đã xóa bác sĩ ${doc.name} khỏi hệ thống.`, 'info');
    closeModal();
    refreshMainView();
  });
}

// ─────────────────────────────────────────────────────────────
// 5. GẮN SỰ KIỆN TOÀN BỘ PORTAL
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
        if (titleEl) titleEl.textContent = getTabTitle(tab);
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

  // Khôi phục Database Gốc
  document.getElementById('btn-reset-db')?.addEventListener('click', () => {
    if (confirm('Khôi phục lại danh sách 10 bác sĩ và các lịch hẹn ban đầu?')) {
      DoctorManager.resetToDefault();
      localStorage.removeItem('doctor4_appointments_db');
      showToast('Đã khôi phục dữ liệu 10 bác sĩ & 10 phòng khám thành công!', 'success');
      refreshMainView();
    }
  });

  bindViewSpecificEvents();
}

function bindViewSpecificEvents() {
  // Events cho Tab Doctors
  document.getElementById('btn-open-create-modal')?.addEventListener('click', () => openDoctorModal(null));

  const searchDocInput = document.getElementById('filter-search-doc');
  searchDocInput?.addEventListener('input', (e) => {
    docFilterState.query = e.target.value;
    refreshDoctorTableOnly();
  });

  document.getElementById('filter-specialty-doc')?.addEventListener('change', (e) => {
    docFilterState.specialty = e.target.value;
    refreshDoctorTableOnly();
  });

  document.getElementById('filter-status-doc')?.addEventListener('change', (e) => {
    docFilterState.status = e.target.value;
    refreshDoctorTableOnly();
  });

  document.querySelectorAll('.btn-view-doc').forEach(btn => {
    btn.addEventListener('click', () => {
      const doc = DoctorManager.getDoctorById(btn.getAttribute('data-id'));
      if (doc) openDoctorViewModal(doc);
    });
  });

  document.querySelectorAll('.btn-edit-doc').forEach(btn => {
    btn.addEventListener('click', () => {
      const doc = DoctorManager.getDoctorById(btn.getAttribute('data-id'));
      if (doc) openDoctorModal(doc);
    });
  });

  document.querySelectorAll('.btn-delete-doc').forEach(btn => {
    btn.addEventListener('click', () => {
      const doc = DoctorManager.getDoctorById(btn.getAttribute('data-id'));
      if (doc) openDeleteDoctorModal(doc);
    });
  });

  document.querySelectorAll('.btn-toggle-status').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const doc = DoctorManager.getDoctorById(id);
      if (!doc) return;
      const nextStatus = doc.status === 'active' ? 'busy' : doc.status === 'busy' ? 'off' : 'active';
      DoctorManager.updateDoctor(id, { status: nextStatus });
      showToast(`Đã đổi trạng thái BS. ${doc.name} sang: ${nextStatus === 'active' ? 'Đang trực' : nextStatus === 'busy' ? 'Bận mổ' : 'Nghỉ trực'}`, 'info');
      refreshMainView();
    });
  });

  // Events cho Tab Appointments
  document.getElementById('btn-open-create-app-modal')?.addEventListener('click', () => openCreateAppointmentModal());

  document.getElementById('filter-search-app')?.addEventListener('input', (e) => {
    appFilterState.query = e.target.value;
    refreshAppointmentTableOnly();
  });

  document.getElementById('filter-room-app')?.addEventListener('change', (e) => {
    appFilterState.roomId = e.target.value;
    refreshAppointmentTableOnly();
  });

  document.getElementById('filter-status-app')?.addEventListener('change', (e) => {
    appFilterState.status = e.target.value;
    refreshAppointmentTableOnly();
  });

  document.querySelectorAll('.btn-assign-room').forEach(btn => {
    btn.addEventListener('click', () => {
      const app = AppointmentManager.getAppointmentById(btn.getAttribute('data-id'));
      if (app) openAssignRoomModal(app);
    });
  });

  document.querySelectorAll('.btn-edit-app').forEach(btn => {
    btn.addEventListener('click', () => {
      const app = AppointmentManager.getAppointmentById(btn.getAttribute('data-id'));
      if (app) openAssignRoomModal(app);
    });
  });

  document.querySelectorAll('.btn-delete-app').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (confirm(`Bạn có chắc muốn hủy ca hẹn ${id} không?`)) {
        AppointmentManager.deleteAppointment(id);
        showToast(`Đã xóa ca hẹn ${id}`, 'info');
        refreshMainView();
      }
    });
  });

  // Events cho Tab Rooms (Quản lý Phòng Khám)
  document.getElementById('btn-open-create-room-modal')?.addEventListener('click', () => openRoomModal(null));

  document.querySelectorAll('.btn-edit-room').forEach(btn => {
    btn.addEventListener('click', () => {
      const roomId = btn.getAttribute('data-room-id');
      const room = CLINIC_ROOMS.find(r => r.id === roomId);
      if (room) openRoomModal(room);
    });
  });

  document.querySelectorAll('.btn-room-view-apps').forEach(btn => {
    btn.addEventListener('click', () => {
      const roomId = btn.getAttribute('data-room-id');
      currentTab = 'appointments';
      appFilterState.roomId = roomId;
      document.querySelectorAll('.adm-nav-item').forEach(el => el.classList.remove('active'));
      document.querySelector('[data-tab="appointments"]')?.classList.add('active');
      refreshMainView();
    });
  });
}

// Modal Thêm / Chỉnh Sửa Phòng Khám (Admin)
function openRoomModal(room = null) {
  const isEdit = !!room;
  const modalRoot = document.getElementById('adm-modals-root');

  modalRoot.innerHTML = `
    <div class="adm-modal-overlay" id="adm-modal-overlay">
      <div class="adm-modal" style="max-width: 520px;">
        <div class="adm-modal-header">
          <h3>${isEdit ? `✏️ Chỉnh Sửa ${escapeHtml(room.number)}` : '➕ Thêm Phòng Khám Mới'}</h3>
          <button class="adm-modal-close" id="btn-close-room-modal">✕</button>
        </div>

        <form id="adm-room-form">
          <div class="adm-modal-body">
            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-form-label">Số hiệu phòng *</label>
                <input type="text" id="room-form-num" class="adm-input adm-input-no-icon" placeholder="VD: Phòng 111" value="${room ? escapeHtml(room.number) : ''}" required/>
              </div>

              <div class="adm-form-group">
                <label class="adm-form-label">Vị trí Tầng *</label>
                <input type="text" id="room-form-floor" class="adm-input adm-input-no-icon" placeholder="VD: Tầng 1 / Tầng 2" value="${room ? escapeHtml(room.floor) : 'Tầng 1'}" required/>
              </div>
            </div>

            <div class="adm-form-group">
              <label class="adm-form-label">Tên chức năng phòng khám *</label>
              <input type="text" id="room-form-name" class="adm-input adm-input-no-icon" placeholder="VD: Khám Khúc Xạ & Đo Bản Đồ Giác Mạc" value="${room ? escapeHtml(room.name) : ''}" required/>
            </div>

            <div class="adm-form-group">
              <label class="adm-form-label">Thiết bị y tế chính trong phòng</label>
              <input type="text" id="room-form-equip" class="adm-input adm-input-no-icon" placeholder="VD: Máy VisuMax SMILE, Carl Zeiss..." value="${room ? escapeHtml(room.equipment) : ''}"/>
            </div>
          </div>

          <div class="adm-modal-footer">
            <button type="button" class="adm-btn-secondary" id="btn-cancel-room">Hủy bỏ</button>
            <button type="submit" class="adm-btn-create">
              <span>💾 ${isEdit ? 'Lưu Thông Tin Phòng' : 'Tạo Phòng Khám'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const closeModal = () => { modalRoot.innerHTML = ''; };
  document.getElementById('btn-close-room-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-room')?.addEventListener('click', closeModal);

  document.getElementById('adm-room-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const num = document.getElementById('room-form-num').value.trim();
    const name = document.getElementById('room-form-name').value.trim();
    const floor = document.getElementById('room-form-floor').value.trim();
    const equip = document.getElementById('room-form-equip').value.trim();

    if (isEdit) {
      room.number = num;
      room.name = name;
      room.floor = floor;
      room.equipment = equip;
      showToast(`Đã cập nhật ${num}!`, 'success');
    } else {
      CLINIC_ROOMS.push({
        id: 'R' + (CLINIC_ROOMS.length + 101),
        number: num,
        name: name,
        floor: floor,
        equipment: equip,
        specialty: 'general'
      });
      showToast(`Đã thêm phòng khám mới ${num}!`, 'success');
    }

    closeModal();
    refreshMainView();
  });
}

function refreshMainView() {
  const contentEl = document.getElementById('adm-main-content');
  if (contentEl) {
    contentEl.innerHTML = renderTabContent();
    bindViewSpecificEvents();
  }
  const countTag = document.getElementById('nav-doc-count');
  if (countTag) countTag.textContent = DoctorManager.getDoctors().length;
  const appTag = document.getElementById('nav-app-count');
  if (appTag) appTag.textContent = AppointmentManager.getAppointments().length;
}

function refreshDoctorTableOnly() {
  if (currentTab !== 'doctors') return;
  const contentEl = document.getElementById('adm-main-content');
  if (contentEl) {
    contentEl.innerHTML = renderTabContent();
    bindViewSpecificEvents();
    const searchInput = document.getElementById('filter-search-doc');
    if (searchInput) {
      searchInput.focus();
      const val = searchInput.value;
      searchInput.value = '';
      searchInput.value = val;
    }
  }
}

function refreshAppointmentTableOnly() {
  if (currentTab !== 'appointments') return;
  const contentEl = document.getElementById('adm-main-content');
  if (contentEl) {
    contentEl.innerHTML = renderTabContent();
    bindViewSpecificEvents();
    const searchInput = document.getElementById('filter-search-app');
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

document.addEventListener('DOMContentLoaded', init);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}
