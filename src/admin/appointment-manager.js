/* ============================================================
   src/admin/appointment-manager.js — Doctor4 Eye Clinic
   Quản lý Đặt Lịch Khám (10 Phòng - 10 Bác Sĩ)
   ============================================================ */

import { CLINIC_ROOMS, CLINIC_SERVICES, INITIAL_APPOINTMENTS, calculateQueueNumber, formatQueueNumber } from '../data/clinic-data.js';
import { DoctorManager } from './doctor-manager.js';
import { getPatientProfileData } from '../utils/patient-profile.js';

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

    const appointmentDate = data.date || new Date().toISOString().split('T')[0];
    const appointmentTimeSlot = data.timeSlot || '08:30 - 09:30';

    // Tính STT khi có nhiều người đặt cùng giờ
    const queueNumber = calculateQueueNumber(list, {
      date: appointmentDate,
      timeSlot: appointmentTimeSlot,
      doctorId: doc.id,
      roomId: selectedRoom.id
    });

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const newAppointment = {
      id: `DOC-${new Date().getFullYear()}-${randomCode}`,
      queueNumber: queueNumber,
      stt: queueNumber,
      patientName: (data.patientName || '').trim(),
      patientPhone: (data.patientPhone || '').trim(),
      patientEmail: (data.patientEmail || '').trim() || 'Chưa cập nhật',
      serviceCode: data.serviceCode || doc.specialtyCode || 'general',
      serviceName: data.serviceName || doc.specialty || 'Khám Mắt',
      doctorId: doc.id,
      doctorName: doc.name.startsWith('BS') || doc.name.startsWith('TS') || doc.name.startsWith('ThS') ? doc.name : `${doc.degree ? doc.degree.split(' - ')[0] : 'BS.'} ${doc.name}`,
      roomId: selectedRoom.id,
      roomName: `${selectedRoom.number} - ${selectedRoom.name.split(' & ')[0]}`,
      date: appointmentDate,
      timeSlot: appointmentTimeSlot,
      symptoms: (data.symptoms || '').trim() || 'Khám mắt theo nhu cầu',
      status: data.status || 'pending', // 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
      patientProfile: getPatientProfileData(data),
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

    // Đồng bộ trực tiếp vào doctor4_invoices_db cho Quầy Thu Ngân
    try {
      const INVOICES_STORAGE_KEY = 'doctor4_invoices_db';
      const rawInvoices = localStorage.getItem(INVOICES_STORAGE_KEY);
      let invoiceList = rawInvoices ? JSON.parse(rawInvoices) : [];
      if (Array.isArray(invoiceList)) {
        const invIdx = invoiceList.findIndex(i =>
          String(i.appointmentId) === String(id) ||
          (current.invoiceId && String(i.id) === String(current.invoiceId)) ||
          String(i.id) === String(id)
        );
        const invPayload = {
          examFee,
          medicineFee,
          serviceFee,
          discount,
          totalAmount,
          prescriptions,
          diagnosis: updatedRecord.diagnosis || '',
          advice: updatedRecord.advice || '',
          revisitDate: updatedRecord.revisitDate || '',
          doctorName: updatedRecord.doctorName || current.doctorName || '',
          roomName: updatedRecord.roomName || current.roomName || '',
          status: billingData.paymentStatus === 'paid' ? 'paid' : (invIdx >= 0 ? invoiceList[invIdx].status : 'pending'),
          paidAt: billingData.paymentStatus === 'paid' ? (billingData.paidAt || new Date().toISOString()) : (invIdx >= 0 ? invoiceList[invIdx].paidAt : null),
          paymentMethod: billingData.paymentStatus === 'paid' ? billingData.paymentMethod : (invIdx >= 0 ? invoiceList[invIdx].paymentMethod : null)
        };
        if (invIdx >= 0) {
          invoiceList[invIdx] = { ...invoiceList[invIdx], ...invPayload };
        } else {
          invoiceList.unshift({
            id: current.invoiceId || ('HD-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000)),
            appointmentId: id,
            patientName: current.patientName || 'Bệnh nhân',
            patientPhone: current.patientPhone || '',
            patientGender: current.patientGender || current.patientProfile?.gender || '',
            patientAge: current.patientAge || '',
            doctorId: current.doctorId || 'doc_1',
            doctorName: updatedRecord.doctorName || current.doctorName || 'Bác sĩ chuyên khoa',
            roomId: current.roomId || 'r101',
            roomName: updatedRecord.roomName || current.roomName || 'Phòng khám',
            serviceName: current.serviceName || 'Khám Mắt',
            sentAt: current.createdAt || new Date().toISOString(),
            queueNumber: current.queueNumber || current.stt || 1,
            stt: current.stt || current.queueNumber || 1,
            appointmentDate: current.date || '',
            appointmentTime: current.timeSlot || '',
            cashierName: billingData.paymentStatus === 'paid' ? 'Bác sĩ xác nhận' : null,
            ...invPayload
          });
        }
        localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoiceList));
      }
    } catch (e) {
      console.warn('Lỗi đồng bộ hóa đơn trong completeMedicalExam:', e);
    }

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

// Dữ liệu thuốc mắt có giá bán niêm yết (VNĐ) - Danh mục bệnh viện
export const SAMPLE_EYE_DRUGS = [
  // 1. Nhóm Khô mắt / Bôi trơn nhãn cầu
  { name: 'Systane Ultra (Lọ 10ml)', type: 'Nước mắt nhân tạo', category: 'dry_eye', dosage: 'Nhỏ 1 giọt x 3-4 lần/ngày khi khô mắt', price: 95000, quantity: 1, keywords: 'systane ultra kho mat moi mat nuoc mat nhan tao' },
  { name: 'Systane Complete (Lọ 10ml)', type: 'Bổ sung lipid màng phim nước mắt', category: 'dry_eye', dosage: 'Nhỏ 1 giọt x 2-3 lần/ngày', price: 165000, quantity: 1, keywords: 'systane complete lipid kho mat bay hoi' },
  { name: 'Vismed 0.18% (Hộp 20 ống)', type: 'Natri Hyaluronate không chất bảo quản', category: 'dry_eye', dosage: 'Nhỏ 1 giọt x 3 lần/ngày', price: 230000, quantity: 1, keywords: 'vismed 0.18 natri hyaluronate mo lasik khong bao quan' },
  { name: 'Sanlein 0.1% (Lọ 5ml)', type: 'Natri Hyaluronate phục hồi giác mạc', category: 'dry_eye', dosage: 'Nhỏ 1 giọt x 5-6 lần/ngày', price: 65000, quantity: 1, keywords: 'sanlein 0.1 natri hyaluronate ton thuong giac mac' },
  { name: 'Hyalein 0.1% (Lọ 5ml)', type: 'Dung dịch nhỏ mắt bôi trơn', category: 'dry_eye', dosage: 'Nhỏ 1 giọt x 3 lần/ngày', price: 62000, quantity: 1, keywords: 'hyalein 0.1 kho mat boi tron' },
  { name: 'Refresh Tears (Lọ 15ml)', type: 'Nước mắt nhân tạo làm dịu kích ứng', category: 'dry_eye', dosage: 'Nhỏ 1-2 giọt khi mỏi mắt', price: 78000, quantity: 1, keywords: 'refresh tears diu mat chong moi mat' },

  // 2. Nhóm Kháng sinh điều trị nhiễm khuẩn
  { name: 'Tobrex 0.3% (Lọ 5ml)', type: 'Kháng sinh Tobramycin', category: 'antibiotic', dosage: 'Nhỏ 1-2 giọt x 3 lần/ngày trong 7 ngày', price: 68000, quantity: 1, keywords: 'tobrex 0.3 tobramycin khang sinh viem ket mac dau mat do' },
  { name: 'Cravit 0.5% (Lọ 5ml)', type: 'Kháng sinh Levofloxacin', category: 'antibiotic', dosage: 'Nhỏ 1 giọt x 3 lần/ngày sau phẫu thuật', price: 115000, quantity: 1, keywords: 'cravit 0.5 levofloxacin khang sinh pho rong sau mo' },
  { name: 'Cravit 1.5% (Lọ 5ml)', type: 'Kháng sinh Levofloxacin nồng độ cao', category: 'antibiotic', dosage: 'Nhỏ 1 giọt x 4 lần/ngày (Loét giác mạc)', price: 145000, quantity: 1, keywords: 'cravit 1.5 loet giac mac nhiem trung nang' },
  { name: 'Vigamox 0.5% (Lọ 5ml)', type: 'Kháng sinh Moxifloxacin thế hệ 4', category: 'antibiotic', dosage: 'Nhỏ 1 giọt x 3 lần/ngày', price: 135000, quantity: 1, keywords: 'vigamox 0.5 moxifloxacin khang sinh the he 4' },

  // 3. Nhóm Kháng viêm & Phối hợp
  { name: 'Tobradex (Lọ 5ml)', type: 'Kháng sinh + Kháng viêm Corticoid', category: 'anti_inflammatory', dosage: 'Nhỏ 1 giọt x 2-3 lần/ngày theo chỉ định', price: 72000, quantity: 1, keywords: 'tobradex dexamethasone corticoid viem ket mac giac mac' },
  { name: 'Nevanac 0.1% (Lọ 5ml)', type: 'Chống viêm NSAID Nepafenac giảm đau', category: 'anti_inflammatory', dosage: 'Nhỏ 1 giọt x 3 lần/ngày', price: 185000, quantity: 1, keywords: 'nevanac 0.1 nsaid giam dau chong viem phaco lasik' },
  { name: 'Lotemax 0.5% (Lọ 5ml)', type: 'Kháng viêm Loteprednol an toàn', category: 'anti_inflammatory', dosage: 'Nhỏ 1-2 giọt x 2 lần/ngày', price: 175000, quantity: 1, keywords: 'lotemax 0.5 loteprednol it tang nhan ap' },
  { name: 'Maxitrol (Lọ 5ml)', type: 'Kháng sinh + Dexamethasone đa phối hợp', category: 'anti_inflammatory', dosage: 'Nhỏ 1 giọt x 3 lần/ngày', price: 65000, quantity: 1, keywords: 'maxitrol neomycin polymyxin dexamethasone' },

  // 4. Nhóm Hạ nhãn áp & Glôcôm
  { name: 'Lumigan 0.01% (Lọ 3ml)', type: 'Hạ nhãn áp Glôcôm', category: 'glaucoma', dosage: 'Nhỏ 1 giọt vào buổi tối', price: 340000, quantity: 1, keywords: 'lumigan bimatoprost glocom ha nhan ap cuom nuoc' },
  { name: 'Xalatan 0.005% (Lọ 2.5ml)', type: 'Hạ nhãn áp Latanoprost', category: 'glaucoma', dosage: 'Nhỏ 1 giọt duy nhất vào buổi tối', price: 295000, quantity: 1, keywords: 'xalatan latanoprost tang nhan ap glocom' },
  { name: 'Azopt 1% (Lọ 5ml)', type: 'Hạ nhãn áp Brinzolamide', category: 'glaucoma', dosage: 'Nhỏ 1 giọt x 2 lần/ngày (Sáng & Tối)', price: 260000, quantity: 1, keywords: 'azopt brinzolamide uc che carbonic ha nhan ap' },
  { name: 'Alphagan P 0.15% (Lọ 5ml)', type: 'Brimonidine bảo vệ thần kinh thị giác', category: 'glaucoma', dosage: 'Nhỏ 1 giọt x 2 lần/ngày', price: 280000, quantity: 1, keywords: 'alphagan brimonidine bao ve thi than kinh' },

  // 5. Nhóm Chống dị ứng mắt
  { name: 'Patanol 0.1% (Lọ 5ml)', type: 'Chống dị ứng mắt Olopatadine', category: 'allergy', dosage: 'Nhỏ 1 giọt x 2 lần/ngày khi ngứa đỏ mắt', price: 125000, quantity: 1, keywords: 'patanol olopatadine di ung ngua mat phan hoa do mat' },
  { name: 'Relestat 0.05% (Lọ 5ml)', type: 'Chống dị ứng Epinastine', category: 'allergy', dosage: 'Nhỏ 1 giọt x 2 lần/ngày', price: 130000, quantity: 1, keywords: 'relestat epinastine viem ket mac di ung' },

  // 6. Nhóm Cận thị & Nhãn nhi
  { name: 'Atropine 0.01% (Lọ 5ml)', type: 'Kiểm soát cận thị trẻ em', category: 'pediatric', dosage: 'Nhỏ 1 giọt trước khi đi ngủ mỗi tối', price: 190000, quantity: 1, keywords: 'atropine 0.01 can thi hoc duong kiem soat can thi tre em' },
  { name: 'Tropicamide 0.5% (Lọ 10ml)', type: 'Giãn đồng tử liệt điều tiết kiểm tra mắt', category: 'pediatric', dosage: 'Nhỏ theo chỉ định bác sĩ khi khám khúc xạ', price: 85000, quantity: 1, keywords: 'tropicamide liet dieu tiet do do can khuc xa tre em' },

  // 7. Nhóm Bổ mắt & Chống thoái hóa
  { name: 'Ocuvite Lutein (Hộp 30 viên)', type: 'Viên uống bổ mắt, chống thoái hóa điểm vàng', category: 'supplement', dosage: 'Uống 1 viên/ngày sau bữa ăn', price: 210000, quantity: 1, keywords: 'ocuvite lutein thoai hoa hoang diem diem vang bo mat' },
  { name: 'Tobicom (Hộp 180 viên)', type: 'Viên nang mềm bổ mắt, giảm nhức mỏi', category: 'supplement', dosage: 'Uống 1 viên x 2 lần/ngày', price: 320000, quantity: 1, keywords: 'tobicom vitamin a bo mat moi mat nhuc mat' },
  { name: 'Posod (Lọ 10ml)', type: 'Dung dịch nhỏ ngừa đục thủy tinh thể người già', category: 'supplement', dosage: 'Nhỏ 1 giọt x 3 lần/ngày', price: 85000, quantity: 1, keywords: 'posod duc thuy tinh the nguoi gia cuom kho' }
];

export const SAMPLE_DIAGNOSES = [
  { label: 'Cận thị học đường & Khô mắt nhẹ', visionR: '-2.50 D (10/10)', visionL: '-2.00 D (10/10)', iop: '15 mmHg', advice: 'Hạn chế nhìn màn hình liên tục > 45 phút. Chớp mắt thường xuyên. Tái khám sau 6 tháng.', examFee: 200000 },
  { label: 'Cận - Loạn thị (Chỉ định LASIK/SMILE)', visionR: '-4.25 D C-1.00 D', visionL: '-4.50 D C-0.75 D', iop: '16 mmHg', advice: 'Đủ điều kiện phẫu thuật khúc xạ SMILE Pro. Ngưng kính áp tròng mềm 1 tuần trước mổ.', examFee: 500000 },
  { label: 'Đục thủy tinh thể người già (Cườm khô)', visionR: '3/10 (Đục vỏ)', visionL: '5/10 (Đục nhẹ)', iop: '18 mmHg', advice: 'Chỉ định phẫu thuật Phaco thay IOL đa tiêu cự mắt phải. Uống thuốc chống thoái hóa.', examFee: 300000 },
  { label: 'Viêm kết mạc dị ứng cấp tính', visionR: '10/10', visionL: '10/10', iop: '14 mmHg', advice: 'Tránh dụi mắt, rửa tay thường xuyên. Nhỏ thuốc theo đơn trong 7 ngày.', examFee: 150000 },
  { label: 'Hội chứng Khô mắt mạn tính (Dry Eye)', visionR: '9/10', visionL: '9/10', iop: '15 mmHg', advice: 'Chườm ấm bờ mi 10 phút/tối. Sử dụng nước mắt nhân tạo không chất bảo quản.', examFee: 250000 },
  { label: 'Theo dõi Tăng nhãn áp (Nghi ngờ Glôcôm)', visionR: '8/10 (IOP: 23 mmHg)', visionL: '8/10 (IOP: 22 mmHg)', iop: '22-23 mmHg', advice: 'Nhỏ thuốc hạ nhãn áp đều đặn mỗi tối. Tái khám đo lại nhãn áp và chụp thị trường sau 2 tuần.', examFee: 350000 }
];


