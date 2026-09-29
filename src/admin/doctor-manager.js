/* ============================================================
   src/admin/doctor-manager.js — Doctor4 Eye Clinic
   Xử lý toàn bộ logic CRUD Quản lý Bác sĩ chuyên khoa Mắt
   ============================================================ */

const DOCTORS_STORAGE_KEY = 'doctor4_doctors_db';

// Dữ liệu bác sĩ mẫu khởi tạo chất lượng cao
export const INITIAL_DOCTORS = [
  {
    id: 'doc_1',
    name: 'Nguyễn Minh Quân',
    degree: 'BS. CKII - Trưởng khoa',
    specialty: 'Nhãn khoa – Phẫu thuật LASIK',
    specialtyCode: 'lasik',
    experience: 20,
    patientsCount: 8500,
    phone: '0912 345 678',
    email: 'quan.nm@doctor4.vn',
    room: 'Phòng 101 - Khám Chuyên Sâu',
    schedule: 'Thứ 2, 4, 6 (08:00 - 17:00)',
    status: 'active', // 'active' (Đang trực), 'busy' (Bận phẫu thuật), 'off' (Tạm nghỉ)
    rating: 5.0,
    reviewsCount: 312,
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
    bio: 'Chuyên gia đầu ngành về phẫu thuật khúc xạ SMILE & Femto-LASIK, nguyên Trưởng khoa Mắt BV Mắt Trung Ương.',
    createdAt: '2024-01-15T08:00:00.000Z'
  },
  {
    id: 'doc_2',
    name: 'Trần Thị Lan Anh',
    degree: 'TS. Bác sĩ Nhãn khoa',
    specialty: 'Glôcôm – Bệnh võng mạc',
    specialtyCode: 'glocom',
    experience: 15,
    patientsCount: 6200,
    phone: '0983 456 789',
    email: 'lananh.tt@doctor4.vn',
    room: 'Phòng 102 - Điều trị Glôcôm',
    schedule: 'Thứ 3, 5, 7 (08:30 - 16:30)',
    status: 'active',
    rating: 4.9,
    reviewsCount: 248,
    avatar: 'https://images.unsplash.com/photo-1594824813587-578d5236f2f2?w=300&auto=format&fit=crop&q=80',
    bio: 'Tiến sĩ Y khoa chuyên ngành Nhãn khoa tại Đại học Y Hà Nội, chuyên gia chẩn đoán và điều trị bệnh võng mạc tiểu đường, Glôcôm.',
    createdAt: '2024-02-10T09:30:00.000Z'
  },
  {
    id: 'doc_3',
    name: 'Lê Hoàng Phúc',
    degree: 'ThS. Bác sĩ - Phó khoa',
    specialty: 'Đục thủy tinh thể – Phẫu thuật Phaco',
    specialtyCode: 'cataract',
    experience: 12,
    patientsCount: 4800,
    phone: '0904 123 999',
    email: 'phuc.lh@doctor4.vn',
    room: 'Phòng 103 - Phẫu thuật Phaco',
    schedule: 'Thứ 2, 3, 5, 6 (08:00 - 17:30)',
    status: 'busy',
    rating: 4.8,
    reviewsCount: 186,
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
    bio: 'Đã thực hiện hơn 3,000 ca phẫu thuật Phaco thay thủy tinh thể đa tiêu cự thành công an toàn, bảo tồn thị lực tối ưu.',
    createdAt: '2024-03-01T10:00:00.000Z'
  },
  {
    id: 'doc_4',
    name: 'Phạm Thu Hà',
    degree: 'BS. Chuyên khoa I',
    specialty: 'Nhãn khoa trẻ em – Khúc xạ',
    specialtyCode: 'pediatric',
    experience: 10,
    patientsCount: 3500,
    phone: '0977 888 666',
    email: 'ha.pt@doctor4.vn',
    room: 'Phòng 104 - Khám Mắt Trẻ Em',
    schedule: 'Thứ 4, Thứ 7, Chủ Nhật (08:00 - 18:00)',
    status: 'active',
    rating: 4.9,
    reviewsCount: 155,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
    bio: 'Nhiều năm kinh nghiệm kiểm soát cận thị tiến triển ở trẻ em bằng Ortho-K và kính kiểm soát cận thị cao cấp.',
    createdAt: '2024-03-20T14:20:00.000Z'
  },
  {
    id: 'doc_5',
    name: 'Vũ Đức Mạnh',
    degree: 'BS. Thạc sĩ Nhãn khoa',
    specialty: 'Khám mắt tổng quát & Khúc xạ',
    specialtyCode: 'general',
    experience: 8,
    patientsCount: 2900,
    phone: '0936 777 888',
    email: 'manh.vd@doctor4.vn',
    room: 'Phòng 105 - Khám Tổng Quát',
    schedule: 'Thứ 2 đến Thứ 6 (08:00 - 16:30)',
    status: 'off',
    rating: 4.7,
    reviewsCount: 98,
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80',
    bio: 'Bác sĩ trẻ tận tâm, giàu kinh nghiệm trong chẩn đoán hội chứng thị giác màn hình, viêm kết mạc và đo tật khúc xạ chuẩn xác.',
    createdAt: '2024-04-05T11:15:00.000Z'
  }
];

// Preset avatars cho việc thêm nhanh bác sĩ
export const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1594824813587-578d5236f2f2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80'
];

export const DoctorManager = {
  /**
   * Lấy danh sách toàn bộ bác sĩ
   */
  getDoctors() {
    try {
      const data = localStorage.getItem(DOCTORS_STORAGE_KEY);
      if (!data) {
        localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(INITIAL_DOCTORS));
        return INITIAL_DOCTORS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Lỗi khi đọc dữ liệu bác sĩ:', e);
      return INITIAL_DOCTORS;
    }
  },

  /**
   * Lấy thông tin 1 bác sĩ theo ID
   */
  getDoctorById(id) {
    const list = this.getDoctors();
    return list.find(d => String(d.id) === String(id)) || null;
  },

  /**
   * Thêm bác sĩ mới (Create)
   */
  createDoctor(doctorData) {
    const list = this.getDoctors();
    const newDoc = {
      id: 'doc_' + Date.now(),
      name: doctorData.name.trim(),
      degree: doctorData.degree.trim() || 'BS. Nhãn khoa',
      specialty: doctorData.specialty.trim() || 'Khám Mắt Tổng Quát',
      specialtyCode: doctorData.specialtyCode || 'general',
      experience: Number(doctorData.experience) || 1,
      patientsCount: Number(doctorData.patientsCount) || 0,
      phone: doctorData.phone.trim() || 'Chưa cập nhật',
      email: doctorData.email.trim() || 'doctor@doctor4.vn',
      room: doctorData.room.trim() || 'Phòng Khám Tổng Quát',
      schedule: doctorData.schedule.trim() || 'Thứ 2 - Thứ 6 (08:00 - 17:00)',
      status: doctorData.status || 'active',
      rating: Number(doctorData.rating) || 5.0,
      reviewsCount: Number(doctorData.reviewsCount) || 0,
      avatar: doctorData.avatar.trim() || SAMPLE_AVATARS[0],
      bio: doctorData.bio.trim() || 'Bác sĩ chuyên khoa tại phòng khám mắt Doctor4.',
      createdAt: new Date().toISOString()
    };

    list.unshift(newDoc); // Đưa lên đầu bảng
    localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(list));
    return newDoc;
  },

  /**
   * Cập nhật thông tin bác sĩ (Update)
   */
  updateDoctor(id, updatedData) {
    const list = this.getDoctors();
    const index = list.findIndex(d => String(d.id) === String(id));
    if (index === -1) return null;

    list[index] = {
      ...list[index],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(list));
    return list[index];
  },

  /**
   * Xóa bác sĩ (Delete)
   */
  deleteDoctor(id) {
    const list = this.getDoctors();
    const filtered = list.filter(d => String(d.id) !== String(id));
    if (filtered.length === list.length) return false;

    localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  /**
   * Khôi phục dữ liệu bác sĩ gốc
   */
  resetToDefault() {
    localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(INITIAL_DOCTORS));
    return INITIAL_DOCTORS;
  },

  /**
   * Lọc và tìm kiếm bác sĩ
   */
  filterDoctors(list, { query = '', specialty = 'all', status = 'all' } = {}) {
    let result = [...list];

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(d => 
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.specialty && d.specialty.toLowerCase().includes(q)) ||
        (d.phone && d.phone.includes(q)) ||
        (d.room && d.room.toLowerCase().includes(q))
      );
    }

    if (specialty && specialty !== 'all') {
      result = result.filter(d => d.specialtyCode === specialty || d.specialty.toLowerCase().includes(specialty.toLowerCase()));
    }

    if (status && status !== 'all') {
      result = result.filter(d => d.status === status);
    }

    return result;
  }
};
