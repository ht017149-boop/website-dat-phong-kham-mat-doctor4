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
      let list = data ? JSON.parse(data) : [];
      if (!Array.isArray(list) || list.length < 8) {
        const existingIds = new Set(list.map(a => a.id));
        INITIAL_APPOINTMENTS.forEach(initApp => {
          if (!existingIds.has(initApp.id)) {
            list.push(initApp);
          }
        });
        localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(list));
      }
      return list;
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
   * Lưu kết quả khám, bệnh án, đơn thuốc & viện phí (Bác sĩ hoặc Admin)
   */
  completeMedicalExam(id, recordData) {
    const list = this.getAppointments();
    const index = list.findIndex(a => String(a.id) === String(id));
    if (index === -1) return null;

    const current = list[index];

    // Tính toán viện phí chi tiết
    const examFee = Number(recordData.examFee ?? 200000);
    const serviceFee = Number(recordData.serviceFee ?? 0);
    const discount = Number(recordData.discount ?? 0);

    // Tính tổng tiền thuốc - hỗ trợ cả 2 field: prescriptions & prescription
    let medicineFee = recordData.medicineFee || 0;
    const rawPrescription = Array.isArray(recordData.prescriptions) 
      ? recordData.prescriptions 
      : (Array.isArray(recordData.prescription) ? recordData.prescription : []);

    const prescriptions = rawPrescription.map(p => {
      const unitPrice = Number(p.price || 0);
      const qty = Number(p.quantity || 1);
      const amount = unitPrice * qty;
      if (!recordData.medicineFee) medicineFee += amount;
      return {
        ...p,
        quantity: qty,
        price: unitPrice,
        amount: amount
      };
    });

    const totalAmount = recordData.totalAmount || Math.max(0, examFee + medicineFee + serviceFee - discount);

    const billingData = {
      examFee,
      medicineFee,
      serviceFee,
      discount,
      totalAmount,
      paymentStatus: recordData.paymentStatus || current.billing?.paymentStatus || 'paid',
      paymentMethod: recordData.paymentMethod || 'Tiền mặt / Thẻ tại quầy',
      paidAt: recordData.paidAt || new Date().toISOString()
    };

    const updatedRecord = {
      ...(current.medicalRecord || {}),
      ...recordData,
      prescriptions,           // dùng trong admin portal
      prescription: prescriptions, // dùng trong patient / doctor portal
      completedAt: recordData.completedAt || new Date().toISOString(),
      doctorName: recordData.doctorName || current.doctorName,
      doctorDegree: recordData.doctorDegree || '',
      roomId: current.roomId,
      roomName: recordData.roomName || current.roomName
    };

    list[index] = {
      ...current,
      status: 'completed',
      medicalRecord: updatedRecord,
      billing: billingData,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(list));
    return list[index];
  },

  /**
   * Mở lại ca khám (Dành riêng cho Quyền Admin cao nhất khi cần xét duyệt lại)
   */
  reopenAppointment(id) {
    const list = this.getAppointments();
    const index = list.findIndex(a => String(a.id) === String(id));
    if (index === -1) return null;

    list[index] = {
      ...list[index],
      status: 'in_progress',
      reopenedByAdminAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(list));
    return list[index];
  },

  /**
   * Tìm kiếm và lọc lịch hẹn (Hỗ trợ lọc theo Bác sĩ)
   */
  filterAppointments(list, { query = '', status = 'all', roomId = 'all', doctorId = 'all', date = '' } = {}) {
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

    if (doctorId && doctorId !== 'all') {
      result = result.filter(a => String(a.doctorId) === String(doctorId));
    }

    if (date) {
      result = result.filter(a => a.date === date);
    }

    return result;
  }
};

// Dữ liệu thuốc mắt có giá bán niêm yết (VNĐ)
export const SAMPLE_EYE_DRUGS = [
  { name: 'Systane Ultra (Lọ 10ml)', type: 'Nước mắt nhân tạo', dosage: 'Nhỏ 1 giọt x 3-4 lần/ngày khi khô mắt', price: 95000, quantity: 1 },
  { name: 'Vismed 0.18% (Hộp 20 ống)', type: 'Bôi trơn nhãn cầu', dosage: 'Nhỏ 1 giọt x 3 lần/ngày', price: 230000, quantity: 1 },
  { name: 'Tobrex 0.3% (Lọ 5ml)', type: 'Kháng sinh Tobramycin', dosage: 'Nhỏ 1-2 giọt x 3 lần/ngày trong 7 ngày', price: 68000, quantity: 1 },
  { name: 'Tobradex (Lọ 5ml)', type: 'Kháng sinh + Kháng viêm Corticoid', dosage: 'Nhỏ 1 giọt x 2-3 lần/ngày theo chỉ định', price: 72000, quantity: 1 },
  { name: 'Cravit 0.5% (Lọ 5ml)', type: 'Kháng sinh Levofloxacin', dosage: 'Nhỏ 1 giọt x 3 lần/ngày sau phẫu thuật', price: 115000, quantity: 1 },
  { name: 'Nevanac 0.1% (Lọ 5ml)', type: 'Chống viêm NSAID', dosage: 'Nhỏ 1 giọt x 3 lần/ngày', price: 185000, quantity: 1 },
  { name: 'Lumigan 0.01% (Lọ 3ml)', type: 'Hạ nhãn áp Glôcôm', dosage: 'Nhỏ 1 giọt vào buổi tối', price: 340000, quantity: 1 },
  { name: 'Atropine 0.01% (Lọ 5ml)', type: 'Kiểm soát cận thị trẻ em', dosage: 'Nhỏ 1 giọt trước khi đi ngủ', price: 190000, quantity: 1 }
];

export const SAMPLE_DIAGNOSES = [
  { label: 'Cận thị học đường & Khô mắt nhẹ', visionR: '-2.50 D (10/10)', visionL: '-2.00 D (10/10)', iop: '15 mmHg', advice: 'Hạn chế nhìn màn hình liên tục > 45 phút. Chớp mắt thường xuyên. Tái khám sau 6 tháng.', examFee: 200000 },
  { label: 'Cận - Loạn thị (Chỉ định LASIK/SMILE)', visionR: '-4.25 D C-1.00 D', visionL: '-4.50 D C-0.75 D', iop: '16 mmHg', advice: 'Đủ điều kiện phẫu thuật khúc xạ SMILE Pro. Ngưng kính áp tròng mềm 1 tuần trước mổ.', examFee: 500000 },
  { label: 'Đục thủy tinh thể người già (Cườm khô)', visionR: '3/10 (Đục vỏ)', visionL: '5/10 (Đục nhẹ)', iop: '18 mmHg', advice: 'Chỉ định phẫu thuật Phaco thay IOL đa tiêu cự mắt phải. Uống thuốc chống thoái hóa.', examFee: 300000 },
  { label: 'Viêm kết mạc dị ứng cấp tính', visionR: '10/10', visionL: '10/10', iop: '14 mmHg', advice: 'Tránh dụi mắt, rửa tay thường xuyên. Nhỏ thuốc theo đơn trong 7 ngày.', examFee: 150000 },
  { label: 'Hội chứng Khô mắt mạn tính (Dry Eye)', visionR: '9/10', visionL: '9/10', iop: '15 mmHg', advice: 'Chườm ấm bờ mi 10 phút/tối. Sử dụng nước mắt nhân tạo không chất bảo quản.', examFee: 250000 },
  { label: 'Theo dõi Tăng nhãn áp (Nghi ngờ Glôcôm)', visionR: '8/10 (IOP: 23 mmHg)', visionL: '8/10 (IOP: 22 mmHg)', iop: '22-23 mmHg', advice: 'Nhỏ thuốc hạ nhãn áp đều đặn mỗi tối. Tái khám đo lại nhãn áp và chụp thị trường sau 2 tuần.', examFee: 350000 }
];


