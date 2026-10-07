/* ============================================================
   src/pages/auth.js — Doctor4 Eye Clinic
   Xử lý chức năng Đăng Nhập, Đăng Ký, Xác thực & Quản lý phiên
   ============================================================ */

import '../css/style.css';
import '../css/auth.css';
import { renderHeader, renderFooter, setupHeaderEvents } from '../components/layout.js';

// Keys lưu trữ
const USERS_STORAGE_KEY = 'doctor4_users_db';
const SESSION_STORAGE_KEY = 'doctor4_session';

// Dữ liệu tài khoản mẫu ban đầu
const INITIAL_DEMO_USERS = [
  {
    id: 'usr_001',
    name: 'BS. Quản Trị Viên',
    email: 'admin@doctor4.vn',
    phone: '0912345678',
    password: '123456',
    role: 'admin',
    birthday: '1985-08-20',
    gender: 'Nam',
    address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    bhyt: 'GD4799876543210',
    emergencyContact: 'BS. CKII Nguyễn Minh Quân (0918 123 456)',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr_002',
    name: 'Nguyễn Văn An',
    email: 'benhnhan@doctor4.vn',
    phone: '0987654321',
    password: '123456',
    role: 'patient',
    birthday: '1998-05-15',
    gender: 'Nam',
    address: 'Số 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    bhyt: 'DN4791234567890',
    emergencyContact: 'Chị Nguyễn Mai Hương (0909 111 222)',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    eyeProfile: {
      odSphere: '-2.50',
      odCyl: '-0.75',
      odAxis: '175',
      odIop: '14',
      osSphere: '-2.25',
      osCyl: '-0.50',
      osAxis: '180',
      osIop: '15',
      glassesType: 'Kính gọng chống ánh sáng xanh & UV400',
      lastCheckup: '2026-09-15',
      nextCheckup: '2026-12-15',
      notes: 'Thị lực chỉnh kính đạt 10/10 hai mắt. Cần hạn chế nhìn màn hình liên tục > 45 phút, tra nước mắt nhân tạo Systane Ultra khi mỏi khô.'
    },
    createdAt: new Date().toISOString()
  }
];

// ── Auth Service ─────────────────────────────────────────────
export const AuthService = {
  getUsers() {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_USERS));
        return INITIAL_DEMO_USERS;
      }
      const users = JSON.parse(stored);
      // Đảm bảo usr_002 có đầy đủ thông tin mẫu nếu đã lưu trước đó
      const demoPatient = users.find(u => u.id === 'usr_002' || u.email === 'benhnhan@doctor4.vn');
      if (demoPatient && (!demoPatient.eyeProfile || !demoPatient.address)) {
        Object.assign(demoPatient, {
          birthday: demoPatient.birthday || '1998-05-15',
          gender: demoPatient.gender || 'Nam',
          address: demoPatient.address || 'Số 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
          bhyt: demoPatient.bhyt || 'DN4791234567890',
          emergencyContact: demoPatient.emergencyContact || 'Chị Nguyễn Mai Hương (0909 111 222)',
          avatar: demoPatient.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          eyeProfile: demoPatient.eyeProfile || INITIAL_DEMO_USERS[1].eyeProfile
        });
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      }
      return users;
    } catch (e) {
      console.error('Error reading users db', e);
      return INITIAL_DEMO_USERS;
    }
  },

  saveUsers(users) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  },

  getUserById(userId) {
    const users = this.getUsers();
    return users.find(u => u.id === userId) || null;
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
      avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`,
      birthday: user.birthday || '',
      gender: user.gender || 'Nam',
      address: user.address || '',
      bhyt: user.bhyt || '',
      emergencyContact: user.emergencyContact || '',
      eyeProfile: user.eyeProfile || null,
      createdAt: user.createdAt || new Date().toISOString()
    };
    if (remember) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userSafe));
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userSafe));
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    return userSafe;
  },

  updateUserProfile(userId, data) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('Không tìm thấy tài khoản người dùng.');

    // Cập nhật các trường
    users[index] = { ...users[index], ...data };
    this.saveUsers(users);

    // Đồng bộ session nếu là user hiện tại
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      const isRemember = !!localStorage.getItem(SESSION_STORAGE_KEY);
      this.setCurrentUser(users[index], isRemember);
    }
    return users[index];
  },

  changePassword(userId, oldPassword, newPassword) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('Không tìm thấy thông tin tài khoản.');

    if (users[index].password !== oldPassword) {
      throw new Error('Mật khẩu hiện tại không chính xác.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có tối thiểu 6 ký tự.');
    }

    users[index].password = newPassword;
    this.saveUsers(users);
    return true;
  },

  logout() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  },

  login(identifier, password, remember = true) {
    const users = this.getUsers();
    const cleanId = identifier.trim().toLowerCase();
    
    const matchedUser = users.find(u => 
      (u.email.toLowerCase() === cleanId || u.phone === cleanId) && u.password === password
    );

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
      birthday: '',
      gender: 'Nam',
      address: '',
      bhyt: '',
      emergencyContact: '',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userData.name)}`,
      eyeProfile: {
        odSphere: '-1.50',
        odCyl: '-0.50',
        odAxis: '180',
        odIop: '15',
        osSphere: '-1.50',
        osCyl: '-0.50',
        osAxis: '180',
        osIop: '15',
        glassesType: 'Kính gọng thông thường',
        lastCheckup: new Date().toISOString().split('T')[0],
        nextCheckup: '',
        notes: 'Hồ sơ mới khởi tạo.'
      },
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);
    return this.setCurrentUser(newUser, remember);
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

      // Lấy query param redirect nếu có
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect') || '/index.html';

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
    const password = pwdInput ? pwdInput.value : '';
    const confirmPassword = confirmPwdInput ? confirmPwdInput.value : '';
    const agreed = agreeTerms ? agreeTerms.checked : false;

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

      const newUser = AuthService.register({
        name,
        phone,
        email,
        password
      }, true);

      showToast('success', 'Đăng ký thành công!', `Tài khoản của ${newUser.name} đã được tạo thành công.`);

      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect') || '/profile.html';

      setTimeout(() => {
        window.location.href = redirectUrl;
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
  setupLoginPage();
  setupRegisterPage();
  setupSocialButtons();

  // If already logged in on login/register page, show note
  const currentUser = AuthService.getCurrentUser();
  if (currentUser) {
    const noticeStrip = document.createElement('div');
    noticeStrip.style.cssText = 'background: rgba(37,99,235,0.2); border: 1px solid rgba(37,99,235,0.4); padding: 10px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; color: #93C5FD; display: flex; justify-content: space-between; align-items: center;';
    noticeStrip.innerHTML = `
      <span>Bạn đang đăng nhập dưới tên: <strong>${currentUser.name}</strong></span>
      <a href="/index.html" style="color: #38BDF8; font-weight: 600; text-decoration: underline;">Về trang chủ</a>
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
