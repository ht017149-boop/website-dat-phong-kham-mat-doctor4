/* ============================================================
   src/pages/booking.js — Doctor4 Eye Clinic
   Xử lý toàn bộ tính năng Đặt Lịch Khám Người Dùng & Hiển thị Bác Sĩ
   ============================================================ */

import { INITIAL_10_DOCTORS, CLINIC_ROOMS, CLINIC_SERVICES, getClinicServices, calculateQueueNumber, formatQueueNumber, getSlotBookingInfo } from '../data/clinic-data.js';
import { compressImageFile, getDefaultPatientPhotos, getPatientProfileData } from '../utils/patient-profile.js';

const DOCTORS_STORAGE_KEY = 'doctor4_doctors_db';
const APPOINTMENTS_STORAGE_KEY = 'doctor4_appointments_db';

/**
 * Lấy danh sách bác sĩ để hiển thị cho người dùng
 */
function getDoctorsForBooking() {
  try {
    const stored = localStorage.getItem(DOCTORS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Lỗi đọc dữ liệu bác sĩ:', e);
  }
  return INITIAL_10_DOCTORS;
}

/**
 * Lưu lịch hẹn mới của người dùng
 */
function saveAppointment(data) {
  let list = [];
  try {
    const stored = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (stored) {
      list = JSON.parse(stored);
    }
  } catch (e) {
    list = [];
  }

  const randomCode = Math.floor(1000 + Math.random() * 9000);
  const examFee = Number(data.examFee || 200000);
  const serviceFee = Number(data.serviceFee || 0);

  // Tính số thứ tự khám (STT) khi nhiều người đặt cùng ngày, giờ, bác sĩ/phòng
  const queueNumber = calculateQueueNumber(list, {
    date: data.date,
    timeSlot: data.timeSlot,
    doctorId: data.doctorId,
    roomId: data.roomId
  });

  const newAppointment = {
    id: `DOC-${new Date().getFullYear()}-${randomCode}`,
    queueNumber: queueNumber,
    stt: queueNumber,
    patientName: data.patientName,
    patientPhone: data.patientPhone,
    patientEmail: data.patientEmail || 'Chưa cập nhật',
    serviceCode: data.serviceCode,
    serviceName: data.serviceName,
    doctorId: data.doctorId,
    doctorName: data.doctorName,
    roomId: data.roomId,
    roomName: data.roomName,
    date: data.date,
    timeSlot: data.timeSlot,
    symptoms: data.symptoms || 'Khám mắt định kỳ theo yêu cầu',
    patientProfile: data.patientProfile || null,
    examFee: examFee,
    serviceFee: serviceFee,
    prepaidDesc: data.prepaidDesc || 'Phí khám ban đầu',
    postpaidDesc: data.postpaidDesc || 'Chi phí điều trị phát sinh',
    billing: {
      examFee: examFee,
      serviceFee: serviceFee,
      totalAmount: examFee,
      paymentStatus: 'unpaid'
    },
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  list.unshift(newAppointment);
  localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(list));
  return newAppointment;
}

/**
 * Khởi tạo toàn bộ chức năng Booking
 */
export function setupBookingSystem() {
  renderDoctorsGrid();
  setupBookingForm();
}

/**
 * Render danh sách 10 bác sĩ
 */
export function renderDoctorsGrid() {
  const container = document.getElementById('doctors-grid-container');
  if (!container) return;

  const doctors = getDoctorsForBooking();
  const filterButtons = document.querySelectorAll('.doc-tab-btn');

  const render = (spec = 'all') => {
    const list = spec === 'all'
      ? doctors
      : doctors.filter(d => d.specialtyCode === spec);

    container.innerHTML = list.map(doc => `
      <div class="doctor-card" data-id="${doc.id}">
        <div class="doctor-avatar" style="background: linear-gradient(135deg, #1e3a8a, #0ea5e9); position: relative; overflow: hidden;">
          <img
            src="${doc.avatar}"
            alt="${doc.name}"
            style="width: 100%; height: 100%; object-fit: cover;"
            onerror="this.style.display='none'"
          />
          <span class="doctor-badge" style="position: absolute; bottom: 8px; left: 8px; z-index: 2;">
            ${doc.degree ? doc.degree.split(' - ')[0] : 'Chuyên khoa'}
          </span>
        </div>

        <div class="doctor-info">
          <h3 class="doctor-name">${doc.name}</h3>
          <p class="doctor-specialty">${doc.specialty}</p>

          <div style="font-size: 0.8rem; color: var(--clr-primary); font-weight: 600; margin-bottom: 0.4rem;">
            📍 ${doc.room || 'Phòng 101 - Khám Mắt'}
          </div>

          <div class="doctor-meta">
            <span class="doctor-meta-item">🎓 ${doc.experience} năm KN</span>
            <span class="doctor-meta-item">👥 ${doc.patientsCount ? doc.patientsCount.toLocaleString('vi-VN') : 3000}+ BN</span>
          </div>

          <div class="doctor-stars">
            ★★★★★ <span>(${doc.reviewsCount || 100} đánh giá)</span>
          </div>

          <button
            type="button"
            class="btn-appt btn-select-doctor-book"
            data-doc-id="${doc.id}"
            data-spec="${doc.specialtyCode}"
            data-room="${doc.roomId}"
          >
            📅 Đặt lịch khám
          </button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-select-doctor-book').forEach(btn => {
      btn.addEventListener('click', () => {
        const docId = btn.getAttribute('data-doc-id');
        const spec = btn.getAttribute('data-spec');
        const roomId = btn.getAttribute('data-room');

        const formSection = document.getElementById('dat-lich');
        if (formSection) {
          formSection.scrollIntoView({ behavior: 'smooth' });
        }

        const srvSelect = document.getElementById('book-service');
        if (srvSelect && spec) {
          srvSelect.value = spec;
          updateDoctorAndRoomOptions(spec, docId, roomId);
        }
      });
    });
  };

  render('all');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render(btn.getAttribute('data-spec'));
    });
  });
}

/**
 * Cập nhật danh sách Bác sĩ & Phòng khám
 */
function updateDoctorAndRoomOptions(serviceCode, preselectDocId = null, preselectRoomId = null) {
  const docSelect = document.getElementById('book-doctor');
  const roomSelect = document.getElementById('book-room');
  if (!docSelect || !roomSelect) return;

  const doctors = getDoctorsForBooking();
  const rooms = CLINIC_ROOMS;

  let matchedDocs = doctors.filter(d => d.specialtyCode === serviceCode);
  if (matchedDocs.length === 0) {
    matchedDocs = doctors;
  }

  docSelect.innerHTML = matchedDocs.map(d => `
    <option
      value="${d.id}"
      data-name="${d.name}"
      ${preselectDocId === d.id ? 'selected' : ''}
    >
      ${d.name} (${d.degree ? d.degree.split(' - ')[0] : 'BS.'}) — ${d.experience} năm KN
    </option>
  `).join('');

  let matchedRooms = rooms.filter(r => r.specialty === serviceCode);
  if (matchedRooms.length === 0) {
    matchedRooms = rooms;
  }

  roomSelect.innerHTML = rooms.map(r => `
    <option
      value="${r.id}"
      data-name="${r.number} - ${r.name}"
      ${(preselectRoomId === r.id || matchedRooms.some(mr => mr.id === r.id)) ? 'selected' : ''}
    >
      ${r.number}: ${r.name} (${r.floor})
    </option>
  `).join('');
}

/**
 * Khởi tạo form đặt lịch
 */
export function setupBookingForm() {
  const form = document.getElementById('client-booking-form');
  const srvSelect = document.getElementById('book-service');
  if (!form || !srvSelect) return;

  // Cập nhật tính tiền trực tiếp
  function updateFeePreview(code) {
    const services = getClinicServices();
    const s = services.find(item => item.code === code || item.id === code) || services[0];
    const prepaidEl = document.getElementById('preview-prepaid-amount');
    const prepaidDescEl = document.getElementById('preview-prepaid-desc');
    const postpaidEl = document.getElementById('preview-postpaid-amount');
    const postpaidDescEl = document.getElementById('preview-postpaid-desc');
    const totalDueEl = document.getElementById('preview-total-due');
    const submitTextEl = document.getElementById('btn-submit-booking-text');

    const examFee = Number(s.examFee || 200000);
    const serviceFeeText = s.price || (s.serviceFee ? `${Number(s.serviceFee).toLocaleString('vi-VN')}đ` : 'Không có');

    if (prepaidEl) prepaidEl.textContent = `${examFee.toLocaleString('vi-VN')}đ`;
    if (prepaidDescEl) prepaidDescEl.textContent = s.prepaidDesc || 'Phí khám ban đầu & giữ chỗ lịch hẹn';
    if (postpaidEl) postpaidEl.textContent = serviceFeeText;
    if (postpaidDescEl) postpaidDescEl.textContent = s.postpaidDesc || 'Chi phí phát sinh nếu thực hiện thủ thuật';
    if (totalDueEl) totalDueEl.textContent = `${examFee.toLocaleString('vi-VN')}đ`;
    if (submitTextEl) submitTextEl.textContent = `✨ XÁC NHẬN ĐẶT LỊCH & TIẾP TỤC THANH TOÁN (${examFee.toLocaleString('vi-VN')}đ)`;
  }

  // Cập nhật thông báo STT dự kiến theo khung giờ và bác sĩ
  function updateQueueLiveNotice() {
    const dateInput = document.getElementById('book-date');
    const timeInput = document.getElementById('book-time');
    const docSelect = document.getElementById('book-doctor');
    const roomSelect = document.getElementById('book-room');
    const noticeText = document.getElementById('booking-queue-notice-text');
    const badge = document.getElementById('booking-queue-badge');

    if (!noticeText || !badge) return;

    const dateVal = dateInput?.value || '';
    const timeVal = timeInput?.value || '';
    const docId = docSelect?.value || '';
    const roomId = roomSelect?.value || '';

    let list = [];
    try {
      const stored = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      if (stored) list = JSON.parse(stored);
    } catch (e) {
      list = [];
    }

    const info = getSlotBookingInfo(list, {
      date: dateVal,
      timeSlot: timeVal,
      doctorId: docId,
      roomId: roomId
    });

    badge.textContent = `STT: #${info.formattedQueue}`;

    if (info.count === 0) {
      noticeText.innerHTML = `Khung giờ <strong>${timeVal}</strong> ngày <strong>${dateVal || 'đã chọn'}</strong> chưa có ca đặt. Quý khách là <strong>người đầu tiên</strong> (STT #01).`;
      badge.style.background = 'linear-gradient(135deg, #0284c7, #2563eb)';
    } else {
      noticeText.innerHTML = `Khung giờ này đã có <strong>${info.count} người</strong> đặt trước. Quý khách đặt sẽ nhận <strong>Số thứ tự (STT) #${info.formattedQueue}</strong> để khám lần lượt.`;
      badge.style.background = 'linear-gradient(135deg, #d97706, #ea580c)';
    }
  }

  // Khởi tạo ngày mặc định (hôm nay) nếu chưa có
  const dateInput = document.getElementById('book-date');
  if (dateInput && !dateInput.value) {
    const todayStr = new Date().toISOString().split('T')[0];
    dateInput.value = todayStr;
    dateInput.min = todayStr;
  }

  // Khởi tạo Options & tính tiền ban đầu & STT ban đầu
  updateDoctorAndRoomOptions(srvSelect.value);
  updateFeePreview(srvSelect.value);
  updateQueueLiveNotice();

  // Khi thay đổi dịch vụ
  srvSelect.addEventListener('change', () => {
    updateDoctorAndRoomOptions(srvSelect.value);
    updateFeePreview(srvSelect.value);
    updateQueueLiveNotice();
  });

  // Gắn sự kiện cập nhật STT khi đổi ngày, giờ, bác sĩ, phòng khám
  ['change', 'input'].forEach(evt => {
    document.getElementById('book-date')?.addEventListener(evt, updateQueueLiveNotice);
    document.getElementById('book-time')?.addEventListener(evt, updateQueueLiveNotice);
    document.getElementById('book-doctor')?.addEventListener(evt, updateQueueLiveNotice);
    document.getElementById('book-room')?.addEventListener(evt, updateQueueLiveNotice);
  });

  // Biến lưu Base64 ảnh upload từ form đặt lịch
  let uploadedPhoto4x6 = '';
  let uploadedCccdFront = '';
  let uploadedCccdBack = '';

  // Auto-fill thông tin bác sĩ & dịch vụ từ Trợ lý Bác Sĩ AI
  try {
    const aiBooking = sessionStorage.getItem('doctor4_ai_selected_booking');
    if (aiBooking) {
      const { spec, docId, symptom } = JSON.parse(aiBooking);
      sessionStorage.removeItem('doctor4_ai_selected_booking');
      if (spec && srvSelect) {
        srvSelect.value = spec;
        srvSelect.dispatchEvent(new Event('change'));
      }
      setTimeout(() => {
        const docSelect = document.getElementById('book-doctor');
        if (docSelect && docId) {
          docSelect.value = docId;
          docSelect.dispatchEvent(new Event('change'));
        }
        const sympInput = document.getElementById('book-symptoms');
        if (sympInput && symptom) {
          sympInput.value = symptom;
        }
      }, 250);
    }
  } catch (e) {}

  // Auto-fill thông tin nếu người dùng đã đăng nhập
  try {
    const session = localStorage.getItem('doctor4_session') || sessionStorage.getItem('doctor4_session');
    if (session) {
      const user = JSON.parse(session);
      const nameInput = document.getElementById('book-name');
      const phoneInput = document.getElementById('book-phone');
      const emailInput = document.getElementById('book-email');
      
      if (nameInput && user.name) nameInput.value = user.name;
      if (phoneInput && user.phone) phoneInput.value = user.phone;
      if (emailInput && user.email) emailInput.value = user.email;

      if (user.patientProfile) {
        const prof = user.patientProfile;
        if (prof.dob && document.getElementById('book-patient-dob')) document.getElementById('book-patient-dob').value = prof.dob;
        if (prof.gender && document.getElementById('book-patient-gender')) document.getElementById('book-patient-gender').value = prof.gender;
        if (prof.cccdNumber && document.getElementById('book-patient-cccd')) document.getElementById('book-patient-cccd').value = prof.cccdNumber;
        if (prof.address && document.getElementById('book-patient-address')) document.getElementById('book-patient-address').value = prof.address;
        if (prof.bhytCode && document.getElementById('book-patient-bhyt')) document.getElementById('book-patient-bhyt').value = prof.bhytCode;

        if (prof.photo4x6) {
          uploadedPhoto4x6 = prof.photo4x6;
          const box = document.getElementById('preview-book-photo4x6');
          if (box) box.innerHTML = `<img src="${prof.photo4x6}" style="width: 100%; height: 100%; object-fit: cover;" />`;
        }
        if (prof.cccdFront) {
          uploadedCccdFront = prof.cccdFront;
          const box = document.getElementById('preview-book-cccd-front');
          if (box) box.innerHTML = `<img src="${prof.cccdFront}" style="width: 100%; height: 100%; object-fit: cover;" />`;
        }
        if (prof.cccdBack) {
          uploadedCccdBack = prof.cccdBack;
          const box = document.getElementById('preview-book-cccd-back');
          if (box) box.innerHTML = `<img src="${prof.cccdBack}" style="width: 100%; height: 100%; object-fit: cover;" />`;
        }
      }
    }
  } catch (e) {}

  // Xử lý upload 3 ảnh trong form đặt lịch
  const bindBookUpload = (inputId, boxId, cb) => {
    const input = document.getElementById(inputId);
    const box = document.getElementById(boxId);
    if (!input || !box) return;

    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          box.innerHTML = `<span style="font-size: 10px; color: #38bdf8;">⏳ Đang nén...</span>`;
          const b64 = await compressImageFile(file, 600, 600, 0.75);
          cb(b64);
          box.innerHTML = `<img src="${b64}" style="width: 100%; height: 100%; object-fit: cover;" />`;
        } catch (err) {
          box.innerHTML = `<span style="font-size: 10px; color: #ef4444;">Lỗi ảnh</span>`;
        }
      }
    });
  };

  bindBookUpload('file-book-photo4x6', 'preview-book-photo4x6', (b64) => { uploadedPhoto4x6 = b64; });
  bindBookUpload('file-book-cccd-front', 'preview-book-cccd-front', (b64) => { uploadedCccdFront = b64; });
  bindBookUpload('file-book-cccd-back', 'preview-book-cccd-back', (b64) => { uploadedCccdBack = b64; });

  // Xử lý submit form
  form.addEventListener('submit', e => {
    e.preventDefault();

    const name = document.getElementById('book-name').value.trim();
    const phone = document.getElementById('book-phone').value.trim();
    const email = document.getElementById('book-email')?.value.trim() || '';
    const serviceCode = srvSelect.value;

    const services = getClinicServices();
    const selectedService = services.find(s => s.code === serviceCode || s.id === serviceCode) || services[0];
    const examFee = Number(selectedService.examFee || 200000);
    const serviceFee = Number(selectedService.serviceFee || 0);

    const docSelect = document.getElementById('book-doctor');
    const doctorId = docSelect.value;
    const doctorName = docSelect.selectedOptions[0]?.getAttribute('data-name') || docSelect.selectedOptions[0]?.text;

    const roomSelect = document.getElementById('book-room');
    const roomId = roomSelect.value;
    const roomName = roomSelect.selectedOptions[0]?.getAttribute('data-name') || roomSelect.selectedOptions[0]?.text;

    const date = document.getElementById('book-date').value;
    const timeSlot = document.getElementById('book-time').value;
    const symptoms = document.getElementById('book-symptoms')?.value.trim() || '';

    const dob = document.getElementById('book-patient-dob')?.value || '1995-05-20';
    const gender = document.getElementById('book-patient-gender')?.value || 'Nam';
    const cccdNumber = document.getElementById('book-patient-cccd')?.value.trim() || '079203018899';
    const address = document.getElementById('book-patient-address')?.value.trim() || 'TP. Hồ Chí Minh';
    const bhytCode = document.getElementById('book-patient-bhyt')?.value.trim() || '';

    if (!name || !phone || !date) {
      alert('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Ngày khám.');
      return;
    }

    const defaultPhotos = getDefaultPatientPhotos(name, gender);

    const patientProfile = {
      fullName: name,
      phone: phone,
      email: email,
      gender: gender,
      dob: dob,
      cccdNumber: cccdNumber,
      address: address,
      bhytCode: bhytCode,
      medicalHistory: symptoms || 'Khám mắt định kỳ theo yêu cầu',
      allergies: 'Không có dị ứng',
      photo4x6: uploadedPhoto4x6 || defaultPhotos.photo4x6,
      cccdFront: uploadedCccdFront || defaultPhotos.cccdFront,
      cccdBack: uploadedCccdBack || defaultPhotos.cccdBack,
      verified: true,
      updatedAt: new Date().toISOString()
    };

    const newApp = saveAppointment({
      patientName: name,
      patientPhone: phone,
      patientEmail: email,
      serviceCode: selectedService.code,
      serviceName: selectedService.name,
      doctorId: doctorId,
      doctorName: doctorName,
      roomId: roomId,
      roomName: roomName,
      date: date,
      timeSlot: timeSlot,
      symptoms: symptoms,
      examFee: examFee,
      serviceFee: serviceFee,
      prepaidDesc: selectedService.prepaidDesc,
      postpaidDesc: selectedService.postpaidDesc,
      patientProfile: patientProfile
    });

    // Tạo bản ghi thanh toán đồng bộ
    const paymentId = 'PAY' + Date.now();
    let payments = [];
    try {
      payments = JSON.parse(localStorage.getItem('payments') || '[]');
    } catch (err) {
      payments = [];
    }

    const paymentData = {
      id: paymentId,
      paymentId: paymentId,
      appointmentId: newApp.id,
      queueNumber: newApp.queueNumber,
      stt: newApp.stt,
      patientName: newApp.patientName,
      name: newApp.patientName,
      doctorName: newApp.doctorName,
      doctor: newApp.doctorName,
      serviceCode: selectedService.code,
      serviceName: selectedService.name,
      roomId: newApp.roomId,
      roomName: newApp.roomName,
      date: newApp.date,
      time: newApp.timeSlot,
      amount: examFee,
      prepaidAmount: examFee,
      postpaidAmount: serviceFee,
      prepaidDesc: selectedService.prepaidDesc,
      postpaidDesc: selectedService.postpaidDesc,
      paymentMethod: 'vietqr',
      bank: 'MB Bank',
      accountNumber: '0123456789',
      accountName: 'PHONG KHAM MAT DOCTOR4',
      content: 'THANHTOAN ' + newApp.id,
      status: 'pending',
      createdAt: new Date().toLocaleString('vi-VN')
    };

    payments.unshift(paymentData);
    localStorage.setItem('payments', JSON.stringify(payments));
    localStorage.setItem('payment_' + paymentId, JSON.stringify(paymentData));
    localStorage.setItem('currentPaymentId', paymentId);

    showBookingSuccessModal(newApp, selectedService, paymentId);
    form.reset();
    updateDoctorAndRoomOptions(srvSelect.value);
    updateFeePreview(srvSelect.value);
    updateQueueLiveNotice();
  });
}

/**
 * Hiển thị modal đặt lịch thành công kèm nút Thanh toán QR & Theo dõi
 */
function showBookingSuccessModal(app, serviceInfo = null, paymentId = null) {
  let modal = document.getElementById('booking-success-modal');

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'booking-success-modal';
    document.body.appendChild(modal);
  }

  const examFee = Number(app.examFee || 200000);
  const sttFormatted = formatQueueNumber(app.queueNumber || app.stt || 1);
  const isMultiple = Number(app.queueNumber || 1) > 1;

  modal.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(15,23,42,0.85);backdrop-filter:blur(10px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;">
      <div style="background:#ffffff;color:#0f172a;max-width:540px;width:100%;border-radius:24px;padding:28px 30px;box-shadow:0 25px 50px rgba(0,0,0,0.35);text-align:center;animation:admScaleIn 0.3s ease-out;max-height:90vh;overflow-y:auto;">

        <div style="font-size:52px;margin-bottom:8px;">✅</div>
        <h2 style="font-size:22px;font-weight:800;color:#16a34a;margin-bottom:6px;">Đặt Lịch Thành Công!</h2>
        <p style="color:#64748b;font-size:13.5px;margin-bottom:18px;">Doctor4 đã tiếp nhận ca hẹn. Hệ thống đã phát số thứ tự khám cho bạn.</p>

        <!-- Thẻ Số Thứ Tự Khám (STT) Nổi Bật -->
        <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2.5px dashed #2563eb; border-radius: 18px; padding: 18px 20px; margin-bottom: 20px; text-align: center; box-shadow: 0 8px 25px rgba(37,99,235,0.12);">
          <div style="font-size: 11px; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 1.2px;">
            🎟️ SỐ THỨ TỰ KHÁM CỦA BẠN (STT)
          </div>
          <div style="font-size: 50px; font-weight: 900; color: #1d4ed8; line-height: 1.1; margin: 4px 0 6px; letter-spacing: 1px;">
            STT: #${sttFormatted}
          </div>
          <div style="font-size: 13.5px; color: #1e3a8a; line-height: 1.5; font-weight: 600;">
            ${isMultiple 
              ? `Đã có <strong>${app.queueNumber - 1} người</strong> đặt cùng khung giờ <strong>${app.timeSlot}</strong>. Quý khách giữ <strong>STT #${sttFormatted}</strong> và sẽ được Bác sĩ tiếp đón khám lần lượt theo số này.` 
              : `Quý khách là người đầu tiên trong khung giờ <strong>${app.timeSlot}</strong>. Vui lòng giữ <strong>STT #${sttFormatted}</strong> khi đến phòng khám.`}
          </div>
        </div>

        <!-- Thông tin lịch hẹn -->
        <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;padding:16px 18px;text-align:left;font-size:13px;line-height:2;margin-bottom:18px;">
          <div>🔖 <strong>Mã lịch hẹn:</strong> <span style="font-family:monospace;color:#2563eb;font-weight:800;font-size:14px;">${app.id}</span></div>
          <div>🔢 <strong>Số thứ tự (STT):</strong> <span style="background: #2563eb; color: #fff; padding: 2px 10px; border-radius: 6px; font-weight: 800; font-size: 13px;">STT #${sttFormatted}</span> (Khung giờ: ${app.timeSlot})</div>
          <div>👤 <strong>Bệnh nhân:</strong> ${app.patientName} (📞 ${app.patientPhone})</div>
          <div>🎯 <strong>Dịch vụ:</strong> ${app.serviceName}</div>
          <div>👨‍⚕️ <strong>Bác sĩ:</strong> ${app.doctorName}</div>
          <div>🏥 <strong>Phòng khám:</strong> <span style="color:#0284c7;font-weight:700;">${app.roomName || 'Phòng 101'}</span></div>
          <div>📅 <strong>Thời gian:</strong> <strong style="color:#d97706;">${app.timeSlot} — Ngày ${app.date}</strong></div>
          <div>💳 <strong>Viện phí thanh toán:</strong> <span style="color:#0369a1;font-weight:700;">Hiển thị sau khi Bác sĩ kê đơn</span></div>
        </div>

        <!-- Quy trình thanh toán mới -->
        <div style="background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:12px;padding:14px 16px;margin-bottom:18px;display:flex;align-items:flex-start;gap:12px;text-align:left;">
          <span style="font-size:24px;flex-shrink:0;">ℹ️</span>
          <div>
            <strong style="color:#0369a1;font-size:13px;display:block;margin-bottom:3px;">Quy trình khám & thanh toán:</strong>
            <div style="font-size:12px;color:#0369a1;line-height:1.5;">
              Quý khách vui lòng đến đúng giờ tại phòng khám được chỉ định để Bác sĩ thăm khám. <strong>Số tiền viện phí và đơn thuốc sẽ được hiển thị để quý khách thanh toán sau khi Bác sĩ hoàn thành kê đơn thuốc</strong>.
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button type="button" id="btn-view-ticket-now" style="flex:1.2;min-width:140px;padding:13px;background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff;font-weight:700;border:none;border-radius:12px;cursor:pointer;font-size:13.5px;">
            🎫 Xem vé khám & phòng
          </button>
          <button type="button" id="btn-payment-qr" style="flex:1;min-width:140px;padding:13px;background:#e0f2fe;color:#0369a1;font-weight:700;border:1px solid #bae6fd;border-radius:12px;cursor:pointer;font-size:13px;">
            💳 Cổng thanh toán
          </button>
          <button type="button" id="btn-close-success-modal" style="padding:13px 20px;background:#e2e8f0;color:#334155;font-weight:700;border:none;border-radius:12px;cursor:pointer;font-size:13px;">
            Đóng
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-close-success-modal')?.addEventListener('click', () => {
    modal.innerHTML = '';
  });

  document.getElementById('btn-view-ticket-now')?.addEventListener('click', () => {
    modal.innerHTML = '';
    import('./my-appointments.js').then(module => {
      module.openLookupAppointmentModal(app.id);
    }).catch(error => {
      console.error('Không thể mở tra cứu lịch hẹn:', error);
      alert('Không thể mở phần tra cứu lịch hẹn.');
    });
  });

  document.getElementById('btn-payment-qr')?.addEventListener('click', () => {
    const paymentUrl = `/payment.html?appointmentId=${encodeURIComponent(app.id)}&name=${encodeURIComponent(app.patientName)}&doctor=${encodeURIComponent(app.doctorName)}&date=${encodeURIComponent(app.date)}&time=${encodeURIComponent(app.timeSlot)}`;
    window.location.href = paymentUrl;
  });
}

