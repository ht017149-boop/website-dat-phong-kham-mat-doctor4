/* ============================================================
   payment.js — Doctor4 Eye Clinic
   Xử lý Cổng Thanh Toán Viện Phí & Đơn Thuốc
   Chỉ hiển thị số tiền thanh toán khi Bác sĩ đã hoàn thành kê đơn
   ============================================================ */

/*
========================================
THÔNG TIN TÀI KHOẢN NHẬN TIỀN CỦA PHÒNG KHÁM
========================================
*/
const BANK_ID = "MB";
const ACCOUNT_NUMBER = "0123456789";
const ACCOUNT_NAME = "PHONG KHAM MAT DOCTOR4";
const BANK_NAME = "MB Bank (Ngân hàng TMCP Quân đội)";

// Danh mục dịch vụ mặc định phòng khám
const CLINIC_SERVICES_DEFAULT = [
  {
    code: 'lasik',
    name: 'Phẫu thuật Khúc xạ (LASIK / SMILE Pro)',
    examFee: 500000,
    serviceFee: 25000000,
    price: '25.000.000đ - 45.000.000đ'
  },
  {
    code: 'cataract',
    name: 'Phẫu thuật Đục thủy tinh thể (Phaco)',
    examFee: 300000,
    serviceFee: 15000000,
    price: '15.000.000đ - 38.000.000đ'
  },
  {
    code: 'glocom',
    name: 'Khám & Điều trị Glôcôm (Cườm nước)',
    examFee: 350000,
    serviceFee: 1200000,
    price: '500.000đ - 2.500.000đ'
  },
  {
    code: 'pediatric',
    name: 'Khám Nhãn Nhi & Kính áp tròng Ortho-K',
    examFee: 300000,
    serviceFee: 8000000,
    price: '800.000đ - 18.000.000đ'
  },
  {
    code: 'retina',
    name: 'Bệnh lý Đáy mắt & Võng mạc',
    examFee: 400000,
    serviceFee: 2500000,
    price: '1.200.000đ - 6.500.000đ'
  },
  {
    code: 'cornea',
    name: 'Viêm Giác mạc & Khô mắt mạn tính',
    examFee: 250000,
    serviceFee: 1200000,
    price: '400.000đ - 3.200.000đ'
  },
  {
    code: 'oculoplastic',
    name: 'Tạo hình Thẩm mỹ Mắt & Sụp mí',
    examFee: 350000,
    serviceFee: 8000000,
    price: '6.000.000đ - 18.000.000đ'
  },
  {
    code: 'general',
    name: 'Khám Mắt Tổng Quát 12 Bước',
    examFee: 200000,
    serviceFee: 300000,
    price: '300.000đ - 600.000đ'
  }
];

function getServicesConfig() {
  try {
    const raw = localStorage.getItem('doctor4_services_pricing');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return CLINIC_SERVICES_DEFAULT;
}

function formatMoney(num) {
  return Number(num || 0).toLocaleString("vi-VN") + "đ";
}

// Phương thức thanh toán hiện tại
let currentMethod = 'vietqr'; // 'vietqr' | 'counter' | 'gateway'
let currentAmount = 0;
let lastKnownPrescribedState = null;

/*
========================================
TẢI DỮ LIỆU LỊCH KHÁM & ĐƠN THUỐC
========================================
*/
function getCurrentContext() {
  const urlParams = new URLSearchParams(window.location.search);
  const paramApptId = urlParams.get("appointmentId") || urlParams.get("id");

  let app = null;
  let inv = null;
  let allApps = [];

  try {
    allApps = JSON.parse(localStorage.getItem("doctor4_appointments_db") || "[]");
    if (paramApptId) {
      app = allApps.find(a => String(a.id) === String(paramApptId));
    }
    // Nếu không có ID truyền vào, ưu tiên ca đang chờ thanh toán gần nhất
    if (!app && allApps.length > 0) {
      app = allApps.find(a => a.status === 'pending' || a.billing?.paymentStatus === 'unpaid') || allApps[allApps.length - 1];
    }
  } catch (e) {
    console.error("Lỗi đọc doctor4_appointments_db:", e);
  }

  const effectiveApptId = paramApptId || (app ? app.id : "");

  // Tìm trong hóa đơn (nếu bác sĩ đã gửi hóa đơn sang thu ngân)
  try {
    const invoices = JSON.parse(localStorage.getItem("doctor4_invoices_db") || "[]");
    if (effectiveApptId) {
      inv = invoices.find(i => String(i.appointmentId) === String(effectiveApptId) || String(i.id) === String(effectiveApptId));
    }
  } catch (e) {
    console.error("Lỗi đọc doctor4_invoices_db:", e);
  }

  // Xác định Bác sĩ đã kê đơn thuốc hay chưa
  let hasPrescription = false;
  let prescriptionList = [];
  let diagnosis = '';
  let advice = '';

  if (inv && Array.isArray(inv.prescriptions) && inv.prescriptions.length > 0) {
    hasPrescription = true;
    prescriptionList = inv.prescriptions;
    diagnosis = inv.diagnosis || '';
    advice = inv.advice || '';
  } else if (app) {
    const med = app.medicalRecord;
    if (med) {
      const p = med.prescription || med.prescriptions;
      if (Array.isArray(p) && p.length > 0) {
        hasPrescription = true;
        prescriptionList = p;
      } else if (med.completedAt) {
        hasPrescription = true;
      }
      diagnosis = med.diagnosis || diagnosis;
      advice = med.advice || med.doctorAdvice || advice;
    }
    if (app.status === 'completed') {
      hasPrescription = true;
    }
  }

  const servicesList = getServicesConfig();
  const serviceCode = urlParams.get("serviceCode") || (app ? app.serviceCode : "general");
  const matchedService = servicesList.find(s => s.code === serviceCode || s.id === serviceCode) || servicesList[0];

  const patientName = urlParams.get("name") || (app ? app.patientName : (inv ? inv.patientName : "Nguyễn Văn A"));
  const doctorName = urlParams.get("doctor") || (app ? app.doctorName : (inv ? inv.doctorName : "BS. CKII Nguyễn Minh Quân"));
  const appointmentDate = urlParams.get("date") || (app ? app.date : new Date().toISOString().split("T")[0]);
  const appointmentTime = urlParams.get("time") || (app ? app.timeSlot : "08:30 - 09:30");
  const serviceName = urlParams.get("serviceName") || (app ? app.serviceName : (inv ? inv.serviceName : matchedService.name));
  const roomName = (app ? (app.roomName || 'Phòng 101 - Khám Mắt') : (inv ? inv.roomName : 'Phòng 101'));

  // Mã thanh toán
  let paymentId = urlParams.get("paymentId") || localStorage.getItem("currentPaymentId");
  if (!paymentId) {
    paymentId = "PAY" + Date.now();
    localStorage.setItem("currentPaymentId", paymentId);
  }

  // Tính toán số tiền viện phí
  let examFee = 0;
  let medicineFee = 0;
  let serviceFee = 0;
  let discount = 0;
  let totalAmount = 0;

  if (hasPrescription) {
    examFee = Number(app?.billing?.examFee ?? (inv?.examFee ?? (matchedService.examFee || 200000)));

    if (prescriptionList.length > 0) {
      medicineFee = prescriptionList.reduce((sum, d) => {
        const itemAmt = Number(d.amount) || ((Number(d.quantity) || 1) * (Number(d.price) || 0));
        return sum + itemAmt;
      }, 0);
    } else {
      medicineFee = Number(app?.billing?.medicineFee ?? (inv?.medicineFee ?? 0));
    }

    serviceFee = Number(app?.billing?.serviceFee ?? (inv?.serviceFee ?? 0));
    discount = Number(app?.billing?.discount ?? (inv?.discount ?? 0));

    totalAmount = Number(
      app?.billing?.totalAmount ?? 
      (inv?.totalAmount ?? Math.max(0, examFee + medicineFee + serviceFee - discount))
    );

    if (totalAmount === 0 && (examFee > 0 || medicineFee > 0)) {
      totalAmount = Math.max(0, examFee + medicineFee + serviceFee - discount);
    }
  }

  // Kiểm tra trạng thái đã thanh toán
  let isPaid = false;
  let paidRecord = null;
  if (app?.billing?.paymentStatus === 'paid' || inv?.status === 'paid') {
    isPaid = true;
  }

  try {
    const payList = JSON.parse(localStorage.getItem("payments") || "[]");
    const foundPay = payList.find(p => String(p.id) === String(paymentId) || String(p.appointmentId) === String(effectiveApptId));
    if (foundPay) {
      paidRecord = foundPay;
      if (foundPay.status === 'success') {
        isPaid = true;
      }
    }
  } catch (e) {}

  return {
    appointmentId: effectiveApptId,
    app,
    inv,
    patientName,
    doctorName,
    appointmentDate,
    appointmentTime,
    serviceName,
    roomName,
    paymentId,
    queueNumber: (app ? (app.queueNumber || app.stt) : (inv ? (inv.queueNumber || inv.stt) : 1)) || 1,
    transferContent: "THANHTOAN " + effectiveApptId,
    hasPrescription,
    prescriptionList,
    diagnosis,
    advice,
    examFee,
    medicineFee,
    serviceFee,
    discount,
    totalAmount,
    isPaid,
    paidRecord
  };
}

/*
========================================
HIỂN THỊ GIAO DIỆN THANH TOÁN
========================================
*/
function renderPaymentUI(ctx) {
  currentAmount = ctx.totalAmount;

  // Điền thông tin lịch khám
  const elApptId = document.getElementById("valAppointmentId");
  if (elApptId) elApptId.textContent = ctx.appointmentId;

  const elQueue = document.getElementById("valQueueNumber");
  if (elQueue) {
    const qNum = ctx.queueNumber || (ctx.app ? (ctx.app.queueNumber || ctx.app.stt) : 1) || 1;
    elQueue.textContent = `STT #${String(qNum).padStart(2, '0')}`;
  }

  const elPatient = document.getElementById("valPatientName");
  if (elPatient) elPatient.textContent = ctx.patientName;

  const elService = document.getElementById("valServiceName");
  if (elService) elService.textContent = ctx.serviceName;

  const elDoctor = document.getElementById("valDoctorName");
  if (elDoctor) elDoctor.textContent = ctx.doctorName;

  const elRoom = document.getElementById("valRoomName");
  if (elRoom) elRoom.textContent = ctx.roomName;

  const elDateTime = document.getElementById("valDateTime");
  if (elDateTime) elDateTime.textContent = `${ctx.appointmentTime} — ${ctx.appointmentDate}`;

  // Trạng thái ca khám
  const elStatus = document.getElementById("valExamStatus");
  if (elStatus) {
    if (ctx.isPaid) {
      elStatus.className = "status-badge-inline completed";
      elStatus.textContent = "✅ Đã thanh toán & hoàn tất";
    } else if (ctx.hasPrescription) {
      elStatus.className = "status-badge-inline completed";
      elStatus.textContent = "✅ Đã có đơn thuốc";
    } else {
      elStatus.className = "status-badge-inline waiting";
      elStatus.textContent = "⏳ Chờ bác sĩ kê đơn";
    }
  }

  // Khung Banners
  const waitingBanner = document.getElementById("prescriptionWaitingBanner");
  const completedBanner = document.getElementById("prescriptionCompletedBanner");
  const diagnosisText = document.getElementById("prescriptionDiagnosisText");
  const prescriptionBox = document.getElementById("prescriptionBox");
  const lockedNotice = document.getElementById("paymentLockedNotice");
  const step3Methods = document.getElementById("step-3-container");
  const step4Exec = document.getElementById("step-4-container");
  const receiptCard = document.getElementById("step-6-receipt");

  // ============================================
  // TRƯỜNG HỢP 1: BÁC SĨ CHƯA KÊ ĐƠN THUỐC
  // ============================================
  if (!ctx.hasPrescription) {
    if (waitingBanner) waitingBanner.style.display = "flex";
    if (completedBanner) completedBanner.style.display = "none";
    if (prescriptionBox) prescriptionBox.style.display = "none";
    if (lockedNotice) lockedNotice.style.display = "block";
    if (step3Methods) step3Methods.style.display = "none";
    if (step4Exec) step4Exec.style.display = "none";
    if (receiptCard) receiptCard.style.display = "none";

    // Phân định chi phí: ẨN SỐ TIỀN THANH TOÁN
    const elExamFee = document.getElementById("valExamFee");
    if (elExamFee) elExamFee.textContent = "Chờ bác sĩ kết luận";

    const elMedFee = document.getElementById("valMedicineFee");
    if (elMedFee) elMedFee.textContent = "Chờ bác sĩ kê đơn";

    const rowService = document.getElementById("rowServiceFee");
    if (rowService) rowService.style.display = "none";

    const rowDiscount = document.getElementById("rowDiscount");
    if (rowDiscount) rowDiscount.style.display = "none";

    const elTotalDue = document.getElementById("valTotalDue");
    if (elTotalDue) {
      elTotalDue.innerHTML = `<span class="badge-waiting-amount">⏳ Chờ bác sĩ kê đơn</span>`;
    }

    const elTotalNote = document.getElementById("valTotalDueNote");
    if (elTotalNote) elTotalNote.textContent = "Số tiền thanh toán sẽ hiển thị sau khi kê đơn";

    return;
  }

  // ============================================
  // TRƯỜNG HỢP 2: BÁC SĨ ĐÃ KÊ XONG ĐƠN THUỐC
  // ============================================
  if (waitingBanner) waitingBanner.style.display = "none";
  if (completedBanner) completedBanner.style.display = "flex";
  if (lockedNotice) lockedNotice.style.display = "none";

  if (diagnosisText) {
    diagnosisText.textContent = `Chẩn đoán: ${ctx.diagnosis || 'Khám và tư vấn chuyên sâu về mắt'} · Lời dặn: ${ctx.advice || 'Dùng thuốc đều đặn theo chỉ định'}`;
  }

  // Hiển thị khung đơn thuốc chi tiết
  if (prescriptionBox) {
    prescriptionBox.style.display = "block";
    const elPrescriber = document.getElementById("valDoctorPrescriber");
    if (elPrescriber) elPrescriber.textContent = ctx.doctorName;

    const elAdvice = document.getElementById("valDoctorAdviceText");
    if (elAdvice) elAdvice.textContent = ctx.advice || "Nhỏ thuốc đúng liều lượng, giữ vệ sinh mắt sạch sẽ, tái khám đúng hẹn.";

    const tbody = document.getElementById("prescriptionTableBody");
    if (tbody) {
      if (ctx.prescriptionList.length > 0) {
        tbody.innerHTML = ctx.prescriptionList.map((d, idx) => {
          const qty = Number(d.quantity) || 1;
          const price = Number(d.price) || 0;
          const lineTotal = Number(d.amount) || (qty * price);
          return `
            <tr>
              <td style="text-align: center; font-weight: 700; color: #64748b;">${idx + 1}</td>
              <td>
                <strong style="color: #0f172a;">${d.name}</strong>
                ${d.type ? `<div style="font-size: 0.75rem; color: #64748b;">${d.type}</div>` : ''}
              </td>
              <td style="text-align: center; font-weight: 700; color: #0284c7;">${qty}</td>
              <td style="text-align: right; color: #475569;">${formatMoney(price)}</td>
              <td style="color: #334155; font-size: 0.84rem;">${d.dosage || 'Theo chỉ định của bác sĩ'}</td>
              <td style="text-align: right; font-weight: 700; color: #16a34a;">${formatMoney(lineTotal)}</td>
            </tr>
          `;
        }).join('');
      } else {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; color: #64748b; padding: 16px;">
              Bác sĩ chỉ định chế độ chăm sóc và theo dõi lâm sàng (không dùng thuốc kê đơn).
            </td>
          </tr>
        `;
      }
    }
  }

  // HIỂN THỊ ĐẦY ĐỦ SỐ TIỀN ĐỂ KHÁCH HÀNG THANH TOÁN
  const elExamFee = document.getElementById("valExamFee");
  if (elExamFee) elExamFee.textContent = formatMoney(ctx.examFee);

  const elMedFee = document.getElementById("valMedicineFee");
  if (elMedFee) elMedFee.textContent = formatMoney(ctx.medicineFee);

  const rowService = document.getElementById("rowServiceFee");
  const elServiceFee = document.getElementById("valServiceFee");
  if (ctx.serviceFee > 0) {
    if (rowService) rowService.style.display = "flex";
    if (elServiceFee) elServiceFee.textContent = formatMoney(ctx.serviceFee);
  } else {
    if (rowService) rowService.style.display = "none";
  }

  const rowDiscount = document.getElementById("rowDiscount");
  const elDiscount = document.getElementById("valDiscount");
  if (ctx.discount > 0) {
    if (rowDiscount) rowDiscount.style.display = "flex";
    if (elDiscount) elDiscount.textContent = "- " + formatMoney(ctx.discount);
  } else {
    if (rowDiscount) rowDiscount.style.display = "none";
  }

  const elTotalDue = document.getElementById("valTotalDue");
  if (elTotalDue) {
    elTotalDue.innerHTML = `<span style="font-size: 1.45rem; font-weight: 800; color: #16a34a;">${formatMoney(ctx.totalAmount)}</span>`;
  }

  const elTotalNote = document.getElementById("valTotalDueNote");
  if (elTotalNote) elTotalNote.textContent = "Tổng viện phí và đơn thuốc cần thanh toán";

  // Cập nhật thông tin VietQR
  const qrUrl = "https://img.vietqr.io/image/" +
    BANK_ID + "-" +
    ACCOUNT_NUMBER + "-compact2.png" +
    "?amount=" + ctx.totalAmount +
    "&addInfo=" + encodeURIComponent(ctx.transferContent) +
    "&accountName=" + encodeURIComponent(ACCOUNT_NAME);

  const qrImg = document.getElementById("qrCodeImage");
  if (qrImg) qrImg.src = qrUrl;

  const bankNameEl = document.getElementById("valBankName");
  if (bankNameEl) bankNameEl.textContent = BANK_NAME;

  const accNumEl = document.getElementById("valAccountNumber");
  if (accNumEl) accNumEl.textContent = ACCOUNT_NUMBER;

  const accNameEl = document.getElementById("valAccountName");
  if (accNameEl) accNameEl.textContent = ACCOUNT_NAME;

  const transferAmtEl = document.getElementById("valTransferAmount");
  if (transferAmtEl) transferAmtEl.textContent = formatMoney(ctx.totalAmount);

  const transferContentEl = document.getElementById("valTransferContent");
  if (transferContentEl) transferContentEl.textContent = ctx.transferContent;

  const gatewayAmt = document.getElementById("gatewayAmountText");
  if (gatewayAmt) gatewayAmt.textContent = formatMoney(ctx.totalAmount);

  const counterCode = document.getElementById("counterApptCode");
  if (counterCode) counterCode.textContent = ctx.appointmentId;

  // Nếu đã thanh toán rồi -> Hiển thị trạng thái đã hoàn tất
  if (ctx.isPaid) {
    if (step3Methods) step3Methods.style.display = "none";
    if (step4Exec) step4Exec.style.display = "none";
    updateVerificationUI("success");
    const actionsGrp = document.querySelector(".actions-group");
    if (actionsGrp) actionsGrp.style.display = "none";
  } else {
    // Chưa thanh toán -> MỞ PHẦN CHỌN PHƯƠNG THỨC VÀ THANH TOÁN
    if (step3Methods) step3Methods.style.display = "block";
    if (step4Exec) step4Exec.style.display = "block";

    const actionsGrp = document.querySelector(".actions-group");
    if (actionsGrp) actionsGrp.style.display = "flex";
  }
}

/*
========================================
CHỌN PHƯƠNG THỨC THANH TOÁN
========================================
*/
function selectPaymentMethod(method) {
  currentMethod = method;

  document.querySelectorAll(".method-card").forEach(c => c.classList.remove("selected"));
  const activeCard = document.getElementById(`method-card-${method}`);
  if (activeCard) activeCard.classList.add("selected");

  document.querySelectorAll(".exec-panel").forEach(p => p.classList.remove("active"));
  const activePanel = document.getElementById(`panel-${method}`);
  if (activePanel) activePanel.classList.add("active");

  const tagEl = document.getElementById("current-method-tag");
  const confirmBtn = document.getElementById("btnConfirmPaid");

  if (method === 'vietqr') {
    if (tagEl) tagEl.textContent = "Chuyển khoản VietQR";
    if (confirmBtn) confirmBtn.innerHTML = "<span>✅ Tôi đã thanh toán (Gửi yêu cầu xác minh)</span>";
  } else if (method === 'counter') {
    if (tagEl) tagEl.textContent = "Thanh toán trực tiếp tại quầy thu ngân";
    if (confirmBtn) confirmBtn.innerHTML = "<span>🏢 Tôi chọn thanh toán tại quầy (Xác nhận đặt hẹn)</span>";
  } else {
    if (tagEl) tagEl.textContent = "Cổng thanh toán điện tử";
    if (confirmBtn) confirmBtn.innerHTML = "<span>⚡ Tiếp tục qua cổng thanh toán</span>";
  }
}
window.selectPaymentMethod = selectPaymentMethod;

/*
========================================
XÁC MINH & LƯU GIAO DỊCH
========================================
*/
function getPaymentsList() {
  try {
    const raw = localStorage.getItem("payments");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function savePaymentsList(list) {
  localStorage.setItem("payments", JSON.stringify(list));
}

function handleCustomerConfirmed() {
  const ctx = getCurrentContext();
  if (!ctx.hasPrescription) {
    alert("Bác sĩ chưa hoàn thành kê đơn thuốc. Vui lòng chờ bác sĩ khám và kê đơn trước khi thanh toán.");
    return;
  }

  let list = getPaymentsList();
  let existingIndex = list.findIndex(p => String(p.id) === String(ctx.paymentId) || String(p.appointmentId) === String(ctx.appointmentId));

  const status = (currentMethod === 'counter') ? 'counter_pending' : 'pending';

  const paymentRecord = {
    id: ctx.paymentId,
    paymentId: ctx.paymentId,
    appointmentId: ctx.appointmentId,
    patientName: ctx.patientName,
    name: ctx.patientName,
    doctorName: ctx.doctorName,
    doctor: ctx.doctorName,
    serviceName: ctx.serviceName,
    date: ctx.appointmentDate,
    time: ctx.appointmentTime,
    amount: ctx.totalAmount,
    examFee: ctx.examFee,
    medicineFee: ctx.medicineFee,
    prescriptions: ctx.prescriptionList,
    paymentMethod: currentMethod,
    bank: BANK_NAME,
    accountNumber: ACCOUNT_NUMBER,
    accountName: ACCOUNT_NAME,
    content: ctx.transferContent,
    status: status,
    createdAt: new Date().toLocaleString("vi-VN"),
    updatedAt: new Date().toLocaleString("vi-VN")
  };

  if (existingIndex !== -1) {
    list[existingIndex] = { ...list[existingIndex], ...paymentRecord };
  } else {
    list.unshift(paymentRecord);
  }

  savePaymentsList(list);
  localStorage.setItem("payment_" + ctx.paymentId, JSON.stringify(paymentRecord));
  localStorage.setItem("currentPaymentId", ctx.paymentId);

  updateVerificationUI(status);

  if (currentMethod === 'counter') {
    alert(
      "Đã ghi nhận yêu cầu thanh toán tại Quầy Thu Ngân!\n\n" +
      "Mã lịch hẹn: " + ctx.appointmentId + "\n" +
      "Số tiền: " + formatMoney(ctx.totalAmount) + "\n\n" +
      "Vui lòng đến Quầy Thu Ngân (Tầng 1) để nhân viên hỗ trợ thu tiền và in hóa đơn thuốc."
    );
  } else {
    alert(
      "Đã gửi yêu cầu xác minh thanh toán thành công!\n\n" +
      "Mã giao dịch: " + ctx.paymentId + "\n" +
      "Mã lịch hẹn: " + ctx.appointmentId + "\n" +
      "Số tiền: " + formatMoney(ctx.totalAmount) + "\n\n" +
      "Hệ thống đang đối chiếu tự động với ngân hàng. Quý khách vui lòng chờ vài giây."
    );
  }
}
window.handleCustomerConfirmed = handleCustomerConfirmed;

// Giả lập Webhook Ngân hàng / Cổng thanh toán báo Có tức thì
function simulateInstantVerification() {
  const ctx = getCurrentContext();
  if (!ctx.hasPrescription) {
    alert("Bác sĩ chưa kê đơn thuốc. Vui lòng bấm 'Giả lập Bác sĩ kê đơn ngay' trước khi thanh toán.");
    return;
  }

  const confirmedTime = new Date().toLocaleString("vi-VN");
  let list = getPaymentsList();
  let existingIndex = list.findIndex(p => String(p.id) === String(ctx.paymentId) || String(p.appointmentId) === String(ctx.appointmentId));

  const verifiedRecord = {
    id: ctx.paymentId,
    paymentId: ctx.paymentId,
    appointmentId: ctx.appointmentId,
    patientName: ctx.patientName,
    name: ctx.patientName,
    doctorName: ctx.doctorName,
    doctor: ctx.doctorName,
    serviceName: ctx.serviceName,
    date: ctx.appointmentDate,
    time: ctx.appointmentTime,
    amount: ctx.totalAmount,
    examFee: ctx.examFee,
    medicineFee: ctx.medicineFee,
    prescriptions: ctx.prescriptionList,
    paymentMethod: currentMethod,
    bank: BANK_NAME,
    accountNumber: ACCOUNT_NUMBER,
    accountName: ACCOUNT_NAME,
    content: ctx.transferContent,
    status: "success",
    confirmedAt: confirmedTime,
    paidAt: confirmedTime,
    verifiedBy: "MB Bank VietQR Webhook (Tự động)"
  };

  if (existingIndex !== -1) {
    list[existingIndex] = { ...list[existingIndex], ...verifiedRecord };
  } else {
    list.unshift(verifiedRecord);
  }

  savePaymentsList(list);
  localStorage.setItem("payment_" + ctx.paymentId, JSON.stringify(verifiedRecord));

  // Đồng bộ lịch hẹn và hóa đơn sang đã thanh toán
  syncAppointmentAndInvoicePaid(ctx.appointmentId, verifiedRecord);

  // Cập nhật trạng thái xác minh thành công
  updateVerificationUI("success");
}
window.simulateInstantVerification = simulateInstantVerification;

function triggerGatewaySimulate(gateway) {
  const ctx = getCurrentContext();
  const name = gateway === 'vnpay' ? 'VNPAY-QR' : 'Ví MoMo';
  const ok = confirm(`Bạn có muốn mô phỏng xác nhận thanh toán số tiền ${formatMoney(ctx.totalAmount)} qua cổng ${name}?`);
  if (ok) {
    currentMethod = gateway;
    simulateInstantVerification();
  }
}
window.triggerGatewaySimulate = triggerGatewaySimulate;

function updateVerificationUI(status) {
  const box = document.getElementById("verificationStatusBox");
  const icon = document.getElementById("verificationIcon");
  const title = document.getElementById("verificationTitle");
  const subtitle = document.getElementById("verificationSubtitle");

  if (!box) return;

  if (status === "success") {
    box.className = "verification-box success";
    if (icon) icon.textContent = "✅";
    if (title) title.textContent = "Giao dịch đã được đối chiếu & xác minh thành công!";
    if (subtitle) {
      subtitle.innerHTML = `
        <div style="margin-bottom: 12px; font-weight: 600;">Hệ thống đã nhận đủ số tiền viện phí & đơn thuốc. Quý khách vui lòng đến quầy tiếp đón hoặc phòng khám đúng giờ.</div>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 10px;">
          <button type="button" onclick="goToAppointmentTicket()" style="padding: 10px 18px; background: #0284c7; color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px;">🎫 Xem vé khám & phòng</button>
          <a href="/index.html" style="padding: 10px 18px; background: #16a34a; color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; display: inline-flex; align-items: center;">🏠 Về Trang chủ</a>
        </div>
      `;
    }
    const actionsGrp = document.querySelector(".actions-group");
    if (actionsGrp) actionsGrp.style.display = "none";
  } else if (status === "pending" || status === "counter_pending") {
    box.className = "verification-box pending";
    if (icon) icon.textContent = "⏳";
    if (title) title.textContent = "Đang chờ đối chiếu giao dịch từ Ngân hàng / Quầy thu ngân...";
    if (subtitle) subtitle.textContent = (status === 'counter_pending') 
      ? "Đang chờ nhân viên quầy thu ngân nhận tiền và in phiếu thu." 
      : "Hệ thống tự động lắng nghe xác nhận từ ngân hàng...";
  } else if (status === "cancel") {
    box.className = "verification-box";
    box.style.borderColor = "#ef4444";
    box.style.background = "#fee2e2";
    box.style.color = "#991b1b";
    if (icon) icon.textContent = "❌";
    if (title) title.textContent = "Giao dịch đã bị từ chối hoặc hủy bỏ";
    if (subtitle) subtitle.textContent = "Vui lòng quét lại mã QR hoặc liên hệ hotline phòng khám để được hỗ trợ.";
  }
}

function syncAppointmentAndInvoicePaid(appId, paymentRec) {
  // 1. Cập nhật Appointments DB
  try {
    const raw = localStorage.getItem("doctor4_appointments_db");
    if (raw) {
      let apps = JSON.parse(raw);
      const idx = apps.findIndex(a => String(a.id) === String(appId));
      if (idx !== -1) {
        apps[idx].billing = {
          ...(apps[idx].billing || {}),
          totalAmount: paymentRec.amount,
          paymentStatus: "paid",
          paymentMethod: paymentRec.paymentMethod || "VietQR",
          paidAt: paymentRec.confirmedAt || new Date().toISOString()
        };
        localStorage.setItem("doctor4_appointments_db", JSON.stringify(apps));
      }
    }
  } catch (e) {
    console.error("Lỗi đồng bộ lịch hẹn:", e);
  }

  // 2. Cập nhật Invoices DB
  try {
    const rawInv = localStorage.getItem("doctor4_invoices_db");
    if (rawInv) {
      let invoices = JSON.parse(rawInv);
      const invIdx = invoices.findIndex(i => String(i.appointmentId) === String(appId));
      if (invIdx !== -1) {
        invoices[invIdx].status = "paid";
        invoices[invIdx].paidAt = paymentRec.confirmedAt || new Date().toISOString();
        invoices[invIdx].paymentMethod = paymentRec.paymentMethod || "VietQR";
        localStorage.setItem("doctor4_invoices_db", JSON.stringify(invoices));
      }
    }
  } catch (e) {
    console.error("Lỗi đồng bộ hóa đơn:", e);
  }
}

/*
========================================
HIỂN THỊ BIÊN NHẬN ĐIỆN TỬ
========================================
*/
function renderReceipt(payment) {
  const actionsGrp = document.querySelector(".actions-group");
  if (actionsGrp) actionsGrp.style.display = "none";

  const step3Methods = document.getElementById("step-3-container");
  if (step3Methods) step3Methods.style.display = "none";

  const step4Exec = document.getElementById("step-4-container");
  if (step4Exec) step4Exec.style.display = "none";

  updateVerificationUI("success");
}

/*
========================================
GIẢ LẬP BÁC SĨ KÊ ĐƠN THUỐC NGAY (DEMO)
========================================
*/
function simulateDoctorPrescribe() {
  const ctx = getCurrentContext();
  const samplePrescription = [
    { 
      name: "Systane Ultra (Lọ 10ml)", 
      type: "Nước mắt nhân tạo bôi trơn giác mạc", 
      quantity: 2, 
      price: 95000, 
      amount: 190000, 
      dosage: "Nhỏ 1 giọt x 3-4 lần/ngày vào cả 2 mắt" 
    },
    { 
      name: "Cravit 0.5% (Lọ 5ml)", 
      type: "Kháng sinh nhãn khoa Levofloxacin", 
      quantity: 1, 
      price: 115000, 
      amount: 115000, 
      dosage: "Nhỏ 1 giọt x 3 lần/ngày cách các thuốc khác 10 phút" 
    }
  ];

  const examFee = 200000;
  const medicineFee = 305000;
  const totalAmount = 505000;

  try {
    const rawApps = localStorage.getItem("doctor4_appointments_db");
    let apps = rawApps ? JSON.parse(rawApps) : [];
    const idx = apps.findIndex(a => String(a.id) === String(ctx.appointmentId));

    const updatedMedRecord = {
      examDate: new Date().toISOString().split("T")[0],
      doctorName: ctx.doctorName,
      diagnosis: "Khô mắt mỏi điều tiết & Viêm kết mạc nhẹ",
      advice: "Tránh nhìn màn hình vi tính liên tục quá 45 phút, chớp mắt thường xuyên và nhỏ thuốc đúng cữ.",
      revisitDate: "2026-10-30",
      prescription: samplePrescription,
      prescriptions: samplePrescription,
      completedAt: new Date().toISOString()
    };

    const updatedBilling = {
      examFee,
      medicineFee,
      serviceFee: 0,
      discount: 0,
      totalAmount,
      paymentStatus: 'unpaid'
    };

    if (idx !== -1) {
      apps[idx].status = 'completed';
      apps[idx].medicalRecord = updatedMedRecord;
      apps[idx].billing = updatedBilling;
    } else {
      apps.unshift({
        id: ctx.appointmentId,
        patientName: ctx.patientName,
        doctorName: ctx.doctorName,
        serviceName: ctx.serviceName,
        date: ctx.appointmentDate,
        timeSlot: ctx.appointmentTime,
        status: 'completed',
        medicalRecord: updatedMedRecord,
        billing: updatedBilling
      });
    }
    localStorage.setItem("doctor4_appointments_db", JSON.stringify(apps));

    // Thêm/Cập nhật Hóa Đơn vào doctor4_invoices_db
    const rawInv = localStorage.getItem("doctor4_invoices_db");
    let invoices = rawInv ? JSON.parse(rawInv) : [];
    const invIdx = invoices.findIndex(i => String(i.appointmentId) === String(ctx.appointmentId));

    const invoiceObj = {
      id: invIdx >= 0 ? invoices[invIdx].id : 'HD-2026-' + Math.floor(1000 + Math.random() * 9000),
      appointmentId: ctx.appointmentId,
      patientName: ctx.patientName,
      doctorName: ctx.doctorName,
      serviceName: ctx.serviceName,
      diagnosis: updatedMedRecord.diagnosis,
      advice: updatedMedRecord.advice,
      prescriptions: samplePrescription,
      examFee,
      medicineFee,
      serviceFee: 0,
      discount: 0,
      totalAmount,
      status: 'pending',
      sentAt: new Date().toISOString()
    };

    if (invIdx >= 0) {
      invoices[invIdx] = invoiceObj;
    } else {
      invoices.unshift(invoiceObj);
    }
    localStorage.setItem("doctor4_invoices_db", JSON.stringify(invoices));

    alert("🩺 Bác sĩ đã hoàn tất khám và kê đơn thuốc thành công!\n\nTổng viện phí (" + formatMoney(totalAmount) + ") và đơn thuốc đã sẵn sàng để quý khách thanh toán.");
    initPaymentPage();
  } catch (err) {
    console.error("Lỗi giả lập kê đơn:", err);
    alert("Có lỗi khi tạo đơn thuốc: " + err.message);
  }
}
window.simulateDoctorPrescribe = simulateDoctorPrescribe;

/*
========================================
THEO DÕI TRẠNG THÁI THỜI GIAN THỰC (POLLING & STORAGE)
========================================
*/
function checkRealtimeStatus(manual = false) {
  const ctx = getCurrentContext();

  // Kiểm tra nếu Bác sĩ vừa hoàn tất kê đơn ở tab/cửa sổ khác
  if (lastKnownPrescribedState === false && ctx.hasPrescription === true) {
    lastKnownPrescribedState = true;
    renderPaymentUI(ctx);
    if (!manual) {
      alert("🎉 Bác sĩ đã hoàn tất ca khám và kê đơn thuốc!\n\nSố tiền thanh toán: " + formatMoney(ctx.totalAmount) + "\nQuý khách có thể quét mã VietQR hoặc thanh toán tại quầy.");
    }
    return;
  }

  lastKnownPrescribedState = ctx.hasPrescription;

  if (manual) {
    renderPaymentUI(ctx);
    if (ctx.hasPrescription) {
      alert("✅ Đã cập nhật! Bác sĩ đã kê đơn thuốc thành công. Tổng tiền thanh toán: " + formatMoney(ctx.totalAmount));
    } else {
      alert("⏳ Bác sĩ hiện chưa hoàn tất đơn thuốc. Vui lòng chờ bác sĩ khám và kê đơn trước.");
    }
    return;
  }

  // Kiểm tra trạng thái thanh toán đã được duyệt chưa
  if (ctx.isPaid) {
    updateVerificationUI("success");
  }
}
window.checkRealtimeStatus = checkRealtimeStatus;

/*
========================================
TIỆN ÍCH SAO CHÉP & ĐIỀU HƯỚNG
========================================
*/
function copyText(elementId, successMsg) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const text = el.textContent.trim();
  navigator.clipboard.writeText(text).then(() => {
    alert(successMsg || "Đã sao chép: " + text);
  }).catch(() => {
    prompt("Vui lòng sao chép thủ công:", text);
  });
}
window.copyText = copyText;

function copyRawText(text, successMsg) {
  navigator.clipboard.writeText(String(text)).then(() => {
    alert(successMsg || "Đã sao chép!");
  }).catch(() => {
    prompt("Vui lòng sao chép thủ công:", String(text));
  });
}
window.copyRawText = copyRawText;

function goToAppointmentTicket() {
  const ctx = getCurrentContext();
  window.location.href = `/lich-kham.html?code=${encodeURIComponent(ctx.appointmentId)}`;
}
window.goToAppointmentTicket = goToAppointmentTicket;

/*
========================================
KHỞI ĐỘNG TRANG THANH TOÁN
========================================
*/
function initPaymentPage() {
  const ctx = getCurrentContext();
  lastKnownPrescribedState = ctx.hasPrescription;
  renderPaymentUI(ctx);

  // Lắng nghe sự kiện storage từ các tab/cửa sổ khác (ví dụ: Bác sĩ vừa nhấn Kê đơn ở tab bac-si.html)
  window.addEventListener("storage", () => {
    checkRealtimeStatus(false);
  });

  // Polling liên tục mỗi 1.5 giây
  setInterval(() => {
    checkRealtimeStatus(false);
  }, 1500);
}

document.addEventListener("DOMContentLoaded", initPaymentPage);