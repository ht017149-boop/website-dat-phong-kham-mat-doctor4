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
      roomId: doctorData.roomId || 'R110',
      room: doctorData.room.trim() || 'Phòng 110 - Khám Mắt Tổng Quát',
      schedule: doctorData.schedule.trim() || 'Thứ 2 - Thứ 6 (08:00 - 17:00)',
      status: doctorData.status || 'active',
      rating: Number(doctorData.rating) || 5.0,
      reviewsCount: Number(doctorData.reviewsCount) || 0,
      avatar: doctorData.avatar.trim() || SAMPLE_AVATARS[0],
      bio: doctorData.bio.trim() || 'Bác sĩ chuyên khoa tại phòng khám mắt Doctor4.',
      createdAt: new Date().toISOString()
    };

    list.unshift(newDoc);
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
