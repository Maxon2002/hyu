document.addEventListener("DOMContentLoaded", () => {
    const loginInput = document.getElementById("login");
    const passwordInput = document.getElementById("password");
    const signInButton = document.querySelector(".form-button-main");
    const wrongData = document.querySelector(".wrong-data");

    signInButton.addEventListener("click", async () => {
        const login = loginInput.value.trim();
        const password = passwordInput.value.trim();

        if (!login || !password) {
            wrongData.textContent = "Please fill in both fields.";
            wrongData.classList.remove("hidden");
            return;
        }

        try {
            const res = await fetch("/api/admin/sign-in", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ login, password })
            });

            const data = await res.json();

            if (data.success) {
                // Сохраняем JWT для админа
                localStorage.setItem("adminToken", data.token);

                // Перенаправляем на страницу сканера (например)
                window.location.href = "/admin/scanner/";
            } else {
                wrongData.textContent = data.message || "Invalid login or password.";
                wrongData.classList.remove("hidden");
            }
        } catch (err) {
            console.error("Admin sign-in error:", err);
            wrongData.textContent = "Server error. Please try again later.";
            wrongData.classList.remove("hidden");
        }
    });
});