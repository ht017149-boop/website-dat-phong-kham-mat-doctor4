/* ============================================================
   src/pages/auth.js — Doctor4 Eye Clinic
   Xử lý chức năng Đăng Nhập, Đăng Ký, Xác thực & Quản lý phiên
   ============================================================ */

import '../css/style.css';
import '../css/auth.css';
import { renderHeader, renderFooter, setupHeaderEvents } from '../components/layout.js';

import { INITIAL_10_DOCTORS } from '../data/clinic-data.js';
import { compressImageFile, getDefaultPatientPhotos } from '../utils/patient-profile.js';
import { sendWelcomeEmail, isValidEmail } from '../utils/email-service.js';
import { normalizePhone } from '../utils/otp-service.js';
import { openForgotPasswordModal } from '../components/verification-modal.js';

// Keys lưu trữ
const USERS_STORAGE_KEY = 'doctor4_users_db';
const SESSION_STORAGE_KEY = 'doctor4_session';

// Dữ liệu tài khoản mẫu ban đầu
const INITIAL_DEMO_USERS = [
  {
    id: 'usr_admin_001',
    name: 'Quản Trị Viên (Super Admin)',
    email: 'admin@doctor4.vn',
    phone: '0912345678',
    password: '123456',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr_cashier_001',
    name: 'Nguyễn Mai Anh (Thu Ngân)',
    email: 'thungan@doctor4.vn',
    phone: '0901234567',
    password: '123456',
    role: 'cashier',
    desk: 'Quầy Thu Ngân 1 - Tầng 1',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=cashier',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr_patient_001',
    name: 'Nguyễn Văn An',
    email: 'benhnhan@doctor4.vn',
    phone: '0987654321',
    password: '123456',
    role: 'patient',
    patientProfile: {
      dob: '1992-08-15',
      gender: 'Nam',
      cccdNumber: '079203018899',
      address: '123 Nguyễn Tri Phương, Quận 5, TP. Hồ Chí Minh',
      bhytCode: 'GD 4 79 1234567890',
      emergencyContact: 'Chị Nguyễn Mai Hương (0909 111 222)',
      bloodType: 'A+',
      verified: true
    },
    eyeProfile: {
      odSphere: '-2.50',
      odCyl: '-0.75',
      odAxis: '175',
      odIop: '14',
      osSphere: '-2.25',
      osCyl: '-0.50',
      osAxis: '180',
      osIop: '15',
      glassesType: 'Kính cận chống ánh sáng xanh',
      lastCheckup: '2026-09-15',
      nextCheckup: '2026-12-15',
      notes: 'Thị lực sau chỉnh kính đạt 10/10 hai mắt. Hạn chế nhìn màn hình liên tục > 45 phút, tra nước mắt nhân tạo khi mỏi khô mắt.'
    },
    createdAt: new Date().toISOString()
  }
];

// ── Auth Service ─────────────────────────────────────────────
export const AuthService = {
  getUsers() {
    try {
      let users = [];
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (!stored) {
        users = [...INITIAL_DEMO_USERS];
      } else {
        users = JSON.parse(stored);
      }

      // Đảm bảo cả 10 bác sĩ đều luôn có tài khoản đăng nhập (mật khẩu mặc định: 123456)
      const doctorsFromStorage = localStorage.getItem('doctor4_doctors_db');
      let doctorsList = INITIAL_10_DOCTORS;
      try {
        if (doctorsFromStorage) {
          const parsed = JSON.parse(doctorsFromStorage);
          if (Array.isArray(parsed) && parsed.length >= 10) doctorsList = parsed;
        }
      } catch (err) {}

      doctorsList.forEach(doc => {
        const cleanEmail = (doc.email || `doc.${doc.id}@doctor4.vn`).trim().toLowerCase();
        const cleanPhone = (doc.phone || '').replace(/\s+/g, '');
        const exists = users.find(u =>
          (u.doctorId && String(u.doctorId) === String(doc.id)) ||
          (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) ||
          (cleanPhone && u.phone && u.phone.replace(/\s+/g, '') === cleanPhone)
        );

        if (!exists) {
          users.push({
            id: 'usr_' + doc.id,
            doctorId: doc.id,
            name: doc.name,
            email: cleanEmail,
            phone: cleanPhone,
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
          // Luôn đảm bảo tài khoản bác sĩ có mật khẩu (nếu chưa có thì là 123456), vai trò doctor và đúng phòng khám
          if (!exists.password) exists.password = doc.password || '123456';
          if (!exists.role) exists.role = 'doctor';
          if (!exists.doctorId) exists.doctorId = doc.id;
          if (!exists.room && doc.room) exists.room = doc.room;
          if (!exists.roomId && doc.roomId) exists.roomId = doc.roomId;
          if (!exists.specialty && doc.specialty) exists.specialty = doc.specialty;
        }
      });

      // Đảm bảo tài khoản Thu Ngân mặc định luôn tồn tại và đúng role cashier
      const cashierUser = users.find(u => u.email === 'thungan@doctor4.vn' || u.id === 'usr_cashier_001');
      if (cashierUser) {
        cashierUser.role = 'cashier';
        if (!cashierUser.password) cashierUser.password = '123456';
        if (!cashierUser.desk) cashierUser.desk = 'Quầy Thu Ngân 1 - Tầng 1';
      } else {
        users.push({
          id: 'usr_cashier_001',
          name: 'Nguyễn Mai Anh (Thu Ngân)',
          email: 'thungan@doctor4.vn',
          phone: '0901234567',
          password: '123456',
          role: 'cashier',
          desk: 'Quầy Thu Ngân 1 - Tầng 1',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=cashier',
          createdAt: new Date().toISOString()
        });
      }

      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      return users;
    } catch (e) {
      console.error('Error reading users db', e);
      return INITIAL_DEMO_USERS;
    }
  },

  /**
   * Cung cấp / Cập nhật tài khoản Bác sĩ mới (Được gọi khi Admin thêm/sửa Bác sĩ)
   */
  createOrUpdateDoctorUser(doc, password = '123456') {
    const users = this.getUsers();
    const cleanEmail = (doc.email || '').trim().toLowerCase();
    const cleanPhone = (doc.phone || '').replace(/\s+/g, '');

    const index = users.findIndex(u =>
      (u.doctorId && String(u.doctorId) === String(doc.id)) ||
      (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) ||
      (cleanPhone && u.phone && u.phone.replace(/\s+/g, '') === cleanPhone)
    );

    const docUserData = {
      id: doc.userId || ('usr_doc_' + (doc.id || Date.now())),
      doctorId: doc.id,
      name: doc.name,
      email: cleanEmail,
      phone: cleanPhone,
      password: password || '123456',
      role: 'doctor',
      degree: doc.degree || 'Bác sĩ chuyên khoa',
      specialty: doc.specialty || 'Khám Mắt',
      room: doc.room || 'Phòng 101',
      roomId: doc.roomId || 'R101',
      schedule: doc.schedule || 'Thứ 2 - Thứ 6 (08:00 - 17:00)',
      avatar: doc.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      users[index] = { ...users[index], ...docUserData, password: password || users[index].password || '123456' };
    } else {
      users.push(docUserData);
    }

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return docUserData;
  },

  saveUsers(users) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  },

  getCurrentUser() {
    try {
      const session = localStorage.getItem(SESSION_STORAGE_KEY) || sessionStorage.getItem(SESSION_STORAGE_KEY);
      return session ? JSON.parse(session) : null;
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(user, remember = true) {
    const userSafe = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role || 'patient',
      doctorId: user.doctorId || null,
      room: user.room || null,
      roomId: user.roomId || null,
      degree: user.degree || null,
      specialty: user.specialty || null,
      schedule: user.schedule || null,
      desk: user.desk || null,
      avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`
    };

    // Nếu là admin, đồng bộ sang cả session của admin portal
    if (user.role === 'admin') {
      const adminSession = {
        isLoggedIn: true,
        username: user.email.split('@')[0],
        email: user.email,
        displayName: user.name,
        role: 'Super Admin',
        avatar: user.avatar,
        loginAt: new Date().toISOString()
      };
      localStorage.setItem('doctor4_admin_session', JSON.stringify(adminSession));
    }

    if (remember) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userSafe));
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userSafe));
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }

    return userSafe;
  },

  logout() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  },

  login(identifier, password, remember = true) {
    const users = this.getUsers();
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPhoneInput = (identifier || '').trim().replace(/\s+/g, '');

    const matchedUser = users.find(u => {
      const uEmail = (u.email || '').trim().toLowerCase();
      const uPhone = (u.phone || '').trim().replace(/\s+/g, '');
      const uDocId = (u.doctorId || '').trim().toLowerCase();
      const pwdMatch = String(u.password || '123456') === String(password);
      return (uEmail === cleanId || uPhone === cleanPhoneInput || uDocId === cleanId) && pwdMatch;
    });

    if (!matchedUser) {
      throw new Error('Email/Số điện thoại hoặc mật khẩu không chính xác.');
    }

    return this.setCurrentUser(matchedUser, remember);
  },

  register(userData, remember = true) {
    const users = this.getUsers();
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanPhone = userData.phone.trim();

    // Check duplicate email
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('Email này đã được đăng ký tài khoản. Vui lòng sử dụng email khác hoặc Đăng nhập.');
    }

    // Check duplicate phone
    if (users.some(u => u.phone === cleanPhone)) {
      throw new Error('Số điện thoại này đã được đăng ký tài khoản.');
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      name: userData.name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: userData.password,
      role: 'patient',
      patientProfile: userData.patientProfile || null,
      avatar: (userData.patientProfile && userData.patientProfile.photo4x6) || undefined,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);
    return this.setCurrentUser(newUser, remember);
  },

  /** Tìm bản ghi người dùng theo id / email / số điện thoại (không phân biệt hoa thường) */
  findUser(identifier) {
    const clean = String(identifier || '').trim().toLowerCase();
    const cleanPhone = normalizePhone(identifier);
    if (!clean) return null;
    return this.getUsers().find(u =>
      (u.id && String(u.id).toLowerCase() === clean) ||
      (u.email && String(u.email).trim().toLowerCase() === clean) ||
      (u.phone && normalizePhone(u.phone) === cleanPhone)
    ) || null;
  },

  /** Xác nhận mật khẩu hiện tại của 1 người dùng */
  verifyPassword(user, password) {
    if (!user) return false;
    return String(user.password || '123456') === String(password || '');
  },

  /**
   * Đặt lại / đổi mật khẩu.
   * @param {object} params { userId, newPassword, requireOldPassword?, oldPassword? }
   */
  updatePassword({ userId, newPassword, oldPassword = null, requireOldPassword = false }) {
    const users = this.getUsers();
    const idx = users.findIndex(u => String(u.id) === String(userId));
    if (idx === -1) throw new Error('Không tìm thấy tài khoản cần đổi mật khẩu.');

    if (requireOldPassword && !this.verifyPassword(users[idx], oldPassword)) {
      throw new Error('Mật khẩu hiện tại không chính xác.');
    }

    const pwd = String(newPassword || '');
    if (pwd.length < 6) throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự.');
    if (this.verifyPassword(users[idx], pwd)) {
      throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại.');
    }

    users[idx] = {
      ...users[idx],
      password: pwd,
      passwordUpdatedAt: new Date().toISOString()
    };
    this.saveUsers(users);

    // Cập nhật phiên đăng nhập hiện tại trên thiết bị này
    const session = this.getCurrentUser();
    if (session && String(session.id) === String(userId)) {
      this.setCurrentUser(users[idx], Boolean(localStorage.getItem(SESSION_STORAGE_KEY)));
    }
    return users[idx];
  },

  /** Kiểm tra email / số điện thoại đã thuộc tài khoản khác chưa */
  isContactTaken({ email, phone, exceptUserId }) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPhone = normalizePhone(phone);
    return this.getUsers().some(u => {
      if (String(u.id) === String(exceptUserId)) return false;
      const uEmail = String(u.email || '').trim().toLowerCase();
      const uPhone = normalizePhone(u.phone);
      return (cleanEmail && uEmail === cleanEmail) || (cleanPhone && uPhone === cleanPhone);
    });
  },

  /**
   * Cập nhật email / số điện thoại SAU KHI đã xác thực OTP.
   * @param {object} params { userId, email?, phone? }
   * @returns {{ user: object, changes: object }}
   */
  changeContact({ userId, email, phone }) {
    const users = this.getUsers();
    const idx = users.findIndex(u => String(u.id) === String(userId));
    if (idx === -1) throw new Error('Không tìm thấy tài khoản cần cập nhật.');

    const old = users[idx];
    const nextEmail = email !== undefined ? String(email).trim() : old.email;
    const nextPhone = phone !== undefined ? normalizePhone(phone) : old.phone;

    if (email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
        throw new Error('Địa chỉ email mới không đúng định dạng.');
      }
      if (this.isContactTaken({ email: nextEmail, exceptUserId: old.id })) {
        throw new Error('Email này đã được dùng cho một tài khoản khác.');
      }
    }

    if (phone !== undefined) {
      if (!/^0\d{9}$/.test(nextPhone)) {
        throw new Error('Số điện thoại mới không đúng định dạng (10 số, bắt đầu bằng 0).');
      }
      if (this.isContactTaken({ phone: nextPhone, exceptUserId: old.id })) {
        throw new Error('Số điện thoại này đã được dùng cho một tài khoản khác.');
      }
    }

    const changes = {};
    if (nextEmail !== old.email) changes.email = { from: old.email, to: nextEmail };
    if (nextPhone !== old.phone) changes.phone = { from: old.phone, to: nextPhone };

    users[idx] = {
      ...old,
      email: nextEmail,
      phone: nextPhone,
      contactUpdatedAt: new Date().toISOString()
    };
    this.saveUsers(users);

    // Đồng bộ email sang hồ sơ bệnh nhân (dùng khi gửi thư xác nhận lịch khám)
    try {
      const apps = JSON.parse(localStorage.getItem('doctor4_appointments_db') || '[]');
      let touched = false;
      const updated = apps.map(app => {
        if (String(app.patientPhone || '') === String(old.phone || '') && app.patientEmail) {
          touched = true;
          return { ...app, patientEmail: changes.email ? nextEmail : app.patientEmail, patientPhone: nextPhone };
        }
        return app;
      });
      if (touched) localStorage.setItem('doctor4_appointments_db', JSON.stringify(updated));
    } catch (e) { /* bỏ qua */ }

    const session = this.getCurrentUser();
    if (session && String(session.id) === String(userId)) {
      this.setCurrentUser(users[idx], Boolean(localStorage.getItem(SESSION_STORAGE_KEY)));
    }

    return { user: users[idx], changes };
  }
};

// ── Toast Notification UI ────────────────────────────────────
export function showToast(type = 'info', title = 'Thông báo', message = '', duration = 4000) {
  let container = document.getElementById('auth-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'auth-toast-container';
    container.className = 'auth-toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  const toast = document.createElement('div');
  toast.className = `auth-toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '🔔'}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" aria-label="Đóng">✕</button>
    <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
  `;

  const removeToast = () => {
    toast.style.animation = 'toastSlideOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector('.toast-close').addEventListener('click', removeToast);
  container.appendChild(toast);

  const timeoutId = setTimeout(removeToast, duration);
  toast.addEventListener('mouseenter', () => clearTimeout(timeoutId));
}

// ── Password Visibility Toggle Setup ────────────────────────
function setupPasswordToggles() {
  document.querySelectorAll('.btn-toggle-pwd').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
        btn.setAttribute('aria-label', 'Ẩn mật khẩu');
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
        btn.setAttribute('aria-label', 'Hiện mật khẩu');
      }
    });
  });
}

// ── Validation Helpers ──────────────────────────────────────
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_PHONE = /(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})\b/;

function setFieldError(fieldId, errorMsg) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (input) {
    if (errorMsg) {
      input.classList.add('is-invalid');
      input.classList.remove('is-valid');
    } else {
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
    }
  }
  if (errorEl) {
    if (errorMsg) {
      errorEl.textContent = errorMsg;
      errorEl.classList.add('visible');
    } else {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }
}

function clearFieldErrors(form) {
  form.querySelectorAll('.auth-input').forEach(input => {
    input.classList.remove('is-invalid', 'is-valid');
  });
  form.querySelectorAll('.form-error').forEach(err => {
    err.textContent = '';
    err.classList.remove('visible');
  });
}

// ── Forgot Password (xác thực OTP) ───────────────────────────
function setupForgotPassword() {
  const link = document.getElementById('linkForgotPassword');
  if (!link) return;

  link.addEventListener('click', (e) => {
    e.preventDefault();
    const identifier = document.getElementById('loginIdentifier')?.value.trim() || '';
    openForgotPasswordModal({ prefill: identifier });
  });

  // Hỗ trợ mở trực tiếp: /dang-nhap.html?forgot=1
  if (new URLSearchParams(window.location.search).get('forgot') === '1') {
    setTimeout(() => openForgotPasswordModal(), 300);
  }
}

// ── Login Page Logic ─────────────────────────────────────────
function setupLoginPage() {
  const form = document.getElementById('formLogin');
  if (!form) return;

  // Setup quick demo fill
  document.querySelectorAll('.btn-demo-fill').forEach(btn => {
    btn.addEventListener('click', () => {
      const email = btn.getAttribute('data-email');
      const pwd = btn.getAttribute('data-pwd');
      const emailInput = document.getElementById('loginIdentifier');
      const pwdInput = document.getElementById('loginPassword');
      if (emailInput && pwdInput) {
        emailInput.value = email;
        pwdInput.value = pwd;
        clearFieldErrors(form);
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors(form);

    const identifierInput = document.getElementById('loginIdentifier');
    const passwordInput = document.getElementById('loginPassword');
    const rememberInput = document.getElementById('loginRemember');
    const submitBtn = document.getElementById('btnLoginSubmit');

    const identifier = identifierInput ? identifierInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const remember = rememberInput ? rememberInput.checked : true;

    let hasError = false;

    if (!identifier) {
      setFieldError('loginIdentifier', 'Vui lòng nhập Email hoặc Số điện thoại');
      hasError = true;
    }

    if (!password) {
      setFieldError('loginPassword', 'Vui lòng nhập Mật khẩu');
      hasError = true;
    }

    if (hasError) return;

    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      // Giả lập network delay ngắn cho trải nghiệm chân thực
      await new Promise(res => setTimeout(res, 600));

      const user = AuthService.login(identifier, password, remember);

      showToast('success', 'Đăng nhập thành công!', `Chào mừng ${user.name} trở lại với Doctor4!`);

      // Điều hướng theo vai trò (Role-based redirect ưu tiên cao nhất)
      const urlParams = new URLSearchParams(window.location.search);
      let redirectUrl = urlParams.get('redirect');

      if (user.role === 'cashier') {
        redirectUrl = '/thu-ngan.html';
      } else if (user.role === 'doctor') {
        redirectUrl = '/bac-si.html';
      } else if (user.role === 'admin') {
        redirectUrl = '/admin/index.html';
      } else if (!redirectUrl || redirectUrl === '/' || redirectUrl === '/index.html' || redirectUrl === '/dang-nhap.html') {
        redirectUrl = '/lich-kham.html';
      }

      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);
    } catch (err) {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      showToast('error', 'Đăng nhập thất bại', err.message);
      setFieldError('loginPassword', err.message);
    }
  });
}

// ── Register Page Logic ──────────────────────────────────────
function setupRegisterPage() {
  const form = document.getElementById('formRegister');
  if (!form) return;

  // Xử lý upload và xem trước 3 ảnh (4x6, CCCD trước, CCCD sau)
  let photo4x6Data = '';
  let cccdFrontData = '';
  let cccdBackData = '';

  const bindImageUpload = (fileInputId, previewBoxId, onCompressed) => {
    const input = document.getElementById(fileInputId);
    const box = document.getElementById(previewBoxId);
    if (!input || !box) return;

    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          box.innerHTML = `<span style="font-size: 11px; color: #0284c7;">⏳ Đang nén...</span>`;
          const base64 = await compressImageFile(file, 600, 600, 0.75);
          onCompressed(base64);
          box.innerHTML = `<img src="${base64}" style="width: 100%; height: 100%; object-fit: cover;" />`;
          showToast('success', 'Đã tải ảnh thành công', `Đã chọn ảnh ${file.name}`);
        } catch (err) {
          box.innerHTML = `<span style="font-size: 11px; color: red;">Lỗi tải ảnh</span>`;
        }
      }
    });
  };

  bindImageUpload('filePhoto4x6', 'preview-photo4x6-box', (data) => { photo4x6Data = data; });
  bindImageUpload('fileCccdFront', 'preview-cccd-front-box', (data) => { cccdFrontData = data; });
  bindImageUpload('fileCccdBack', 'preview-cccd-back-box', (data) => { cccdBackData = data; });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors(form);

    const nameInput = document.getElementById('regName');
    const phoneInput = document.getElementById('regPhone');
    const emailInput = document.getElementById('regEmail');
    const pwdInput = document.getElementById('regPassword');
    const confirmPwdInput = document.getElementById('regConfirmPassword');
    const agreeTerms = document.getElementById('regAgreeTerms');
    const submitBtn = document.getElementById('btnRegisterSubmit');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const contactEmailInput = document.getElementById('regContactEmail');
    const contactEmail = contactEmailInput ? contactEmailInput.value.trim() : '';
    const password = pwdInput ? pwdInput.value : '';
    const confirmPassword = confirmPwdInput ? confirmPwdInput.value : '';
    const agreed = agreeTerms ? agreeTerms.checked : false;

    // Các trường profile bổ sung
    const dob = document.getElementById('regDob')?.value || '1995-05-20';
    const gender = document.getElementById('regGender')?.value || 'Nam';
    const cccdNumber = document.getElementById('regCccd')?.value.trim() || '079203018899';
    const address = document.getElementById('regAddress')?.value.trim() || '123 Nguyễn Tri Phương, Q.5, TP.HCM';

    const defaults = getDefaultPatientPhotos(name, gender);

    let hasError = false;

    if (!name || name.length < 2) {
      setFieldError('regName', 'Họ và tên tối thiểu 2 ký tự');
      hasError = true;
    }

    if (!phone || !REGEX_PHONE.test(phone)) {
      setFieldError('regPhone', 'Số điện thoại không đúng định dạng (10 số)');
      hasError = true;
    }

    if (!email || !REGEX_EMAIL.test(email)) {
      setFieldError('regEmail', 'Email không đúng định dạng');
      hasError = true;
    }

    if (contactEmail && !isValidEmail(contactEmail)) {
      setFieldError('regContactEmail', 'Email nhận thông tin đặt lịch không đúng định dạng Gmail');
      hasError = true;
    }

    if (!password || password.length < 6) {
      setFieldError('regPassword', 'Mật khẩu phải có ít nhất 6 ký tự');
      hasError = true;
    }

    if (password !== confirmPassword) {
      setFieldError('regConfirmPassword', 'Mật khẩu xác nhận không khớp');
      hasError = true;
    }

    if (!agreed) {
      showToast('error', 'Thông báo', 'Bạn cần đồng ý với Điều khoản sử dụng để đăng ký tài khoản.');
      hasError = true;
    }

    if (hasError) return;

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      await new Promise(res => setTimeout(res, 700));

      const patientProfile = {
        dob,
        gender,
        cccdNumber,
        address,
        photo4x6: photo4x6Data || defaults.photo4x6,
        cccdFront: cccdFrontData || defaults.cccdFront,
        cccdBack: cccdBackData || defaults.cccdBack,
        verified: true,
        updatedAt: new Date().toISOString()
      };

      const newUser = AuthService.register({
        name,
        phone,
        email,
        password,
        patientProfile
      }, true);

      showToast('success', 'Đăng ký thành công!', `Hồ sơ bệnh nhân trực tuyến của ${newUser.name} đã tạo thành công!`);

      // Gửi mail chào mừng về Gmail bệnh nhân
      const welcomeTo = contactEmail || newUser.email;
      if (isValidEmail(welcomeTo)) {
        sendWelcomeEmail({
          name: newUser.name,
          email: welcomeTo,
          phone: newUser.phone
        }).then(res => {
          if (res.success) {
            showToast('success', 'Đã gửi email chào mừng', `Thông tin tài khoản đã được gửi tới ${welcomeTo}.`);
          } else {
            showToast('info', 'Chưa gửi được email', res.error || 'Không thể gửi email chào mừng.');
          }
        }).catch(() => {});
      }

      setTimeout(() => {
        window.location.href = '/index.html';
      }, 1200);
    } catch (err) {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      showToast('error', 'Đăng ký thất bại', err.message);
      if (err.message.includes('Email')) {
        setFieldError('regEmail', err.message);
      } else if (err.message.includes('Số điện thoại')) {
        setFieldError('regPhone', err.message);
      }
    }
  });
}

// ── Social Login Mock Buttons ────────────────────────────────
function setupSocialButtons() {
  document.querySelectorAll('.btn-social').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const provider = btn.textContent.trim();
      showToast('info', 'Đăng nhập mạng xã hội', `Đang kết nối xác thực với ${provider}...`);

      // Auto mock social login
      setTimeout(() => {
        const mockUser = {
          id: 'usr_social_' + Date.now(),
          name: `Người dùng ${provider.includes('Google') ? 'Google' : 'Facebook'}`,
          email: provider.includes('Google') ? 'user.google@gmail.com' : 'user.fb@facebook.com',
          phone: '0901234567',
          role: 'patient',
          createdAt: new Date().toISOString()
        };
        AuthService.setCurrentUser(mockUser, true);
        showToast('success', 'Đăng nhập thành công!', `Chào mừng ${mockUser.name} đến với Doctor4!`);
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 1000);
      }, 900);
    });
  });
}

// ── Main Initializer ─────────────────────────────────────────
function initAuth() {
  // Render header/footer
  const header = document.getElementById('header-container');
  if (header) {
    header.innerHTML = renderHeader('auth');
  }

  const footer = document.getElementById('footer-container');
  if (footer) {
    footer.innerHTML = renderFooter();
  }

  setupHeaderEvents();
  setupPasswordToggles();
  setupForgotPassword();
  setupLoginPage();
  setupRegisterPage();
  setupSocialButtons();

  // If already logged in on login/register page, show note
  const currentUser = AuthService.getCurrentUser();
  if (currentUser) {
    let rolePortalLink = '/lich-kham.html';
    let rolePortalText = 'Xem lịch khám';
    if (currentUser.role === 'cashier') {
      rolePortalLink = '/thu-ngan.html';
      rolePortalText = '💵 Vào Cổng Thu Ngân';
    } else if (currentUser.role === 'doctor') {
      rolePortalLink = '/bac-si.html';
      rolePortalText = '🩺 Vào Cổng Bác Sĩ';
    } else if (currentUser.role === 'admin') {
      rolePortalLink = '/admin/index.html';
      rolePortalText = '👑 Vào Cổng Quản Trị';
    }

    const noticeStrip = document.createElement('div');
    noticeStrip.style.cssText = 'background: rgba(37,99,235,0.2); border: 1px solid rgba(37,99,235,0.4); padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; color: #93C5FD; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;';
    noticeStrip.innerHTML = `
      <span>Bạn đang đăng nhập: <strong>${currentUser.name}</strong> (${currentUser.role === 'cashier' ? 'Thu Ngân' : currentUser.role === 'doctor' ? 'Bác Sĩ' : currentUser.role === 'admin' ? 'Quản Trị' : 'Bệnh Nhân'})</span>
      <div style="display:flex;gap:12px;">
        <a href="${rolePortalLink}" style="color: #4ade80; font-weight: 700; text-decoration: none;">${rolePortalText} →</a>
        <a href="/index.html" style="color: #38BDF8; font-weight: 600; text-decoration: underline;">Về trang chủ</a>
      </div>
    `;
    const formHeader = document.querySelector('.auth-panel-header');
    if (formHeader && formHeader.parentNode) {
      formHeader.parentNode.insertBefore(noticeStrip, formHeader.nextSibling);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}
