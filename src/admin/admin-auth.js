/* ============================================================
   src/admin/admin-auth.js — Doctor4 Eye Clinic
   Quản lý xác thực riêng biệt cho trang Quản trị Admin
   ============================================================ */

const ADMIN_SESSION_KEY = 'doctor4_admin_session';

// Cấu hình tài khoản Quản trị viên
const ADMIN_CREDENTIALS = {
  username: 'admin',
  email: 'admin@doctor4.vn',
  password: '123456',
  displayName: 'Quản Trị Viên (Admin)',
  role: 'Super Admin',
  avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
};

export const AdminAuth = {
  /**
   * Kiểm tra xem Admin đã đăng nhập hay chưa
   */
  isAuthenticated() {
    try {
      const session = localStorage.getItem(ADMIN_SESSION_KEY) || sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (!session) return false;
      const data = JSON.parse(session);
      return data && data.isLoggedIn === true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Lấy thông tin session hiện tại
   */
  getAdminUser() {
    try {
      const session = localStorage.getItem(ADMIN_SESSION_KEY) || sessionStorage.getItem(ADMIN_SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Thực hiện đăng nhập
   * @param {string} usernameOrEmail - 'admin' hoặc 'admin@doctor4.vn'
   * @param {string} password - '123456'
   * @param {boolean} remember - Lưu session lâu dài
   */
  login(usernameOrEmail, password, remember = true) {
    const cleanUser = (usernameOrEmail || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const isValidUser = cleanUser === ADMIN_CREDENTIALS.username.toLowerCase() || 
                        cleanUser === ADMIN_CREDENTIALS.email.toLowerCase();
    const isValidPass = cleanPass === ADMIN_CREDENTIALS.password;

    if (!isValidUser || !isValidPass) {
      return {
        success: false,
        message: 'Tài khoản hoặc mật khẩu không chính xác! (Mặc định: admin / 123456)'
      };
    }

    const sessionData = {
      isLoggedIn: true,
      username: ADMIN_CREDENTIALS.username,
      email: ADMIN_CREDENTIALS.email,
      displayName: ADMIN_CREDENTIALS.displayName,
      role: ADMIN_CREDENTIALS.role,
      avatar: ADMIN_CREDENTIALS.avatar,
      loginAt: new Date().toISOString()
    };

    if (remember) {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } else {
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }

    return {
      success: true,
      user: sessionData
    };
  },

  /**
   * Đăng xuất khỏi hệ thống Admin
   */
  logout() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
};
