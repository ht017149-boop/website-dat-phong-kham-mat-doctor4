/* ============================================================
   src/admin/main.js — Doctor4 Eye Clinic
   Controller trung tâm cho Trang Quản trị Admin
   Quản lý 10 Bác Sĩ & Hệ thống 10 Phòng Khám Chuyên Biệt
   ============================================================ */

import '../css/admin.css';
import { AdminAuth } from './admin-auth.js';
import { DoctorManager, SAMPLE_AVATARS } from './doctor-manager.js';
import { AppointmentManager, SAMPLE_EYE_DRUGS, SAMPLE_DIAGNOSES } from './appointment-manager.js';
import { CLINIC_ROOMS, CLINIC_SERVICES } from '../data/clinic-data.js';
import { getComments, hideComment, showComment, deleteComment } from './comment-manager.js';
import { getPatientProfileData } from '../utils/patient-profile.js';

// Khởi tạo container chính
const appRoot = document.getElementById('admin-app') || document.body;

// Trạng thái hiện tại của ứng dụng Admin
let currentTab = 'doctors'; // 'doctors' | 'appointments' | 'rooms' | 'dashboard' | 'settings'
let currentRoleMode = 'admin'; // 'admin' | doctorId (e.g. 'doc_1', 'doc_2'...)
let docFilterState = {
  query: '',
  specialty: 'all',
  status: 'all'
};
let appFilterState = {
  query: '',
  status: 'all',
  roomId: 'all',
  doctorId: 'all'
};

// Khởi chạy ứng dụng
function init() {
  if (AdminAuth.isAuthenticated()) {
    renderAdminPortal();
  } else {
    // Kiểm tra nếu đang có phiên đăng nhập người dùng thường (không phải admin)
    try {
      const userSession = localStorage.getItem('doctor4_session') || sessionStorage.getItem('doctor4_session');
      if (userSession) {
        const userData = JSON.parse(userSession);
        if (userData && userData.role !== 'admin') {
          renderAccessDenied();
          return;
        }
      }
    } catch (e) { /* bỏ qua lỗi parse */ }
    renderLoginView();
  }
}

// Màn hình từ chối quyền truy cập
function renderAccessDenied() {
  appRoot.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 20%,#1e3a8a 0%,#0b1329 70%);padding:24px;">
      <div style="text-align:center;max-width:420px;">
        <div style="font-size:5rem;margin-bottom:1.5rem;">🚫</div>
        <h1 style="font-size:1.8rem;font-weight:800;color:#f1f5f9;margin-bottom:0.75rem;">Không có quyền truy cập</h1>
        <p style="color:#94a3b8;margin-bottom:2rem;line-height:1.6;">Bạn đang đăng nhập bằng tài khoản bệnh nhân. Khu vực Quản trị Admin chỉ dành cho Quản trị viên được cấp phép.</p>
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
          <a href="/index.html" style="display:block;padding:0.85rem 1.5rem;background:#38bdf8;color:#0b1329;font-weight:700;border-radius:10px;text-decoration:none;">← Quay về Trang chủ</a>
          <a href="/dang-nhap.html" style="display:block;padding:0.85rem 1.5rem;background:rgba(255,255,255,0.08);color:#f1f5f9;font-weight:600;border-radius:10px;text-decoration:none;border:1px solid rgba(255,255,255,0.12);">Đăng nhập bằng tài khoản khác</a>
        </div>
      </div>
    </div>
  `;
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
                placeholder="Nhập tên đăng nhập hoặc email" 
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
                placeholder="Nhập mật khẩu quản trị" 
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



        <a href="/" class="adm-back-to-site">← Quay về trang chủ website Doctor4</a>
      </div>
    </div>
    <div id="adm-toast-container" class="adm-toast-container"></div>
  `;

  const form = document.getElementById('adm-login-form');

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
            <span>Lịch hẹn & Đặt lịch</span>
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

          <div class="adm-nav-item ${currentTab === 'comments' ? 'active' : ''}" data-tab="comments">
            <span class="adm-nav-icon">💬</span>
            <span>Quản lý Bình Luận</span>
            <span class="adm-nav-tag" style="background:#7c3aed;color:#fff;" id="nav-comment-count">${getComments().length}</span>
          </div>

          <div class="adm-nav-item ${currentTab === 'accounts' ? 'active' : ''}" data-tab="accounts">
            <span class="adm-nav-icon">🔑</span>
            <span>Quản lý Tài khoản</span>
          </div>
          <div class="adm-nav-item ${currentTab === 'payments' ? 'active' : ''}" data-tab="payments">
  <span class="adm-nav-icon">💳</span>
  <span>Quản lý Thanh toán</span>
  <span class="adm-nav-tag" id="nav-payment-count">0</span>
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

          <div class="adm-header-right" style="display: flex; align-items: center; gap: 10px;">
            <!-- Bộ chuyển đổi Vai trò (Super Admin vs 10 Bác Sĩ) -->
            <div style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.06); padding: 5px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12);">
              <span style="font-size: 12px; color: #94a3b8; font-weight: 600;">🎭 Chế độ:</span>
              <select id="adm-select-role-mode" style="background: #0f172a; color: #38bdf8; border: 1px solid rgba(56,189,248,0.4); border-radius: 6px; padding: 4px 8px; font-size: 12px; font-weight: 700; cursor: pointer; outline: none;">
                <option value="admin" ${currentRoleMode === 'admin' ? 'selected' : ''}>👑 Quản Trị Viên (Super Admin - Toàn quyền)</option>
                <optgroup label="👨‍⚕️ Bác sĩ trực 10 Phòng Khám">
                  ${allDocs.map(d => `
                    <option value="${d.id}" ${currentRoleMode === d.id ? 'selected' : ''}>
                      👨‍⚕️ ${escapeHtml(d.name)} (${escapeHtml(d.room || 'Phòng')})
                    </option>
                  `).join('')}
                </optgroup>
              </select>
            </div>

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
    case 'appointments': return 'Quản lý Lịch hẹn & Đặt lịch khám';
    case 'rooms': return 'Sơ đồ 10 Phòng khám mắt chuyên biệt';
    case 'dashboard': return 'Bảng điều khiển tổng quan';
    case 'comments': return 'Quản lý Bình Luận & Đánh giá';
    case 'accounts': return 'Quản lý Tài khoản Người dùng & Bác sĩ';
    case 'payments':
  return 'Quản lý Thanh toán';
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
  if (currentTab === 'comments') return renderCommentsManagementView();
  if (currentTab === 'accounts') return renderAccountsManagementView();
  if (currentTab === 'payments') return renderPaymentsManagementView();

  return renderSettingsPlaceholderView();
}

// ── TAB: QUẢN LÝ BÌNH LUẬN ─────────────────────────────────────
let commentFilterQuery = '';
let commentFilterStatus = 'all';

function renderCommentsManagementView() {
  const allComments = getComments();
  const visibleCount = allComments.filter(c => c.status === 'visible').length;
  const hiddenCount  = allComments.filter(c => c.status === 'hidden').length;

  let filtered = allComments;
  if (commentFilterStatus === 'visible') filtered = allComments.filter(c => c.status === 'visible');
  if (commentFilterStatus === 'hidden')  filtered = allComments.filter(c => c.status === 'hidden');
  if (commentFilterQuery) {
    const q = commentFilterQuery.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.content.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  }

  return `
    <div class="adm-page-header">
      <div class="adm-page-title">
        <h1>💬 Quản lý Bình Luận & Đánh giá (${allComments.length})</h1>
        <p>Xem, ẩn, hiện hoặc xóa bình luận từ bệnh nhân trên trang chủ</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="adm-stats-grid" style="grid-template-columns: repeat(3,1fr); margin-bottom:20px;">
      <div class="adm-stat-card">
        <div class="adm-stat-icon" style="background:rgba(124,58,237,0.15);">💬</div>
        <div class="adm-stat-meta">
          <h3>Tổng bình luận</h3>
          <div class="stat-val">${allComments.length}</div>
        </div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon success">✅</div>
        <div class="adm-stat-meta">
          <h3>Đang hiển thị</h3>
          <div class="stat-val">${visibleCount}</div>
        </div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon" style="background:rgba(239,68,68,0.15);">🙈</div>
        <div class="adm-stat-meta">
          <h3>Đã ẩn</h3>
          <div class="stat-val">${hiddenCount}</div>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="adm-toolbar" style="margin-bottom:16px;">
      <div class="adm-filters-left">
        <div class="adm-search-input-wrap">
          <span class="adm-search-icon">🔍</span>
          <input
            type="text"
            id="filter-search-comment"
            placeholder="Tìm theo tên, email, nội dung..."
            value="${escapeHtml(commentFilterQuery)}"
          />
        </div>
        <select class="adm-select" id="filter-status-comment">
          <option value="all"     ${commentFilterStatus === 'all'     ? 'selected' : ''}>Tất cả</option>
          <option value="visible" ${commentFilterStatus === 'visible' ? 'selected' : ''}>Đang hiển thị</option>
          <option value="hidden"  ${commentFilterStatus === 'hidden'  ? 'selected' : ''}>Đã ẩn</option>
        </select>
      </div>
      <div style="font-size:13px;color:var(--adm-text-muted);">
        Hiển thị: <strong>${filtered.length}</strong> / ${allComments.length} bình luận
      </div>
    </div>

    <!-- Table -->
    <div class="adm-table-container">
      ${filtered.length === 0 ? `
        <div class="adm-empty-state">
          <div class="adm-empty-icon">💬</div>
          <h3>Không tìm thấy bình luận nào</h3>
          <p>Chưa có bình luận phù hợp với bộ lọc hiện tại.</p>
        </div>
      ` : `
        <table class="adm-table">
          <thead>
            <tr>
              <th>Người gửi</th>
              <th>Email</th>
              <th>Sao</th>
              <th>Nội dung</th>
              <th>Ngày gửi</th>
              <th>Trạng thái</th>
              <th style="text-align:right;">Hành động</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(c => {
              const stars = '★'.repeat(c.rating) + '☆'.repeat(5 - c.rating);
              const date  = new Date(c.createdAt).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });
              const statusBadge = c.status === 'visible'
                ? '<span class="adm-badge adm-badge-active"><span class="adm-badge-dot"></span> Hiển thị</span>'
                : '<span class="adm-badge adm-badge-off"><span class="adm-badge-dot"></span> Đã ẩn</span>';
              const toggleBtn = c.status === 'visible'
                ? `<button class="adm-btn-secondary" style="padding:4px 10px;font-size:12px;" onclick="adminHideComment(${c.id})">🙈 Ẩn</button>`
                : `<button class="adm-btn-secondary" style="padding:4px 10px;font-size:12px;background:var(--adm-success);border-color:var(--adm-success);color:#000;" onclick="adminShowComment(${c.id})">👁 Hiện</button>`;
              return `
                <tr>
                  <td><strong>${escapeHtml(c.name)}</strong></td>
                  <td style="color:var(--adm-text-muted);font-size:12px;">${escapeHtml(c.email || '—')}</td>
                  <td style="color:#f59e0b;font-size:15px;letter-spacing:-1px;">${stars}</td>
                  <td style="max-width:260px;">
                    <div style="overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">
                      ${escapeHtml(c.content)}
                    </div>
                  </td>
                  <td style="font-size:12px;color:var(--adm-text-muted);white-space:nowrap;">${date}</td>
                  <td>${statusBadge}</td>
                  <td style="text-align:right;">
                    <div style="display:flex;gap:6px;justify-content:flex-end;">
                      ${toggleBtn}
                      <button class="adm-btn-secondary" style="padding:4px 10px;font-size:12px;background:var(--adm-danger);border-color:var(--adm-danger);color:#fff;" onclick="adminDeleteComment(${c.id})">🗑 Xóa</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `}
    </div>
  `;
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

// ── TAB 2: QUẢN LÝ LỊCH HẸN & ĐẶT LỊCH ──────────────────────
function renderAppointmentsManagementView() {
  const allApps = AppointmentManager.getAppointments();
  const allDocs = DoctorManager.getDoctors();
  
  // Nếu đang ở chế độ 1 Bác sĩ, tự động lọc theo Bác sĩ đó
  const effectiveFilter = { ...appFilterState };
  if (currentRoleMode !== 'admin') {
    effectiveFilter.doctorId = currentRoleMode;
  }

  const filteredApps = AppointmentManager.filterAppointments(allApps, effectiveFilter);

  const pendingCount = allApps.filter(a => a.status === 'pending').length;
  const inProgressCount = allApps.filter(a => a.status === 'in_progress').length;
  const confirmedCount = allApps.filter(a => a.status === 'confirmed').length;
  const completedCount = allApps.filter(a => a.status === 'completed').length;

  const currentDocObj = allDocs.find(d => String(d.id) === String(currentRoleMode));

  return `
    <div class="adm-page-header">
      <div class="adm-page-title">
        <h1>Quản lý Lịch Hẹn & Đặt Lịch Khám</h1>
        <p>Tiếp nhận ca khám, phân bổ 10 phòng khám chuyên biệt (Phòng 101 - 110) và cập nhật bệnh án & kê đơn thuốc</p>
      </div>
      <button class="adm-btn-create" id="btn-open-create-app-modal">
        <span>➕ Tạo Lịch Hẹn Mới</span>
      </button>
    </div>

    ${currentRoleMode !== 'admin' && currentDocObj ? `
    <!-- BANNER BÀN LÀM VIỆC CỦA BÁC SĨ -->
    <div style="background: linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(37,99,235,0.1) 100%); border: 1.5px solid #38bdf8; border-radius: 14px; padding: 14px 20px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 32px;">👨‍⚕️</span>
        <div>
          <div style="color: #38bdf8; font-weight: 800; font-size: 15px; text-transform: uppercase;">
            BÀN LÀM VIỆC BÁC SĨ: ${escapeHtml(currentDocObj.name)} (${escapeHtml(currentDocObj.degree)})
          </div>
          <div style="color: #cbd5e1; font-size: 13px; margin-top: 2px;">
            Trực tại: <strong style="color: #fbbf24;">${escapeHtml(currentDocObj.room || 'Phòng khám')}</strong> — Bạn đang xử lý bệnh nhân tại phòng của mình.
          </div>
        </div>
      </div>
      <button id="btn-switch-to-admin" style="padding: 8px 14px; background: rgba(255,255,255,0.12); color: #fff; border: 1px solid rgba(255,255,255,0.25); border-radius: 8px; cursor: pointer; font-size: 12.5px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
        👑 Quay lại Toàn quyền Super Admin
      </button>
    </div>
    ` : `
    <!-- BANNER TOÀN QUYỀN SUPER ADMIN -->
    <div style="background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.15); border-radius: 12px; padding: 10px 16px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 12.5px; color: var(--adm-text-muted);">
      <div>👑 <strong>Quyền hạn cao nhất (Admin):</strong> Điều hành toàn diện 10 bác sĩ & 10 phòng. Admin có quyền xem, chỉnh sửa hồ sơ bệnh án hoặc mở lại ca khám khi cần.</div>
    </div>
    `}

    <!-- Thống kê trạng thái ca khám -->
    <div class="adm-stats-grid">
      <div class="adm-stat-card">
        <div class="adm-stat-icon warning">⏳</div>
        <div class="adm-stat-meta">
          <h3>Chờ duyệt lịch</h3>
          <div class="stat-val">${pendingCount}</div>
        </div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon primary">📅</div>
        <div class="adm-stat-meta">
          <h3>Đã xác nhận lịch</h3>
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
      <div class="adm-filters-left" style="flex-wrap: wrap; gap: 10px;">
        <div class="adm-search-input-wrap">
          <span class="adm-search-icon">🔍</span>
          <input 
            type="text" 
            id="filter-search-app" 
            placeholder="Tìm theo Mã hẹn, Tên BN, SĐT, Bác sĩ..." 
            value="${escapeHtml(appFilterState.query)}"
          />
        </div>

        <select class="adm-select" id="filter-doctor-app">
          <option value="all" ${appFilterState.doctorId === 'all' ? 'selected' : ''}>Tất cả 10 Bác sĩ</option>
          ${allDocs.map(d => `
            <option value="${d.id}" ${appFilterState.doctorId === d.id ? 'selected' : ''}>👨‍⚕️ ${d.name} (${d.room || 'Phòng'})</option>
          `).join('')}
        </select>

        <select class="adm-select" id="filter-room-app">
          <option value="all" ${appFilterState.roomId === 'all' ? 'selected' : ''}>Tất cả 10 Phòng khám</option>
          ${CLINIC_ROOMS.map(r => `
            <option value="${r.id}" ${appFilterState.roomId === r.id ? 'selected' : ''}>${r.number} - ${r.name}</option>
          `).join('')}
        </select>

        <select class="adm-select" id="filter-status-app">
          <option value="all" ${appFilterState.status === 'all' ? 'selected' : ''}>Tất cả trạng thái</option>
          <option value="pending" ${appFilterState.status === 'pending' ? 'selected' : ''}>Chờ duyệt lịch</option>
          <option value="confirmed" ${appFilterState.status === 'confirmed' ? 'selected' : ''}>Đã xác nhận lịch</option>
          <option value="in_progress" ${appFilterState.status === 'in_progress' ? 'selected' : ''}>Đang khám tại phòng</option>
          <option value="completed" ${appFilterState.status === 'completed' ? 'selected' : ''}>Đã hoàn thành khám</option>
          <option value="cancelled" ${appFilterState.status === 'cancelled' ? 'selected' : ''}>Đã hủy hẹn</option>
        </select>
      </div>

      <div style="font-size: 13px; color: var(--adm-text-muted);">
        Hiển thị: <strong>${filteredApps.length}</strong> / ${allApps.length} ca hẹn
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
              <th style="text-align: right;">Hành động</th>
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
    pending: '<span class="adm-badge adm-badge-busy"><span class="adm-badge-dot"></span> Chờ duyệt</span>',
    confirmed: '<span class="adm-badge adm-badge-active"><span class="adm-badge-dot"></span> Đã xác nhận</span>',
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
        <div class="adm-actions" style="justify-content: flex-end; gap: 6px;">
          <button class="adm-btn-action view btn-view-patient-profile" data-id="${app.id}" title="Xem Phiếu Thông Tin & Ảnh 4x6 / CCCD Bệnh Nhân" style="background: rgba(168,85,247,0.18); color: #c084fc; border: 1px solid rgba(168,85,247,0.4); font-weight: 700; width: auto; padding: 4px 10px; font-size: 11.5px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
            📋 Phiếu BN
          </button>
          ${app.status === 'completed' || !!app.medicalRecord ? `
            <button class="adm-btn-action view btn-exam-record" data-id="${app.id}" title="Bác sĩ & Admin có thể Chỉnh sửa Bệnh Án / Đơn Thuốc / Viện Phí bất kỳ lúc nào" style="background: rgba(34,197,94,0.18); color: #4ade80; border: 1px solid rgba(34,197,94,0.4); font-weight: 700; width: auto; padding: 4px 10px; font-size: 11.5px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
              ✏️ Sửa Bệnh Án & Viện Phí
            </button>
          ` : `
            <button class="adm-btn-action edit btn-exam-record" data-id="${app.id}" title="Bác sĩ Khám, Viết bệnh án & Kê đơn thuốc" style="background: rgba(56,189,248,0.18); color: #38bdf8; border: 1px solid rgba(56,189,248,0.4); font-weight: 700; width: auto; padding: 4px 10px; font-size: 11.5px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
              🩺 Khám & Kê đơn
            </button>
          `}
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
  const allApps = AppointmentManager.getAppointments();
  const totalPending = allApps.filter(a => a.status === 'pending').length;

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

    ${totalPending > 0 ? `
    <!-- Banner cảnh báo chờ duyệt -->
    <div style="background: linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05)); border: 1.5px solid rgba(234,179,8,0.5); border-radius: 14px; padding: 16px 20px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 28px;">⏳</span>
        <div>
          <div style="font-weight: 800; color: #fbbf24; font-size: 15px;">Có ${totalPending} lịch hẹn đang chờ Admin xét duyệt</div>
          <div style="font-size: 12px; color: var(--adm-text-muted); margin-top: 2px;">Người dùng đã đặt lịch và đang chờ được xác nhận phòng khám</div>
        </div>
      </div>
      <button class="adm-btn-create btn-goto-pending-apps" style="background: linear-gradient(135deg, #d97706, #f59e0b); color: #000; white-space: nowrap;">
        📋 Xem tất cả lịch chờ duyệt (${totalPending})
      </button>
    </div>
    ` : ''}

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
      ${roomsOverview.map(r => {
        // Đếm lịch pending của phòng này
        const pendingForRoom = allApps.filter(a =>
          a.status === 'pending' &&
          (a.roomId === r.id || (a.roomName && a.roomName.includes(r.number)))
        );
        const pendingCount = pendingForRoom.length;

        return `
        <div style="background: var(--adm-bg-surface); border: 1px solid ${pendingCount > 0 ? 'rgba(234,179,8,0.5)' : r.isOccupied ? 'var(--adm-border-active)' : 'var(--adm-border)'}; border-radius: var(--adm-radius-lg); padding: 20px; box-shadow: var(--adm-shadow-sm); position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: ${pendingCount > 0 ? 'linear-gradient(90deg, #d97706, #fbbf24)' : r.isOccupied ? 'var(--adm-primary)' : 'var(--adm-border)'};"></div>
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <span style="font-size: 11px; font-weight: 700; background: rgba(56, 189, 248, 0.15); color: var(--adm-primary); padding: 2px 8px; border-radius: 4px;">
                ${r.floor}
              </span>
              <h3 style="color: #fff; font-size: 17px; margin-top: 6px;">${r.number}: ${r.name}</h3>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              ${pendingCount > 0 ? `
                <span style="background: rgba(234,179,8,0.2); color: #fbbf24; border: 1px solid rgba(234,179,8,0.4); padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700;">
                  ⏳ ${pendingCount} chờ
                </span>
              ` : ''}
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

          ${pendingCount > 0 ? `
          <!-- Danh sách bệnh nhân chờ duyệt -->
          <div style="background: rgba(234,179,8,0.06); border: 1px solid rgba(234,179,8,0.25); border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;">
            <div style="font-size: 11.5px; font-weight: 700; color: #fbbf24; margin-bottom: 8px;">⏳ Lịch hẹn chờ xét duyệt (${pendingCount}):</div>
            ${pendingForRoom.slice(0, 3).map(app => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed rgba(255,255,255,0.06);">
                <div>
                  <div style="font-size: 12px; color: #fff; font-weight: 600;">${escapeHtml(app.patientName)}</div>
                  <div style="font-size: 11px; color: var(--adm-text-muted);">${escapeHtml(app.timeSlot)} · ${escapeHtml(app.date)}</div>
                </div>
                <button class="adm-btn-action edit btn-quick-approve" data-id="${app.id}" title="Duyệt & Xác nhận lịch nhanh" style="font-size: 11px; padding: 3px 8px;">
                  ✅ Duyệt
                </button>
              </div>
            `).join('')}
            ${pendingCount > 3 ? `<div style="font-size: 11px; color: var(--adm-text-muted); margin-top: 6px; text-align: center;">... và ${pendingCount - 3} lịch hẹn khác</div>` : ''}
          </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; gap: 8px;">
            <span style="color: var(--adm-text-muted);">Đang có: <strong style="color: #38bdf8;">${r.activeCount} ca</strong></span>
            <div style="display: flex; gap: 6px;">
              ${pendingCount > 0 ? `
                <button class="adm-btn-create btn-room-pending-apps" data-room-id="${r.id}" style="padding: 5px 10px; font-size: 11px; background: linear-gradient(135deg, #d97706, #f59e0b); color: #000;">
                  ⏳ Duyệt ${pendingCount} chờ
                </button>
              ` : ''}
              <button class="adm-btn-create btn-room-view-apps" data-room-id="${r.id}" style="padding: 5px 10px; font-size: 11px;">
                Xem tất cả →
              </button>
            </div>
          </div>
        </div>
        `;
      }).join('')}
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
            📅 Quản lý Lịch Hẹn & Đặt Lịch
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

// ── TAB 5: QUẢN LÝ TÀI KHOẢN (ADMIN TOÀN QUYỀN) ──────────────
let accountTab = 'patients'; // 'patients' | 'doctors'
let accountSearch = '';

function getAccountUsers() {
  try {
    const data = localStorage.getItem('doctor4_users_db');
    let users = data ? JSON.parse(data) : [];

    // 1. Đảm bảo tài khoản Admin luôn có
    if (!users.some(u => u.role === 'admin' || u.email === 'admin@doctor4.vn')) {
      users.unshift({
        id: 'usr_admin_001',
        name: 'Quản Trị Viên (Super Admin)',
        email: 'admin@doctor4.vn',
        phone: '0912345678',
        password: '123456',
        role: 'admin',
        createdAt: new Date().toISOString()
      });
    }

    // 2. Đảm bảo tài khoản Bệnh nhân mẫu luôn có
    if (!users.some(u => u.email === 'benhnhan@doctor4.vn')) {
      users.push({
        id: 'usr_patient_001',
        name: 'Nguyễn Văn An (Bệnh nhân)',
        email: 'benhnhan@doctor4.vn',
        phone: '0987654321',
        password: '123456',
        role: 'patient',
        createdAt: new Date().toISOString()
      });
    }

    // 3. Đảm bảo TẤT CẢ 10 Bác sĩ của phòng khám đều có tài khoản đăng nhập (mật khẩu mặc định: 123456)
    const allDoctors = DoctorManager.getDoctors();
    allDoctors.forEach(doc => {
      const cleanEmail = (doc.email || `doc.${doc.id}@doctor4.vn`).trim().toLowerCase();
      const cleanPhone = (doc.phone || '').replace(/\s+/g, '');
      const existing = users.find(u => 
        (u.doctorId && String(u.doctorId) === String(doc.id)) ||
        (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) ||
        (cleanPhone && u.phone && u.phone.replace(/\s+/g, '') === cleanPhone)
      );

      if (!existing) {
        users.push({
          id: 'usr_' + doc.id,
          doctorId: doc.id,
          name: doc.name,
          email: cleanEmail,
          phone: cleanPhone || '0988000000',
          password: doc.password || '123456',
          role: 'doctor',
          degree: doc.degree || 'Bác sĩ chuyên khoa',
          specialty: doc.specialty || 'Khám Mắt',
          room: doc.room || 'Phòng 101',
          roomId: doc.roomId || 'R101',
          schedule: doc.schedule || 'Thứ 2 - Thứ 6 (08:00 - 17:00)',
          avatar: doc.avatar,
          createdAt: new Date().toISOString()
        });
      } else {
        if (!existing.password) existing.password = doc.password || '123456';
        if (!existing.role) existing.role = 'doctor';
        if (!existing.doctorId) existing.doctorId = doc.id;
        if (!existing.room && doc.room) existing.room = doc.room;
        if (!existing.roomId && doc.roomId) existing.roomId = doc.roomId;
        if (!existing.specialty && doc.specialty) existing.specialty = doc.specialty;
      }
    });

    localStorage.setItem('doctor4_users_db', JSON.stringify(users));
    return users;
  } catch (e) {
    console.error('Lỗi getAccountUsers:', e);
    return [];
  }
}

function saveAccountUsers(users) {
  localStorage.setItem('doctor4_users_db', JSON.stringify(users));
}

function renderAccountsManagementView() {
  const allUsers = getAccountUsers();
  const patients = allUsers.filter(u => u.role === 'patient');
  const doctors  = allUsers.filter(u => u.role === 'doctor');
  const admins   = allUsers.filter(u => u.role === 'admin');

  const searchLC = accountSearch.toLowerCase();
  const filteredPatients = patients.filter(u =>
    u.name.toLowerCase().includes(searchLC) ||
    u.email.toLowerCase().includes(searchLC) ||
    (u.phone || '').includes(searchLC)
  );
  const filteredDoctors = doctors.filter(u =>
    u.name.toLowerCase().includes(searchLC) ||
    u.email.toLowerCase().includes(searchLC) ||
    (u.phone || '').includes(searchLC)
  );

  const list = accountTab === 'patients' ? filteredPatients : filteredDoctors;

  return `
    <div class="adm-page-header">
      <div class="adm-page-title">
        <h1>🔑 Quản lý Tài khoản Hệ thống</h1>
        <p>Admin có toàn quyền: xem, sửa, đặt lại mật khẩu và xóa tài khoản người dùng & bác sĩ</p>
      </div>
      <button class="adm-btn-create" id="btn-open-create-account">
        <span>➕ ${accountTab === 'doctors' ? 'Cấp tài khoản Bác sĩ mới' : 'Thêm Bệnh nhân mới'}</span>
      </button>
    </div>

    <!-- Stats nhanh -->
    <div class="adm-stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 20px;">
      <div class="adm-stat-card">
        <div class="adm-stat-icon primary">👤</div>
        <div class="adm-stat-meta">
          <h3>Tài khoản Bệnh nhân</h3>
          <div class="stat-val">${patients.length}</div>
        </div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon success">🩺</div>
        <div class="adm-stat-meta">
          <h3>Tài khoản Bác sĩ</h3>
          <div class="stat-val">${doctors.length}</div>
        </div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon accent">🛡️</div>
        <div class="adm-stat-meta">
          <h3>Tài khoản Admin</h3>
          <div class="stat-val">${admins.length}</div>
        </div>
      </div>
    </div>

    <!-- Tab switch -->
    <div style="display:flex;gap:8px;margin-bottom:16px;border-bottom:1px solid var(--adm-border);padding-bottom:8px;">
      <button id="acct-tab-patients" class="adm-btn-secondary" style="${accountTab === 'patients' ? 'background:var(--adm-primary);color:#fff;border-color:var(--adm-primary);' : ''}">
        👤 Bệnh nhân (${patients.length})
      </button>
      <button id="acct-tab-doctors" class="adm-btn-secondary" style="${accountTab === 'doctors' ? 'background:#0d9488;color:#fff;border-color:#0d9488;' : ''}">
        🩺 Bác sĩ (${doctors.length})
      </button>
    </div>

    <!-- Toolbar tìm kiếm -->
    <div class="adm-toolbar" style="margin-bottom:16px;">
      <div class="adm-search-input-wrap" style="min-width:320px;">
        <span class="adm-search-icon">🔍</span>
        <input type="text" id="acct-search" placeholder="Tìm theo tên, email, số điện thoại..."
          value="${escapeHtml(accountSearch)}" style="width:100%;"/>
      </div>
      <div style="font-size:13px;color:var(--adm-text-muted);">
        Hiển thị: <strong>${list.length}</strong> tài khoản
      </div>
    </div>

    <!-- Bảng danh sách tài khoản -->
    <div class="adm-table-container">
      ${list.length === 0 ? `
        <div class="adm-empty-state">
          <div class="adm-empty-icon">🔎</div>
          <h3>Không tìm thấy tài khoản nào</h3>
          <p>Hãy thử thay đổi từ khóa tìm kiếm.</p>
        </div>
      ` : `
        <table class="adm-table">
          <thead>
            <tr>
              <th>${accountTab === 'doctors' ? 'Bác sĩ' : 'Bệnh nhân'}</th>
              <th>Email / SĐT đăng nhập</th>
              ${accountTab === 'doctors' ? '<th>Chuyên khoa & Phòng</th>' : '<th>Ngày đăng ký</th>'}
              <th>Mật khẩu</th>
              <th style="text-align:right;">Hành động</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(u => renderAccountRow(u)).join('')}
          </tbody>
        </table>
      `}
    </div>
  `;
}

function renderAccountRow(u) {
  const isDoctor = u.role === 'doctor';
  const maskedPwd = '●●●●●●';
  return `
    <tr data-uid="${u.id}">
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:38px;height:38px;border-radius:50%;overflow:hidden;flex-shrink:0;background:rgba(56,189,248,0.15);display:flex;align-items:center;justify-content:center;font-size:18px;">
            ${u.avatar ? `<img src="${u.avatar}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.textContent='${isDoctor ? '🩺' : '👤'}'"/>` : (isDoctor ? '🩺' : '👤')}
          </div>
          <div>
            <div style="font-weight:700;color:#fff;font-size:14px;">${escapeHtml(u.name)}</div>
            <div style="font-size:11px;color:var(--adm-text-muted);">${isDoctor ? escapeHtml(u.degree || 'Bác sĩ') : 'Bệnh nhân'}</div>
          </div>
        </div>
      </td>
      <td>
        <div style="font-weight:600;color:var(--adm-primary);font-size:13px;">${escapeHtml(u.email)}</div>
        <div style="color:var(--adm-text-muted);font-size:12px;">📞 ${escapeHtml(u.phone || '—')}</div>
      </td>
      <td>
        ${isDoctor
          ? `<div style="font-size:13px;color:#4ade80;font-weight:600;">${escapeHtml(u.specialty || 'Nhãn khoa')}</div>
             <div style="font-size:11px;color:var(--adm-text-muted);">📍 ${escapeHtml(u.room || '—')}</div>`
          : `<div style="font-size:12px;color:var(--adm-text-muted);">${u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}</div>`
        }
      </td>
      <td>
        <div class="acct-pwd-cell" data-uid="${u.id}" style="font-family:monospace;font-size:14px;cursor:pointer;color:var(--adm-text-muted);" title="Click để hiện mật khẩu">
          ${maskedPwd}
        </div>
      </td>
      <td>
        <div class="adm-actions" style="justify-content:flex-end;gap:6px;">
          <button class="adm-btn-action edit btn-edit-account" data-uid="${u.id}" title="Sửa thông tin tài khoản">✏️</button>
          <button class="adm-btn-action edit btn-reset-pwd" data-uid="${u.id}" title="Đặt lại mật khẩu" style="background:rgba(251,191,36,0.15);color:#fbbf24;border-color:rgba(251,191,36,0.4);">🔑</button>
          <button class="adm-btn-action delete btn-delete-account" data-uid="${u.id}" title="Xóa tài khoản">🗑️</button>
        </div>
      </td>
    </tr>
  `;
}

function openAccountModal(user = null) {
  const isEdit = !!user;
  const isDoctor = user?.role === 'doctor';
  const allDocs = DoctorManager.getDoctors();
  const modalRoot = document.getElementById('adm-modals-root');

  modalRoot.innerHTML = `
    <div class="adm-modal-overlay" id="adm-modal-overlay">
      <div class="adm-modal" style="max-width:600px;">
        <div class="adm-modal-header">
          <h3>${isEdit ? '✏️ Sửa tài khoản: ' + escapeHtml(user.name) : (accountTab === 'doctors' ? '🩺 Cấp tài khoản Bác sĩ mới' : '👤 Thêm tài khoản Bệnh nhân')}</h3>
          <button class="adm-modal-close" id="btn-close-acct-modal">✕</button>
        </div>
        <form id="adm-account-form">
          <div class="adm-modal-body">

            ${!isEdit && accountTab === 'doctors' ? `
            <div class="adm-form-group">
              <label class="adm-form-label">Chọn Bác sĩ (từ danh sách) hoặc nhập thủ công bên dưới</label>
              <select id="acct-doctor-select" class="adm-input adm-input-no-icon">
                <option value="">— Nhập thủ công —</option>
                ${allDocs.map(d => `<option value="${d.id}">${d.name} (${d.degree}) — ${d.room || ''}</option>`).join('')}
              </select>
            </div>
            ` : ''}

            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-form-label">Họ và tên *</label>
                <input type="text" id="acct-name" class="adm-input adm-input-no-icon"
                  value="${user ? escapeHtml(user.name) : ''}" placeholder="Nguyễn Văn A" required/>
              </div>
              <div class="adm-form-group">
                <label class="adm-form-label">Vai trò</label>
                <select id="acct-role" class="adm-input adm-input-no-icon" ${isEdit ? 'disabled' : ''}>
                  <option value="patient" ${(user?.role === 'patient' || accountTab === 'patients') ? 'selected' : ''}>👤 Bệnh nhân</option>
                  <option value="doctor" ${(user?.role === 'doctor' || accountTab === 'doctors') ? 'selected' : ''}>🩺 Bác sĩ</option>
                </select>
              </div>
            </div>

            <div class="adm-grid-2">
              <div class="adm-form-group">
                <label class="adm-form-label">Email đăng nhập *</label>
                <input type="email" id="acct-email" class="adm-input adm-input-no-icon"
                  value="${user ? escapeHtml(user.email) : ''}" placeholder="email@doctor4.vn" required/>
              </div>
              <div class="adm-form-group">
                <label class="adm-form-label">Số điện thoại</label>
                <input type="text" id="acct-phone" class="adm-input adm-input-no-icon"
                  value="${user ? escapeHtml(user.phone || '') : ''}" placeholder="0912345678"/>
              </div>
            </div>

            ${!isEdit ? `
            <div class="adm-form-group">
              <label class="adm-form-label">Mật khẩu *</label>
              <div style="display:flex;gap:8px;align-items:center;">
                <input type="text" id="acct-password" class="adm-input adm-input-no-icon"
                  value="123456" placeholder="Mật khẩu mặc định: 123456" required style="flex:1;"/>
                <button type="button" id="btn-gen-pwd" class="adm-btn-secondary" style="white-space:nowrap;">
                  🎲 Tạo ngẫu nhiên
                </button>
              </div>
            </div>
            ` : ''}

            <div id="doctor-extra-fields" style="display:${(isDoctor || accountTab === 'doctors') ? 'block' : 'none'}">
              <div class="adm-grid-2">
                <div class="adm-form-group">
                  <label class="adm-form-label">Học vị / Học hàm</label>
                  <input type="text" id="acct-degree" class="adm-input adm-input-no-icon"
                    value="${user ? escapeHtml(user.degree || '') : 'BS. Chuyên khoa I'}" placeholder="BS. CKI..."/>
                </div>
                <div class="adm-form-group">
                  <label class="adm-form-label">Chuyên khoa</label>
                  <input type="text" id="acct-specialty" class="adm-input adm-input-no-icon"
                    value="${user ? escapeHtml(user.specialty || '') : 'Nhãn khoa'}" placeholder="Nhãn khoa..."/>
                </div>
              </div>
              <div class="adm-grid-2">
                <div class="adm-form-group">
                  <label class="adm-form-label">Phòng khám</label>
                  <select id="acct-room" class="adm-input adm-input-no-icon">
                    ${CLINIC_ROOMS.map(r => `<option value="${r.id}" ${user?.roomId === r.id ? 'selected' : ''}>${r.number}: ${r.name}</option>`).join('')}
                  </select>
                </div>
                <div class="adm-form-group">
                  <label class="adm-form-label">Ca làm việc</label>
                  <input type="text" id="acct-schedule" class="adm-input adm-input-no-icon"
                    value="${user ? escapeHtml(user.schedule || '') : 'Thứ 2 - Thứ 6 (08:00 - 17:00)'}" placeholder="Lịch trực..."/>
                </div>
              </div>
            </div>

          </div>
          <div class="adm-modal-footer">
            <button type="button" class="adm-btn-secondary" id="btn-cancel-acct-modal">Hủy</button>
            <button type="submit" class="adm-btn-create">
              <span>💾 ${isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const closeModal = () => { modalRoot.innerHTML = ''; };
  document.getElementById('btn-close-acct-modal').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-acct-modal').addEventListener('click', closeModal);

  // Tạo mật khẩu ngẫu nhiên
  document.getElementById('btn-gen-pwd')?.addEventListener('click', () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    document.getElementById('acct-password').value = pwd;
  });

  // Hiện/ẩn field bác sĩ khi đổi vai trò
  document.getElementById('acct-role')?.addEventListener('change', (e) => {
    document.getElementById('doctor-extra-fields').style.display =
      e.target.value === 'doctor' ? 'block' : 'none';
  });

  // Điền thông tin bác sĩ từ dropdown (chỉ khi tạo mới bác sĩ)
  document.getElementById('acct-doctor-select')?.addEventListener('change', (e) => {
    const docId = e.target.value;
    if (!docId) return;
    const doc = allDocs.find(d => d.id === docId);
    if (!doc) return;
    document.getElementById('acct-name').value = doc.name || '';
    document.getElementById('acct-email').value = doc.email || '';
    document.getElementById('acct-phone').value = (doc.phone || '').replace(/\s+/g, '');
    document.getElementById('acct-degree').value = doc.degree || '';
    document.getElementById('acct-specialty').value = doc.specialty || '';
    document.getElementById('acct-schedule').value = doc.schedule || '';
    document.getElementById('acct-room').value = doc.roomId || '';
    document.getElementById('doctor-extra-fields').style.display = 'block';
  });

  // Submit
  document.getElementById('adm-account-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const users = getAccountUsers();
    const role = isEdit ? user.role : (document.getElementById('acct-role').value);
    const name = document.getElementById('acct-name').value.trim();
    const email = document.getElementById('acct-email').value.trim().toLowerCase();
    const phone = document.getElementById('acct-phone').value.trim().replace(/\s+/g, '');
    const pwd = isEdit ? (user.password || '123456') : document.getElementById('acct-password').value.trim();

    // Kiểm tra email trùng (khi tạo mới hoặc đổi email)
    if (!isEdit || email !== user.email.toLowerCase()) {
      if (users.some(u => u.id !== (user?.id) && u.email.toLowerCase() === email)) {
        showToast('Email này đã được sử dụng bởi tài khoản khác!', 'error');
        return;
      }
    }

    if (isEdit) {
      const idx = users.findIndex(u => u.id === user.id);
      if (idx >= 0) {
        users[idx] = {
          ...users[idx],
          name, email, phone,
          ...(role === 'doctor' ? {
            degree: document.getElementById('acct-degree').value.trim(),
            specialty: document.getElementById('acct-specialty').value.trim(),
            roomId: document.getElementById('acct-room').value,
            room: CLINIC_ROOMS.find(r => r.id === document.getElementById('acct-room').value)?.number || users[idx].room,
            schedule: document.getElementById('acct-schedule').value.trim(),
          } : {}),
          updatedAt: new Date().toISOString()
        };
        saveAccountUsers(users);

        // Đồng bộ cập nhật bác sĩ trong DoctorManager nếu có liên kết
        if (role === 'doctor' && users[idx].doctorId) {
          DoctorManager.updateDoctor(users[idx].doctorId, {
            name, email, phone,
            degree: document.getElementById('acct-degree').value.trim(),
            specialty: document.getElementById('acct-specialty').value.trim(),
            roomId: document.getElementById('acct-room').value,
            room: CLINIC_ROOMS.find(r => r.id === document.getElementById('acct-room').value)?.number || users[idx].room,
            schedule: document.getElementById('acct-schedule').value.trim()
          });
        }
        showToast(`Đã cập nhật tài khoản ${name} thành công!`, 'success');
      }
    } else {
      let selectedDocId = document.getElementById('acct-doctor-select')?.value || null;
      let degree = role === 'doctor' ? document.getElementById('acct-degree').value.trim() : '';
      let specialty = role === 'doctor' ? document.getElementById('acct-specialty').value.trim() : '';
      let roomId = role === 'doctor' ? document.getElementById('acct-room').value : '';
      let roomName = CLINIC_ROOMS.find(r => r.id === roomId)?.number || 'Phòng 101';
      let schedule = role === 'doctor' ? document.getElementById('acct-schedule').value.trim() : '';

      if (role === 'doctor' && !selectedDocId) {
        // Tự động tạo hồ sơ bác sĩ trong DoctorManager để hiển thị trên danh mục bác sĩ phòng khám
        const createdDoc = DoctorManager.createDoctor({
          name,
          degree: degree || 'BS. Chuyên khoa',
          specialty: specialty || 'Khám Mắt',
          specialtyCode: 'general',
          roomId: roomId || 'R101',
          room: roomName,
          schedule: schedule || 'Thứ 2 - Thứ 6 (08:00 - 17:00)',
          phone,
          email,
          password: pwd
        });
        selectedDocId = createdDoc.id;
      }

      const newUser = {
        id: 'usr_adm_' + Date.now(),
        name, email, phone, password: pwd,
        role,
        createdAt: new Date().toISOString(),
        ...(role === 'doctor' ? {
          doctorId: selectedDocId,
          degree,
          specialty,
          roomId,
          room: roomName,
          schedule
        } : {})
      };
      users.push(newUser);
      saveAccountUsers(users);
      showToast(`✅ Đã cấp tài khoản cho ${name}! Email: ${email} | MK: ${pwd}`, 'success', 7000);
    }

    closeModal();
    refreshMainView();
  });
}

function openResetPasswordModal(uid) {
  const users = getAccountUsers();
  const user = users.find(u => u.id === uid);
  if (!user) return;
  const modalRoot = document.getElementById('adm-modals-root');

  modalRoot.innerHTML = `
    <div class="adm-modal-overlay" id="adm-modal-overlay">
      <div class="adm-modal" style="max-width:420px;">
        <div class="adm-modal-header">
          <h3>🔑 Đặt lại mật khẩu: ${escapeHtml(user.name)}</h3>
          <button class="adm-modal-close" id="btn-close-reset-pwd">✕</button>
        </div>
        <div class="adm-modal-body">
          <div style="background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.2);border-radius:8px;padding:12px;margin-bottom:16px;font-size:13px;">
            <div>Email: <strong style="color:var(--adm-primary);">${escapeHtml(user.email)}</strong></div>
            <div style="margin-top:4px;">Vai trò: <strong>${user.role === 'doctor' ? '🩺 Bác sĩ' : user.role === 'admin' ? '🛡️ Admin' : '👤 Bệnh nhân'}</strong></div>
          </div>
          <div class="adm-form-group">
            <label class="adm-form-label">Mật khẩu mới *</label>
            <div style="display:flex;gap:8px;">
              <input type="text" id="new-pwd-input" class="adm-input adm-input-no-icon" value="123456" style="flex:1;"/>
              <button type="button" id="btn-gen-new-pwd" class="adm-btn-secondary">🎲</button>
            </div>
          </div>
        </div>
        <div class="adm-modal-footer">
          <button type="button" class="adm-btn-secondary" id="btn-cancel-reset-pwd">Hủy</button>
          <button type="button" class="adm-btn-create" id="btn-confirm-reset-pwd">
            <span>✅ Xác nhận đặt lại</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { modalRoot.innerHTML = ''; };
  document.getElementById('btn-close-reset-pwd').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-reset-pwd').addEventListener('click', closeModal);

  document.getElementById('btn-gen-new-pwd').addEventListener('click', () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    document.getElementById('new-pwd-input').value = pwd;
  });

  document.getElementById('btn-confirm-reset-pwd').addEventListener('click', () => {
    const newPwd = document.getElementById('new-pwd-input').value.trim();
    if (!newPwd || newPwd.length < 4) {
      showToast('Mật khẩu phải có ít nhất 4 ký tự!', 'error');
      return;
    }
    const idx = users.findIndex(u => u.id === uid);
    if (idx >= 0) {
      users[idx].password = newPwd;
      users[idx].updatedAt = new Date().toISOString();
      saveAccountUsers(users);
      showToast(`🔑 Đã đặt lại mật khẩu cho ${user.name}! Mật khẩu mới: ${newPwd}`, 'success', 7000);
      closeModal();
      refreshMainView();
    }
  });
}

function openDeleteAccountModal(uid) {
  const users = getAccountUsers();
  const user = users.find(u => u.id === uid);
  if (!user) return;
  const modalRoot = document.getElementById('adm-modals-root');

  modalRoot.innerHTML = `
    <div class="adm-modal-overlay" id="adm-modal-overlay">
      <div class="adm-modal" style="max-width:420px;">
        <div class="adm-modal-header" style="border-bottom-color:rgba(239,68,68,0.4);">
          <h3 style="color:#f87171;">🗑️ Xóa tài khoản</h3>
          <button class="adm-modal-close" id="btn-close-del-acct">✕</button>
        </div>
        <div class="adm-modal-body" style="text-align:center;padding:24px;">
          <div style="font-size:3rem;margin-bottom:12px;">⚠️</div>
          <h3 style="color:#fff;margin-bottom:8px;">Bạn chắc chắn muốn xóa?</h3>
          <p style="color:var(--adm-text-muted);margin-bottom:16px;">
            Tài khoản <strong style="color:#f87171;">${escapeHtml(user.name)}</strong> (${escapeHtml(user.email)}) sẽ bị xóa vĩnh viễn và không thể đăng nhập lại.
          </p>
          ${user.role === 'admin' ? `<div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.4);border-radius:8px;padding:10px;color:#f87171;font-size:13px;">⛔ Không thể xóa tài khoản Admin!</div>` : ''}
        </div>
        <div class="adm-modal-footer">
          <button type="button" class="adm-btn-secondary" id="btn-cancel-del-acct">Hủy</button>
          ${user.role !== 'admin' ? `
          <button type="button" class="adm-btn-delete" id="btn-confirm-del-acct"
            style="background:rgba(239,68,68,0.2);color:#f87171;border:1px solid rgba(239,68,68,0.4);padding:8px 20px;border-radius:8px;font-weight:700;cursor:pointer;">
            🗑️ Xóa vĩnh viễn
          </button>` : ''}
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { modalRoot.innerHTML = ''; };
  document.getElementById('btn-close-del-acct').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-del-acct').addEventListener('click', closeModal);

  document.getElementById('btn-confirm-del-acct')?.addEventListener('click', () => {
    const updated = users.filter(u => u.id !== uid);
    saveAccountUsers(updated);
    // Nếu là bác sĩ, đồng bộ xóa khỏi DoctorManager
    if (user.role === 'doctor' && user.doctorId) {
      DoctorManager.deleteDoctor(user.doctorId);
    }
    showToast(`🗑️ Đã xóa tài khoản ${user.name}!`, 'success');
    closeModal();
    refreshMainView();
  });
}

function renderPaymentsManagementView() {
  const payments =
    JSON.parse(localStorage.getItem('payments')) || [];

  const pendingPayments =
    payments.filter(p => p.status === 'pending');

  const successPayments =
    payments.filter(p => p.status === 'success');

  const totalMoney =
    successPayments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );

  return `
    <div class="adm-page-header">
      <div class="adm-page-title">
        <h1>💳 Quản lý Thanh toán</h1>
        <p>Quản lý các giao dịch thanh toán QR của khách hàng</p>
      </div>
    </div>

    <div class="adm-stats-grid">

      <div class="adm-stat-card">
        <div class="adm-stat-icon primary">💳</div>
        <div class="adm-stat-meta">
          <h3>Tổng giao dịch</h3>
          <div class="stat-val">${payments.length}</div>
        </div>
      </div>

      <div class="adm-stat-card">
        <div class="adm-stat-icon warning">⏳</div>
        <div class="adm-stat-meta">
          <h3>Chờ xác nhận</h3>
          <div class="stat-val">${pendingPayments.length}</div>
        </div>
      </div>

      <div class="adm-stat-card">
        <div class="adm-stat-icon success">✓</div>
        <div class="adm-stat-meta">
          <h3>Đã thanh toán</h3>
          <div class="stat-val">${successPayments.length}</div>
        </div>
      </div>

      <div class="adm-stat-card">
        <div class="adm-stat-icon accent">💰</div>
        <div class="adm-stat-meta">
          <h3>Doanh thu</h3>
          <div class="stat-val">
            ${totalMoney.toLocaleString('vi-VN')}đ
          </div>
        </div>
      </div>

    </div>

    <div class="adm-card" style="margin-top: 24px; overflow-x: auto;">

      <table class="adm-table" style="width:100%;">

        <thead>
          <tr>
            <th>Mã giao dịch</th>
            <th>Khách hàng</th>
            <th>Bác sĩ</th>
            <th>Ngày khám</th>
            <th>Giờ</th>
            <th>Số tiền</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>

          ${
            payments.length === 0
              ? `
                <tr>
                  <td colspan="8"
                      style="text-align:center;padding:40px;">
                    Chưa có giao dịch thanh toán nào.
                  </td>
                </tr>
              `
              : payments.map((payment, index) => {

                  let statusHtml = '';

                  if (payment.status === 'success') {
                    statusHtml = `
                      <span style="
                        background:#dcfce7;
                        color:#166534;
                        padding:6px 10px;
                        border-radius:8px;
                        font-weight:700;
                      ">
                        ✓ Đã thanh toán
                      </span>
                    `;
                  }
                  else if (payment.status === 'cancel') {
                    statusHtml = `
                      <span style="
                        background:#fee2e2;
                        color:#991b1b;
                        padding:6px 10px;
                        border-radius:8px;
                        font-weight:700;
                      ">
                        ✕ Từ chối
                      </span>
                    `;
                  }
                  else {
                    statusHtml = `
                      <span style="
                        background:#fef3c7;
                        color:#92400e;
                        padding:6px 10px;
                        border-radius:8px;
                        font-weight:700;
                      ">
                        ⏳ Chờ xác nhận
                      </span>
                    `;
                  }

                  return `
                    <tr>

                      <td>
                        <strong>${escapeHtml(payment.id)}</strong>
                      </td>

                      <td>
                        ${escapeHtml(payment.patientName)}
                      </td>

                      <td>
                        ${escapeHtml(payment.doctorName)}
                      </td>

                      <td>
                        ${escapeHtml(payment.date)}
                      </td>

                      <td>
                        ${escapeHtml(payment.time)}
                      </td>

                      <td>
                        <strong>
                          ${Number(payment.amount || 0)
                            .toLocaleString('vi-VN')}đ
                        </strong>
                      </td>

                      <td>
                        ${statusHtml}
                      </td>

                      <td>

                        ${
                          payment.status === 'pending'
                            ? `
                              <button
  type="button"
  class="adm-btn-action"
  data-payment-action="confirm"
  data-payment-index="${index}"
  style="background:rgba(34,197,94,.15);color:#22c55e;border-color:rgba(34,197,94,.35);"
  title="Xác nhận">
  ✓
</button>

                              <button
  type="button"
  class="adm-btn-action"
  data-payment-action="cancel"
  data-payment-index="${index}"
  style="background:rgba(239,68,68,.15);color:#ef4444;border-color:rgba(239,68,68,.35);"
  title="Từ chối">
  ✕
</button>
                            `
                            : ''
                        }

                       <button
  type="button"
  class="adm-btn-action delete"
  data-payment-action="delete"
  data-payment-index="${index}"
  title="Xóa">
  🗑️
</button>

                      </td>

                    </tr>
                  `;
                }).join('')
          }

        </tbody>

      </table>

    </div>
  `;
}

function confirmAdminPayment(index) {
  const payments = JSON.parse(
    localStorage.getItem('payments') || '[]'
  );

  const payment = payments[index];

  if (!payment) {
    showToast('Không tìm thấy giao dịch.', 'error');
    return;
  }

  payment.status = 'success';
  payment.confirmedAt = new Date().toLocaleString('vi-VN');

  // Lưu danh sách thanh toán
  localStorage.setItem(
    'payments',
    JSON.stringify(payments)
  );

  // Lưu riêng giao dịch
  localStorage.setItem(
    'payment_' + payment.id,
    JSON.stringify(payment)
  );

  showToast(
    'Đã xác nhận thanh toán thành công!',
    'success'
  );

  refreshMainView();
}
window.confirmAdminPayment = confirmAdminPayment;
window.cancelAdminPayment = cancelAdminPayment;
window.deleteAdminPayment = deleteAdminPayment;

function cancelAdminPayment(index) {
  const payments = JSON.parse(
    localStorage.getItem('payments') || '[]'
  );

  const payment = payments[index];

  if (!payment) {
    showToast('Không tìm thấy giao dịch.', 'error');
    return;
  }

  payment.status = 'cancel';
  payment.cancelledAt = new Date().toLocaleString('vi-VN');

  localStorage.setItem(
    'payments',
    JSON.stringify(payments)
  );

  localStorage.setItem(
    'payment_' + payment.id,
    JSON.stringify(payment)
  );

  showToast(
    'Đã từ chối giao dịch.',
    'info'
  );

  refreshMainView();
}


function deleteAdminPayment(index) {
  const payments = JSON.parse(
    localStorage.getItem('payments') || '[]'
  );

  const payment = payments[index];

  if (!payment) {
    showToast('Không tìm thấy giao dịch.', 'error');
    return;
  }

  const ok = confirm(
    'Bạn có chắc muốn xóa giao dịch này không?'
  );

  if (!ok) {
    return;
  }

  payments.splice(index, 1);

  localStorage.setItem(
    'payments',
    JSON.stringify(payments)
  );

  localStorage.removeItem(
    'payment_' + payment.id
  );

  showToast(
    'Đã xóa giao dịch.',
    'info'
  );

  refreshMainView();
}


function bindAccountsEvents() {
  // Tab switch
  document.getElementById('acct-tab-patients')?.addEventListener('click', () => {
    accountTab = 'patients';
    accountSearch = '';
    refreshMainView();
  });
  document.getElementById('acct-tab-doctors')?.addEventListener('click', () => {
    accountTab = 'doctors';
    accountSearch = '';
    refreshMainView();
  });

  // Search
  document.getElementById('acct-search')?.addEventListener('input', (e) => {
    accountSearch = e.target.value;
    const content = document.getElementById('adm-main-content');
    if (content) {
      content.innerHTML = renderAccountsManagementView();
      bindAccountsEvents();
      const inp = document.getElementById('acct-search');
      if (inp) {
        inp.focus();
        const v = inp.value;
        inp.value = '';
        inp.value = v;
      }
    }
  });

  // Mở modal tạo mới
  document.getElementById('btn-open-create-account')?.addEventListener('click', () => {
    openAccountModal(null);
  });

  // Sửa tài khoản
  document.querySelectorAll('.btn-edit-account').forEach(btn => {
    btn.addEventListener('click', () => {
      const uid = btn.getAttribute('data-uid');
      const user = getAccountUsers().find(u => u.id === uid);
      if (user) openAccountModal(user);
    });
  });

  // Đặt lại mật khẩu
  document.querySelectorAll('.btn-reset-pwd').forEach(btn => {
    btn.addEventListener('click', () => {
      openResetPasswordModal(btn.getAttribute('data-uid'));
    });
  });

  // Xóa tài khoản
  document.querySelectorAll('.btn-delete-account').forEach(btn => {
    btn.addEventListener('click', () => {
      openDeleteAccountModal(btn.getAttribute('data-uid'));
    });
  });

  // Toggle hiện mật khẩu
  document.querySelectorAll('.acct-pwd-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const uid = cell.getAttribute('data-uid');
      const user = getAccountUsers().find(u => u.id === uid);
      if (!user) return;
      if (cell.textContent.includes('●')) {
        cell.textContent = user.password || '(chưa đặt)';
        cell.style.color = '#4ade80';
        setTimeout(() => {
          cell.textContent = '●●●●●●';
          cell.style.color = 'var(--adm-text-muted)';
        }, 3000);
      }
    });
  });
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
// 4. MODALS (THÊM/SỬA BÁC SĨ, ĐẶT LỊCH)
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
                <label class="adm-form-label">Email (Dùng đăng nhập Cổng Bác Sĩ)</label>
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
                <label class="adm-form-label">🔑 Mật khẩu đăng nhập Cổng Bác sĩ</label>
                <input 
                  type="text" 
                  id="doc-form-password" 
                  class="adm-input adm-input-no-icon" 
                  placeholder="Mặc định: 123456" 
                  value="123456" 
                />
                <span style="font-size: 11px; color: var(--adm-text-muted);">Bác sĩ dùng Email/SĐT & mật khẩu này để đăng nhập vào Cổng Bác Sĩ</span>
              </div>

              <div class="adm-form-group">
                <label class="adm-form-label">Lịch làm việc</label>
                <input 
                  type="text" 
                  id="doc-form-schedule" 
                  class="adm-input adm-input-no-icon" 
                  value="${doc ? escapeHtml(doc.schedule) : 'Thứ 2 - Thứ 6 (08:00 - 17:00)'}" 
                />
              </div>
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
      password: document.getElementById('doc-form-password')?.value || '123456',
      schedule: document.getElementById('doc-form-schedule').value,
      status: document.getElementById('doc-form-status').value,
      avatar: document.getElementById('doc-form-avatar').value,
      bio: document.getElementById('doc-form-bio').value
    };

    if (isEdit) {
      DoctorManager.updateDoctor(doc.id, docData);
      showToast(`Đã cập nhật bác sĩ ${docData.name} và tài khoản đăng nhập!`, 'success');
    } else {
      DoctorManager.createDoctor(docData);
      showToast(`Đã thêm bác sĩ mới: ${docData.name} & cấp tài khoản đăng nhập thành công!`, 'success');
    }

    closeModal();
    refreshMainView();
  });
}

// Modal Đặt lịch & Đổi Bác Sĩ cho Lịch Hẹn
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
                <option value="pending" ${app.status === 'pending' ? 'selected' : ''}>⏳ Chờ duyệt lịch</option>
                <option value="confirmed" ${app.status === 'confirmed' ? 'selected' : ''}>📅 Đã xác nhận lịch</option>
                <option value="in_progress" ${app.status === 'in_progress' ? 'selected' : ''}>🩺 Đang khám tại phòng</option>
                <option value="completed" ${app.status === 'completed' ? 'selected' : ''}>✅ Đã hoàn thành khám</option>
                <option value="cancelled" ${app.status === 'cancelled' ? 'selected' : ''}>❌ Hủy lịch hẹn</option>
              </select>
            </div>
          </div>

          <div class="adm-modal-footer">
            <button type="button" class="adm-btn-secondary" id="btn-cancel-assign">Hủy</button>
            <button type="submit" class="adm-btn-create">
              <span>💾 Lưu & Xác Nhận Lịch Khám</span>
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
    showToast(`Đã xác nhận lịch & cập nhật ca hẹn ${app.id}!`, 'success');
    closeModal();
    refreshMainView();
  });
}

// Modal Khám Bệnh, Viết Bệnh Án, Kê Đơn Thuốc & Tính Viện Phí (Bác sĩ & Super Admin toàn quyền)
function openMedicalExamModal(app, initialTab = 'info') {
  const modalRoot = document.getElementById('adm-modals-root');
  const allDocs = DoctorManager.getDoctors();
  const isAdmin = currentRoleMode === 'admin';
  const isCompleted = app.status === 'completed';
  const profile = getPatientProfileData(app);

  const existingRecord = app.medicalRecord || {};
  const existingBilling = app.billing || {};

  let currentPrescriptions = Array.isArray(existingRecord.prescriptions) && existingRecord.prescriptions.length > 0
    ? JSON.parse(JSON.stringify(existingRecord.prescriptions))
    : [
        { name: 'Systane Ultra (Lọ 10ml)', quantity: 1, price: 95000, dosage: 'Nhỏ 1 giọt x 3 lần/ngày khi khô mắt' }
      ];

  let examFee = existingBilling.examFee ?? 200000;
  let serviceFee = existingBilling.serviceFee ?? 0;
  let discount = existingBilling.discount ?? 0;
  let paymentStatus = existingBilling.paymentStatus || 'paid';
  let paymentMethod = existingBilling.paymentMethod || 'Tiền mặt / Thẻ tại quầy';

  function formatMoney(num) {
    return Number(num || 0).toLocaleString('vi-VN') + ' đ';
  }

  function calculateTotals() {
    const list = modalRoot.querySelectorAll('.drug-row');
    let medicineTotal = 0;
    list.forEach(row => {
      const q = Number(row.querySelector('.drug-qty')?.value || 1);
      const p = Number(row.querySelector('.drug-price')?.value || 0);
      const amount = q * p;
      medicineTotal += amount;
      const amountEl = row.querySelector('.drug-amount-display');
      if (amountEl) amountEl.textContent = formatMoney(amount);
    });

    const exFee = Number(document.getElementById('exam-fee-input')?.value || 0);
    const svFee = Number(document.getElementById('service-fee-input')?.value || 0);
    const disc = Number(document.getElementById('discount-input')?.value || 0);

    const total = Math.max(0, exFee + medicineTotal + svFee - disc);

    const medEl = document.getElementById('billing-medicine-fee');
    if (medEl) medEl.textContent = formatMoney(medicineTotal);

    const totalEl = document.getElementById('billing-total-amount');
    if (totalEl) totalEl.textContent = formatMoney(total);

    return { medicineTotal, total };
  }

  function renderExamModalHtml() {
    modalRoot.innerHTML = `
      <div class="adm-modal-overlay" id="adm-modal-overlay">
        <div class="adm-modal" style="max-width: 880px; width: 96%;">
          
          <div class="adm-modal-header" style="background: linear-gradient(135deg, rgba(56,189,248,0.12), rgba(37,99,235,0.08)); border-bottom: 1px solid rgba(56,189,248,0.25); flex-direction: column; align-items: stretch; gap: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 11px; text-transform: uppercase; color: #38bdf8; font-weight: 800; letter-spacing: 0.5px;">
                  🏥 HỒ SƠ BỆNH NHÂN & BỆNH ÁN VIỆN PHÍ — PHÒNG KHÁM MẮT DOCTOR4
                </div>
                <h3 style="margin-top: 2px;">
                  ${isAdmin ? '👑 Quản Trị Viên: Phiếu Thông Tin & Bệnh Án' : '🩺 Bác Sĩ: Phiếu Bệnh Nhân, Khám & Kê Đơn'}
                </h3>
              </div>
              <button class="adm-modal-close" id="btn-close-exam-modal">✕</button>
            </div>

            <!-- TAB SWITCHER NAV -->
            <div style="display: flex; gap: 10px; background: rgba(255,255,255,0.06); padding: 4px; border-radius: 8px;">
              <button type="button" id="tab-adm-info" style="flex: 1; padding: 10px; border-radius: 6px; border: none; font-weight: 700; cursor: pointer; font-size: 13px; background: ${initialTab === 'info' ? '#0ea5e9' : 'transparent'}; color: ${initialTab === 'info' ? '#fff' : '#94a3b8'}; transition: all 0.2s ease;">
                📋 1. Phiếu Thông Tin Bệnh Nhân (Ảnh 4x6 & CCCD)
              </button>
              <button type="button" id="tab-adm-exam" style="flex: 1; padding: 10px; border-radius: 6px; border: none; font-weight: 700; cursor: pointer; font-size: 13px; background: ${initialTab === 'exam' ? '#0ea5e9' : 'transparent'}; color: ${initialTab === 'exam' ? '#fff' : '#94a3b8'}; transition: all 0.2s ease;">
                🩺 2. Khám Bệnh, Bệnh Án & Viện Phí
              </button>
            </div>
          </div>

          <form id="adm-exam-form">
            <div class="adm-modal-body" style="max-height: 74vh; overflow-y: auto; padding: 22px;">
              
              <!-- TAB 1: PHIẾU THÔNG TIN BỆNH NHÂN (ẢNH 4X6, CCCD TRƯỚC/SAU) -->
              <div id="pane-adm-info" style="display: ${initialTab === 'info' ? 'block' : 'none'};">
                <div style="background: rgba(14,165,233,0.08); border: 1.5px solid rgba(14,165,233,0.3); border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">🛡️</span>
                    <div>
                      <div style="font-weight: 800; color: #38bdf8; font-size: 14px;">PHIẾU THÔNG TIN BỆNH NHÂN TRỰC TUYẾN</div>
                      <div style="font-size: 12.5px; color: #94a3b8;">Bác sĩ & Admin đối chiếu ảnh 4x6, giấy tờ căn cước CCCD trước khi tiến hành khám.</div>
                    </div>
                  </div>
                  <span style="background: #10b981; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;">
                    ✅ Đã Xác Thực Giấy Tờ
                  </span>
                </div>

                <!-- 3 Ảnh Giấy Tờ Bệnh Nhân -->
                <div style="display: grid; grid-template-columns: 1fr 1.3fr 1.3fr; gap: 14px; margin-bottom: 22px;">
                  <!-- Ảnh 4x6 -->
                  <div style="background: rgba(15,23,42,0.6); border: 1px solid rgba(56,189,248,0.25); border-radius: 10px; padding: 12px; text-align: center;">
                    <div style="font-size: 11.5px; font-weight: 700; color: #38bdf8; text-transform: uppercase; margin-bottom: 8px;">📷 Ảnh Chân Dung 4x6</div>
                    <div style="width: 100px; height: 130px; margin: 0 auto; border-radius: 8px; overflow: hidden; border: 2px solid #38bdf8; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                      <img src="${profile.photo4x6}" style="width: 100%; height: 100%; object-fit: cover;" alt="Ảnh 4x6"/>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 8px;">Định dạng chuẩn y tế</div>
                  </div>

                  <!-- CCCD Mặt Trước -->
                  <div style="background: rgba(15,23,42,0.6); border: 1px solid rgba(56,189,248,0.25); border-radius: 10px; padding: 12px; text-align: center;">
                    <div style="font-size: 11.5px; font-weight: 700; color: #38bdf8; text-transform: uppercase; margin-bottom: 8px;">💳 CCCD Mặt Trước</div>
                    <div style="width: 100%; height: 130px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.15);">
                      <img src="${profile.cccdFront}" style="width: 100%; height: 100%; object-fit: contain; background: #0f172a;" alt="CCCD Mặt trước"/>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 8px;">Mã CCCD: ${escapeHtml(profile.cccdNumber)}</div>
                  </div>

                  <!-- CCCD Mặt Sau -->
                  <div style="background: rgba(15,23,42,0.6); border: 1px solid rgba(56,189,248,0.25); border-radius: 10px; padding: 12px; text-align: center;">
                    <div style="font-size: 11.5px; font-weight: 700; color: #38bdf8; text-transform: uppercase; margin-bottom: 8px;">💳 CCCD Mặt Sau</div>
                    <div style="width: 100%; height: 130px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.15);">
                      <img src="${profile.cccdBack}" style="width: 100%; height: 100%; object-fit: contain; background: #0f172a;" alt="CCCD Mặt sau"/>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 8px;">Vân tay & Con dấu Bộ Công An</div>
                  </div>
                </div>

                <!-- Bảng Chi Tiết Thông Tin Bệnh Nhân -->
                <div style="background: rgba(15,23,42,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 16px; font-size: 13px;">
                  <div style="font-weight: 700; color: #fff; margin-bottom: 12px; font-size: 14px; text-transform: uppercase;">📑 Chi Tiết Lý Lịch Bệnh Nhân</div>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; line-height: 1.8;">
                    <div>• Họ và tên: <strong style="color: #fff;">${escapeHtml(profile.fullName)}</strong></div>
                    <div>• Giới tính: <strong style="color: #fff;">${escapeHtml(profile.gender)}</strong></div>
                    <div>• Ngày tháng năm sinh: <strong style="color: #38bdf8;">${escapeHtml(profile.dob)}</strong></div>
                    <div>• Số CCCD/CMND: <strong style="color: #38bdf8; font-family: monospace;">${escapeHtml(profile.cccdNumber)}</strong></div>
                    <div>• Số điện thoại: <strong style="color: #fff;">${escapeHtml(profile.phone)}</strong></div>
                    <div>• Email liên hệ: <strong style="color: #fff;">${escapeHtml(profile.email)}</strong></div>
                    <div style="grid-column: span 2;">• Địa chỉ thường trú: <strong style="color: #fff;">${escapeHtml(profile.address)}</strong></div>
                    <div>• Số thẻ BHYT: <strong style="color: #fbbf24; font-family: monospace;">${escapeHtml(profile.bhytCode)}</strong></div>
                    <div>• Nhóm máu: <strong style="color: #ef4444;">${escapeHtml(profile.bloodType)}</strong></div>
                    <div style="grid-column: span 2;">• Tiền sử bệnh lý: <span style="color: #e2e8f0;">${escapeHtml(profile.medicalHistory)}</span></div>
                    <div style="grid-column: span 2;">• Dị ứng thuốc: <span style="color: #f87171;">${escapeHtml(profile.allergies)}</span></div>
                  </div>
                </div>

                <button type="button" id="btn-goto-exam-pane" class="adm-btn-create" style="background: linear-gradient(135deg, #0ea5e9, #0284c7); color: #fff; width: 100%; justify-content: center; font-size: 14px; margin-top: 18px; padding: 12px;">
                  🩺 Tiến Hành Khám Bệnh & Kê Đơn Thuốc ➔
                </button>
              </div>

              <!-- TAB 2: KHÁM BỆNH & KÊ ĐƠN THUỐC -->
              <div id="pane-adm-exam" style="display: ${initialTab === 'exam' ? 'block' : 'none'};">
              
                ${isAdmin ? `
                <!-- BANNER QUYỀN SUPER ADMIN TOÀN QUYỀN -->
                <div style="background: rgba(234,179,8,0.12); border: 1.5px solid rgba(234,179,8,0.4); border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; font-size: 12.5px; color: #fbbf24; display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 20px;">👑</span>
                  <div>
                    <strong>Quyền Super Admin cao nhất:</strong> Bạn có quyền xem và sửa mọi thông tin chẩn đoán, thị lực, thêm bớt thuốc, điều chỉnh đơn giá, viện phí và đổi bác sĩ/phòng khám.
                  </div>
                </div>
                ` : `
                <!-- BANNER BÁC SĨ -->
                <div style="background: rgba(56,189,248,0.1); border: 1.5px solid rgba(56,189,248,0.3); border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; font-size: 12.5px; color: #38bdf8; display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 20px;">👨‍⚕️</span>
                  <div>
                    <strong>Bàn làm việc Bác sĩ:</strong> Sau khi hoàn tất khám và kê đơn, bấm <em>"Báo Xong"</em> để đồng bộ hồ sơ bệnh án & viện phí về Admin và Bệnh nhân.
                  </div>
                </div>
                `}

                <!-- Patient Banner -->
                <div style="background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px 18px; margin-bottom: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
                  <div>
                    <div style="color: var(--adm-text-muted);">Mã lịch hẹn: <strong style="font-family: monospace; color: #38bdf8; font-size: 14px;">${app.id}</strong></div>
                    <div style="margin-top: 4px;">Bệnh nhân: <strong style="color: #fff; font-size: 15px;">${escapeHtml(app.patientName)}</strong> (📞 ${escapeHtml(app.patientPhone)})</div>
                    <div style="color: var(--adm-text-dim); margin-top: 4px;">Nhu cầu khám: <em>${escapeHtml(app.symptoms || app.serviceName)}</em></div>
                  </div>
                  <div>
                    <div>Phòng khám: <strong style="color: #fbbf24;">${escapeHtml(app.roomName || 'Phòng 101')}</strong></div>
                    <div style="margin-top: 4px;">
                      Bác sĩ điều trị: 
                      ${isAdmin ? `
                        <select id="exam-doctor-select" class="adm-select" style="padding: 2px 6px; font-size: 12.5px; height: auto; margin-left: 4px;">
                          ${allDocs.map(d => `
                            <option value="${d.id}" ${d.name === app.doctorName || d.id === app.doctorId ? 'selected' : ''}>
                              ${d.name} (${d.degree})
                            </option>
                          `).join('')}
                        </select>
                      ` : `<strong style="color: #38bdf8;">${escapeHtml(app.doctorName)}</strong>`}
                    </div>
                    <div style="color: var(--adm-text-muted); margin-top: 4px;">Trạng thái: 
                      <span style="font-weight: 700; color: ${isCompleted ? '#4ade80' : '#fbbf24'};">
                        ${isCompleted ? '✅ Đã hoàn thành ca khám' : '⏳ Đang tiếp nhận khám'}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Quick Presets -->
                <div style="background: rgba(56,189,248,0.05); border: 1px solid rgba(56,189,248,0.15); border-radius: 10px; padding: 12px; margin-bottom: 18px;">
                  <div style="font-size: 11.5px; font-weight: 700; color: #38bdf8; text-transform: uppercase; margin-bottom: 6px;">
                    ⚡ Chọn nhanh mẫu bệnh lý mắt thường gặp (Tự điền nhanh thị lực & tiền khám):
                  </div>
                  <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    ${SAMPLE_DIAGNOSES.map((diag, idx) => `
                      <button type="button" class="btn-quick-diag" data-idx="${idx}" style="padding: 4px 9px; font-size: 11px; background: rgba(255,255,255,0.06); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; cursor: pointer;">
                        ${escapeHtml(diag.label.split('(')[0])}
                      </button>
                    `).join('')}
                  </div>
                </div>

                <!-- SECTION 1: ĐO KHÁM CHUYÊN KHOA MẮT -->
                <div style="margin-bottom: 20px;">
                  <div style="font-size: 12.5px; font-weight: 700; color: #fff; text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                    <span>👁️</span> 1. Kết Quả Đo Khám Thị Lực & Bệnh Án
                  </div>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                    <div class="adm-form-group">
                      <label class="adm-form-label">Thị lực Mắt Phải (OD) *</label>
                      <input type="text" id="exam-vision-r" class="adm-input adm-input-no-icon" placeholder="VD: 10/10 hoặc -2.50 D" value="${escapeHtml(existingRecord.visionRight || '10/10')}" required/>
                    </div>

                    <div class="adm-form-group">
                      <label class="adm-form-label">Thị lực Mắt Trái (OS) *</label>
                      <input type="text" id="exam-vision-l" class="adm-input adm-input-no-icon" placeholder="VD: 10/10 hoặc -2.00 D" value="${escapeHtml(existingRecord.visionLeft || '10/10')}" required/>
                    </div>

                    <div class="adm-form-group">
                      <label class="adm-form-label">Nhãn Áp (IOP)</label>
                      <input type="text" id="exam-iop" class="adm-input adm-input-no-icon" placeholder="VD: 15 mmHg" value="${escapeHtml(existingRecord.intraocularPressure || '15 mmHg')}"/>
                    </div>
                  </div>

                  <div class="adm-form-group" style="margin-top: 10px;">
                    <label class="adm-form-label">Chẩn Đoán Xác Định (Kết luận bệnh lý) *</label>
                    <input type="text" id="exam-diagnosis" class="adm-input adm-input-no-icon" placeholder="VD: Cận thị học đường, Đục thủy tinh thể, Viêm kết mạc..." value="${escapeHtml(existingRecord.diagnosis || app.serviceName || '')}" required/>
                  </div>

                  <div class="adm-form-group">
                    <label class="adm-form-label">Ghi chú lâm sàng / Đáy mắt / Giác mạc</label>
                    <textarea id="exam-notes" class="adm-input adm-input-no-icon" rows="2" placeholder="Ghi chú chi tiết hình ảnh đáy mắt, giác mạc hoặc diễn tiến...">${escapeHtml(existingRecord.clinicalNotes || '')}</textarea>
                  </div>
                </div>

                <!-- SECTION 2: KÊ ĐƠN THUỐC ĐIỆN TỬ KÈM GIÁ TIỀN -->
                <div style="margin-bottom: 20px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="font-size: 12.5px; font-weight: 700; color: #fff; text-transform: uppercase;">
                      💊 2. Đơn Thuốc Điều Trị & Giá Thuốc
                    </div>
                    <button type="button" id="btn-add-drug-row" style="padding: 4px 10px; font-size: 11.5px; background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); border-radius: 6px; cursor: pointer; font-weight: 600;">
                      ➕ Thêm thuốc
                    </button>
                  </div>

                  <!-- Quick Drugs -->
                  <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px;">
                    <span style="font-size: 11px; color: var(--adm-text-muted); align-self: center;">Thuốc mẫu:</span>
                    ${SAMPLE_EYE_DRUGS.slice(0, 5).map((dr, idx) => `
                      <button type="button" class="btn-quick-drug" data-idx="${idx}" style="padding: 3px 8px; font-size: 11px; background: rgba(255,255,255,0.04); color: #94a3b8; border: 1px solid rgba(255,255,255,0.08); border-radius: 4px; cursor: pointer;">
                        + ${escapeHtml(dr.name.split(' (')[0])} (${formatMoney(dr.price)})
                      </button>
                    `).join('')}
                  </div>

                  <div style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px;">
                    <div style="display: flex; gap: 8px; font-size: 11px; color: var(--adm-text-muted); text-transform: uppercase; font-weight: 700; padding-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 8px;">
                      <span style="flex: 3;">Tên Thuốc / Quy Cách</span>
                      <span style="width: 65px; text-align: center;">SL</span>
                      <span style="width: 100px;">Đơn Giá (đ)</span>
                      <span style="flex: 3;">Cách Dùng / Liều Lượng</span>
                      <span style="width: 90px; text-align: right;">Thành Tiền</span>
                      <span style="width: 32px;"></span>
                    </div>

                    <div id="exam-prescription-list" style="display: flex; flex-direction: column; gap: 8px;">
                      ${currentPrescriptions.map((p, idx) => {
                        const qty = Number(p.quantity || 1);
                        const price = Number(p.price || 95000);
                        const amount = qty * price;
                        return `
                          <div class="drug-row" style="display: flex; gap: 8px; align-items: center;" data-row-idx="${idx}">
                            <input type="text" class="adm-input adm-input-no-icon drug-name" style="flex: 3;" placeholder="Tên thuốc" value="${escapeHtml(p.name)}" required/>
                            <input type="number" min="1" max="50" class="adm-input adm-input-no-icon drug-qty" style="width: 65px; text-align: center;" value="${qty}" required/>
                            <input type="number" min="0" step="1000" class="adm-input adm-input-no-icon drug-price" style="width: 100px;" value="${price}" required/>
                            <input type="text" class="adm-input adm-input-no-icon drug-dosage" style="flex: 3;" placeholder="Cách dùng" value="${escapeHtml(p.dosage)}" required/>
                            <span class="drug-amount-display" style="width: 90px; text-align: right; font-weight: 700; color: #38bdf8; font-size: 12.5px;">${formatMoney(amount)}</span>
                            <button type="button" class="btn-remove-drug" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; width: 32px; height: 36px; border-radius: 6px; cursor: pointer;">✕</button>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>
                </div>

                <!-- SECTION 3: BẢNG KÊ CHI PHÍ & VIỆN PHÍ (HOSPITAL BILLING) -->
                <div style="background: linear-gradient(135deg, rgba(30,41,59,0.7), rgba(15,23,42,0.9)); border: 1.5px solid rgba(56,189,248,0.3); border-radius: 12px; padding: 18px; margin-bottom: 20px;">
                  <div style="font-size: 13px; font-weight: 800; color: #38bdf8; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                    <span>💳 3. Bảng Kê Chi Phí & Hóa Đơn Viện Phí</span>
                    <span style="font-size: 11px; color: var(--adm-text-muted); font-weight: 500;">
                      ${isAdmin ? '👑 Admin có quyền sửa mọi khoản phí' : 'Bác sĩ nhập chi phí ca khám'}
                    </span>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                    <div>
                      <label class="adm-form-label">Tiền khám chuyên khoa (VNĐ)</label>
                      <input type="number" id="exam-fee-input" class="adm-input adm-input-no-icon" value="${examFee}" min="0" step="10000"/>
                    </div>
                    <div>
                      <label class="adm-form-label">Tiền thuốc (Tự động cộng dồn)</label>
                      <div id="billing-medicine-fee" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 9px 12px; font-weight: 700; color: #38bdf8; font-size: 14px;">
                        0 đ
                      </div>
                    </div>
                    <div>
                      <label class="adm-form-label">Phí dịch vụ / Cận lâm sàng (VNĐ)</label>
                      <input type="number" id="service-fee-input" class="adm-input adm-input-no-icon" value="${serviceFee}" min="0" step="10000"/>
                    </div>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                    <div>
                      <label class="adm-form-label">Miễn giảm / BHYT chi trả (VNĐ)</label>
                      <input type="number" id="discount-input" class="adm-input adm-input-no-icon" value="${discount}" min="0" step="10000"/>
                    </div>
                    <div>
                      <label class="adm-form-label">Trạng thái thanh toán</label>
                      <select id="exam-payment-status" class="adm-select" style="width: 100%;">
                        <option value="paid" ${paymentStatus === 'paid' ? 'selected' : ''}>✅ Đã thanh toán viện phí</option>
                        <option value="unpaid" ${paymentStatus === 'unpaid' ? 'selected' : ''}>⏳ Chờ thanh toán tại quầy</option>
                      </select>
                    </div>
                    <div>
                      <label class="adm-form-label">Hình thức thanh toán</label>
                      <select id="exam-payment-method" class="adm-select" style="width: 100%;">
                        <option value="Tiền mặt / Thẻ tại quầy" ${paymentMethod.includes('Tiền mặt') ? 'selected' : ''}>💵 Tiền mặt tại quầy</option>
                        <option value="Chuyển khoản QR Napas" ${paymentMethod.includes('QR') ? 'selected' : ''}>📱 Quét mã QR Ngân hàng</option>
                        <option value="Thẻ tín dụng / POS" ${paymentMethod.includes('Thẻ') ? 'selected' : ''}>💳 Thẻ Visa / Master</option>
                      </select>
                    </div>
                  </div>

                  <div style="background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.25); border-radius: 10px; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 14px; font-weight: 700; color: #fff;">TỔNG TIỀN BỆNH NHÂN THANH TOÁN:</span>
                    <span id="billing-total-amount" style="font-size: 20px; font-weight: 800; color: #38bdf8;">0 đ</span>
                  </div>
                </div>

                <!-- SECTION 4: LỜI DẶN & TÁI KHÁM -->
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
                  <div class="adm-form-group">
                    <label class="adm-form-label">Lời dặn của Bác sĩ chuyên khoa</label>
                    <input type="text" id="exam-advice" class="adm-input adm-input-no-icon" placeholder="VD: Hạn chế dùng máy tính, chớp mắt thường xuyên..." value="${escapeHtml(existingRecord.doctorAdvice || 'Hạn chế nhìn màn hình liên tục > 45 phút. Đeo kính râm khi ra đường.')}"/>
                  </div>

                  <div class="adm-form-group">
                    <label class="adm-form-label">Hẹn ngày tái khám</label>
                    <input type="date" id="exam-reexam" class="adm-input adm-input-no-icon" value="${existingRecord.reExamDate || ''}"/>
                  </div>
                </div>

              </div>

            </div>

            <!-- Footer -->
            <div class="adm-modal-footer" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
              <div style="display: flex; gap: 8px;">
                <button type="button" class="adm-btn-secondary" id="btn-cancel-exam">Đóng</button>
                ${isCompleted ? `
                  <button type="button" id="btn-print-exam-now" class="adm-btn-secondary" style="border-color: #38bdf8; color: #38bdf8;">
                    🖨️ In Bệnh Án & Viện Phí
                  </button>
                  <button type="button" id="btn-reopen-app" style="padding: 8px 12px; background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600;" title="Mở lại trạng thái đang khám nếu cần kiểm tra thêm hoặc làm xét nghiệm bổ sung">
                    🔄 Khám bổ sung / Mở lại
                  </button>
                ` : ''}
              </div>

              <button type="submit" class="adm-btn-create" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff;">
                <span>✅ ${isCompleted ? '💾 Cập Nhật Bệnh Án & Viện Phí' : 'Báo Xong & Gửi Kết Quả Cho Bệnh Nhân'}</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    `;

    bindModalEvents();
    calculateTotals();
  }

  function bindModalEvents() {
    const closeModal = () => { modalRoot.innerHTML = ''; };
    document.getElementById('btn-close-exam-modal')?.addEventListener('click', closeModal);
    document.getElementById('btn-cancel-exam')?.addEventListener('click', closeModal);

    // Xử lý chuyển Tab trong Modal Admin
    const btnTabInfo = document.getElementById('tab-adm-info');
    const btnTabExam = document.getElementById('tab-adm-exam');
    const paneInfo = document.getElementById('pane-adm-info');
    const paneExam = document.getElementById('pane-adm-exam');
    const btnGotoExam = document.getElementById('btn-goto-exam-pane');

    const switchTab = (tab) => {
      if (tab === 'info') {
        btnTabInfo.style.background = '#0ea5e9';
        btnTabInfo.style.color = '#fff';
        btnTabExam.style.background = 'transparent';
        btnTabExam.style.color = '#94a3b8';
        paneInfo.style.display = 'block';
        paneExam.style.display = 'none';
      } else {
        btnTabExam.style.background = '#0ea5e9';
        btnTabExam.style.color = '#fff';
        btnTabInfo.style.background = 'transparent';
        btnTabInfo.style.color = '#94a3b8';
        paneExam.style.display = 'block';
        paneInfo.style.display = 'none';
      }
    };

    btnTabInfo?.addEventListener('click', () => switchTab('info'));
    btnTabExam?.addEventListener('click', () => switchTab('exam'));
    btnGotoExam?.addEventListener('click', () => switchTab('exam'));

    // Lắng nghe thay đổi tiền để tính tổng realtime
    ['exam-fee-input', 'service-fee-input', 'discount-input'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', calculateTotals);
    });

    const bindRowEvents = (row) => {
      row.querySelectorAll('.drug-qty, .drug-price').forEach(inp => {
        inp.addEventListener('input', calculateTotals);
      });
      row.querySelector('.btn-remove-drug')?.addEventListener('click', () => {
        row.remove();
        calculateTotals();
      });
    };

    modalRoot.querySelectorAll('.drug-row').forEach(bindRowEvents);

    // Mẫu chẩn đoán nhanh
    modalRoot.querySelectorAll('.btn-quick-diag').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const diag = SAMPLE_DIAGNOSES[idx];
        if (diag) {
          document.getElementById('exam-diagnosis').value = diag.label;
          document.getElementById('exam-vision-r').value = diag.visionR;
          document.getElementById('exam-vision-l').value = diag.visionL;
          document.getElementById('exam-iop').value = diag.iop;
          document.getElementById('exam-advice').value = diag.advice;
          if (diag.examFee) {
            document.getElementById('exam-fee-input').value = diag.examFee;
          }
          calculateTotals();
        }
      });
    });

    // Thêm dòng thuốc
    document.getElementById('btn-add-drug-row')?.addEventListener('click', () => {
      const list = document.getElementById('exam-prescription-list');
      const row = document.createElement('div');
      row.className = 'drug-row';
      row.style = 'display: flex; gap: 8px; align-items: center;';
      row.innerHTML = `
        <input type="text" class="adm-input adm-input-no-icon drug-name" style="flex: 3;" placeholder="Tên thuốc / Quy cách" required/>
        <input type="number" min="1" max="50" class="adm-input adm-input-no-icon drug-qty" style="width: 65px; text-align: center;" value="1" required/>
        <input type="number" min="0" step="1000" class="adm-input adm-input-no-icon drug-price" style="width: 100px;" value="80000" required/>
        <input type="text" class="adm-input adm-input-no-icon drug-dosage" style="flex: 3;" placeholder="Cách dùng" value="Nhỏ 1 giọt x 3 lần/ngày" required/>
        <span class="drug-amount-display" style="width: 90px; text-align: right; font-weight: 700; color: #38bdf8; font-size: 12.5px;">80.000 đ</span>
        <button type="button" class="btn-remove-drug" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; width: 32px; height: 36px; border-radius: 6px; cursor: pointer;">✕</button>
      `;
      bindRowEvents(row);
      list.appendChild(row);
      calculateTotals();
    });

    // Mẫu thuốc nhanh
    modalRoot.querySelectorAll('.btn-quick-drug').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const dr = SAMPLE_EYE_DRUGS[idx];
        if (dr) {
          const list = document.getElementById('exam-prescription-list');
          const row = document.createElement('div');
          row.className = 'drug-row';
          row.style = 'display: flex; gap: 8px; align-items: center;';
          row.innerHTML = `
            <input type="text" class="adm-input adm-input-no-icon drug-name" style="flex: 3;" value="${escapeHtml(dr.name)}" required/>
            <input type="number" min="1" max="50" class="adm-input adm-input-no-icon drug-qty" style="width: 65px; text-align: center;" value="${dr.quantity || 1}" required/>
            <input type="number" min="0" step="1000" class="adm-input adm-input-no-icon drug-price" style="width: 100px;" value="${dr.price || 95000}" required/>
            <input type="text" class="adm-input adm-input-no-icon drug-dosage" style="flex: 3;" value="${escapeHtml(dr.dosage)}" required/>
            <span class="drug-amount-display" style="width: 90px; text-align: right; font-weight: 700; color: #38bdf8; font-size: 12.5px;">${formatMoney((dr.quantity || 1) * (dr.price || 95000))}</span>
            <button type="button" class="btn-remove-drug" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; width: 32px; height: 36px; border-radius: 6px; cursor: pointer;">✕</button>
          `;
          bindRowEvents(row);
          list.appendChild(row);
          calculateTotals();
        }
      });
    });

    // In đơn thuốc & viện phí
    document.getElementById('btn-print-exam-now')?.addEventListener('click', () => {
      window.print();
    });

    // Mở lại ca khám (Admin Only)
    document.getElementById('btn-reopen-app')?.addEventListener('click', () => {
      if (confirm(`Admin muốn mở lại ca khám ${app.id} để bác sĩ kiểm tra lại?`)) {
        AppointmentManager.reopenAppointment(app.id);
        showToast(`Đã mở lại ca khám ${app.id}!`, 'info');
        closeModal();
        refreshMainView();
      }
    });

    // Submit Báo Xong / Cập nhật bệnh án & viện phí
    document.getElementById('adm-exam-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const drugRows = modalRoot.querySelectorAll('.drug-row');
      const prescriptions = [];
      drugRows.forEach(row => {
        const name = row.querySelector('.drug-name')?.value.trim();
        const quantity = Number(row.querySelector('.drug-qty')?.value || 1);
        const price = Number(row.querySelector('.drug-price')?.value || 0);
        const dosage = row.querySelector('.drug-dosage')?.value.trim();
        if (name) {
          prescriptions.push({ name, quantity, price, dosage: dosage || 'Theo chỉ định' });
        }
      });

      // Nếu Admin có đổi bác sĩ
      let assignedDocName = app.doctorName;
      let assignedDocId = app.doctorId;
      const docSelect = document.getElementById('exam-doctor-select');
      if (docSelect) {
        assignedDocId = docSelect.value;
        const foundDoc = allDocs.find(d => String(d.id) === String(assignedDocId));
        if (foundDoc) assignedDocName = foundDoc.name;
      }

      const examData = {
        visionRight: document.getElementById('exam-vision-r').value.trim(),
        visionLeft: document.getElementById('exam-vision-l').value.trim(),
        intraocularPressure: document.getElementById('exam-iop').value.trim(),
        diagnosis: document.getElementById('exam-diagnosis').value.trim(),
        clinicalNotes: document.getElementById('exam-notes').value.trim(),
        doctorAdvice: document.getElementById('exam-advice').value.trim(),
        reExamDate: document.getElementById('exam-reexam').value,
        prescriptions: prescriptions,
        examFee: Number(document.getElementById('exam-fee-input').value || 0),
        serviceFee: Number(document.getElementById('service-fee-input').value || 0),
        discount: Number(document.getElementById('discount-input').value || 0),
        paymentStatus: document.getElementById('exam-payment-status').value,
        paymentMethod: document.getElementById('exam-payment-method').value,
        doctorId: assignedDocId,
        doctorName: assignedDocName
      };

      AppointmentManager.completeMedicalExam(app.id, examData);
      showToast(`🎉 Đã lưu bệnh án & viện phí cho ${app.patientName}! Thông tin đã đồng bộ về Admin & Bệnh nhân.`, 'success');
      closeModal();
      refreshMainView();
    });
  }

  renderExamModalHtml();
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

  // Thay đổi Chế độ Vai trò (Super Admin vs Bác sĩ trực phòng)
  document.getElementById('adm-select-role-mode')?.addEventListener('change', (e) => {
    const val = e.target.value;
    currentRoleMode = val;
    if (val !== 'admin') {
      appFilterState.doctorId = val;
      const doc = DoctorManager.getDoctorById(val);
      showToast(`Đã chuyển sang Bàn làm việc Bác sĩ: ${doc ? doc.name : val}`, 'info');
      currentTab = 'appointments';
      document.querySelectorAll('.adm-nav-item').forEach(el => el.classList.remove('active'));
      document.querySelector('[data-tab="appointments"]')?.classList.add('active');
    } else {
      appFilterState.doctorId = 'all';
      showToast('Đã chuyển về Quyền Super Admin (Toàn quyền điều hành)', 'info');
    }
    refreshMainView();
  });

  bindViewSpecificEvents();

document.addEventListener('click', function (e) {

  const btn = e.target.closest('[data-payment-action]');

  if (!btn) return;

  const action = btn.getAttribute('data-payment-action');

  const index = Number(
    btn.getAttribute('data-payment-index')
  );

  if (Number.isNaN(index)) {
    console.error('Payment index không hợp lệ');
    return;
  }

  if (action === 'confirm') {
    confirmAdminPayment(index);
  }

  if (action === 'cancel') {
    cancelAdminPayment(index);
  }

  if (action === 'delete') {
    deleteAdminPayment(index);
  }

});
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

  // Xem Phiếu Thông Tin & Ảnh 4x6 / CCCD Bệnh Nhân
  document.querySelectorAll('.btn-view-patient-profile').forEach(btn => {
    btn.addEventListener('click', () => {
      const app = AppointmentManager.getAppointmentById(btn.getAttribute('data-id'));
      if (app) openMedicalExamModal(app, 'info');
    });
  });

  // Bác sĩ khám bệnh, kê đơn & viết bệnh án
  document.querySelectorAll('.btn-exam-record').forEach(btn => {
    btn.addEventListener('click', () => {
      const app = AppointmentManager.getAppointmentById(btn.getAttribute('data-id'));
      if (app) openMedicalExamModal(app, 'info');
    });
  });

  // Lọc theo Bác sĩ trong Tab Lịch Hẹn
  document.getElementById('filter-doctor-app')?.addEventListener('change', (e) => {
    appFilterState.doctorId = e.target.value;
    refreshAppointmentTableOnly();
  });

  // Nút quay lại Super Admin từ Banner Bác sĩ
  document.getElementById('btn-switch-to-admin')?.addEventListener('click', () => {
    currentRoleMode = 'admin';
    appFilterState.doctorId = 'all';
    const roleSelect = document.getElementById('adm-select-role-mode');
    if (roleSelect) roleSelect.value = 'admin';
    showToast('Đã quay về Toàn quyền Super Admin', 'info');
    refreshMainView();
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

  // Events cho Tab Accounts (Quản lý Tài Khoản)
  if (currentTab === 'accounts') {
    bindAccountsEvents();
  }
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
    if (currentTab === 'comments') bindCommentEvents();
  }
  const countTag = document.getElementById('nav-doc-count');
  if (countTag) countTag.textContent = DoctorManager.getDoctors().length;
  const appTag = document.getElementById('nav-app-count');
  if (appTag) appTag.textContent = AppointmentManager.getAppointments().length;
  const cTag = document.getElementById('nav-comment-count');
  if (cTag) cTag.textContent = getComments().length;
}

function bindCommentEvents() {
  const searchEl = document.getElementById('filter-search-comment');
  const statusEl = document.getElementById('filter-status-comment');

  if (searchEl) {
    searchEl.addEventListener('input', () => {
      commentFilterQuery = searchEl.value;
      refreshMainView();
    });
  }
  if (statusEl) {
    statusEl.addEventListener('change', () => {
      commentFilterStatus = statusEl.value;
      refreshMainView();
    });
  }
}

window.adminHideComment = function(id) {
  if (!confirm('Bạn có chắc muốn ẩn bình luận này?')) return;
  hideComment(id);
  showToast('Đã ẩn bình luận.', 'info');
  refreshMainView();
};

window.adminShowComment = function(id) {
  showComment(id);
  showToast('Đã hiện bình luận.', 'success');
  refreshMainView();
};

window.adminDeleteComment = function(id) {
  if (!confirm('Bạn có chắc muốn xóa vĩnh viễn bình luận này?')) return;
  deleteComment(id);
  showToast('Đã xóa bình luận.', 'success');
  refreshMainView();
};

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
