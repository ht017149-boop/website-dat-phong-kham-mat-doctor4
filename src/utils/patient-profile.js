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
    dob: profile.dob || appOrUser.dob || '15/08/1992',
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
