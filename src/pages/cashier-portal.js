/* ============================================================
   src/pages/cashier-portal.js — Doctor4 Eye Clinic
   Cổng Thu Ngân: Nhận hóa đơn từ Bác Sĩ & Thu Viện Phí
   ============================================================ */

/* ── STORAGE KEYS ── */
const INVOICES_KEY     = 'doctor4_invoices_db';
const APPOINTMENTS_KEY = 'doctor4_appointments_db';
const PAYMENTS_KEY     = 'payments';
const SESSION_KEY      = 'doctor4_session';

/* ── CẤU HÌNH TÀI KHOẢN NHẬN TIỀN (VietQR) ── */
const CASHIER_BANK_ID      = 'MB';
const CASHIER_BANK_ACCOUNT = '0123456789';
const CASHIER_BANK_NAME    = 'PHONG KHAM MAT DOCTOR4';
const CASHIER_BANK_LABEL   = 'MB Bank (Ngân hàng TMCP Quân đội)';

/* ── CASHIER SESSION ── */
let currentCashier = null;

function getCashierSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (!user) return null;
    if (user.email === 'thungan@doctor4.vn') {
      user.role = 'cashier';
    }
    return (user.role === 'cashier' || user.role === 'admin') ? user : null;
  } catch { return null; }
}

/* ── SAMPLE DEMO INVOICES ── */
const SAMPLE_INVOICES = [
  {
    id: 'HD-2026-1082',
    appointmentId: 'app_demo_001',
    patientName: 'Trần Văn Hoàng',
    patientPhone: '0912 345 678',
    patientGender: 'Nam',
    patientAge: '45 tuổi',
    doctorId: 'doc_1',
    doctorName: 'BS. CKII Nguyễn Minh Quân',
    roomId: 'r101',
    roomName: 'Phòng 101 - Khám Mắt Tổng Quát',
    serviceName: 'Khám khúc xạ & Đáy mắt chuyên sâu',
    diagnosis: 'Cận thị tiến triển kèm khô mắt mức độ trung bình (H52.1)',
    advice: 'Tra nước mắt nhân tạo 4 lần/ngày, giảm thời gian nhìn màn hình, tái khám sau 3 tháng.',
    revisitDate: '2026-12-20',
    prescriptions: [
      { name: 'Systane Ultra (Lọ 10ml)', type: 'Thuốc nhỏ mắt', quantity: 2, dosage: 'Nhỏ 1 giọt/mắt x 4 lần/ngày', price: 95000, amount: 190000 },
      { name: 'Vismed 0.18% (Hộp 20 ống)', type: 'Nước mắt nhân tạo', quantity: 1, dosage: 'Nhỏ 1 ống/ngày', price: 180000, amount: 180000 },
      { name: 'Nutrof Total (Hộp 30 viên)', type: 'Bổ mắt chống oxy hóa', quantity: 1, dosage: 'Uống 1 viên sau ăn sáng', price: 320000, amount: 320000 }
    ],
    examFee: 250000,
    medicineFee: 690000,
    serviceFee: 150000,
    discount: 50000,
    totalAmount: 1040000,
    status: 'pending',
    sentAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    paidAt: null,
    cashierName: null,
    paymentMethod: null
  },
  {
    id: 'HD-2026-1083',
    appointmentId: 'app_demo_002',
    patientName: 'Lê Thị Thu Thủy',
    patientPhone: '0988 776 655',
    patientGender: 'Nữ',
    patientAge: '32 tuổi',
    doctorId: 'doc_2',
    doctorName: 'BS. CKI Đỗ Phương Thảo',
    roomId: 'r102',
    roomName: 'Phòng 102 - Phẫu Thuật Khúc Xạ LASIK',
    serviceName: 'Khảo sát bề mặt giác mạc & Tư vấn Femto-LASIK',
    diagnosis: 'Cận loạn thị cao hai mắt (OD: -5.50 -1.25 x 180, OS: -5.00 -1.00 x 175)',
    advice: 'Giác mạc đủ điều kiện mổ Femto-LASIK, kiêng đeo kính áp tròng mềm 7 ngày trước mổ.',
    revisitDate: '2026-10-25',
    prescriptions: [
      { name: 'Cravis 0.5% (Lọ 5ml)', type: 'Kháng sinh nhỏ mắt', quantity: 1, dosage: 'Nhỏ 1 giọt x 3 lần/ngày', price: 85000, amount: 85000 },
      { name: 'Sanlein 0.1% (Lọ 5ml)', type: 'Dưỡng ẩm giác mạc', quantity: 2, dosage: 'Nhỏ 1 giọt x 4 lần/ngày', price: 72000, amount: 144000 }
    ],
    examFee: 350000,
    medicineFee: 229000,
    serviceFee: 300000,
    discount: 100000,
    totalAmount: 779000,
    status: 'pending',
    sentAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    paidAt: null,
    cashierName: null,
    paymentMethod: null
  },
  {
    id: 'HD-2026-1081',
    appointmentId: 'app_demo_003',
    patientName: 'Phạm Minh Đức',
    patientPhone: '0903 112 233',
    patientGender: 'Nam',
    patientAge: '58 tuổi',
    doctorId: 'doc_4',
    doctorName: 'ThS. BS Lê Hoàng Phúc',
    roomId: 'r104',
    roomName: 'Phòng 104 - Đục Thủy Tinh Thể (Phaco)',
    serviceName: 'Đo nhãn áp & Soi góc tiền phòng',
    diagnosis: 'Đục thủy tinh thể độ II hai mắt, nhãn áp trong giới hạn bình thường',
    advice: 'Theo dõi tiến triển 6 tháng/lần, đeo kính râm khi ra nắng.',
    revisitDate: '2027-04-10',
    prescriptions: [
      { name: 'Phacolin (Lọ 10ml)', type: 'Thuốc làm chậm đục TTT', quantity: 2, dosage: 'Nhỏ 1 giọt x 3 lần/ngày', price: 110000, amount: 220000 }
    ],
    examFee: 250000,
    medicineFee: 220000,
    serviceFee: 100000,
    discount: 0,
    totalAmount: 570000,
    status: 'paid',
    sentAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    paidAt: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
    cashierName: 'Nguyễn Mai Anh (Thu Ngân)',
    paymentMethod: 'Chuyển khoản ngân hàng'
  }
];

/* ── INVOICE MANAGER ── */
function getInvoices() {
  try {
    const raw = localStorage.getItem(INVOICES_KEY);
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    // Nếu chưa có hóa đơn nào, nạp mẫu ban đầu
    if (list.length === 0) {
      list = [...SAMPLE_INVOICES];
    }

    // ── Tự động đồng bộ các ca Đặt Lịch từ doctor4_appointments_db ──
    const rawApps = localStorage.getItem(APPOINTMENTS_KEY);
    if (rawApps) {
      const appointments = JSON.parse(rawApps);
      if (Array.isArray(appointments)) {
        let hasChanges = false;
        appointments.forEach(app => {
          if (!app || !app.id) return;

          // Tìm xem ca này đã có hóa đơn trong list chưa
          const existingIdx = list.findIndex(i =>
            String(i.appointmentId) === String(app.id) ||
            String(i.id) === String(app.invoiceId) ||
            String(i.id) === String(app.id)
          );

          if (existingIdx >= 0) {
            const cur = list[existingIdx];
            // Đồng bộ thêm thông tin đặt lịch nếu còn thiếu
            if (!cur.appointmentDate && app.date) {
              cur.appointmentDate = app.date;
              hasChanges = true;
            }
            if (!cur.appointmentTime && app.timeSlot) {
              cur.appointmentTime = app.timeSlot;
              hasChanges = true;
            }
            if (!cur.queueNumber && (app.queueNumber || app.stt)) {
              cur.queueNumber = app.queueNumber || app.stt;
              cur.stt = cur.queueNumber;
              hasChanges = true;
            }
            if (!cur.patientPhone && app.patientPhone) {
              cur.patientPhone = app.patientPhone;
              hasChanges = true;
            }
            if (app.patientName && cur.patientName !== app.patientName) {
              cur.patientName = app.patientName;
              hasChanges = true;
            }
            if (app.doctorName && cur.doctorName !== app.doctorName) {
              cur.doctorName = app.doctorName;
              hasChanges = true;
            }
            if (app.roomName && cur.roomName !== app.roomName) {
              cur.roomName = app.roomName;
              hasChanges = true;
            }
            if (app.serviceName && cur.serviceName !== app.serviceName) {
              cur.serviceName = app.serviceName;
              hasChanges = true;
            }

            // Đồng bộ kết quả chẩn đoán và đơn thuốc từ bác sĩ sau khi khám
            if (app.medicalRecord) {
              if (app.medicalRecord.diagnosis && cur.diagnosis !== app.medicalRecord.diagnosis) {
                cur.diagnosis = app.medicalRecord.diagnosis;
                hasChanges = true;
              }
              if (app.medicalRecord.advice && cur.advice !== app.medicalRecord.advice) {
                cur.advice = app.medicalRecord.advice;
                hasChanges = true;
              }
              if (app.medicalRecord.revisitDate && cur.revisitDate !== app.medicalRecord.revisitDate) {
                cur.revisitDate = app.medicalRecord.revisitDate;
                hasChanges = true;
              }
              const recPrescriptions = app.medicalRecord.prescriptions || app.medicalRecord.prescription;
              if (Array.isArray(recPrescriptions) && recPrescriptions.length > 0) {
                if (JSON.stringify(cur.prescriptions) !== JSON.stringify(recPrescriptions)) {
                  cur.prescriptions = recPrescriptions;
                  hasChanges = true;
                }
              }
            }

            // Đồng bộ viện phí khi bác sĩ đã chỉnh sửa hoặc kê đơn
            const billingObj = app.billing || app.medicalRecord;
            if (billingObj && (billingObj.totalAmount !== undefined || billingObj.examFee !== undefined || billingObj.medicineFee !== undefined)) {
              const bExam = Number(billingObj.examFee ?? cur.examFee ?? 200000);
              const bMed = Number(billingObj.medicineFee ?? cur.medicineFee ?? 0);
              const bServ = Number(billingObj.serviceFee ?? cur.serviceFee ?? 0);
              const bDisc = Number(billingObj.discount ?? cur.discount ?? 0);
              const bTotal = Number(billingObj.totalAmount ?? (bExam + bMed + bServ - bDisc));

              if (cur.examFee !== bExam) {
                cur.examFee = bExam;
                hasChanges = true;
              }
              if (cur.medicineFee !== bMed) {
                cur.medicineFee = bMed;
                hasChanges = true;
              }
              if (cur.serviceFee !== bServ) {
                cur.serviceFee = bServ;
                hasChanges = true;
              }
              if (cur.discount !== bDisc) {
                cur.discount = bDisc;
                hasChanges = true;
              }
              if (cur.totalAmount !== bTotal) {
                cur.totalAmount = bTotal;
                hasChanges = true;
              }
            }

            // Đồng bộ trạng thái thanh toán
            if ((app.billing?.paymentStatus === 'paid' || app.isPaid === true) && cur.status !== 'paid') {
              cur.status = 'paid';
              cur.paidAt = app.billing?.paidAt || cur.paidAt || new Date().toISOString();
              cur.paymentMethod = app.billing?.paymentMethod || cur.paymentMethod || 'Đã thanh toán trực tuyến';
              hasChanges = true;
            } else if (app.billing?.paymentStatus === 'unpaid' && cur.status === 'paid' && !cur.cashierName) {
              cur.status = 'pending';
              cur.paidAt = null;
              cur.paymentMethod = null;
              hasChanges = true;
            }
          } else {
            // Chưa có hóa đơn cho lịch hẹn đặt lịch này -> Tự động tạo hóa đơn viện phí
            const invoiceId = app.invoiceId || ('HD-' + new Date(app.createdAt || Date.now()).getFullYear() + '-' + (String(app.id).replace(/\D/g, '').slice(-4) || Math.floor(1000 + Math.random() * 9000)));
            const isPaid = app.billing?.paymentStatus === 'paid' || app.isPaid === true;
            const examFee = Number(app.billing?.examFee ?? (app.medicalRecord?.examFee ?? (app.examFee || 200000)));
            const medicineFee = Number(app.billing?.medicineFee ?? (app.medicalRecord?.medicineFee || 0));
            const serviceFee = Number(app.billing?.serviceFee ?? (app.medicalRecord?.serviceFee ?? (app.serviceFee || 0)));
            const discount = Number(app.billing?.discount ?? (app.medicalRecord?.discount || 0));
            const totalAmount = Number(app.billing?.totalAmount ?? (app.medicalRecord?.totalAmount ?? (examFee + medicineFee + serviceFee - discount)));

            const newInv = {
              id: invoiceId,
              appointmentId: app.id,
              patientName: app.patientName || 'Bệnh nhân',
              patientPhone: app.patientPhone || '',
              patientGender: app.patientGender || app.patientProfile?.gender || '',
              patientAge: app.patientAge || (app.patientProfile?.dob ? (new Date().getFullYear() - new Date(app.patientProfile.dob).getFullYear() + ' tuổi') : ''),
              doctorId: app.doctorId || 'doc_1',
              doctorName: app.doctorName || 'Bác sĩ chuyên khoa',
              roomId: app.roomId || 'r101',
              roomName: app.roomName || 'Phòng 101',
              serviceName: app.serviceName || 'Khám Mắt',
              diagnosis: app.medicalRecord?.diagnosis || 'Khám mắt theo lịch hẹn trực tuyến',
              advice: app.medicalRecord?.advice || app.symptoms || '',
              revisitDate: app.medicalRecord?.revisitDate || '',
              prescriptions: app.medicalRecord?.prescriptions || app.medicalRecord?.prescription || [],
              examFee: examFee,
              medicineFee: medicineFee,
              serviceFee: serviceFee,
              discount: discount,
              totalAmount: totalAmount > 0 ? totalAmount : examFee,
              status: isPaid ? 'paid' : 'pending',
              sentAt: app.createdAt || new Date().toISOString(),
              paidAt: isPaid ? (app.billing?.paidAt || new Date().toISOString()) : null,
              cashierName: isPaid ? (app.billing?.cashierName || 'Thu ngân / Online') : null,
              paymentMethod: isPaid ? (app.billing?.paymentMethod || 'Chuyển khoản / VietQR') : null,
              queueNumber: app.queueNumber || app.stt || 1,
              stt: app.stt || app.queueNumber || 1,
              appointmentDate: app.date || '',
              appointmentTime: app.timeSlot || ''
            };

            list.unshift(newInv);
            hasChanges = true;
          }
        });

        if (hasChanges) {
          localStorage.setItem(INVOICES_KEY, JSON.stringify(list));
        }
      }
    }

    return list;
  } catch (err) {
    console.error('Lỗi getInvoices:', err);
    return [...SAMPLE_INVOICES];
  }
}

function saveInvoices(list) {
  localStorage.setItem(INVOICES_KEY, JSON.stringify(list));
}

/* ── FORMAT HELPERS ── */
function formatMoney(num) {
  return Number(num || 0).toLocaleString('vi-VN') + 'đ';
}

/* Tạo URL ảnh VietQR (Napas 247) cho hóa đơn */
function buildVietQRUrl(inv) {
  const params = new URLSearchParams({
    amount: String(Math.max(0, Math.round(Number(inv.totalAmount) || 0))),
    addInfo: ((inv.id || '') + ' ' + (inv.patientName || '')).trim(),
    accountName: CASHIER_BANK_NAME
  });
  return 'https://img.vietqr.io/image/' + CASHIER_BANK_ID + '-' + CASHIER_BANK_ACCOUNT +
    '-compact2.png?' + params.toString();
}

function formatTime(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString('vi-VN');
  } catch { return isoString; }
}

/* ── NORMALIZE SEARCH (Chuẩn hóa tìm kiếm không dấu, không ký tự đặc biệt) ── */
function normalizeSearchText(str) {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
    .replace(/[^a-z0-9]/g, '');      // Bỏ khoảng trắng, dấu gạch nối, ký tự đặc biệt
}

/* ── TOAST ── */
function showToast(type = 'info', title = '', message = '') {
  const container = document.getElementById('cashier-toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: '💡' };
  const toast = document.createElement('div');
  toast.className = `cashier-toast toast-${type}`;
  toast.innerHTML = `
    <span class="t-icon">${icons[type] || '🔔'}</span>
    <div>
      <div class="t-title">${title}</div>
      ${message ? `<div class="t-msg">${message}</div>` : ''}
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

/* ── STATE ── */
let currentFilter = 'all';
let searchQuery   = '';
let pollingInterval = null;
let lastInvoiceCount = 0;

/* ── RENDER STATS ── */
function renderStats(invoices) {
  const total   = invoices.length;
  const pending = invoices.filter(i => i.status === 'pending').length;
  const paid    = invoices.filter(i => i.status === 'paid').length;
  const revenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((s, i) => s + Number(i.totalAmount || 0), 0);

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('stat-total-invoices',  total);
  set('stat-pending-invoices', pending);
  set('stat-paid-invoices',   paid);
  set('stat-total-revenue',   formatMoney(revenue));
  set('count-all',    total);
  set('count-pending', pending);
  set('count-paid',   paid);
}

/* ── RENDER INVOICE TABLE ── */
function renderInvoiceTable() {
  const container = document.getElementById('cashier-queue-container');
  if (!container) return;

  let invoices = getInvoices();

  // Detect new invoices (polling)
  if (invoices.length > lastInvoiceCount && lastInvoiceCount > 0) {
    const newest = invoices.filter(i => i.status === 'pending').slice(0, invoices.length - lastInvoiceCount);
    newest.forEach(inv => {
      showToast('info', '🔔 Hóa đơn mới!',
        `Khách hàng: ${inv.patientName} — ${formatMoney(inv.totalAmount)}`);
    });
  }
  lastInvoiceCount = invoices.length;

  renderStats(invoices);

  // ── SMART SEARCH (Tìm kiếm thông minh: mã hóa đơn, mã đặt lịch, tên, SĐT, bác sĩ, phòng, dịch vụ) ──
  const rawQ = searchQuery.trim().toLowerCase();
  const cleanQ = normalizeSearchText(searchQuery);

  if (rawQ) {
    invoices = invoices.filter(i => {
      // 1. Mã hóa đơn (HD-2026-1082, 1082, hd1082)
      const idMatch = (i.id && i.id.toLowerCase().includes(rawQ)) ||
                      (i.id && normalizeSearchText(i.id).includes(cleanQ));

      // 2. Mã lịch hẹn / mã đặt lịch (DOC-2026-1082, DOC1082, 8192, AP-1001)
      const apptMatch = (i.appointmentId && i.appointmentId.toLowerCase().includes(rawQ)) ||
                        (i.appointmentId && normalizeSearchText(i.appointmentId).includes(cleanQ));

      // 3. Tên bệnh nhân / khách hàng đặt lịch (có dấu hoặc không dấu)
      const nameMatch = (i.patientName && i.patientName.toLowerCase().includes(rawQ)) ||
                        (i.patientName && normalizeSearchText(i.patientName).includes(cleanQ));

      // 4. Số điện thoại khách hàng (có khoảng trắng hoặc không)
      const phoneDigits = i.patientPhone ? i.patientPhone.replace(/\D/g, '') : '';
      const queryDigits = rawQ.replace(/\D/g, '');
      const phoneMatch = (i.patientPhone && i.patientPhone.includes(rawQ)) ||
                         (queryDigits && phoneDigits && phoneDigits.includes(queryDigits));

      // 5. Bác sĩ phụ trách
      const doctorMatch = (i.doctorName && i.doctorName.toLowerCase().includes(rawQ)) ||
                          (i.doctorName && normalizeSearchText(i.doctorName).includes(cleanQ));

      // 6. Dịch vụ đặt khám
      const serviceMatch = (i.serviceName && i.serviceName.toLowerCase().includes(rawQ)) ||
                           (i.serviceName && normalizeSearchText(i.serviceName).includes(cleanQ));

      // 7. Phòng khám
      const roomMatch = (i.roomName && i.roomName.toLowerCase().includes(rawQ)) ||
                        (i.roomName && normalizeSearchText(i.roomName).includes(cleanQ));

      // 8. Số thứ tự (STT: 1, #01, STT 1)
      const sttStr = String(i.queueNumber || i.stt || '');
      const sttMatch = sttStr === rawQ || ('stt' + sttStr) === cleanQ || ('#' + sttStr) === rawQ;

      return idMatch || apptMatch || nameMatch || phoneMatch || doctorMatch || serviceMatch || roomMatch || sttMatch;
    });
  }

  if (currentFilter === 'pending') invoices = invoices.filter(i => i.status === 'pending');
  if (currentFilter === 'paid')    invoices = invoices.filter(i => i.status === 'paid');

  // Sort: pending first, then by sentAt desc
  invoices.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return  1;
    return new Date(b.sentAt || 0) - new Date(a.sentAt || 0);
  });

  if (invoices.length === 0) {
    container.innerHTML = `
      <div class="cashier-empty">
        <div class="empty-icon">🧾</div>
        <h3>${searchQuery ? 'Không tìm thấy hóa đơn hoặc ca đặt lịch phù hợp' : (currentFilter === 'pending' ? 'Không có hóa đơn chờ thu' : 'Chưa có hóa đơn nào')}</h3>
        <p>${searchQuery ? `Không có kết quả nào khớp với từ khóa "<strong>${searchQuery}</strong>". Bạn có thể thử tìm theo Mã Hóa Đơn (HD-...), Mã Đặt Lịch (DOC-...), Tên hoặc Số Điện Thoại khách hàng.` : 'Hóa đơn sẽ tự động cập nhật khi khách hàng đặt lịch hoặc bác sĩ chuyển về.'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="cashier-table-wrapper">
      <table class="cashier-table">
        <thead>
          <tr>
            <th>Mã Hóa Đơn & Đặt Lịch</th>
            <th>Khách Hàng Đặt Lịch</th>
            <th>Bác Sĩ / Phòng</th>
            <th>Dịch Vụ Khám</th>
            <th>Thời Gian Hẹn</th>
            <th>Viện Phí Cần Thu</th>
            <th>Trạng Thái</th>
            <th style="text-align:right;">Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          ${invoices.map(inv => {
            const isPaid = inv.status === 'paid';
            const statusBadge = isPaid
              ? `<span class="status-badge paid">✅ Đã thu tiền</span>`
              : `<span class="status-badge pending">⏳ Chờ thu tiền</span>`;

            const sttVal = inv.queueNumber || inv.stt || 1;
            const sttBadge = `<span style="background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:800;letter-spacing:0.5px;">STT #${String(sttVal).padStart(2, '0')}</span>`;

            return `
              <tr class="${!isPaid ? 'new-invoice-pulse' : ''}">
                <td>
                  <span class="invoice-id-badge" title="Mã hóa đơn viện phí">${inv.id}</span>
                  <div style="font-size:12px;color:#0284c7;font-weight:700;margin-top:4px;display:flex;align-items:center;gap:6px;">
                    <span title="Mã lịch hẹn đặt lịch">🔖 ${inv.appointmentId || '—'}</span>
                    ${sttBadge}
                  </div>
                </td>
                <td>
                  <div class="patient-name-box">
                    <div class="name" style="color:#0f172a;font-weight:700;font-size:14px;">${inv.patientName || '—'}</div>
                    <div class="meta" style="color:#475569;font-size:12px;margin-top:2px;">
                      📞 <strong style="color:#0f172a;">${inv.patientPhone || '—'}</strong>
                      ${(inv.patientGender || inv.patientAge) ? `&nbsp;•&nbsp; ${inv.patientGender || ''} ${inv.patientAge || ''}` : ''}
                    </div>
                  </div>
                </td>
                <td>
                  <div class="doctor-room-box">
                    <div class="doc" style="font-weight:700;color:#0369a1;font-size:13px;">👨‍⚕️ ${inv.doctorName || '—'}</div>
                    <div class="room" style="font-size:12px;color:#64748b;margin-top:2px;">🏥 ${inv.roomName || 'Phòng khám'}</div>
                  </div>
                </td>
                <td>
                  <div style="font-size:13.5px;font-weight:700;color:#0f172a;max-width:210px;line-height:1.4;">${inv.serviceName || '—'}</div>
                  <div style="font-size:11.5px;color:#64748b;margin-top:2px;max-width:210px;">${inv.diagnosis ? (inv.diagnosis.slice(0, 50) + (inv.diagnosis.length > 50 ? '…' : '')) : (inv.advice || 'Khám theo lịch hẹn')}</div>
                </td>
                <td style="font-size:12.5px;color:#334155;white-space:nowrap;">
                  ${inv.appointmentTime ? `<div style="font-weight:700;color:#d97706;">🕒 ${inv.appointmentTime}</div>` : ''}
                  ${inv.appointmentDate ? `<div style="color:#64748b;font-size:11.5px;">📅 ${inv.appointmentDate}</div>` : `<div style="color:#94a3b8;font-size:11px;">${formatTime(inv.sentAt)}</div>`}
                </td>
                <td>
                  <div class="amount-badge" style="font-family:'Space Grotesk',sans-serif;font-size:17px;font-weight:800;color:#16a34a;">${formatMoney(inv.totalAmount)}</div>
                  <div style="font-size:11px;color:#64748b;margin-top:2px;">
                    Phí khám: <strong>${formatMoney(inv.examFee)}</strong>
                    ${inv.medicineFee > 0 ? ` + Thuốc: <strong>${formatMoney(inv.medicineFee)}</strong>` : ''}
                    ${inv.serviceFee > 0 ? ` + DV: <strong>${formatMoney(inv.serviceFee)}</strong>` : ''}
                  </div>
                  ${isPaid ? `<div style="font-size:11px;color:#16a34a;font-weight:700;margin-top:2px;">💳 ${inv.paymentMethod || 'Đã thanh toán'}</div>` : ''}
                </td>
                <td>${statusBadge}</td>
                <td>
                  <div class="cashier-action-btns">
                    ${!isPaid
                      ? `<button class="btn-collect-payment" data-id="${inv.id}">💵 Thu Tiền</button>`
                      : `<button class="btn-view-invoice" data-id="${inv.id}">📄 Biên Nhận</button>`
                    }
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Bind buttons
  container.querySelectorAll('.btn-collect-payment').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const inv = getInvoices().find(i => i.id === id);
      if (inv) openCollectModal(inv);
    });
  });

  container.querySelectorAll('.btn-view-invoice').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const inv = getInvoices().find(i => i.id === id);
      if (inv) openReceiptModal(inv);
    });
  });
}

/* ── COLLECT PAYMENT MODAL ── */
let selectedPaymentMethod = 'Tiền mặt tại quầy';

function openCollectModal(inv) {
  selectedPaymentMethod = 'Tiền mặt tại quầy';
  const modalRoot = document.getElementById('cashier-modal-root');

  const prescRows = (inv.prescriptions || []).map(d => `
    <div class="drug-row">
      <div>
        <span class="drug-name">${d.name}</span>
        <span style="font-size:11px;color:#94a3b8;margin-left:8px;">x${d.quantity} ${d.dosage || ''}</span>
      </div>
      <span class="drug-price">${formatMoney((d.quantity || 1) * (d.price || 0))}</span>
    </div>
  `).join('');

  modalRoot.innerHTML = `
    <div class="cashier-modal-overlay" id="cashier-modal-overlay">
      <div class="cashier-modal">
        <div class="cashier-modal-header">
          <h3>💵 Thu Viện Phí — ${inv.patientName}</h3>
          <button class="cashier-modal-close" id="btn-close-collect-modal">✕</button>
        </div>
        <div class="cashier-modal-body">

          <!-- Mã Hóa Đơn & Mã Lịch Hẹn Đặt Lịch -->
          <div style="background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:12px;padding:12px 14px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div>
              <span style="font-size:11px;color:#0284c7;font-weight:800;text-transform:uppercase;">MÃ HÓA ĐƠN:</span>
              <span style="font-family:monospace;font-size:14px;font-weight:800;color:#0284c7;margin-left:4px;">${inv.id}</span>
            </div>
            <div>
              <span style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">MÃ ĐẶT LỊCH:</span>
              <span style="font-family:monospace;font-size:13px;font-weight:800;color:#2563eb;margin-left:4px;">${inv.appointmentId || '—'}</span>
            </div>
            ${(inv.queueNumber || inv.stt) ? `
            <div style="background:#0284c7;color:#fff;padding:2px 8px;border-radius:6px;font-size:11.5px;font-weight:800;">
              STT #${String(inv.queueNumber || inv.stt).padStart(2, '0')}
            </div>` : ''}
          </div>

          <!-- Patient & Doctor Info -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;">
              <div style="font-size:11px;color:#64748b;font-weight:700;margin-bottom:6px;text-transform:uppercase;">👤 Khách Hàng Đặt Lịch</div>
              <div style="font-weight:800;color:#0f172a;font-size:15px;">${inv.patientName}</div>
              <div style="font-size:13px;color:#0f172a;margin-top:2px;font-weight:600;">📞 ${inv.patientPhone || '—'}</div>
              <div style="font-size:12px;color:#64748b;margin-top:2px;">${inv.patientGender || ''} ${inv.patientAge || ''}</div>
              ${(inv.appointmentDate || inv.appointmentTime) ? `<div style="font-size:12px;color:#d97706;font-weight:700;margin-top:4px;">📅 ${inv.appointmentTime || ''} (${inv.appointmentDate || ''})</div>` : ''}
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;">
              <div style="font-size:11px;color:#64748b;font-weight:700;margin-bottom:6px;text-transform:uppercase;">👨‍⚕️ Bác Sĩ & Khám Bệnh</div>
              <div style="font-weight:700;color:#0369a1;font-size:13.5px;">👨‍⚕️ ${inv.doctorName}</div>
              <div style="font-size:12px;color:#475569;margin-top:2px;">🏥 ${inv.roomName || 'Phòng khám'}</div>
              <div style="font-size:12px;color:#0f172a;font-weight:700;margin-top:4px;">🎯 ${inv.serviceName || '—'}</div>
            </div>
          </div>

          <!-- Diagnosis & Advice -->
          ${inv.diagnosis ? `
          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:12px;margin-bottom:14px;">
            <div style="font-size:11px;color:#0284c7;font-weight:800;margin-bottom:4px;">🔬 CHẨN ĐOÁN / LÝ DO KHÁM</div>
            <div style="font-size:13px;color:#0f172a;font-weight:600;">${inv.diagnosis}</div>
            ${inv.advice ? `<div style="font-size:12px;color:#475569;margin-top:4px;">📋 ${inv.advice}</div>` : ''}
            ${inv.revisitDate ? `<div style="font-size:12px;color:#d97706;margin-top:4px;">🗓️ Tái khám: ${inv.revisitDate}</div>` : ''}
          </div>
          ` : ''}

          <!-- Fee Breakdown -->
          <div style="margin-bottom:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;">
            <div style="font-size:11px;color:#64748b;font-weight:700;margin-bottom:8px;text-transform:uppercase;">💰 Bảng Kê Viện Phí</div>
            <div class="invoice-detail-row">
              <span class="label">Phí khám lâm sàng:</span>
              <span class="value" style="color:#0f172a;">${formatMoney(inv.examFee)}</span>
            </div>
            ${(inv.prescriptions || []).length > 0 ? `
            <div class="invoice-detail-row">
              <span class="label">Tiền thuốc (${(inv.prescriptions || []).length} loại):</span>
              <span class="value" style="color:#0f172a;">${formatMoney(inv.medicineFee)}</span>
            </div>
            ` : ''}
            ${inv.serviceFee > 0 ? `
            <div class="invoice-detail-row">
              <span class="label">Dịch vụ / Kỹ thuật bổ sung:</span>
              <span class="value" style="color:#0f172a;">${formatMoney(inv.serviceFee)}</span>
            </div>
            ` : ''}
            ${inv.discount > 0 ? `
            <div class="invoice-detail-row">
              <span class="label">Giảm trừ BHYT / Ưu đãi:</span>
              <span class="value" style="color:#16a34a;">- ${formatMoney(inv.discount)}</span>
            </div>
            ` : ''}
          </div>

          <!-- Prescriptions mini list -->
          ${prescRows ? `
          <div style="margin-bottom:12px;">
            <div style="font-size:11px;color:#64748b;font-weight:700;margin-bottom:6px;text-transform:uppercase;">📋 Đơn Thuốc Điều Trị</div>
            <div class="prescription-mini-list">${prescRows}</div>
          </div>
          ` : ''}

          <!-- Total -->
          <div class="total-fee-box">
            <span class="total-label">TỔNG CỘNG VIỆN PHÍ CẦN THU:</span>
            <span class="total-amount">${formatMoney(inv.totalAmount)}</span>
          </div>

          <!-- Payment Method -->
          <div class="payment-method-group">
            <label>Phương Thức Thanh Toán</label>
            <div class="method-options">
              <button class="method-btn selected" data-method="Tiền mặt tại quầy">💵 Tiền mặt</button>
              <button class="method-btn" data-method="Chuyển khoản ngân hàng">🏦 Chuyển khoản QR</button>
              <button class="method-btn" data-method="Thẻ tín dụng / Thẻ ATM">💳 Thẻ ngân hàng</button>
              <button class="method-btn" data-method="MoMo / VNPay">📱 Ví điện tử</button>
            </div>
          </div>

          <!-- VietQR Panel (ẩn mặc định, hiện khi chọn Chuyển khoản) -->
          <div id="cashier-vietqr-panel" style="display:none;margin:12px 0;background:linear-gradient(135deg,#f0f9ff,#eff6ff);border:1.5px solid #bae6fd;border-radius:14px;padding:16px;text-align:center;">
            <div style="font-size:11px;font-weight:800;color:#0284c7;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">
              📱 Mã QR Chuyển Khoản VietQR
            </div>
            <img id="cashier-qr-img"
                 src="${buildVietQRUrl(inv)}"
                 alt="Mã QR VietQR thanh toán"
                 style="width:200px;height:200px;border-radius:12px;border:3px solid #bae6fd;background:#fff;display:block;margin:0 auto 12px;object-fit:contain;" />
            <div style="font-size:12.5px;color:#0f172a;font-weight:700;margin-bottom:4px;">
              🏦 <span id="cashier-qr-bank-label">${CASHIER_BANK_LABEL}</span>
            </div>
            <div style="font-size:12px;color:#475569;margin-bottom:2px;">
              STK: <strong style="font-family:monospace;color:#0284c7;">${CASHIER_BANK_ACCOUNT}</strong>
            </div>
            <div style="font-size:12px;color:#475569;margin-bottom:6px;">
              Chủ TK: <strong>${CASHIER_BANK_NAME}</strong>
            </div>
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:8px 12px;display:inline-block;margin-top:4px;">
              <div style="font-size:11px;color:#15803d;font-weight:700;">SỐ TIỀN CHUYỂN KHOẢN:</div>
              <div style="font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:800;color:#16a34a;">${formatMoney(inv.totalAmount)}</div>
            </div>
            <div style="font-size:11px;color:#64748b;margin-top:8px;">
              Nội dung CK: <strong style="color:#0f172a;">${inv.id} ${inv.patientName || ''}</strong>
            </div>
          </div>

          <!-- ── PANEL: Thẻ ngân hàng / POS ── -->
          <div id="cashier-panel-card" style="display:none;margin:10px 0;background:linear-gradient(135deg,#faf5ff,#f0f9ff);border:1.5px solid #c4b5fd;border-radius:14px;padding:20px;text-align:center;">
            <div style="font-size:11px;font-weight:800;color:#7c3aed;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">💳 Thanh Toán Qua Máy POS / Thẻ Ngân Hàng</div>
            <div style="font-size:48px;margin-bottom:10px;">🖥️</div>
            <div style="font-size:13.5px;font-weight:700;color:#0f172a;margin-bottom:10px;">Hướng dẫn thanh toán thẻ tại quầy</div>
            <div style="text-align:left;background:#fff;border:1px solid #e9d5ff;border-radius:10px;padding:14px;font-size:13px;color:#374151;line-height:1.9;margin-bottom:12px;">
              <div>① Mời bệnh nhân đưa thẻ ATM / Visa / Master / JCB</div>
              <div>② Cắm hoặc chạm thẻ vào máy POS</div>
              <div>③ Khách nhập mã PIN xác nhận giao dịch</div>
              <div>④ Máy POS in biên lai — giao 1 liên cho khách lưu</div>
            </div>
            <div style="background:#f5f3ff;border:1px solid #c4b5fd;border-radius:10px;padding:10px 18px;display:inline-block;">
              <div style="font-size:10px;color:#7c3aed;font-weight:700;text-transform:uppercase;margin-bottom:2px;">Số tiền POS cần thu</div>
              <div style="font-size:22px;font-weight:800;color:#7c3aed;font-family:'Space Grotesk',sans-serif;">${formatMoney(inv.totalAmount)}</div>
            </div>
            <div style="font-size:11px;color:#9ca3af;margin-top:8px;">Mã HĐ: <strong style="color:#0f172a;">${inv.id}</strong> — Sau khi POS xác nhận, bấm "Xác Nhận Đã Thu" bên dưới.</div>
          </div>

          <!-- ── PANEL: Ví điện tử (MoMo / VNPay) ── -->
          <div id="cashier-panel-ewallet" style="display:none;margin:10px 0;">
            <!-- Sub-tab chọn MoMo hoặc VNPay -->
            <div style="display:flex;gap:8px;margin-bottom:10px;">
              <button id="ewallet-tab-momo"
                style="flex:1;padding:9px;border:2px solid #a50064;border-radius:10px;background:#a50064;color:#fff;font-weight:800;font-size:13px;cursor:pointer;transition:all 0.2s;">
                💜 MoMo
              </button>
              <button id="ewallet-tab-vnpay"
                style="flex:1;padding:9px;border:2px solid #0066cc;border-radius:10px;background:#f0f6ff;color:#0066cc;font-weight:800;font-size:13px;cursor:pointer;transition:all 0.2s;">
                🔵 VNPay
              </button>
            </div>

            <!-- MoMo Panel -->
            <div id="ewallet-panel-momo" style="background:linear-gradient(135deg,#fff0f9,#fdf2f8);border:1.5px solid #f9a8d4;border-radius:14px;padding:16px;text-align:center;">
              <div style="font-size:11px;font-weight:800;color:#a50064;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">💜 Quét Mã QR — Thanh Toán Ví MoMo</div>
              <img id="cashier-qr-momo"
                   src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=a50064&qzone=1&data=${encodeURIComponent('momo://app?action=payCode&amount=' + inv.totalAmount + '&note=' + (inv.id + ' ' + (inv.patientName||'')).trim())}"
                   alt="MoMo QR"
                   style="width:190px;height:190px;border-radius:12px;border:3px solid #f9a8d4;background:#fff;display:block;margin:0 auto 12px;" />
              <div style="font-size:13px;font-weight:700;color:#a50064;margin-bottom:4px;">📱 Số điện thoại nhận tiền MoMo</div>
              <div style="font-family:monospace;font-size:22px;font-weight:800;color:#0f172a;letter-spacing:2px;margin-bottom:4px;">0909 123 456</div>
              <div style="font-size:11.5px;color:#a50064;font-weight:600;margin-bottom:10px;">Chủ ví: PHONG KHAM MAT DOCTOR4</div>
              <div style="background:#fce7f3;border:1px solid #f9a8d4;border-radius:8px;padding:8px 16px;display:inline-block;">
                <div style="font-size:10px;color:#a50064;font-weight:700;text-transform:uppercase;">Số tiền</div>
                <div style="font-size:22px;font-weight:800;color:#a50064;font-family:'Space Grotesk',sans-serif;">${formatMoney(inv.totalAmount)}</div>
              </div>
              <div style="font-size:11px;color:#64748b;margin-top:8px;">Nội dung: <strong style="color:#0f172a;">${inv.id} ${inv.patientName || ''}</strong></div>
            </div>

            <!-- VNPay Panel (ẩn mặc định) -->
            <div id="ewallet-panel-vnpay" style="display:none;background:linear-gradient(135deg,#eff6ff,#e0edff);border:1.5px solid #93c5fd;border-radius:14px;padding:16px;text-align:center;">
              <div style="font-size:11px;font-weight:800;color:#0066cc;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">🔵 Quét Mã QR — Thanh Toán VNPay</div>
              <img id="cashier-qr-vnpay"
                   src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=0066cc&qzone=1&data=${encodeURIComponent('https://pay.vnpay.vn?amount=' + inv.totalAmount + '&info=' + (inv.id + ' ' + (inv.patientName||'')).trim())}"
                   alt="VNPay QR"
                   style="width:190px;height:190px;border-radius:12px;border:3px solid #93c5fd;background:#fff;display:block;margin:0 auto 12px;" />
              <div style="font-size:13px;font-weight:700;color:#0066cc;margin-bottom:4px;">🔵 VNPay — Phòng Khám Mắt Doctor4</div>
              <div style="font-size:11.5px;color:#475569;margin-bottom:10px;">Quét bằng app ngân hàng hoặc ví VNPay</div>
              <div style="background:#dbeafe;border:1px solid #93c5fd;border-radius:8px;padding:8px 16px;display:inline-block;">
                <div style="font-size:10px;color:#0066cc;font-weight:700;text-transform:uppercase;">Số tiền</div>
                <div style="font-size:22px;font-weight:800;color:#0066cc;font-family:'Space Grotesk',sans-serif;">${formatMoney(inv.totalAmount)}</div>
              </div>
              <div style="font-size:11px;color:#64748b;margin-top:8px;">Nội dung: <strong style="color:#0f172a;">${inv.id} ${inv.patientName || ''}</strong></div>
            </div>
          </div>

          <!-- Cashier name -->
          <div style="margin-top:10px;">
            <label style="font-size:12px;color:#64748b;font-weight:600;">Thu ngân xác nhận:</label>
            <input type="text" id="cashier-name-input" class="cashier-input"
                   value="${currentCashier?.name || 'Thu Ngân Quầy 1'}"
                   placeholder="Họ tên thu ngân xác nhận" />
          </div>

        </div>
        <div class="cashier-modal-footer">
          <button class="btn-cashier-cancel" id="btn-cancel-collect">Hủy</button>
          <button class="btn-cashier-confirm" id="btn-confirm-payment">
            ✅ Xác Nhận Đã Thu ${formatMoney(inv.totalAmount)}
          </button>
        </div>
      </div>
    </div>
  `;

  // Helper: ẩn tất cả panel
  function hideAllPanels() {
    ['cashier-vietqr-panel', 'cashier-panel-card', 'cashier-panel-ewallet'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  // Method selection — toggle panels
  modalRoot.querySelectorAll('.method-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modalRoot.querySelectorAll('.method-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedPaymentMethod = btn.getAttribute('data-method');
      hideAllPanels();

      if (selectedPaymentMethod === 'Chuyển khoản ngân hàng') {
        const p = document.getElementById('cashier-vietqr-panel');
        if (p) p.style.display = 'block';
        // Gán lại ảnh QR mỗi lần mở panel (ảnh có thể bị trình duyệt bỏ khi modal được render lại)
        const qrImg = document.getElementById('cashier-qr-img');
        if (qrImg && !qrImg.getAttribute('src')) qrImg.src = buildVietQRUrl(inv);
      } else if (selectedPaymentMethod === 'Thẻ tín dụng / Thẻ ATM') {
        const p = document.getElementById('cashier-panel-card');
        if (p) p.style.display = 'block';
      } else if (selectedPaymentMethod === 'MoMo / VNPay') {
        const p = document.getElementById('cashier-panel-ewallet');
        if (p) p.style.display = 'block';
      }
    });
  });

  // Sub-tabs ví điện tử: MoMo ↔ VNPay
  document.getElementById('ewallet-tab-momo')?.addEventListener('click', () => {
    selectedPaymentMethod = 'MoMo';
    document.getElementById('ewallet-panel-momo').style.display = 'block';
    document.getElementById('ewallet-panel-vnpay').style.display = 'none';
    const btnMomo = document.getElementById('ewallet-tab-momo');
    const btnVnpay = document.getElementById('ewallet-tab-vnpay');
    if (btnMomo) { btnMomo.style.background = '#a50064'; btnMomo.style.color = '#fff'; }
    if (btnVnpay) { btnVnpay.style.background = '#f0f6ff'; btnVnpay.style.color = '#0066cc'; }
  });
  document.getElementById('ewallet-tab-vnpay')?.addEventListener('click', () => {
    selectedPaymentMethod = 'VNPay';
    document.getElementById('ewallet-panel-momo').style.display = 'none';
    document.getElementById('ewallet-panel-vnpay').style.display = 'block';
    const btnMomo = document.getElementById('ewallet-tab-momo');
    const btnVnpay = document.getElementById('ewallet-tab-vnpay');
    if (btnMomo) { btnMomo.style.background = '#fdf2f8'; btnMomo.style.color = '#a50064'; }
    if (btnVnpay) { btnVnpay.style.background = '#0066cc'; btnVnpay.style.color = '#fff'; }
  });

  // Close
  const closeModal = () => { modalRoot.innerHTML = ''; };
  document.getElementById('btn-close-collect-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-collect')?.addEventListener('click', closeModal);
  modalRoot.querySelector('#cashier-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Confirm
  document.getElementById('btn-confirm-payment')?.addEventListener('click', () => {
    const cashierName = document.getElementById('cashier-name-input')?.value?.trim()
      || currentCashier?.name || 'Thu Ngân Quầy 1';

    processPayment(inv.id, selectedPaymentMethod, cashierName);
    closeModal();
  });
}

/* ── PROCESS PAYMENT ── */
function processPayment(invoiceId, paymentMethod, cashierName) {
  const invoices = getInvoices();
  const idx = invoices.findIndex(i => i.id === invoiceId);
  if (idx === -1) return;

  const inv = invoices[idx];
  const now = new Date().toISOString();

  invoices[idx] = {
    ...inv,
    status: 'paid',
    paidAt: now,
    cashierName,
    paymentMethod,
  };

  saveInvoices(invoices);

  // Sync appointments db
  try {
    const rawApps = localStorage.getItem(APPOINTMENTS_KEY);
    if (rawApps) {
      let apps = JSON.parse(rawApps);
      const appIdx = apps.findIndex(a => String(a.id) === String(inv.appointmentId));
      if (appIdx >= 0) {
        if (!apps[appIdx].billing) apps[appIdx].billing = {};
        apps[appIdx].billing.paymentStatus = 'paid';
        apps[appIdx].billing.paymentMethod = paymentMethod;
        apps[appIdx].billing.paidAt = now;
        apps[appIdx].billing.cashierName = cashierName;
        apps[appIdx].invoiceStatus = 'paid';
        localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(apps));
      }
    }
  } catch (e) { console.error(e); }

  // Sync payments
  try {
    const rawPay = localStorage.getItem(PAYMENTS_KEY);
    let payList = rawPay ? JSON.parse(rawPay) : [];
    const payRec = {
      id: 'PAY-' + invoiceId,
      paymentId: 'PAY-' + invoiceId,
      invoiceId,
      appointmentId: inv.appointmentId,
      patientName: inv.patientName,
      name: inv.patientName,
      doctorName: inv.doctorName,
      doctor: inv.doctorName,
      serviceName: inv.serviceName,
      amount: inv.totalAmount,
      paymentMethod,
      cashierName,
      status: 'success',
      createdAt: now,
      paidAt: now
    };
    const existIdx = payList.findIndex(p => p.invoiceId === invoiceId);
    if (existIdx >= 0) payList[existIdx] = { ...payList[existIdx], ...payRec };
    else payList.unshift(payRec);
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payList));
  } catch (e) { console.error(e); }

  showToast('success', '✅ Thu tiền thành công!',
    `${inv.patientName} — ${formatMoney(inv.totalAmount)} — ${paymentMethod}`);

  renderInvoiceTable();

  // Open receipt
  setTimeout(() => {
    const updatedInv = getInvoices().find(i => i.id === invoiceId);
    if (updatedInv) openReceiptModal(updatedInv);
  }, 400);
}

/* ── ĐỌC TIỀN THÀNH CHỮ TIẾNG VIỆT ── */
function readMoneyVietnamese(num) {
  if (!num || isNaN(num) || Number(num) <= 0) return 'Không đồng';
  const defaultNumbers = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readThreeDigits(n, full) {
    let tr = Math.floor(n / 100);
    let ch = Math.floor((n % 100) / 10);
    let dv = n % 10;
    let res = '';
    if (tr > 0 || full) {
      res += defaultNumbers[tr] + ' trăm ';
      if (ch === 0 && dv > 0) res += 'lẻ ';
    }
    if (ch > 1) {
      res += defaultNumbers[ch] + ' mươi ';
      if (dv === 1) res += 'mốt ';
    } else if (ch === 1) {
      res += 'mười ';
      if (dv === 1) res += 'một ';
    }
    if (ch !== 0 && dv === 5) {
      res += 'lăm ';
    } else if (dv > 0 && (ch > 1 || (ch === 0 && (tr > 0 || full)))) {
      if (dv !== 1) res += defaultNumbers[dv] + ' ';
    } else if (dv > 0 && ch === 0 && !full && tr === 0) {
      res += defaultNumbers[dv] + ' ';
    }
    return res.trim();
  }

  const str = Math.round(Number(num)).toString();
  let blocks = [];
  for (let i = str.length; i > 0; i -= 3) {
    blocks.push(str.slice(Math.max(0, i - 3), i));
  }
  const scales = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ'];
  let result = '';
  for (let i = blocks.length - 1; i >= 0; i--) {
    let val = parseInt(blocks[i]);
    if (val > 0) {
      let isFull = i < blocks.length - 1;
      let text = readThreeDigits(val, isFull);
      result += text + ' ' + scales[i] + ' ';
    }
  }
  result = result.trim();
  if (!result) return 'Không đồng';
  return result.charAt(0).toUpperCase() + result.slice(1) + ' đồng chẵn.';
}

/* ── GENERATE PRINT RECEIPT TEMPLATE ── */
function generateReceiptPrintHtml(inv) {
  const now = inv.paidAt ? new Date(inv.paidAt) : new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateStr = `Ngày ${day} tháng ${month} năm ${year}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let rowIdx = 1;
  let itemsHtml = '';

  // 1. Phí khám lâm sàng
  if (inv.examFee > 0 || (!inv.medicineFee && !inv.serviceFee)) {
    itemsHtml += `
      <tr>
        <td style="padding:6px 4px;text-align:center;border:1px solid #111;">${rowIdx++}</td>
        <td style="padding:6px 8px;border:1px solid #111;">
          <strong>Khám chuyên khoa mắt</strong>
          <div style="font-size:9.5pt;color:#333;margin-top:2px;">${inv.serviceName || 'Khám & tư vấn thị lực chuyên sâu'}</div>
        </td>
        <td style="padding:6px 4px;text-align:center;border:1px solid #111;">Lượt</td>
        <td style="padding:6px 4px;text-align:center;border:1px solid #111;">1</td>
        <td style="padding:6px 8px;text-align:right;border:1px solid #111;">${formatMoney(inv.examFee)}</td>
        <td style="padding:6px 8px;text-align:right;font-weight:700;border:1px solid #111;">${formatMoney(inv.examFee)}</td>
      </tr>
    `;
  }

  // 2. Dịch vụ kỹ thuật / Bổ sung
  if (inv.serviceFee > 0) {
    itemsHtml += `
      <tr>
        <td style="padding:6px 4px;text-align:center;border:1px solid #111;">${rowIdx++}</td>
        <td style="padding:6px 8px;border:1px solid #111;">
          <strong>Dịch vụ kỹ thuật / Cận lâm sàng bổ sung</strong>
          <div style="font-size:9.5pt;color:#333;margin-top:2px;">Chỉ định bởi bác sĩ ${inv.doctorName}</div>
        </td>
        <td style="padding:6px 4px;text-align:center;border:1px solid #111;">Lần</td>
        <td style="padding:6px 4px;text-align:center;border:1px solid #111;">1</td>
        <td style="padding:6px 8px;text-align:right;border:1px solid #111;">${formatMoney(inv.serviceFee)}</td>
        <td style="padding:6px 8px;text-align:right;font-weight:700;border:1px solid #111;">${formatMoney(inv.serviceFee)}</td>
      </tr>
    `;
  }

  // 3. Đơn thuốc
  (inv.prescriptions || []).forEach(d => {
    const qty = Number(d.quantity || 1);
    const price = Number(d.price || 0);
    const amount = Number(d.amount || (qty * price));
    itemsHtml += `
      <tr>
        <td style="padding:6px 4px;text-align:center;border:1px solid #111;">${rowIdx++}</td>
        <td style="padding:6px 8px;border:1px solid #111;">
          <strong>${d.name}</strong> ${d.type ? `<span style="font-size:9.5pt;color:#444;">(${d.type})</span>` : ''}
          ${d.dosage ? `<div style="font-size:9pt;font-style:italic;color:#333;margin-top:2px;">Cách dùng: ${d.dosage}</div>` : ''}
        </td>
        <td style="padding:6px 4px;text-align:center;border:1px solid #111;">Lọ/Hộp</td>
        <td style="padding:6px 4px;text-align:center;border:1px solid #111;">${qty}</td>
        <td style="padding:6px 8px;text-align:right;border:1px solid #111;">${formatMoney(price)}</td>
        <td style="padding:6px 8px;text-align:right;font-weight:700;border:1px solid #111;">${formatMoney(amount)}</td>
      </tr>
    `;
  });

  const moneyInWords = readMoneyVietnamese(inv.totalAmount);

  return `
    <div style="max-width:760px;margin:0 auto;color:#111;font-family:'Times New Roman',Times,serif;font-size:11.5pt;line-height:1.45;background:#fff;padding:8px 12px;">
      <!-- Header -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;border-bottom:2px solid #000;padding-bottom:8px;">
        <tr>
          <td style="width:62%;vertical-align:top;">
            <div style="font-size:10.5pt;font-weight:700;text-transform:uppercase;color:#0284c7;letter-spacing:0.5px;">SỞ Y TẾ TP. HỒ CHÍ MINH</div>
            <div style="font-size:12.5pt;font-weight:800;text-transform:uppercase;color:#0f172a;margin:2px 0;">PHÒNG KHÁM CHUYÊN KHOA MẮT DOCTOR4</div>
            <div style="font-size:9.5pt;color:#333;">Địa chỉ: 123 Đường Nguyễn Tri Phương, Phường 7, Quận 5, TP.HCM</div>
            <div style="font-size:9.5pt;color:#333;">Hotline: <strong>1800 1234</strong> — Cổng Thu Ngân Viện Phí</div>
          </td>
          <td style="width:38%;vertical-align:top;text-align:right;font-size:10pt;">
            <div>Mẫu số: <strong>01/BV-VP</strong></div>
            <div>Mã biên lai: <strong style="font-size:11.5pt;color:#0284c7;">${inv.id}</strong></div>
            <div>Mã lịch hẹn: <strong>${inv.appointmentId || '—'}</strong></div>
            ${(inv.queueNumber || inv.stt) ? `<div>Số thứ tự (STT): <strong style="font-size:11.5pt;color:#0f172a;">#${String(inv.queueNumber || inv.stt).padStart(2, '0')}</strong></div>` : ''}
            <div style="font-size:9pt;color:#555;margin-top:3px;font-style:italic;">(Liên 2: Giao cho người bệnh)</div>
          </td>
        </tr>
      </table>

      <!-- Title -->
      <div style="text-align:center;margin-bottom:12px;">
        <h1 style="font-size:16pt;font-weight:800;text-transform:uppercase;margin:0 0 4px 0;letter-spacing:0.5px;">BIÊN LAI THU VIỆN PHÍ & DỊCH VỤ</h1>
        <div style="font-size:10pt;color:#444;font-style:italic;">${dateStr} (${timeStr})</div>
      </div>

      <!-- Patient Information -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:10px;font-size:10.5pt;line-height:1.55;">
        <tr>
          <td style="width:60%;">Họ và tên người bệnh: <strong style="font-size:11.5pt;text-transform:uppercase;">${inv.patientName}</strong></td>
          <td style="width:40%;">Điện thoại: <strong>${inv.patientPhone || '—'}</strong></td>
        </tr>
        <tr>
          <td>Giới tính: <strong>${inv.patientGender || 'Nam/Nữ'}</strong> &nbsp;&nbsp;&nbsp;&nbsp; Tuổi: <strong>${inv.patientAge || '—'}</strong></td>
          <td>Bác sĩ điều trị: <strong>${inv.doctorName || '—'}</strong></td>
        </tr>
        <tr>
          <td>Phòng khám: <strong>${inv.roomName || 'Phòng khám mắt'}</strong></td>
          <td>Dịch vụ đăng ký: <strong>${inv.serviceName || '—'}</strong></td>
        </tr>
        ${inv.diagnosis ? `
        <tr>
          <td colspan="2">Chẩn đoán: <strong>${inv.diagnosis}</strong></td>
        </tr>` : ''}
      </table>

      <!-- Fee Breakdown Table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:10px;font-size:10pt;border:1px solid #111;">
        <thead>
          <tr style="background:#f1f5f9;font-weight:700;">
            <th style="padding:6px 4px;width:36px;text-align:center;border:1px solid #111;">STT</th>
            <th style="padding:6px 8px;text-align:left;border:1px solid #111;">Nội dung thu / Khoản mục thanh toán</th>
            <th style="padding:6px 4px;width:55px;text-align:center;border:1px solid #111;">ĐVT</th>
            <th style="padding:6px 4px;width:42px;text-align:center;border:1px solid #111;">SL</th>
            <th style="padding:6px 8px;width:100px;text-align:right;border:1px solid #111;">Đơn giá</th>
            <th style="padding:6px 8px;width:110px;text-align:right;border:1px solid #111;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          ${inv.discount > 0 ? `
          <tr>
            <td colspan="5" style="padding:5px 8px;text-align:right;font-weight:600;border:1px solid #111;">Giảm trừ / Ưu đãi BHYT:</td>
            <td style="padding:5px 8px;text-align:right;font-weight:700;color:#16a34a;border:1px solid #111;">- ${formatMoney(inv.discount)}</td>
          </tr>` : ''}
          <tr style="background:#f8fafc;">
            <td colspan="5" style="padding:7px 8px;text-align:right;font-size:11pt;font-weight:800;border:1px solid #111;text-transform:uppercase;">
              TỔNG CỘNG TIỀN PHẢI THANH TOÁN:
            </td>
            <td style="padding:7px 8px;text-align:right;font-size:12pt;font-weight:800;border:1px solid #111;color:#0f172a;">
              ${formatMoney(inv.totalAmount)}
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- Money in words & Payment Method -->
      <div style="margin-bottom:12px;font-size:10.5pt;line-height:1.5;">
        <div>Số tiền viết bằng chữ: <strong style="font-style:italic;">${moneyInWords}</strong></div>
        <div style="margin-top:2px;">Hình thức thanh toán: <strong>${inv.paymentMethod || 'Tiền mặt tại quầy'}</strong> &nbsp;&nbsp;|&nbsp;&nbsp; Trạng thái: <strong style="color:#16a34a;">✅ ĐÃ THANH TOÁN ĐỦ</strong></div>
        ${inv.revisitDate ? `<div style="margin-top:2px;color:#d97706;">🗓️ Hẹn ngày tái khám: <strong>${inv.revisitDate}</strong></div>` : ''}
        ${inv.advice ? `<div style="margin-top:2px;font-size:10pt;color:#444;">📋 Lời dặn bác sĩ: <em>${inv.advice}</em></div>` : ''}
      </div>

      <!-- Signatures -->
      <table style="width:100%;border-collapse:collapse;margin-top:16px;text-align:center;font-size:10.5pt;">
        <tr>
          <td style="width:50%;vertical-align:top;">
            <div style="font-weight:700;text-transform:uppercase;">NGƯỜI NỘP TIỀN</div>
            <div style="font-size:9pt;font-style:italic;color:#555;">(Ký và ghi rõ họ tên)</div>
            <div style="height:60px;"></div>
            <div style="font-weight:600;">${inv.patientName}</div>
          </td>
          <td style="width:50%;vertical-align:top;">
            <div style="font-style:italic;font-size:9.5pt;color:#444;margin-bottom:2px;">TP.HCM, ${dateStr}</div>
            <div style="font-weight:700;text-transform:uppercase;">NGƯỜI THU TIỀN / THU NGÂN</div>
            <div style="font-size:9pt;font-style:italic;color:#555;">(Ký, đóng dấu và ghi rõ họ tên)</div>
            <div style="height:60px;"></div>
            <div style="font-weight:700;color:#0f172a;">${inv.cashierName || 'Quầy Thu Ngân Doctor4'}</div>
          </td>
        </tr>
      </table>

      <!-- Footer note -->
      <div style="margin-top:20px;padding-top:8px;border-top:1px dashed #999;text-align:center;font-size:9pt;color:#555;font-style:italic;">
        Quý khách vui lòng kiểm tra kỹ biên lai và giữ lại để đối chiếu khi cần thiết. Doctor4 trân trọng cảm ơn Quý khách!
      </div>
    </div>
  `;
}

/* Biến lưu trữ hóa đơn đang mở */
let currentActiveReceiptInv = null;

/* ── PRINT RECEIPT ACTION ── */
export function printReceipt(inv) {
  const targetInv = inv || currentActiveReceiptInv;
  if (!targetInv) return;

  currentActiveReceiptInv = targetInv;
  let printArea = document.getElementById('cashier-print-area');
  if (!printArea) {
    printArea = document.createElement('div');
    printArea.id = 'cashier-print-area';
    document.body.appendChild(printArea);
  }

  printArea.innerHTML = generateReceiptPrintHtml(targetInv);
  printArea.style.display = 'block';

  // Chờ DOM cập nhật rồi gọi window.print()
  setTimeout(() => {
    window.print();
  }, 80);
}

// Lắng nghe sự kiện trước và sau khi in
window.addEventListener('beforeprint', () => {
  if (currentActiveReceiptInv) {
    const printArea = document.getElementById('cashier-print-area');
    if (printArea && !printArea.innerHTML.trim()) {
      printArea.innerHTML = generateReceiptPrintHtml(currentActiveReceiptInv);
      printArea.style.display = 'block';
    }
  }
});

window.addEventListener('afterprint', () => {
  const printArea = document.getElementById('cashier-print-area');
  if (printArea) {
    printArea.style.display = 'none';
  }
});

// Gán hàm vào window để gọi từ bất kỳ đâu
window.printReceipt = printReceipt;

/* ── RECEIPT MODAL ── */
function openReceiptModal(inv) {
  currentActiveReceiptInv = inv;
  const modalRoot = document.getElementById('cashier-modal-root');

  // Chuẩn bị trước nội dung in vào cashier-print-area
  const printArea = document.getElementById('cashier-print-area');
  if (printArea) {
    printArea.innerHTML = generateReceiptPrintHtml(inv);
  }

  const prescRows = (inv.prescriptions || []).map((d, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${d.name} <span style="color:#94a3b8;font-size:12px;">(${d.type || ''})</span></td>
      <td style="text-align:center;">${d.quantity || 1}</td>
      <td style="color:#94a3b8;font-size:12px;">${d.dosage || ''}</td>
      <td style="text-align:right;color:#fbbf24;font-weight:700;">${formatMoney((d.quantity || 1) * (d.price || 0))}</td>
    </tr>
  `).join('');

  modalRoot.innerHTML = `
    <div class="cashier-modal-overlay" id="cashier-modal-overlay">
      <div class="cashier-modal" style="max-width:650px;">
        <div class="cashier-modal-header">
          <h3>🧾 Biên Nhận Viện Phí — ${inv.id}</h3>
          <button class="cashier-modal-close" id="btn-close-receipt">✕</button>
        </div>
        <div class="cashier-modal-body">

          <!-- Header info -->
          <div style="text-align:center;margin-bottom:16px;padding-bottom:16px;border-bottom:1px dashed #cbd5e1;">
            <div style="font-size:22px;margin-bottom:4px;font-weight:800;color:#0f172a;">👁️ Doctor<strong style="color:#0284c7;">4</strong> Eye Clinic</div>
            <div style="font-size:12.5px;color:#64748b;">Phòng Khám Mắt Chuyên Sâu | Hotline: 1800 1234</div>
            <div style="font-size:13.5px;font-weight:800;color:#16a34a;margin-top:8px;">✅ BIÊN NHẬN VIỆN PHÍ & DỊCH VỤ</div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;font-size:13px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;">
            <div><span style="color:#64748b;">Mã hóa đơn:</span> <strong style="color:#0284c7;font-family:monospace;">${inv.id}</strong></div>
            <div><span style="color:#64748b;">Mã đặt lịch:</span> <strong style="color:#2563eb;font-family:monospace;">${inv.appointmentId || '—'}</strong></div>
            <div><span style="color:#64748b;">Khách hàng:</span> <strong style="color:#0f172a;">${inv.patientName}</strong></div>
            <div><span style="color:#64748b;">SĐT:</span> <strong style="color:#0f172a;">${inv.patientPhone || '—'}</strong></div>
            <div><span style="color:#64748b;">Bác sĩ:</span> <strong style="color:#0369a1;">${inv.doctorName}</strong></div>
            <div><span style="color:#64748b;">Phòng:</span> <strong style="color:#0f172a;">${inv.roomName || '—'}</strong></div>
            <div><span style="color:#64748b;">Dịch vụ:</span> <strong style="color:#0f172a;">${inv.serviceName || '—'}</strong></div>
            <div><span style="color:#64748b;">Chẩn đoán:</span> <strong style="color:#0f172a;">${inv.diagnosis || '—'}</strong></div>
            ${(inv.appointmentTime || inv.appointmentDate) ? `<div><span style="color:#64748b;">Thời gian hẹn:</span> <strong style="color:#d97706;">${inv.appointmentTime || ''} ${inv.appointmentDate ? '(' + inv.appointmentDate + ')' : ''}</strong></div>` : ''}
            ${inv.revisitDate ? `<div><span style="color:#64748b;">Tái khám:</span> <strong style="color:#d97706;">${inv.revisitDate}</strong></div>` : ''}
          </div>

          <!-- Prescriptions -->
          ${prescRows ? `
          <div style="margin-bottom:14px;">
            <div style="font-size:11px;color:#64748b;font-weight:700;margin-bottom:6px;text-transform:uppercase;">Đơn Thuốc</div>
            <table style="width:100%;border-collapse:collapse;font-size:12.5px;border:1px solid #e2e8f0;border-radius:8px;">
              <thead>
                <tr style="background:#f1f5f9;color:#475569;font-size:11px;">
                  <th style="padding:6px 8px;text-align:left;">#</th>
                  <th style="padding:6px 8px;text-align:left;">Tên Thuốc</th>
                  <th style="padding:6px 8px;text-align:center;">SL</th>
                  <th style="padding:6px 8px;text-align:left;">Cách Dùng</th>
                  <th style="padding:6px 8px;text-align:right;">Thành Tiền</th>
                </tr>
              </thead>
              <tbody>${prescRows}</tbody>
            </table>
          </div>
          ` : ''}

          <!-- Fee totals -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;font-size:13px;margin-bottom:14px;">
            <div class="invoice-detail-row"><span class="label">Phí khám lâm sàng:</span><span class="value" style="color:#0f172a;">${formatMoney(inv.examFee)}</span></div>
            ${inv.medicineFee > 0 ? `<div class="invoice-detail-row"><span class="label">Tiền thuốc:</span><span class="value" style="color:#0f172a;">${formatMoney(inv.medicineFee)}</span></div>` : ''}
            ${inv.serviceFee > 0 ? `<div class="invoice-detail-row"><span class="label">Dịch vụ bổ sung:</span><span class="value" style="color:#0f172a;">${formatMoney(inv.serviceFee)}</span></div>` : ''}
            ${inv.discount > 0 ? `<div class="invoice-detail-row"><span class="label">Giảm trừ:</span><span class="value" style="color:#16a34a;">- ${formatMoney(inv.discount)}</span></div>` : ''}
            <div class="invoice-detail-row" style="border-top:2px solid #86efac;margin-top:8px;padding-top:8px;">
              <span style="font-weight:800;color:#0f172a;font-size:15px;">TỔNG CỘNG:</span>
              <span style="font-family:'Space Grotesk';font-size:22px;font-weight:800;color:#16a34a;">${formatMoney(inv.totalAmount)}</span>
            </div>
          </div>

          <!-- Payment confirmation -->
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:12px 14px;font-size:13px;">
            <div style="font-weight:800;color:#166534;margin-bottom:6px;font-size:13.5px;">✅ Đã Thanh Toán</div>
            <div class="invoice-detail-row"><span class="label">Hình thức:</span><span class="value" style="color:#166534;">${inv.paymentMethod || '—'}</span></div>
            <div class="invoice-detail-row"><span class="label">Thời gian:</span><span class="value" style="color:#0f172a;">${formatTime(inv.paidAt)}</span></div>
            <div class="invoice-detail-row"><span class="label">Thu ngân:</span><span class="value" style="color:#0f172a;">${inv.cashierName || '—'}</span></div>
          </div>

          ${inv.advice ? `
          <div style="margin-top:12px;padding:10px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;font-size:12px;color:#0369a1;">
            <strong style="color:#0284c7;">📋 Lời dặn của bác sĩ:</strong> ${inv.advice}
          </div>` : ''}

        </div>
        <div class="cashier-modal-footer" style="justify-content:space-between;">
          <button class="cashier-btn-ghost" id="btn-print-receipt-action" style="border-radius:8px;padding:9px 16px;cursor:pointer;">🖨️ In Biên Nhận</button>
          <button class="btn-cashier-cancel" id="btn-close-receipt-btn">Đóng</button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { modalRoot.innerHTML = ''; };
  document.getElementById('btn-close-receipt')?.addEventListener('click', closeModal);
  document.getElementById('btn-close-receipt-btn')?.addEventListener('click', closeModal);
  document.getElementById('btn-print-receipt-action')?.addEventListener('click', () => {
    printReceipt(inv);
  });
  modalRoot.querySelector('#cashier-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
}

/* ── POLLING (realtime update from doctor) ── */
function startPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(() => {
    renderInvoiceTable();
  }, 2000);
}

/* ── FILTER TABS ── */
function setupFilterTabs() {
  document.querySelectorAll('.cashier-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cashier-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderInvoiceTable();
    });
  });
}

/* ── SEARCH ── */
function setupSearch() {
  const input = document.getElementById('cashier-search');
  if (!input) return;
  input.addEventListener('input', () => {
    searchQuery = input.value;
    renderInvoiceTable();
  });
}

/* ── REFRESH BUTTON ── */
function setupRefresh() {
  document.getElementById('btn-refresh-invoices')?.addEventListener('click', () => {
    renderInvoiceTable();
    showToast('info', 'Đã làm mới', 'Danh sách hóa đơn đã được cập nhật.');
  });
}

/* ── LOGOUT ── */
function setupLogout() {
  document.getElementById('btn-cashier-logout')?.addEventListener('click', () => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = '/dang-nhap.html';
  });
}

/* ── INIT ── */
function initCashierPage() {
  currentCashier = getCashierSession();

  // Redirect if not authenticated as cashier or admin
  if (!currentCashier) {
    window.location.href = '/dang-nhap.html?redirect=/thu-ngan.html';
    return;
  }

  // Set profile info
  const nameEl = document.getElementById('cashier-profile-name');
  if (nameEl) nameEl.textContent = currentCashier.name || 'Thu Ngân';

  const avatarEl = document.getElementById('cashier-avatar-img');
  if (avatarEl && currentCashier.avatar) avatarEl.src = currentCashier.avatar;

  // Initial render
  renderInvoiceTable();

  // Setup interactions
  setupFilterTabs();
  setupSearch();
  setupRefresh();
  setupLogout();

  // Start polling for new invoices from doctor
  startPolling();
}

document.addEventListener('DOMContentLoaded', initCashierPage);

