/* ============================================================
   src/pages/user-profile.js — Doctor4 Eye Clinic
   Trang "Thông Tin Người Dùng": Người dùng xem & cập nhật
   hồ sơ cá nhân (thông tin liên hệ, BHYT, ảnh 4x6 & CCCD).
   ============================================================ */

import '../css/style.css';
import '../css/home.css';
import '../css/auth.css';
import '../css/user-profile.css';

import { renderHeader, renderFooter, setupHeaderEvents } from '../components/layout.js';
import { AuthService, showToast } from './auth.js';
import { compressImageFile, getPatientProfileData } from '../utils/patient-profile.js';

let currentUser = null;
let editing = false;

// Ảnh mới chọn trong lúc chỉnh sửa (chưa lưu)
let draftPhotos = { photo4x6: '', cccdFront: '', cccdBack: '' };

// ── Init ─────────────────────────────────────────────────────
function init() {
  const header = document.getElementById('header-container');
  if (header) header.innerHTML = renderHeader('profile');

  const footer = document.getElementById('footer-container');
  if (footer) footer.innerHTML = renderFooter();

  setupHeaderEvents();

  currentUser = AuthService.getCurrentUser();

  const root = document.getElementById('user-profile-root');
  if (!root) return;

  if (!currentUser) {
    renderLoginRequired(root);
    return;
  }

  renderProfile(root);
}

// ── Trạng thái chưa đăng nhập ────────────────────────────────
function renderLoginRequired(root) {
  root.innerHTML = `
    <div class="profile-card profile-login-required">
      <div class="profile-login-icon">🔒</div>
      <h2>Bạn chưa đăng nhập</h2>
      <p>
        Vui lòng đăng nhập vào tài khoản Doctor4 để xem thông tin người dùng của bạn.
      </p>
      <div class="profile-login-actions">
        <a href="/dang-nhap.html?redirect=/ho-so.html" class="btn-profile-primary">🔐 Đăng nhập ngay</a>
        <a href="/dang-ky.html" class="btn-profile-outline">Tạo tài khoản mới</a>
      </div>
    </div>
  `;
}

// ── Lấy hồ sơ người dùng đang đăng nhập ──────────────────────
function findUserRecord() {
  const users = AuthService.getUsers();
  return users.find(u =>
    (u.id && currentUser.id && u.id === currentUser.id) ||
    (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
    (u.phone && currentUser.phone && u.phone === currentUser.phone)
  ) || null;
}

function buildProfile() {
  const record = findUserRecord() || currentUser;
  const base = getPatientProfileData({
    ...record,
    patientName: record.name,
    patientPhone: record.phone,
    patientEmail: record.email
  });

  return {
    ...base,
    role: record.role || 'patient',
    doctorId: record.doctorId || null,
    specialty: record.specialty || '',
    room: record.room || '',
    degree: record.degree || '',
    createdAt: record.createdAt || '',
    eyeProfile: record.eyeProfile || null
  };
}

// ── Render toàn bộ trang hồ sơ ───────────────────────────────
function renderProfile(root) {
  const p = buildProfile();

  const roleLabel = p.role === 'doctor'
    ? '🩺 Bác sĩ'
    : p.role === 'admin'
      ? '🛡️ Quản trị viên'
      : '👤 Bệnh nhân';

  root.innerHTML = `
    <!-- Thẻ tóm tắt -->
    <div class="profile-summary-card">
      <div class="profile-summary-avatar">
        <img src="${p.photo4x6}" alt="Ảnh thẻ 4x6" onerror="this.style.display='none'" />
      </div>
      <div class="profile-summary-info">
        <div class="profile-summary-name">
          ${escapeHtml(p.fullName)}
          <span class="profile-verified-badge">${p.verified ? '✓ Đã xác thực' : '⏳ Chờ xác thực'}</span>
        </div>
        <div class="profile-summary-role">${roleLabel}${p.specialty ? ' · ' + escapeHtml(p.specialty) : ''}</div>
        <div class="profile-summary-meta">
          <span>📞 ${escapeHtml(p.phone)}</span>
          <span>✉️ ${escapeHtml(p.email)}</span>
          ${p.room ? `<span>📍 ${escapeHtml(p.room)}</span>` : ''}
        </div>
      </div>
      <div class="profile-summary-actions">
        <a href="javascript:void(0)" class="btn-profile-outline btn-open-my-tickets" data-phone="${escapeHtml(p.phone)}">
          🎫 Vé khám của tôi
        </a>
        <a href="/index.html#dat-lich" class="btn-profile-primary">📅 Đặt lịch mới</a>
      </div>
    </div>

    ${editing ? renderEditForm(p) : renderViewMode(p)}
  `;

  bindEvents(root, p);
}

// ── Chế độ XEM (read-only) ───────────────────────────────────
function renderViewMode(p) {
  const infoRows = [
    ['👤', 'Họ và tên', p.fullName],
    ['📞', 'Số điện thoại', p.phone],
    ['✉️', 'Email', p.email],
    ['⚧', 'Giới tính', p.gender],
    ['🎂', 'Ngày sinh', formatDate(p.dob)],
    ['🪪', 'Số CCCD / CMND', p.cccdNumber],
    ['🏠', 'Địa chỉ thường trú', p.address],
    ['🏥', 'Mã Bảo hiểm y tế (BHYT)', p.bhytCode],
    ['🩸', 'Nhóm máu', p.bloodType],
    ['📋', 'Tiền sử bệnh lý', p.medicalHistory],
    ['⚠️', 'Dị ứng thuốc', p.allergies]
  ];

  return `
    <div class="profile-card">
      <div class="profile-card-head">
        <h2>📇 Hồ sơ bệnh nhân trực tuyến</h2>
        <button type="button" class="btn-profile-primary" id="btn-edit-profile">✏️ Chỉnh sửa thông tin</button>
      </div>

      <div class="profile-info-grid">
        ${infoRows.map(([icon, label, value]) => `
          <div class="profile-info-row">
            <div class="profile-info-label"><span>${icon}</span> ${label}</div>
            <div class="profile-info-value">${value ? escapeHtml(String(value)) : '<em class="profile-empty">Chưa cập nhật</em>'}</div>
          </div>
        `).join('')}
      </div>
    </div>

    ${renderEyeProfile(p.eyeProfile)}

    <div class="profile-card">
      <div class="profile-card-head">
        <h2>🖼️ Ảnh thẻ & Giấy tờ tùy thân</h2>
      </div>
      <div class="profile-photos-grid">
        ${renderPhotoBox('Ảnh thẻ 4x6', p.photo4x6, 'photo')}
        ${renderPhotoBox('CCCD — Mặt trước', p.cccdFront, 'cccd-front')}
        ${renderPhotoBox('CCCD — Mặt sau', p.cccdBack, 'cccd-back')}
      </div>
      <p class="profile-note">
        🕒 Cập nhật lần cuối: <strong>${formatDateTime(p.updatedAt)}</strong>
      </p>
    </div>
  `;
}

function renderPhotoBox(label, src, key) {
  return `
    <div class="profile-photo-box">
      <div class="profile-photo-label">${label}</div>
      <div class="profile-photo-frame" data-photo="${key}">
        <img src="${src}" alt="${label}" onerror="this.style.display='none'" />
      </div>
    </div>
  `;
}

function renderEyeProfile(eye) {
  if (!eye) return '';
  return `
    <div class="profile-card">
      <div class="profile-card-head">
        <h2>👁️ Hồ sơ khúc xạ & Thị lực</h2>
      </div>
      <div class="profile-eye-grid">
        <div class="profile-eye-col">
          <div class="profile-eye-title">Mắt phải (OD)</div>
          <div>Độ cầu (Sphere): <strong>${eye.odSphere || '—'}</strong></div>
          <div>Độ loạn (Cyl): <strong>${eye.odCyl || '—'}</strong></div>
          <div>Trục (Axis): <strong>${eye.odAxis || '—'}</strong></div>
          <div>Nhãn áp (IOP): <strong>${eye.odIop ? eye.odIop + ' mmHg' : '—'}</strong></div>
        </div>
        <div class="profile-eye-col">
          <div class="profile-eye-title">Mắt trái (OS)</div>
          <div>Độ cầu (Sphere): <strong>${eye.osSphere || '—'}</strong></div>
          <div>Độ loạn (Cyl): <strong>${eye.osCyl || '—'}</strong></div>
          <div>Trục (Axis): <strong>${eye.osAxis || '—'}</strong></div>
          <div>Nhãn áp (IOP): <strong>${eye.osIop ? eye.osIop + ' mmHg' : '—'}</strong></div>
        </div>
      </div>
      <div class="profile-eye-extra">
        <div>🕶️ <strong>Loại kính:</strong> ${escapeHtml(eye.glassesType || '—')}</div>
        <div>📅 <strong>Khám lần cuối:</strong> ${formatDate(eye.lastCheckup)}</div>
        <div>📅 <strong>Hẹn tái khám:</strong> ${formatDate(eye.nextCheckup)}</div>
      </div>
      ${eye.notes ? `<p class="profile-note">💬 <strong>Ghi chú của Bác sĩ:</strong> ${escapeHtml(eye.notes)}</p>` : ''}
    </div>
  `;
}

// ── Chế độ CHỈNH SỬA ─────────────────────────────────────────
function renderEditForm(p) {
  const photo4x6 = draftPhotos.photo4x6 || p.photo4x6;
  const cccdFront = draftPhotos.cccdFront || p.cccdFront;
  const cccdBack = draftPhotos.cccdBack || p.cccdBack;

  return `
    <div class="profile-card">
      <div class="profile-card-head">
        <h2>✏️ Chỉnh sửa thông tin người dùng</h2>
        <span class="profile-edit-hint">Thay đổi được lưu vào hồ sơ của bạn</span>
      </div>

      <form id="form-edit-profile" class="profile-form">
        <div class="profile-form-grid">
          <div class="profile-field">
            <label for="pf-name">Họ và tên <span class="req">*</span></label>
            <input type="text" id="pf-name" value="${escapeAttr(p.fullName)}" required />
          </div>
          <div class="profile-field">
            <label for="pf-phone">Số điện thoại <span class="req">*</span></label>
            <input type="tel" id="pf-phone" value="${escapeAttr(p.phone)}" required />
          </div>
          <div class="profile-field">
            <label for="pf-email">Email</label>
            <input type="email" id="pf-email" value="${escapeAttr(p.email)}" />
          </div>
          <div class="profile-field">
            <label for="pf-gender">Giới tính</label>
            <select id="pf-gender">
              <option value="Nam" ${p.gender === 'Nam' ? 'selected' : ''}>Nam</option>
              <option value="Nữ" ${p.gender === 'Nữ' ? 'selected' : ''}>Nữ</option>
              <option value="Khác" ${p.gender === 'Khác' ? 'selected' : ''}>Khác</option>
            </select>
          </div>
          <div class="profile-field">
            <label for="pf-dob">Ngày sinh</label>
            <input type="date" id="pf-dob" value="${escapeAttr(toIsoDate(p.dob))}" />
          </div>
          <div class="profile-field">
            <label for="pf-cccd">Số CCCD / CMND</label>
            <input type="text" id="pf-cccd" value="${escapeAttr(p.cccdNumber)}" />
          </div>
          <div class="profile-field">
            <label for="pf-bhyt">Mã Bảo hiểm y tế (BHYT)</label>
            <input type="text" id="pf-bhyt" value="${escapeAttr(p.bhytCode)}" />
          </div>
          <div class="profile-field">
            <label for="pf-blood">Nhóm máu</label>
            <input type="text" id="pf-blood" value="${escapeAttr(p.bloodType)}" placeholder="VD: A+" />
          </div>
          <div class="profile-field profile-field-full">
            <label for="pf-address">Địa chỉ thường trú</label>
            <input type="text" id="pf-address" value="${escapeAttr(p.address)}" />
          </div>
          <div class="profile-field profile-field-full">
            <label for="pf-history">Tiền sử bệnh lý</label>
            <input type="text" id="pf-history" value="${escapeAttr(p.medicalHistory)}" />
          </div>
          <div class="profile-field profile-field-full">
            <label for="pf-allergies">Dị ứng thuốc</label>
            <input type="text" id="pf-allergies" value="${escapeAttr(p.allergies)}" />
          </div>
        </div>

        <h3 class="profile-form-section-title">🖼️ Cập nhật ảnh thẻ & CCCD</h3>
        <div class="profile-photos-grid">
          ${renderUploadBox('Ảnh thẻ 4x6', photo4x6, 'photo', 'pf-file-photo', 'pf-preview-photo')}
          ${renderUploadBox('CCCD — Mặt trước', cccdFront, 'cccd-front', 'pf-file-cccd-front', 'pf-preview-cccd-front')}
          ${renderUploadBox('CCCD — Mặt sau', cccdBack, 'cccd-back', 'pf-file-cccd-back', 'pf-preview-cccd-back')}
        </div>

        <div class="profile-form-actions">
          <button type="submit" class="btn-profile-primary" id="btn-save-profile">💾 Lưu thay đổi</button>
          <button type="button" class="btn-profile-outline" id="btn-cancel-edit">Hủy</button>
        </div>
      </form>
    </div>
  `;
}

function renderUploadBox(label, src, key, fileId, previewId) {
  return `
    <div class="profile-photo-box">
      <div class="profile-photo-label">${label}</div>
      <div class="profile-photo-frame" id="${previewId}">
        <img src="${src}" alt="${label}" onerror="this.style.display='none'" />
      </div>
      <label class="profile-upload-btn" for="${fileId}">📤 Chọn ảnh khác</label>
      <input type="file" id="${fileId}" accept="image/*" data-target="${key}" data-preview="${previewId}" hidden />
    </div>
  `;
}

// ── Gắn sự kiện ──────────────────────────────────────────────
function bindEvents(root, p) {
  // Mở tra cứu vé khám
  root.querySelectorAll('.btn-open-my-tickets').forEach(el => {
    el.addEventListener('click', () => {
      import('./my-appointments.js').then(m => m.openLookupAppointmentModal(el.getAttribute('data-phone') || ''));
    });
  });

  // Bật chế độ chỉnh sửa
  const editBtn = root.querySelector('#btn-edit-profile');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      editing = true;
      draftPhotos = { photo4x6: '', cccdFront: '', cccdBack: '' };
      renderProfile(root);
    });
  }

  const cancelBtn = root.querySelector('#btn-cancel-edit');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      editing = false;
      draftPhotos = { photo4x6: '', cccdFront: '', cccdBack: '' };
      renderProfile(root);
    });
  }

  // Upload ảnh trong form chỉnh sửa
  root.querySelectorAll('input[type="file"][data-target]').forEach(input => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const key = input.getAttribute('data-target');
      const previewId = input.getAttribute('data-preview');
      const box = root.querySelector('#' + previewId);
      try {
        if (box) box.innerHTML = `<span class="profile-uploading">⏳ Đang nén...</span>`;
        const base64 = await compressImageFile(file, 600, 600, 0.75);
        draftPhotos[key] = base64;
        if (box) box.innerHTML = `<img src="${base64}" alt="preview" />`;
        showToast('success', 'Đã chọn ảnh', file.name);
      } catch (err) {
        if (box) box.innerHTML = `<span class="profile-upload-error">Lỗi tải ảnh</span>`;
      }
    });
  });

  // Lưu form
  const form = root.querySelector('#form-edit-profile');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveProfile(root, p);
    });
  }
}

// ── Lưu thay đổi ─────────────────────────────────────────────
function saveProfile(root, p) {
  const val = (id) => (document.getElementById(id)?.value || '').trim();

  const name = val('pf-name');
  const phone = val('pf-phone');
  const email = val('pf-email');

  if (!name || name.length < 2) {
    showToast('error', 'Chưa hợp lệ', 'Họ và tên tối thiểu 2 ký tự.');
    return;
  }
  if (!/^[0-9+\s.-]{9,15}$/.test(phone)) {
    showToast('error', 'Chưa hợp lệ', 'Số điện thoại không đúng định dạng.');
    return;
  }

  const users = AuthService.getUsers();
  const idx = users.findIndex(u =>
    (u.id && currentUser.id && u.id === currentUser.id) ||
    (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
    (u.phone && currentUser.phone && u.phone === currentUser.phone)
  );

  if (idx === -1) {
    showToast('error', 'Không tìm thấy', 'Không tìm thấy tài khoản của bạn trong hệ thống.');
    return;
  }

  const oldRecord = users[idx];
  const oldProfile = oldRecord.patientProfile || {};

  const updatedProfile = {
    ...oldProfile,
    dob: val('pf-dob') || oldProfile.dob || p.dob,
    gender: document.getElementById('pf-gender')?.value || p.gender,
    cccdNumber: val('pf-cccd') || oldProfile.cccdNumber || p.cccdNumber,
    address: val('pf-address') || oldProfile.address || p.address,
    bhytCode: val('pf-bhyt') || oldProfile.bhytCode || p.bhytCode,
    bloodType: val('pf-blood') || oldProfile.bloodType || p.bloodType,
    medicalHistory: val('pf-history') || oldProfile.medicalHistory || p.medicalHistory,
    allergies: val('pf-allergies') || oldProfile.allergies || p.allergies,
    photo4x6: draftPhotos.photo4x6 || oldProfile.photo4x6 || p.photo4x6,
    cccdFront: draftPhotos.cccdFront || oldProfile.cccdFront || p.cccdFront,
    cccdBack: draftPhotos.cccdBack || oldProfile.cccdBack || p.cccdBack,
    verified: oldProfile.verified !== false,
    updatedAt: new Date().toISOString()
  };

  users[idx] = {
    ...oldRecord,
    name,
    phone,
    email: email || oldRecord.email,
    patientProfile: updatedProfile,
    avatar: updatedProfile.photo4x6
  };

  AuthService.saveUsers(users);
  AuthService.setCurrentUser(users[idx], true);

  currentUser = AuthService.getCurrentUser();
  editing = false;
  draftPhotos = { photo4x6: '', cccdFront: '', cccdBack: '' };

  showToast('success', 'Đã lưu thông tin', 'Hồ sơ người dùng của bạn đã được cập nhật.');
  renderProfile(root);
}

// ── Helpers ──────────────────────────────────────────────────
function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  // Nếu không parse được (đã ở dạng dd/mm/yyyy) thì trả về nguyên bản
  return isNaN(d.getTime()) ? value : d.toLocaleDateString('vi-VN');
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString('vi-VN');
}

function toIsoDate(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const m = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const d = new Date(value);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  return escapeHtml(str);
}

// ── Khởi động ────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
