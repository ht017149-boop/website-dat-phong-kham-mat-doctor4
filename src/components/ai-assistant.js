/* ============================================================
   src/components/ai-assistant.js — Doctor4 Eye Clinic
   Trợ Lý Bác Sĩ AI Tư Vấn Bệnh Lý & Sức Khỏe Mắt Trực Tuyến 24/7
   ============================================================ */

import '../css/ai-assistant.css';
import { INITIAL_10_DOCTORS } from '../data/clinic-data.js';

// Khóa lưu lịch sử chat trong phiên làm việc
const AI_CHAT_STORAGE_KEY = 'doctor4_ai_assistant_chat_history';

/**
 * Cơ sở tri thức y khoa Nhãn khoa lâm sàng (Ophthalmic Diagnostic Knowledge Base)
 */
export const EYE_KNOWLEDGE_BASE = [
  {
    id: 'dry_eye',
    title: 'Hội chứng Khô Mắt & Mỏi Mắt Kỹ Thuật Số (CVS)',
    keywords: [
      'kho mat', 'cộm', 'com', 'xốn', 'xon', 'moi mat', 'mỏi mắt', 'rát mắt', 'rat mat', 
      'may tinh', 'máy tính', 'dien thoai', 'điện thoại', 'nhin man hinh', 'nhìn màn hình',
      'chay nuoc mat', 'chảy nước mắt', 'cay mat', 'cay mắt', 'cat trong mat', 'cát trong mắt',
      'dieu hoa', 'điều hòa', 'kho phong'
    ],
    diagnosis: 'Mắt bạn đang có các dấu hiệu điển hình của **Hội chứng Khô Mắt (Dry Eye Syndrome)** kết hợp **Mỏi mắt thị giác màn hình (CVS - Computer Vision Syndrome)**. Nguyên nhân thường do tần số chớp mắt giảm khi tập trung nhìn gần hoặc làm việc phòng điều hòa, khiến màng phim nước mắt bay hơi quá nhanh hoặc tắc tuyến dầu bờ mi Meibomius.',
    actions: [
      '**Thực hiện quy tắc 20-20-20:** Cứ 20 phút làm việc màn hình, hãy nhìn xa 6 mét trong ít nhất 20 giây và chớp mắt chậm 10 lần.',
      '**Dùng nước mắt nhân tạo:** Tra các dung dịch bôi trơn nhãn cầu (như *Systane Ultra, Vismed 0.18%, Sanlein 0.1%*) từ 3-4 lần/ngày để phục hồi màng phim nước mắt.',
      '**Chườm ấm bờ mi:** Dùng khăn ấm hoặc túi chườm 40-42°C đắp lên mắt 10 phút trước khi ngủ để giải phóng tuyến bã nhờn mi mắt.',
      '**Điều chỉnh môi trường:** Đặt màn hình thấp hơn tầm mắt 10-15cm, tăng độ ẩm phòng bằng máy tạo ẩm.'
    ],
    warnings: [
      '⚠️ **Tuyệt đối KHÔNG tự ý mua các loại thuốc nhỏ mắt chống đỏ cấp tốc có chứa Corticoid (như Polydexa, Dexacol, Tobradex) khi chưa có chỉ định** vì nguy cơ gây teo gai thị, đục thể thủy tinh và tăng nhãn áp (Glôcôm).',
      '⚠️ Không dụi mắt mạnh vì dễ làm xước biểu mô giác mạc khi mắt đang khô.'
    ],
    doctorName: 'ThS. BS Phan Thanh Tùng',
    doctorId: 'doc_7',
    doctorDegree: 'Thạc sĩ Bác sĩ',
    doctorSpecialty: 'Bệnh Giác Mạc & Khô Mắt Mạn Tính',
    room: 'Phòng 107 - Bệnh Giác Mạc',
    serviceCode: 'cornea',
    serviceName: 'Khám Bệnh Giác Mạc & Khô Mắt Mạn',
    quickActionText: 'Đặt lịch khám Khô Mắt với ThS. BS Phan Thanh Tùng'
  },
  {
    id: 'refractive_lasik',
    title: 'Tật Khúc Xạ (Cận - Loạn - Viễn) & Khảo Sát Mổ LASIK/SMILE',
    keywords: [
      'can thi', 'cận thị', 'loan thi', 'loạn thị', 'mo can', 'mổ cận', 'lasik', 'smile', 
      'nhin xa mo', 'nhìn xa mờ', 'nheo mat', 'nheo mắt', 'tang do', 'tăng độ', 'kinh can', 'kính cận',
      'femto', 'phakic', 'do do mat', 'đo độ mắt', 'cat kinh', 'cắt kính', 'mat mo', 'mắt mờ', 'nhin mo', 'nhìn mờ'
    ],
    diagnosis: 'Bạn có biểu hiện của **Tật khúc xạ (Cận thị hoặc Loạn thị)**. Trục nhãn cầu dài hơn bình thường hoặc độ cong giác mạc bất đối xứng khiến tia sáng hội tụ sai lệch trước võng mạc, gây hiện tượng nhìn xa nhòe mờ, phải nheo mắt hoặc nhìn hình có bóng đôi.',
    actions: [
      '**Đo khúc xạ chuyên sâu:** Cần đo khúc xạ khách quan bằng máy tự động kết hợp thử kính chủ quan và đo bản đồ giác mạc.',
      '**Nếu từ 18 tuổi trở lên & độ cận ổn định:** Bạn hoàn toàn có thể khảo sát điều kiện mổ cận bằng công nghệ hiện đại không chạm như **SMILE Pro, Femto-LASIK hoặc đặt kính nội nhãn Phakic ICL**.',
      '**Quy tắc đeo kính:** Đeo kính đúng số độ để tránh nhược thị hoặc điều tiết quá mức gây đau nhức hốc mắt.',
      '**Ngưng kính áp tròng:** Nếu đang đeo lens áp tròng mềm, cần tháo kính ít nhất 1 tuần trước khi đo khám mổ cận.'
    ],
    warnings: [
      '⚠️ Không nên tự ý tăng độ kính khi chưa qua đo khám y khoa chuẩn.',
      '⚠️ Người cận thị nặng (> 6 đi-ốp) cần định kỳ soi đáy mắt 6 tháng/lần để phát hiện sớm nguy cơ thoái hóa võng mạc.'
    ],
    doctorName: 'BS. CKII Nguyễn Minh Quân',
    doctorId: 'doc_1',
    doctorDegree: 'Bác sĩ CKII',
    doctorSpecialty: 'Phẫu thuật Khúc xạ (LASIK / SMILE Pro)',
    room: 'Phòng 101 - Khám LASIK A',
    serviceCode: 'lasik',
    serviceName: 'Phẫu thuật Khúc xạ (LASIK / SMILE Pro)',
    quickActionText: 'Đặt lịch khám Khúc xạ với BS. CKII Nguyễn Minh Quân'
  },
  {
    id: 'conjunctivitis',
    title: 'Đau Mắt Đỏ / Viêm Kết Mạc Cấp Tính',
    keywords: [
      'dau mat do', 'đau mắt đỏ', 'do mat', 'đỏ mắt', 'ghen', 'ghèn', 'ri mat', 'rỉ mắt', 
      'chay nuoc mat', 'chảy nước mắt', 'sung mi', 'sưng mi', 'ngua mat', 'ngứa mắt', 'viem ket mac',
      'dinh mat', 'dính mắt', 'nhieu ghen', 'nhiều ghèn'
    ],
    diagnosis: 'Triệu chứng của bạn tương ứng với **Viêm kết mạc cấp (Đau mắt đỏ)**, có thể do nhiễm virus Adenovirus (rất dễ lây lan thành dịch), vi khuẩn hoặc dị ứng. Tình trạng này khiến các mao mạch ở màng cứng mắt giãn nở đỏ rực, tiết nhiều dịch dính và kích thích mi mắt.',
    actions: [
      '**Rửa mắt sạch sẽ:** Rửa mắt bằng nước muối sinh lý NaCl 0.9% 3-4 lần/ngày để làm sạch chất tiết ghèn rỉ.',
      '**Cách ly phòng lây lan:** Dùng riêng khăn mặt, gối, chậu rửa; rửa tay thường xuyên bằng xà phòng hoặc cồn sát khuẩn.',
      '**Đeo kính râm:** Bảo vệ mắt khỏi khói bụi và giảm chói lóa ánh sáng.',
      '**Đến phòng khám chuyên khoa:** Để Bác sĩ soi kính khe xác định đúng nguyên nhân (virus, vi khuẩn hay dị ứng) và kê kháng sinh tra mắt phổ phù hợp (*Tobrex, Cravit*).'
    ],
    warnings: [
      '🚨 **TUYỆT ĐỐI KHÔNG xông lá trầu không, đắp lá dâu tằm hay các bài thuốc dân gian** vì hơi nóng và tinh dầu gây bỏng biểu mô giác mạc rất nguy hiểm!',
      '🚨 **KHÔNG tự ý dùng thuốc nhỏ mắt có chứa Corticoid (Dexamethasone)** vì sẽ làm vi khuẩn bùng phát và gây loét thủng giác mạc.'
    ],
    doctorName: 'ThS. BS Vũ Đức Mạnh',
    doctorId: 'doc_10',
    doctorDegree: 'Thạc sĩ Bác sĩ',
    doctorSpecialty: 'Khám Mắt Tổng Quát & Cấp Cứu Dị Vật',
    room: 'Phòng 110 - Khám Mắt Tổng Quát',
    serviceCode: 'general',
    serviceName: 'Khám Mắt Tổng Quát 12 Bước',
    quickActionText: 'Đặt lịch khám Đau Mắt Đỏ với ThS. BS Vũ Đức Mạnh'
  },
  {
    id: 'cataract',
    title: 'Đục Thủy Tinh Thể (Cườm Khô) ở Người Lớn Tuổi',
    keywords: [
      'cuom kho', 'cườm khô', 'duc thuy tinh the', 'đục thủy tinh thể', 'mo suong', 'mờ sương', 'suong mu', 'sương mù', 'man suong', 'màn sương', 'loa den', 'lóa đèn', 'choi loa', 'chói lóa', 'choi mat', 'chói mắt', 'nguoi gia', 'người già', 'lon tuoi', 'lớn tuổi', 
      'thay kinh khong do', 'thay kính không đỡ', 'phaco', 'thuy tinh the', 'thủy tinh thể'
    ],
    diagnosis: 'Bạn hoặc người thân đang có dấu hiệu của **Đục thủy tinh thể (Cườm khô - Cataract)**. Quá trình lão hóa tự nhiên hoặc bệnh lý chuyển hóa (tiểu đường) làm thể thủy tinh trong suốt bị mờ đục dần, giống như nhìn qua cửa kính phủ đầy sương mù hay tấm vải voan.',
    actions: [
      '**Khám đo độ đục thủy tinh thể:** Bác sĩ sẽ soi đèn khe sinh hiển vi để xác định mức độ đục (độ 1 đến độ 4).',
      '**Giai đoạn đầu:** Có thể đeo kính chống chói tia UV và tra dung dịch làm chậm thoái hóa (*Posod*).',
      '**Giai đoạn thị lực suy giảm ảnh hưởng sinh hoạt:** Phẫu thuật **Phaco lạnh thay thủy tinh thể nhân tạo (IOL)**. Đây là phẫu thuật an toàn hàng đầu hiện nay, chỉ mất 10-15 phút, không đau, không khâu, xuất viện trong ngày và phục hồi thị lực sáng rõ.'
    ],
    warnings: [
      '⚠️ Không nên để cườm quá chín (quá già) vì bao thủy tinh thể sẽ căng phồng, tăng nguy cơ biến chứng glôcôm thứ phát và làm ca phẫu thuật phức tạp hơn.',
      '⚠️ Bệnh nhân tiểu đường cần kiểm soát tốt đường huyết trước khi phẫu thuật.'
    ],
    doctorName: 'ThS. BS Lê Hoàng Phúc',
    doctorId: 'doc_4',
    doctorDegree: 'Thạc sĩ Bác sĩ',
    doctorSpecialty: 'Phẫu thuật Đục thủy tinh thể (Phaco A)',
    room: 'Phòng 104 - Phaco A',
    serviceCode: 'cataract',
    serviceName: 'Phẫu thuật Đục thủy tinh thể (Phaco)',
    quickActionText: 'Đặt lịch khám Đục Thủy Tinh Thể với ThS. BS Lê Hoàng Phúc'
  },
  {
    id: 'glaucoma',
    title: 'Bệnh Tăng Nhãn Áp (Glôcôm / Cườm Nước) — CẢNH BÁO NGUY HIỂM',
    keywords: [
      'glocom', 'glôcôm', 'glaucoma', 'tang nhan ap', 'tăng nhãn áp', 'cuom nuoc', 'cườm nước', 
      'nhuc mat', 'nhức mắt', 'nhuc hoc mat', 'nhức hốc mắt', 'nhuc nua dau', 'nhức nửa đầu', 
      'quang sac', 'quầng sắc', 'cau vong', 'cầu vồng', 'cang tuc', 'căng tức', 'cung nhu da', 'cứng như đá'
    ],
    diagnosis: '🚨 **CẢNH BÁO Y KHOA QUAN TRỌNG:** Triệu chứng nhức hốc mắt dữ dội lan lên nửa đầu kèm nhìn thấy quầng cầu vồng ngũ sắc là dấu hiệu cảnh báo của **Cơn Tăng Nhãn Áp cấp tính (Bệnh Glôcôm / Cườm nước)**. Áp lực nội nhãn tăng vọt chèn ép làm tổn thương dây thần kinh thị giác không thể phục hồi.',
    actions: [
      '🚨 **ĐẾN NGAY CƠ SỞ CHUYÊN KHOA MẮT ĐỂ CẤP CỨU HẠ NHÃN ÁP TRONG VÒNG 24 GIỜ.**',
      'Bác sĩ sẽ đo nhãn áp kế Maclakov/Goldmann, soi góc tiền phòng và chỉ định thuốc nhỏ hạ áp khẩn cấp (*Lumigan, Azopt, Alphagan*) hoặc laser tạo hình mống mắt.',
      'Ngồi nghỉ nơi thoáng mát, thả lỏng tinh thần, không cúi gập người.',
      'Không uống quá 500ml nước một lúc để tránh đẩy nhãn áp tăng thêm.'
    ],
    warnings: [
      '🚨 **ĐÂY LÀ TÌNH TRẠNG CẤP CỨU NHÃN KHOA.** Nếu chần chừ có thể dẫn đến teo thị thần kinh gây mù vĩnh viễn.',
      '🚨 Tuyệt đối KHÔNG ở lâu trong phòng tối hoặc dùng thuốc giãn đồng tử.'
    ],
    doctorName: 'TS. Bác sĩ Trần Thị Lan Anh',
    doctorId: 'doc_3',
    doctorDegree: 'Tiến sĩ Bác sĩ',
    doctorSpecialty: 'Khám & Điều trị Glôcôm (Tăng nhãn áp)',
    room: 'Phòng 103 - Điều trị Glôcôm',
    serviceCode: 'glocom',
    serviceName: 'Khám & Điều trị Glôcôm (Tăng nhãn áp)',
    quickActionText: 'Đặt lịch khám Glôcôm khẩn cấp với TS. BS Trần Thị Lan Anh'
  },
  {
    id: 'retina_floaters',
    title: 'Hiện Tượng Ruồi Bay, Đốm Đen & Bệnh Võng Mạc',
    keywords: [
      'ruoi bay', 'ruồi bay', 'dom den', 'đốm đen', 'cham den', 'chấm đen', 'mang nhen', 'mạng nhện', 
      'chop sang', 'chớp sáng', 'bong vong mac', 'bong võng mạc', 'vong mac', 'võng mạc', 
      'day mat', 'đáy mắt', 'tieu duong', 'tiểu đường', 'huyet ap', 'huyết áp'
    ],
    diagnosis: 'Hiện tượng nhìn thấy chấm đen, sợi tóc hoặc con ruồi bay lơ lửng trước mắt thường do **Thoái hóa dịch kính (Vitreous Floaters)**. Tuy nhiên, nếu xuất hiện đột ngột nhiều đốm đen kèm theo chớp sáng lóe lên hoặc màng đen che khuất một góc nhìn, đây là dấu hiệu nguy hiểm của **Rách hoặc Bong Võng Mạc / Xuất huyết đáy mắt do tiểu đường**.',
    actions: [
      '**Chụp cắt lớp quang học đáy mắt (OCT Triton Plus):** Khảo sát chi tiết 10 lớp võng mạc và hoàng điểm để loại trừ rách võng mạc.',
      '**Bệnh nhân tiểu đường / huyết áp:** Cần định kỳ soi đáy mắt và chụp mạch huỳnh quang mỗi 6 tháng để tầm soát bệnh võng mạc đái tháo đường.',
      '**Hạn chế cử động mạnh:** Tránh vận động thể thao rung lắc đầu dữ dội khi đang có hiện tượng ruồi bay tăng đột ngột.'
    ],
    warnings: [
      '🚨 Nếu thấy một mảng tối che khuất tầm nhìn như tấm rèm buông xuống: Hãy đi khám cấp cứu ngay lập tức để được chiếu Laser hàn rách võng mạc.'
    ],
    doctorName: 'BS. CKII Đặng Tuấn Kiệt',
    doctorId: 'doc_8',
    doctorDegree: 'Bác sĩ CKII',
    doctorSpecialty: 'Bệnh Võng Mạc & Đáy Mắt Tiểu Đường',
    room: 'Phòng 108 - Võng Mạc & Đáy Mắt',
    serviceCode: 'retina',
    serviceName: 'Bệnh Võng Mạc & Đáy Mắt Tiểu Đường',
    quickActionText: 'Đặt lịch khám Đáy Mắt với BS. CKII Đặng Tuấn Kiệt'
  },
  {
    id: 'pediatric',
    title: 'Tật Khúc Xạ Học Đường & Nhãn Nhi ở Trẻ Em',
    keywords: [
      'tre em', 'trẻ em', 'be', 'bé', 'con', 'nheo mat', 'nheo mắt', 'chop mat', 'chớp mắt', 
      'ngoi gan', 'ngồi gần', 'hoc sinh', 'học sinh', 'hoc duong', 'học đường', 'nhuoc thi', 'nhược thị',
      'lac mat', 'lác mắt', 'ortho-k', 'ortho k', 'kinh ban dem', 'kính ban đêm'
    ],
    diagnosis: 'Trẻ có các biểu hiện của **Tật khúc xạ học đường (Cận thị tiến triển, loạn thị) hoặc Nhược thị**. Thói quen nhìn gần màn hình điện thoại/iPad nhiều trong thời gian dài khiến cơ thể mi mắt điều tiết quá mức, dẫn đến trục mắt dài nhanh và độ cận tăng chóng mặt.',
    actions: [
      '**Đo khúc xạ liệt điều tiết:** Trẻ cần được nhỏ thuốc liệt điều tiết (*Tropicamide/Cyclopentolate*) để triệt tiêu độ cận ảo, đo chính xác độ cận thật.',
      '**Giới hạn thời gian thiết bị điện tử:** Dưới 45 phút/ngày; khuyến khích trẻ vận động ngoài trời dưới ánh sáng tự nhiên tối thiểu 1.5 - 2 giờ mỗi ngày.',
      '**Phương pháp kiểm soát cận thị hiện đại:**',
      '- Kính tiếp xúc chỉnh hình giác mạc ban đêm **Ortho-K** (chỉ đeo khi ngủ, ban ngày nhìn rõ 10/10 không cần kính gọng, chặn đứng tăng độ cận tới 85%).',
      '- Hoặc nhỏ thuốc kiểm soát độ cận **Atropine 0.01%** mỗi tối trước khi ngủ.'
    ],
    warnings: [
      '⚠️ Không tự ý đưa trẻ đi đo kính tại các hiệu kính trôi nổi thiếu máy đo khúc xạ chuyên khoa trẻ em vì rất dễ bị cắt kính thừa độ gây nhược thị.'
    ],
    doctorName: 'BS. CKI Phạm Thu Hà',
    doctorId: 'doc_6',
    doctorDegree: 'Bác sĩ CKI',
    doctorSpecialty: 'Khám Nhãn Nhi & Đo Khúc Xạ Ortho-K',
    room: 'Phòng 106 - Nhãn Nhi & Ortho-K',
    serviceCode: 'pediatric',
    serviceName: 'Khám Nhãn Nhi & Kính Ortho-K',
    quickActionText: 'Đặt lịch khám Mắt Trẻ Em với BS. CKI Phạm Thu Hà'
  },
  {
    id: 'cornea_foreign_body',
    title: 'Dị Vật Mắt, Xước Giác Mạc & Cấp Cứu Dị Vật',
    keywords: [
      'bui bay', 'bụi bay', 'di vat', 'dị vật', 'mat sat', 'mạt sắt', 'xuoc giac mac', 'xước giác mạc', 
      'hoa chat', 'hóa chất', 'dau buot', 'đau buốt', 'chay nuoc mat', 'chảy nước mắt', 'so anh sang', 'sợ ánh sáng',
      'cap cuu', 'cấp cứu'
    ],
    diagnosis: '🚨 Bạn đang bị **Dị vật kết giác mạc hoặc trầy xước giác mạc**. Dị vật (bụi, mạt kim loại, côn trùng) cọ xát với biểu mô giác mạc rất nhạy cảm gây kích thích thần kinh, đau buốt, sợ ánh sáng và co thắt mi mắt.',
    actions: [
      '🚨 **QUY TẮC SỐNG CÒN: TUYỆT ĐỐI KHÔNG DỤI MẮT!** Dụi mắt sẽ làm dị vật găm sâu hơn vào nhu mô giác mạc hoặc cào rách giác mạc gây sẹo mù vĩnh viễn.',
      '**Xử trí ban đầu:** Chớp mắt liên tục trong cốc nước sạch hoặc nhỏ tràn dung dịch nước muối sinh lý NaCl 0.9% để rửa trôi dị vật.',
      'Nếu là hóa chất (xà phòng, nước tẩy): Rửa mắt dưới vòi nước sạch chảy nhẹ trong 15-20 phút liên tục.',
      '**Đến ngay phòng cấp cứu Doctor4:** Bác sĩ sẽ nhỏ thuốc tê bề mặt và dùng dụng cụ vô trùng gắp dị vật nhẹ nhàng dưới kính hiển vi.'
    ],
    warnings: [
      '🚨 Không dùng tăm bông, que nhọn hay đầu móng tay tự khều dị vật tại nhà.'
    ],
    doctorName: 'ThS. BS Vũ Đức Mạnh',
    doctorId: 'doc_10',
    doctorDegree: 'Thạc sĩ Bác sĩ',
    doctorSpecialty: 'Khám Mắt Tổng Quát & Cấp Cứu Dị Vật',
    room: 'Phòng 110 - Khám Mắt Tổng Quát',
    serviceCode: 'general',
    serviceName: 'Khám Mắt Tổng Quát & Cấp Cứu Dị Vật',
    quickActionText: 'Đến khám Cấp Cứu Dị Vật ngay với ThS. BS Vũ Đức Mạnh'
  },
  {
    id: 'oculoplastic',
    title: 'Sụp Mí Mắt, Bọng Mỡ Da Thừa & Tạo Hình Thẩm Mỹ Mắt',
    keywords: [
      'sup mi', 'sụp mí', 'da thua', 'da thừa', 'bong mo', 'bọng mỡ', 'mong thit', 'mộng thịt', 
      'cat mi', 'cắt mí', 'nhan mi', 'nhấn mí', 'tham my mat', 'thẩm mỹ mắt', 'mat le do', 'mắt lờ đờ'
    ],
    diagnosis: 'Bạn có biểu hiện của **Sụp mí mắt (Ptosis) hoặc Da dư bọng mỡ mi tuổi già / Mộng thịt kết mạc**. Tình trạng này vừa làm giảm thẩm mỹ khuôn mặt, vừa che khuất trục quang học khiến tầm nhìn bị thu hẹp, mắt luôn có cảm giác nặng trĩu mệt mỏi.',
    actions: [
      '**Khám chức năng cơ nâng mi:** Bác sĩ sẽ đo khoảng cách bờ mi - cơ nâng mi (MRD1) và chức năng cơ nâng mi.',
      '**Phẫu thuật tạo hình thẩm mỹ mí mắt:** Cắt da thừa, bóc bọng mỡ hoặc treo cơ nâng mi bằng chỉ sinh học không để lại sẹo, phục hồi đôi mắt to tròn, sáng ngời tự nhiên.',
      '**Nếu có mộng thịt:** Phẫu thuật cắt mộng ghép kết mạc tự thân không tái phát.'
    ],
    warnings: [
      '⚠️ Cần được thực hiện bởi Bác sĩ chuyên khoa Phẫu thuật Mắt để đảm bảo an toàn cơ nhãn cầu và giữ nguyên chức năng nhắm mở mắt tự nhiên.'
    ],
    doctorName: 'ThS. BS Nguyễn Mai Trang',
    doctorId: 'doc_9',
    doctorDegree: 'Thạc sĩ Bác sĩ',
    doctorSpecialty: 'Tạo Hình Thẩm Mỹ Mắt & Chữa Sụp Mí',
    room: 'Phòng 109 - Thẩm Mỹ Mắt',
    serviceCode: 'oculoplastic',
    serviceName: 'Tạo Hình Thẩm Mỹ Mắt & Sụp Mí',
    quickActionText: 'Đặt lịch tư vấn Thẩm Mỹ Mắt với ThS. BS Nguyễn Mai Trang'
  }
];

/**
 * Hàm phân tích triệu chứng tự nhiên tiếng Việt bằng NLP Engine lâm sàng
 */
export function analyzeEyeSymptoms(userText = '') {
  const query = userText.trim().toLowerCase();
  if (!query) {
    return null;
  }

  // Chuẩn hóa bỏ dấu để so sánh
  const removeAccents = (str) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

  const cleanQuery = removeAccents(query);

  // Tính điểm khớp cho từng bệnh lý
  let bestMatch = null;
  let maxScore = 0;

  for (const item of EYE_KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of item.keywords) {
      const cleanKw = removeAccents(kw);
      if (query.includes(kw)) {
        // Khớp chính xác có dấu được điểm cao nhất
        score += kw.length > 4 ? 4 : 3;
      } else if (cleanQuery.includes(cleanKw)) {
        // Khớp không dấu
        score += kw.length > 4 ? 3 : 2;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = item;
    }
  }

  // Nếu tìm thấy bệnh lý phù hợp (ngưỡng điểm >= 2)
  if (bestMatch && maxScore >= 2) {
    return {
      type: 'diagnosis',
      data: bestMatch
    };
  }

  // Các câu hỏi phổ biến khác
  if (cleanQuery.includes('chi phi') || cleanQuery.includes('gia') || cleanQuery.includes('bao nhieu tien')) {
    return {
      type: 'pricing',
      text: `💰 **BẢNG GIÁ KHÁM & ĐIỀU TRỊ NIÊM YẾT TẠI DOCTOR4:**
• **Khám mắt tổng quát 12 bước:** 200.000đ
• **Khám chuyên sâu khúc xạ mổ cận:** 500.000đ
• **Phẫu thuật mổ cận Laser SMILE Pro / Femto:** 25.000.000đ – 45.000.000đ
• **Phẫu thuật Phaco đục thủy tinh thể:** 15.000.000đ – 38.000.000đ
• **Kiểm soát cận thị Ortho-K:** 800.000đ – 18.000.000đ

✨ *Đặc biệt: Viện phí và đơn thuốc chỉ thanh toán sau khi bạn hoàn tất thăm khám với Bác sĩ tại phòng khám.*`
    };
  }

  if (cleanQuery.includes('dia chi') || cleanQuery.includes('o dau') || cleanQuery.includes('gio lam viec')) {
    return {
      type: 'location',
      text: `🏥 **THÔNG TIN PHÒNG KHÁM MẮT DOCTOR4:**
• **Địa chỉ:** 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
• **Giờ làm việc:** Thứ 2 – Chủ Nhật: 07:00 – 20:00 (làm việc cả ngoài giờ)
• **Hotline:** 1800 1234 (Miễn phí cuộc gọi)`
    };
  }

  // Phản hồi tổng quát ân cần khi triệu chứng chưa rõ ràng
  return {
    type: 'general',
    text: `Chào bạn! Tôi đã ghi nhận mô tả của bạn. Tuy nhiên triệu chứng này có thể liên quan đến nhiều tình trạng nhãn khoa khác nhau. 

💡 **Khuyến nghị ban đầu:**
1. Hãy cho mắt nghỉ ngơi, tránh nhìn màn hình liên tục và không dụi mắt.
2. Bạn có thể nhỏ nước muối sinh lý NaCl 0.9% hoặc nước mắt nhân tạo để rửa dịu mắt.
3. Nếu mắt có triệu chứng **đau nhức nhiều, nhìn mờ đột ngột, đỏ rực hoặc sợ ánh sáng**, bạn nên đến trực tiếp phòng khám Doctor4 để được Bác sĩ soi đèn khe sinh hiển vi khám trực tiếp nhé!`
  };
}

/**
 * Trợ Lý Bác Sĩ AI UI Manager
 */
export const AIAssistant = {
  chatHistory: [],
  isOpen: false,

  init() {
    this.loadHistory();
    this.renderWidget();
    this.bindEvents();
  },

  loadHistory() {
    try {
      const stored = sessionStorage.getItem(AI_CHAT_STORAGE_KEY);
      if (stored) {
        this.chatHistory = JSON.parse(stored);
      } else {
        this.chatHistory = [
          {
            sender: 'assistant',
            text: 'Xin chào! Tôi là **Trợ Lý Bác Sĩ AI Doctor4** 🩺.\n\nHãy kể cho tôi nghe mắt bạn đang cảm thấy thế nào (ví dụ: *cộm xốn, nhìn xa bị mờ, mắt đỏ nhiều ghèn, nhức hốc mắt hay thấy đốm đen ruồi bay...*), tôi sẽ phân tích nguyên nhân và tư vấn bạn nên làm gì ngay nhé!'
          }
        ];
      }
    } catch (e) {
      this.chatHistory = [];
    }
  },

  saveHistory() {
    try {
      sessionStorage.setItem(AI_CHAT_STORAGE_KEY, JSON.stringify(this.chatHistory));
    } catch (e) {}
  },

  renderWidget() {
    // Kiểm tra xem đã có launcher chưa
    if (document.getElementById('ai-assistant-root')) return;

    const root = document.createElement('div');
    root.id = 'ai-assistant-root';

    root.innerHTML = `
      <!-- Launcher Button (Góc dưới bên phải) -->
      <div class="ai-assistant-launcher" id="ai-launcher" title="Bác Sĩ AI Tư Vấn Mắt 24/7">
        <div class="ai-launcher-bubble">
          <span class="ai-pulse-dot"></span>
          <span>Hỏi Bác Sĩ AI về tình trạng mắt</span>
        </div>
        <button class="ai-launcher-btn" aria-label="Mở Trợ lý Bác sĩ AI">
          🩺
        </button>
      </div>

      <!-- Cửa sổ Chat Trợ Lý AI -->
      <div class="ai-chat-window hidden" id="ai-chat-window">
        <!-- Header -->
        <div class="ai-chat-header">
          <div class="ai-chat-header-info">
            <div class="ai-header-avatar">
              🩺
              <span class="ai-header-status-badge"></span>
            </div>
            <div>
              <h3 class="ai-header-title">
                Bác Sĩ AI Doctor4
                <span class="ai-header-badge">Online 24/7</span>
              </h3>
              <p class="ai-header-subtitle">
                <span>🤖</span> Trợ lý tư vấn bệnh lý & chăm sóc mắt
              </p>
            </div>
          </div>
          <div class="ai-chat-header-actions">
            <button class="ai-header-btn" id="btn-ai-refresh" title="Làm mới cuộc trò chuyện">🔄</button>
            <button class="ai-header-btn" id="btn-ai-minimize" title="Thu nhỏ">_</button>
            <button class="ai-header-btn" id="btn-ai-close" title="Đóng">✕</button>
          </div>
        </div>

        <!-- Body: Luồng tin nhắn -->
        <div class="ai-chat-body" id="ai-chat-body">
          <!-- Rendered messages -->
        </div>

        <!-- Footer Input -->
        <div class="ai-chat-footer">
          <!-- Gợi ý triệu chứng nhanh -->
          <div class="ai-quick-chips-wrapper">
            <div class="ai-quick-chips-title">Triệu chứng thường gặp (chọn nhanh):</div>
            <div class="ai-quick-chips">
              <button type="button" class="ai-chip" data-symptom="Mắt tôi bị khô rát, cộm xốn sau khi dùng máy tính">💧 Khô, mỏi mắt</button>
              <button type="button" class="ai-chip" data-symptom="Mắt nhìn xa bị mờ, nheo mắt mới thấy rõ, muốn khám mổ LASIK">👓 Nhìn xa mờ, mổ cận</button>
              <button type="button" class="ai-chip" data-symptom="Mắt đỏ rực, nhiều ghèn rỉ vàng và cộm ngứa">👁️ Đau mắt đỏ, nhiều ghèn</button>
              <button type="button" class="ai-chip" data-symptom="Mắt người lớn tuổi nhìn mờ như có màn sương mù, lóa đèn">🌫️ Đục thủy tinh thể</button>
              <button type="button" class="ai-chip" data-symptom="Nhức hốc mắt dữ dội lan nửa đầu, nhìn đèn thấy quầng ngũ sắc">⚡ Nhức mắt & quầng sáng</button>
              <button type="button" class="ai-chip" data-symptom="Thấy các chấm đen ruồi bay lơ lửng trước mắt">🪰 Đốm đen ruồi bay</button>
              <button type="button" class="ai-chip" data-symptom="Bé hay nheo mắt nhìn bảng, ngồi sát màn hình tivi">👶 Trẻ em nheo mắt</button>
            </div>
          </div>

          <!-- Form gửi tin nhắn -->
          <form class="ai-chat-form" id="ai-chat-form" style="margin-top: 10px;">
            <input 
              type="text" 
              class="ai-chat-input" 
              id="ai-user-input" 
              placeholder="Mô tả triệu chứng mắt của bạn (VD: cộm xốn 2 ngày nay...)" 
              autocomplete="off"
            />
            <button type="submit" class="ai-chat-send-btn" id="btn-ai-send" title="Gửi tin nhắn">
              ➤
            </button>
          </form>
          <div class="ai-chat-disclaimer">
            * Tư vấn y khoa định hướng ban đầu. Vui lòng khám trực tiếp với Bác sĩ tại phòng khám để chẩn đoán chính xác.
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(root);
    this.renderMessages();
  },

  renderMessages() {
    const body = document.getElementById('ai-chat-body');
    if (!body) return;

    body.innerHTML = this.chatHistory.map((msg, index) => {
      const isUser = msg.sender === 'user';
      return `
        <div class="ai-msg ${isUser ? 'user' : 'assistant'}">
          <div class="ai-msg-avatar">
            ${isUser ? '👤' : '🩺'}
          </div>
          <div class="ai-msg-bubble">
            ${this.formatMessageContent(msg)}
          </div>
        </div>
      `;
    }).join('');

    // Cuộn xuống cuối
    body.scrollTop = body.scrollHeight;

    // Gắn sự kiện nút Đặt lịch trong tin nhắn
    body.querySelectorAll('.ai-btn-book-cta').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const spec = btn.getAttribute('data-spec');
        const docId = btn.getAttribute('data-doc-id');
        const symptom = btn.getAttribute('data-symptom') || '';

        // Đóng chat window
        this.closeChat();

        // Cuộn mượt đến form đặt lịch
        const formSection = document.getElementById('dat-lich');
        if (!formSection) {
          sessionStorage.setItem('doctor4_ai_selected_booking', JSON.stringify({ spec, docId, symptom }));
          window.location.href = '/index.html#dat-lich';
          return;
        }

        formSection.scrollIntoView({ behavior: 'smooth' });

        // Tự động chọn dịch vụ và bác sĩ
        setTimeout(() => {
          const srvSelect = document.getElementById('book-service');
          if (srvSelect && spec) {
            srvSelect.value = spec;
            srvSelect.dispatchEvent(new Event('change'));
          }

          const docSelect = document.getElementById('book-doctor');
          if (docSelect && docId) {
            docSelect.value = docId;
            docSelect.dispatchEvent(new Event('change'));
          }

          const symptomInput = document.getElementById('book-symptoms');
          if (symptomInput && symptom) {
            symptomInput.value = symptom;
          }
        }, 400);
      });
    });
  },

  formatMessageContent(msg) {
    if (msg.sender === 'user') {
      return this.escapeHtml(msg.text);
    }

    // Nếu là tư vấn chẩn đoán cấu trúc từ AI
    if (msg.diagnosisData) {
      const d = msg.diagnosisData;
      return `
        <div style="font-size: 13.5px; font-weight: 700; color: #38bdf8; margin-bottom: 6px;">
          👨‍⚕️ Bác Sĩ AI đã phân tích tình trạng mắt của bạn:
        </div>

        <div class="ai-diagnosis-card">
          <div class="ai-diagnosis-header">
            <span>🔍 Tình trạng mắt của bạn:</span>
          </div>
          <div style="font-size: 14.5px; font-weight: 800; color: #ffffff; margin-bottom: 6px;">
            ${d.title}
          </div>
          <div class="ai-section-content" style="color: #cbd5e1; font-size: 13px; line-height: 1.55;">
            ${d.diagnosis}
          </div>
        </div>

        <div class="ai-section-item" style="margin-top: 10px;">
          <div class="ai-section-label">
            <span>💡</span> BẠN NÊN LÀM GÌ NGAY:
          </div>
          <ul style="margin: 4px 0 0 16px; padding: 0; font-size: 12.5px; line-height: 1.5; color: #e2e8f0;">
            ${d.actions.map(act => `<li style="margin-bottom: 4px;">${act}</li>`).join('')}
          </ul>
        </div>

        <div class="ai-alert-box">
          ${d.warnings.map(w => `<div>${w}</div>`).join('')}
        </div>

        <div class="ai-doctor-recommend-card">
          <div style="font-size: 12px; line-height: 1.35;">
            <div style="color: #7dd3fc; font-weight: 700;">Bác Sĩ chuyên khoa tiếp nhận:</div>
            <strong style="color: #ffffff; font-size: 13px;">${d.doctorDegree} ${d.doctorName}</strong>
            <div style="color: #94a3b8; font-size: 11px;">📍 ${d.room}</div>
          </div>
          <button 
            type="button" 
            class="ai-btn-book-cta" 
            data-spec="${d.serviceCode}" 
            data-doc-id="${d.doctorId}"
            data-symptom="${this.escapeHtml(d.title)}"
          >
            📅 Đặt lịch khám ngay
          </button>
        </div>
      `;
    }

    // Tin nhắn văn bản thông thường (hỗ trợ markdown cơ bản)
    return msg.text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  },

  openChat() {
    const win = document.getElementById('ai-chat-window');
    const launcher = document.getElementById('ai-launcher');
    if (!win) return;
    win.classList.remove('hidden');
    win.classList.remove('minimized');
    if (launcher) launcher.style.display = 'none';
    this.isOpen = true;
    document.getElementById('ai-user-input')?.focus();
    this.renderMessages();
  },

  closeChat() {
    const win = document.getElementById('ai-chat-window');
    const launcher = document.getElementById('ai-launcher');
    if (!win) return;
    win.classList.add('hidden');
    if (launcher) launcher.style.display = 'flex';
    this.isOpen = false;
  },

  sendMessage(text) {
    const query = text.trim();
    if (!query) return;

    // 1. Thêm tin nhắn người dùng
    this.chatHistory.push({
      sender: 'user',
      text: query
    });
    this.renderMessages();

    // Hiển thị typing indicator
    const body = document.getElementById('ai-chat-body');
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'ai-msg assistant typing';
    typingIndicator.innerHTML = `
      <div class="ai-msg-avatar">🩺</div>
      <div class="ai-msg-bubble">
        <div class="ai-typing-indicator">
          <span class="ai-typing-dot"></span>
          <span class="ai-typing-dot"></span>
          <span class="ai-typing-dot"></span>
        </div>
      </div>
    `;
    body?.appendChild(typingIndicator);
    body.scrollTop = body.scrollHeight;

    // Giả lập thời gian Bác Sĩ AI tư duy (600ms)
    setTimeout(() => {
      typingIndicator.remove();
      const analysis = analyzeEyeSymptoms(query);

      if (analysis && analysis.type === 'diagnosis') {
        this.chatHistory.push({
          sender: 'assistant',
          diagnosisData: analysis.data,
          text: analysis.data.diagnosis
        });
      } else if (analysis && analysis.text) {
        this.chatHistory.push({
          sender: 'assistant',
          text: analysis.text
        });
      }

      this.saveHistory();
      this.renderMessages();
    }, 600);
  },

  bindEvents() {
    // Launcher click
    document.getElementById('ai-launcher')?.addEventListener('click', () => {
      this.openChat();
    });

    // Close button
    document.getElementById('btn-ai-close')?.addEventListener('click', () => {
      this.closeChat();
    });

    // Minimize button
    document.getElementById('btn-ai-minimize')?.addEventListener('click', () => {
      const win = document.getElementById('ai-chat-window');
      win?.classList.toggle('minimized');
    });

    // Refresh history
    document.getElementById('btn-ai-refresh')?.addEventListener('click', () => {
      if (confirm('Làm mới và xóa cuộc trò chuyện hiện tại với Bác Sĩ AI?')) {
        sessionStorage.removeItem(AI_CHAT_STORAGE_KEY);
        this.loadHistory();
        this.renderMessages();
      }
    });

    // Form submit
    document.getElementById('ai-chat-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('ai-user-input');
      if (input && input.value.trim()) {
        this.sendMessage(input.value.trim());
        input.value = '';
      }
    });

    // Quick symptom chips click
    document.querySelectorAll('.ai-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const symptom = btn.getAttribute('data-symptom');
        if (symptom) {
          this.sendMessage(symptom);
        }
      });
    });

    // Lắng nghe các nút kích hoạt mở AI từ bên ngoài (e.g. trên banner hoặc hero)
    document.querySelectorAll('.btn-trigger-ai-assistant').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openChat();
        const prefill = btn.getAttribute('data-symptom');
        if (prefill) {
          const input = document.getElementById('ai-user-input');
          if (input) input.value = prefill;
          this.sendMessage(prefill);
        }
      });
    });
  }
};
