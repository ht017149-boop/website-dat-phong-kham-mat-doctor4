/* ============================================================
   src/data/invoice-manager.js — Doctor4 Eye Clinic
   Quản lý Hóa Đơn Viện Phí & Quy Trình Truyền Hóa Đơn Từ Bác Sĩ Về Quầy Thu Ngân
   ============================================================ */

const INVOICES_STORAGE_KEY = 'doctor4_invoices_db';
const APPOINTMENTS_STORAGE_KEY = 'doctor4_appointments_db';
const PAYMENTS_STORAGE_KEY = 'payments';

// Dữ liệu hóa đơn mẫu ban đầu (phục vụ kiểm thử và ca trực thu ngân)
export const INITIAL_DEMO_INVOICES = [
  {
    id: 'HD-2026-1001',
    appointmentId: 'AP-1001',
    patientName: 'Trần Văn Hùng',
    patientPhone: '0918 123 456',
    patientGender: 'Nam',
    patientAge: '32 tuổi',
    doctorId: 'doc_1',
    doctorName: 'BS. CKII Nguyễn Minh Quân',
    roomId: 'R101',
    roomName: 'Phòng 101 - Khám LASIK A',
    serviceName: 'Phẫu thuật Khúc xạ (LASIK / SMILE Pro)',
    diagnosis: 'Cận - Loạn thị học đường (Chỉ định mổ SMILE Pro)',
    advice: 'Đủ điều kiện phẫu thuật Smile Pro. Ngưng kính áp tròng mềm 1 tuần trước mổ. Nhỏ nước mắt nhân tạo đều đặn.',
    revisitDate: '2026-10-16',
    prescriptions: [
      { name: 'Systane Ultra (Lọ 10ml)', type: 'Nước mắt nhân tạo', quantity: 2, dosage: 'Nhỏ 1 giọt x 3-4 lần/ngày', price: 95000, amount: 190000 },
      { name: 'Cravit 0.5% (Lọ 5ml)', type: 'Kháng sinh Levofloxacin', quantity: 1, dosage: 'Nhỏ 1 giọt x 3 lần/ngày', price: 115000, amount: 115000 }
    ],
    examFee: 500000,
    medicineFee: 305000,
    serviceFee: 0,
    discount: 0,
    totalAmount: 805000,
    status: 'pending', // 'pending' (Chờ thu tiền) | 'paid' (Đã thu tiền)
    sentAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    paidAt: null,
    cashierName: null,
    paymentMethod: null
  },
  {
    id: 'HD-2026-1002',
    appointmentId: 'AP-1003',
    patientName: 'Vũ Văn Nam',
    patientPhone: '0903 111 222',
    patientGender: 'Nam',
    patientAge: '58 tuổi',
    doctorId: 'doc_3',
    doctorName: 'TS. Bác sĩ Trần Thị Lan Anh',
    roomId: 'R103',
    roomName: 'Phòng 103 - Điều trị Glôcôm',
    serviceName: 'Khám & Điều trị Glôcôm (Tăng nhãn áp)',
    diagnosis: 'Tăng nhãn áp góc mở (Nghi ngờ Glôcôm Mắt Phải)',
    advice: 'Nhỏ thuốc hạ nhãn áp Lumigan đều đặn mỗi tối. Tái khám sau 2 tuần để đo lại nhãn áp và chụp thị trường.',
    revisitDate: '2026-10-23',
    prescriptions: [
      { name: 'Lumigan 0.01% (Lọ 3ml)', type: 'Hạ nhãn áp Glôcôm', quantity: 1, dosage: 'Nhỏ 1 giọt vào buổi tối', price: 340000, amount: 340000 },
      { name: 'Vismed 0.18% (Hộp 20 ống)', type: 'Bôi trơn nhãn cầu', quantity: 1, dosage: 'Nhỏ 1 giọt x 3 lần/ngày', price: 230000, amount: 230000 }
    ],
    examFee: 350000,
    medicineFee: 570000,
    serviceFee: 250000,
    discount: 50000,
    totalAmount: 1120000,
    status: 'pending', // 'pending' (Chờ thu tiền)
    sentAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    paidAt: null,
    cashierName: null,
    paymentMethod: null
  },
  {
    id: 'HD-2026-0998',
    appointmentId: 'AP-0998',
    patientName: 'Nguyễn Thị Ánh Tuyết',
    patientPhone: '0977 888 999',
    patientGender: 'Nữ',
    patientAge: '45 tuổi',
    doctorId: 'doc_4',
    doctorName: 'ThS. BS Lê Hoàng Phúc',
    roomId: 'R104',
    roomName: 'Phòng 104 - Phaco A',
    serviceName: 'Đục thủy tinh thể (Phaco)',
    diagnosis: 'Đục thủy tinh thể độ 2 mắt trái, thị lực giảm sút',
    advice: 'Uống thuốc chống thoái hóa, bảo vệ mắt khi ra nắng. Đăng ký lịch phẫu thuật Phaco vào tuần tới.',
    revisitDate: '2026-10-15',
    prescriptions: [
      { name: 'Tobradex (Lọ 5ml)', type: 'Kháng sinh + Kháng viêm Corticoid', quantity: 1, dosage: 'Nhỏ 1 giọt x 2-3 lần/ngày', price: 72000, amount: 72000 },
      { name: 'Systane Ultra (Lọ 10ml)', type: 'Nước mắt nhân tạo', quantity: 1, dosage: 'Nhỏ 1 giọt x 3 lần/ngày', price: 95000, amount: 95000 }
    ],
    examFee: 300000,
    medicineFee: 167000,
    serviceFee: 150000,
    discount: 0,
    totalAmount: 617000,
    status: 'paid', // 'paid' (Đã thu tiền)
    sentAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    paidAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    cashierName: 'Nguyễn Mai Anh (Thu Ngân)',
    paymentMethod: 'Tiền mặt tại quầy'
  }
];

export const InvoiceManager = {
  /**
   * Lấy danh sách toàn bộ hóa đơn viện phí
   */
  getInvoices() {
    try {
      const data = localStorage.getItem(INVOICES_STORAGE_KEY);
      let list = data ? JSON.parse(data) : [];
      if (!Array.isArray(list) || list.length === 0) {
        list = [...INITIAL_DEMO_INVOICES];
        localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(list));
      }
      return list;
    } catch (e) {
      console.error('Lỗi khi đọc hóa đơn:', e);
      return INITIAL_DEMO_INVOICES;
    }
  },

  /**
   * Lưu danh sách hóa đơn
   */
  saveInvoices(invoices) {
    try {
      localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
    } catch (e) {
      console.error('Lỗi khi lưu hóa đơn:', e);
    }
  },

  /**
   * Lấy hóa đơn theo ID
   */
  getInvoiceById(id) {
    const list = this.getInvoices();
    return list.find(inv => String(inv.id) === String(id)) || null;
  },

  /**
   * Lấy hóa đơn theo ID lịch hẹn
   */
  getInvoiceByAppointmentId(appointmentId) {
    const list = this.getInvoices();
    return list.find(inv => String(inv.appointmentId) === String(appointmentId)) || null;
  },

  /**
   * Bác sĩ tạo hoặc cập nhật hóa đơn truyền về cho Quầy Thu Ngân
   */
  createOrUpdateInvoiceFromDoctor({
    appointmentId,
    patientName,
    patientPhone,
    patientGender = 'Nam',
    patientAge = '30 tuổi',
    doctorId,
    doctorName,
    roomId,
    roomName,
    serviceName,
    diagnosis,
    advice,
    revisitDate,
    prescriptions = [],
    examFee = 200000,
    medicineFee = 0,
    serviceFee = 0,
    discount = 0,
    totalAmount = 0,
    paymentStatus = 'unpaid',
    paymentMethod = null
  }) {
    const invoices = this.getInvoices();
    
    // Kiểm tra xem đã có hóa đơn cho lịch hẹn này chưa
    const existingIndex = invoices.findIndex(inv => String(inv.appointmentId) === String(appointmentId));
    
    const invoiceId = existingIndex >= 0 ? invoices[existingIndex].id : `HD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const isPaid = paymentStatus === 'paid';

    const invoiceData = {
      id: invoiceId,
      appointmentId: appointmentId || `AP-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: patientName || 'Bệnh nhân',
      patientPhone: patientPhone || '',
      patientGender: patientGender || 'Nam/Nữ',
      patientAge: patientAge || '30 tuổi',
      doctorId: doctorId || 'doc_1',
      doctorName: doctorName || 'Bác sĩ chuyên khoa',
      roomId: roomId || 'R101',
      roomName: roomName || 'Phòng khám mắt',
      serviceName: serviceName || 'Khám Mắt Tổng Quát',
      diagnosis: diagnosis || 'Khám và tư vấn chuyên khoa mắt',
      advice: advice || 'Tuân thủ đúng liều lượng chỉ dẫn của bác sĩ',
      revisitDate: revisitDate || '',
      prescriptions: Array.isArray(prescriptions) ? prescriptions : [],
      examFee: Number(examFee) || 0,
      medicineFee: Number(medicineFee) || 0,
      serviceFee: Number(serviceFee) || 0,
      discount: Number(discount) || 0,
      totalAmount: Number(totalAmount) || 0,
      status: isPaid ? 'paid' : 'pending',
      sentAt: new Date().toISOString(),
      paidAt: isPaid ? new Date().toISOString() : null,
      cashierName: isPaid ? 'Thu ngân quầy tiếp đón' : null,
      paymentMethod: paymentMethod || (isPaid ? 'Đã thanh toán trước' : null)
    };

    if (existingIndex >= 0) {
      invoices[existingIndex] = { ...invoices[existingIndex], ...invoiceData };
    } else {
      invoices.unshift(invoiceData);
    }

    this.saveInvoices(invoices);

    // Cập nhật thông báo live event cho tab Thu Ngân
    try {
      localStorage.setItem('doctor4_latest_invoice_event', JSON.stringify({
        invoiceId: invoiceData.id,
        patientName: invoiceData.patientName,
        doctorName: invoiceData.doctorName,
        roomName: invoiceData.roomName,
        totalAmount: invoiceData.totalAmount,
        timestamp: Date.now()
      }));
    } catch (e) {}

    // Đồng bộ lại vào doctor4_appointments_db nếu có lịch hẹn
    try {
      const rawApps = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      if (rawApps) {
        let apps = JSON.parse(rawApps);
        const appIdx = apps.findIndex(a => String(a.id) === String(appointmentId));
        if (appIdx >= 0) {
          apps[appIdx].invoiceId = invoiceData.id;
          apps[appIdx].invoiceStatus = invoiceData.status; // 'pending' | 'paid'
          apps[appIdx].billing = {
            examFee: invoiceData.examFee,
            medicineFee: invoiceData.medicineFee,
            serviceFee: invoiceData.serviceFee,
            discount: invoiceData.discount,
            totalAmount: invoiceData.totalAmount,
            paymentStatus: invoiceData.status === 'paid' ? 'paid' : 'unpaid',
            paymentMethod: invoiceData.paymentMethod || 'Chờ quầy thu ngân',
            paidAt: invoiceData.paidAt
          };
          localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(apps));
        }
      }
    } catch (e) {
      console.error('Lỗi đồng bộ lịch hẹn sau khi tạo hóa đơn:', e);
    }

    return invoiceData;
  },

  /**
   * Quầy Thu Ngân xác nhận thu tiền cho hóa đơn
   */
  processCashierPayment(invoiceId, {
    paymentMethod = 'Tiền mặt tại quầy',
    cashierName = 'Nguyễn Mai Anh (Thu Ngân)',
    amountReceived = null,
    changeAmount = 0,
    notes = ''
  } = {}) {
    const invoices = this.getInvoices();
    const index = invoices.findIndex(inv => String(inv.id) === String(invoiceId));
    if (index === -1) return null;

    const current = invoices[index];
    const nowIso = new Date().toISOString();

    const updatedInvoice = {
      ...current,
      status: 'paid',
      paidAt: nowIso,
      cashierName: cashierName || 'Thu Ngân Quầy 1',
      paymentMethod: paymentMethod,
      amountReceived: amountReceived !== null ? Number(amountReceived) : current.totalAmount,
      changeAmount: Number(changeAmount) || 0,
      cashierNotes: notes || ''
    };

    invoices[index] = updatedInvoice;
    this.saveInvoices(invoices);

    // 1. Đồng bộ sang doctor4_appointments_db
    try {
      const rawApps = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      if (rawApps) {
        let apps = JSON.parse(rawApps);
        const appIdx = apps.findIndex(a => String(a.id) === String(current.appointmentId));
        if (appIdx >= 0) {
          apps[appIdx].invoiceStatus = 'paid';
          if (!apps[appIdx].billing) apps[appIdx].billing = {};
          apps[appIdx].billing.paymentStatus = 'paid';
          apps[appIdx].billing.paymentMethod = paymentMethod;
          apps[appIdx].billing.paidAt = nowIso;
          apps[appIdx].billing.cashierName = cashierName;
          localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(apps));
        }
      }
    } catch (e) {
      console.error('Lỗi đồng bộ lịch hẹn sau khi thu tiền:', e);
    }

    // 2. Đồng bộ sang danh sách doanh thu/thanh toán chung của hệ thống (payments)
    try {
      const rawPayments = localStorage.getItem(PAYMENTS_STORAGE_KEY);
      let paymentsList = rawPayments ? JSON.parse(rawPayments) : [];
      const paymentRecord = {
        id: 'PAY-' + updatedInvoice.id,
        paymentId: 'PAY-' + updatedInvoice.id,
        appointmentId: updatedInvoice.appointmentId,
        invoiceId: updatedInvoice.id,
        patientName: updatedInvoice.patientName,
        name: updatedInvoice.patientName,
        doctorName: updatedInvoice.doctorName,
        doctor: updatedInvoice.doctorName,
        serviceName: updatedInvoice.serviceName,
        amount: updatedInvoice.totalAmount,
        paymentMethod: paymentMethod,
        cashierName: cashierName,
        status: 'success',
        createdAt: nowIso,
        paidAt: nowIso
      };
      
      const existingPayIdx = paymentsList.findIndex(p => p.invoiceId === updatedInvoice.id || p.id === paymentRecord.id);
      if (existingPayIdx >= 0) {
        paymentsList[existingPayIdx] = { ...paymentsList[existingPayIdx], ...paymentRecord };
      } else {
        paymentsList.unshift(paymentRecord);
      }
      localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(paymentsList));
    } catch (e) {
      console.error('Lỗi đồng bộ bản ghi thanh toán:', e);
    }

    // 3. Phát event đồng bộ cho các tab khác (Bác sĩ, Bệnh nhân)
    try {
      localStorage.setItem('doctor4_payment_confirmed_event', JSON.stringify({
        invoiceId: updatedInvoice.id,
        appointmentId: updatedInvoice.appointmentId,
        patientName: updatedInvoice.patientName,
        totalAmount: updatedInvoice.totalAmount,
        timestamp: Date.now()
      }));
    } catch (e) {}

    return updatedInvoice;
  },

  /**
   * Thống kê ca trực cho Quầy Thu Ngân
   */
  getStats() {
    const list = this.getInvoices();
    const total = list.length;
    const pending = list.filter(i => i.status === 'pending').length;
    const paid = list.filter(i => i.status === 'paid').length;
    const totalRevenue = list
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);

    return { total, pending, paid, totalRevenue };
  }
};

