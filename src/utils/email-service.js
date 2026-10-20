/* ============================================================
   src/utils/email-service.js — Doctor4 Eye Clinic
   Gửi Email THẬT về hộp thư Gmail của bệnh nhân (Gmail SMTP)

   Cách hoạt động:
   - Dùng EmailJS REST API (https://api.emailjs.com/api/v1.0/email/send)
     làm cầu nối tới Gmail SMTP (không cần backend riêng).
   - Cấu hình Service ID / Template ID / Public Key trong tab
     Admin → "Cài đặt hệ thống" (được lưu ở localStorage).
   - Mọi lời gọi gửi mail đều có try/catch, KHÔNG bao giờ chặn
     luồng đặt lịch của người dùng nếu mạng/gmail gặp sự cố.
   ============================================================ */

import { buildBookingEmail, buildWelcomeEmail, buildPaymentEmail } from './email-templates.js';

const CONFIG_KEY = 'doctor4_email_config';
const LOG_KEY = 'doctor4_email_log';
const EMAILJS_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';

/**
 * Cấu hình mặc định — người quản trị chỉ cần dán 3 mã lấy từ emailjs.com
 * (xem hướng dẫn ngay trong tab Cài đặt hệ thống của Admin).
 */
const DEFAULT_CONFIG = {
  enabled: true,
  serviceId: '',
  templateId: '',
  publicKey: '',
  fromName: 'Phòng Khám Mắt Doctor4',
  replyTo: 'info@doctor4.vn',
  // Email nội bộ của phòng khám — nhận BẢN SAO mọi thông tin đặt lịch
  clinicEmail: ''
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return EMAIL_REGEX.test(String(email || '').trim());
}

export function getEmailConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) { /* bỏ qua lỗi parse */ }
  return { ...DEFAULT_CONFIG };
}

export function saveEmailConfig(config = {}) {
  const next = { ...getEmailConfig(), ...config };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
  return next;
}

/** Email đã sẵn sàng để gửi thật hay chưa (đã nhập đủ 3 mã EmailJS) */
export function isEmailConfigured() {
  const cfg = getEmailConfig();
  return Boolean(
    cfg.enabled &&
    String(cfg.serviceId || '').trim() &&
    String(cfg.templateId || '').trim() &&
    String(cfg.publicKey || '').trim()
  );
}

/** Lịch sử gửi mail (phục vụ tra cứu / demo) */
export function getEmailLog() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function appendLog(entry) {
  try {
    const log = getEmailLog();
    log.unshift({
      id: 'MAIL-' + Date.now(),
      sentAt: new Date().toISOString(),
      ...entry
    });
    localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(0, 60)));
  } catch (e) { /* bỏ qua */ }
}

/**
 * Gửi 1 email thật qua EmailJS (Gmail SMTP).
 * Trả về { success: boolean, skipped?: boolean, error?: string }
 */
export async function sendEmail({ to, subject, text, html, meta = {} }) {
  const cfg = getEmailConfig();
  const recipient = String(to || '').trim();

  if (!isValidEmail(recipient)) {
    appendLog({ to: recipient, subject, status: 'invalid', error: 'Email không hợp lệ', meta });
    return { success: false, error: 'Email người nhận không hợp lệ.' };
  }

  if (!isEmailConfigured()) {
    appendLog({
      to: recipient,
      subject,
      status: 'skipped',
      error: 'Chưa cấu hình Gmail (EmailJS Service ID / Template ID / Public Key)',
      meta
    });
    return {
      success: false,
      skipped: true,
      error: 'Hệ thống chưa cấu hình Gmail gửi thư. Vào Admin → Cài đặt hệ thống để nhập Service ID / Template ID / Public Key.'
    };
  }

  const payload = {
    service_id: cfg.serviceId,
    template_id: cfg.templateId,
    user_id: cfg.publicKey,
    template_params: {
      to_email: recipient,
      to_name: meta.toName || recipient,
      from_name: cfg.fromName,
      reply_to: cfg.replyTo,
      subject,
      message: text,
      message_html: html || text,
      // Các trường tiện dụng cho template EmailJS ({{...}})
      patient_name: meta.toName || '',
      appointment_id: meta.appointmentId || '',
      queue_number: meta.queueNumber || '',
      doctor_name: meta.doctorName || '',
      room_name: meta.roomName || '',
      service_name: meta.serviceName || '',
      appointment_date: meta.date || '',
      appointment_time: meta.timeSlot || '',
      exam_fee: meta.examFee || '',
      patient_phone: meta.phone || '',
      patient_dob: meta.dob || '',
      patient_gender: meta.gender || '',
      patient_cccd: meta.cccd || '',
      patient_address: meta.address || '',
      patient_bhyt: meta.bhyt || '',
      payment_note: meta.paymentNote || ''
    }
  };

  try {
    const res = await fetch(EMAILJS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const bodyText = await res.text().catch(() => '');

    if (!res.ok) {
      const err = `Gmail/EmailJS trả về lỗi ${res.status}${bodyText ? ': ' + bodyText : ''}`;
      appendLog({ to: recipient, subject, status: 'failed', error: err, meta });
      return { success: false, error: err };
    }

    appendLog({ to: recipient, subject, status: 'sent', error: '', meta });
    return { success: true };
  } catch (err) {
    const message = err?.message || 'Không kết nối được máy chủ gửi mail';
    appendLog({ to: recipient, subject, status: 'failed', error: message, meta });
    return { success: false, error: message };
  }
}

/**
 * Gửi mail XÁC NHẬN ĐẶT LỊCH KHÁM về Gmail bệnh nhân
 * (được gọi ngay sau khi người dùng bấm "XÁC NHẬN ĐẶT LỊCH KHÁM")
 */
export async function sendBookingConfirmationEmail(app, serviceInfo = null) {
  const to = app?.patientEmail || '';
  if (!isValidEmail(to)) {
    return {
      success: false,
      skipped: true,
      error: 'Bệnh nhân chưa cung cấp email hợp lệ nên không thể gửi mail xác nhận.'
    };
  }

  const { subject, text, html } = buildBookingEmail(app, serviceInfo);
  const profile = app.patientProfile || {};

  const meta = {
    toName: app.patientName,
    appointmentId: app.id,
    queueNumber: app.queueNumber || app.stt,
    doctorName: app.doctorName,
    roomName: app.roomName,
    serviceName: app.serviceName,
    date: app.date,
    timeSlot: app.timeSlot,
    examFee: app.examFee,
    phone: app.patientPhone,
    dob: profile.dob || '',
    gender: profile.gender || '',
    cccd: profile.cccdNumber || '',
    address: profile.address || '',
    bhyt: profile.bhytCode || '',
    type: 'booking-confirmation'
  };

  const result = await sendEmail({ to, subject, text, html, meta });

  // ── Gửi BẢN SAO thông tin đặt lịch về hộp thư của phòng khám ──
  const clinicEmail = String(getEmailConfig().clinicEmail || '').trim();
  if (result.success && isValidEmail(clinicEmail) && clinicEmail.toLowerCase() !== to.toLowerCase()) {
    await sendEmail({
      to: clinicEmail,
      subject: `[Bản sao] ${subject}`,
      text: `Bản sao thông tin đặt lịch vừa được gửi tới bệnh nhân ${to}.\n\n` + text,
      html,
      meta: { ...meta, type: 'booking-clinic-copy' }
    });
  }

  return result;
}

/** Gửi mail chào mừng sau khi bệnh nhân đăng ký tài khoản */
export async function sendWelcomeEmail(user = {}) {
  const to = user.email || '';
  if (!isValidEmail(to)) {
    return { success: false, skipped: true, error: 'Email không hợp lệ.' };
  }

  const { subject, text, html } = buildWelcomeEmail(user);
  return sendEmail({
    to,
    subject,
    text,
    html,
    meta: { toName: user.name, type: 'welcome' }
  });
}

/** Gửi mail thông báo viện phí / đơn thuốc đã sẵn sàng thanh toán */
export async function sendPaymentNoticeEmail(app = {}, invoice = null) {
  const to = app.patientEmail || '';
  if (!isValidEmail(to)) {
    return { success: false, skipped: true, error: 'Email không hợp lệ.' };
  }

  const { subject, text, html } = buildPaymentEmail(app, invoice);
  return sendEmail({
    to,
    subject,
    text,
    html,
    meta: {
      toName: app.patientName,
      appointmentId: app.id,
      type: 'payment-notice'
    }
  });
}

/** Gửi mail thử nghiệm để kiểm tra kết nối Gmail trong tab Cài đặt hệ thống */
export async function sendTestEmail(to) {
  const recipient = String(to || '').trim();
  if (!isValidEmail(recipient)) {
    return { success: false, error: 'Vui lòng nhập một địa chỉ Gmail hợp lệ.' };
  }

  return sendEmail({
    to: recipient,
    subject: '[Doctor4 Eye Clinic] Kiểm tra kết nối Gmail thành công',
    text:
      'Xin chào,\n\n' +
      'Đây là email kiểm tra từ hệ thống Phòng Khám Mắt Doctor4.\n' +
      'Nếu bạn nhận được thư này, cấu hình Gmail SMTP (EmailJS) đã hoạt động chính xác và ' +
      'hệ thống sẽ tự động gửi thông tin đặt lịch khám đến hộp thư bệnh nhân.\n\n' +
      'Trân trọng,\nPhòng Khám Mắt Doctor4',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff;padding:20px 24px;">
          <h2 style="margin:0;font-size:20px;">👁️ Doctor4 Eye Clinic</h2>
          <div style="font-size:13px;opacity:.9;margin-top:4px;">Kiểm tra kết nối Gmail</div>
        </div>
        <div style="padding:22px 24px;color:#0f172a;font-size:14px;line-height:1.7;">
          <p>Xin chào,</p>
          <p>Đây là email kiểm tra từ hệ thống <strong>Phòng Khám Mắt Doctor4</strong>.</p>
          <p>Nếu bạn nhận được thư này, cấu hình <strong>Gmail SMTP (EmailJS)</strong> đã hoạt động chính xác và
          hệ thống sẽ tự động gửi thông tin đặt lịch khám đến hộp thư bệnh nhân.</p>
          <p style="margin-top:18px;">Trân trọng,<br/><strong>Phòng Khám Mắt Doctor4</strong></p>
        </div>
      </div>
    `,
    meta: { toName: recipient, type: 'test' }
  });
}

/* ============================================================
   MỞ ỨNG DỤNG GMAIL SOẠN SẴN THƯ (PHƯƠNG ÁN DỰ PHÒNG)
   Dùng khi chưa cấu hình EmailJS hoặc gửi tự động thất bại.
   ============================================================ */
function toBase64Utf8(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function buildGmailComposeUrl({ to, subject, text }) {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to,
    su: subject,
    body: text
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function openGmailCompose({ to, subject, text }) {
  const url = buildGmailComposeUrl({ to, subject, text });
  const win = window.open(url, '_blank');
  if (!win) {
    // Popup bị chặn → dùng thẻ <a> tải xuống
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  return url;
}

export function openMailtoCompose({ to, subject, text }) {
  const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  window.location.href = href;
  return href;
}

/**
 * Gửi mail đặt lịch + TỰ ĐỘNG dự phòng:
 *  - Nếu EmailJS chưa cấu hình / gửi lỗi → mở sẵn thư trong Gmail để bệnh nhân bấm Gửi.
 * Trả về { success, skipped, fallback, error }
 */
export async function sendBookingEmailWithFallback(app, serviceInfo = null) {
  const result = await sendBookingConfirmationEmail(app, serviceInfo);

  if (result.success) {
    return { ...result, fallback: false };
  }

  const to = app?.patientEmail || '';
  if (!isValidEmail(to)) {
    return { ...result, fallback: false };
  }

  const { subject, text } = buildBookingEmail(app, serviceInfo);
  openGmailCompose({ to, subject, text });
  return { ...result, fallback: true };
}
