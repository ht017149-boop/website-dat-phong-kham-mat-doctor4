/* ============================================================
   src/utils/otp-service.js — Doctor4 Eye Clinic
   Dịch vụ OTP dùng cho:
     1. Quên mật khẩu (gửi mã về email, xác thực rồi đặt mật khẩu mới)
     2. Đổi Email / Số điện thoại (xác thực OTP gửi về kênh hiện tại)

   Đặc điểm bảo mật:
   - Mã OTP 6 số, KHÔNG lưu plaintext (chỉ lưu SHA-256 + muối ngẫu nhiên).
   - Hết hạn sau OTP_TTL_MS (5 phút), chỉ dùng được 1 lần.
   - Tối đa OTP_MAX_ATTEMPTS lần nhập sai → mã bị hủy.
   - Giãn cách gửi lại OTP_RESEND_COOLDOWN_MS (60 giây).
   - Chỉ cho gửi tối đa OTP_MAX_PER_HOUR mã / 1 tài khoản / giờ.
   - Phiên xác thực (verification ticket) có hạn 10 phút, dùng cho
     bước "đặt mật khẩu mới" hoặc "áp dụng email/SĐT mới".

   Lưu ý: đây là lớp xác thực phía client (giống phần còn lại của dự án).
   Khi có backend, phần sinh/kiểm tra OTP phải chuyển sang server.
   ============================================================ */

import { sendEmail, isValidEmail } from './email-service.js';
import { buildOtpEmail, buildProfileChangeEmail } from './email-templates.js';

const STORE_KEY = 'doctor4_otp_store';

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 5 * 60 * 1000;           // 5 phút
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;   // 60 giây
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_MAX_PER_HOUR = 5;
const TICKET_TTL_MS = 10 * 60 * 1000;              // 10 phút

const PURPOSE_LABEL = {
  'reset-password': 'đặt lại mật khẩu',
  'change-email': 'đổi địa chỉ email',
  'change-phone': 'đổi số điện thoại'
};

// ── Lưu trữ ──────────────────────────────────────────────────
function loadStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    return {};
  }
}

function saveStore(store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch (e) { /* localStorage đầy — bỏ qua */ }
}

function recordKey(userId, purpose) {
  return `${userId}::${purpose}`;
}

// ── Hash (SHA-256 + muối) ────────────────────────────────────
function randomSalt() {
  const bytes = new Uint8Array(16);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function randomOtp() {
  const max = 10 ** OTP_LENGTH;
  if (window.crypto && window.crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    let value;
    // Loại bỏ giá trị vượt ngưỡng để phân phối đều
    const limit = Math.floor(0xffffffff / max) * max;
    do {
      window.crypto.getRandomValues(buf);
      value = buf[0];
    } while (value >= limit);
    return String(value % max).padStart(OTP_LENGTH, '0');
  }
  return String(Math.floor(Math.random() * max)).padStart(OTP_LENGTH, '0');
}

async function hashOtp(code, salt) {
  const data = new TextEncoder().encode(`${salt}:${String(code).trim()}`);
  if (window.crypto && window.crypto.subtle) {
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback (môi trường không có crypto.subtle, ví dụ http:// không phải localhost)
  let hash = 0;
  const str = `${salt}:${String(code).trim()}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `fallback_${(hash >>> 0).toString(16)}`;
}

// ── Tiện ích ─────────────────────────────────────────────────
/** Ẩn bớt email để hiển thị an toàn: nguyen***@gmail.com */
export function maskEmail(email) {
  const value = String(email || '');
  const at = value.indexOf('@');
  if (at < 1) return value;
  const name = value.slice(0, at);
  const domain = value.slice(at + 1);
  const keep = name.length <= 2 ? 1 : 2;
  return `${name.slice(0, keep)}${'*'.repeat(Math.max(3, name.length - keep))}@${domain}`;
}

/** Ẩn bớt số điện thoại: 0987***321 */
export function maskPhone(phone) {
  const digits = String(phone || '').replace(/\s+/g, '');
  if (digits.length < 6) return digits;
  return `${digits.slice(0, 3)}${'*'.repeat(digits.length - 6)}${digits.slice(-3)}`;
}

export function normalizePhone(phone) {
  return String(phone || '').replace(/[\s.-]/g, '');
}

export function isValidPhone(phone) {
  return /^(0|\+84)(\d{9})$/.test(normalizePhone(phone));
}

export function getPurposeLabel(purpose) {
  return PURPOSE_LABEL[purpose] || 'xác thực tài khoản';
}

/** Số giây còn lại trước lần gửi OTP tiếp theo (0 nếu được gửi ngay). */
export function getResendCooldown(userId, purpose) {
  const rec = loadStore()[recordKey(userId, purpose)];
  if (!rec || !rec.lastSentAt) return 0;
  const remain = rec.lastSentAt + OTP_RESEND_COOLDOWN_MS - Date.now();
  return remain > 0 ? Math.ceil(remain / 1000) : 0;
}

function pruneSendHistory(list = []) {
  const since = Date.now() - 60 * 60 * 1000;
  return list.filter(t => t > since);
}

// ── API chính ────────────────────────────────────────────────
/**
 * Gửi OTP tới email (kênh mặc định) hoặc tới email dự phòng của quản trị.
 *
 * @param {object} opts
 * @param {object} opts.user         Bản ghi người dùng trong doctor4_users_db
 * @param {string} opts.purpose      'reset-password' | 'change-email' | 'change-phone'
 * @param {string[]} [opts.toEmails] Danh sách email nhận mã (ưu tiên thứ tự).
 * @returns {Promise<{success:boolean, error?:string, to?:string, demoCode?:string, retryAfter?:number}>}
 */
export async function sendOtpCode({ user, purpose, toEmails = [] }) {
  if (!user || !user.id) {
    return { success: false, error: 'Không xác định được tài khoản cần xác thực.' };
  }

  const store = loadStore();
  const key = recordKey(user.id, purpose);
  const now = Date.now();

  // 1) Giãn cách gửi lại
  const cooldown = getResendCooldown(user.id, purpose);
  if (cooldown > 0) {
    return {
      success: false,
      retryAfter: cooldown,
      error: `Vui lòng chờ ${cooldown} giây nữa rồi mới yêu cầu gửi lại mã.`
    };
  }

  // 2) Giới hạn số mã trong 1 giờ
  const prev = store[key] || {};
  const sendHistory = pruneSendHistory(prev.sendHistory || []);
  if (sendHistory.length >= OTP_MAX_PER_HOUR) {
    return {
      success: false,
      error: `Bạn đã yêu cầu gửi mã ${OTP_MAX_PER_HOUR} lần trong 1 giờ. Vui lòng thử lại sau hoặc gọi hotline 1800 1234.`
    };
  }

  // 3) Chọn kênh nhận mã: email hợp lệ đầu tiên, nếu không có thì dùng email dự phòng của phòng khám
  const candidates = [...toEmails, user.email, user.patientProfile?.contactEmail]
    .map(v => String(v || '').trim())
    .filter(v => v && isValidEmail(v));

  if (!candidates.length) {
    return {
      success: false,
      error: 'Tài khoản chưa có email hợp lệ để nhận mã. Vui lòng liên hệ hotline 1800 1234 để được hỗ trợ.'
    };
  }

  const to = candidates[0];
  const code = randomOtp();
  const salt = randomSalt();
  const codeHash = await hashOtp(code, salt);
  const ttlMs = OTP_TTL_MS;

  // 4) Gửi mail thật (nếu EmailJS chưa cấu hình, hàm sendEmail trả về skipped)
  const { subject, text, html } = buildOtpEmail({
    toName: user.name,
    otp: code,
    purposeLabel: getPurposeLabel(purpose),
    ttlMinutes: Math.round(ttlMs / 60000)
  });

  const mailResult = await sendEmail({
    to,
    subject,
    text,
    html,
    meta: { toName: user.name, type: 'otp', purpose }
  });

  store[key] = {
    salt,
    codeHash,
    purpose,
    to,
    expiresAt: now + ttlMs,
    attempts: 0,
    lastSentAt: now,
    sendHistory: [...sendHistory, now]
  };
  saveStore(store);

  if (!mailResult.success) {
    // Không gửi được mail nhưng mã vẫn tồn tại cục bộ: trả code để luồng demo không bị chặn.
    return {
      success: false,
      to,
      demoCode: code,
      error: mailResult.error || 'Không gửi được email chứa mã xác thực.'
    };
  }

  return { success: true, to };
}

/**
 * Kiểm tra mã OTP người dùng nhập.
 * Đúng → trả về verification ticket (dùng cho bước tiếp theo) và xóa mã.
 */
export async function verifyOtpCode({ userId, purpose, code }) {
  const store = loadStore();
  const key = recordKey(userId, purpose);
  const rec = store[key];

  if (!rec) {
    return { success: false, error: 'Chưa có mã xác thực nào được gửi. Vui lòng bấm "Gửi mã xác thực".' };
  }
  if (Date.now() > rec.expiresAt) {
    delete store[key];
    saveStore(store);
    return { success: false, error: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.' };
  }
  if (rec.attempts >= OTP_MAX_ATTEMPTS) {
    delete store[key];
    saveStore(store);
    return { success: false, error: 'Bạn đã nhập sai quá số lần cho phép. Mã đã bị hủy, vui lòng gửi lại mã mới.' };
  }

  const clean = String(code || '').replace(/\s+/g, '');
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(clean)) {
    return { success: false, error: `Mã xác thực phải gồm đúng ${OTP_LENGTH} chữ số.` };
  }

  const inputHash = await hashOtp(clean, rec.salt);
  if (inputHash !== rec.codeHash) {
    rec.attempts += 1;
    store[key] = rec;
    saveStore(store);
    const left = OTP_MAX_ATTEMPTS - rec.attempts;
    return {
      success: false,
      attemptsLeft: left,
      error: left > 0
        ? `Mã xác thực không đúng. Bạn còn ${left} lần thử.`
        : 'Bạn đã nhập sai quá số lần cho phép. Mã đã bị hủy, vui lòng gửi lại mã mới.'
    };
  }

  // Thành công → hủy mã, phát hành ticket
  delete store[key];
  saveStore(store);

  return {
    success: true,
    ticket: createVerificationTicket(userId, purpose, rec.to)
  };
}

// ── Verification ticket (dùng 1 lần, 10 phút) ────────────────
function createVerificationTicket(userId, purpose, channel = '') {
  const ticket = `vf_${Date.now()}_${randomSalt().slice(0, 10)}`;
  try {
    sessionStorage.setItem(`doctor4_vf_${userId}_${purpose}`, JSON.stringify({
      ticket,
      purpose,
      channel,
      expiresAt: Date.now() + TICKET_TTL_MS
    }));
  } catch (e) { /* bỏ qua */ }
  return ticket;
}

/** Kiểm tra ticket trước khi cho phép đặt lại mật khẩu / áp dụng thông tin mới. */
export function checkVerificationTicket({ userId, purpose, ticket }) {
  try {
    const raw = sessionStorage.getItem(`doctor4_vf_${userId}_${purpose}`);
    if (!raw) return { success: false, error: 'Phiên xác thực không còn hiệu lực. Vui lòng xác thực OTP lại.' };
    const data = JSON.parse(raw);
    if (data.ticket !== ticket) {
      return { success: false, error: 'Phiên xác thực không hợp lệ. Vui lòng xác thực OTP lại.' };
    }
    if (Date.now() > data.expiresAt) {
      sessionStorage.removeItem(`doctor4_vf_${userId}_${purpose}`);
      return { success: false, error: 'Phiên xác thực đã hết hạn (quá 10 phút). Vui lòng xác thực OTP lại.' };
    }
    return { success: true, channel: data.channel || '' };
  } catch (e) {
    return { success: false, error: 'Phiên xác thực không hợp lệ. Vui lòng xác thực OTP lại.' };
  }
}

/** Dùng xong ticket thì hủy luôn (chống dùng lại). */
export function consumeVerificationTicket({ userId, purpose }) {
  try {
    sessionStorage.removeItem(`doctor4_vf_${userId}_${purpose}`);
  } catch (e) { /* bỏ qua */ }
}

/**
 * Gửi email thông báo cho ĐỊA CHỈ CŨ sau khi đổi email/SĐT thành công
 * (giúp chủ tài khoản phát hiện thay đổi trái phép).
 */
export async function sendProfileChangeNotice({ user, changes = {} }) {
  const to = String(user?.email || '').trim();
  if (!isValidEmail(to)) return { success: false, skipped: true, error: 'Email không hợp lệ.' };

  const { subject, text, html } = buildProfileChangeEmail({
    toName: user.name,
    changes,
    changedAt: new Date().toLocaleString('vi-VN')
  });

  return sendEmail({
    to,
    subject,
    text,
    html,
    meta: { toName: user.name, type: 'profile-change' }
  });
}
