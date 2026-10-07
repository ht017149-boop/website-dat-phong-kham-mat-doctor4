const COMMENTS_KEY = "doctor4_comments";

// Lấy tất cả bình luận
export function getComments() {
    const comments = localStorage.getItem(COMMENTS_KEY);

    if (!comments) {
        return [];
    }

    return JSON.parse(comments);
}

// Lưu bình luận
export function saveComments(comments) {
    localStorage.setItem(
        COMMENTS_KEY,
        JSON.stringify(comments)
    );
}

// Thêm bình luận
export function addComment(comment) {
    const comments = getComments();

    const newComment = {
        id: Date.now(),
        name: comment.name,
        email: comment.email,
        rating: Number(comment.rating),
        content: comment.content,
        status: "visible",
        createdAt: new Date().toISOString()
    };

    comments.unshift(newComment);

    saveComments(comments);

    return newComment;
}

// Ẩn bình luận
export function hideComment(id) {
    const comments = getComments();

    const comment = comments.find(
        item => item.id === Number(id)
    );

    if (comment) {
        comment.status = "hidden";
        saveComments(comments);
        return true;
    }

    return false;
}

// Hiện lại bình luận
export function showComment(id) {
    const comments = getComments();

    const comment = comments.find(
        item => item.id === Number(id)
    );

    if (comment) {
        comment.status = "visible";
        saveComments(comments);
        return true;
    }

    return false;
}

// Xóa bình luận
export function deleteComment(id) {
    const comments = getComments();

    const newComments = comments.filter(
        item => item.id !== Number(id)
    );

    saveComments(newComments);

    return true;
}

// Chỉ lấy bình luận đang hiển thị
export function getVisibleComments() {
    return getComments().filter(
        comment => comment.status === "visible"
    );
}
