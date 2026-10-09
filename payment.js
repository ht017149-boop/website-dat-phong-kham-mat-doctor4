/* ============================================================
   payment.js — Doctor4 Eye Clinic
   Xử lý toàn bộ Quy trình 6 Bước Thanh toán & Xác minh Đặt lịch
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

// Danh mục dịch vụ mặc định phòng khám (Khoản thu trước & Khoản thanh toán sau)
const CLINIC_SERVICES_DEFAULT = [
  {
    code: 'lasik',
    name: 'Phẫu thuật Khúc xạ (LASIK / SMILE Pro)',
    examFee: 500000,
    serviceFee: 25000000,
    price: '25.000.000đ - 45.000.000đ',
    prepaidDesc: 'Phí khám khúc xạ chuyên sâu 10 bước & đo bản đồ giác mạc (Thu trước)',
    postpaidDesc: 'Chi phí phẫu thuật Femto-LASIK / SMILE Pro (Thanh toán sau tại viện)'
  },
  {
    code: 'cataract',
    name: 'Phẫu thuật Đục thủy tinh thể (Phaco)',
    examFee: 300000,
    serviceFee: 15000000,
    price: '15.000.000đ - 38.000.000đ',
    prepaidDesc: 'Phí khám sinh hiển vi, đo nhãn áp & soi đục thủy tinh thể (Thu trước)',
    postpaidDesc: 'Chi phí phẫu thuật Phaco thay thủy tinh thể nhân tạo (Thanh toán sau tại viện)'
  },
  {
    code: 'glocom',
    name: 'Khám & Điều trị Glôcôm (Cườm nước)',
    examFee: 350000,
    serviceFee: 1200000,
    price: '500.000đ - 2.500.000đ',
    prepaidDesc: 'Phí khám chuyên khoa Glôcôm, đo nhãn áp kế & soi góc tiền phòng (Thu trước)',
    postpaidDesc: 'Chi phí laser tạo hình bè hoặc thủ thuật hạ áp nếu có (Thanh toán sau)'
  },
  {
    code: 'pediatric',
    name: 'Khám Nhãn Nhi & Kính áp tròng Ortho-K',
    examFee: 300000,
    serviceFee: 8000000,
    price: '800.000đ - 18.000.000đ',
    prepaidDesc: 'Phí khám thị lực trẻ em, đo khúc xạ liệt điều tiết & thử kính (Thu trước)',
    postpaidDesc: 'Chi phí bộ kính định hình ban đêm Ortho-K nếu đăng ký (Thanh toán sau)'
  },
  {
    code: 'retina',
    name: 'Bệnh lý Đáy mắt & Võng mạc',
    examFee: 400000,
    serviceFee: 2500000,
    price: '1.200.000đ - 6.500.000đ',
    prepaidDesc: 'Phí khám đáy mắt chuyên sâu & chụp cắt lớp quang học OCT (Thu trước)',
    postpaidDesc: 'Chi phí laser đáy mắt hoặc tiêm thuốc nội nhãn (Thanh toán sau nếu chỉ định)'
  },
  {
    code: 'cornea',
    name: 'Viêm Giác mạc & Khô mắt mạn tính',
    examFee: 250000,
    serviceFee: 1200000,
    price: '400.000đ - 3.200.000đ',
    prepaidDesc: 'Phí khám kiểm tra giác mạc, nhuộm huỳnh quang & đo phim nước mắt (Thu trước)',
    postpaidDesc: 'Chi phí liệu trình ánh sáng xung IPL hoặc thuốc chuyên khoa (Thanh toán sau)'
  },
  {
    code: 'oculoplastic',
    name: 'Tạo hình Thẩm mỹ Mắt & Sụp mí',
    examFee: 350000,
    serviceFee: 8000000,
    price: '6.000.000đ - 18.000.000đ',
    prepaidDesc: 'Phí tư vấn bác sĩ phẫu thuật & đo cơ nâng mi, thiết kế nếp mí (Thu trước)',
    postpaidDesc: 'Chi phí phẫu thuật tạo hình mí mắt / tiểu phẫu (Thanh toán sau tại viện)'
  },
  {
    code: 'general',
    name: 'Khám Mắt Tổng Quát 12 Bước',
    examFee: 200000,
    serviceFee: 300000,
    price: '300.000đ - 600.000đ',
    prepaidDesc: 'Phí khám mắt tổng quát 12 bước tiêu chuẩn quốc tế (Thu trước)',
    postpaidDesc: 'Chi phí gắp dị vật / xét nghiệm bổ sung nếu có (Thanh toán sau)'
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

/*
========================================
LẤY THÔNG TIN LỊCH KHÁM & TÍNH TIỀN (BƯỚC 2)
========================================
*/
const urlParams = new URLSearchParams(window.location.search);

// Tìm trong Appointments DB nếu có mã hẹn
let appointmentData = null;
const paramApptId = urlParams.get("appointmentId") || urlParams.get("id");
if (paramApptId) {
  try {
    const apps = JSON.parse(localStorage.getItem("doctor4_appointments_db") || "[]");
    appointmentData = apps.find(a => String(a.id) === String(paramApptId));
  } catch (e) {}
}

const appointmentId = paramApptId || (appointmentData ? appointmentData.id : "DOC-2026-" + Math.floor(1000 + Math.random() * 9000));
const serviceCode = urlParams.get("serviceCode") || (appointmentData ? appointmentData.serviceCode : "general");

const servicesList = getServicesConfig();
const matchedService = servicesList.find(s => s.code === serviceCode || s.id === serviceCode) || servicesList[0];

// Giá tiền: Ưu tiên URL -> Lịch hẹn -> Cấu hình dịch vụ
const initialAmount = Number(urlParams.get("amount")) || 
                     (appointmentData ? Number(appointmentData.examFee || appointmentData.amount) : 0) || 
                     Number(matchedService.examFee || 200000);

let currentAmount = initialAmount;
const patientName = urlParams.get("name") || (appointmentData ? appointmentData.patientName : "Nguyễn Văn A");
const doctorName = urlParams.get("doctor") || (appointmentData ? appointmentData.doctorName : "BS. CKII Nguyễn Minh Quân");
const appointmentDate = urlParams.get("date") || (appointmentData ? appointmentData.date : new Date().toISOString().split("T")[0]);
const appointmentTime = urlParams.get("time") || (appointmentData ? appointmentData.timeSlot : "08:30 - 09:30");
const serviceName = urlParams.get("serviceName") || (appointmentData ? appointmentData.serviceName : matchedService.name);

// Mã giao dịch
let paymentId = urlParams.get("paymentId") || localStorage.getItem("currentPaymentId");
if (!paymentId) {
  paymentId = "PAY" + Date.now();
  localStorage.setItem("currentPaymentId", paymentId);
}

// Nội dung chuyển khoản theo đúng mã hẹn
const transferContent = "THANHTOAN " + appointmentId;

// Phương thức thanh toán hiện tại (mặc định vietqr)
let currentMethod = 'vietqr'; // 'vietqr' | 'counter' | 'gateway'

/*
========================================
FORMAT TIỀN & THỜI GIAN
========================================
*/
function formatMoney(num) {
  return Number(num || 0).toLocaleString("vi-VN") + "đ";
}

/*
========================================
KHỞI TẠO BƯỚC 2: HỆ THỐNG TÍNH TIỀN
========================================
*/
function initFeeCalculationView() {
  document.getElementById("valAppointmentId").textContent = appointmentId;
  document.getElementById("valPatientName").textContent = patientName;
  document.getElementById("valServiceName").textContent = serviceName;
  document.getElementById("valDoctorName").textContent = doctorName;
  document.getElementById("valDateTime").textContent = `${appointmentTime} — ${appointmentDate}`;

  // Khoản thu trước (Thanh toán ngay)
  document.getElementById("valPrepaidAmount").textContent = formatMoney(currentAmount);
  document.getElementById("valPrepaidDesc").textContent = matchedService.prepaidDesc || "Phí khám chuyên sâu ban đầu & giữ chỗ bác sĩ";

  // Khoản thanh toán sau (Tại phòng khám)
  const postpaidText = matchedService.price || (matchedService.serviceFee ? formatMoney(matchedService.serviceFee) : "Theo chỉ định");
  document.getElementById("valPostpaidAmount").textContent = postpaidText;
  document.getElementById("valPostpaidDesc").textContent = matchedService.postpaidDesc || "Chi phí phẫu thuật / thủ thuật / thuốc phát sinh";

  // Tổng tiền phải trả đợt này
  document.getElementById("valTotalDue").textContent = formatMoney(currentAmount);

  // Cập nhật các text liên quan
  const gatewayAmt = document.getElementById("gatewayAmountText");
  if (gatewayAmt) gatewayAmt.textContent = formatMoney(currentAmount);
  
  const counterCode = document.getElementById("counterApptCode");
  if (counterCode) counterCode.textContent = appointmentId;
}

/*
========================================
KHỞI TẠO BƯỚC 4: THÔNG TIN CHUYỂN KHOẢN VIETQR
========================================
*/
function initVietQRView() {
  const qrUrl = "https://img.vietqr.io/image/" +
    BANK_ID + "-" +
    ACCOUNT_NUMBER + "-compact2.png" +
    "?amount=" + currentAmount +
    "&addInfo=" + encodeURIComponent(transferContent) +
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
  if (transferAmtEl) transferAmtEl.textContent = formatMoney(currentAmount);

  const transferContentEl = document.getElementById("valTransferContent");
  if (transferContentEl) transferContentEl.textContent = transferContent;
}

/*
========================================
BƯỚC 3: CHỌN PHƯƠNG THỨC THANH TOÁN
========================================
*/
function selectPaymentMethod(method) {
  currentMethod = method;

  // Cập nhật card tabs
  document.querySelectorAll(".method-card").forEach(c => c.classList.remove("selected"));
  const activeCard = document.getElementById(`method-card-${method}`);
  if (activeCard) activeCard.classList.add("selected");

  // Cập nhật các panels thực hiện
  document.querySelectorAll(".exec-panel").forEach(p => p.classList.remove("active"));
  const activePanel = document.getElementById(`panel-${method}`);
  if (activePanel) activePanel.classList.add("active");

  // Cập nhật tag & text
  const tagEl = document.getElementById("current-method-tag");
  const confirmBtn = document.getElementById("btnConfirmPaid");

  if (method === 'vietqr') {
    if (tagEl) tagEl.textContent = "Chuyển khoản VietQR";
    if (confirmBtn) confirmBtn.innerHTML = "<span>✅ Tôi đã thanh toán (Gửi yêu cầu xác minh)</span>";
  } else if (method === 'counter') {
    if (tagEl) tagEl.textContent = "Thanh toán trực tiếp tại quầy";
    if (confirmBtn) confirmBtn.innerHTML = "<span>🏢 Tôi chọn thanh toán tại quầy (Xác nhận đặt hẹn)</span>";
  } else {
    if (tagEl) tagEl.textContent = "Cổng thanh toán điện tử";
    if (confirmBtn) confirmBtn.innerHTML = "<span>⚡ Tiếp tục qua cổng thanh toán</span>";
  }

  // Cập nhật pill bước 3 & 4
  const pill3 = document.getElementById("pill-step-3");
  const pill4 = document.getElementById("pill-step-4");
  if (pill3) pill3.className = "step-pill completed";
  if (pill4) pill4.className = "step-pill active";
}
window.selectPaymentMethod = selectPaymentMethod;

/*
========================================
BƯỚC 5: XÁC MINH GIAO DỊCH (VERIFICATION)
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

function getStoredCurrentPayment() {
  const list = getPaymentsList();
  return list.find(p => String(p.id) === String(paymentId) || String(p.paymentId) === String(paymentId) || String(p.appointmentId) === String(appointmentId)) || null;
}

// Khách hàng bấm xác nhận thanh toán
function handleCustomerConfirmed() {
  let list = getPaymentsList();
  let existingIndex = list.findIndex(p => String(p.id) === String(paymentId) || String(p.paymentId) === String(paymentId));

  const status = (currentMethod === 'counter') ? 'counter_pending' : 'pending';

  const paymentRecord = {
    id: paymentId,
    paymentId: paymentId,
    appointmentId: appointmentId,
    patientName: patientName,
    name: patientName,
    doctorName: doctorName,
    doctor: doctorName,
    serviceCode: serviceCode,
    serviceName: serviceName,
    date: appointmentDate,
    time: appointmentTime,
    amount: currentAmount,
    prepaidAmount: currentAmount,
    postpaidAmount: matchedService.serviceFee || 0,
    prepaidDesc: matchedService.prepaidDesc,
    postpaidDesc: matchedService.postpaidDesc,
    paymentMethod: currentMethod,
    bank: BANK_NAME,
    accountNumber: ACCOUNT_NUMBER,
    accountName: ACCOUNT_NAME,
    content: transferContent,
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
  localStorage.setItem("payment_" + paymentId, JSON.stringify(paymentRecord));
  localStorage.setItem("currentPaymentId", paymentId);

  // Cập nhật giao diện xác minh
  updateVerificationUI(status);

  if (currentMethod === 'counter') {
    alert(
      "Đã ghi nhận yêu cầu thanh toán tại quầy!\n\n" +
      "Mã lịch hẹn: " + appointmentId + "\n\n" +
      "Vui lòng đến Quầy Lễ Tân (Tầng 1) trước giờ khám 15 phút để nhân viên hỗ trợ."
    );
  } else {
    alert(
      "Đã gửi yêu cầu xác minh thanh toán thành công!\n\n" +
      "Mã giao dịch: " + paymentId + "\n" +
      "Mã lịch hẹn: " + appointmentId + "\n\n" +
      "Hệ thống đang đối chiếu mã chuyển khoản và số tiền. Vui lòng giữ màn hình hoặc chờ vài giây."
    );
  }
}
window.handleCustomerConfirmed = handleCustomerConfirmed;

// Giả lập Webhook Ngân hàng / Cổng thanh toán báo Có tức thì
function simulateInstantVerification() {
  const confirmedTime = new Date().toLocaleString("vi-VN");
  let list = getPaymentsList();
  let existingIndex = list.findIndex(p => String(p.id) === String(paymentId) || String(p.paymentId) === String(paymentId));

  const verifiedRecord = {
    id: paymentId,
    paymentId: paymentId,
    appointmentId: appointmentId,
    patientName: patientName,
    name: patientName,
    doctorName: doctorName,
    doctor: doctorName,
    serviceCode: serviceCode,
    serviceName: serviceName,
    date: appointmentDate,
    time: appointmentTime,
    amount: currentAmount,
    prepaidAmount: currentAmount,
    postpaidAmount: matchedService.serviceFee || 0,
    prepaidDesc: matchedService.prepaidDesc,
    postpaidDesc: matchedService.postpaidDesc,
    paymentMethod: currentMethod,
    bank: BANK_NAME,
    accountNumber: ACCOUNT_NUMBER,
    accountName: ACCOUNT_NAME,
    content: transferContent,
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
  localStorage.setItem("payment_" + paymentId, JSON.stringify(verifiedRecord));

  // Đồng bộ lịch hẹn sang 'confirmed'
  syncAppointmentConfirmed(appointmentId, verifiedRecord);

  // Chuyển sang Bước 6
  renderReceipt(verifiedRecord);
}
window.simulateInstantVerification = simulateInstantVerification;

// Giả lập Cổng thanh toán VNPAY / MoMo
function triggerGatewaySimulate(gateway) {
  const name = gateway === 'vnpay' ? 'VNPAY-QR' : 'Ví MoMo';
  const ok = confirm(`Bạn có muốn mô phỏng xác nhận thanh toán số tiền ${formatMoney(currentAmount)} qua cổng ${name}?`);
  if (ok) {
    currentMethod = gateway;
    simulateInstantVerification();
  }
}
window.triggerGatewaySimulate = triggerGatewaySimulate;

// Cập nhật trạng thái giao diện kiểm tra
function updateVerificationUI(status) {
  const box = document.getElementById("verificationStatusBox");
  const icon = document.getElementById("verificationIcon");
  const title = document.getElementById("verificationTitle");
  const subtitle = document.getElementById("verificationSubtitle");
  const pill5 = document.getElementById("pill-step-5");

  if (!box) return;

  if (status === "success") {
    box.className = "verification-box success";
    if (icon) icon.textContent = "✅";
    if (title) title.textContent = "Bước 5: Giao dịch đã được đối chiếu & xác minh thành công!";
    if (subtitle) subtitle.textContent = "Hệ thống đã nhận đủ số tiền và kích hoạt biên nhận điện tử.";
    if (pill5) pill5.className = "step-pill completed";
  } else if (status === "pending" || status === "counter_pending") {
    box.className = "verification-box pending";
    if (icon) icon.textContent = "⏳";
    if (title) title.textContent = "Bước 5: Đang chờ đối chiếu giao dịch từ Ngân hàng / Admin...";
    if (subtitle) subtitle.textContent = (status === 'counter_pending') ? "Đang chờ nhân viên quầy thu ngân xác nhận khi quý khách đến nơi." : "Mã giao dịch " + paymentId + " đang được hệ thống kiểm tra tự động.";
    if (pill5) pill5.className = "step-pill active";
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

// Đồng bộ lịch hẹn sang 'confirmed'
function syncAppointmentConfirmed(appId, paymentRec) {
  try {
    const raw = localStorage.getItem("doctor4_appointments_db");
    if (!raw) return;
    let apps = JSON.parse(raw);
    const idx = apps.findIndex(a => String(a.id) === String(appId));
    if (idx !== -1) {
      apps[idx].status = "confirmed";
      apps[idx].billing = {
        ...(apps[idx].billing || {}),
        examFee: currentAmount,
        totalAmount: currentAmount,
        paymentStatus: "paid",
        paymentMethod: paymentRec.paymentMethod || "VietQR",
        paidAt: paymentRec.confirmedAt || new Date().toISOString()
      };
      localStorage.setItem("doctor4_appointments_db", JSON.stringify(apps));
    }
  } catch (e) {
    console.error("Lỗi đồng bộ lịch hẹn:", e);
  }
}

/*
========================================
BƯỚC 6: CẬP NHẬT TRẠNG THÁI VÀ GỬI BIÊN NHẬN
========================================
*/
function renderReceipt(payment) {
  // Cập nhật tất cả các pills
  for (let i = 1; i <= 6; i++) {
    const pill = document.getElementById(`pill-step-${i}`);
    if (pill) pill.className = "step-pill completed";
  }

  // Ẩn các nút hành động bước 4 & hiển thị card biên nhận
  const actionsGrp = document.querySelector(".actions-group");
  if (actionsGrp) actionsGrp.style.display = "none";

  const receiptCard = document.getElementById("step-6-receipt");
  if (receiptCard) {
    receiptCard.classList.add("active");
    receiptCard.scrollIntoView({ behavior: "smooth" });
  }

  // Điền dữ liệu vào biên nhận
  document.getElementById("receiptIdText").textContent = payment.id || paymentId;
  document.getElementById("receiptApptCode").textContent = payment.appointmentId || appointmentId;
  document.getElementById("receiptTimestamp").textContent = payment.confirmedAt || payment.paidAt || new Date().toLocaleString("vi-VN");

  let methodLabel = "Chuyển khoản VietQR (MB Bank)";
  if (payment.paymentMethod === 'counter') methodLabel = "Thanh toán trực tiếp tại Quầy Lễ Tân (Tầng 1)";
  else if (payment.paymentMethod === 'vnpay') methodLabel = "Cổng thanh toán điện tử VNPAY-QR";
  else if (payment.paymentMethod === 'momo') methodLabel = "Cổng thanh toán Ví MoMo";

  document.getElementById("receiptMethodText").textContent = methodLabel;
  document.getElementById("receiptPatientName").textContent = payment.patientName || patientName;
  document.getElementById("receiptServiceName").textContent = payment.serviceName || serviceName;
  document.getElementById("receiptDoctorName").textContent = payment.doctorName || doctorName;
  document.getElementById("receiptDateTime").textContent = `${payment.time || appointmentTime} — Ngày ${payment.date || appointmentDate}`;
  document.getElementById("receiptPaidAmount").textContent = formatMoney(payment.amount || currentAmount);

  updateVerificationUI("success");
}

/*
========================================
KIỂM TRA LIÊN TỤC (POLLING XÁC MINH THỜI GIAN THỰC)
========================================
*/
function checkRealtimeStatus() {
  const currentPay = getStoredCurrentPayment();
  if (!currentPay) return;

  if (currentPay.status === "success") {
    // Nếu đã xác minh thành công, lập tức render biên nhận (Bước 6)
    const receiptCard = document.getElementById("step-6-receipt");
    if (receiptCard && !receiptCard.classList.contains("active")) {
      renderReceipt(currentPay);
      syncAppointmentConfirmed(appointmentId, currentPay);
    }
  } else {
    updateVerificationUI(currentPay.status);
  }
}

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
  window.location.href = `/lich-kham.html?code=${encodeURIComponent(appointmentId)}`;
}
window.goToAppointmentTicket = goToAppointmentTicket;

/*
========================================
KHỞI ĐỘNG TRANG THANH TOÁN
========================================
*/
function initPaymentPage() {
  initFeeCalculationView();
  initVietQRView();

  // Kiểm tra nếu trước đó đã có trạng thái đã lưu
  const existingPay = getStoredCurrentPayment();
  if (existingPay) {
    if (existingPay.status === "success") {
      renderReceipt(existingPay);
    } else {
      updateVerificationUI(existingPay.status);
    }
  } else {
    // Lưu ngay bản ghi pending ban đầu
    const initialRecord = {
      id: paymentId,
      paymentId: paymentId,
      appointmentId: appointmentId,
      patientName: patientName,
      name: patientName,
      doctorName: doctorName,
      doctor: doctorName,
      serviceCode: serviceCode,
      serviceName: serviceName,
      date: appointmentDate,
      time: appointmentTime,
      amount: currentAmount,
      prepaidAmount: currentAmount,
      postpaidAmount: matchedService.serviceFee || 0,
      prepaidDesc: matchedService.prepaidDesc,
      postpaidDesc: matchedService.postpaidDesc,
      paymentMethod: currentMethod,
      bank: BANK_NAME,
      accountNumber: ACCOUNT_NUMBER,
      accountName: ACCOUNT_NAME,
      content: transferContent,
      status: "pending",
      createdAt: new Date().toLocaleString("vi-VN")
    };
    let list = getPaymentsList();
    if (!list.some(p => String(p.id) === String(paymentId))) {
      list.unshift(initialRecord);
      savePaymentsList(list);
    }
    localStorage.setItem("payment_" + paymentId, JSON.stringify(initialRecord));
    localStorage.setItem("currentPaymentId", paymentId);
  }

  // Polling liên tục mỗi 1.5 giây để nhận biết khi Admin duyệt
  setInterval(checkRealtimeStatus, 1500);
}

// Gắn các hàm giao tiếp UI vào window để hỗ trợ inline onclick
window.selectPaymentMethod = selectPaymentMethod;
window.copyText = copyText;
window.copyRawText = copyRawText;
window.handleCustomerConfirmed = handleCustomerConfirmed;
window.simulateInstantVerification = simulateInstantVerification;
window.triggerGatewaySimulate = triggerGatewaySimulate;
window.goToAppointmentTicket = goToAppointmentTicket;

document.addEventListener("DOMContentLoaded", initPaymentPage);