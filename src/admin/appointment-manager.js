/* ============================================================
   src/admin/appointment-manager.js — Doctor4 Eye Clinic
   Quản lý Đặt Lịch Khám & Xếp Phòng (10 Phòng - 10 Bác Sĩ)
   ============================================================ */

import { CLINIC_ROOMS, CLINIC_SERVICES, INITIAL_APPOINTMENTS } from '../data/clinic-data.js';
import { DoctorManager } from './doctor-manager.js';

const APPOINTMENTS_STORAGE_KEY = 'doctor4_appointments_db';

export const AppointmentManager = {
  /**
   * Lấy danh sách toàn bộ lịch hẹn
   */
  getAppointments() {
    try {
      const data = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      if (!data) {
        localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
        return INITIAL_APPOINTMENTS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Lỗi khi đọc lịch hẹn:', e);
      return INITIAL_APPOINTMENTS;
    }
  },

  /**
   * Lấy lịch hẹn theo ID
   */
  getAppointmentById(id) {
    const list = this.getAppointments();
    return list.find(a => String(a.id) === String(id)) || null;
  },

  /**
   * Tạo lịch hẹn mới (từ website hoặc admin)
   */
  createAppointment(data) {
    const list = this.getAppointments();
    const doctors = DoctorManager.getDoctors();
    const rooms = CLINIC_ROOMS;

    // Tìm bác sĩ
    const doc = doctors.find(d => String(d.id) === String(data.doctorId)) || doctors[0];
    
    // Tìm phòng (theo dữ liệu truyền vào hoặc phòng mặc định của bác sĩ/chuyên khoa)
    let selectedRoom = rooms.find(r => r.id === data.roomId || r.number === data.roomName);
    if (!selectedRoom && doc && doc.roomId) {
      selectedRoom = rooms.find(r => r.id === doc.roomId);
    }
    if (!selectedRoom) {
      selectedRoom = rooms[0];
    }

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const newAppointment = {
      id: `DOC-${new Date().getFullYear()}-${randomCode}`,
      patientName: (data.patientName || '').trim(),
      patientPhone: (data.patientPhone || '').trim(),
      patientEmail: (data.patientEmail || '').trim() || 'Chưa cập nhật',
      serviceCode: data.serviceCode || doc.specialtyCode || 'general',
      serviceName: data.serviceName || doc.specialty || 'Khám Mắt',
      doctorId: doc.id,
      doctorName: doc.name.startsWith('BS') || doc.name.startsWith('TS') || doc.name.startsWith('ThS') ? doc.name : `${doc.degree ? doc.degree.split(' - ')[0] : 'BS.'} ${doc.name}`,
      roomId: selectedRoom.id,
      roomName: `${selectedRoom.number} - ${selectedRoom.name.split(' & ')[0]}`,
      date: data.date || new Date().toISOString().split('T')[0],
      timeSlot: data.timeSlot || '08:30 - 09:30',
      symptoms: (data.symptoms || '').trim() || 'Khám mắt theo nhu cầu',
      status: data.status || 'pending', // 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
      createdAt: new Date().toISOString()
    };

    list.unshift(newAppointment);
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(list));
    return newAppointment;
  },

  /**
   * Cập nhật / Xếp lại phòng / Đổi bác sĩ cho lịch hẹn
   */
  updateAppointment(id, updateData) {
    const list = this.getAppointments();
    const index = list.findIndex(a => String(a.id) === String(id));
    if (index === -1) return null;

    // Nếu có đổi bác sĩ hoặc phòng, tự động đồng bộ tên
    if (updateData.doctorId) {
      const doctors = DoctorManager.getDoctors();
      const doc = doctors.find(d => String(d.id) === String(updateData.doctorId));
      if (doc) {
        updateData.doctorName = doc.name.startsWith('BS') || doc.name.startsWith('TS') ? doc.name : `${doc.degree ? doc.degree.split(' - ')[0] : 'BS.'} ${doc.name}`;
      }
    }

    if (updateData.roomId) {
      const room = CLINIC_ROOMS.find(r => r.id === updateData.roomId);
      if (room) {
        updateData.roomName = `${room.number} - ${room.name.split(' & ')[0]}`;
      }
    }

    list[index] = {
      ...list[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(list));
    return list[index];
  },

  /**
   * Xóa lịch hẹn
   */
  deleteAppointment(id) {
    const list = this.getAppointments();
    const filtered = list.filter(a => String(a.id) !== String(id));
    if (filtered.length === list.length) return false;

    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  /**
   * Lấy danh sách 10 phòng và trạng thái hoạt động / số ca khám ở từng phòng
   */
  getRoomsOverview() {
    const appointments = this.getAppointments();
    const doctors = DoctorManager.getDoctors();

    return CLINIC_ROOMS.map(room => {
      // Tìm các bác sĩ phụ trách phòng này
      const roomDoctors = doctors.filter(d => d.roomId === room.id || (d.room && d.room.includes(room.number)));
      // Lấy lịch hẹn trong phòng
      const roomAppointments = appointments.filter(a => a.roomId === room.id || (a.roomName && a.roomName.includes(room.number)));
      const activeAppointments = roomAppointments.filter(a => a.status === 'confirmed' || a.status === 'in_progress');

      return {
        ...room,
        doctors: roomDoctors,
        totalAppointments: roomAppointments.length,
        activeCount: activeAppointments.length,
        isOccupied: roomDoctors.some(d => d.status === 'active' || d.status === 'busy')
      };
    });
  },

  /**
   * Lấy danh sách dịch vụ
   */
  getServices() {
    return CLINIC_SERVICES;
  },

  /**
   * Lấy danh sách phòng
   */
  getRooms() {
    return CLINIC_ROOMS;
  },

  /**
   * Tìm kiếm và lọc lịch hẹn
   */
  filterAppointments(list, { query = '', status = 'all', roomId = 'all', date = '' } = {}) {
    let result = [...list];

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(a => 
        (a.id && a.id.toLowerCase().includes(q)) ||
        (a.patientName && a.patientName.toLowerCase().includes(q)) ||
        (a.patientPhone && a.patientPhone.includes(q)) ||
        (a.doctorName && a.doctorName.toLowerCase().includes(q))
      );
    }

    if (status && status !== 'all') {
      result = result.filter(a => a.status === status);
    }

    if (roomId && roomId !== 'all') {
      result = result.filter(a => a.roomId === roomId || (a.roomName && a.roomName.includes(roomId)));
    }

    if (date) {
      result = result.filter(a => a.date === date);
    }

    return result;
  }
};
