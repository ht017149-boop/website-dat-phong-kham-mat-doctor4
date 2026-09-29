/* ============================================================
   src/pages/my-appointments.js — Doctor4 Eye Clinic
   Tính năng Người Dùng Tra Cứu Lịch Hẹn & Xem Phòng Khám Đã Đặt
   (Nằm hoàn toàn ở phía Người Dùng / Client)
   ============================================================ */

import { CLINIC_ROOMS } from '../data/clinic-data.js';

const APPOINTMENTS_STORAGE_KEY = 'doctor4_appointments_db';

/**
 * Lấy danh sách lịch hẹn của người dùng
 */
export function getUserAppointments(phoneOrCode = '') {
  try {
    const data = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (!data) return [];
    const list = JSON.parse(data);
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
    confirmed: '<span style="background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">🟢 Đã xếp phòng khám</span>',
    in_progress: '<span style="background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">🩺 Đang trong phòng khám</span>',
    completed: '<span style="background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">✅ Đã khám xong</span>',
    cancelled: '<span style="background: #fee2e2; color: #b91c1c; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">❌ Đã hủy</span>'
  };

  return `
    <div style="border: 2px solid #e0f2fe; border-radius: 16px; background: #ffffff; padding: 20px; box-shadow: 0 4px 12px rgba(2,132,199,0.06); position: relative;">
      
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

      <!-- Actions -->
      <div style="display: flex; justify-content: space-between; align-items: center; pt: 10px; border-top: 1px dashed #e2e8f0; padding-top: 12px;">
        <span style="font-size: 12px; color: #64748b;">
          💡 Xuất trình mã này tại quầy lễ tân tầng 1 để vào phòng ${room.number}
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
