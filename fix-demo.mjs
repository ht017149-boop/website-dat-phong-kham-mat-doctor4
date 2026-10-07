import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('dang-nhap.html', 'utf8');

// Fix email demo bác sĩ
content = content
  .replace('data-email="bs.minhduc@doctor4.vn"', 'data-email="quan.nm@doctor4.vn"')
  .replace(
    'bs.minhduc@doctor4.vn (Khám &amp; Kê đơn)',
    'quan.nm@doctor4.vn · BS. Nguyễn Minh Quân (Khám &amp; Kê đơn)'
  );

writeFileSync('dang-nhap.html', content, 'utf8');
console.log('Fixed! Email demo bác sĩ đã được cập nhật thành quan.nm@doctor4.vn');
