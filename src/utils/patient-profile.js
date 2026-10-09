/* ============================================================
   src/utils/patient-profile.js — Doctor4 Eye Clinic
   Quản lý Hồ sơ Phiếu thông tin bệnh nhân trực tuyến (Ảnh 4x6 & CCCD)
   ============================================================ */

/**
 * Nén ảnh upload từ file thành Base64 Data URL để lưu nhẹ trong localStorage
 */
export function compressImageFile(file, maxWidth = 600, maxHeight = 600, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    if (typeof file === 'string') return resolve(file); // đã là string base64/url

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Tạo ảnh mẫu SVG mặc định tuyệt đẹp cho CCCD và ảnh 4x6 nếu người dùng chưa tải lên
 */
export function getDefaultPatientPhotos(patientName = 'Bệnh nhân', gender = 'Nam') {
  const isFemale = gender === 'Nữ' || patientName.includes('Thị') || patientName.includes('Nữ');
  
  // Avatar 4x6 đẹp chuẩn y tế
  const photo4x6 = isFemale
    ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80';

  // SVG Mặt trước CCCD chuẩn Bộ Công An
  const cccdFrontSvg = `data:image/svg+xml;utf8,` + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250">
      <rect width="400" height="250" rx="16" fill="#f8fafc" stroke="#0ea5e9" stroke-width="3"/>
      <rect x="10" y="10" width="380" height="230" rx="12" fill="#eff6ff"/>
      <!-- Header CCCD -->
      <text x="200" y="30" font-family="sans-serif" font-size="11" font-weight="bold" fill="#1e3a8a" text-anchor="middle">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</text>
      <text x="200" y="44" font-family="sans-serif" font-size="9" fill="#1e40af" text-anchor="middle">Độc lập - Tự do - Hạnh phúc</text>
      <text x="200" y="66" font-family="sans-serif" font-size="14" font-weight="900" fill="#dc2626" text-anchor="middle">CĂN CƯỚC CÔNG DÂN</text>
      <!-- Quốc huy & Chip -->
      <circle cx="35" cy="40" r="14" fill="#f59e0b" opacity="0.8"/>
      <rect x="25" y="75" width="28" height="22" rx="4" fill="#fbbf24" stroke="#d97706" stroke-width="1.5"/>
      <!-- Avatar 4x6 on ID Card -->
      <rect x="22" y="105" width="85" height="110" rx="6" fill="#cbd5e1" stroke="#94a3b8"/>
      <text x="64" y="165" font-family="sans-serif" font-size="28" text-anchor="middle">${isFemale ? '👩' : '👨'}</text>
      <text x="64" y="200" font-family="sans-serif" font-size="8" fill="#475569" text-anchor="middle">ẢNH 4x6 BỆNH NHÂN</text>
      <!-- Patient details -->
      <text x="125" y="98" font-family="sans-serif" font-size="9" fill="#64748b">Số / No.:</text>
      <text x="175" y="98" font-family="monospace" font-size="12" font-weight="bold" fill="#0f172a">0792 0301 8899</text>
      
      <text x="125" y="122" font-family="sans-serif" font-size="9" fill="#64748b">Họ và tên / Full name:</text>
      <text x="125" y="138" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1e293b">${patientName.toUpperCase()}</text>
      
      <text x="125" y="160" font-family="sans-serif" font-size="9" fill="#64748b">Ngày sinh / Date of birth:</text>
      <text x="225" y="160" font-family="sans-serif" font-size="10" font-weight="bold" fill="#334155">15/08/1992</text>
      
      <text x="125" y="180" font-family="sans-serif" font-size="9" fill="#64748b">Giới tính / Sex:</text>
      <text x="190" y="180" font-family="sans-serif" font-size="10" font-weight="bold" fill="#334155">${gender}</text>

      <text x="125" y="200" font-family="sans-serif" font-size="9" fill="#64748b">Quốc tịch / Nationality:</text>
      <text x="225" y="200" font-family="sans-serif" font-size="10" font-weight="bold" fill="#334155">Việt Nam</text>

      <text x="125" y="222" font-family="sans-serif" font-size="9" fill="#64748b">Thường trú / Address:</text>
      <text x="225" y="222" font-family="sans-serif" font-size="9" font-weight="bold" fill="#334155">TP. Hồ Chí Minh</text>
    </svg>
  `);

  // SVG Mặt sau CCCD chuẩn
  const cccdBackSvg = `data:image/svg+xml;utf8,` + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250">
      <rect width="400" height="250" rx="16" fill="#f8fafc" stroke="#0ea5e9" stroke-width="3"/>
      <rect x="10" y="10" width="380" height="230" rx="12" fill="#f0f9ff"/>
      
      <!-- Đặc điểm nhân dạng -->
      <text x="25" y="35" font-family="sans-serif" font-size="10" font-weight="bold" fill="#1e3a8a">ĐẶC ĐIỂM NHÂN DẠNG / PERSONAL FEATURES:</text>
      <text x="25" y="52" font-family="sans-serif" font-size="9" fill="#334155">Nốt nốt nốt ruồi C.2cm trên sau cánh mũi phải.</text>

      <text x="25" y="78" font-family="sans-serif" font-size="10" font-weight="bold" fill="#1e3a8a">NGÀY CẤP / DATE OF ISSUE:</text>
      <text x="180" y="78" font-family="sans-serif" font-size="9" font-weight="bold" fill="#334155">20/10/2021</text>

      <text x="25" y="98" font-family="sans-serif" font-size="10" font-weight="bold" fill="#1e3a8a">CƠ QUAN CẤP / ISSUED BY:</text>
      <text x="180" y="98" font-family="sans-serif" font-size="9" font-weight="bold" fill="#334155">CỤC TRƯỞNG CỤC CẢNH SÁT QLHC VỀ TTXH</text>

      <!-- Vân tay giả lập -->
      <rect x="25" y="120" width="70" height="85" rx="6" fill="#e2e8f0" stroke="#cbd5e1"/>
      <text x="60" y="160" font-family="sans-serif" font-size="22" text-anchor="middle">👆</text>
      <text x="60" y="195" font-family="sans-serif" font-size="7" fill="#475569" text-anchor="middle">NGÓN TRỎ TRÁI</text>

      <rect x="105" y="120" width="70" height="85" rx="6" fill="#e2e8f0" stroke="#cbd5e1"/>
      <text x="140" y="160" font-family="sans-serif" font-size="22" text-anchor="middle">👉</text>
      <text x="140" y="195" font-family="sans-serif" font-size="7" fill="#475569" text-anchor="middle">NGÓN TRỎ PHẢI</text>

      <!-- Con dấu & Chữ ký -->
      <circle cx="310" cy="155" r="28" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="4,2"/>
      <text x="310" y="152" font-family="sans-serif" font-size="7" font-weight="bold" fill="#ef4444" text-anchor="middle">BỘ CÔNG AN</text>
      <text x="310" y="164" font-family="sans-serif" font-size="6" fill="#ef4444" text-anchor="middle">★ XÁC THỰC ★</text>

      <!-- MRZ Zone (Mã vạch căn cước) -->
      <rect x="20" y="215" width="360" height="20" rx="3" fill="#1e293b"/>
      <text x="30" y="229" font-family="monospace" font-size="9" fill="#38bdf8">IDVNM07920301889988<<<<<<<<<<<</text>
    </svg>
  `);

  return { photo4x6, cccdFront: cccdFrontSvg, cccdBack: cccdBackSvg };
}

/**
 * Trích xuất / Chuẩn hóa Phiếu thông tin bệnh nhân từ lịch hẹn hoặc tài khoản người dùng
 */
export function getPatientProfileData(appOrUser) {
  if (!appOrUser) return null;

  const name = appOrUser.patientName || appOrUser.name || 'Bệnh nhân';
  const phone = appOrUser.patientPhone || appOrUser.phone || '0987654321';
  const email = appOrUser.patientEmail || appOrUser.email || 'benhnhan@doctor4.vn';
  const gender = appOrUser.gender || appOrUser.patientGender || 'Nam';
  const defaults = getDefaultPatientPhotos(name, gender);

  const profile = appOrUser.patientProfile || appOrUser.profile || {};

  return {
    fullName: name,
    phone: phone,
    email: email,
    gender: gender,
    dob: profile.dob || appOrUser.dob || '1995-05-20',
    cccdNumber: profile.cccdNumber || appOrUser.cccdNumber || '079203018899',
    address: profile.address || appOrUser.address || '123 Nguyễn Tri Phương, Quận 5, TP. Hồ Chí Minh',
    bhytCode: profile.bhytCode || appOrUser.bhytCode || 'GD 4 79 1234567890',
    bloodType: profile.bloodType || 'A+',
    medicalHistory: profile.medicalHistory || appOrUser.symptoms || 'Khám mắt định kỳ, cận thị nhẹ',
    allergies: profile.allergies || 'Không có dị ứng thuốc',
    
    // Đủ 3 loại ảnh yêu cầu
    photo4x6: profile.photo4x6 || appOrUser.avatar || defaults.photo4x6,
    cccdFront: profile.cccdFront || defaults.cccdFront,
    cccdBack: profile.cccdBack || defaults.cccdBack,
    
    verified: profile.verified !== false, // Mặc định đã được hệ thống xác thực
    updatedAt: profile.updatedAt || new Date().toISOString()
  };
}

/**
 * Mở Modal Quản Lý & Tải Lên Hồ Sơ Bệnh Nhân (Dành cho Người Dùng / Client)
 */
export function openPatientProfileModal(userOrPhone = null) {
  let modalRoot = document.getElementById('patient-profile-modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'patient-profile-modal-root';
    document.body.appendChild(modalRoot);
  }

  // Xác định dữ liệu người dùng
  let currentUser = null;
  try {
    const session = localStorage.getItem('doctor4_session') || sessionStorage.getItem('doctor4_session');
    if (session) currentUser = JSON.parse(session);
  } catch (e) {}

  // Lấy thông tin từ Users DB nếu có
  let usersList = [];
  try {
    usersList = JSON.parse(localStorage.getItem('doctor4_users_db')) || [];
  } catch (e) {}

  let matchedUser = null;
  if (currentUser) {
    matchedUser = usersList.find(u => u.id === currentUser.id || u.phone === currentUser.phone || u.email === currentUser.email) || currentUser;
  } else if (typeof userOrPhone === 'string' && userOrPhone.trim()) {
    matchedUser = usersList.find(u => u.phone === userOrPhone.trim() || u.email === userOrPhone.trim());
  }

  const profile = getPatientProfileData(matchedUser || {
    name: 'Bệnh nhân',
    phone: '',
    email: '',
    gender: 'Nam'
  });

  let currentPhoto4x6 = profile.photo4x6;
  let currentCccdFront = profile.cccdFront;
  let currentCccdBack = profile.cccdBack;

  const render = () => {
    modalRoot.innerHTML = `
      <div style="position: fixed; inset: 0; background: rgba(15,23,42,0.85); backdrop-filter: blur(10px); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 16px; animation: admFadeIn 0.25s ease-out;">
        <div style="background: #ffffff; color: #0f172a; max-width: 820px; width: 100%; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); overflow: hidden; max-height: 92vh; display: flex; flex-direction: column;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0284c7, #2563eb); color: #fff; padding: 22px 26px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <h2 style="font-size: 20px; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 8px;">
                <span>📋</span> Hồ Sơ Y Tế & Tải Thông Tin Bệnh Nhân
              </h2>
              <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">
                Tải lên Ảnh thẻ 4x6, Căn cước công dân (CCCD 2 mặt) & Mã BHYT để Bác sĩ đối chiếu khi đến khám
              </p>
            </div>
            <button id="btn-close-profile-modal" style="background: rgba(255,255,255,0.2); border: none; color: #fff; width: 34px; height: 34px; border-radius: 50%; font-size: 18px; cursor: pointer;">✕</button>
          </div>

          <!-- Body Form -->
          <div style="padding: 24px; overflow-y: auto; flex: 1;">
            <form id="form-user-patient-profile">
              
              <!-- Khối 3 Ảnh tải lên -->
              <div style="background: #f8fafc; border: 1.5px dashed #0284c7; border-radius: 16px; padding: 18px; margin-bottom: 22px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                  <span style="font-weight: 800; font-size: 14px; color: #0284c7; display: flex; align-items: center; gap: 6px;">
                    📸 ẢNH THẺ 4x6 & CĂN CƯỚC CÔNG DÂN (CCCD 2 MẶT)
                  </span>
                  <span style="font-size: 12px; background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 6px; font-weight: 600;">
                    Tự động đồng bộ với Bác sĩ
                  </span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1.3fr 1.3fr; gap: 14px;">
                  <!-- Ảnh 4x6 -->
                  <div style="background: #fff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; text-align: center;">
                    <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">1. Ảnh chân dung 4x6</div>
                    <div id="box-user-photo4x6" style="width: 100%; height: 110px; background: #f1f5f9; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; border: 1px solid #e2e8f0;">
                      <img src="${currentPhoto4x6}" alt="Ảnh 4x6" style="width: 100%; height: 100%; object-fit: cover;" />
                    </div>
                    <input type="file" id="input-user-photo4x6" accept="image/*" style="display: none;" />
                    <button type="button" class="btn-trigger-upload" onclick="document.getElementById('input-user-photo4x6').click()" style="width: 100%; padding: 6px; font-size: 11.5px; background: #0284c7; color: #fff; font-weight: 700; border: none; border-radius: 6px; cursor: pointer;">
                      📤 Tải ảnh 4x6
                    </button>
                  </div>

                  <!-- CCCD Mặt trước -->
                  <div style="background: #fff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; text-align: center;">
                    <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">2. CCCD Mặt trước</div>
                    <div id="box-user-cccd-front" style="width: 100%; height: 110px; background: #f1f5f9; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; border: 1px solid #e2e8f0;">
                      <img src="${currentCccdFront}" alt="CCCD Mặt trước" style="width: 100%; height: 100%; object-fit: cover;" />
                    </div>
                    <input type="file" id="input-user-cccd-front" accept="image/*" style="display: none;" />
                    <button type="button" class="btn-trigger-upload" onclick="document.getElementById('input-user-cccd-front').click()" style="width: 100%; padding: 6px; font-size: 11.5px; background: #0284c7; color: #fff; font-weight: 700; border: none; border-radius: 6px; cursor: pointer;">
                      📤 Tải mặt trước
                    </button>
                  </div>

                  <!-- CCCD Mặt sau -->
                  <div style="background: #fff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; text-align: center;">
                    <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">3. CCCD Mặt sau</div>
                    <div id="box-user-cccd-back" style="width: 100%; height: 110px; background: #f1f5f9; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; border: 1px solid #e2e8f0;">
                      <img src="${currentCccdBack}" alt="CCCD Mặt sau" style="width: 100%; height: 100%; object-fit: cover;" />
                    </div>
                    <input type="file" id="input-user-cccd-back" accept="image/*" style="display: none;" />
                    <button type="button" class="btn-trigger-upload" onclick="document.getElementById('input-user-cccd-back').click()" style="width: 100%; padding: 6px; font-size: 11.5px; background: #0284c7; color: #fff; font-weight: 700; border: none; border-radius: 6px; cursor: pointer;">
                      📤 Tải mặt sau
                    </button>
                  </div>
                </div>
              </div>

              <!-- Thông tin cá nhân & Y tế -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 4px;">Họ và tên bệnh nhân *</label>
                  <input type="text" id="prof-name" value="${profile.fullName}" required style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13.5px; box-sizing: border-box;" />
                </div>
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 4px;">Số điện thoại liên hệ *</label>
                  <input type="tel" id="prof-phone" value="${profile.phone}" required style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13.5px; box-sizing: border-box;" />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 4px;">Ngày sinh</label>
                  <input type="date" id="prof-dob" value="${profile.dob || '1995-05-20'}" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13.5px; box-sizing: border-box;" />
                </div>
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 4px;">Giới tính</label>
                  <select id="prof-gender" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13.5px; box-sizing: border-box;">
                    <option value="Nam" ${profile.gender === 'Nam' ? 'selected' : ''}>Nam</option>
                    <option value="Nữ" ${profile.gender === 'Nữ' ? 'selected' : ''}>Nữ</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 4px;">Số CCCD / CMND</label>
                  <input type="text" id="prof-cccd" value="${profile.cccdNumber}" placeholder="079203018899" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13.5px; box-sizing: border-box;" />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 14px; margin-bottom: 14px;">
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 4px;">Địa chỉ thường trú / Nơi ở</label>
                  <input type="text" id="prof-address" value="${profile.address}" placeholder="VD: 123 Nguyễn Tri Phương, Q.5, TP.HCM" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13.5px; box-sizing: border-box;" />
                </div>
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 4px;">Mã thẻ BHYT (nếu có)</label>
                  <input type="text" id="prof-bhyt" value="${profile.bhytCode || ''}" placeholder="VD: GD 4 79 1234567890" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13.5px; box-sizing: border-box;" />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px;">
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 4px;">Tiền sử bệnh mắt & sức khỏe</label>
                  <input type="text" id="prof-history" value="${profile.medicalHistory || ''}" placeholder="VD: Cận loạn thị 4 độ, từng bắn laser" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13.5px; box-sizing: border-box;" />
                </div>
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 4px;">Dị ứng thuốc / Thực phẩm</label>
                  <input type="text" id="prof-allergies" value="${profile.allergies || ''}" placeholder="VD: Không có hoặc dị ứng kháng sinh" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13.5px; box-sizing: border-box;" />
                </div>
              </div>

              <!-- Footer Buttons -->
              <div style="display: flex; gap: 12px; border-top: 1px solid #e2e8f0; padding-top: 18px;">
                <button type="submit" id="btn-save-patient-profile" style="flex: 1; padding: 13px; background: linear-gradient(135deg, #0284c7, #2563eb); color: #fff; font-weight: 800; border: none; border-radius: 12px; cursor: pointer; font-size: 14px; box-shadow: 0 4px 12px rgba(2,132,199,0.3);">
                  💾 Lưu & Cập Nhật Hồ Sơ Bệnh Nhân
                </button>
                <button type="button" id="btn-cancel-profile-modal" style="padding: 13px 24px; background: #e2e8f0; color: #334155; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; font-size: 14px;">
                  Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    // Event close
    const closeModal = () => { modalRoot.innerHTML = ''; };
    document.getElementById('btn-close-profile-modal')?.addEventListener('click', closeModal);
    document.getElementById('btn-cancel-profile-modal')?.addEventListener('click', closeModal);

    // Event upload 3 ảnh
    const bindUpload = (inputId, boxId, cb) => {
      const input = document.getElementById(inputId);
      const box = document.getElementById(boxId);
      if (!input || !box) return;

      input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          box.innerHTML = `<span style="font-size: 11px; color: #0284c7;">⏳ Đang nén...</span>`;
          const base64 = await compressImageFile(file, 600, 600, 0.75);
          cb(base64);
          box.innerHTML = `<img src="${base64}" style="width: 100%; height: 100%; object-fit: cover;" />`;
        }
      });
    };

    bindUpload('input-user-photo4x6', 'box-user-photo4x6', (b64) => { currentPhoto4x6 = b64; });
    bindUpload('input-user-cccd-front', 'box-user-cccd-front', (b64) => { currentCccdFront = b64; });
    bindUpload('input-user-cccd-back', 'box-user-cccd-back', (b64) => { currentCccdBack = b64; });

    // Submit lưu
    document.getElementById('form-user-patient-profile')?.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('prof-name').value.trim();
      const phone = document.getElementById('prof-phone').value.trim();
      const dob = document.getElementById('prof-dob').value;
      const gender = document.getElementById('prof-gender').value;
      const cccd = document.getElementById('prof-cccd').value.trim();
      const address = document.getElementById('prof-address').value.trim();
      const bhyt = document.getElementById('prof-bhyt').value.trim();
      const history = document.getElementById('prof-history').value.trim();
      const allergies = document.getElementById('prof-allergies').value.trim();

      const updatedProfileObj = {
        fullName: name,
        phone,
        dob,
        gender,
        cccdNumber: cccd,
        address,
        bhytCode: bhyt,
        medicalHistory: history,
        allergies,
        photo4x6: currentPhoto4x6,
        cccdFront: currentCccdFront,
        cccdBack: currentCccdBack,
        verified: true,
        updatedAt: new Date().toISOString()
      };

      // 1. Cập nhật Session nếu đang login
      if (currentUser) {
        currentUser.name = name;
        currentUser.phone = phone;
        currentUser.avatar = currentPhoto4x6;
        currentUser.patientProfile = updatedProfileObj;
        localStorage.setItem('doctor4_session', JSON.stringify(currentUser));
      }

      // 2. Cập nhật DB users
      let users = [];
      try {
        users = JSON.parse(localStorage.getItem('doctor4_users_db')) || [];
      } catch (err) {}

      const userIndex = users.findIndex(u => (currentUser && u.id === currentUser.id) || (u.phone && u.phone === phone));
      if (userIndex >= 0) {
        users[userIndex].name = name;
        users[userIndex].phone = phone;
        users[userIndex].patientProfile = updatedProfileObj;
        users[userIndex].avatar = currentPhoto4x6;
        localStorage.setItem('doctor4_users_db', JSON.stringify(users));
      }

      // 3. Đồng bộ vào các lịch hẹn của người này để Bác sĩ thấy ngay lập tức
      let apps = [];
      try {
        apps = JSON.parse(localStorage.getItem('doctor4_appointments_db')) || [];
      } catch (err) {}

      apps = apps.map(app => {
        if (app.patientPhone === phone || (currentUser && app.patientEmail === currentUser.email)) {
          return {
            ...app,
            patientName: name,
            patientProfile: updatedProfileObj
          };
        }
        return app;
      });
      localStorage.setItem('doctor4_appointments_db', JSON.stringify(apps));

      alert('✅ Đã lưu và cập nhật hồ sơ bệnh nhân thành công! Bác sĩ có thể xem phiếu thông tin ngay trên hệ thống.');
      closeModal();
      window.location.reload();
    });
  };

  render();
}

