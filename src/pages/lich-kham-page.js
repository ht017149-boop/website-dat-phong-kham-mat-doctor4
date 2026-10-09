/* ============================================================
   src/pages/lich-kham-page.js — Doctor4 Eye Clinic
   Controller cho trang Tra Cứu Lịch Hẹn & Xem Phòng Khám Đã Đặt
   ============================================================ */

import '../css/style.css';
import '../css/home.css';
import { renderHeader, renderFooter, setupHeaderEvents } from '../components/layout.js';
import { CLINIC_ROOMS } from '../data/clinic-data.js';
import { openPatientMedicalRecordModal } from './my-appointments.js';

const APPOINTMENTS_STORAGE_KEY = 'doctor4_appointments_db';

function init() {
  // Render Header & Footer
  const header = document.getElementById('header-container');
  if (header) header.innerHTML = renderHeader('lookup');

  const footer = document.getElementById('footer-container');
  if (footer) footer.innerHTML = renderFooter();

  setupHeaderEvents();
  setupLookupPage();
  renderRoomsShowcase();
}

function getAppointments() {
  try {
    const data = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function setupLookupPage() {
  const form = document.getElementById('search-appointment-form');
  const input = document.getElementById('search-query-input');
  const resultsContainer = document.getElementById('appointment-results-container');
  const sampleBtns = document.querySelectorAll('.btn-sample-search');

  // Kiểm tra nếu có query trên URL (ví dụ ?code=DOC-2026-1234 hoặc ?phone=0918123456)
  const urlParams = new URLSearchParams(window.location.search);
  const qFromUrl = urlParams.get('code') || urlParams.get('phone') || urlParams.get('q');
  if (qFromUrl && input) {
    input.value = qFromUrl;
    performSearch(qFromUrl);
  } else {
    // Mặc định hiển thị danh sách tất cả lịch hẹn hiện có trong máy để người dùng dễ xem ngay
    renderResults(getAppointments());
  }

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    performSearch(q);
  });

  input?.addEventListener('input', (e) => {
    performSearch(e.target.value.trim());
  });

  sampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-q');
      if (input) input.value = q;
      performSearch(q);
    });
  });

  function performSearch(query) {
    const all = getAppointments();
    if (!query) {
      renderResults(all);
      return;
    }

    const cleanQ = query.toLowerCase().replace(/\s+/g, '');
    const filtered = all.filter(a => 
      (a.patientPhone && a.patientPhone.replace(/\s+/g, '').includes(cleanQ)) ||
      (a.id && a.id.toLowerCase().includes(cleanQ)) ||
      (a.patientName && a.patientName.toLowerCase().includes(cleanQ.toLowerCase()))
    );

    renderResults(filtered, query);
  }

  function renderResults(list, query = '') {
    if (!resultsContainer) return;

    if (list.length === 0) {
      resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 4rem 1rem; background: #ffffff; border: 1px solid var(--clr-border); border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
          <div style="font-size: 50px; margin-bottom: 1rem;">🔎</div>
          <h3 style="font-size: 1.25rem; color: var(--clr-dark); margin-bottom: 0.5rem;">Không tìm thấy lịch hẹn cho "${escapeHtml(query)}"</h3>
          <p style="color: var(--clr-mid); font-size: 0.95rem; max-width: 450px; margin: 0 auto 1.5rem;">
            Vui lòng kiểm tra lại Số điện thoại hoặc Mã vé khám. Bạn cũng có thể đặt lịch khám mới ngay bên dưới.
          </p>
          <a href="/index.html#dat-lich" class="btn-primary" style="display: inline-flex; align-items: center; gap: 8px;">
            <span>📅 Đặt lịch khám mới ngay</span>
          </a>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = `
      <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--clr-dark);">
          ${query ? `Kết quả tìm kiếm cho "${escapeHtml(query)}":` : 'Danh sách vé khám & phòng khám của bạn:'} 
          <span style="color: var(--clr-primary);">(${list.length} ca hẹn)</span>
        </h3>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem;">
        ${list.map(app => renderTicketCard(app)).join('')}
      </div>
    `;

    // Gắn sự kiện nút Hủy
    resultsContainer.querySelectorAll('.btn-cancel-appt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`Bạn có chắc chắn muốn hủy lịch khám mã ${id} không?`)) {
          cancelAppt(id);
          performSearch(input ? input.value.trim() : '');
        }
      });
    });

    // Gắn sự kiện Xem Hồ Sơ Bệnh Án & Đơn Thuốc
    resultsContainer.querySelectorAll('.btn-view-medical-record').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const all = getAppointments();
        const app = all.find(a => a.id === id);
        if (app) {
          openPatientMedicalRecordModal(app);
        }
      });
    });

    // Gắn sự kiện Xem/Tải Hồ Sơ Bệnh Nhân & Ảnh CCCD
    resultsContainer.querySelectorAll('.btn-view-patient-profile').forEach(btn => {
      btn.addEventListener('click', () => {
        const phone = btn.getAttribute('data-phone');
        import('../utils/patient-profile.js').then(module => {
          module.openPatientProfileModal(phone);
        });
      });
    });
  }

  function cancelAppt(id) {
    let all = getAppointments();
    const idx = all.findIndex(a => a.id === id);
    if (idx !== -1) {
      all[idx].status = 'cancelled';
      localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(all));
      alert('Đã hủy lịch khám thành công.');
    }
  }
}

function renderTicketCard(app) {
  const room = CLINIC_ROOMS.find(r => r.id === app.roomId || (app.roomName && app.roomName.includes(r.number))) || {
    number: app.roomName || 'Phòng 101',
    name: 'Khám Khúc Xạ & Phẫu Thuật LASIK A',
    floor: 'Tầng 1',
    equipment: 'Máy VisuMax SMILE, Carl Zeiss'
  };

  const statusBadge = {
    pending: '<span style="background: #fef3c7; color: #b45309; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">🟡 Chờ xác nhận</span>',
    confirmed: '<span style="background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">🟢 Đã xác nhận lịch khám</span>',
    in_progress: '<span style="background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">🩺 Đang khám tại phòng</span>',
    completed: '<span style="background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">✅ Đã hoàn thành</span>',
    cancelled: '<span style="background: #fee2e2; color: #b91c1c; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">❌ Đã hủy</span>'
  };

  return `
    <div style="background: #ffffff; border: 2px solid #e0f2fe; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(2,132,199,0.08); transition: transform 0.2s, box-shadow 0.2s; position: relative;">
      
      <!-- Ticket Header -->
      <div style="background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: #fff; padding: 18px 20px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 11px; opacity: 0.85; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">MÃ VÉ KHÁM ĐIỆN TỬ</span>
          <div style="font-family: monospace; font-size: 17px; font-weight: 800; letter-spacing: 0.5px; margin-top: 2px;">${app.id}</div>
        </div>
        <div>
          <span style="background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">
            ${app.date}
          </span>
        </div>
      </div>

      <!-- HIGHLIGHT: PHÒNG KHÁM CHỈ ĐỊNH -->
      <div style="padding: 20px;">
        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1.5px solid #bae6fd; border-radius: 14px; padding: 16px; margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">
            🏥 PHÒNG KHÁM ĐÃ ĐƯỢC XẾP:
          </div>
          <div style="font-size: 1.25rem; font-weight: 800; color: #0c4a6e; margin: 4px 0 2px;">
            ${room.number}: ${room.name}
          </div>
          <div style="font-size: 13px; color: #0284c7; font-weight: 600;">
            📍 Vị trí: <strong>${room.floor}</strong> — Khu Khám Mắt Doctor4
          </div>
          <div style="font-size: 11.5px; color: #64748b; margin-top: 6px; border-top: 1px dashed #cbd5e1; padding-top: 6px;">
            🔬 Thiết bị: ${room.equipment}
          </div>
        </div>

        <!-- Chi tiết Bác sĩ & Bệnh nhân -->
        <div style="font-size: 13.5px; line-height: 1.8; color: var(--clr-dark); margin-bottom: 16px;">
          <div>👨‍⚕️ <strong>Bác sĩ khám:</strong> <span style="color: #2563eb; font-weight: 700;">${app.doctorName}</span></div>
          <div>🕒 <strong>Khung giờ hẹn:</strong> <span style="color: #d97706; font-weight: 700;">${app.timeSlot}</span></div>
          <div>🩺 <strong>Dịch vụ:</strong> ${app.serviceName}</div>
          <div>👤 <strong>Bệnh nhân:</strong> ${app.patientName} (📞 ${app.patientPhone})</div>
          <div>💬 <strong>Triệu chứng:</strong> <span style="color: #64748b;">${escapeHtml(app.symptoms || 'Khám thông thường')}</span></div>
        </div>

        <!-- Trạng thái & Thao tác -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div>${statusBadge[app.status] || statusBadge.confirmed}</div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button class="btn-view-patient-profile" data-phone="${app.patientPhone || ''}" style="background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
              <span>📋 Hồ sơ & CCCD</span>
            </button>
            ${(app.status === 'completed' || app.medicalRecord) ? `
              <button class="btn-view-medical-record" data-id="${app.id}" style="background: linear-gradient(135deg, #0284c7, #0ea5e9); color: #ffffff; border: none; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(2,132,199,0.25);">
                <span>📄 Bệnh Án & Đơn Thuốc</span>
              </button>
            ` : ''}
            ${app.status !== 'cancelled' && app.status !== 'completed' ? `
              <button class="btn-cancel-appt" data-id="${app.id}" style="background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                Hủy lịch
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Hiển thị sơ đồ danh sách 10 phòng khám bên dưới để người dùng tham khảo
 */
function renderRoomsShowcase() {
  const container = document.getElementById('rooms-showcase-grid');
  if (!container) return;

  container.innerHTML = CLINIC_ROOMS.map(r => `
    <div style="background: #ffffff; border: 1px solid var(--clr-border); border-radius: 16px; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); transition: transform 0.2s;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 11px; font-weight: 700; background: #e0f2fe; color: #0284c7; padding: 3px 8px; border-radius: 6px;">
          ${r.floor}
        </span>
        <span style="font-size: 12px; color: #10b981; font-weight: 600;">🟢 Đang hoạt động</span>
      </div>
      <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--clr-dark); margin-bottom: 6px;">
        ${r.number}: ${r.name}
      </h4>
      <p style="font-size: 12.5px; color: var(--clr-mid); line-height: 1.5; margin-bottom: 12px;">
        🔬 <strong>Thiết bị:</strong> ${r.equipment}
      </p>
      <a href="/index.html#dat-lich" style="font-size: 12px; color: #2563eb; font-weight: 700; text-decoration: none;">
        Đặt lịch khám phòng này →
      </a>
    </div>
  `).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', init);
