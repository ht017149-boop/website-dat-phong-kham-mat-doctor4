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
    return (user && (user.role === 'cashier' || user.role === 'admin')) ? user : null;
  } catch { return null; }
}

/* ── INVOICE MANAGER ── */
function getInvoices() {
  try {
    const raw = localStorage.getItem(INVOICES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
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
                  <div style="font-size:11px;color:#64748b;margin-top:4px;">${inv.appointmentId || ''}</div>
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

/* ── RECEIPT MODAL ── */
function openReceiptModal(inv) {
  const modalRoot = document.getElementById('cashier-modal-root');

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
          <button class="cashier-btn-ghost" onclick="window.print()" style="border-radius:8px;padding:9px 16px;">🖨️ In Biên Nhận</button>
          <button class="btn-cashier-cancel" id="btn-close-receipt-btn">Đóng</button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { modalRoot.innerHTML = ''; };
  document.getElementById('btn-close-receipt')?.addEventListener('click', closeModal);
  document.getElementById('btn-close-receipt-btn')?.addEventListener('click', closeModal);
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

