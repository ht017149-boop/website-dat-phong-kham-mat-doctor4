
function getRegisteredUser() {

    const data =
        localStorage.getItem("doctor4_user");

    if (!data) {
        return null;
    }

    try {

        return JSON.parse(data);

    } catch (error) {

        return null;
    }
}

