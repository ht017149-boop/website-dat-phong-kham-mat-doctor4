import {
    addComment,
    getVisibleComments
} from "../admin/comment-manager.js";

export function initComments() {

    const form = document.getElementById("comment-form");
    const list = document.getElementById("comments-list");

    if (!form || !list) {
        return;
    }

    // ── Star picker ─────────────────────────────────────────────
    const starPicker = document.getElementById("star-picker");
    const ratingSelect = document.getElementById("comment-rating");

    if (starPicker && ratingSelect) {
        let currentRating = 5;

        const stars = starPicker.querySelectorAll(".star");

        function setRating(val) {
            currentRating = val;
            ratingSelect.value = val;
            stars.forEach(s => {
                const sv = Number(s.dataset.val);
                s.classList.toggle("active", sv <= val);
            });
        }

        // Default: 5 sao
        setRating(5);

        stars.forEach(star => {
            star.addEventListener("mouseenter", () => {
                const val = Number(star.dataset.val);
                stars.forEach(s => s.classList.toggle("hover", Number(s.dataset.val) <= val));
            });
            star.addEventListener("mouseleave", () => {
                stars.forEach(s => s.classList.remove("hover"));
            });
            star.addEventListener("click", () => {
                setRating(Number(star.dataset.val));
            });
        });
    }

    // ── Render ban đầu ──────────────────────────────────────────
    renderComments(list);

    // ── Submit form ─────────────────────────────────────────────
    form.addEventListener("submit", function(event) {

        event.preventDefault();

        const name     = document.getElementById("comment-name").value.trim();
        const email    = document.getElementById("comment-email").value.trim();
        const rating   = document.getElementById("comment-rating").value;
        const content  = document.getElementById("comment-content").value.trim();

        if (!name || !content) {
            showInlineMessage("Vui lòng nhập họ tên và nội dung bình luận.", "error");
            return;
        }

        addComment({ name, email, rating, content });

        form.reset();
        if (ratingSelect) ratingSelect.value = "5";
        if (starPicker) {
            starPicker.querySelectorAll(".star").forEach(s => {
                s.classList.toggle("active", Number(s.dataset.val) <= 5);
                s.classList.remove("hover");
            });
        }

        renderComments(list);
        showInlineMessage("✅ Cảm ơn! Đánh giá của bạn đã được gửi.", "success");
    });
}

function renderComments(list) {

    const comments = getVisibleComments();

    // Cập nhật badge đếm
    const badge = document.getElementById("comments-count-badge");
    if (badge) badge.textContent = `${comments.length} đánh giá`;

    if (comments.length === 0) {
        list.innerHTML = `
            <div class="comments-empty">
                <div class="comments-empty-icon">💬</div>
                <p>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
            </div>
        `;
        return;
    }

    list.innerHTML = comments.map(comment => {

        const stars = "★".repeat(comment.rating) + "☆".repeat(5 - comment.rating);
        const initials = escapeHtml(comment.name).charAt(0).toUpperCase();
        const date = new Date(comment.createdAt).toLocaleDateString("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric"
        });

        return `
            <div class="comment-item">
                <div class="ci-avatar">${initials}</div>
                <div class="ci-body">
                    <div class="ci-header">
                        <span class="ci-name">${escapeHtml(comment.name)}</span>
                        <span class="ci-stars">${stars}</span>
                    </div>
                    <p class="ci-text">${escapeHtml(comment.content)}</p>
                    <small class="ci-date">📅 ${date}</small>
                </div>
            </div>
        `;

    }).join("");
}

function showInlineMessage(text, type) {
    const existing = document.getElementById("comment-inline-msg");
    if (existing) existing.remove();

    const msg = document.createElement("div");
    msg.id = "comment-inline-msg";
    msg.className = `comment-msg comment-msg-${type}`;
    msg.textContent = text;

    const form = document.getElementById("comment-form");
    if (form) form.insertAdjacentElement("afterend", msg);

    setTimeout(() => msg.remove(), 4000);
}

function escapeHtml(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
