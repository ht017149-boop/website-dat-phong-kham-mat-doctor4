/* ============================================================
   src/pages/booking.js — Doctor4 Eye Clinic
   Xử lý toàn bộ tính năng Đặt Lịch Khám Người Dùng & Hiển thị Bác Sĩ
   (Nằm hoàn toàn trong folder pages, độc lập với admin)
   ============================================================ */

import { INITIAL_10_DOCTORS, CLINIC_ROOMS, CLINIC_SERVICES } from '../data/clinic-data.js';

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
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Lỗi đọc dữ liệu bác sĩ:', e);
  }
  return INITIAL_10_DOCTORS;
}

/**
 * Lưu lịch hẹn mới của người dùng vào cơ sở dữ liệu
 */
function saveAppointment(data) {
  let list = [];
  try {
    const stored = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (stored) list = JSON.parse(stored);
  } catch (e) {
    list = [];
  }

  const randomCode = Math.floor(1000 + Math.random() * 9000);
  const newAppointment = {
    id: `DOC-${new Date().getFullYear()}-${randomCode}`,
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
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  list.unshift(newAppointment);
  localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(list));
  return newAppointment;
}

/**
 * Khởi tạo toàn bộ chức năng Booking cho trang người dùng
 */
export function setupBookingSystem() {
  renderDoctorsGrid();
  setupBookingForm();
}

/**
 * Render danh sách 10 bác sĩ lên Trang chủ kèm lọc chuyên khoa
 */
export function renderDoctorsGrid() {
  const container = document.getElementById('doctors-grid-container');
  if (!container) return;

  const doctors = getDoctorsForBooking();
  const filterButtons = document.querySelectorAll('.doc-tab-btn');

  const render = (spec = 'all') => {
    const list = spec === 'all' ? doctors : doctors.filter(d => d.specialtyCode === spec);
    
    container.innerHTML = list.map(doc => `
      <div class="doctor-card" data-id="${doc.id}">
        <div class="doctor-avatar" style="background: linear-gradient(135deg, #1e3a8a, #0ea5e9); position: relative; overflow: hidden;">
          <img src="${doc.avatar}" alt="${doc.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'"/>
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
          <div class="doctor-stars">★★★★★ <span>(${doc.reviewsCount || 100} đánh giá)</span></div>
          <button type="button" class="btn-appt btn-select-doctor-book" data-doc-id="${doc.id}" data-spec="${doc.specialtyCode}" data-room="${doc.roomId}">
            📅 Đặt lịch khám
          </button>
        </div>
      </div>
    `).join('');

    // Bắt sự kiện nút Đặt lịch trên từng thẻ bác sĩ
    container.querySelectorAll('.btn-select-doctor-book').forEach(btn => {
      btn.addEventListener('click', () => {
        const docId = btn.getAttribute('data-doc-id');
        const spec = btn.getAttribute('data-spec');
        const roomId = btn.getAttribute('data-room');

        // Cuộn xuống form đặt lịch
        const formSection = document.getElementById('dat-lich');
        if (formSection) {
          formSection.scrollIntoView({ behavior: 'smooth' });
        }

        // Điền trước bác sĩ & dịch vụ
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
 * Cập nhật danh sách Bác sĩ & Phòng khám theo loại bệnh được chọn
 */
function updateDoctorAndRoomOptions(serviceCode, preselectDocId = null, preselectRoomId = null) {
  const docSelect = document.getElementById('book-doctor');
  const roomSelect = document.getElementById('book-room');
  if (!docSelect || !roomSelect) return;

  const doctors = getDoctorsForBooking();
  const rooms = CLINIC_ROOMS;

  // Lọc các bác sĩ có chuyên môn khám bệnh này (hỗ trợ nhiều bác sĩ cùng khám 1 bệnh)
  let matchedDocs = doctors.filter(d => d.specialtyCode === serviceCode);
  if (matchedDocs.length === 0) {
    matchedDocs = doctors;
  }

  docSelect.innerHTML = matchedDocs.map(d => `
    <option value="${d.id}" data-name="${d.name}" ${preselectDocId === d.id ? 'selected' : ''}>
      ${d.name} (${d.degree ? d.degree.split(' - ')[0] : 'BS.'}) — ${d.experience} năm KN
    </option>
  `).join('');

  // Lọc phòng khám tương ứng trong 10 phòng
  let matchedRooms = rooms.filter(r => r.specialty === serviceCode);
  if (matchedRooms.length === 0) {
    matchedRooms = rooms;
  }

  roomSelect.innerHTML = rooms.map(r => `
    <option value="${r.id}" data-name="${r.number} - ${r.name}" ${(preselectRoomId === r.id || matchedRooms.some(mr => mr.id === r.id)) ? 'selected' : ''}>
      ${r.number}: ${r.name} (${r.floor})
    </option>
  `).join('');
}

/**
 * Khởi tạo form đặt lịch khám người dùng
 */
export function setupBookingForm() {
  const form = document.getElementById('client-booking-form');
  const srvSelect = document.getElementById('book-service');
  if (!form || !srvSelect) return;

  // Lần đầu khởi tạo options
  updateDoctorAndRoomOptions(srvSelect.value);

  // Tự động điền thông tin nếu người dùng đã đăng nhập
  try {
    const sessionStr = localStorage.getItem('doctor4_session') || sessionStorage.getItem('doctor4_session');
    if (sessionStr) {
      const u = JSON.parse(sessionStr);
      const nameInput = document.getElementById('book-name');
      const phoneInput = document.getElementById('book-phone');
      const emailInput = document.getElementById('book-email');
      if (nameInput && !nameInput.value && u.name) nameInput.value = u.name;
      if (phoneInput && !phoneInput.value && u.phone) phoneInput.value = u.phone;
      if (emailInput && !emailInput.value && u.email) emailInput.value = u.email;
    }
  } catch (e) {}

  // Khi người dùng chọn bệnh lý khác: tự động đổi danh sách bác sĩ & phòng phù hợp
  srvSelect.addEventListener('change', () => {
    updateDoctorAndRoomOptions(srvSelect.value);
  });

  // Khi submit đặt lịch
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('book-name').value.trim();
    const phone = document.getElementById('book-phone').value.trim();
    const email = document.getElementById('book-email')?.value.trim() || '';
    const serviceCode = srvSelect.value;
    const serviceName = srvSelect.selectedOptions[0]?.getAttribute('data-name') || srvSelect.selectedOptions[0]?.text;
    
    const docSelect = document.getElementById('book-doctor');
    const doctorId = docSelect.value;
    const doctorName = docSelect.selectedOptions[0]?.getAttribute('data-name') || docSelect.selectedOptions[0]?.text;

    const roomSelect = document.getElementById('book-room');
    const roomId = roomSelect.value;
    const roomName = roomSelect.selectedOptions[0]?.getAttribute('data-name') || roomSelect.selectedOptions[0]?.text;

    const date = document.getElementById('book-date').value;
    const timeSlot = document.getElementById('book-time').value;
    const symptoms = document.getElementById('book-symptoms')?.value.trim() || '';

    if (!name || !phone || !date) {
      alert('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Ngày khám.');
      return;
    }

    // Lưu lịch hẹn vào DB dùng chung
    const newApp = saveAppointment({
      patientName: name,
      patientPhone: phone,
      patientEmail: email,
      serviceCode: serviceCode,
      serviceName: serviceName,
      doctorId: doctorId,
      doctorName: doctorName,
      roomId: roomId,
      roomName: roomName,
      date: date,
      timeSlot: timeSlot,
      symptoms: symptoms
    });

    // Hiển thị modal thông báo thành công
    showBookingSuccessModal(newApp);
    form.reset();
    updateDoctorAndRoomOptions(srvSelect.value);
  });
}

function showBookingSuccessModal(app) {
  let modal = document.getElementById('booking-success-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'booking-success-modal';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="position: fixed; inset: 0; background: rgba(15,23,42,0.8); backdrop-filter: blur(8px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
      <div style="background: #ffffff; color: #0f172a; max-width: 520px; width: 100%; border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); text-align: center; animation: admScaleIn 0.3s ease-out;">
        <div style="font-size: 56px; margin-bottom: 12px;">🎉</div>
        <h2 style="font-size: 22px; font-weight: 800; color: #0284c7; margin-bottom: 6px;">Đặt Lịch Khám Thành Công!</h2>
        <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">Hệ thống phòng khám mắt Doctor4 đã tiếp nhận và xếp lịch khám cho bạn.</p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; text-align: left; font-size: 13.5px; line-height: 1.9; margin-bottom: 24px;">
          <div>🔖 <strong>Mã lịch hẹn:</strong> <span style="font-family: monospace; color: #2563eb; font-weight: 800; font-size: 15px;">${app.id}</span></div>
          <div>👤 <strong>Bệnh nhân:</strong> ${app.patientName} (📞 ${app.patientPhone})</div>
          <div>🩺 <strong>Dịch vụ khám:</strong> ${app.serviceName}</div>
          <div>👨‍⚕️ <strong>Bác sĩ phụ trách:</strong> <strong style="color: #0f172a;">${app.doctorName}</strong></div>
          <div>🏥 <strong>Phòng khám xếp lịch:</strong> <strong style="color: #0284c7;">${app.roomName}</strong></div>
          <div>📅 <strong>Thời gian hẹn:</strong> <strong style="color: #d97706;">${app.timeSlot} — Ngày ${app.date}</strong></div>
        </div>

        <div style="font-size: 12.5px; color: #64748b; margin-bottom: 20px;">
          ℹ️ Vui lòng có mặt trước giờ hẹn 10 phút tại quầy lễ tân tầng 1 và xuất trình Mã lịch hẹn để được ưu tiên vào phòng khám.
        </div>

        <div style="display: flex; gap: 10px;">
          <button type="button" id="btn-view-ticket-now" style="flex: 1; padding: 13px; background: linear-gradient(135deg, #0284c7, #2563eb); color: #fff; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; font-size: 14px;">
            🎫 Xem chi tiết vé & sơ đồ phòng
          </button>
          <button type="button" id="btn-close-success-modal" style="padding: 13px 20px; background: #e2e8f0; color: #334155; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; font-size: 14px;">
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
    });
  });
}
