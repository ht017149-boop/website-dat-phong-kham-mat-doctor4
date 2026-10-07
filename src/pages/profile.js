/* ============================================================
   src/pages/profile.js — Doctor4 Eye Clinic
   Controller & Logic Quản Lý Thông Tin Người Dùng & Hồ Sơ Bệnh Án
   ============================================================ */

import '../css/style.css';
import '../css/profile.css';
import { renderHeader, renderFooter, setupHeaderEvents } from '../components/layout.js';
import { AuthService } from './auth.js';
import { getUserAppointments, cancelUserAppointment } from './my-appointments.js';
import { CLINIC_ROOMS } from '../data/clinic-data.js';

// Danh sách Avatar mẫu để người dùng chọn nhanh
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80'
];

let currentUserData = null;
let currentApptFilter = 'all';

/**
 * Khởi tạo trang Profile
 */
export function initProfilePage() {
  // Render Header & Footer
  const headerContainer = document.getElementById('header-container');
  if (headerContainer) headerContainer.innerHTML = renderHeader('profile');

  const footerContainer = document.getElementById('footer-container');
  if (footerContainer) footerContainer.innerHTML = renderFooter();

  setupHeaderEvents();

  // Kiểm tra phiên đăng nhập
  const sessionUser = AuthService.getCurrentUser();
  const guardEl = document.getElementById('profile-auth-guard');
  const mainWrapperEl = document.getElementById('profile-main-wrapper');

  if (!sessionUser) {
    if (guardEl) guardEl.style.display = 'block';
    if (mainWrapperEl) mainWrapperEl.style.display = 'none';
    setupAuthGuardEvents();
    return;
  }

  // Đã đăng nhập
  if (guardEl) guardEl.style.display = 'none';
  if (mainWrapperEl) mainWrapperEl.style.display = 'block';

  // Lấy dữ liệu chi tiết nhất từ database (hoặc session)
  const fullUser = AuthService.getUserById(sessionUser.id) || sessionUser;
  currentUserData = fullUser;

  // Render các khu vực
  renderHeroBanner(fullUser);
  setupTabNavigation();
  populatePersonalInfo(fullUser);
  setupPersonalInfoEvents();
  populateEyeHealth(fullUser);
  setupEyeHealthEvents();
  renderUserAppointments();
  setupSecurityEvents();
  setupAvatarModal();
  setupLogoutButton();
}

/**
 * Xử lý khi chưa đăng nhập (Nút demo 1-chạm)
 */
function setupAuthGuardEvents() {
  const btnDemoLogin = document.getElementById('btn-guard-quick-demo');
  if (btnDemoLogin) {
    btnDemoLogin.addEventListener('click', () => {
      try {
        AuthService.login('benhnhan@doctor4.vn', '123456', true);
        showToast('success', 'Đăng nhập thành công!', 'Chào mừng bệnh nhân mẫu Nguyễn Văn An!');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (e) {
        showToast('error', 'Lỗi', e.message);
      }
    });
  }
}

/**
 * Hiển thị Banner Hero người dùng
 */
function renderHeroBanner(user) {
  const avatarEl = document.getElementById('hero-avatar-img');
  const nameEl = document.getElementById('hero-user-name');
  const emailEl = document.getElementById('hero-user-email');
  const phoneEl = document.getElementById('hero-user-phone');
  const addressEl = document.getElementById('hero-user-address');
  const roleEl = document.getElementById('hero-user-role');
  const codeEl = document.getElementById('hero-patient-code');

  const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name || 'User')}`;

  if (avatarEl) avatarEl.src = user.avatar || defaultAvatar;
  if (nameEl) nameEl.textContent = user.name || 'Người dùng Doctor4';
  if (emailEl) emailEl.textContent = user.email || 'Chưa cập nhật email';
  if (phoneEl) phoneEl.textContent = user.phone || 'Chưa cập nhật SĐT';
  if (addressEl) addressEl.textContent = user.address ? (user.address.length > 30 ? user.address.slice(0, 30) + '...' : user.address) : 'TP. Hồ Chí Minh';
  if (roleEl) roleEl.textContent = user.role === 'admin' ? '🛡️ Quản trị viên' : '👤 Bệnh nhân';
  if (codeEl) codeEl.textContent = `Mã BN: ${user.id ? user.id.toUpperCase().replace('USR_', 'BN-') : 'BN-2026'}`;
}

/**
 * Thiết lập chuyển đổi Tabs
 */
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.profile-tab-btn');
  const tabContents = document.querySelectorAll('.profile-tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetEl = document.getElementById(`tab-${targetTab}`);
      if (targetEl) targetEl.classList.add('active');

      // Cuộn nhẹ nếu trên mobile
      if (window.innerWidth < 960) {
        targetEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/**
 * Điền thông tin cá nhân vào form
 */
function populatePersonalInfo(user) {
  setInputValue('info-name', user.name || '');
  setInputValue('info-phone', user.phone || '');
  setInputValue('info-email', user.email || '');
  setInputValue('info-birthday', user.birthday || '');
  setInputValue('info-gender', user.gender || 'Nam');
  setInputValue('info-bhyt', user.bhyt || '');
  setInputValue('info-address', user.address || '');
  setInputValue('info-emergency', user.emergencyContact || '');
}

/**
 * Bắt sự kiện chỉnh sửa & lưu thông tin cá nhân
 */
function setupPersonalInfoEvents() {
  const btnEdit = document.getElementById('btn-edit-personal');
  const btnSave = document.getElementById('btn-save-personal');
  const btnCancel = document.getElementById('btn-cancel-personal');
  const formInputs = document.querySelectorAll('.personal-input-field');

  if (btnEdit) {
    btnEdit.addEventListener('click', () => {
      formInputs.forEach(input => input.disabled = false);
      btnEdit.style.display = 'none';
      if (btnSave) btnSave.style.display = 'inline-flex';
      if (btnCancel) btnCancel.style.display = 'inline-flex';
      document.getElementById('info-name')?.focus();
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      populatePersonalInfo(currentUserData);
      formInputs.forEach(input => input.disabled = true);
      btnEdit.style.display = 'inline-flex';
      btnSave.style.display = 'none';
      btnCancel.style.display = 'none';
    });
  }

  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const name = document.getElementById('info-name')?.value.trim();
      const phone = document.getElementById('info-phone')?.value.trim();
      const email = document.getElementById('info-email')?.value.trim();
      const birthday = document.getElementById('info-birthday')?.value;
      const gender = document.getElementById('info-gender')?.value;
      const bhyt = document.getElementById('info-bhyt')?.value.trim();
      const address = document.getElementById('info-address')?.value.trim();
      const emergencyContact = document.getElementById('info-emergency')?.value.trim();

      if (!name || name.length < 2) {
        showToast('error', 'Lỗi nhập liệu', 'Vui lòng nhập họ và tên hợp lệ (tối thiểu 2 ký tự)');
        return;
      }

      if (!phone) {
        showToast('error', 'Lỗi nhập liệu', 'Vui lòng nhập số điện thoại liên hệ');
        return;
      }

      const updatePayload = {
        name,
        phone,
        email,
        birthday,
        gender,
        bhyt,
        address,
        emergencyContact
      };

      try {
        const updated = AuthService.updateUserProfile(currentUserData.id, updatePayload);
        currentUserData = updated;

        // Cập nhật lại giao diện Hero
        renderHeroBanner(updated);

        // Khóa lại form
        formInputs.forEach(input => input.disabled = true);
        btnEdit.style.display = 'inline-flex';
        btnSave.style.display = 'none';
        btnCancel.style.display = 'none';

        showToast('success', 'Cập nhật thành công', 'Thông tin cá nhân của bạn đã được lưu an toàn.');
      } catch (err) {
        showToast('error', 'Cập nhật thất bại', err.message);
      }
    });
  }
}

/**
 * Điền thông tin thị lực & sức khỏe mắt
 */
function populateEyeHealth(user) {
  const p = user.eyeProfile || {
    odSphere: '-2.50',
    odCyl: '-0.75',
    odAxis: '175',
    odIop: '14',
    osSphere: '-2.25',
    osCyl: '-0.50',
    osAxis: '180',
    osIop: '15',
    glassesType: 'Kính gọng chống ánh sáng xanh',
    lastCheckup: '2026-09-15',
    nextCheckup: '2026-12-15',
    notes: 'Thị lực sau chỉnh kính đạt 10/10 hai mắt. Cần nhỏ mắt nước mắt nhân tạo khi khô mỏi.'
  };

  // Mắt Phải (OD)
  setTextContent('metric-od-sph', p.odSphere ? `${p.odSphere} D` : '-2.50 D');
  setTextContent('metric-od-cyl', p.odCyl ? `${p.odCyl} D` : '-0.75 D');
  setTextContent('metric-od-axis', p.odAxis ? `${p.odAxis}°` : '175°');
  setTextContent('metric-od-iop', p.odIop ? `${p.odIop} mmHg` : '14 mmHg');

  // Mắt Trái (OS)
  setTextContent('metric-os-sph', p.osSphere ? `${p.osSphere} D` : '-2.25 D');
  setTextContent('metric-os-cyl', p.osCyl ? `${p.osCyl} D` : '-0.50 D');
  setTextContent('metric-os-axis', p.osAxis ? `${p.osAxis}°` : '180°');
  setTextContent('metric-os-iop', p.osIop ? `${p.osIop} mmHg` : '15 mmHg');

  // Form inputs
  setInputValue('eye-input-od-sph', p.odSphere || '-2.50');
  setInputValue('eye-input-od-cyl', p.odCyl || '-0.75');
  setInputValue('eye-input-od-axis', p.odAxis || '175');
  setInputValue('eye-input-od-iop', p.odIop || '14');

  setInputValue('eye-input-os-sph', p.osSphere || '-2.25');
  setInputValue('eye-input-os-cyl', p.osCyl || '-0.50');
  setInputValue('eye-input-os-axis', p.osAxis || '180');
  setInputValue('eye-input-os-iop', p.osIop || '15');

  setInputValue('eye-glasses-type', p.glassesType || 'Kính gọng chống ánh sáng xanh');
  setInputValue('eye-last-checkup', p.lastCheckup || '2026-09-15');
  setInputValue('eye-next-checkup', p.nextCheckup || '2026-12-15');
  setInputValue('eye-notes', p.notes || '');

  // Lời dặn hiển thị tĩnh
  setTextContent('eye-view-glasses', p.glassesType || 'Kính gọng chống ánh sáng xanh');
  setTextContent('eye-view-last-checkup', formatDateVi(p.lastCheckup) || '15/09/2026');
  setTextContent('eye-view-next-checkup', formatDateVi(p.nextCheckup) || '15/12/2026');
  setTextContent('eye-view-notes', p.notes || 'Thị lực ổn định, tiếp tục dùng kính theo đơn.');
}

/**
 * Bắt sự kiện cập nhật chỉ số mắt
 */
function setupEyeHealthEvents() {
  const btnEdit = document.getElementById('btn-edit-eye');
  const btnSave = document.getElementById('btn-save-eye');
  const btnCancel = document.getElementById('btn-cancel-eye');
  const formBox = document.getElementById('eye-edit-form-box');
  const viewBox = document.getElementById('eye-view-spec-box');

  if (btnEdit && formBox && viewBox) {
    btnEdit.addEventListener('click', () => {
      formBox.style.display = 'block';
      viewBox.style.display = 'none';
      btnEdit.style.display = 'none';
      if (btnSave) btnSave.style.display = 'inline-flex';
      if (btnCancel) btnCancel.style.display = 'inline-flex';
    });
  }

  if (btnCancel && formBox && viewBox) {
    btnCancel.addEventListener('click', () => {
      populateEyeHealth(currentUserData);
      formBox.style.display = 'none';
      viewBox.style.display = 'block';
      btnEdit.style.display = 'inline-flex';
      btnSave.style.display = 'none';
      btnCancel.style.display = 'none';
    });
  }

  if (btnSave && formBox && viewBox) {
    btnSave.addEventListener('click', () => {
      const eyeProfile = {
        odSphere: document.getElementById('eye-input-od-sph')?.value.trim() || '-2.50',
        odCyl: document.getElementById('eye-input-od-cyl')?.value.trim() || '-0.75',
        odAxis: document.getElementById('eye-input-od-axis')?.value.trim() || '175',
        odIop: document.getElementById('eye-input-od-iop')?.value.trim() || '14',
        osSphere: document.getElementById('eye-input-os-sph')?.value.trim() || '-2.25',
        osCyl: document.getElementById('eye-input-os-cyl')?.value.trim() || '-0.50',
        osAxis: document.getElementById('eye-input-os-axis')?.value.trim() || '180',
        osIop: document.getElementById('eye-input-os-iop')?.value.trim() || '15',
        glassesType: document.getElementById('eye-glasses-type')?.value.trim() || '',
        lastCheckup: document.getElementById('eye-last-checkup')?.value || '',
        nextCheckup: document.getElementById('eye-next-checkup')?.value || '',
        notes: document.getElementById('eye-notes')?.value.trim() || ''
      };

      try {
        const updated = AuthService.updateUserProfile(currentUserData.id, { eyeProfile });
        currentUserData = updated;

        populateEyeHealth(updated);

        formBox.style.display = 'none';
        viewBox.style.display = 'block';
        btnEdit.style.display = 'inline-flex';
        btnSave.style.display = 'none';
        btnCancel.style.display = 'none';

        showToast('success', 'Đã lưu chỉ số mắt', 'Hồ sơ sức khỏe mắt của bạn đã được cập nhật thành công.');
      } catch (err) {
        showToast('error', 'Lỗi', err.message);
      }
    });
  }
}

/**
 * Hiển thị danh sách Lịch khám của người dùng
 */
function renderUserAppointments() {
  const container = document.getElementById('user-appointments-list');
  const countBadge = document.getElementById('badge-appt-count');
  const highlightBox = document.getElementById('upcoming-highlight-card');

  if (!currentUserData || !container) return;

  // Lấy lịch theo SĐT hoặc Email
  const allUserAppts = getUserAppointments(currentUserData.phone || currentUserData.email);

  if (countBadge) {
    const activeAppts = allUserAppts.filter(a => a.status === 'confirmed' || a.status === 'pending');
    countBadge.textContent = activeAppts.length;
  }

  // Lọc theo tab filter
  let displayList = allUserAppts;
  if (currentApptFilter === 'upcoming') {
    displayList = allUserAppts.filter(a => a.status === 'confirmed' || a.status === 'pending');
  } else if (currentApptFilter === 'completed') {
    displayList = allUserAppts.filter(a => a.status === 'completed');
  } else if (currentApptFilter === 'cancelled') {
    displayList = allUserAppts.filter(a => a.status === 'cancelled');
  }

  // Hiển thị thẻ lịch sắp tới gần nhất ở đầu nếu có
  const nextAppt = allUserAppts.find(a => a.status === 'confirmed' || a.status === 'pending');
  if (highlightBox) {
    if (nextAppt) {
      highlightBox.style.display = 'block';
      highlightBox.innerHTML = `
        <div style="background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%); border: 1.5px solid #bfdbfe; border-radius: 16px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="font-size: 2.2rem; background: #fff; width: 54px; height: 54px; border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37,99,235,0.15);">📅</div>
            <div>
              <div style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; color: #2563eb; letter-spacing: 0.5px;">Lịch Khám Gần Nhất Sắp Tới</div>
              <div style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 2px 0;">
                ${nextAppt.serviceName || 'Khám Mắt'} — ${nextAppt.doctorName || 'Bác sĩ chuyên khoa'}
              </div>
              <div style="font-size: 0.85rem; color: #475569;">
                📍 <strong>${nextAppt.roomName || 'Phòng khám chuyên khoa'}</strong> &nbsp;|&nbsp; ⏰ <strong>${nextAppt.timeSlot || '09:00'} ngày ${formatDateVi(nextAppt.date)}</strong>
              </div>
            </div>
          </div>
          <button type="button" class="btn-view-ticket" data-id="${nextAppt.id}" style="padding: 10px 18px; font-size: 0.88rem; box-shadow: 0 4px 12px rgba(37,99,235,0.25);">
            🎫 Xem vé khám ngay →
          </button>
        </div>
      `;
      highlightBox.querySelector('.btn-view-ticket')?.addEventListener('click', () => {
        openAppointmentTicketModal(nextAppt);
      });
    } else {
      highlightBox.style.display = 'none';
    }
  }

  // Danh sách chính
  if (displayList.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <div class="empty-state-icon">📋</div>
        <h3>Không có lịch khám nào</h3>
        <p>Bạn hiện chưa có lịch hẹn khám nào trong danh mục này.</p>
        <a href="/index.html#dat-lich" class="btn-guard-login" style="display: inline-flex; width: auto; margin-top: 0.5rem;">
          📅 Đặt lịch khám mắt ngay
        </a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="appt-cards-list">
      ${displayList.map(appt => {
        const statusMap = {
          confirmed: { text: 'Đã xác nhận', cls: 'confirmed', icon: '✅' },
          pending: { text: 'Chờ duyệt', cls: 'pending', icon: '⏳' },
          in_progress: { text: 'Đang khám', cls: 'in_progress', icon: '🩺' },
          completed: { text: 'Đã hoàn thành', cls: 'completed', icon: '🎉' },
          cancelled: { text: 'Đã hủy', cls: 'cancelled', icon: '❌' }
        };
        const st = statusMap[appt.status] || { text: appt.status, cls: 'pending', icon: 'ℹ️' };

        return `
          <div class="appt-card-item" data-id="${appt.id}">
            <div class="appt-card-header">
              <div class="appt-code-group">
                <span class="appt-code">🎫 ${appt.id}</span>
                <span class="status-badge ${st.cls}">${st.icon} ${st.text}</span>
              </div>
              <div style="font-size: 0.8rem; color: #64748b;">
                Tạo lúc: ${formatDateVi(appt.createdAt)}
              </div>
            </div>

            <div class="appt-card-main-grid">
              <div class="appt-detail-col">
                <span class="label">Dịch vụ khám</span>
                <strong>${appt.serviceName || 'Khám chuyên khoa'}</strong>
              </div>

              <div class="appt-detail-col">
                <span class="label">Bác sĩ phụ trách</span>
                <strong>👨‍⚕️ ${appt.doctorName || 'Bác sĩ trực ban'}</strong>
              </div>

              <div class="appt-detail-col">
                <span class="label">Địa điểm khám</span>
                <div class="appt-room-pill">
                  📍 ${appt.roomName || 'Phòng 101'}
                </div>
              </div>

              <div class="appt-detail-col">
                <span class="label">Ngày & Khung giờ</span>
                <strong>📅 ${formatDateVi(appt.date)} (${appt.timeSlot || '08:00'})</strong>
              </div>
            </div>

            <div class="appt-card-footer">
              <div class="appt-symptoms-snippet">
                📝 <strong>Triệu chứng:</strong> ${appt.symptoms || 'Khám theo dõi định kỳ.'}
              </div>

              <div class="appt-card-btns">
                <button type="button" class="btn-view-ticket btn-ticket-trigger" data-id="${appt.id}">
                  🎫 Chi tiết vé khám
                </button>
                ${appt.status !== 'cancelled' && appt.status !== 'completed' ? `
                  <button type="button" class="btn-cancel-appt btn-cancel-trigger" data-id="${appt.id}">
                    ✕ Hủy lịch
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Bắt sự kiện các nút trên từng thẻ
  container.querySelectorAll('.btn-ticket-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = allUserAppts.find(a => a.id === id);
      if (item) openAppointmentTicketModal(item);
    });
  });

  container.querySelectorAll('.btn-cancel-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const isConfirm = confirm(`Bạn có chắc chắn muốn hủy lịch hẹn mã ${id} không?`);
      if (isConfirm) {
        cancelUserAppointment(id);
        showToast('info', 'Đã hủy lịch hẹn', `Lịch hẹn ${id} đã được chuyển sang trạng thái đã hủy.`);
        renderUserAppointments();
      }
    });
  });

  // Bắt sự kiện bộ lọc nếu chưa gán
  setupAppointmentFilterBtns();
}

/**
 * Bắt sự kiện bộ lọc lịch hẹn
 */
function setupAppointmentFilterBtns() {
  document.querySelectorAll('.btn-filter-appt').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.btn-filter-appt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentApptFilter = btn.getAttribute('data-filter');
      renderUserAppointments();
    };
  });
}

/**
 * Hiển thị Modal Vé Khám Điện Tử
 */
function openAppointmentTicketModal(appt) {
  let modalRoot = document.getElementById('profile-ticket-modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'profile-ticket-modal-root';
    document.body.appendChild(modalRoot);
  }

  // Tìm thông tin phòng
  const roomInfo = CLINIC_ROOMS.find(r => r.id === appt.roomId || appt.roomName?.includes(r.number));

  modalRoot.innerHTML = `
    <div class="profile-modal-overlay">
      <div class="profile-modal-dialog">
        <div class="profile-modal-header">
          <h3><span>🎫</span> Vé Khám Điện Tử Doctor4</h3>
          <button type="button" class="btn-close-modal" id="btn-close-ticket">✕</button>
        </div>

        <div class="profile-modal-body">
          <div class="ticket-container">
            <div class="ticket-header-row">
              <div>
                <div style="font-weight: 800; color: #2563eb; font-size: 1.15rem;">👁️ DOCTOR4 EYE CLINIC</div>
                <div style="font-size: 0.8rem; color: #64748b;">Phiếu Tiếp Nhận Thăm Khám Ưu Tiên</div>
              </div>
              <div style="text-align: right;">
                <div style="font-family: monospace; font-size: 1.1rem; font-weight: 900; color: #0f172a;">${appt.id}</div>
                <span class="status-badge confirmed">Đã xác thực</span>
              </div>
            </div>

            <!-- Vị trí phòng khám nổi bật -->
            <div class="ticket-room-highlight">
              <span class="room-num">📍 ${appt.roomName || (roomInfo ? `${roomInfo.number} - ${roomInfo.name}` : 'Phòng 101')}</span>
              <span class="room-name">${roomInfo ? `${roomInfo.floor} • Thiết bị: ${roomInfo.equipment}` : 'Tầng 1 - Khu Thăm Khám Nhãn Khoa'}</span>
            </div>

            <div class="ticket-grid">
              <div class="ticket-grid-item">
                <span>Họ và tên bệnh nhân:</span>
                <strong>${appt.patientName || currentUserData.name}</strong>
              </div>

              <div class="ticket-grid-item">
                <span>Số điện thoại:</span>
                <strong>${appt.patientPhone || currentUserData.phone}</strong>
              </div>

              <div class="ticket-grid-item">
                <span>Bác sĩ phụ trách:</span>
                <strong>👨‍⚕️ ${appt.doctorName}</strong>
              </div>

              <div class="ticket-grid-item">
                <span>Dịch vụ khám:</span>
                <strong>${appt.serviceName}</strong>
              </div>

              <div class="ticket-grid-item">
                <span>Ngày hẹn khám:</span>
                <strong>📅 ${formatDateVi(appt.date)}</strong>
              </div>

              <div class="ticket-grid-item">
                <span>Khung giờ hẹn:</span>
                <strong>⏰ ${appt.timeSlot || '09:00 - 10:00'}</strong>
              </div>
            </div>

            <div style="background: #f1f5f9; padding: 10px 14px; border-radius: 10px; font-size: 0.82rem; color: #334155; margin-bottom: 1rem;">
              ℹ️ <strong>Lưu ý cho bệnh nhân:</strong> Vui lòng có mặt trước giờ hẹn 10 phút tại quầy lễ tân để đo nhãn áp ban đầu. Nếu khám đo khúc xạ phẫu thuật, vui lòng tháo kính áp tròng mềm tối thiểu 3 ngày trước khi khám.
            </div>

            <!-- Mock QR code -->
            <div class="ticket-qr-mock">
              <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
                <rect x="5" y="5" width="3" height="3" fill="#1e293b"></rect>
                <rect x="16" y="5" width="3" height="3" fill="#1e293b"></rect>
                <rect x="5" y="16" width="3" height="3" fill="#1e293b"></rect>
                <path d="M14 14h3v3h-3z"></path>
                <path d="M20 14v3h-3"></path>
                <path d="M14 20h3"></path>
                <path d="M20 20v.01"></path>
              </svg>
              <div style="font-size: 0.75rem; color: #64748b;">Quét mã QR tại quầy tiếp đón để in số thứ tự tự động</div>
            </div>
          </div>

          <div style="margin-top: 1.25rem; display: flex; gap: 10px; justify-content: flex-end;">
            <button type="button" class="btn-guard-register" onclick="window.print()" style="padding: 9px 18px; font-size: 0.88rem;">
              🖨️ In vé khám
            </button>
            <button type="button" class="btn-guard-login" id="btn-close-ticket-footer" style="padding: 9px 22px; font-size: 0.88rem;">
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const closeBtn = modalRoot.querySelector('#btn-close-ticket');
  const closeFooter = modalRoot.querySelector('#btn-close-ticket-footer');
  const overlay = modalRoot.querySelector('.profile-modal-overlay');

  const closeHandler = () => { modalRoot.innerHTML = ''; };
  closeBtn?.addEventListener('click', closeHandler);
  closeFooter?.addEventListener('click', closeHandler);
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closeHandler();
  });
}

/**
 * Xử lý Đổi Mật Khẩu
 */
function setupSecurityEvents() {
  const form = document.getElementById('form-change-password');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const currentPwd = document.getElementById('pwd-current')?.value;
    const newPwd = document.getElementById('pwd-new')?.value;
    const confirmPwd = document.getElementById('pwd-confirm')?.value;

    if (!currentPwd) {
      showToast('error', 'Lỗi', 'Vui lòng nhập mật khẩu hiện tại');
      return;
    }

    if (!newPwd || newPwd.length < 6) {
      showToast('error', 'Lỗi', 'Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }

    if (newPwd !== confirmPwd) {
      showToast('error', 'Lỗi', 'Mật khẩu xác nhận không trùng khớp');
      return;
    }

    try {
      AuthService.changePassword(currentUserData.id, currentPwd, newPwd);
      showToast('success', 'Thành công', 'Đã đổi mật khẩu tài khoản thành công!');
      form.reset();
    } catch (err) {
      showToast('error', 'Đổi mật khẩu thất bại', err.message);
    }
  });
}

/**
 * Xử lý đổi Avatar
 */
function setupAvatarModal() {
  const triggerBtn = document.getElementById('btn-trigger-change-avatar');
  const fileInput = document.getElementById('input-file-avatar');

  // Chọn nhanh từ file ảnh máy tính
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        showToast('error', 'Lỗi', 'Vui lòng chọn định dạng file ảnh hợp lệ');
        return;
      }

      const reader = new FileReader();
      reader.onload = function(evt) {
        const base64Data = evt.target.result;
        updateUserAvatar(base64Data);
      };
      reader.readAsDataURL(file);
    });
  }

  // Hoặc mở modal chọn avatar có sẵn
  if (triggerBtn) {
    triggerBtn.addEventListener('click', () => {
      openAvatarSelectModal();
    });
  }
}

function openAvatarSelectModal() {
  let modalRoot = document.getElementById('profile-avatar-modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'profile-avatar-modal-root';
    document.body.appendChild(modalRoot);
  }

  let selectedUrl = currentUserData.avatar || PRESET_AVATARS[0];

  modalRoot.innerHTML = `
    <div class="profile-modal-overlay">
      <div class="profile-modal-dialog" style="max-width: 480px;">
        <div class="profile-modal-header">
          <h3><span>📷</span> Cập Nhật Ảnh Đại Diện</h3>
          <button type="button" class="btn-close-modal" id="btn-close-avatar-modal">✕</button>
        </div>

        <div class="profile-modal-body">
          <p style="font-size: 0.88rem; color: #64748b; margin-top: 0;">
            Chọn ảnh từ bộ sưu tập hoặc tải ảnh trực tiếp từ máy của bạn:
          </p>

          <div class="avatar-preset-grid">
            ${PRESET_AVATARS.map((url, idx) => `
              <div class="avatar-preset-item ${url === selectedUrl ? 'selected' : ''}" data-url="${url}">
                <img src="${url}" alt="Avatar mẫu ${idx + 1}" />
              </div>
            `).join('')}
          </div>

          <div style="margin: 1.5rem 0; text-align: center;">
            <label for="input-file-avatar-modal" class="btn-guard-register" style="cursor: pointer; display: inline-flex; gap: 6px;">
              📁 Tải ảnh từ máy tính
            </label>
            <input type="file" id="input-file-avatar-modal" accept="image/*" style="display: none;" />
          </div>

          <div style="display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
            <button type="button" class="btn-profile-cancel" id="btn-cancel-avatar">Hủy</button>
            <button type="button" class="btn-guard-login" id="btn-confirm-avatar" style="padding: 9px 20px;">Lưu ảnh đại diện</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const presetItems = modalRoot.querySelectorAll('.avatar-preset-item');
  presetItems.forEach(item => {
    item.addEventListener('click', () => {
      presetItems.forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      selectedUrl = item.getAttribute('data-url');
    });
  });

  const fileInputModal = modalRoot.querySelector('#input-file-avatar-modal');
  fileInputModal?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        selectedUrl = evt.target.result;
        updateUserAvatar(selectedUrl);
        modalRoot.innerHTML = '';
      };
      reader.readAsDataURL(file);
    }
  });

  const closeHandler = () => { modalRoot.innerHTML = ''; };
  modalRoot.querySelector('#btn-close-avatar-modal')?.addEventListener('click', closeHandler);
  modalRoot.querySelector('#btn-cancel-avatar')?.addEventListener('click', closeHandler);

  modalRoot.querySelector('#btn-confirm-avatar')?.addEventListener('click', () => {
    updateUserAvatar(selectedUrl);
    modalRoot.innerHTML = '';
  });
}

function updateUserAvatar(newAvatarUrl) {
  try {
    const updated = AuthService.updateUserProfile(currentUserData.id, { avatar: newAvatarUrl });
    currentUserData = updated;

    const img = document.getElementById('hero-avatar-img');
    if (img) img.src = newAvatarUrl;

    showToast('success', 'Ảnh đại diện', 'Đã cập nhật ảnh đại diện thành công!');
  } catch (e) {
    showToast('error', 'Lỗi', e.message);
  }
}

/**
 * Xử lý Đăng Xuất
 */
function setupLogoutButton() {
  const logoutBtn = document.getElementById('btn-profile-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      const isConfirm = confirm('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?');
      if (isConfirm) {
        AuthService.logout();
        window.location.href = '/dang-nhap.html';
      }
    });
  }
}

/**
 * Tiện ích hiển thị Toast thông báo
 */
function showToast(type = 'info', title = 'Thông báo', message = '') {
  let container = document.getElementById('profile-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'profile-toast-container';
    container.className = 'profile-toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  const toast = document.createElement('div');
  toast.className = `profile-toast ${type}`;
  toast.innerHTML = `
    <span style="font-size: 1.3rem;">${icons[type] || '🔔'}</span>
    <div>
      <div style="font-weight: 700; font-size: 0.92rem; margin-bottom: 2px;">${title}</div>
      <div style="font-size: 0.84rem; color: #475569;">${message}</div>
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Helper functions
function setInputValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function setTextContent(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function formatDateVi(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
}

// Khởi chạy khi tài liệu sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProfilePage);
} else {
  initProfilePage();
}
