/* ============================================================
   src/utils/email-templates.js — Doctor4 Eye Clinic
   Khuôn mẫu nội dung Email gửi về Gmail bệnh nhân
   ============================================================ */

const CLINIC = {
  name: 'Phòng Khám Mắt Doctor4 Eye Clinic',
  hotline: '1800 1234',
  address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
  email: 'info@doctor4.vn',
  website: 'https://doctor4.vn'
};

function money(value) {
  const n = Number(value || 0);
  if (!n) return '0đ';
  return n.toLocaleString('vi-VN') + 'đ';
}

function formatQueue(num) {
  const n = parseInt(num, 10);
  if (isNaN(n) || n <= 0) return '01';
  return String(n).padStart(2, '0');
}

function formatDateVi(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return String(dateStr);
}

function escapeHtml(text) {
  return String(text === null || text === undefined ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ── Khung HTML chung cho mọi email ─────────────────────────── */
function emailShell({ title, subtitle, accent = '#0284c7', bodyHtml }) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;padding:24px 12px;">
    <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

      <div style="background:linear-gradient(135deg,#0284c7,#2563eb);color:#ffffff;padding:24px 28px;">
        <div style="font-size:22px;font-weight:800;letter-spacing:.3px;">👁️ Doctor4 Eye Clinic</div>
        <div style="font-size:13px;opacity:.9;margin-top:6px;">${escapeHtml(CLINIC.name)}</div>
      </div>

      <div style="padding:26px 28px;color:#0f172a;font-size:14px;line-height:1.7;">
        <h2 style="margin:0 0 4px;font-size:20px;color:${accent};">${title}</h2>
        <div style="color:#64748b;font-size:13px;margin-bottom:18px;">${subtitle}</div>
        ${bodyHtml}
      </div>

      <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 28px;font-size:12px;color:#64748b;line-height:1.7;">
        <div><strong>${escapeHtml(CLINIC.name)}</strong></div>
        <div>📍 ${escapeHtml(CLINIC.address)}</div>
        <div>☎️ Hotline: <strong>${CLINIC.hotline}</strong> — ✉️ ${CLINIC.email}</div>
        <div>🕐 Thứ Hai – Chủ Nhật: 7:00 – 20:00</div>
        <div style="margin-top:8px;color:#94a3b8;">Email này được gửi tự động từ hệ thống đặt lịch trực tuyến Doctor4. Vui lòng không trả lời trực tiếp email này.</div>
      </div>
    </div>
  </div>`;
}

/* ── Bảng thông tin 2 cột ───────────────────────────────────── */
function infoRow(label, value) {
  return `
    <tr>
      <td style="padding:8px 0;color:#64748b;width:180px;vertical-align:top;">${label}</td>
      <td style="padding:8px 0;color:#0f172a;font-weight:700;">${value}</td>
    </tr>`;
}

/* ============================================================
   1. EMAIL XÁC NHẬN ĐẶT LỊCH KHÁM
   ============================================================ */
export function buildBookingEmail(app = {}, serviceInfo = null) {
  const stt = formatQueue(app.queueNumber || app.stt || 1);
  const patientName = app.patientName || 'Quý khách';
  const dateVi = formatDateVi(app.date);
  const examFee = Number(app.examFee || 0);
  const prepaidDesc = app.prepaidDesc || 'Phí khám ban đầu';
  const postpaidDesc = app.postpaidDesc || 'Chi phí điều trị phát sinh';
  const profile = app.patientProfile || {};
  const dob = formatDateVi(profile.dob);

  // Các dòng hồ sơ bệnh nhân (chỉ hiển thị khi có dữ liệu)
  const profileTextLines = [];
  const profileHtmlRows = [];
  if (dob) {
    profileTextLines.push(`- Ngày sinh       : ${dob}`);
    profileHtmlRows.push(infoRow('🎂 Ngày sinh', escapeHtml(dob)));
  }
  if (profile.gender) {
    profileTextLines.push(`- Giới tính       : ${profile.gender}`);
    profileHtmlRows.push(infoRow('⚧ Giới tính', escapeHtml(profile.gender)));
  }
  if (profile.cccdNumber) {
    profileTextLines.push(`- CCCD/CMND       : ${profile.cccdNumber}`);
    profileHtmlRows.push(infoRow('🪪 CCCD/CMND', escapeHtml(profile.cccdNumber)));
  }
  if (profile.address) {
    profileTextLines.push(`- Địa chỉ         : ${profile.address}`);
    profileHtmlRows.push(infoRow('📍 Địa chỉ', escapeHtml(profile.address)));
  }
  if (profile.bhytCode) {
    profileTextLines.push(`- Mã BHYT         : ${profile.bhytCode}`);
    profileHtmlRows.push(infoRow('💊 Mã BHYT', escapeHtml(profile.bhytCode)));
  }

  const subject = `[Doctor4] Xác nhận đặt lịch khám - Mã ${app.id || ''} - STT #${stt}`;

  const text = [
    `Xin chào ${patientName},`,
    ``,
    `Phòng Khám Mắt Doctor4 đã TIẾP NHẬN ca đặt lịch khám của quý khách. Thông tin chi tiết như sau:`,
    ``,
    `- Mã lịch hẹn     : ${app.id || ''}`,
    `- Số thứ tự (STT) : #${stt}`,
    `- Bệnh nhân       : ${patientName}`,
    `- Số điện thoại   : ${app.patientPhone || ''}`,
    ...profileTextLines,
    `- Dịch vụ khám    : ${app.serviceName || ''}`,
    `- Bác sĩ phụ trách: ${app.doctorName || ''}`,
    `- Phòng khám      : ${app.roomName || ''}`,
    `- Thời gian khám  : ${app.timeSlot || ''} — Ngày ${dateVi}`,
    `- Triệu chứng ghi chú: ${app.symptoms || 'Khám mắt định kỳ theo yêu cầu'}`,
    ``,
    `Chi phí:`,
    `- ${prepaidDesc}: ${money(examFee)}`,
    `- ${postpaidDesc}: Hiển thị sau khi Bác sĩ kê đơn`,
    ``,
    `Quý khách vui lòng đến đúng giờ tại phòng khám được chỉ định và xuất trình mã lịch hẹn ${app.id || ''} (hoặc số điện thoại đăng ký) tại quầy tiếp đón.`,
    `Số tiền viện phí và đơn thuốc sẽ được hiển thị để quý khách thanh toán sau khi Bác sĩ hoàn thành kê đơn.`,
    ``,
    `Mọi thay đổi về lịch khám, quý khách vui lòng liên hệ hotline ${CLINIC.hotline}.`,
    ``,
    `Trân trọng,`,
    CLINIC.name,
    `📍 ${CLINIC.address}`,
    `☎️ ${CLINIC.hotline} — ✉️ ${CLINIC.email}`
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 14px;">Xin chào <strong>${escapeHtml(patientName)}</strong>,</p>
    <p style="margin:0 0 16px;">Phòng Khám Mắt Doctor4 đã <strong style="color:#16a34a;">tiếp nhận</strong> ca đặt lịch khám của quý khách. Dưới đây là thông tin chi tiết:</p>

    <div style="background:#eff6ff;border:2px dashed #2563eb;border-radius:14px;padding:16px;text-align:center;margin-bottom:18px;">
      <div style="font-size:11px;font-weight:800;color:#1e40af;letter-spacing:1px;text-transform:uppercase;">🎟️ Số thứ tự khám của quý khách</div>
      <div style="font-size:38px;font-weight:900;color:#1d4ed8;line-height:1.2;margin:6px 0;">STT #${stt}</div>
      <div style="font-size:12.5px;color:#1e3a8a;">Khung giờ ${escapeHtml(app.timeSlot || '')} — Ngày ${escapeHtml(dateVi)}</div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:13.5px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
      <tbody style="display:table;width:100%;padding:6px 16px;box-sizing:border-box;">
        ${infoRow('🔖 Mã lịch hẹn', escapeHtml(app.id || ''))}
        ${infoRow('🔢 Số thứ tự (STT)', 'STT #' + stt)}
        ${infoRow('👤 Bệnh nhân', escapeHtml(patientName))}
        ${infoRow('📞 Số điện thoại', escapeHtml(app.patientPhone || ''))}
        ${profileHtmlRows.join('')}
        ${infoRow('🎯 Dịch vụ khám', escapeHtml(app.serviceName || ''))}
        ${infoRow('👨‍⚕️ Bác sĩ phụ trách', escapeHtml(app.doctorName || ''))}
        ${infoRow('🏥 Phòng khám', escapeHtml(app.roomName || ''))}
        ${infoRow('📅 Thời gian khám', `<span style="color:#d97706;">${escapeHtml(app.timeSlot || '')} — Ngày ${escapeHtml(dateVi)}</span>`)}
        ${infoRow('💬 Triệu chứng', escapeHtml(app.symptoms || 'Khám mắt định kỳ theo yêu cầu'))}
        ${infoRow('💳 ' + escapeHtml(prepaidDesc), `<span style="color:#0369a1;">${money(examFee)}</span>`)}
        ${infoRow('🧾 ' + escapeHtml(postpaidDesc), 'Hiển thị sau khi Bác sĩ kê đơn')}
      </tbody>
    </table>

    <div style="background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:12px;padding:14px 16px;margin-top:18px;font-size:12.5px;color:#0369a1;line-height:1.7;">
      <strong>📌 Lưu ý quan trọng:</strong><br/>
      • Quý khách vui lòng đến <strong>đúng giờ</strong> tại phòng khám được chỉ định và xuất trình <strong>mã lịch hẹn ${escapeHtml(app.id || '')}</strong>.<br/>
      • <strong>Số tiền viện phí và đơn thuốc</strong> sẽ hiển thị để thanh toán <strong>sau khi Bác sĩ hoàn thành kê đơn</strong>.<br/>
      • Cần đổi lịch hoặc hỗ trợ? Gọi hotline <strong>${CLINIC.hotline}</strong> (miễn phí, 7:00 – 21:00).
    </div>

    <p style="margin:20px 0 0;">Trân trọng,<br/><strong>${escapeHtml(CLINIC.name)}</strong></p>
  `;

  return {
    subject,
    text,
    html: emailShell({
      title: '✅ Đặt lịch khám thành công',
      subtitle: `Mã lịch hẹn <strong>${escapeHtml(app.id || '')}</strong> — Số thứ tự <strong>#${stt}</strong>`,
      bodyHtml
    })
  };
}

/* ============================================================
   2. EMAIL CHÀO MỪNG ĐĂNG KÝ TÀI KHOẢN
   ============================================================ */
export function buildWelcomeEmail(user = {}) {
  const name = user.name || 'Quý khách';
  const subject = `[Doctor4] Đăng ký tài khoản thành công - Chào mừng ${name}`;

  const text = [
    `Xin chào ${name},`,
    ``,
    `Tài khoản bệnh nhân trực tuyến của quý khách tại Phòng Khám Mắt Doctor4 đã được tạo thành công.`,
    ``,
    `- Họ và tên : ${name}`,
    `- Email     : ${user.email || ''}`,
    `- Điện thoại: ${user.phone || ''}`,
    ``,
    `Quý khách có thể đăng nhập tại ${CLINIC.website} để:`,
    `• Đặt lịch khám online và nhận số thứ tự (STT) ngay`,
    `• Cập nhật hồ sơ bệnh nhân, ảnh thẻ 4x6 và CCCD 2 mặt`,
    `• Tra cứu phòng khám, vé khám, bệnh án và đơn thuốc`,
    ``,
    `Ưu đãi thành viên mới: Giảm ngay 30% chi phí khám tổng quát cho lần khám đầu tiên.`,
    ``,
    `Trân trọng,`,
    CLINIC.name,
    `☎️ ${CLINIC.hotline} — ✉️ ${CLINIC.email}`
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 14px;">Xin chào <strong>${escapeHtml(name)}</strong>,</p>
    <p style="margin:0 0 16px;">Tài khoản bệnh nhân trực tuyến của quý khách tại <strong>Phòng Khám Mắt Doctor4</strong> đã được tạo thành công. 🎉</p>

    <table style="width:100%;border-collapse:collapse;font-size:13.5px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
      <tbody style="display:table;width:100%;padding:6px 16px;box-sizing:border-box;">
        ${infoRow('👤 Họ và tên', escapeHtml(name))}
        ${infoRow('✉️ Email', escapeHtml(user.email || ''))}
        ${infoRow('📞 Điện thoại', escapeHtml(user.phone || ''))}
      </tbody>
    </table>

    <div style="background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:12px;padding:14px 16px;margin-top:18px;font-size:12.5px;color:#0369a1;line-height:1.8;">
      <strong>🎁 Quyền lợi thành viên Doctor4:</strong><br/>
      • Đặt lịch khám online và nhận <strong>số thứ tự (STT)</strong> ngay lập tức<br/>
      • Cập nhật hồ sơ bệnh nhân, ảnh thẻ 4x6 và CCCD 2 mặt<br/>
      • Tra cứu phòng khám, vé khám, bệnh án và đơn thuốc điện tử<br/>
      • Giảm ngay <strong>30%</strong> chi phí khám tổng quát cho lần khám đầu tiên
    </div>

    <p style="margin:20px 0 0;">Trân trọng,<br/><strong>${escapeHtml(CLINIC.name)}</strong></p>
  `;

  return {
    subject,
    text,
    html: emailShell({
      title: '🎉 Đăng ký tài khoản thành công',
      subtitle: 'Hồ sơ bệnh nhân trực tuyến của quý khách đã sẵn sàng sử dụng',
      accent: '#16a34a',
      bodyHtml
    })
  };
}

/* ============================================================
   3. EMAIL THÔNG BÁO VIỆN PHÍ / ĐƠN THUỐC ĐÃ SẴN SÀNG THANH TOÁN
   ============================================================ */
export function buildPaymentEmail(app = {}, invoice = null) {
  const inv = invoice || app.medicalRecord || {};
  const patientName = app.patientName || 'Quý khách';
  const totalAmount = Number(inv.totalAmount ?? app.billing?.totalAmount ?? app.examFee ?? 0);

  const prescriptions = Array.isArray(inv.prescriptions)
    ? inv.prescriptions
    : (Array.isArray(inv.prescription) ? inv.prescription : []);

  const subject = `[Doctor4] Viện phí & đơn thuốc của ca khám ${app.id || ''}`;

  const drugLines = prescriptions.map((d, i) => {
    const qty = Number(d.quantity || 1);
    const price = Number(d.price || 0);
    const amount = Number(d.amount) || qty * price;
    return `${i + 1}. ${d.name} — SL ${qty} — ${money(amount)}${d.dosage ? ' — ' + d.dosage : ''}`;
  });

  const text = [
    `Xin chào ${patientName},`,
    ``,
    `Bác sĩ đã hoàn tất ca khám và kê đơn thuốc cho quý khách tại Phòng Khám Mắt Doctor4.`,
    ``,
    `- Mã lịch hẹn  : ${app.id || ''}`,
    `- Bác sĩ       : ${app.doctorName || ''}`,
    `- Ngày khám    : ${formatDateVi(app.date)} (${app.timeSlot || ''})`,
    `- Chẩn đoán    : ${inv.diagnosis || 'Theo kết luận của Bác sĩ'}`,
    ``,
    `Đơn thuốc:`,
    ...(drugLines.length ? drugLines : ['(Không có thuốc kê thêm)']),
    ``,
    `TỔNG VIỆN PHÍ CẦN THANH TOÁN: ${money(totalAmount)}`,
    ``,
    `Quý khách có thể thanh toán bằng VietQR hoặc tại quầy thu ngân của phòng khám.`,
    ``,
    `Trân trọng,`,
    CLINIC.name
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 14px;">Xin chào <strong>${escapeHtml(patientName)}</strong>,</p>
    <p style="margin:0 0 16px;">Bác sĩ đã hoàn tất ca khám và kê đơn thuốc cho quý khách tại <strong>Phòng Khám Mắt Doctor4</strong>.</p>

    <table style="width:100%;border-collapse:collapse;font-size:13.5px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
      <tbody style="display:table;width:100%;padding:6px 16px;box-sizing:border-box;">
        ${infoRow('🔖 Mã lịch hẹn', escapeHtml(app.id || ''))}
        ${infoRow('👨‍⚕️ Bác sĩ', escapeHtml(app.doctorName || ''))}
        ${infoRow('📅 Ngày khám', `${escapeHtml(formatDateVi(app.date))} (${escapeHtml(app.timeSlot || '')})`)}
        ${infoRow('🩺 Chẩn đoán', escapeHtml(inv.diagnosis || 'Theo kết luận của Bác sĩ'))}
      </tbody>
    </table>

    <div style="margin-top:16px;">
      <div style="font-weight:800;color:#0369a1;margin-bottom:8px;">💊 Đơn thuốc điều trị</div>
      ${drugLines.length ? `
        <ul style="margin:0;padding-left:20px;font-size:13px;color:#0f172a;line-height:1.9;">
          ${drugLines.map(l => `<li>${escapeHtml(l.replace(/^\d+\.\s*/, ''))}</li>`).join('')}
        </ul>` : `<div style="font-size:13px;color:#64748b;">(Không có thuốc kê thêm)</div>`}
    </div>

    <div style="background:#fff7ed;border:2px solid #f59e0b;border-radius:12px;padding:16px;margin-top:18px;text-align:center;">
      <div style="font-size:12px;font-weight:800;color:#92400e;text-transform:uppercase;letter-spacing:1px;">Tổng viện phí cần thanh toán</div>
      <div style="font-size:28px;font-weight:900;color:#b45309;margin-top:4px;">${money(totalAmount)}</div>
      <div style="font-size:12px;color:#92400e;margin-top:6px;">Thanh toán bằng VietQR hoặc tại quầy thu ngân</div>
    </div>

    <p style="margin:20px 0 0;">Trân trọng,<br/><strong>${escapeHtml(CLINIC.name)}</strong></p>
  `;

  return {
    subject,
    text,
    html: emailShell({
      title: '💳 Viện phí & đơn thuốc đã sẵn sàng',
      subtitle: `Mã lịch hẹn <strong>${escapeHtml(app.id || '')}</strong>`,
      accent: '#d97706',
      bodyHtml
    })
  };
}

/* ============================================================
   4. EMAIL MÃ XÁC THỰC OTP (quên mật khẩu / đổi email / đổi SĐT)
   ============================================================ */
export function buildOtpEmail({ toName = 'Quý khách', otp = '', purposeLabel = 'xác thực tài khoản', ttlMinutes = 5 } = {}) {
  const safeName = escapeHtml(toName);
  const safeOtp = escapeHtml(otp);
  const subject = `[Doctor4] Mã xác thực ${otp} — ${purposeLabel}`;

  const text = [
    `Xin chào ${toName},`,
    ``,
    `Mã xác thực (OTP) để ${purposeLabel} tài khoản Doctor4 của quý khách là: ${otp}`,
    ``,
    `- Mã có hiệu lực trong ${ttlMinutes} phút và chỉ sử dụng được 1 lần.`,
    `- Tuyệt đối KHÔNG chia sẻ mã này cho bất kỳ ai, kể cả người tự xưng là nhân viên Doctor4.`,
    `- Nếu quý khách không thực hiện yêu cầu này, hãy bỏ qua email và đổi mật khẩu ngay.`,
    ``,
    `Trân trọng,`,
    CLINIC.name
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 14px;">Xin chào <strong>${safeName}</strong>,</p>
    <p style="margin:0 0 12px;">Bạn vừa yêu cầu <strong>${escapeHtml(purposeLabel)}</strong> cho tài khoản Doctor4.</p>

    <div style="background:#eff6ff;border:2px dashed #0284c7;border-radius:12px;padding:18px;margin:18px 0;text-align:center;">
      <div style="font-size:12px;font-weight:800;color:#0369a1;text-transform:uppercase;letter-spacing:1px;">Mã xác thực (OTP)</div>
      <div style="font-size:34px;font-weight:900;color:#0f172a;letter-spacing:10px;margin:6px 0 2px;font-family:'Courier New',monospace;">${safeOtp}</div>
      <div style="font-size:12px;color:#64748b;">Có hiệu lực ${ttlMinutes} phút — chỉ dùng 1 lần</div>
    </div>

    <ul style="margin:0;padding-left:20px;font-size:13px;color:#334155;line-height:1.9;">
      <li>Không chia sẻ mã này cho bất kỳ ai.</li>
      <li>Doctor4 <strong>không bao giờ</strong> gọi điện yêu cầu bạn đọc mã OTP.</li>
      <li>Nếu không phải bạn thực hiện, hãy bỏ qua email này và liên hệ hotline ${CLINIC.hotline}.</li>
    </ul>

    <p style="margin:20px 0 0;">Trân trọng,<br/><strong>${escapeHtml(CLINIC.name)}</strong></p>
  `;

  return {
    subject,
    text,
    html: emailShell({
      title: '🔐 Mã xác thực tài khoản',
      subtitle: `Yêu cầu: <strong>${escapeHtml(purposeLabel)}</strong>`,
      accent: '#0284c7',
      bodyHtml
    })
  };
}

/* ============================================================
   5. EMAIL THÔNG BÁO TÀI KHOẢN VỪA ĐỔI EMAIL / SỐ ĐIỆN THOẠI
   (gửi tới địa chỉ CŨ để chủ tài khoản kịp phát hiện)
   ============================================================ */
export function buildProfileChangeEmail({ toName = 'Quý khách', changes = {}, changedAt = '' } = {}) {
  const safeName = escapeHtml(toName);
  const emailLine = changes.email ? `${changes.email.from} → ${changes.email.to}` : null;
  const phoneLine = changes.phone ? `${changes.phone.from} → ${changes.phone.to}` : null;

  const subject = '[Doctor4] Thông báo: thông tin liên hệ tài khoản của bạn vừa thay đổi';

  const text = [
    `Xin chào ${toName},`,
    ``,
    `Tài khoản Doctor4 của quý khách vừa được thay đổi thông tin liên hệ lúc ${changedAt}:`,
    ...(emailLine ? [`- Email       : ${emailLine}`] : []),
    ...(phoneLine ? [`- Điện thoại  : ${phoneLine}`] : []),
    ``,
    `Nếu chính quý khách thực hiện, không cần làm gì thêm.`,
    `Nếu KHÔNG phải quý khách, hãy ngay lập tức đổi mật khẩu và gọi hotline ${CLINIC.hotline}.`,
    ``,
    `Trân trọng,`,
    CLINIC.name
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 14px;">Xin chào <strong>${safeName}</strong>,</p>
    <p style="margin:0 0 16px;">Thông tin liên hệ của tài khoản Doctor4 vừa được thay đổi vào lúc <strong>${escapeHtml(changedAt)}</strong>:</p>

    <table style="width:100%;border-collapse:collapse;font-size:13.5px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
      <tbody style="display:table;width:100%;padding:6px 16px;box-sizing:border-box;">
        ${emailLine ? infoRow('✉️ Email', escapeHtml(emailLine)) : ''}
        ${phoneLine ? infoRow('📞 Số điện thoại', escapeHtml(phoneLine)) : ''}
      </tbody>
    </table>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:14px;margin-top:16px;font-size:13px;color:#991b1b;">
      <strong>Không phải bạn thực hiện?</strong> Hãy đổi mật khẩu ngay và gọi hotline <strong>${CLINIC.hotline}</strong> để phòng khám khóa tài khoản tạm thời.
    </div>

    <p style="margin:20px 0 0;">Trân trọng,<br/><strong>${escapeHtml(CLINIC.name)}</strong></p>
  `;

  return {
    subject,
    text,
    html: emailShell({
      title: '🛡️ Thông tin tài khoản vừa thay đổi',
      subtitle: 'Email thông báo bảo mật tự động từ Doctor4',
      accent: '#dc2626',
      bodyHtml
    })
  };
}
