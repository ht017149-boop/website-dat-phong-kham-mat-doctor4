/* ============================================================
   src/pages/my-appointments.js — Doctor4 Eye Clinic
   Tính năng Người Dùng Tra Cứu Lịch Hẹn & Xem Phòng Khám Đã Đặt
   (Nằm hoàn toàn ở phía Người Dùng / Client)
   ============================================================ */

import { CLINIC_ROOMS, INITIAL_APPOINTMENTS } from '../data/clinic-data.js';

const APPOINTMENTS_STORAGE_KEY = 'doctor4_appointments_db';

/**
 * Lấy danh sách lịch hẹn của người dùng
 */
export function getUserAppointments(phoneOrCode = '') {
  try {
    let list = [];
    const data = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (!data) {
      list = INITIAL_APPOINTMENTS;
      localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(list));
    } else {
      list = JSON.parse(data);
    }
    if (!phoneOrCode || !phoneOrCode.trim()) return list;

    const query = phoneOrCode.trim().toLowerCase();
    return list.filter(a => 
      (a.patientPhone && a.patientPhone.replace(/\s+/g, '').includes(query.replace(/\s+/g, ''))) ||
      (a.id && a.id.toLowerCase().includes(query)) ||
      (a.patientEmail && a.patientEmail.toLowerCase().includes(query))
    );
  } catch (e) {
    return [];
  }
}

/**
 * Hủy lịch hẹn phía người dùng
 */
export function cancelUserAppointment(id) {
  try {
    const data = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (!data) return false;
    let list = JSON.parse(data);
    const index = list.findIndex(a => a.id === id);
    if (index === -1) return false;

    list[index].status = 'cancelled';
    list[index].cancelledAt = new Date().toISOString();
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Mở Modal Tra Cứu Lịch Khám & Xem Chi Tiết Phòng Khám
 */
export function openLookupAppointmentModal(initialQuery = '') {
  let modalRoot = document.getElementById('user-lookup-modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'user-lookup-modal-root';
    document.body.appendChild(modalRoot);
  }

  const renderModal = (searchQuery = '') => {
    const results = searchQuery ? getUserAppointments(searchQuery) : [];

    modalRoot.innerHTML = `
      <div style="position: fixed; inset: 0; background: rgba(15,23,42,0.85); backdrop-filter: blur(10px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; animation: admFadeIn 0.25s ease-out;">
        <div style="background: #ffffff; color: #0f172a; max-width: 680px; width: 100%; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); overflow: hidden; max-height: 90vh; display: flex; flex-direction: column;">
          
          <!-- Modal Header -->
          <div style="background: linear-gradient(135deg, #0284c7, #2563eb); color: #fff; padding: 24px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <h2 style="font-size: 20px; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 8px;">
                <span>🎫</span> Tra Cứu Vé Khám & Phòng Khám Của Tôi
              </h2>
              <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">
                Nhập Số điện thoại hoặc Mã lịch hẹn để xem chi tiết số phòng, bác sĩ và ca trực
              </p>
            </div>
            <button id="btn-close-lookup-modal" style="background: rgba(255,255,255,0.2); border: none; color: #fff; width: 34px; height: 34px; border-radius: 50%; font-size: 18px; cursor: pointer;">✕</button>
          </div>

          <!-- Search Bar -->
          <div style="padding: 20px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <form id="form-lookup-search" style="display: flex; gap: 10px;">
              <input 
                type="text" 
                id="input-lookup-query" 
                placeholder="Nhập SĐT hoặc Mã hẹn (VD: 0912345678 hoặc DOC-2026-XXXX)..." 
                value="${searchQuery}"
                style="flex: 1; padding: 12px 16px; border: 2px solid #cbd5e1; border-radius: 12px; font-size: 14px; outline: none; transition: border-color 0.2s;"
              />
              <button type="submit" style="padding: 12px 20px; background: #0284c7; color: #fff; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; white-space: nowrap;">
                🔍 Tìm kiếm
              </button>
            </form>
          </div>

          <!-- Content List -->
          <div style="padding: 24px; overflow-y: auto; flex: 1;">
            ${!searchQuery ? `
              <div style="text-align: center; padding: 30px 10px; color: #64748b;">
                <div style="font-size: 48px; margin-bottom: 12px;">📱</div>
                <h3 style="font-size: 16px; color: #1e293b; margin-bottom: 6px;">Tra cứu lịch khám tiện lợi</h3>
                <p style="font-size: 13.5px; max-width: 400px; margin: 0 auto;">
                  Vui lòng nhập Số điện thoại hoặc Mã hẹn đã dùng khi đăng ký khám tại Doctor4 để xem thông tin phòng khám và bác sĩ.
                </p>
              </div>
            ` : results.length === 0 ? `
              <div style="text-align: center; padding: 40px 10px; color: #64748b;">
                <div style="font-size: 48px; margin-bottom: 12px;">🔎</div>
                <h3 style="font-size: 16px; color: #ef4444; margin-bottom: 6px;">Không tìm thấy lịch hẹn phù hợp</h3>
                <p style="font-size: 13px;">Hãy kiểm tra lại số điện thoại hoặc mã hẹn của bạn.</p>
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="font-size: 13px; font-weight: 700; color: #0284c7;">
                  Tìm thấy ${results.length} lịch khám của bạn:
                </div>
                ${results.map(app => renderAppointmentCard(app)).join('')}
              </div>
            `}
          </div>

          <!-- Footer -->
          <div style="padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: right;">
            <button id="btn-close-lookup-bottom" style="padding: 10px 20px; background: #e2e8f0; color: #334155; font-weight: 600; border: none; border-radius: 10px; cursor: pointer;">
              Đóng
            </button>
          </div>
        </div>
      </div>
    `;

    // Events
    const closeModal = () => { modalRoot.innerHTML = ''; };
    document.getElementById('btn-close-lookup-modal')?.addEventListener('click', closeModal);
    document.getElementById('btn-close-lookup-bottom')?.addEventListener('click', closeModal);

    document.getElementById('form-lookup-search')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = document.getElementById('input-lookup-query').value.trim();
      renderModal(val);
    });

    modalRoot.querySelectorAll('.btn-cancel-my-app').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`Bạn có chắc chắn muốn hủy lịch khám mã ${id} không?`)) {
          cancelUserAppointment(id);
          alert('Đã hủy lịch khám thành công.');
          renderModal(document.getElementById('input-lookup-query').value.trim());
        }
      });
    });

    modalRoot.querySelectorAll('.btn-view-medical-record').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const list = getUserAppointments();
        const app = list.find(a => String(a.id) === String(id));
        if (app) {
          openPatientMedicalRecordModal(app);
        }
      });
    });
  };

  renderModal(initialQuery);
}

function renderAppointmentCard(app) {
  const room = CLINIC_ROOMS.find(r => r.id === app.roomId || (app.roomName && app.roomName.includes(r.number))) || {
    number: app.roomName || 'Phòng 101',
    name: 'Khám Mắt Chuyên Khoa',
    floor: 'Tầng 1',
    equipment: 'Thiết bị chuyên sâu Carl Zeiss'
  };

  const statusBadge = {
    pending: '<span style="background: #fef3c7; color: #b45309; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">⏳ Chờ xác nhận</span>',
    confirmed: '<span style="background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">🟢 Đã xác nhận lịch khám</span>',
    in_progress: '<span style="background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">🩺 Đang trong phòng khám</span>',
    completed: '<span style="background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">✅ Đã khám xong</span>',
    cancelled: '<span style="background: #fee2e2; color: #b91c1c; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">❌ Đã hủy</span>'
  };

  const hasRecord = app.status === 'completed' || !!app.medicalRecord;

  return `
    <div style="border: 2px solid ${hasRecord ? '#bbf7d0' : '#e0f2fe'}; border-radius: 16px; background: #ffffff; padding: 20px; box-shadow: 0 4px 12px rgba(2,132,199,0.06); position: relative;">
      
      <!-- Top Bar: Code + Status -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 14px;">
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Mã Vé Khám</span>
          <div style="font-family: monospace; font-size: 16px; font-weight: 800; color: #0284c7;">${app.id}</div>
        </div>
        ${statusBadge[app.status] || statusBadge.confirmed}
      </div>

      <!-- Main: ROOM HIGHLIGHT BOX -->
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1.5px solid #bae6fd; border-radius: 12px; padding: 14px 18px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
        <div>
          <div style="font-size: 11.5px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">
            🏥 PHÒNG KHÁM CHỈ ĐỊNH CHO BẠN:
          </div>
          <div style="font-size: 18px; font-weight: 800; color: #0c4a6e; margin-top: 2px;">
            ${room.number}: ${room.name}
          </div>
          <div style="font-size: 12.5px; color: #0284c7; font-weight: 600; margin-top: 2px;">
            📍 Vị trí: <strong>${room.floor}</strong> — Khu vực phòng khám mắt Doctor4
          </div>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 12px; background: #0284c7; color: #fff; padding: 4px 10px; border-radius: 6px; font-weight: 700;">
            ${room.floor}
          </span>
        </div>
      </div>

      <!-- Doctor & Time Info -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; line-height: 1.7; margin-bottom: 14px;">
        <div>
          <div style="color: #64748b;">👨‍⚕️ Bác sĩ phụ trách:</div>
          <strong style="color: #0f172a; font-size: 14px;">${app.doctorName}</strong>
        </div>
        <div>
          <div style="color: #64748b;">🕒 Thời gian hẹn khám:</div>
          <strong style="color: #d97706; font-size: 14px;">${app.timeSlot} — ${app.date}</strong>
        </div>
        <div>
          <div style="color: #64748b;">🩺 Dịch vụ khám:</div>
          <strong style="color: #0f172a;">${app.serviceName || 'Khám Mắt'}</strong>
        </div>
        <div>
          <div style="color: #64748b;">👤 Bệnh nhân:</div>
          <strong style="color: #0f172a;">${app.patientName} (📞 ${app.patientPhone})</strong>
        </div>
      </div>

      ${hasRecord ? `
      <!-- Banner Ca Khám Đã Hoàn Thành & Nút Xem Bệnh Án -->
      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1.5px solid #86efac; border-radius: 12px; padding: 14px 16px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
        <div>
          <div style="font-size: 13.5px; font-weight: 800; color: #166534; display: flex; align-items: center; gap: 6px;">
            <span>🎉</span> Ca Khám Đã Hoàn Thành & Kê Đơn Thuốc
          </div>
          <div style="font-size: 12px; color: #15803d; margin-top: 2px;">
            Bác sĩ ${app.doctorName} đã cập nhật hồ sơ bệnh án và đơn thuốc điện tử.
          </div>
        </div>
        <button type="button" class="btn-view-medical-record" data-id="${app.id}" style="padding: 9px 16px; background: #16a34a; color: #ffffff; font-weight: 700; border: none; border-radius: 10px; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 10px rgba(22,163,74,0.25);">
          📄 Xem Bệnh Án & Đơn Thuốc
        </button>
      </div>
      ` : ''}

      <!-- Actions -->
      <div style="display: flex; justify-content: space-between; align-items: center; pt: 10px; border-top: 1px dashed #e2e8f0; padding-top: 12px;">
        <span style="font-size: 12px; color: #64748b;">
          ${hasRecord ? '✅ Bạn có thể lưu hoặc in đơn thuốc điện tử ở trên.' : `💡 Xuất trình mã này tại quầy lễ tân tầng 1 để vào ${room.number}`}
        </span>
        ${app.status !== 'cancelled' && app.status !== 'completed' ? `
          <button type="button" class="btn-cancel-my-app" data-id="${app.id}" style="padding: 6px 12px; font-size: 12px; color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; cursor: pointer; font-weight: 600;">
            Hủy lịch hẹn
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Hiển thị Modal Phiếu Khám Bệnh & Đơn Thuốc Điện Tử cho Bệnh Nhân
 */
export function openPatientMedicalRecordModal(app) {
  let recordRoot = document.getElementById('patient-medical-record-root');
  if (!recordRoot) {
    recordRoot = document.createElement('div');
    recordRoot.id = 'patient-medical-record-root';
    document.body.appendChild(recordRoot);
  }

  const rec = app.medicalRecord || {
    diagnosis: 'Khám mắt định kỳ chuyên sâu',
    visionRight: '10/10',
    visionLeft: '10/10',
    intraocularPressure: '15 mmHg (Bình thường)',
    clinicalNotes: 'Mắt không phát hiện tổn thương thực thể nghiêm trọng.',
    prescriptions: [
      { name: 'Systane Ultra (Lọ 10ml)', dosage: 'Nhỏ 1 giọt x 3 lần/ngày' }
    ],
    doctorAdvice: 'Hạn chế nhìn máy tính liên tục. Tái khám sau 6 tháng.',
    reExamDate: '2026-11-01',
    completedAt: app.updatedAt || new Date().toISOString()
  };

  const prescriptionsList = Array.isArray(rec.prescriptions) && rec.prescriptions.length > 0 
    ? rec.prescriptions 
    : [
        { name: rec.prescription || 'Nước mắt nhân tạo Systane Ultra 10ml', quantity: 1, price: 95000, amount: 95000, dosage: rec.doctorAdvice || 'Nhỏ 1 giọt x 3 lần/ngày' }
      ];

  const billing = app.billing || {
    examFee: 200000,
    medicineFee: prescriptionsList.reduce((sum, p) => sum + (Number(p.amount) || ((Number(p.quantity) || 1) * (Number(p.price) || 95000))), 0),
    serviceFee: 0,
    discount: 0,
    totalAmount: 200000 + prescriptionsList.reduce((sum, p) => sum + (Number(p.amount) || ((Number(p.quantity) || 1) * (Number(p.price) || 95000))), 0),
    paymentStatus: 'paid',
    paymentMethod: 'Tiền mặt / Thẻ tại quầy'
  };

  recordRoot.innerHTML = `
    <div style="position: fixed; inset: 0; background: rgba(15,23,42,0.85); backdrop-filter: blur(8px); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto;">
      <div style="background: #ffffff; color: #0f172a; max-width: 680px; width: 100%; border-radius: 20px; box-shadow: 0 25px 50px rgba(0,0,0,0.35); overflow: hidden; animation: admScaleIn 0.25s ease-out; margin: auto;">
        
        <!-- Hospital Header -->
        <div style="padding: 24px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">BỘ Y TẾ — HỆ THỐNG PHÒNG KHÁM MẮT CHUYÊN SÂU</div>
            <h2 style="font-size: 20px; font-weight: 800; margin: 4px 0 2px 0; color: #fff;">PHÒNG KHÁM CHUYÊN KHOA MẮT DOCTOR4</h2>
            <div style="font-size: 12px; opacity: 0.9;">📍 456 Đường Giải Phóng, Hà Nội · ☎️ Hotline 24/7: 1900 6868</div>
          </div>
          <button id="btn-close-record-x" style="background: rgba(255,255,255,0.2); border: none; color: #fff; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center;">
            ✕
          </button>
        </div>

        <div style="padding: 24px; max-height: 75vh; overflow-y: auto;">
          <!-- Title & Meta -->
          <div style="text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 16px; margin-bottom: 20px;">
            <h3 style="font-size: 19px; font-weight: 800; color: #0369a1; text-transform: uppercase; margin-bottom: 4px;">
              PHIẾU KẾT QUẢ KHÁM BỆNH & ĐƠN THUỐC ĐIỆN TỬ
            </h3>
            <div style="font-size: 12.5px; color: #64748b;">
              Mã hồ sơ: <strong style="font-family: monospace; color: #0284c7; font-size: 14px;">${app.id}</strong> — Ngày hoàn thành: <strong>${new Date(rec.completedAt || app.date).toLocaleDateString('vi-VN')}</strong>
            </div>
          </div>

          <!-- Patient & Doctor Info -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13.5px; line-height: 1.8;">
            <div>👤 <strong>Họ tên BN:</strong> ${app.patientName}</div>
            <div>📞 <strong>Số điện thoại:</strong> ${app.patientPhone}</div>
            <div>👨‍⚕️ <strong>Bác sĩ khám:</strong> <span style="color: #0369a1; font-weight: 700;">${rec.doctorName || app.doctorName}</span></div>
            <div>🏥 <strong>Phòng thực hiện:</strong> <span style="font-weight: 700; color: #d97706;">${app.roomName || 'Phòng 101'}</span></div>
          </div>

          <!-- Section 1: KẾT QUẢ ĐO KHÁM THỊ LỰC & CHẨN ĐOÁN -->
          <div style="margin-bottom: 20px;">
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
              <span>👁️</span> 1. Kết Quả Khám Chuyên Khoa Mắt
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 12px;">
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px; text-align: center;">
                <div style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase;">Mắt Phải (OD)</div>
                <div style="font-size: 16px; font-weight: 800; color: #15803d; margin-top: 4px;">${rec.visionRight || '10/10'}</div>
              </div>
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px; text-align: center;">
                <div style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase;">Mắt Trái (OS)</div>
                <div style="font-size: 16px; font-weight: 800; color: #15803d; margin-top: 4px;">${rec.visionLeft || '10/10'}</div>
              </div>
              <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px; text-align: center;">
                <div style="font-size: 11px; font-weight: 700; color: #1e40af; text-transform: uppercase;">Nhãn Áp (IOP)</div>
                <div style="font-size: 15px; font-weight: 800; color: #1d4ed8; margin-top: 4px;">${rec.intraocularPressure || '15 mmHg'}</div>
              </div>
            </div>

            <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 10px; padding: 12px 16px;">
              <div style="font-size: 12px; font-weight: 700; color: #92400e; text-transform: uppercase;">Chẩn Đoán Xác Định:</div>
              <div style="font-size: 15px; font-weight: 800; color: #b45309; margin-top: 3px;">
                ${rec.diagnosis || 'Cận thị học đường & Khô mắt nhẹ'}
              </div>
              ${rec.clinicalNotes ? `<div style="font-size: 12.5px; color: #78350f; margin-top: 4px;">📝 Ghi chú: ${rec.clinicalNotes}</div>` : ''}
            </div>
          </div>

          <!-- Section 2: ĐƠN THUỐC ĐIỆN TỬ -->
          <div style="margin-bottom: 20px;">
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
              <span>💊</span> 2. Đơn Thuốc Điều Trị & Hướng Dẫn Sử Dụng
            </div>
            
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
                <thead style="background: #f1f5f9; color: #475569; font-size: 11.5px; text-transform: uppercase;">
                  <tr>
                    <th style="padding: 10px 12px; width: 40px; text-align: center;">STT</th>
                    <th style="padding: 10px 14px;">Tên Thuốc / Quy cách</th>
                    <th style="padding: 10px 10px; width: 50px; text-align: center;">SL</th>
                    <th style="padding: 10px 14px;">Cách Dùng & Liều Lượng</th>
                    <th style="padding: 10px 14px; text-align: right; width: 100px;">Thành Tiền</th>
                  </tr>
                </thead>
                <tbody>
                  ${prescriptionsList.map((item, idx) => {
                    const qty = Number(item.quantity || 1);
                    const price = Number(item.price || 95000);
                    const amount = Number(item.amount || (qty * price));
                    return `
                      <tr style="border-top: 1px solid #f1f5f9;">
                        <td style="padding: 10px 12px; font-weight: 700; color: #64748b; text-align: center;">${idx + 1}</td>
                        <td style="padding: 10px 14px; font-weight: 700; color: #0f172a;">${item.name || item}</td>
                        <td style="padding: 10px 10px; text-align: center; color: #0369a1; font-weight: 700;">${qty}</td>
                        <td style="padding: 10px 14px; color: #334155; font-weight: 500;">${item.dosage || 'Theo hướng dẫn'}</td>
                        <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: #0369a1;">${amount.toLocaleString('vi-VN')} đ</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Section 3: BẢNG KÊ CHI PHÍ & HÓA ĐƠN VIỆN PHÍ (HOSPITAL BILLING) -->
          <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
            <div style="font-size: 13px; font-weight: 800; color: #0369a1; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
              <span>💳 3. Bảng Kê Chi Phí Khám & Viện Phí</span>
              <span style="font-size: 11px; padding: 3px 8px; background: #dcfce7; color: #15803d; border-radius: 6px; font-weight: 700;">
                ✓ ${billing.paymentStatus === 'unpaid' ? 'Chờ thanh toán tại quầy' : 'Đã thanh toán'}
              </span>
            </div>

            <div style="font-size: 13px; line-height: 2;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px;">
                <span style="color: #64748b;">1. Tiền khám chuyên khoa mắt:</span>
                <strong>${Number(billing.examFee || 200000).toLocaleString('vi-VN')} đ</strong>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding: 4px 0;">
                <span style="color: #64748b;">2. Tiền thuốc điều trị:</span>
                <strong>${Number(billing.medicineFee || 0).toLocaleString('vi-VN')} đ</strong>
              </div>
              ${billing.serviceFee > 0 ? `
              <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding: 4px 0;">
                <span style="color: #64748b;">3. Phí dịch vụ / Cận lâm sàng:</span>
                <strong>${Number(billing.serviceFee).toLocaleString('vi-VN')} đ</strong>
              </div>
              ` : ''}
              ${billing.discount > 0 ? `
              <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding: 4px 0;">
                <span style="color: #16a34a;">4. Miễn giảm / Bảo hiểm y tế:</span>
                <strong style="color: #16a34a;">- ${Number(billing.discount).toLocaleString('vi-VN')} đ</strong>
              </div>
              ` : ''}
            </div>

            <div style="margin-top: 12px; padding-top: 10px; border-top: 2px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 14px; font-weight: 800; color: #0f172a;">TỔNG VIỆN PHÍ THANH TOÁN:</span>
                <div style="font-size: 11.5px; color: #64748b;">Hình thức: ${billing.paymentMethod || 'Tiền mặt / Thẻ tại quầy'}</div>
              </div>
              <div style="font-size: 20px; font-weight: 800; color: #0284c7;">
                ${Number(billing.totalAmount || 0).toLocaleString('vi-VN')} đ
              </div>
            </div>
          </div>

          <!-- Section 4: LỜI DẶN & HẸN TÁI KHÁM -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; line-height: 1.8;">
            <div>💬 <strong>Lời dặn của Bác sĩ:</strong> ${rec.doctorAdvice || 'Hạn chế nhìn thiết bị điện tử liên tục, đeo kính râm khi ra nắng.'}</div>
            ${rec.reExamDate ? `<div>📅 <strong>Lịch hẹn tái khám:</strong> <strong style="color: #dc2626;">${rec.reExamDate}</strong> (hoặc tái khám khi có dấu hiệu bất thường)</div>` : ''}
          </div>

          <!-- Signature & Digital Stamp -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; padding-top: 14px; border-top: 1px dashed #cbd5e1;">
            <div style="border: 2px dashed #16a34a; border-radius: 10px; padding: 8px 14px; text-align: center; color: #166534; font-size: 11px; font-weight: 800; background: #f0fdf4;">
              <div>HỆ THỐNG Y TẾ DOCTOR4</div>
              <div style="font-size: 13px; margin: 2px 0;">✓ ĐÃ THANH TOÁN & XÁC THỰC</div>
              <div style="font-size: 9.5px; opacity: 0.8;">Hồ sơ số EMR · Mã: ${app.id}</div>
            </div>

            <div style="text-align: center;">
              <div style="font-size: 12px; color: #64748b;">Bác sĩ điều trị chuyên khoa</div>
              <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 26px; color: #0369a1; margin: 4px 0;">
                ${rec.doctorName || app.doctorName}
              </div>
              <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${rec.doctorName || app.doctorName}</div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div style="padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
          <button id="btn-print-medical-record" style="padding: 10px 20px; background: #0284c7; color: #fff; font-weight: 700; border: none; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
            🖨️ In Bệnh Án & Hóa Đơn / Lưu PDF
          </button>
          <button id="btn-close-record-bottom" style="padding: 10px 20px; background: #e2e8f0; color: #334155; font-weight: 700; border: none; border-radius: 10px; cursor: pointer;">
            Đóng
          </button>
        </div>

      </div>
    </div>
  `;

  const closeRecord = () => { recordRoot.innerHTML = ''; };
  document.getElementById('btn-close-record-x')?.addEventListener('click', closeRecord);
  document.getElementById('btn-close-record-bottom')?.addEventListener('click', closeRecord);
  document.getElementById('btn-print-medical-record')?.addEventListener('click', () => {
    window.print();
  });
}

