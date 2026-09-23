export function renderAbout() {
  return `
  <main id="page-about">
    <section class="page-hero">
      <div class="hero-grid"></div>
      <div class="page-hero-content">
        <div class="badge">
          <span class="badge-dot"></span>
          Giới thiệu về chúng tôi
        </div>
        <h1 class="page-hero-title">
          Phòng khám mắt Doctor4 —<br/>
          <span class="highlight">Tận tâm vì đôi mắt Việt</span>
        </h1>
        <p class="page-hero-desc">
          Hơn 15 năm đồng hành, chúng tôi đã chăm sóc và phục hồi thị lực cho hơn
          50.000 bệnh nhân trên cả nước với tiêu chuẩn nhãn khoa hiện đại nhất.
        </p>
      </div>
    </section>

    <section class="about-intro">
      <div class="about-intro-grid">
        <div class="about-story">
          <div class="story-visual">
            <div class="story-eye">👁️</div>
            <div class="story-float story-float-1">
              <span class="badge-emoji">🏆</span>
              <div class="badge-info">
                <strong>Top 10 PKM</strong>
                <span>Toàn quốc 2025</span>
              </div>
            </div>
            <div class="story-float story-float-2">
              <span class="badge-emoji">🩺</span>
              <div class="badge-info">
                <strong>32+ Bác sĩ</strong>
                <span>Chuyên khoa nhãn khoa</span>
              </div>
            </div>
          </div>
        </div>

        <div class="about-text">
          <div class="section-header align-left">
            <span class="section-tag">Câu chuyện của chúng tôi</span>
            <h2 class="section-title no-clamp">Từ năm <span>2011</span>, Doctor4 đã&nbsp;đặt&nbsp;nền móng chăm&nbsp;sóc mắt</h2>
          </div>
          <p class="about-paragraph">
            Doctor4 được thành lập vào năm 2011 với sứ mệnh mang dịch vụ khám mắt
            chất lượng quốc tế đến gần hơn với người Việt Nam. Từ một phòng khám
            nhỏ ban đầu, đến nay chúng tôi đã phát triển thành hệ thống 3 cơ sở
            tại Hà Nội, TP. Hồ Chí Minh và Đà Nẵng.
          </p>
          <p class="about-paragraph">
            Với đội ngũ hơn 32 bác sĩ nhãn khoa được đào tạo bài bản trong và
            ngoài nước cùng hệ thống máy móc hiện đại nhập khẩu từ Đức, Nhật Bản,
            Doctor4 tự hào là điểm đến tin cậy của hàng chục nghìn gia đình Việt.
          </p>
          <div class="about-points">
            <div class="about-point">
              <span class="point-icon">🎯</span>
              <div>
                <strong>Sứ mệnh</strong>
                <span>Mang lại đôi mắt sáng khỏe cho mọi người Việt Nam.</span>
              </div>
            </div>
            <div class="about-point">
              <span class="point-icon">🌟</span>
              <div>
                <strong>Tầm nhìn</strong>
                <span>Trở thành hệ thống nhãn khoa hàng đầu Đông Nam Á.</span>
              </div>
            </div>
            <div class="about-point">
              <span class="point-icon">💙</span>
              <div>
                <strong>Giá trị cốt lõi</strong>
                <span>Tận tâm – Chính xác – Đổi mới – Trung thực.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="timeline" id="timeline">
      <div class="section-header">
        <span class="section-tag">Hành trình phát triển</span>
        <h2 class="section-title">Những <span>cột mốc đáng nhớ</span></h2>
        <p class="section-desc">
          Mỗi bước tiến của Doctor4 là một bước gần hơn với mục tiêu chăm sóc thị lực cộng đồng.
        </p>
      </div>

      <div class="timeline-list">
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-year">2011</div>
          <div class="timeline-card">
            <h4 class="timeline-title">Thành lập phòng khám đầu tiên</h4>
            <p class="timeline-desc">Ra đời tại TP. Hồ Chí Minh với đội ngũ 5 bác sĩ và 10 nhân viên y tế.</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-year">2015</div>
          <div class="timeline-card">
            <h4 class="timeline-title">Đưa LASIK vào Việt Nam</h4>
            <p class="timeline-desc">Là đơn vị tiên phong triển khai phẫu thuật LASIK với máy laser thế hệ mới.</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-year">2018</div>
          <div class="timeline-card">
            <h4 class="timeline-title">Mở rộng chi nhánh Hà Nội</h4>
            <p class="timeline-desc">Phục vụ hơn 10.000 bệnh nhân khu vực phía Bắc chỉ sau 2 năm.</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-year">2021</div>
          <div class="timeline-card">
            <h4 class="timeline-title">Chứng nhận ISO 9001:2015</h4>
            <p class="timeline-desc">Đạt chuẩn quốc tế về quản lý chất lượng toàn hệ thống.</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-year">2023</div>
          <div class="timeline-card">
            <h4 class="timeline-title">Chi nhánh Đà Nẵng & trí tuệ nhân tạo</h4>
            <p class="timeline-desc">Ứng dụng AI trong chẩn đoán bệnh võng mạc cùng cơ sở mới tại miền Trung.</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-year">2026</div>
          <div class="timeline-card">
            <h4 class="timeline-title">50.000+ bệnh nhân đã được điều trị</h4>
            <p class="timeline-desc">Ghi dấu chặng đường 15 năm đồng hành cùng sức khỏe đôi mắt người Việt.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="about-stats">
      <div class="about-stats-grid">
        <div class="about-stat">
          <span class="about-stat-num">15<span>+</span></span>
          <span class="about-stat-label">Năm kinh nghiệm</span>
        </div>
        <div class="about-stat">
          <span class="about-stat-num">50<span>k+</span></span>
          <span class="about-stat-label">Bệnh nhân đã điều trị</span>
        </div>
        <div class="about-stat">
          <span class="about-stat-num">32<span>+</span></span>
          <span class="about-stat-label">Bác sĩ chuyên khoa</span>
        </div>
        <div class="about-stat">
          <span class="about-stat-num">3</span>
          <span class="about-stat-label">Cơ sở trên toàn quốc</span>
        </div>
      </div>
    </section>

    <section class="why-us">
      <div class="section-header">
        <span class="section-tag">Vì sao chọn Doctor4?</span>
        <h2 class="section-title">Cam kết của <span>chúng tôi</span></h2>
        <p class="section-desc">
          Chúng tôi kiến tạo trải nghiệm khám mắt an tâm, chuyên nghiệp ngay từ giây phút đầu tiên.
        </p>
      </div>

      <div class="why-grid">
        <div class="why-card">
          <div class="why-icon">🔬</div>
          <h3 class="why-title">Công nghệ hiện đại</h3>
          <p class="why-desc">Máy móc chẩn đoán nhập khẩu từ Đức, Nhật Bản đạt chuẩn châu Âu.</p>
        </div>
        <div class="why-card">
          <div class="why-icon">🩺</div>
          <h3 class="why-title">Bác sĩ giàu kinh nghiệm</h3>
          <p class="why-desc">Đội ngũ chuyên gia đầu ngành với hơn 20 năm kinh nghiệm điều trị.</p>
        </div>
        <div class="why-card">
          <div class="why-icon">⏱️</div>
          <h3 class="why-title">Không chờ đợi lâu</h3>
          <p class="why-desc">Quy trình đặt lịch thông minh giúp bạn đến đúng giờ, khám đúng hẹn.</p>
        </div>
        <div class="why-card">
          <div class="why-icon">🎓</div>
          <h3 class="why-title">Đào tạo liên tục</h3>
          <p class="why-desc">Bác sĩ được cập nhật kiến thức quốc tế hằng năm, luôn theo kịp công nghệ mới.</p>
        </div>
        <div class="why-card">
          <div class="why-icon">🤝</div>
          <h3 class="why-title">Chăm sóc tận tâm</h3>
          <p class="why-desc">Đội ngũ điều dưỡng đồng hành trong suốt quá trình trước và sau điều trị.</p>
        </div>
        <div class="why-card">
          <div class="why-icon">💳</div>
          <h3 class="why-title">Chi phí minh bạch</h3>
          <p class="why-desc">Báo giá rõ ràng trước khi thực hiện, hỗ trợ bảo hiểm y tế và trả góp.</p>
        </div>
      </div>
    </section>

    <section class="facility">
      <div class="facility-inner">
        <div class="facility-text">
          <div class="section-header align-left">
            <span class="section-tag">Cơ sở vật chất</span>
            <h2 class="section-title no-clamp">Trải nghiệm không gian <span>hiện đại & thoải mái</span></h2>
          </div>
          <p class="about-paragraph">
            Hệ thống phòng khám được thiết kế theo tiêu chuẩn bệnh viện quốc tế với
            phòng khám riêng biệt, khu vực chờ thoáng mát và quy trình vô trùng nghiêm ngặt.
          </p>
          <ul class="facility-list">
            <li>✔️ 12 phòng khám &amp; phẫu thuật hiện đại</li>
            <li>✔️ Trang thiết bị chẩn đoán hình ảnh tiên tiến</li>
            <li>✔️ Khu vực chờ rộng rãi, điều hòa, nước uống miễn phí</li>
            <li>✔️ Bãi giữ xe thuận tiện và xe lăn hỗ trợ</li>
          </ul>
          <a href="#/dat-lich" class="btn-primary">📅 Đặt lịch tham quan</a>
        </div>
        <div class="facility-visual">
          <div class="story-eye">🏥</div>
          <div class="facility-tags">
            <span class="facility-tag">ISO 9001</span>
            <span class="facility-tag">Vô trùng chuẩn</span>
            <span class="facility-tag">3 cơ sở</span>
          </div>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="cta-inner">
        <span class="cta-icon">👁️</span>
        <h2 class="cta-title">Hãy để Doctor4 <span>đồng hành cùng bạn</span></h2>
        <p class="cta-desc">
          Đặt lịch khám ngay hôm nay để nhận ưu đãi đặc biệt và trải nghiệm dịch vụ chăm sóc mắt chuẩn quốc tế.
        </p>
        <div class="cta-actions">
          <a href="#/dat-lich" class="btn-cta-primary">📅 Đặt lịch khám ngay</a>
          <a href="tel:18001234" class="btn-cta-outline">📞 Gọi 1800 1234</a>
        </div>
      </div>
    </section>
  </main>
  `
}