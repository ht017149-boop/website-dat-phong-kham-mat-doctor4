export function renderAdminDashboard() {
  return `
    <div class="admin-container" style="display: flex; min-height: 100vh; background-color: #f4f7f6; font-family: sans-serif;">
      <!-- Sidebar -->
      <aside style="width: 250px; background-color: #2c3e50; color: white; padding: 20px;">
        <h2 style="margin-top: 0; color: #1abc9c; border-bottom: 1px solid #34495e; padding-bottom: 15px;">Doctor4 Admin</h2>
        <ul style="list-style: none; padding: 0;">
          <li style="margin-bottom: 15px;"><a href="#/admin" style="color: white; text-decoration: none; font-weight: bold;">📊 Bảng điều khiển</a></li>
          <li style="margin-bottom: 15px;"><a href="#/" style="color: #bdc3c7; text-decoration: none;">👤 Quản lý người dùng</a></li>
          <li style="margin-bottom: 15px;"><a href="#/" style="color: #bdc3c7; text-decoration: none;">📅 Quản lý lịch hẹn</a></li>
          <li style="margin-top: 50px;"><a href="#/" style="color: #e74c3c; text-decoration: none;">⬅️ Về trang chủ web</a></li>
        </ul>
      </aside>

      <!-- Main Content -->
      <main style="flex: 1; padding: 30px;">
        <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">Bảng điều khiển</h1>
          <div style="background: white; padding: 10px 20px; border-radius: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            Xin chào, <strong>Admin</strong>
          </div>
        </header>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
          <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border-left: 5px solid #3498db;">
            <h3 style="margin-top: 0; color: #7f8c8d;">Tổng số lịch hẹn</h3>
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #2c3e50;">1,245</p>
          </div>
          <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border-left: 5px solid #2ecc71;">
            <h3 style="margin-top: 0; color: #7f8c8d;">Bệnh nhân mới</h3>
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #2c3e50;">128</p>
          </div>
          <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border-left: 5px solid #f1c40f;">
            <h3 style="margin-top: 0; color: #7f8c8d;">Doanh thu tháng</h3>
            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #2c3e50;">450M</p>
          </div>
        </div>

        <div style="margin-top: 40px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
          <h2 style="color: #333; margin-top: 0;">Lịch hẹn gần đây</h2>
          <p style="color: #7f8c8d;">(Dữ liệu mẫu - Đang cập nhật...)</p>
        </div>
      </main>
    </div>
  `
}
