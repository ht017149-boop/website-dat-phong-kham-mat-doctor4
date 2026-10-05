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

    renderComments(list);

    form.addEventListener("submit", function(event) {

        event.preventDefault();

        const name =
            document.getElementById("comment-name").value.trim();

        const email =
            document.getElementById("comment-email").value.trim();

        const rating =
            document.getElementById("comment-rating").value;

        const content =
            document.getElementById("comment-content").value.trim();

        if (!name || !content) {
            alert("Vui lòng nhập họ tên và nội dung bình luận.");
            return;
        }

        addComment({
            name,
            email,
            rating,
            content
        });

        form.reset();

        renderComments(list);

        alert("Bình luận của bạn đã được gửi!");
    });
}

function renderComments(list) {

    const comments = getVisibleComments();

    if (comments.length === 0) {

        list.innerHTML = `
            <p>Chưa có bình luận nào.</p>
        `;

        return;
    }

    list.innerHTML = comments.map(comment => {

        const stars = "★".repeat(comment.rating);

        return `
            <div class="comment-item">

                <div class="comment-header">

                    <strong>
                        ${escapeHtml(comment.name)}
                    </strong>

                    <span class="comment-rating">
                        ${stars}
                    </span>

                </div>

                <p>
                    ${escapeHtml(comment.content)}
                </p>

                <small>
                    ${new Date(
                        comment.createdAt
                    ).toLocaleDateString("vi-VN")}
                </small>

            </div>
        `;

    }).join("");
}

function escapeHtml(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
