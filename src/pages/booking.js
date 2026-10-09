/* ============================================================
   src/pages/booking.js — Doctor4 Eye Clinic
   Xử lý toàn bộ tính năng Đặt Lịch Khám Người Dùng & Hiển thị Bác Sĩ
   ============================================================ */

import { INITIAL_10_DOCTORS, CLINIC_ROOMS, CLINIC_SERVICES, getClinicServices } from '../data/clinic-data.js';

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

    const stored =
      localStorage.getItem(
        APPOINTMENTS_STORAGE_KEY
      );

    if (stored) {
      list = JSON.parse(stored);
    }

  } catch (e) {

    list = [];

  }


  const randomCode =
    Math.floor(
      1000 + Math.random() * 9000
    );

  const examFee = Number(data.examFee || 200000);
  const serviceFee = Number(data.serviceFee || 0);

  const newAppointment = {

    id:
      `DOC-${new Date().getFullYear()}-${randomCode}`,

    patientName:
      data.patientName,

    patientPhone:
      data.patientPhone,

    patientEmail:
      data.patientEmail ||
      'Chưa cập nhật',

    serviceCode:
      data.serviceCode,

    serviceName:
      data.serviceName,

    doctorId:
      data.doctorId,

    doctorName:
      data.doctorName,

    roomId:
      data.roomId,

    roomName:
      data.roomName,

    date:
      data.date,

    timeSlot:
      data.timeSlot,

    symptoms:
      data.symptoms ||
      'Khám mắt định kỳ theo yêu cầu',

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

    status:
      'pending',

    createdAt:
      new Date().toISOString()

  };


  list.unshift(
    newAppointment
  );


  localStorage.setItem(
    APPOINTMENTS_STORAGE_KEY,
    JSON.stringify(list)
  );


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

  const container =
    document.getElementById(
      'doctors-grid-container'
    );


  if (!container) return;


  const doctors =
    getDoctorsForBooking();


  const filterButtons =
    document.querySelectorAll(
      '.doc-tab-btn'
    );


  const render = (
    spec = 'all'
  ) => {

    const list =
      spec === 'all'
        ? doctors
        : doctors.filter(
            d =>
              d.specialtyCode === spec
          );


    container.innerHTML =
      list.map(
        doc => `

          <div
            class="doctor-card"
            data-id="${doc.id}"
          >

            <div
              class="doctor-avatar"
              style="
                background:
                  linear-gradient(
                    135deg,
                    #1e3a8a,
                    #0ea5e9
                  );
                position: relative;
                overflow: hidden;
              "
            >

              <img
                src="${doc.avatar}"
                alt="${doc.name}"
                style="
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                "
                onerror="
                  this.style.display='none'
                "
              />

              <span
                class="doctor-badge"
                style="
                  position:absolute;
                  bottom:8px;
                  left:8px;
                  z-index:2;
                "
              >
                ${
                  doc.degree
                    ? doc.degree.split(
                        ' - '
                      )[0]
                    : 'Chuyên khoa'
                }
              </span>

            </div>


            <div class="doctor-info">

              <h3 class="doctor-name">
                ${doc.name}
              </h3>

              <p class="doctor-specialty">
                ${doc.specialty}
              </p>


              <div
                style="
                  font-size:0.8rem;
                  color:var(--clr-primary);
                  font-weight:600;
                  margin-bottom:0.4rem;
                "
              >
                📍 ${
                  doc.room ||
                  'Phòng 101 - Khám Mắt'
                }
              </div>


              <div class="doctor-meta">

                <span class="doctor-meta-item">
                  🎓 ${doc.experience} năm KN
                </span>

                <span class="doctor-meta-item">
                  👥 ${
                    doc.patientsCount
                      ? doc.patientsCount.toLocaleString(
                          'vi-VN'
                        )
                      : 3000
                  }+ BN
                </span>

              </div>


              <div class="doctor-stars">
                ★★★★★
                <span>
                  (${
                    doc.reviewsCount ||
                    100
                  } đánh giá)
                </span>
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

        `
      ).join('');


    /*
    ========================================
    BẮT SỰ KIỆN NÚT ĐẶT LỊCH
    ========================================
    */

    container
      .querySelectorAll(
        '.btn-select-doctor-book'
      )
      .forEach(btn => {

        btn.addEventListener(
          'click',
          () => {

            const docId =
              btn.getAttribute(
                'data-doc-id'
              );


            const spec =
              btn.getAttribute(
                'data-spec'
              );


            const roomId =
              btn.getAttribute(
                'data-room'
              );


            /*
            Cuộn xuống form
            */

            const formSection =
              document.getElementById(
                'dat-lich'
              );


            if (formSection) {

              formSection.scrollIntoView({
                behavior: 'smooth'
              });

            }


            /*
            Điền trước dịch vụ
            */

            const srvSelect =
              document.getElementById(
                'book-service'
              );


            if (
              srvSelect &&
              spec
            ) {

              srvSelect.value =
                spec;


              updateDoctorAndRoomOptions(
                spec,
                docId,
                roomId
              );

            }

          }
        );

      });

  };


  render('all');


  /*
  ========================================
  LỌC BÁC SĨ THEO CHUYÊN KHOA
  ========================================
  */

  filterButtons.forEach(
    btn => {

      btn.addEventListener(
        'click',
        () => {

          filterButtons.forEach(
            b =>
              b.classList.remove(
                'active'
              )
          );


          btn.classList.add(
            'active'
          );


          render(
            btn.getAttribute(
              'data-spec'
            )
          );

        }
      );

    }
  );

}


/**
 * Cập nhật danh sách Bác sĩ & Phòng khám
 */
function updateDoctorAndRoomOptions(
  serviceCode,
  preselectDocId = null,
  preselectRoomId = null
) {

  const docSelect =
    document.getElementById(
      'book-doctor'
    );


  const roomSelect =
    document.getElementById(
      'book-room'
    );


  if (
    !docSelect ||
    !roomSelect
  ) {
    return;
  }


  const doctors =
    getDoctorsForBooking();


  const rooms =
    CLINIC_ROOMS;


  /*
  ========================================
  LỌC BÁC SĨ
  ========================================
  */

  let matchedDocs =
    doctors.filter(
      d =>
        d.specialtyCode ===
        serviceCode
    );


  if (
    matchedDocs.length === 0
  ) {

    matchedDocs =
      doctors;

  }


  docSelect.innerHTML =
    matchedDocs.map(
      d => `

        <option
          value="${d.id}"
          data-name="${d.name}"
          ${
            preselectDocId === d.id
              ? 'selected'
              : ''
          }
        >
          ${d.name}
          (
          ${
            d.degree
              ? d.degree.split(
                  ' - '
                )[0]
              : 'BS.'
          }
          )
          —
          ${d.experience}
          năm KN
        </option>

      `
    ).join('');


  /*
  ========================================
  LỌC PHÒNG KHÁM
  ========================================
  */

  let matchedRooms =
    rooms.filter(
      r =>
        r.specialty ===
        serviceCode
    );


  if (
    matchedRooms.length === 0
  ) {

    matchedRooms =
      rooms;

  }


  roomSelect.innerHTML =
    rooms.map(
      r => `

        <option
          value="${r.id}"
          data-name="${r.number} - ${r.name}"
          ${
            (
              preselectRoomId === r.id ||
              matchedRooms.some(
                mr =>
                  mr.id === r.id
              )
            )
              ? 'selected'
              : ''
          }
        >
          ${r.number}:
          ${r.name}
          (${r.floor})
        </option>

      `
    ).join('');

}


/**
 * Khởi tạo form đặt lịch
 */
export function setupBookingForm() {

  const form =
    document.getElementById(
      'client-booking-form'
    );


  const srvSelect =
    document.getElementById(
      'book-service'
    );


  if (
    !form ||
    !srvSelect
  ) {
    return;
  }


  /*
  ========================================
  CẬP NHẬT TÍNH TIỀN TRỰC TIẾP (BƯỚC 2)
  ========================================
  */
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

  /*
  ========================================
  KHỞI TẠO OPTIONS & TÍNH TIỀN
  ========================================
  */

  updateDoctorAndRoomOptions(
    srvSelect.value
  );

  updateFeePreview(
    srvSelect.value
  );


  /*
  ========================================
  KHI CHỌN DỊCH VỤ
  ========================================
  */

  srvSelect.addEventListener(
    'change',
    () => {

      updateDoctorAndRoomOptions(
        srvSelect.value
      );

      updateFeePreview(
        srvSelect.value
      );

    }
  );


  /*
  ========================================
  KHI SUBMIT ĐẶT LỊCH
  ========================================
  */

  form.addEventListener(
    'submit',
    e => {

      e.preventDefault();


      const name =
        document
          .getElementById(
            'book-name'
          )
          .value
          .trim();


      const phone =
        document
          .getElementById(
            'book-phone'
          )
          .value
          .trim();


      const email =
        document
          .getElementById(
            'book-email'
          )
          ?.value
          .trim() ||
        '';


      const serviceCode =
        srvSelect.value;


      /*
      ========================================
      BƯỚC 2: HỆ THỐNG TÍNH TIỀN CHÍNH XÁC
      ========================================
      */
      const services = getClinicServices();
      const selectedService =
        services.find(s => s.code === serviceCode || s.id === serviceCode) || services[0];
      const examFee = Number(selectedService.examFee || 200000);
      const serviceFee = Number(selectedService.serviceFee || 0);


      /*
      ========================================
      BÁC SĨ
      ========================================
      */

      const docSelect =
        document.getElementById(
          'book-doctor'
        );


      const doctorId =
        docSelect.value;


      const doctorName =
        docSelect
          .selectedOptions[0]
          ?.getAttribute(
            'data-name'
          ) ||
        docSelect
          .selectedOptions[0]
          ?.text;


      /*
      ========================================
      PHÒNG
      ========================================
      */

      const roomSelect =
        document.getElementById(
          'book-room'
        );


      const roomId =
        roomSelect.value;


      const roomName =
        roomSelect
          .selectedOptions[0]
          ?.getAttribute(
            'data-name'
          ) ||
        roomSelect
          .selectedOptions[0]
          ?.text;


      /*
      ========================================
      NGÀY + GIỜ
      ========================================
      */

      const date =
        document
          .getElementById(
            'book-date'
          )
          .value;


      const timeSlot =
        document
          .getElementById(
            'book-time'
          )
          .value;


      const symptoms =
        document
          .getElementById(
            'book-symptoms'
          )
          ?.value
          .trim() ||
        '';


      /*
      ========================================
      KIỂM TRA
      ========================================
      */

      if (
        !name ||
        !phone ||
        !date
      ) {

        alert(
          'Vui lòng điền đầy đủ Họ tên, Số điện thoại và Ngày khám.'
        );

        return;

      }


      /*
      ========================================
      LƯU LỊCH HẸN
      ========================================
      */

      const newApp =
        saveAppointment({

          patientName:
            name,

          patientPhone:
            phone,

          patientEmail:
            email,

          serviceCode:
            selectedService.code,

          serviceName:
            selectedService.name,

          doctorId:
            doctorId,

          doctorName:
            doctorName,

          roomId:
            roomId,

          roomName:
            roomName,

          date:
            date,

          timeSlot:
            timeSlot,

          symptoms:
            symptoms,

          examFee:
            examFee,

          serviceFee:
            serviceFee,

          prepaidDesc:
            selectedService.prepaidDesc,

          postpaidDesc:
            selectedService.postpaidDesc

        });


      /*
      ========================================
      TẠO BẢN GHI THANH TOÁN ĐỒNG BỘ
      ========================================
      */
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


      /*
      ========================================
      HIỂN THỊ THÔNG BÁO & TIẾN TRÌNH THANH TOÁN
      ========================================
      */

      showBookingSuccessModal(
        newApp,
        selectedService,
        paymentId
      );


      /*
      Reset form
      */

      form.reset();


      updateDoctorAndRoomOptions(
        srvSelect.value
      );

      updateFeePreview(
        srvSelect.value
      );

    }
  );

}


/**
 * Hiển thị modal đặt lịch thành công — 4 bước đơn giản
 * Thanh toán tại quầy thu ngân sau khi bác sĩ khám xong
 */
function showBookingSuccessModal(
  app,
  serviceInfo = null,
  paymentId = null
) {

  let modal =
    document.getElementById(
      'booking-success-modal'
    );


  if (!modal) {

    modal =
      document.createElement(
        'div'
      );

    modal.id =
      'booking-success-modal';

    document.body.appendChild(
      modal
    );

  }

  modal.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(15,23,42,0.85);backdrop-filter:blur(10px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;">
      <div style="background:#ffffff;color:#0f172a;max-width:540px;width:100%;border-radius:24px;padding:28px 30px;box-shadow:0 25px 50px rgba(0,0,0,0.35);text-align:center;animation:admScaleIn 0.3s ease-out;max-height:90vh;overflow-y:auto;">

        <div style="font-size:56px;margin-bottom:10px;">✅</div>
        <h2 style="font-size:22px;font-weight:800;color:#16a34a;margin-bottom:6px;">Đặt Lịch Thành Công!</h2>
        <p style="color:#64748b;font-size:13.5px;margin-bottom:20px;">Doctor4 đã tiếp nhận ca hẹn của bạn. Vui lòng đến đúng giờ để được khám.</p>

        <!-- Thông tin lịch hẹn -->
        <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;padding:16px 18px;text-align:left;font-size:13px;line-height:2;margin-bottom:18px;">
          <div>🔖 <strong>Mã lịch hẹn:</strong> <span style="font-family:monospace;color:#2563eb;font-weight:800;font-size:14px;">${app.id}</span></div>
          <div>👤 <strong>Bệnh nhân:</strong> ${app.patientName} (📞 ${app.patientPhone})</div>
          <div>🎯 <strong>Dịch vụ:</strong> ${app.serviceName}</div>
          <div>👨‍⚕️ <strong>Bác sĩ:</strong> ${app.doctorName}</div>
          <div>🏥 <strong>Phòng khám:</strong> <span style="color:#0284c7;font-weight:700;">${app.roomName || 'Phòng 101'}</span></div>
          <div>📅 <strong>Thời gian:</strong> <strong style="color:#d97706;">${app.timeSlot} — Ngày ${app.date}</strong></div>
        </div>

        <!-- 4 Bước quy trình -->
        <div style="text-align:left;margin-bottom:18px;">
          <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">📋 Quy Trình 4 Bước Tại Doctor4</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#dcfce7;border-radius:10px;">
              <span style="font-size:18px;flex-shrink:0;">✅</span>
              <div><strong style="color:#166534;font-size:12.5px;">Bước 1 — Đặt lịch khám</strong><div style="font-size:11.5px;color:#166534;">Hoàn tất! Hệ thống đã ghi nhận lịch hẹn của bạn.</div></div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#e0f2fe;border-radius:10px;">
              <span style="font-size:18px;flex-shrink:0;">🏥</span>
              <div><strong style="color:#0369a1;font-size:12.5px;">Bước 2 — Đến phòng khám</strong><div style="font-size:11.5px;color:#0369a1;">Đến đúng giờ, trình mã vé tại quầy lễ tân để xếp số thứ tự.</div></div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#fef3c7;border-radius:10px;">
              <span style="font-size:18px;flex-shrink:0;">🩺</span>
              <div><strong style="color:#92400e;font-size:12.5px;">Bước 3 — Bác sĩ khám & kê đơn</strong><div style="font-size:11.5px;color:#92400e;">Bác sĩ khám lâm sàng, ghi bệnh án và kê đơn thuốc chi tiết.</div></div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#f3e8ff;border-radius:10px;">
              <span style="font-size:18px;flex-shrink:0;">💵</span>
              <div><strong style="color:#6b21a8;font-size:12.5px;">Bước 4 — Thanh toán tại quầy thu ngân</strong><div style="font-size:11.5px;color:#6b21a8;">Hóa đơn tự động chuyển về quầy. Thanh toán tiền mặt, thẻ hoặc chuyển khoản.</div></div>
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button type="button" id="btn-view-ticket-now" style="flex:1;min-width:160px;padding:13px;background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff;font-weight:700;border:none;border-radius:12px;cursor:pointer;font-size:13.5px;">
            🎫 Xem vé khám
          </button>
          <button type="button" id="btn-close-success-modal" style="padding:13px 20px;background:#e2e8f0;color:#334155;font-weight:700;border:none;border-radius:12px;cursor:pointer;font-size:13px;">
            Đóng
          </button>
        </div>

      </div>
    </div>
  `;

  document
    .getElementById('btn-close-success-modal')
    ?.addEventListener('click', () => { modal.innerHTML = ''; });

  document
    .getElementById('btn-view-ticket-now')
    ?.addEventListener('click', () => {
      modal.innerHTML = '';
      import('./my-appointments.js')
        .then(module => { module.openLookupAppointmentModal(app.id); })
        .catch(error => {
          console.error('Không thể mở tra cứu lịch hẹn:', error);
          alert('Không thể mở phần tra cứu lịch hẹn.');
        });
    });

}
