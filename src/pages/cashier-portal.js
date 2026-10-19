/* ============================================================
   src/pages/cashier-portal.js — Doctor4 Eye Clinic
   Cổng Thu Ngân: Nhận hóa đơn từ Bác Sĩ & Thu Viện Phí
   ============================================================ */

/* ── STORAGE KEYS ── */
const INVOICES_KEY     = 'doctor4_invoices_db';
const APPOINTMENTS_KEY = 'doctor4_appointments_db';
const PAYMENTS_KEY     = 'payments';
const SESSION_KEY      = 'doctor4_session';

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
    if (!list || list.length === 0) {
      list = [...SAMPLE_INVOICES];
      localStorage.setItem(INVOICES_KEY, JSON.stringify(list));
    }
    return list;
  } catch {
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

function formatTime(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString('vi-VN');
  } catch { return isoString; }
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
        `BS đã kê xong cho ${inv.patientName} — ${formatMoney(inv.totalAmount)}`);
    });
  }
  lastInvoiceCount = invoices.length;

  renderStats(invoices);

  // Filter
  const q = searchQuery.toLowerCase().trim();
  if (q) {
    invoices = invoices.filter(i =>
      (i.id && i.id.toLowerCase().includes(q)) ||
      (i.patientName && i.patientName.toLowerCase().includes(q)) ||
      (i.patientPhone && i.patientPhone.includes(q)) ||
      (i.doctorName && i.doctorName.toLowerCase().includes(q))
    );
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
        <h3>${currentFilter === 'pending' ? 'Không có hóa đơn chờ thu' : 'Chưa có hóa đơn nào'}</h3>
        <p>Hóa đơn sẽ hiện ở đây khi bác sĩ kê xong và bấm "Báo Xong & Chuyển Thu Ngân".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="cashier-table-wrapper">
      <table class="cashier-table">
        <thead>
          <tr>
            <th>Mã Hóa Đơn</th>
            <th>Bệnh Nhân</th>
            <th>Bác Sĩ / Phòng</th>
            <th>Dịch Vụ</th>
            <th>Thời Gian Kê</th>
            <th>Tổng Viện Phí</th>
            <th>Trạng Thái</th>
            <th style="text-align:right;">Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          ${invoices.map(inv => {
            const isPaid    = inv.status === 'paid';
            const statusBadge = isPaid
              ? `<span class="status-badge paid">✅ Đã thu tiền</span>`
              : `<span class="status-badge pending">⏳ Chờ thu tiền</span>`;

            return `
              <tr class="${!isPaid ? 'new-invoice-pulse' : ''}">
                <td>
                  <span class="invoice-id-badge">${inv.id}</span>
                  <div style="font-size:11px;color:#64748b;margin-top:4px;display:flex;align-items:center;gap:4px;">
                    <span>${inv.appointmentId || ''}</span>
                    ${(inv.queueNumber || inv.stt) ? `<span style="background:rgba(56,189,248,0.2);color:#38bdf8;padding:1px 6px;border-radius:4px;font-size:10.5px;font-weight:700;">STT #${String(inv.queueNumber || inv.stt).padStart(2, '0')}</span>` : ''}
                  </div>
                </td>
                <td>
                  <div class="patient-name-box">
                    <div class="name">${inv.patientName || '—'}</div>
                    <div class="meta">📞 ${inv.patientPhone || '—'} &nbsp;•&nbsp; ${inv.patientGender || ''} ${inv.patientAge || ''}</div>
                  </div>
                </td>
                <td>
                  <div class="doctor-room-box">
                    <div class="doc">👨‍⚕️ ${inv.doctorName || '—'}</div>
                    <div class="room">🏥 ${inv.roomName || '—'}</div>
                  </div>
                </td>
                <td>
                  <div style="font-size:13px;font-weight:600;color:#e2e8f0;max-width:180px;">${inv.serviceName || '—'}</div>
                  <div style="font-size:11px;color:#64748b;margin-top:2px;">${inv.diagnosis ? inv.diagnosis.slice(0, 60) + (inv.diagnosis.length > 60 ? '…' : '') : ''}</div>
                </td>
                <td style="font-size:12px;color:#94a3b8;white-space:nowrap;">${formatTime(inv.sentAt)}</td>
                <td>
                  <div class="amount-badge">${formatMoney(inv.totalAmount)}</div>
                  ${isPaid ? `<div style="font-size:11px;color:#22c55e;margin-top:2px;">${inv.paymentMethod || ''}</div>` : ''}
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

          <!-- Patient & Doctor Info -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(148,163,184,0.15);border-radius:10px;padding:12px;">
              <div style="font-size:11px;color:#94a3b8;font-weight:700;margin-bottom:6px;text-transform:uppercase;">Bệnh Nhân</div>
              <div style="font-weight:700;color:#fff;font-size:14px;">${inv.patientName}</div>
              <div style="font-size:12px;color:#94a3b8;">📞 ${inv.patientPhone || '—'}</div>
              <div style="font-size:12px;color:#94a3b8;">${inv.patientGender || ''} ${inv.patientAge || ''}</div>
            </div>
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(148,163,184,0.15);border-radius:10px;padding:12px;">
              <div style="font-size:11px;color:#94a3b8;font-weight:700;margin-bottom:6px;text-transform:uppercase;">Bác Sĩ</div>
              <div style="font-weight:700;color:#a5f3fc;font-size:13px;">👨‍⚕️ ${inv.doctorName}</div>
              <div style="font-size:12px;color:#94a3b8;">🏥 ${inv.roomName || '—'}</div>
              <div style="font-size:12px;color:#94a3b8;">🎯 ${inv.serviceName || '—'}</div>
            </div>
          </div>

          <!-- Diagnosis & Advice -->
          ${inv.diagnosis ? `
          <div style="background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.2);border-radius:10px;padding:12px;margin-bottom:14px;">
            <div style="font-size:11px;color:#38bdf8;font-weight:700;margin-bottom:4px;">🔬 CHẨN ĐOÁN</div>
            <div style="font-size:13px;color:#e2e8f0;font-weight:600;">${inv.diagnosis}</div>
            ${inv.advice ? `<div style="font-size:12px;color:#94a3b8;margin-top:4px;">📋 ${inv.advice}</div>` : ''}
            ${inv.revisitDate ? `<div style="font-size:12px;color:#fbbf24;margin-top:4px;">🗓️ Tái khám: ${inv.revisitDate}</div>` : ''}
          </div>
          ` : ''}

          <!-- Fee Breakdown -->
          <div style="margin-bottom:12px;">
            <div style="font-size:11px;color:#94a3b8;font-weight:700;margin-bottom:8px;text-transform:uppercase;">💰 Bảng Kê Viện Phí</div>
            <div class="invoice-detail-row">
              <span class="label">Phí khám lâm sàng:</span>
              <span class="value">${formatMoney(inv.examFee)}</span>
            </div>
            ${(inv.prescriptions || []).length > 0 ? `
            <div class="invoice-detail-row">
              <span class="label">Tiền thuốc (${(inv.prescriptions || []).length} loại):</span>
              <span class="value">${formatMoney(inv.medicineFee)}</span>
            </div>
            ` : ''}
            ${inv.serviceFee > 0 ? `
            <div class="invoice-detail-row">
              <span class="label">Dịch vụ / Kỹ thuật bổ sung:</span>
              <span class="value">${formatMoney(inv.serviceFee)}</span>
            </div>
            ` : ''}
            ${inv.discount > 0 ? `
            <div class="invoice-detail-row">
              <span class="label">Giảm trừ BHYT / Ưu đãi:</span>
              <span class="value" style="color:#22c55e;">- ${formatMoney(inv.discount)}</span>
            </div>
            ` : ''}
          </div>

          <!-- Prescriptions mini list -->
          ${prescRows ? `
          <div style="margin-bottom:12px;">
            <div style="font-size:11px;color:#94a3b8;font-weight:700;margin-bottom:6px;text-transform:uppercase;">📋 Đơn Thuốc Điều Trị</div>
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
              <button class="method-btn" data-method="Chuyển khoản ngân hàng">🏦 Chuyển khoản</button>
              <button class="method-btn" data-method="Thẻ tín dụng / Thẻ ATM">💳 Thẻ ngân hàng</button>
              <button class="method-btn" data-method="MoMo / VNPay">📱 Ví điện tử</button>
            </div>
          </div>

          <!-- Cashier name -->
          <div style="margin-top:10px;">
            <label style="font-size:12px;color:#94a3b8;font-weight:600;">Thu ngân xác nhận:</label>
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

  // Method selection
  modalRoot.querySelectorAll('.method-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modalRoot.querySelectorAll('.method-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedPaymentMethod = btn.getAttribute('data-method');
    });
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
          <div style="text-align:center;margin-bottom:16px;padding-bottom:16px;border-bottom:1px dashed rgba(148,163,184,0.2);">
            <div style="font-size:22px;margin-bottom:4px;">👁️ Doctor<strong style="color:#38bdf8;">4</strong> Eye Clinic</div>
            <div style="font-size:12px;color:#94a3b8;">Phòng Khám Mắt Chuyên Sâu | Hotline: 1800 1234</div>
            <div style="font-size:13px;font-weight:700;color:#22c55e;margin-top:8px;">✅ BIÊN NHẬN VIỆN PHÍ</div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;font-size:13px;">
            <div><span style="color:#94a3b8;">Mã hóa đơn:</span> <strong style="color:#38bdf8;">${inv.id}</strong></div>
            <div><span style="color:#94a3b8;">Mã lịch hẹn:</span> <strong>${inv.appointmentId || '—'}</strong></div>
            <div><span style="color:#94a3b8;">Bệnh nhân:</span> <strong>${inv.patientName}</strong></div>
            <div><span style="color:#94a3b8;">SĐT:</span> <strong>${inv.patientPhone || '—'}</strong></div>
            <div><span style="color:#94a3b8;">Bác sĩ:</span> <strong>${inv.doctorName}</strong></div>
            <div><span style="color:#94a3b8;">Phòng:</span> <strong>${inv.roomName || '—'}</strong></div>
            <div><span style="color:#94a3b8;">Dịch vụ:</span> <strong>${inv.serviceName || '—'}</strong></div>
            <div><span style="color:#94a3b8;">Chẩn đoán:</span> <strong>${inv.diagnosis || '—'}</strong></div>
            ${inv.revisitDate ? `<div><span style="color:#94a3b8;">Tái khám:</span> <strong style="color:#fbbf24;">${inv.revisitDate}</strong></div>` : ''}
          </div>

          <!-- Prescriptions -->
          ${prescRows ? `
          <div style="margin-bottom:14px;">
            <div style="font-size:11px;color:#94a3b8;font-weight:700;margin-bottom:6px;text-transform:uppercase;">Đơn Thuốc</div>
            <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
              <thead>
                <tr style="background:rgba(255,255,255,0.03);color:#94a3b8;font-size:11px;">
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
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(148,163,184,0.15);border-radius:10px;padding:12px;font-size:13px;margin-bottom:14px;">
            <div class="invoice-detail-row"><span class="label">Phí khám lâm sàng:</span><span class="value">${formatMoney(inv.examFee)}</span></div>
            ${inv.medicineFee > 0 ? `<div class="invoice-detail-row"><span class="label">Tiền thuốc:</span><span class="value">${formatMoney(inv.medicineFee)}</span></div>` : ''}
            ${inv.serviceFee > 0 ? `<div class="invoice-detail-row"><span class="label">Dịch vụ bổ sung:</span><span class="value">${formatMoney(inv.serviceFee)}</span></div>` : ''}
            ${inv.discount > 0 ? `<div class="invoice-detail-row"><span class="label">Giảm trừ:</span><span class="value" style="color:#22c55e;">- ${formatMoney(inv.discount)}</span></div>` : ''}
            <div class="invoice-detail-row" style="border-top:2px solid rgba(34,197,94,0.3);margin-top:8px;padding-top:8px;">
              <span style="font-weight:800;color:#fff;font-size:15px;">TỔNG CỘNG:</span>
              <span style="font-family:'Space Grotesk';font-size:20px;font-weight:800;color:#22c55e;">${formatMoney(inv.totalAmount)}</span>
            </div>
          </div>

          <!-- Payment confirmation -->
          <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.25);border-radius:10px;padding:12px;font-size:13px;">
            <div style="font-weight:700;color:#22c55e;margin-bottom:6px;">✅ Đã Thanh Toán</div>
            <div class="invoice-detail-row"><span class="label">Hình thức:</span><span class="value">${inv.paymentMethod || '—'}</span></div>
            <div class="invoice-detail-row"><span class="label">Thời gian:</span><span class="value">${formatTime(inv.paidAt)}</span></div>
            <div class="invoice-detail-row"><span class="label">Thu ngân:</span><span class="value">${inv.cashierName || '—'}</span></div>
          </div>

          ${inv.advice ? `
          <div style="margin-top:12px;padding:10px;background:rgba(56,189,248,0.06);border-radius:8px;font-size:12px;color:#94a3b8;">
            <strong style="color:#38bdf8;">📋 Lời dặn của bác sĩ:</strong> ${inv.advice}
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

