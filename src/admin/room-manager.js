/* ============================================================
   src/admin/room-manager.js — Doctor4 Eye Clinic
   Quản lý CRUD Hệ Thống Phòng Khám Chuyên Khoa Mắt (Admin)
   ============================================================ */

import { CLINIC_ROOMS } from '../data/clinic-data.js';

const ROOMS_STORAGE_KEY = 'doctor4_rooms_db';

export const RoomManager = {
  /**
   * Lấy danh sách toàn bộ phòng khám
   */
  getRooms() {
    try {
      const data = localStorage.getItem(ROOMS_STORAGE_KEY);
      if (!data) {
        localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(CLINIC_ROOMS));
        return CLINIC_ROOMS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Lỗi khi đọc danh sách phòng:', e);
      return CLINIC_ROOMS;
    }
  },

  /**
   * Lấy phòng theo ID
   */
  getRoomById(id) {
    const rooms = this.getRooms();
    return rooms.find(r => r.id === id || r.number === id) || null;
  },

  /**
   * Thêm phòng khám mới
   */
  createRoom(roomData) {
    const rooms = this.getRooms();
    const newRoom = {
      id: 'R' + Date.now().toString().slice(-4),
      number: roomData.number.trim(),
      name: roomData.name.trim(),
      specialty: roomData.specialty || 'general',
      floor: roomData.floor.trim() || 'Tầng 1',
      equipment: roomData.equipment.trim() || 'Thiết bị khám mắt chuyên khoa',
      status: roomData.status || 'active', // 'active' | 'maintenance' | 'closed'
      description: roomData.description?.trim() || '',
      createdAt: new Date().toISOString()
    };

    rooms.push(newRoom);
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
    return newRoom;
  },

  /**
   * Cập nhật thông tin phòng khám
   */
  updateRoom(id, updatedData) {
    const rooms = this.getRooms();
    const index = rooms.findIndex(r => r.id === id);
    if (index === -1) return null;

    rooms[index] = {
      ...rooms[index],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
    return rooms[index];
  },

  /**
   * Xóa phòng khám
   */
  deleteRoom(id) {
    const rooms = this.getRooms();
    const filtered = rooms.filter(r => r.id !== id);
    if (filtered.length === rooms.length) return false;

    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  /**
   * Khôi phục danh sách 10 phòng gốc
   */
  resetToDefault() {
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(CLINIC_ROOMS));
    return CLINIC_ROOMS;
  }
};
