import {
    getComments,
    hideComment,
    showComment,
    deleteComment
} from "./comment-manager.js";

export function initCommentAdmin() {

    const table = document.getElementById(
        "admin-comments-list"
    );

    if (!table) {
        return;
    }

    renderComments(table);
}

function renderComments(table) {

    const comments = getComments();

    if (comments.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    Chưa có bình luận nào
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML = comments.map(comment => {

        const status =
            comment.status === "hidden"
                ? "Đã ẩn"
                : "Đang hiển thị";

        const button =
            comment.status === "hidden"

                ? `
                    <button
                        onclick="showAdminComment(${comment.id})">
                        Hiện
                    </button>
                  `

                : `
                    <button
                        onclick="hideAdminComment(${comment.id})">
                        Ẩn
                    </button>
                  `;

        return `
            <tr>

                <td>${comment.name}</td>

                <td>${comment.email}</td>

                <td>
                    ${"★".repeat(comment.rating)}
                </td>

                <td>
                    ${comment.content}
                </td>

                <td>
                    ${status}
                </td>

                <td>

                    ${button}

                    <button
                        onclick="deleteAdminComment(${comment.id})">
                        Xóa
                    </button>

                </td>

            </tr>
        `;

    }).join("");
}

window.hideAdminComment = function(id) {

    if (!confirm("Bạn có chắc muốn ẩn bình luận này?")) {
        return;
    }

    hideComment(id);

    location.reload();
};

window.showAdminComment = function(id) {

    showComment(id);

    location.reload();
};

window.deleteAdminComment = function(id) {

    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) {
        return;
    }

    deleteComment(id);

    location.reload();
};
