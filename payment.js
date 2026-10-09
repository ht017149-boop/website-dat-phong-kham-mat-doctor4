/*
========================================
THÔNG TIN TÀI KHOẢN NHẬN TIỀN
========================================
*/

const BANK_ID = "MB";

const ACCOUNT_NUMBER = "0123456789";

const ACCOUNT_NAME = "NGUYEN VAN A";

const BANK_NAME = "MB Bank";


/*
========================================
LẤY THÔNG TIN LỊCH KHÁM
========================================
*/

const urlParams =
    new URLSearchParams(
        window.location.search
    );


const amount =
    Number(
        urlParams.get("amount")
    ) || 200000;


const patientName =
    urlParams.get("name") ||
    localStorage.getItem("patientName") ||
    "Nguyễn Văn A";


const doctorName =
    urlParams.get("doctor") ||
    localStorage.getItem("doctorName") ||
    "Bác sĩ Nguyễn Văn B";


const appointmentDate =
    urlParams.get("date") ||
    localStorage.getItem("appointmentDate") ||
    "10/10/2026";


const appointmentTime =
    urlParams.get("time") ||
    localStorage.getItem("appointmentTime") ||
    "09:00";


/*
========================================
TẠO / LẤY MÃ GIAO DỊCH
========================================
*/

// Nếu URL đã có paymentId thì lấy lại
// Nếu chưa có thì tạo mã mới
let paymentId =
    urlParams.get("paymentId") ||
    localStorage.getItem("currentPaymentId");


if (!paymentId) {

    paymentId =
        "PAY" + Date.now();

    localStorage.setItem(
        "currentPaymentId",
        paymentId
    );

}


/*
========================================
NỘI DUNG CHUYỂN KHOẢN
========================================
*/

const transferContent =
    "THANHTOAN " + paymentId;


/*
========================================
HIỂN THỊ THÔNG TIN
========================================
*/

const patientNameElement =
    document.getElementById("patientName");

if (patientNameElement) {
    patientNameElement.textContent =
        patientName;
}


const doctorNameElement =
    document.getElementById("doctorName");

if (doctorNameElement) {
    doctorNameElement.textContent =
        doctorName;
}


const appointmentDateElement =
    document.getElementById("appointmentDate");

if (appointmentDateElement) {
    appointmentDateElement.textContent =
        appointmentDate;
}


const appointmentTimeElement =
    document.getElementById("appointmentTime");

if (appointmentTimeElement) {
    appointmentTimeElement.textContent =
        appointmentTime;
}


const paymentAmountElement =
    document.getElementById("paymentAmount");

if (paymentAmountElement) {
    paymentAmountElement.textContent =
        formatMoney(amount);
}


const bankNameElement =
    document.getElementById("bankName");

if (bankNameElement) {
    bankNameElement.textContent =
        BANK_NAME;
}


const accountNumberElement =
    document.getElementById("accountNumber");

if (accountNumberElement) {
    accountNumberElement.textContent =
        ACCOUNT_NUMBER;
}


const accountNameElement =
    document.getElementById("accountName");

if (accountNameElement) {
    accountNameElement.textContent =
        ACCOUNT_NAME;
}


const transferContentElement =
    document.getElementById("transferContent");

if (transferContentElement) {
    transferContentElement.textContent =
        transferContent;
}


/*
========================================
TẠO QR VIETQR
========================================
*/

const qrUrl =
    "https://img.vietqr.io/image/" +
    BANK_ID +
    "-" +
    ACCOUNT_NUMBER +
    "-compact2.png" +
    "?amount=" +
    amount +
    "&addInfo=" +
    encodeURIComponent(
        transferContent
    ) +
    "&accountName=" +
    encodeURIComponent(
        ACCOUNT_NAME
    );


const qrCodeElement =
    document.getElementById("qrCode");

if (qrCodeElement) {
    qrCodeElement.src = qrUrl;
}


/*
========================================
KEY LƯU GIAO DỊCH
========================================
*/

const paymentKey =
    "payment_" + paymentId;


/*
========================================
LẤY DỮ LIỆU THANH TOÁN ĐÃ LƯU
========================================
*/

let paymentData =
    JSON.parse(
        localStorage.getItem(
            paymentKey
        )
    );


/*
========================================
HIỂN THỊ TRẠNG THÁI BAN ĐẦU
========================================
*/

if (paymentData) {

    updatePaymentStatus(
        paymentData.status
    );

}


/*
========================================
KIỂM TRA TRẠNG THÁI THANH TOÁN
========================================
*/

function checkPaymentStatus() {

    /*
    Lấy danh sách thanh toán
    */

    const payments =
        JSON.parse(
            localStorage.getItem(
                "payments"
            ) || "[]"
        );


    /*
    Tìm đúng giao dịch
    */

    const payment =
        payments.find(
            p =>
                String(p.id) ===
                String(paymentId)
        );


    /*
    Chưa có giao dịch
    */

    if (!payment) {
        return;
    }


    /*
    Cập nhật dữ liệu hiện tại
    */

    paymentData =
        payment;


    /*
    Cập nhật trạng thái trên giao diện
    */

    updatePaymentStatus(
        payment.status
    );

}


/*
========================================
NÚT TÔI ĐÃ THANH TOÁN
========================================
*/

function confirmPayment() {

    /*
    Tạo dữ liệu giao dịch
    */

    const data = {

        id: paymentId,

        patientName: patientName,

        doctorName: doctorName,

        date: appointmentDate,

        time: appointmentTime,

        amount: amount,

        bank: BANK_NAME,

        content: transferContent,

        status: "pending",

        createdAt:
            new Date()
                .toLocaleString(
                    "vi-VN"
                )

    };


    /*
    Lưu giao dịch riêng
    */

    localStorage.setItem(

        paymentKey,

        JSON.stringify(data)

    );


    /*
    Lấy danh sách thanh toán
    */

    let payments =
        JSON.parse(
            localStorage.getItem(
                "payments"
            )
        ) || [];


    /*
    Kiểm tra giao dịch đã tồn tại chưa
    */

    const existingIndex =
        payments.findIndex(
            item =>
                String(item.id) ===
                String(paymentId)
        );


    /*
    Nếu chưa có thì thêm
    */

    if (existingIndex === -1) {

        payments.push(data);

    }

    /*
    Nếu đã có thì cập nhật
    */

    else {

        payments[existingIndex] =
            data;

    }


    /*
    Lưu lại danh sách
    */

    localStorage.setItem(

        "payments",

        JSON.stringify(
            payments
        )

    );


    /*
    Lưu mã giao dịch hiện tại
    */

    localStorage.setItem(
        "currentPaymentId",
        paymentId
    );


    /*
    Hiển thị trạng thái chờ
    */

    updatePaymentStatus(
        "pending"
    );


    /*
    Thông báo
    */

    alert(
        "Đã gửi yêu cầu xác nhận thanh toán.\n\n" +
        "Mã giao dịch: " +
        paymentId +
        "\n\n" +
        "Vui lòng chờ Admin xác nhận."
    );

}


/*
========================================
HIỂN THỊ TRẠNG THÁI
========================================
*/

function updatePaymentStatus(
    status
) {

    const statusBox =
        document.getElementById(
            "paymentStatus"
        );


    const button =
        document.getElementById(
            "confirmButton"
        );


    /*
    Nếu HTML không có paymentStatus
    thì không làm gì
    */

    if (!statusBox) {
        return;
    }


    /*
    Reset class
    */

    statusBox.className =
        "payment-status";


    /*
    TRẠNG THÁI PENDING
    */

    if (
        status === "pending"
    ) {

        statusBox.classList.add(
            "pending"
        );


        statusBox.innerHTML =
            "⏳ Đang chờ Admin xác nhận";


        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Đã gửi yêu cầu";

        }

    }


    /*
    TRẠNG THÁI SUCCESS
    */

    else if (
        status === "success"
    ) {

        statusBox.classList.add(
            "success"
        );


        statusBox.innerHTML =
            "✓ Thanh toán đã được xác nhận";


        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Đã thanh toán";

        }

    }


    /*
    TRẠNG THÁI CANCEL
    */

    else if (
        status === "cancel"
    ) {

        statusBox.classList.add(
            "cancel"
        );


        statusBox.innerHTML =
            "✕ Thanh toán bị từ chối";


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Gửi lại yêu cầu";

        }

    }


    /*
    CHƯA THANH TOÁN
    */

    else {

        statusBox.classList.add(
            "waiting"
        );


        statusBox.innerHTML =
            "⏳ Đang chờ thanh toán";


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Tôi đã thanh toán";

        }

    }

}


/*
========================================
FORMAT TIỀN
========================================
*/

function formatMoney(number) {

    return Number(number)
        .toLocaleString(
            "vi-VN"
        ) +
        " VNĐ";

}


/*
========================================
QUAY LẠI
========================================
*/

function goBack() {

    window.history.back();

}


/*
========================================
KIỂM TRA LIÊN TỤC
========================================
*/

// Kiểm tra ngay khi mở trang
checkPaymentStatus();


// Kiểm tra lại mỗi 2 giây
setInterval(
    checkPaymentStatus,
    2000
);