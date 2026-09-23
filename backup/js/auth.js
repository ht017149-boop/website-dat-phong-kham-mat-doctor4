function getRegisteredUser() {
    const data = localStorage.getItem("doctor4_user");

    if (!data) {
        return null;
    }

    try {
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

function registerUser(username, password, confirmPassword) {

    if (!username || !password || !confirmPassword) {
        alert("Vui lòng nhập đầy đủ thông tin!");
        return false;
    }

    if (password !== confirmPassword) {
        alert("Mật khẩu xác nhận không giống nhau!");
        return false;
    }

    const oldUser = getRegisteredUser();

    if (oldUser) {
        alert("Tài khoản đã tồn tại. Vui lòng đăng nhập!");
        return false;
    }

    const user = {
        username: username,
        password: password
    };

    localStorage.setItem("doctor4_user", JSON.stringify(user));

    alert("Đăng ký thành công!");

    window.location.href = "login.html";

    return false;
}

function loginUser(username, password) {

    const user = getRegisteredUser();

    if (!user) {
        alert("Bạn chưa đăng ký tài khoản. Vui lòng đăng ký trước!");
        return false;
    }

    if (username === user.username && password === user.password) {

        localStorage.setItem("doctor4_logged_in", "true");

        localStorage.setItem(
            "doctor4_current_user",
            JSON.stringify(user)
        );

        alert("Đăng nhập thành công!");

        window.location.href = "../index.html";

        return false;
    }

    alert("Tên đăng nhập hoặc mật khẩu không đúng!");

    return false;
}

function logoutUser() {

    localStorage.removeItem("doctor4_logged_in");
    localStorage.removeItem("doctor4_current_user");

    window.location.href = "pages/login.html";
}
