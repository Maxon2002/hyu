let adminToken = localStorage.getItem("adminToken");

document.addEventListener("DOMContentLoaded", async () => {

    if (!adminToken) {
        window.location.href = "/admin/sign-in/";
        return;
    }

    // Проверка токена на сервере
    try {
        const res = await fetch("/api/admin/verify-token", {
            headers: { "Authorization": `Bearer ${adminToken}` }
        });

        if (!res.ok) {
            // Токен недействителен
            localStorage.removeItem("adminToken");
            window.location.href = "/admin/sign-in/";
            return;
        }

    } catch (err) {
        console.error("Token verification error:", err);
        localStorage.removeItem("adminToken");
        window.location.href = "/admin/sign-in/";
    }
});


const startScanBtn = document.getElementById("start-scan");
const scannerBox = document.getElementById("scanner-box");
const scannerView = document.getElementById("scanner-view");
const scannerClose = document.querySelector(".scanner-close");
const clientData = document.getElementById("client-data");
const clientDiscount = document.getElementById("client-discount");
const clientEmail = document.getElementById("client-email");
const clientName = document.getElementById("client-name");
const clientVisits = document.getElementById("client-visits");
const clientFriends = document.getElementById("client-friends");
const markVisitBtn = document.getElementById("mark-visit");
const closeClientDataBtn = document.getElementById("close-client-data");

let html5QrCode;
let referralCodeUser

startScanBtn.addEventListener("click", () => {
    startScanBtn.classList.add("hidden");
    scannerBox.classList.remove("hidden");

    html5QrCode = new Html5Qrcode("scanner-view");

    Html5Qrcode.getCameras().then(cameras => {
        if (cameras && cameras.length) {
            // Ищем тыловую камеру
            let backCamera = cameras.find(cam => cam.label.toLowerCase().includes("back"));

            // Если не нашли — берём последнюю (обычно она тыловая)
            const cameraId = backCamera ? backCamera.id : cameras[cameras.length - 1].id;

            html5QrCode.start(
                cameraId,
                { fps: 10, qrbox: 250 },
                qrCodeMessage => {
                    referralCodeUser = qrCodeMessage;
                    fetchClientData(qrCodeMessage);
                    html5QrCode.stop();
                    scannerBox.classList.add("hidden");
                },
                errorMessage => {
                    console.warn("QR scan error:", errorMessage);
                }
            );
        }
    }).catch(err => console.error("Camera error:", err));

});

scannerClose.addEventListener("click", () => {
    if (html5QrCode) html5QrCode.stop();
    scannerBox.classList.add("hidden");
    startScanBtn.classList.remove("hidden");
});

closeClientDataBtn.addEventListener("click", () => {
    clientData.classList.add("hidden");
    startScanBtn.classList.remove("hidden");
    markVisitBtn.classList.remove("used");
    markVisitBtn.textContent = "Mark Visit";

});

async function fetchClientData(referralCode) {
    try {
        const res = await fetch(`/api/admin/client`, {
            method: "POST", // теперь POST
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({ referralCode }) // передаём в теле
        });

        const data = await res.json();

        if (data.success) {
            const user = data.user;
            clientDiscount.textContent = user.discount;
            clientEmail.textContent = user.email;
            clientName.textContent = user.name;
            clientVisits.textContent = user.totalVisits;
            clientFriends.textContent = user.friendsInvited;

            clientData.classList.remove("hidden");

            // Здесь можно привязать markVisitBtn к вызову API для отметки визита
        } else {
            alert(data.message || "Client not found");
        }
    } catch (err) {
        console.error("Fetch client error:", err);
        alert("Server error. Please try again later.");
    }
}

markVisitBtn.addEventListener("click", async () => {
    if (markVisitBtn.classList.contains("used")) return; // уже отмечено

    try {
        const res = await fetch(`/api/admin/mark-visit`, { // или referralCode
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                referralCode: referralCodeUser // или user.referralCode
            })
        });

        const data = await res.json();

        if (data.success) {
            // Обновляем UI
            markVisitBtn.classList.add("used");
            markVisitBtn.textContent = "Visit Marked";

            // Обновляем данные клиента на экране
            clientVisits.textContent = +clientVisits.textContent + 1;
        } else {
            alert(data.message || "Failed to mark visit");
        }
    } catch (err) {
        console.error("Mark visit error:", err);
        alert("Server error. Please try again later.");
    }
});
