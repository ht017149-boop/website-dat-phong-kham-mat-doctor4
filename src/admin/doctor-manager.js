/* ============================================================
   src/admin/doctor-manager.js — Doctor4 Eye Clinic
   Xử lý toàn bộ logic CRUD Quản lý Bác sĩ chuyên khoa Mắt
   ============================================================ */

import { INITIAL_10_DOCTORS, CLINIC_ROOMS } from '../data/clinic-data.js';

const DOCTORS_STORAGE_KEY = 'doctor4_doctors_db';

// Preset avatars cho việc thêm nhanh bác sĩ
export const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1594824813587-578d5236f2f2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'
];

export const DoctorManager = {
  /**
   * Lấy danh sách toàn bộ bác sĩ (10 bác sĩ)
   */
  getDoctors() {
    try {
      const data = localStorage.getItem(DOCTORS_STORAGE_KEY);
      if (!data) {
        localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(INITIAL_10_DOCTORS));
        return INITIAL_10_DOCTORS;
      }
      const parsed = JSON.parse(data);
      // Nếu dữ liệu cũ có ít hơn 10 bác sĩ, tự động nâng cấp lên 10 bác sĩ
      if (Array.isArray(parsed) && parsed.length < 10) {
        localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(INITIAL_10_DOCTORS));
        return INITIAL_10_DOCTORS;
      }
      return parsed;
    } catch (e) {
      console.error('Lỗi khi đọc dữ liệu bác sĩ:', e);
      return INITIAL_10_DOCTORS;
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
   * Lấy các bác sĩ theo Chuyên khoa / Bệnh lý (nhiều bác sĩ cùng khám 1 bệnh)
   */
  getDoctorsBySpecialty(specialtyCode) {
    const list = this.getDoctors();
    if (!specialtyCode || specialtyCode === 'all') return list;
    return list.filter(d => d.specialtyCode === specialtyCode);
  },

  /**
   * Thêm bác sĩ mới (Create) - Đồng thời tạo tài khoản đăng nhập cho bác sĩ
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
      phone: (doctorData.phone || '').trim() || 'Chưa cập nhật',
      email: (doctorData.email || '').trim() || 'doctor@doctor4.vn',
      roomId: doctorData.roomId || 'R110',
      room: (doctorData.room || '').trim() || 'Phòng 110 - Khám Mắt Tổng Quát',
      schedule: (doctorData.schedule || '').trim() || 'Thứ 2 - Thứ 6 (08:00 - 17:00)',
      status: doctorData.status || 'active',
      rating: Number(doctorData.rating) || 5.0,
      reviewsCount: Number(doctorData.reviewsCount) || 0,
      avatar: (doctorData.avatar || '').trim() || SAMPLE_AVATARS[0],
      bio: (doctorData.bio || '').trim() || 'Bác sĩ chuyên khoa tại phòng khám mắt Doctor4.',
      createdAt: new Date().toISOString()
    };

    list.unshift(newDoc);
    localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(list));

    // Đồng bộ tài khoản đăng nhập vào Cổng Bác sĩ (doctor4_users_db)
    syncDoctorLoginUser(newDoc, doctorData.password || '123456');

    return newDoc;
  },

  addDoctor(doctorData) {
    return this.createDoctor(doctorData);
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

    // Đồng bộ cập nhật tài khoản đăng nhập
    syncDoctorLoginUser(list[index], updatedData.password);

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

    // Xóa tài khoản đăng nhập nếu có
    try {
      const USERS_KEY = 'doctor4_users_db';
      const raw = localStorage.getItem(USERS_KEY);
      if (raw) {
        let users = JSON.parse(raw);
        users = users.filter(u => String(u.doctorId) !== String(id) && u.id !== `user_${id}`);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    } catch (e) {
      console.error(e);
    }

    return true;
  },

  /**
   * Khôi phục dữ liệu 10 bác sĩ gốc
   */
  resetToDefault() {
    localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(INITIAL_10_DOCTORS));
    return INITIAL_10_DOCTORS;
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

/**
 * Đồng bộ tài khoản bác sĩ vào doctor4_users_db
 */
export function syncDoctorLoginUser(doc, password = '123456') {
  try {
    const USERS_STORAGE_KEY = 'doctor4_users_db';
    let users = [];
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      users = JSON.parse(raw);
    }
    const cleanEmail = (doc.email || `doc.${doc.id}@doctor4.vn`).toLowerCase();
    const cleanPhone = doc.phone || '';
    const index = users.findIndex(u => 
      u.id === `user_${doc.id}` || 
      (u.doctorId && String(u.doctorId) === String(doc.id)) ||
      (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) ||
      (cleanPhone && u.phone && u.phone === cleanPhone)
    );

    const docUserData = {
      id: `user_${doc.id}`,
      doctorId: doc.id,
      name: doc.name,
      email: cleanEmail,
      phone: cleanPhone || '0988000000',
      password: password || '123456',
      role: 'doctor',
      degree: doc.degree || 'BS. Nhãn khoa',
      specialty: doc.specialty || 'Chuyên khoa Mắt',
      room: doc.room || 'Phòng khám Mắt',
      roomId: doc.roomId || 'R101',
      schedule: doc.schedule || 'Thứ 2 - Thứ 6 (08:00 - 17:00)',
      avatar: doc.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      users[index] = { ...users[index], ...docUserData, password: password || users[index].password || '123456' };
    } else {
      users.push(docUserData);
    }

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Lỗi khi đồng bộ tài khoản bác sĩ:', err);
  }
}
