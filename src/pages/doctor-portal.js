/* ============================================================
   src/pages/doctor-portal.js — Doctor4 Eye Clinic
   Cổng Bác Sĩ Lâm Sàng: Khám bệnh, Kê đơn, Viết bệnh án & Viện phí
   Đồng bộ dữ liệu tức thì sang Cổng Bệnh nhân & Admin
   ============================================================ */

import '../css/style.css';
import '../css/doctor-portal.css';
import { DoctorManager } from '../admin/doctor-manager.js';
import { AppointmentManager, SAMPLE_EYE_DRUGS, SAMPLE_DIAGNOSES } from '../admin/appointment-manager.js';
import { CLINIC_ROOMS } from '../data/clinic-data.js';
import { AuthService } from './auth.js';
import { getPatientProfileData } from '../utils/patient-profile.js';

let currentDoctor = null;
let currentFilter = 'all';
let currentSearch = '';
let currentPrescription = [];

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  initDoctorPortal();
});

function initDoctorPortal() {
  const doctors = DoctorManager.getDoctors();
  if (!doctors || doctors.length === 0) {
    DoctorManager.resetToDefault();
  }

  // Xác định Bác sĩ đang đăng nhập
  resolveActiveDoctor();

  // Thiết lập sự kiện
  setupHeaderEvents();
  setupFilterEvents();
  setupSearchEvents();

  // Render giao diện
  renderShiftBanner();
  renderPatientQueue();
}

/**
 * Xác định Bác sĩ hiện tại
 */
function resolveActiveDoctor() {
  const doctors = DoctorManager.getDoctors();
  const sessionUser = AuthService.getCurrentUser();

  if (sessionUser && sessionUser.role === 'doctor') {
    // 1. BÁC SĨ ĐĂNG NHẬP: Khóa chặt đúng tài khoản bác sĩ này
    const found = doctors.find(d => 
      (sessionUser.doctorId && String(d.id) === String(sessionUser.doctorId)) || 
      (d.email && sessionUser.email && d.email.toLowerCase() === sessionUser.email.toLowerCase()) ||
      (d.phone && sessionUser.phone && d.phone.replace(/\s+/g, '') === sessionUser.phone.replace(/\s+/g, ''))
    );
    currentDoctor = found || doctors[0];

    // Khóa và ẩn hoàn toàn thanh chuyển bác sĩ — hiển thị huy hiệu chuyên môn riêng tư
    const switchWrapper = document.querySelector('.doc-switch-wrapper');
    if (switchWrapper) {
      switchWrapper.innerHTML = `
        <div style="background: rgba(13,148,136,0.18); border: 1px solid rgba(13,148,136,0.45); border-radius: 8px; padding: 6px 14px; font-size: 13px; color: #5eead4; font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">🩺</span>
          <span>Bàn khám riêng: <strong style="color: #fff;">${currentDoctor.degree} ${currentDoctor.name}</strong> (${currentDoctor.room ? currentDoctor.room.split('-')[0].trim() : 'P.Khám'})</span>
        </div>
      `;
    }
  } else if (sessionUser && sessionUser.role === 'admin') {
    // 2. ADMIN TOÀN QUYỀN: Có thể giám sát và chuyển đổi giữa các phòng khám của 10 bác sĩ
    const urlParams = new URLSearchParams(window.location.search);
    const docParam = urlParams.get('doc') || urlParams.get('id');
    const savedDocId = localStorage.getItem('doctor4_active_doctor_view');
    currentDoctor = doctors.find(d => String(d.id) === String(docParam || savedDocId)) || doctors[0];
    populateDoctorSelect(doctors);
  } else {
    // 3. CHƯA ĐĂNG NHẬP: Chuyển hướng tới trang đăng nhập
    window.location.href = '/dang-nhap.html?redirect=/bac-si.html';
    return;
  }
}

/**
 * Đổ dữ liệu 10 bác sĩ vào thanh chuyển đổi nhanh (chỉ dành cho Admin giám sát)
 */
function populateDoctorSelect(doctors) {
  const select = document.getElementById('doctor-quick-switch');
  if (!select) return;

  select.innerHTML = doctors.map(d => `
    <option value="${d.id}" ${currentDoctor && d.id === currentDoctor.id ? 'selected' : ''}>
      ${d.degree} ${d.name} (${d.room ? d.room.split('-')[0].trim() : 'P.Khám'})
    </option>
  `).join('');

  select.addEventListener('change', (e) => {
    const selectedId = e.target.value;
    const doc = doctors.find(d => String(d.id) === String(selectedId));
    if (doc) {
      currentDoctor = doc;
      localStorage.setItem('doctor4_active_doctor_view', doc.id);
      renderShiftBanner();
      renderPatientQueue();
      showToast('info', 'Giám sát Bác Sĩ', `Đang xem ca trực của ${doc.degree} ${doc.name}`);
    }
  });
}

/**
 * Cập nhật Header Profile & Sự kiện
 */
function setupHeaderEvents() {
  const logoutBtn = document.getElementById('btn-doc-logout');
  logoutBtn?.addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi Cổng Bác Sĩ?')) {
      AuthService.logout();
      window.location.href = '/dang-nhap.html';
    }
  });

  const refreshBtn = document.getElementById('btn-refresh-queue');
  refreshBtn?.addEventListener('click', () => {
    renderShiftBanner();
    renderPatientQueue();
    showToast('info', 'Làm mới', 'Đã cập nhật danh sách bệnh nhân mới nhất!');
  });
}

/**
 * Render Banner Thông tin Ca trực của Bác sĩ
 */
function renderShiftBanner() {
  if (!currentDoctor) return;

  // Header profile
  const avatarImg = document.getElementById('doc-avatar-img');
  const profName = document.getElementById('doc-profile-name');
  const profRoom = document.getElementById('doc-profile-room');
  if (avatarImg) avatarImg.src = currentDoctor.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120';
  if (profName) profName.textContent = `${currentDoctor.degree} ${currentDoctor.name}`;
  if (profRoom) profRoom.textContent = currentDoctor.room || 'Phòng khám Mắt';

  // Banner details
  const bannerName = document.getElementById('banner-doctor-name');
  const bannerRoom = document.getElementById('banner-room-info');
  const bannerSpecialty = document.getElementById('banner-specialty-info');
  const bannerTime = document.getElementById('banner-time-info');

  if (bannerName) bannerName.textContent = `${currentDoctor.degree} ${currentDoctor.name}`;
  if (bannerRoom) bannerRoom.innerHTML = `🏥 <strong>Phòng trực:</strong> ${currentDoctor.room || 'Phòng 101 - Khám Mắt'}`;
  if (bannerSpecialty) bannerSpecialty.innerHTML = `🎯 <strong>Chuyên khoa:</strong> ${currentDoctor.specialty || 'Khám Mắt Tổng Quát'}`;
  if (bannerTime) bannerTime.innerHTML = `⏰ <strong>Ca làm việc:</strong> ${currentDoctor.schedule || 'Thứ 2 - Thứ 6 (08:00 - 17:00)'}`;

  // Thống kê ca trực
  updateShiftStats();
}

/**
 * Lấy danh sách bệnh nhân thuộc phòng / bác sĩ này (NGHIÊM NGẶT - KHÔNG LẪN LỘN)
 */
function getDoctorAppointments() {
  let all = AppointmentManager.getAppointments();
  if (!currentDoctor) return [];

  // Lọc chuẩn xác: Chỉ hiển thị các ca khám chỉ định đích danh Bác Sĩ này HOẶC thuộc Phòng Khám này
  return all.filter(a => {
    const matchDocId = a.doctorId && String(a.doctorId) === String(currentDoctor.id);
    const matchDocName = a.doctorName && a.doctorName.toLowerCase().includes(currentDoctor.name.toLowerCase());
    const matchRoom = (a.roomId && currentDoctor.roomId && a.roomId === currentDoctor.roomId);
    return matchDocId || matchDocName || matchRoom;
  });
}

/**
 * Cập nhật số liệu thống kê ca trực
 */
function updateShiftStats() {
  const appointments = getDoctorAppointments();

  const total = appointments.length;
  const waiting = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length;
  const completed = appointments.filter(a => a.status === 'completed').length;

  let totalRevenue = 0;
  appointments.forEach(a => {
    if (a.billing && a.billing.totalAmount) {
      totalRevenue += Number(a.billing.totalAmount) || 0;
    } else if (a.status === 'completed') {
      totalRevenue += 200000; // Phí khám tiêu chuẩn
    }
  });

  document.getElementById('stat-total-patients').textContent = total;
  document.getElementById('stat-waiting-patients').textContent = waiting;
  document.getElementById('stat-completed-patients').textContent = completed;
  document.getElementById('stat-total-revenue').textContent = formatCurrency(totalRevenue);

  document.getElementById('count-tab-all').textContent = total;
  document.getElementById('count-tab-waiting').textContent = waiting;
  document.getElementById('count-tab-completed').textContent = completed;
}

/**
 * Setup Bộ lọc & Tìm kiếm
 */
function setupFilterEvents() {
  const tabs = document.querySelectorAll('.doc-tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter') || 'all';
      renderPatientQueue();
    });
  });
}

function setupSearchEvents() {
  const input = document.getElementById('doc-patient-search');
  input?.addEventListener('input', (e) => {
    currentSearch = e.target.value.trim().toLowerCase();
    renderPatientQueue();
  });
}

/**
 * Render Hàng đợi Bệnh nhân theo STT (01, 02, 03...)
 */
function renderPatientQueue() {
  const container = document.getElementById('doc-queue-container');
  if (!container) return;

  let list = getDoctorAppointments();

  // Lọc theo search
  if (currentSearch) {
    list = list.filter(a => 
      (a.patientName && a.patientName.toLowerCase().includes(currentSearch)) ||
      (a.patientPhone && a.patientPhone.includes(currentSearch)) ||
      (a.id && a.id.toLowerCase().includes(currentSearch)) ||
      (a.serviceName && a.serviceName.toLowerCase().includes(currentSearch))
    );
  }

  // Lọc theo tab
  if (currentFilter === 'waiting') {
    list = list.filter(a => a.status === 'confirmed' || a.status === 'pending');
  } else if (currentFilter === 'completed') {
    list = list.filter(a => a.status === 'completed');
  }

  // Sắp xếp: Ca chờ khám lên trước theo giờ hẹn
  list.sort((a, b) => {
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    return (a.time || '').localeCompare(b.time || '');
  });

  if (list.length === 0) {
    container.innerHTML = `
      <div class="doc-empty-state">
        <div class="doc-empty-icon">📭</div>
        <div class="doc-empty-title">Không có bệnh nhân nào trong danh sách</div>
        <p>Hiện không tìm thấy bệnh nhân phù hợp với điều kiện lọc hiện tại.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="doc-table-wrapper">
      <table class="doc-table">
        <thead>
          <tr>
            <th style="width: 70px; text-align: center;">STT</th>
            <th>Mã Vé & Giờ Hẹn</th>
            <th>Họ Tên Bệnh Nhân</th>
            <th>Triệu Chứng / Dịch Vụ</th>
            <th>Trạng Thái</th>
            <th>Viện Phí</th>
            <th style="text-align: right;">Thao Tác Điều Trị</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((app, index) => {
            const sttNumber = String(index + 1).padStart(2, '0');
            const isCompleted = app.status === 'completed';
            const statusBadge = isCompleted 
              ? `<span class="doc-status-badge completed">✅ Đã khám xong</span>`
              : `<span class="doc-status-badge waiting">⏳ Chờ khám (STT ${sttNumber})</span>`;
            
            const totalFee = app.billing?.totalAmount 
              ? formatCurrency(app.billing.totalAmount) 
              : (isCompleted ? '200.000đ' : 'Chưa tính');

            return `
              <tr>
                <td style="text-align: center;">
                  <span class="stt-badge">${sttNumber}</span>
                </td>
                <td>
                  <div class="ticket-badge">${app.id || 'DOC-2026'}</div>
                  <div class="appointment-time-badge">
                    <span>⏰ ${app.time || '08:30'}</span> &nbsp;|&nbsp; <span>📅 ${app.date || 'Hôm nay'}</span>
                  </div>
                </td>
                <td>
                  <div class="patient-info-box">
                    <span class="patient-name">${escapeHtml(app.patientName)}</span>
                    <span class="patient-meta">
                      <span>📞 ${escapeHtml(app.patientPhone)}</span>
                      <span>•</span>
                      <span>🎂 ${app.patientGender || 'Nam/Nữ'}, ${app.patientAge || '32 tuổi'}</span>
                    </span>
                  </div>
                </td>
                <td>
                  <div style="font-weight: 600; color: #1e293b;">${escapeHtml(app.serviceName || 'Khám Mắt Tổng Quát')}</div>
                  <div style="font-size: 0.8rem; color: #64748b; max-width: 280px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                    ${escapeHtml(app.notes || 'Khám định kỳ mắt, kiểm tra thị lực')}
                  </div>
                </td>
                <td>${statusBadge}</td>
                <td>
                  <strong style="color: ${isCompleted ? '#0284c7' : '#64748b'};">${totalFee}</strong>
                  ${app.billing?.paymentStatus === 'paid' ? '<div style="font-size: 0.72rem; color: #10b981; font-weight: 700;">Đã thanh toán</div>' : ''}
                </td>
                <td style="text-align: right;">
                  <div class="doc-action-btns" style="justify-content: flex-end;">
                    ${!isCompleted ? `
                      <button type="button" class="btn-doc-exam btn-trigger-exam" data-id="${app.id}">
                        <span>🩺 Bắt đầu Khám & Kê đơn</span>
                      </button>
                    ` : `
                      <button type="button" class="btn-doc-edit btn-trigger-exam" data-id="${app.id}">
                        <span>✏️ Sửa Bệnh Án & Thuốc</span>
                      </button>
                      <button type="button" class="btn-doc-print btn-trigger-print" data-id="${app.id}" title="In bệnh án">
                        <span>📄 In</span>
                      </button>
                    `}
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Gắn sự kiện cho các nút hành động
  container.querySelectorAll('.btn-trigger-exam').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const app = AppointmentManager.getAppointmentById(id);
      if (app) openDoctorExamModal(app);
    });
  });

  container.querySelectorAll('.btn-trigger-print').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const app = AppointmentManager.getAppointmentById(id);
      if (app) openPrintModal(app);
    });
  });
}

/**
 * MODAL KHÁM BỆNH - KÊ ĐƠN - VIẾT BỆNH ÁN - TÍNH VIỆN PHÍ
 * Hiện TAB 1: PHIẾU THÔNG TIN BỆNH NHÂN (ẢNH 4x6 & CCCD MẶT TRƯỚC/SAU) TRƯỚC KHI KÊ ĐƠN
 */
function openDoctorExamModal(app) {
  if (!app) return;
  const sessionUser = AuthService.getCurrentUser();
  if (sessionUser && sessionUser.role === 'doctor') {
    const isOwner = (app.doctorId && String(app.doctorId) === String(currentDoctor.id)) ||
                    (app.doctorName && app.doctorName.toLowerCase().includes(currentDoctor.name.toLowerCase())) ||
                    (app.roomId && currentDoctor.roomId && app.roomId === currentDoctor.roomId);
    if (!isOwner) {
      showToast('error', 'Từ chối quyền truy cập', 'Bệnh nhân này thuộc phòng khám của Bác sĩ khác!');
      return;
    }
  }

  const modalRoot = document.getElementById('doctor-portal-modal-root');
  if (!modalRoot) return;

  const rec = app.medicalRecord || {};
  const billing = app.billing || {};
  const isEdit = app.status === 'completed';
  const profile = getPatientProfileData(app);

  currentPrescription = rec.prescription && rec.prescription.length > 0
    ? JSON.parse(JSON.stringify(rec.prescription))
    : [
        { name: 'Systane Ultra (Lọ 10ml)', type: 'Nước mắt nhân tạo', quantity: 1, dosage: 'Nhỏ 1 giọt x 3-4 lần/ngày khi khô mắt', price: 95000 },
        { name: 'Tobrex 0.3% (Lọ 5ml)', type: 'Kháng sinh Tobramycin', quantity: 1, dosage: 'Nhỏ 1-2 giọt x 3 lần/ngày trong 7 ngày', price: 68000 }
      ];

  modalRoot.innerHTML = `
    <div class="doc-modal-overlay" id="exam-modal-overlay">
      <div class="doc-modal-window" style="max-width: 900px;">
        <!-- Modal Header -->
        <div class="doc-modal-header" style="flex-direction: column; align-items: stretch; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="doc-modal-header-left">
              <span style="font-size: 1.5rem;">🩺</span>
              <div>
                <div class="doc-modal-title">
                  ${isEdit ? 'Chỉnh Sửa Hồ Sơ Bệnh Án & Đơn Thuốc' : 'Khám Bệnh & Kê Đơn Điều Trị Mắt'}
                </div>
                <div style="font-size: 0.8rem; color: #94a3b8;">
                  Bệnh nhân: <strong>${escapeHtml(app.patientName)}</strong> (Mã vé: ${app.id}) &nbsp;|&nbsp; Bác sĩ phụ trách: <strong>${currentDoctor.degree} ${currentDoctor.name}</strong>
                </div>
              </div>
            </div>
            <button type="button" class="doc-modal-close-btn" id="btn-close-exam-modal" aria-label="Đóng">✕</button>
          </div>

          <!-- TAB SWITCHER NAV -->
          <div class="modal-tab-nav" style="display: flex; gap: 10px; background: rgba(255,255,255,0.08); padding: 4px; border-radius: 8px;">
            <button type="button" id="tab-btn-info" class="doc-tab-switch active" style="flex: 1; padding: 10px; border-radius: 6px; border: none; font-weight: 700; cursor: pointer; font-size: 13.5px; background: #0284c7; color: #fff; display: flex; align-items: center; justify-content: center; gap: 6px;">
              📋 1. Phiếu Thông Tin Bệnh Nhân (Ảnh 4x6 & CCCD)
            </button>
            <button type="button" id="tab-btn-exam" class="doc-tab-switch" style="flex: 1; padding: 10px; border-radius: 6px; border: none; font-weight: 700; cursor: pointer; font-size: 13.5px; background: transparent; color: #94a3b8; display: flex; align-items: center; justify-content: center; gap: 6px;">
              🩺 2. Khám Bệnh & Kê Đơn Thuốc
            </button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="doc-modal-body">
          
          <!-- TAB 1: PHIẾU THÔNG TIN BỆNH NHÂN (ẢNH 4X6, CCCD TRƯỚC/SAU, HỒ SƠ BAN ĐẦU) -->
          <div id="tab-content-info" class="tab-pane-active" style="display: block;">
            
            <div style="background: rgba(14,165,233,0.08); border: 1.5px solid rgba(14,165,233,0.3); border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">🛡️</span>
                <div>
                  <div style="font-weight: 800; color: #0284c7; font-size: 14px;">HỒ SƠ BỆNH NHÂN TRỰC TUYẾN ĐÃ XÁC THỰC</div>
                  <div style="font-size: 12.5px; color: #475569;">Bác sĩ vui lòng đối chiếu hình ảnh 4x6 và CCCD trước khi chuyển sang bước khám & kê đơn.</div>
                </div>
              </div>
              <span style="background: #10b981; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;">
                ✅ Đã Xác Thực Danh Tính
              </span>
            </div>

            <!-- GRID 3 ẢNH: 4x6, CCCD MẶT TRƯỚC, CCCD MẶT SAU -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 22px;">
              <!-- 1. Ảnh 4x6 -->
              <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="font-size: 12px; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 8px;">
                  📸 Ảnh 4x6 Chân Dung
                </div>
                <div style="height: 160px; background: #e2e8f0; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 2px solid #0284c7;">
                  <img src="${profile.photo4x6}" alt="Ảnh 4x6" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300'" />
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 8px;">Ảnh đối chiếu tại quầy</div>
              </div>

              <!-- 2. CCCD Mặt Trước -->
              <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="font-size: 12px; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 8px;">
                  🪪 CCCD Mặt Trước
                </div>
                <div style="height: 160px; background: #e2e8f0; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 1px solid #94a3b8;">
                  <img src="${profile.cccdFront}" alt="CCCD Mặt trước" style="width: 100%; height: 100%; object-fit: contain;" />
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 8px;">Mặt trước Căn Cước Công Dân</div>
              </div>

              <!-- 3. CCCD Mặt Sau -->
              <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="font-size: 12px; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 8px;">
                  💳 CCCD Mặt Sau
                </div>
                <div style="height: 160px; background: #e2e8f0; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 1px solid #94a3b8;">
                  <img src="${profile.cccdBack}" alt="CCCD Mặt sau" style="width: 100%; height: 100%; object-fit: contain;" />
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 8px;">Mặt sau Căn Cước Công Dân</div>
              </div>
            </div>

            <!-- BẢNG CHI TIẾT THÔNG TIN BỆNH NHÂN -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; font-size: 13.5px; line-height: 1.9; box-shadow: 0 2px 8px rgba(0,0,0,0.03); margin-bottom: 20px;">
              <div style="font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 12px; border-bottom: 2px solid #0284c7; padding-bottom: 6px;">
                📋 THÔNG TIN HÀNH CHÍNH & TIỀN SỬ Y KHOA
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div>👤 <strong>Họ và tên Bệnh nhân:</strong> <strong style="color: #0284c7; font-size: 15px;">${escapeHtml(profile.fullName)}</strong></div>
                <div>🎂 <strong>Ngày sinh & Giới tính:</strong> ${profile.dob} (${profile.gender})</div>
                <div>🪪 <strong>Số CCCD/CMND:</strong> <span style="font-family: monospace; font-weight: 700; color: #1e293b;">${profile.cccdNumber}</span></div>
                <div>📞 <strong>Số điện thoại:</strong> ${profile.phone}</div>
                <div>✉️ <strong>Địa chỉ Email:</strong> ${profile.email}</div>
                <div>🏥 <strong>Mã thẻ BHYT:</strong> <span style="font-family: monospace; font-weight: 700; color: #059669;">${profile.bhytCode}</span></div>
                <div style="grid-column: span 2;">📍 <strong>Địa chỉ liên hệ:</strong> ${profile.address}</div>
                <div style="grid-column: span 2;">🩸 <strong>Tiền sử bệnh / Dị ứng:</strong> <span style="color: #d97706; font-weight: 600;">${profile.medicalHistory} — ${profile.allergies}</span></div>
                <div style="grid-column: span 2; background: #f1f5f9; padding: 10px 14px; border-radius: 8px;">🩺 <strong>Lý do đến khám & Triệu chứng:</strong> <strong style="color: #1e293b;">${escapeHtml(app.symptoms || app.serviceName)}</strong></div>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" class="btn-doc-edit" id="btn-close-info-tab">Đóng</button>
              <button type="button" id="btn-goto-exam-step" class="btn-doc-exam" style="padding: 12px 28px; font-size: 1rem; background: linear-gradient(135deg, #0284c7, #2563eb);">
                <span>🩺 Tiến Hành Khám Bệnh & Kê Đơn ➔</span>
              </button>
            </div>

          </div>

          <!-- TAB 2: KHÁM BỆNH, VIẾT BỆNH ÁN, KÊ ĐƠN & VIỆN PHÍ -->
          <div id="tab-content-exam" class="tab-pane" style="display: none;">
            
            <!-- Template Picker -->
            <div style="background: #f1f5f9; padding: 10px 14px; border-radius: 10px; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
              <div style="font-size: 0.85rem; font-weight: 700; color: #334155;">
                ⚡ Chọn nhanh mẫu bệnh án chuẩn:
              </div>
              <select id="exam-template-select" class="exam-select" style="max-width: 320px;">
                <option value="">-- Chọn mẫu chẩn đoán thường gặp --</option>
                ${SAMPLE_DIAGNOSES.map((tmpl, idx) => `
                  <option value="${idx}">${tmpl.label}</option>
                `).join('')}
              </select>
            </div>

            <form id="doc-clinical-exam-form">
              <!-- 1. Chỉ số Khám Mắt Lâm Sàng -->
              <div class="exam-section-block">
                <div class="exam-section-title">
                  <span>👁️</span> 1. Kết Quả Đo Thị Lực & Khúc Xạ Chuyên Khoa Mắt
                </div>

                <div class="exam-grid-2">
                  <div class="exam-input-group">
                    <label class="exam-label">Thị lực Mắt Phải (OD) có kính / không kính</label>
                    <input type="text" id="exam-vision-r" class="exam-input" value="${rec.visionRight || '-2.50 D (10/10)'}" placeholder="VD: 10/10 hoặc -2.00 D" required />
                  </div>
                  <div class="exam-input-group">
                    <label class="exam-label">Thị lực Mắt Trái (OS) có kính / không kính</label>
                    <input type="text" id="exam-vision-l" class="exam-input" value="${rec.visionLeft || '-2.00 D (10/10)'}" placeholder="VD: 10/10 hoặc -1.75 D" required />
                  </div>
                </div>

                <div class="exam-grid-2">
                  <div class="exam-input-group">
                    <label class="exam-label">Nhãn áp Mắt Phải / Trái (IOP - mmHg)</label>
                    <input type="text" id="exam-iop" class="exam-input" value="${rec.intraocularPressure || '15 mmHg'}" placeholder="Bình thường: 10 - 21 mmHg" />
                  </div>
                  <div class="exam-input-group">
                    <label class="exam-label">Khám Đèn Sinh Hiển Vi (Giác mạc / Tiền phòng / Thể thủy tinh)</label>
                    <input type="text" id="exam-slitlamp" class="exam-input" value="${rec.slitLampExam || 'Giác mạc trong suốt, thể thủy tinh trong'}" placeholder="Mô tả kết quả soi đèn" />
                  </div>
                </div>
              </div>

              <!-- 2. Chẩn đoán & Kết Luận -->
              <div class="exam-section-block">
                <div class="exam-section-title">
                  <span>📋</span> 2. Chẩn Đoán Lâm Sàng & Kết Luận Bệnh Lý
                </div>
                <div class="exam-input-group">
                  <label class="exam-label">Chẩn đoán xác định bệnh mắt <span style="color: red;">*</span></label>
                  <input type="text" id="exam-diagnosis" class="exam-input" value="${rec.diagnosis || 'Cận thị học đường & Khô mắt nhẹ'}" placeholder="Nhập chẩn đoán kết luận" required />
                </div>
                <div class="exam-input-group">
                  <label class="exam-label">Lời dặn của bác sĩ điều trị & Chế độ sinh hoạt mắt</label>
                  <textarea id="exam-advice" class="exam-textarea" rows="2" placeholder="VD: Hạn chế dùng máy tính liên tục, chớp mắt thường xuyên...">${rec.advice || 'Hạn chế nhìn màn hình liên tục > 45 phút. Chớp mắt thường xuyên. Đeo kính chống tia xanh.'}</textarea>
                </div>
                <div class="exam-grid-2">
                  <div class="exam-input-group">
                    <label class="exam-label">Hẹn ngày tái khám</label>
                    <input type="text" id="exam-revisit" class="exam-input" value="${rec.revisitDate || 'Sau 30 ngày'}" placeholder="VD: Sau 2 tuần / Sau 1 tháng" />
                  </div>
                  <div class="exam-input-group">
                    <label class="exam-label">Bác sĩ ký xác nhận</label>
                    <input type="text" id="exam-doctor-sign" class="exam-input" value="${currentDoctor.degree} ${currentDoctor.name}" readonly style="background: #f1f5f9; font-weight: 700;" />
                  </div>
                </div>
              </div>

              <!-- 3. Kê Đơn Thuốc Mắt Tương Tác -->
              <div class="exam-section-block">
                <div class="exam-section-title" style="justify-content: space-between;">
                  <span>💊 3. Kê Đơn Thuốc Chuyên Khoa Mắt</span>
                  <span style="font-size: 0.8rem; font-weight: 600; color: #0284c7;">Hệ thống tự động tính tiền thuốc</span>
                </div>

                <!-- Thêm thuốc nhanh -->
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
                  <select id="select-sample-drug" class="exam-select" style="flex: 1; min-width: 240px;">
                    <option value="">-- Chọn thuốc mắt từ danh mục bệnh viện --</option>
                    ${SAMPLE_EYE_DRUGS.map((d, i) => `
                      <option value="${i}">${d.name} (${formatCurrency(d.price)}) - ${d.type}</option>
                    `).join('')}
                  </select>
                  <button type="button" id="btn-add-drug" class="btn-doc-exam" style="padding: 6px 14px;">
                    ➕ Thêm vào đơn
                  </button>
                </div>

                <!-- Bảng đơn thuốc -->
                <div class="doc-table-wrapper">
                  <table class="prescription-table">
                    <thead>
                      <tr>
                        <th>Tên Thuốc / Hàm Lượng</th>
                        <th style="width: 70px;">SL</th>
                        <th>Cách Dùng & Liều Lượng</th>
                        <th style="width: 100px;">Đơn Giá</th>
                        <th style="width: 110px;">Thành Tiền</th>
                        <th style="width: 50px; text-align: center;">Xóa</th>
                      </tr>
                    </thead>
                    <tbody id="prescription-table-body">
                      <!-- Populated dynamically -->
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- 4. Viện Phí & Thanh Toán -->
              <div class="exam-section-block">
                <div class="exam-section-title">
                  <span>💰</span> 4. Viện Phí & Hóa Đơn Thanh Toán
                </div>

                <div class="exam-grid-3">
                  <div class="exam-input-group">
                    <label class="exam-label">Tiền khám chuyên khoa (VNĐ)</label>
                    <input type="number" id="fee-exam" class="exam-input" value="${billing.examFee || 200000}" step="10000" />
                  </div>
                  <div class="exam-input-group">
                    <label class="exam-label">Tiền thuốc (Tự tính từ đơn thuốc)</label>
                    <input type="number" id="fee-medicine" class="exam-input" value="${billing.medicineFee || 0}" readonly style="background: #f1f5f9; font-weight: 700;" />
                  </div>
                  <div class="exam-input-group">
                    <label class="exam-label">Dịch vụ bổ sung / Đo máy (VNĐ)</label>
                    <input type="number" id="fee-service" class="exam-input" value="${billing.serviceFee || 0}" step="10000" />
                  </div>
                </div>

                <div class="exam-grid-2">
                  <div class="exam-input-group">
                    <label class="exam-label">Miễn giảm / BHYT chi trả (VNĐ)</label>
                    <input type="number" id="fee-discount" class="exam-input" value="${billing.discount || 0}" step="10000" />
                  </div>
                  <div class="exam-input-group">
                    <label class="exam-label">Trạng thái thanh toán viện phí</label>
                    <select id="fee-payment-status" class="exam-select">
                      <option value="unpaid" ${billing.paymentStatus !== 'paid' ? 'selected' : ''}>⏳ Chưa thanh toán (Chờ quầy thu ngân / BN chuyển khoản)</option>
                      <option value="paid" ${billing.paymentStatus === 'paid' ? 'selected' : ''}>✅ Đã thanh toán đầy đủ</option>
                    </select>
                  </div>
                </div>

                <!-- Hộp tổng kết viện phí -->
                <div class="billing-summary-box">
                  <div class="billing-row">
                    <span>Tiền khám lâm sàng:</span>
                    <strong id="summary-exam-fee">200.000đ</strong>
                  </div>
                  <div class="billing-row">
                    <span>Tiền đơn thuốc điều trị:</span>
                    <strong id="summary-med-fee">0đ</strong>
                  </div>
                  <div class="billing-row">
                    <span>Kỹ thuật bổ sung:</span>
                    <strong id="summary-service-fee">0đ</strong>
                  </div>
                  <div class="billing-row">
                    <span>Giảm trừ BHYT / Ưu đãi:</span>
                    <span id="summary-discount-fee" style="color: #ef4444;">-0đ</span>
                  </div>
                  <div class="billing-row total-row">
                    <span>TỔNG CỘNG VIỆN PHÍ:</span>
                    <span id="summary-total-fee" style="font-size: 1.35rem; color: #0284c7;">200.000đ</span>
                  </div>
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="doc-modal-footer">
                <button type="button" class="btn-doc-edit" id="btn-back-to-info">⬅️ Xem Lại Thông Tin Bệnh Nhân</button>
                <button type="submit" class="btn-doc-exam" style="padding: 10px 24px; font-size: 0.95rem;">
                  <span>💾 Báo Xong & Chuyển Dữ Liệu Tới Bệnh Nhân & Admin</span>
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  `;

  // Render bảng đơn thuốc
  renderPrescriptionRows();
  recalculateBilling();

  // Sự kiện đóng modal
  const closeModal = () => { modalRoot.innerHTML = ''; };
  document.getElementById('btn-close-exam-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-exam')?.addEventListener('click', closeModal);
  document.getElementById('btn-close-info-tab')?.addEventListener('click', closeModal);

  // Xử lý chuyển tab
  const tabBtnInfo = document.getElementById('tab-btn-info');
  const tabBtnExam = document.getElementById('tab-btn-exam');
  const contentInfo = document.getElementById('tab-content-info');
  const contentExam = document.getElementById('tab-content-exam');

  const showTabInfo = () => {
    tabBtnInfo.style.background = '#0284c7';
    tabBtnInfo.style.color = '#fff';
    tabBtnExam.style.background = 'transparent';
    tabBtnExam.style.color = '#94a3b8';
    contentInfo.style.display = 'block';
    contentExam.style.display = 'none';
  };

  const showTabExam = () => {
    tabBtnExam.style.background = '#0284c7';
    tabBtnExam.style.color = '#fff';
    tabBtnInfo.style.background = 'transparent';
    tabBtnInfo.style.color = '#94a3b8';
    contentExam.style.display = 'block';
    contentInfo.style.display = 'none';
  };

  tabBtnInfo?.addEventListener('click', showTabInfo);
  tabBtnExam?.addEventListener('click', showTabExam);
  document.getElementById('btn-goto-exam-step')?.addEventListener('click', showTabExam);
  document.getElementById('btn-back-to-info')?.addEventListener('click', showTabInfo);

  // Sự kiện chọn template
  document.getElementById('exam-template-select')?.addEventListener('change', (e) => {
    const idx = e.target.value;
    if (idx !== '') {
      const tmpl = SAMPLE_DIAGNOSES[idx];
      if (tmpl) {
        document.getElementById('exam-diagnosis').value = tmpl.label;
        document.getElementById('exam-vision-r').value = tmpl.visionR;
        document.getElementById('exam-vision-l').value = tmpl.visionL;
        document.getElementById('exam-iop').value = tmpl.iop;
        document.getElementById('exam-advice').value = tmpl.advice;
        document.getElementById('fee-exam').value = tmpl.examFee || 200000;
        recalculateBilling();
        showToast('info', 'Áp dụng mẫu', `Đã điền thông tin mẫu cho: ${tmpl.label}`);
      }
    }
  });

  // Thêm thuốc
  document.getElementById('btn-add-drug')?.addEventListener('click', () => {
    const select = document.getElementById('select-sample-drug');
    const idx = select.value;
    if (idx !== '') {
      const drug = SAMPLE_EYE_DRUGS[idx];
      if (drug) {
        currentPrescription.push({
          name: drug.name,
          type: drug.type,
          quantity: 1,
          dosage: drug.dosage,
          price: drug.price
        });
        renderPrescriptionRows();
        recalculateBilling();
        select.value = '';
      }
    } else {
      // Thêm thuốc tùy biến
      currentPrescription.push({
        name: 'Thuốc nhỏ mắt tùy chỉnh',
        type: 'Dung dịch nhỏ mắt',
        quantity: 1,
        dosage: 'Nhỏ 1 giọt x 2 lần/ngày',
        price: 50000
      });
      renderPrescriptionRows();
      recalculateBilling();
    }
  });

  // Lắng nghe thay đổi viện phí
  ['fee-exam', 'fee-service', 'fee-discount'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', recalculateBilling);
  });

  // Submit Form: Báo xong & đồng bộ kết quả
  document.getElementById('doc-clinical-exam-form').addEventListener('submit', (e) => {
    e.preventDefault();

    // Thu thập dữ liệu bệnh án
    const examFee = Number(document.getElementById('fee-exam').value) || 0;
    const medicineFee = Number(document.getElementById('fee-medicine').value) || 0;
    const serviceFee = Number(document.getElementById('fee-service').value) || 0;
    const discount = Number(document.getElementById('fee-discount').value) || 0;
    const totalAmount = Math.max(0, examFee + medicineFee + serviceFee - discount);
    const paymentStatus = document.getElementById('fee-payment-status').value;

    // Truyền flat fields để completeMedicalExam tự tính billing
    const medicalRecordData = {
      examDate: new Date().toISOString().split('T')[0],
      doctorName: `${currentDoctor.degree} ${currentDoctor.name}`,
      doctorId: currentDoctor.id,
      roomName: currentDoctor.room,
      visionRight: document.getElementById('exam-vision-r').value.trim(),
      visionLeft: document.getElementById('exam-vision-l').value.trim(),
      intraocularPressure: document.getElementById('exam-iop').value.trim(),
      slitLampExam: document.getElementById('exam-slitlamp').value.trim(),
      diagnosis: document.getElementById('exam-diagnosis').value.trim(),
      advice: document.getElementById('exam-advice').value.trim(),
      revisitDate: document.getElementById('exam-revisit').value.trim(),
      // Cả hai tên được hỗ trợ (prescription & prescriptions)
      prescription: currentPrescription,
      prescriptions: currentPrescription,
      // Flat billing fields cho completeMedicalExam
      examFee,
      medicineFee,
      serviceFee,
      discount,
      totalAmount,
      paymentStatus,
      paymentMethod: paymentStatus === 'paid' ? 'Chuyển khoản / Tiền mặt' : 'Chưa thanh toán'
    };

    // Lưu vào database (AppointmentManager) — cập nhật tức thì sang Admin & Bệnh nhân
    AppointmentManager.completeMedicalExam(app.id, medicalRecordData);

    // Hiển thị thông báo
    showToast('success', 'Báo Xong Thành Công!', `Bệnh án, đơn thuốc & viện phí của bệnh nhân ${app.patientName} đã được cập nhật tức thì tới Admin và Cổng Bệnh Nhân!`);

    closeModal();
    renderShiftBanner();
    renderPatientQueue();
  });
}

/**
 * Render danh sách thuốc trong Modal
 */
function renderPrescriptionRows() {
  const tbody = document.getElementById('prescription-table-body');
  if (!tbody) return;

  if (currentPrescription.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: #94a3b8; padding: 16px;">
          Chưa kê thuốc nào. Vui lòng chọn thuốc từ danh mục phía trên.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = currentPrescription.map((drug, index) => {
    const totalDrugPrice = (Number(drug.price) || 0) * (Number(drug.quantity) || 1);
    return `
      <tr>
        <td>
          <input type="text" class="exam-input pres-name" data-index="${index}" value="${escapeHtml(drug.name)}" style="font-weight: 700; width: 100%;" />
        </td>
        <td>
          <input type="number" min="1" max="20" class="exam-input pres-qty" data-index="${index}" value="${drug.quantity || 1}" style="width: 55px;" />
        </td>
        <td>
          <input type="text" class="exam-input pres-dosage" data-index="${index}" value="${escapeHtml(drug.dosage || 'Nhỏ 1 giọt x 3 lần/ngày')}" style="width: 100%;" />
        </td>
        <td>
          <input type="number" step="1000" class="exam-input pres-price" data-index="${index}" value="${drug.price || 0}" style="width: 90px;" />
        </td>
        <td style="font-weight: 700; color: #0284c7;">
          ${formatCurrency(totalDrugPrice)}
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn-remove-drug" data-index="${index}" title="Xóa thuốc">✕</button>
        </td>
      </tr>
    `;
  }).join('');

  // Lắng nghe chỉnh sửa thuốc
  tbody.querySelectorAll('.pres-name').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = e.target.getAttribute('data-index');
      currentPrescription[idx].name = e.target.value;
    });
  });

  tbody.querySelectorAll('.pres-qty').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = e.target.getAttribute('data-index');
      currentPrescription[idx].quantity = Number(e.target.value) || 1;
      renderPrescriptionRows();
      recalculateBilling();
    });
  });

  tbody.querySelectorAll('.pres-dosage').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = e.target.getAttribute('data-index');
      currentPrescription[idx].dosage = e.target.value;
    });
  });

  tbody.querySelectorAll('.pres-price').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = e.target.getAttribute('data-index');
      currentPrescription[idx].price = Number(e.target.value) || 0;
      renderPrescriptionRows();
      recalculateBilling();
    });
  });

  tbody.querySelectorAll('.btn-remove-drug').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.getAttribute('data-index');
      currentPrescription.splice(idx, 1);
      renderPrescriptionRows();
      recalculateBilling();
    });
  });
}

/**
 * Tính toán lại viện phí thời gian thực
 */
function recalculateBilling() {
  let medicineTotal = 0;
  currentPrescription.forEach(d => {
    medicineTotal += (Number(d.price) || 0) * (Number(d.quantity) || 1);
  });

  const medInput = document.getElementById('fee-medicine');
  if (medInput) medInput.value = medicineTotal;

  const examFee = Number(document.getElementById('fee-exam')?.value) || 0;
  const serviceFee = Number(document.getElementById('fee-service')?.value) || 0;
  const discount = Number(document.getElementById('fee-discount')?.value) || 0;

  const total = Math.max(0, examFee + medicineTotal + serviceFee - discount);

  const sumExam = document.getElementById('summary-exam-fee');
  const sumMed = document.getElementById('summary-med-fee');
  const sumService = document.getElementById('summary-service-fee');
  const sumDiscount = document.getElementById('summary-discount-fee');
  const sumTotal = document.getElementById('summary-total-fee');

  if (sumExam) sumExam.textContent = formatCurrency(examFee);
  if (sumMed) sumMed.textContent = formatCurrency(medicineTotal);
  if (sumService) sumService.textContent = formatCurrency(serviceFee);
  if (sumDiscount) sumDiscount.textContent = `-${formatCurrency(discount)}`;
  if (sumTotal) sumTotal.textContent = formatCurrency(total);
}

/**
 * In Bệnh Án & Đơn Thuốc
 */
function openPrintModal(app) {
  const rec = app.medicalRecord || {};
  const billing = app.billing || {};
  const modalRoot = document.getElementById('doctor-portal-modal-root');
  if (!modalRoot) return;

  modalRoot.innerHTML = `
    <div class="doc-modal-overlay">
      <div class="doc-modal-window" style="max-width: 800px;">
        <div class="doc-modal-header">
          <div class="doc-modal-title">📄 Phiếu Khám & Đơn Thuốc Bệnh Viện</div>
          <button type="button" class="doc-modal-close-btn" id="btn-close-print-modal">✕</button>
        </div>
        <div class="doc-modal-body" id="print-area" style="background: #ffffff; color: #000000; padding: 2.5rem; font-family: 'Times New Roman', serif;">
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 1rem; margin-bottom: 1.5rem;">
            <div>
              <h2 style="font-size: 1.25rem; font-weight: bold; text-transform: uppercase;">PHÒNG KHÁM CHUYÊN KHOA MẮT DOCTOR4</h2>
              <p style="font-size: 0.9rem;">Địa chỉ: 123 Đường Nguyễn Tri Phương, Quận 5, TP.HCM</p>
              <p style="font-size: 0.9rem;">Hotline: 1800 1234 &nbsp;|&nbsp; Cổng Bác sĩ: ${currentDoctor.room || 'Phòng 101'}</p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 0.85rem;">Mã hồ sơ: <strong>${app.id}</strong></p>
              <p style="font-size: 0.85rem;">Ngày khám: <strong>${rec.examDate || app.date}</strong></p>
            </div>
          </div>

          <h1 style="text-align: center; font-size: 1.6rem; font-weight: bold; margin-bottom: 1.5rem; text-transform: uppercase;">
            PHIẾU KHÁM BỆNH & ĐƠN THUỐC ĐIỀU TRỊ
          </h1>

          <div style="margin-bottom: 1.5rem; line-height: 1.8; font-size: 1rem;">
            <div>Họ và tên người bệnh: <strong>${escapeHtml(app.patientName).toUpperCase()}</strong> &nbsp;&nbsp;&nbsp; Giới tính: ${app.patientGender || 'Nam/Nữ'} &nbsp;&nbsp;&nbsp; SĐT: ${app.patientPhone}</div>
            <div>Bác sĩ điều trị: <strong>${rec.doctorName || currentDoctor.name}</strong> &nbsp;&nbsp;&nbsp; Phòng khám: ${rec.roomName || currentDoctor.room}</div>
            <div>Chẩn đoán kết luận: <strong style="text-decoration: underline;">${rec.diagnosis || 'Chưa cập nhật'}</strong></div>
          </div>

          <div style="margin-bottom: 1.5rem; border: 1px solid #000; padding: 10px; font-size: 0.95rem;">
            <div style="font-weight: bold; margin-bottom: 4px;">CHỈ SỐ KHÁM MẮT:</div>
            <div>• Thị lực Mắt Phải (OD): <strong>${rec.visionRight || '10/10'}</strong> &nbsp;|&nbsp; Thị lực Mắt Trái (OS): <strong>${rec.visionLeft || '10/10'}</strong></div>
            <div>• Nhãn áp: <strong>${rec.intraocularPressure || '15 mmHg'}</strong> &nbsp;|&nbsp; Khám sinh hiển vi: ${rec.slitLampExam || 'Bình thường'}</div>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 1rem;">ĐƠN THUỐC ĐIỀU TRỊ:</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
              <thead>
                <tr style="border-bottom: 1px solid #000;">
                  <th style="text-align: left; padding: 6px 0;">STT</th>
                  <th style="text-align: left; padding: 6px 0;">Tên thuốc & Hàm lượng</th>
                  <th style="text-align: center; padding: 6px 0;">SL</th>
                  <th style="text-align: left; padding: 6px 0;">Cách dùng & Liều lượng</th>
                </tr>
              </thead>
              <tbody>
                ${(rec.prescription || []).map((d, i) => `
                  <tr style="border-bottom: 1px dashed #ccc;">
                    <td style="padding: 6px 0;">${i + 1}</td>
                    <td style="padding: 6px 0; font-weight: bold;">${escapeHtml(d.name)}</td>
                    <td style="padding: 6px 0; text-align: center;">${d.quantity || 1}</td>
                    <td style="padding: 6px 0;">${escapeHtml(d.dosage || '')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="margin-bottom: 1.5rem; font-size: 0.95rem; line-height: 1.6;">
            <div>Lời dặn bác sĩ: <em>${rec.advice || 'Dùng thuốc đúng liều lượng, tái khám đúng hẹn.'}</em></div>
            <div>Hẹn tái khám: <strong>${rec.revisitDate || 'Sau 1 tháng'}</strong></div>
            <div>Tổng viện phí: <strong>${formatCurrency(billing.totalAmount || 200000)}</strong> (${billing.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'})</div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 2.5rem; text-align: center;">
            <div style="min-width: 200px;">
              <div style="font-size: 0.9rem; font-style: italic;">TP.HCM, ngày ${new Date().toLocaleDateString('vi-VN')}</div>
              <div style="font-weight: bold; margin-top: 4px;">BÁC SĨ ĐIỀU TRỊ</div>
              <div style="margin-top: 50px; font-weight: bold; color: #0284c7;">${rec.doctorName || currentDoctor.name}</div>
            </div>
          </div>
        </div>

        <div class="doc-modal-footer">
          <button type="button" class="btn-doc-edit" id="btn-close-print-modal-2">Đóng</button>
          <button type="button" class="btn-doc-exam" id="btn-do-print">
            <span>🖨️ In Bệnh Án & Đơn Thuốc</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const closePrint = () => { modalRoot.innerHTML = ''; };
  document.getElementById('btn-close-print-modal')?.addEventListener('click', closePrint);
  document.getElementById('btn-close-print-modal-2')?.addEventListener('click', closePrint);

  document.getElementById('btn-do-print')?.addEventListener('click', () => {
    window.print();
  });
}

/**
 * Toast thông báo
 */
function showToast(type = 'info', title = 'Thông báo', message = '') {
  let container = document.getElementById('doctor-portal-toast');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `doc-toast ${type}`;
  toast.innerHTML = `
    <div style="font-size: 1.25rem;">${type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️')}</div>
    <div>
      <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 2px;">${title}</div>
      <div style="font-size: 0.85rem; color: #cbd5e1;">${message}</div>
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function formatCurrency(val) {
  return (Number(val) || 0).toLocaleString('vi-VN') + 'đ';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
