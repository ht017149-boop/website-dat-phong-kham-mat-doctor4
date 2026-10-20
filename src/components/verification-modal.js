/* ============================================================
   src/components/verification-modal.js — Doctor4 Eye Clinic
   Modal dùng chung cho 3 luồng bảo mật:
     1. Quên mật khẩu         → openForgotPasswordModal()
     2. Đổi mật khẩu          → openChangePasswordModal()
     3. Đổi Email / Số điện thoại (xác thực OTP) → openChangeContactModal()

   Quy trình chung: nhập thông tin → GỬI MÃ OTP → NHẬP OTP →
   bước cuối (đặt mật khẩu mới / lưu thông tin mới).
   ============================================================ */

import { AuthService, showToast } from '../pages/auth.js';
import {
  sendOtpCode,
  verifyOtpCode,
  checkVerificationTicket,
  consumeVerificationTicket,
  sendProfileChangeNotice,
  maskEmail,
  normalizePhone,
  isValidPhone,
  getResendCooldown,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS
} from '../utils/otp-service.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PWD_REGEX_NUMBER = /\d/;
const PWD_REGEX_LETTER = /[a-zA-Z]/;

/* ── Tiện ích DOM ──────────────────────────────────────────── */
function esc(str) {
  return String(str === null || str === undefined ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getModalRoot() {
  let root = document.getElementById('d4otp-modal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'd4otp-modal-root';
    root.className = 'd4modal-overlay';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    document.body.appendChild(root);
  }
  return root;
}

function closeModal() {
  const root = document.getElementById('d4otp-modal-root');
  if (!root) return;
  root.classList.remove('show');
  root.innerHTML = '';
  document.body.classList.remove('d4modal-open');
}

/**
 * Mở modal với nội dung tuỳ biến.
 * @param {object} opts { title, subtitle, icon, bodyHtml, wide? }
 */
function openShell({ title, subtitle, icon = '🔐', bodyHtml, wide = false }) {
  const root = getModalRoot();
  root.innerHTML = `
    <div class="d4modal" ${wide ? 'style="max-width: 640px;"' : ''}>
      <div class="d4modal-head">
        <div class="d4modal-icon">${icon}</div>
        <div>
          <h3 class="d4modal-title">${title}</h3>
          <p class="d4modal-subtitle">${subtitle}</p>
        </div>
        <button type="button" class="d4modal-close" id="d4otpClose" aria-label="Đóng">✕</button>
      </div>
      <div class="d4modal-body" id="d4otpBody">${bodyHtml}</div>
    </div>
  `;
  root.classList.add('show');
  document.body.classList.add('d4modal-open');

  root.querySelector('#d4otpClose').addEventListener('click', closeModal);
  // Bấm ra ngoài chỉ đóng khi không phải panel (và chỉ gắn 1 lần)
  root.onclick = (e) => {
    if (e.target === root) closeModal();
  };

  // Chỉ gắn 1 listener Escape cho cả vòng đời modal
  if (!root.dataset.escBound) {
    root.dataset.escBound = '1';
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && root.classList.contains('show')) closeModal();
    });
  }

  const firstInput = root.querySelector('input');
  if (firstInput) setTimeout(() => firstInput.focus(), 120);

  return root;
}

function setBody(html) {
  const body = document.getElementById('d4otpBody');
  if (body) body.innerHTML = html;
}

function field({ id, label, type = 'text', icon = '👤', placeholder = '', value = '', maxlength = '', autocomplete = 'off', required = true, hint = '' }) {
  return `
    <div class="form-group">
      <label class="form-label" for="${id}">
        <span>${label}${required ? ' <span class="form-label-required">*</span>' : ''}</span>
      </label>
      <div class="input-icon-wrapper">
        <input type="${type}" id="${id}" class="auth-input" placeholder="${esc(placeholder)}"
               value="${esc(value)}" maxlength="${maxlength}" autocomplete="${autocomplete}" />
        <span class="input-icon">${icon}</span>
        ${type === 'password' ? `<button type="button" class="btn-toggle-pwd" data-target="${id}" aria-label="Hiện mật khẩu">👁️</button>` : ''}
      </div>
      <div class="form-error" id="${id}-error"></div>
      ${hint ? `<div class="d4modal-hint">${hint}</div>` : ''}
    </div>
  `;
}

function bindPasswordToggles(scope) {
  scope.querySelectorAll('.btn-toggle-pwd').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.getAttribute('data-target'));
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? '🙈' : '👁️';
    });
  });
}

function setErr(id, message) {
  const input = document.getElementById(id);
  const err = document.getElementById(`${id}-error`);
  if (input) {
    input.classList.toggle('is-invalid', Boolean(message));
    input.classList.toggle('is-valid', !message && input.value.trim() !== '');
  }
  if (err) {
    err.textContent = message || '';
    err.classList.toggle('visible', Boolean(message));
  }
}

function clearErrs() {
  document.querySelectorAll('#d4otpBody .form-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('visible');
  });
  document.querySelectorAll('#d4otpBody .auth-input').forEach(el => el.classList.remove('is-invalid', 'is-valid'));
}

/** Kiểm tra độ mạnh mật khẩu. Trả về { ok, score, message }. */
function evaluatePassword(pwd) {
  const p = String(pwd || '');
  if (p.length < 6) return { ok: false, score: 0, message: 'Mật khẩu phải có ít nhất 6 ký tự.' };
  if (p.length < 8) return { ok: true, score: 1, message: 'Mật khẩu yếu — nên thêm ký tự cho an toàn hơn.' };
  const score = [PWD_REGEX_LETTER.test(p), PWD_REGEX_NUMBER.test(p), /[^a-zA-Z0-9]/.test(p), p.length >= 12].filter(Boolean).length;
  if (score >= 3) return { ok: true, score: 3, message: 'Mật khẩu mạnh.' };
  if (score === 2) return { ok: true, score: 2, message: 'Mật khẩu khá — nên thêm ký tự đặc biệt.' };
  return { ok: true, score: 1, message: 'Mật khẩu yếu — nên thêm chữ, số và ký tự đặc biệt.' };
}

function renderStrength(inputId, barId, textId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('input', () => {
    const res = evaluatePassword(input.value);
    const bar = document.getElementById(barId);
    const text = document.getElementById(textId);
    if (bar) bar.className = `d4pwd-bar level-${input.value ? res.score : 0}`;
    if (text) text.textContent = input.value ? res.message : '';
  });
}

function startCountdown(buttonId, prefix = 'Gửi lại mã', seconds = Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000)) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  let left = seconds;
  btn.disabled = true;
  const original = btn.dataset.label || btn.textContent;
  btn.dataset.label = original;
  btn.textContent = `${prefix} (${left}s)`;
  const timer = setInterval(() => {
    left -= 1;
    if (left <= 0) {
      clearInterval(timer);
      btn.disabled = false;
      btn.textContent = original;
      return;
    }
    btn.textContent = `${prefix} (${left}s)`;
  }, 1000);
}

function showDemoCodeBanner(code, to) {
  const body = document.getElementById('d4otpBody');
  if (!body || !code) return;
  const banner = document.createElement('div');
  banner.className = 'd4modal-demo';
  banner.innerHTML = `
    <strong>⚠️ Chế độ mẫu</strong> — EmailJS chưa được cấu hình nên không gửi được thư tới <em>${esc(to)}</em>.
    Mã xác thực dùng thử: <code>${esc(code)}</code>
  `;
  body.insertBefore(banner, body.firstChild);
}

/* ── Bước nhập OTP (dùng chung cho cả 3 luồng) ─────────────── */
/**
 * @param {object} ctx
 * @param {object} ctx.user
 * @param {string} ctx.purpose
 * @param {string} ctx.channelLabel  mô tả kênh nhận mã
 * @param {object} ctx.sendOpts      tham số truyền cho sendOtpCode (toEmails...)
 * @param {Function} ctx.onVerified  async ({ userId, ticket }) => void
 * @param {string} [ctx.headerHtml]
 */
async function renderOtpStep(ctx) {
  const { user, purpose, channelLabel, sendOpts = {}, onVerified, headerHtml = '' } = ctx;

  setBody(`
    ${headerHtml}
    <div class="d4modal-step">BƯỚC 2/2 · Nhập mã xác thực</div>
    <p class="d4modal-text">
      Mã gồm <strong>6 chữ số</strong> đã được gửi tới <strong>${esc(channelLabel)}</strong>.
      Mã có hiệu lực <strong>5 phút</strong>.
    </p>
    ${field({
    id: 'otpCode',
    label: 'Mã xác thực (OTP)',
    icon: '🔑',
    placeholder: '• • • • • •',
    maxlength: '6',
    autocomplete: 'one-time-code',
    hint: `Bạn còn tối đa ${OTP_MAX_ATTEMPTS} lần nhập. Nếu không nhận được thư, hãy kiểm tra mục Thư rác/Spam.`
  })}
    <div class="d4modal-actions">
      <button type="button" class="d4modal-btn ghost" id="otpResendBtn">📨 Gửi lại mã</button>
      <button type="button" class="d4modal-btn primary" id="otpVerifyBtn">✅ Xác nhận mã</button>
    </div>
    <button type="button" class="d4modal-link" id="otpBackBtn">← Quay lại</button>
  `);
  clearErrs();

  const codeInput = document.getElementById('otpCode');
  codeInput?.focus();
  codeInput?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
  });

  // Đã gửi 1 mã ở bước trước → bắt đầu đếm ngược
  const remain = getResendCooldown(user.id, purpose);
  if (remain > 0) startCountdown('otpResendBtn', 'Gửi lại mã', remain);

  document.getElementById('otpBackBtn')?.addEventListener('click', () => {
    if (typeof ctx.onBack === 'function') ctx.onBack();
    else closeModal();
  });

  document.getElementById('otpResendBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('otpResendBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Đang gửi...';
    const res = await sendOtpCode({ user, purpose, ...sendOpts });
    btn.textContent = '📨 Gửi lại mã';

    if (res.success) {
      showToast('success', 'Đã gửi lại mã', `Mã mới đã được gửi tới ${res.to}.`);
      startCountdown('otpResendBtn');
    } else if (res.demoCode) {
      showDemoCodeBanner(res.demoCode, res.to);
      startCountdown('otpResendBtn');
    } else {
      showToast('error', 'Không gửi được mã', res.error);
      if (res.retryAfter) startCountdown('otpResendBtn', 'Gửi lại mã', res.retryAfter);
    }
  });

  document.getElementById('otpVerifyBtn')?.addEventListener('click', async () => {
    const cleanErrs = () => setErr('otpCode', '');
    cleanErrs();
    const code = document.getElementById('otpCode').value.trim();
    if (!/^\d{6}$/.test(code)) {
      setErr('otpCode', 'Vui lòng nhập đủ 6 chữ số.');
      return;
    }

    const btn = document.getElementById('otpVerifyBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Đang kiểm tra...';

    const res = await verifyOtpCode({ userId: user.id, purpose, code });

    if (!res.success) {
      btn.disabled = false;
      btn.textContent = '✅ Xác nhận mã';
      setErr('otpCode', res.error);
      document.getElementById('otpCode').select();
      return;
    }

    btn.textContent = '✅ Đã xác thực';
    const ticketCheck = checkVerificationTicket({ userId: user.id, purpose, ticket: res.ticket });
    if (!ticketCheck.success) {
      showToast('error', 'Phiên xác thực lỗi', ticketCheck.error);
      return;
    }

    await onVerified({ userId: user.id, ticket: res.ticket, channel: ticketCheck.channel || channelLabel });
  });
}

/* ============================================================
   1. QUÊN MẬT KHẨU
   ============================================================ */
export function openForgotPasswordModal(options = {}) {
  // Bước 1: nhập email/SĐT đã đăng ký
  const renderStep1 = () => {
    openShell({
      icon: '🔑',
      title: 'Quên mật khẩu',
      subtitle: 'Xác thực bằng mã OTP gửi về email đăng ký',
      bodyHtml: `
        <p class="d4modal-text">
          Nhập <strong>Email</strong> hoặc <strong>Số điện thoại</strong> bạn đã dùng để đăng ký.
          Hệ thống sẽ gửi mã xác thực tới email chính thức của tài khoản.
        </p>
        <div class="form-group">
          <label class="form-label" for="fpIdentifier">
            <span>Email / Số điện thoại <span class="form-label-required">*</span></span>
          </label>
          <div class="input-icon-wrapper">
            <input type="text" id="fpIdentifier" class="auth-input"
                   placeholder="VD: benhnhan@doctor4.vn hoặc 0987654321"
                   value="${esc(options.prefill || '')}" autocomplete="username" />
            <span class="input-icon">👤</span>
          </div>
          <div class="form-error" id="fpIdentifier-error"></div>
        </div>
        <div class="form-group">
          <label class="form-label" for="fpContact">
            <span>Email dự phòng nhận mã (không bắt buộc)</span>
          </label>
          <div class="input-icon-wrapper">
            <input type="text" id="fpContact" class="auth-input"
                   placeholder="Dùng khi tài khoản không có email hợp lệ" autocomplete="off" />
            <span class="input-icon">✉️</span>
          </div>
          <div class="d4modal-hint">Để trống nếu bạn vẫn còn truy cập được email đã đăng ký.</div>
        </div>
        <div class="d4modal-actions">
          <button type="button" class="d4modal-btn primary full" id="fpSendBtn">📨 Gửi mã xác thực</button>
        </div>
        <div class="d4modal-note">
          Không nhớ email đăng ký? Gọi hotline <strong>1800 1234</strong> (7:00 – 21:00) để được hỗ trợ.
        </div>
      `
    });

    document.getElementById('fpIdentifier')?.focus();

    document.getElementById('fpSendBtn')?.addEventListener('click', async () => {
      clearErrs();
      const identifier = document.getElementById('fpIdentifier').value.trim();
      const fallback = document.getElementById('fpContact').value.trim();

      if (!identifier) {
        setErr('fpIdentifier', 'Vui lòng nhập email hoặc số điện thoại.');
        return;
      }
      if (fallback && !EMAIL_REGEX.test(fallback)) {
        showToast('error', 'Email dự phòng không hợp lệ', 'Vui lòng kiểm tra lại địa chỉ email dự phòng.');
        return;
      }

      const btn = document.getElementById('fpSendBtn');
      btn.disabled = true;
      btn.textContent = '⏳ Đang tìm tài khoản...';

      const user = AuthService.findUser(identifier);
      // Không tiết lộ tài khoản có tồn tại hay không đến email lạ
      if (!user) {
        btn.disabled = false;
        btn.textContent = '📨 Gửi mã xác thực';
        setErr('fpIdentifier', 'Không tìm thấy tài khoản với thông tin này.');
        return;
      }
      if (user.role === 'doctor') {
        btn.disabled = false;
        btn.textContent = '📨 Gửi mã xác thực';
        setErr('fpIdentifier', 'Tài khoản bác sĩ vui lòng liên hệ Quản trị viên để đặt lại mật khẩu.');
        return;
      }

      btn.textContent = '📨 Đang gửi mã...';
      const sendOpts = { toEmails: fallback ? [fallback] : [] };
      const res = await sendOtpCode({ user, purpose: 'reset-password', ...sendOpts });

      btn.disabled = false;
      btn.textContent = '📨 Gửi mã xác thực';

      if (!res.success && !res.demoCode) {
        showToast('error', 'Không gửi được mã', res.error);
        return;
      }

      const to = res.to || fallback || user.email;
      renderOtpStep({
        user,
        purpose: 'reset-password',
        channelLabel: maskEmail(to),
        sendOpts,
        onBack: renderStep1,
        onVerified: ({ userId, ticket }) => renderNewPasswordStep({ userId, ticket })
      });
      if (res.demoCode) {
        showDemoCodeBanner(res.demoCode, to);
      } else {
        showToast('success', 'Đã gửi mã xác thực', `Mã OTP đã được gửi tới ${maskEmail(to)}.`);
      }
    });
  };

  renderStep1();
}

/** Bước cuối của luồng quên mật khẩu: đặt mật khẩu mới */
function renderNewPasswordStep({ userId, ticket }) {
  setBody(`
    <div class="d4modal-success-icon">✅</div>
    <div class="d4modal-step">Xác thực thành công · BƯỚC 2/2</div>
    <p class="d4modal-text">Tạo mật khẩu mới cho tài khoản của bạn.</p>

    ${field({ id: 'fpNewPwd', label: 'Mật khẩu mới', type: 'password', icon: '🔒', placeholder: 'Tối thiểu 6 ký tự', autocomplete: 'new-password' })}
    <div class="d4pwd-meter"><div class="d4pwd-bar" id="fpPwdBar"></div></div>
    <div class="d4pwd-text" id="fpPwdText"></div>

    ${field({ id: 'fpConfirmPwd', label: 'Nhập lại mật khẩu mới', type: 'password', icon: '🔐', placeholder: 'Nhập lại mật khẩu', autocomplete: 'new-password' })}

    <div class="d4modal-actions">
      <button type="button" class="d4modal-btn primary full" id="fpResetBtn">💾 Lưu mật khẩu mới</button>
    </div>
  `);
  clearErrs();
  bindPasswordToggles(document.getElementById('d4otpBody'));
  renderStrength('fpNewPwd', 'fpPwdBar', 'fpPwdText');
  document.getElementById('fpNewPwd')?.focus();

  document.getElementById('fpResetBtn')?.addEventListener('click', () => {
    clearErrs();
    const pwd = document.getElementById('fpNewPwd').value;
    const confirm = document.getElementById('fpConfirmPwd').value;

    const check = evaluatePassword(pwd);
    if (!check.ok) {
      setErr('fpNewPwd', check.message);
      return;
    }
    if (pwd !== confirm) {
      setErr('fpConfirmPwd', 'Mật khẩu nhập lại không khớp.');
      return;
    }

    const ticketCheck = checkVerificationTicket({ userId, purpose: 'reset-password', ticket });
    if (!ticketCheck.success) {
      setErr('fpNewPwd', ticketCheck.error);
      return;
    }

    try {
      AuthService.updatePassword({ userId, newPassword: pwd });
      consumeVerificationTicket({ userId, purpose: 'reset-password' });
    } catch (err) {
      setErr('fpNewPwd', err.message);
      return;
    }

    setBody(`
      <div class="d4modal-success-icon">🎉</div>
      <h4 class="d4modal-done-title">Đã đặt lại mật khẩu!</h4>
      <p class="d4modal-text center">
        Mật khẩu mới đã được lưu. Bạn có thể đăng nhập ngay bằng mật khẩu vừa tạo.
      </p>
      <div class="d4modal-actions">
        <a class="d4modal-btn primary full" href="/dang-nhap.html">🔐 Đến trang đăng nhập</a>
      </div>
      <button type="button" class="d4modal-link" id="fpDoneClose">Đóng</button>
    `);
    document.getElementById('fpDoneClose')?.addEventListener('click', closeModal);
    showToast('success', 'Đổi mật khẩu thành công', 'Hãy đăng nhập lại bằng mật khẩu mới.');
  });
}

/* ============================================================
   2. ĐỔI MẬT KHẨU (khi đã đăng nhập)
   ============================================================ */
export function openChangePasswordModal() {
  const session = AuthService.getCurrentUser();
  if (!session) {
    showToast('error', 'Chưa đăng nhập', 'Vui lòng đăng nhập để đổi mật khẩu.');
    return;
  }
  const user = AuthService.findUser(session.id) || AuthService.findUser(session.email);
  if (!user) {
    showToast('error', 'Không tìm thấy tài khoản', 'Vui lòng đăng nhập lại.');
    return;
  }

  openShell({
    icon: '🔐',
    title: 'Đổi mật khẩu',
    subtitle: `Tài khoản: ${esc(user.email || user.phone)}`,
    bodyHtml: `
      ${field({ id: 'cpOldPwd', label: 'Mật khẩu hiện tại', type: 'password', icon: '🔒', placeholder: 'Nhập mật khẩu đang dùng', autocomplete: 'current-password' })}
      ${field({ id: 'cpNewPwd', label: 'Mật khẩu mới', type: 'password', icon: '🔑', placeholder: 'Tối thiểu 6 ký tự', autocomplete: 'new-password' })}
      <div class="d4pwd-meter"><div class="d4pwd-bar" id="cpPwdBar"></div></div>
      <div class="d4pwd-text" id="cpPwdText"></div>
      ${field({ id: 'cpConfirmPwd', label: 'Nhập lại mật khẩu mới', type: 'password', icon: '🔑', placeholder: 'Nhập lại mật khẩu mới', autocomplete: 'new-password' })}
      <div class="d4modal-actions">
        <button type="button" class="d4modal-btn ghost" id="cpCancelBtn">Hủy</button>
        <button type="button" class="d4modal-btn primary" id="cpSaveBtn">💾 Cập nhật mật khẩu</button>
      </div>
      <button type="button" class="d4modal-link" id="cpForgotBtn">Quên mật khẩu hiện tại? Xác thực bằng OTP →</button>
    `
  });
  bindPasswordToggles(document.getElementById('d4otpBody'));
  renderStrength('cpNewPwd', 'cpPwdBar', 'cpPwdText');
  document.getElementById('cpOldPwd')?.focus();

  document.getElementById('cpCancelBtn')?.addEventListener('click', closeModal);

  document.getElementById('cpForgotBtn')?.addEventListener('click', () => {
    openForgotPasswordModal({ prefill: user.email || user.phone });
  });

  document.getElementById('cpSaveBtn')?.addEventListener('click', () => {
    clearErrs();
    const oldPwd = document.getElementById('cpOldPwd').value;
    const newPwd = document.getElementById('cpNewPwd').value;
    const confirm = document.getElementById('cpConfirmPwd').value;

    if (!oldPwd) {
      setErr('cpOldPwd', 'Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (!AuthService.verifyPassword(user, oldPwd)) {
      setErr('cpOldPwd', 'Mật khẩu hiện tại không chính xác.');
      return;
    }
    const check = evaluatePassword(newPwd);
    if (!check.ok) {
      setErr('cpNewPwd', check.message);
      return;
    }
    if (newPwd === oldPwd) {
      setErr('cpNewPwd', 'Mật khẩu mới phải khác mật khẩu hiện tại.');
      return;
    }
    if (newPwd !== confirm) {
      setErr('cpConfirmPwd', 'Mật khẩu nhập lại không khớp.');
      return;
    }

    try {
      AuthService.updatePassword({ userId: user.id, newPassword: newPwd, oldPassword: oldPwd, requireOldPassword: true });
    } catch (err) {
      setErr('cpNewPwd', err.message);
      return;
    }

    closeModal();
    showToast('success', 'Đã đổi mật khẩu', 'Mật khẩu mới có hiệu lực ngay cho lần đăng nhập tiếp theo.');
  });
}

/* ============================================================
   3. ĐỔI EMAIL / SỐ ĐIỆN THOẠI (xác thực OTP với kênh hiện tại)
   ============================================================ */
export function openChangeContactModal() {
  const session = AuthService.getCurrentUser();
  if (!session) {
    showToast('error', 'Chưa đăng nhập', 'Vui lòng đăng nhập để thay đổi thông tin liên hệ.');
    return;
  }
  const user = AuthService.findUser(session.id) || AuthService.findUser(session.email);
  if (!user) {
    showToast('error', 'Không tìm thấy tài khoản', 'Vui lòng đăng nhập lại.');
    return;
  }
  if (user.role === 'doctor') {
    showToast('info', 'Thông tin bác sĩ', 'Tài khoản bác sĩ vui lòng liên hệ Quản trị viên để thay đổi email/SĐT.');
    return;
  }

  const renderForm = () => {
    openShell({
      icon: '✉️',
      title: 'Đổi Email / Số điện thoại',
      subtitle: 'Cần xác thực OTP trước khi áp dụng thay đổi',
      wide: true,
      bodyHtml: `
        <div class="d4modal-step">BƯỚC 1/2 · Nhập thông tin mới</div>
        <p class="d4modal-text">
          Để bảo mật, mã xác thực sẽ được gửi tới <strong>email hiện tại</strong> của tài khoản
          (<strong>${esc(maskEmail(user.email))}</strong>). Chỉ sau khi nhập đúng mã, thông tin mới mới được lưu.
        </p>

        <div class="d4modal-grid-2">
          <div class="form-group">
            <label class="form-label" for="ccEmail"><span>Email mới</span></label>
            <div class="input-icon-wrapper">
              <input type="email" id="ccEmail" class="auth-input" placeholder="${esc(user.email || 'email@example.com')}"
                     value="" autocomplete="email" />
              <span class="input-icon">✉️</span>
            </div>
            <div class="form-error" id="ccEmail-error"></div>
            <div class="d4modal-hint">Hiện tại: ${esc(user.email || '—')}</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="ccPhone"><span>Số điện thoại mới</span></label>
            <div class="input-icon-wrapper">
              <input type="tel" id="ccPhone" class="auth-input" placeholder="${esc(user.phone || '0987654321')}"
                     value="" maxlength="12" autocomplete="tel" />
              <span class="input-icon">📞</span>
            </div>
            <div class="form-error" id="ccPhone-error"></div>
            <div class="d4modal-hint">Hiện tại: ${esc(user.phone || '—')}</div>
          </div>
        </div>

        <div class="d4modal-warn">
          ℹ️ Để trống ô nào bạn không muốn thay đổi. Sau khi đổi, email cũ sẽ nhận được thư thông báo bảo mật.
        </div>

        <div class="d4modal-actions">
          <button type="button" class="d4modal-btn ghost" id="ccCancelBtn">Hủy</button>
          <button type="button" class="d4modal-btn primary" id="ccSendBtn">📨 Gửi mã xác thực</button>
        </div>
      `
    });

    document.getElementById('ccCancelBtn')?.addEventListener('click', closeModal);

    document.getElementById('ccSendBtn')?.addEventListener('click', async () => {
      clearErrs();
      const emailInput = document.getElementById('ccEmail').value.trim();
      const phoneInput = document.getElementById('ccPhone').value.trim();
      const newEmail = emailInput || null;
      const newPhone = phoneInput ? normalizePhone(phoneInput) : null;

      if (!newEmail && !newPhone) {
        showToast('error', 'Chưa có thay đổi', 'Vui lòng nhập email hoặc số điện thoại mới.');
        return;
      }

      let hasErr = false;
      if (newEmail) {
        if (!EMAIL_REGEX.test(newEmail)) {
          setErr('ccEmail', 'Email không đúng định dạng.');
          hasErr = true;
        } else if (newEmail.toLowerCase() === String(user.email || '').toLowerCase()) {
          setErr('ccEmail', 'Email mới trùng với email hiện tại.');
          hasErr = true;
        } else if (AuthService.isContactTaken({ email: newEmail, exceptUserId: user.id })) {
          setErr('ccEmail', 'Email này đã được dùng cho tài khoản khác.');
          hasErr = true;
        }
      }
      if (newPhone) {
        if (!isValidPhone(newPhone)) {
          setErr('ccPhone', 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0).');
          hasErr = true;
        } else if (newPhone === normalizePhone(user.phone)) {
          setErr('ccPhone', 'Số điện thoại mới trùng với số hiện tại.');
          hasErr = true;
        } else if (AuthService.isContactTaken({ phone: newPhone, exceptUserId: user.id })) {
          setErr('ccPhone', 'Số điện thoại này đã được dùng cho tài khoản khác.');
          hasErr = true;
        }
      }
      if (hasErr) return;

      const btn = document.getElementById('ccSendBtn');
      btn.disabled = true;
      btn.textContent = '⏳ Đang gửi mã...';

      const res = await sendOtpCode({ user, purpose: 'change-phone' });

      btn.disabled = false;
      btn.textContent = '📨 Gửi mã xác thực';

      if (!res.success && !res.demoCode) {
        showToast('error', 'Không gửi được mã', res.error);
        return;
      }

      const to = res.to || user.email;
      renderOtpStep({
        user,
        purpose: 'change-phone',
        channelLabel: maskEmail(to),
        onBack: renderForm,
        onVerified: ({ userId }) => {
          try {
            const result = AuthService.changeContact({ userId, email: newEmail || undefined, phone: newPhone || undefined });
            consumeVerificationTicket({ userId, purpose: 'change-phone' });

            // Gửi cảnh báo tới email cũ nếu có thay đổi email
            if (result.changes.email) {
              sendProfileChangeNotice({ user: { name: result.user.name, email: result.changes.email.from }, changes: result.changes })
                .catch(() => { });
            }

            const lines = [];
            if (result.changes.email) lines.push(`Email: ${result.changes.email.from} → ${result.changes.email.to}`);
            if (result.changes.phone) lines.push(`SĐT: ${result.changes.phone.from} → ${result.changes.phone.to}`);

            setBody(`
              <div class="d4modal-success-icon">✅</div>
              <h4 class="d4modal-done-title">Cập nhật thành công</h4>
              <ul class="d4modal-done-list">${lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
              <p class="d4modal-text center">Thông tin mới đã được áp dụng cho tài khoản của bạn${result.changes.email ? ' và email cũ đã nhận thư thông báo bảo mật' : ''}.</p>
              <div class="d4modal-actions">
                <button type="button" class="d4modal-btn primary full" id="ccDoneBtn">Đóng</button>
              </div>
            `);
            document.getElementById('ccDoneBtn')?.addEventListener('click', () => {
              closeModal();
              window.location.reload();
            });
            showToast('success', 'Đã cập nhật thông tin liên hệ', 'Thay đổi đã được lưu.');
          } catch (err) {
            showToast('error', 'Không lưu được thay đổi', err.message);
          }
        }
      });

      if (res.demoCode) {
        showDemoCodeBanner(res.demoCode, to);
      } else {
        showToast('success', 'Đã gửi mã xác thực', `Mã OTP đã gửi tới ${maskEmail(to)}.`);
      }
    });
  };

  renderForm();
}

export { closeModal };
