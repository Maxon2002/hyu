// раскрытие панели выбора языков

const langSelect = document.querySelector('.header-language');
const langDropDown = document.querySelector('.site-nav');

const navBackground = document.querySelector('.site-nav-back');

const header = document.querySelector('.header');


// Клик по кнопке выбора языка
langSelect.addEventListener('click', () => {
    const isOpen = langDropDown.classList.contains('visible');

    if (isOpen) {
        langSelect.classList.remove('active');
        langDropDown.classList.remove('visible');
        langDropDown.classList.remove('line');
        navBackground.classList.add('hidden');
        header.classList.remove('active')
        document.body.style.overflow = '';
    } else {
        langSelect.classList.add('active');
        langDropDown.classList.add('visible');
        navBackground.classList.remove('hidden');
        header.classList.add('active')
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            langDropDown.classList.add('line');
        }, 200);
    }
});






const passwordInput = document.getElementById("password");
const resetBtn = document.querySelector(".form-button-main");
const wrongPassword = document.querySelector(".wrong-password");
const errorMessage = document.querySelector(".error-message");
const successMessage = document.querySelector(".success-message");

// Получаем токен из URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

// убираем ошибку поля
passwordInput.addEventListener("input", () => {
    field.classList.remove("field-error");
});

passwordInput.addEventListener("change", () => {
    field.classList.remove("field-error");
});

resetBtn.addEventListener("click", async () => {
    let isValid = true;

    const password = passwordInput.value.trim();
    const passwordRegex = /^(?=.*\d).{8,}$/;

    // Скрываем предыдущие сообщения
    // wrongPassword.classList.add("hidden");
    errorMessage.classList.add("hidden");
    successMessage.classList.add("hidden");



    // Проверка пароля
    if (!passwordRegex.test(password)) {
        passwordInput.classList.add("field-error");
        wrongPassword.classList.remove("hidden");
        isValid = false
    } else {
        passwordInput.classList.remove("field-error");
        wrongPassword.classList.add("hidden");
    }


    if (isValid) {
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: password })
            });
            const data = await res.json();

            if (data.success) {
                successMessage.classList.remove("hidden");
                // Можно сделать редирект через несколько секунд
                let lang = document.querySelector('.nav-list.active').id
                setTimeout(() => {
                    
                    window.location.href = `../sign-in/${lang}/`;
                }, 2000);
            } else {
                errorMessage.classList.remove("hidden");
                // console.log(data.message || "Reset failed");
            }
        } catch (err) {
            console.error("Error resetting password:", err);
            errorMessage.classList.remove("hidden");
        }
    }
});