let lang = document.querySelector('.nav-list.active').id

document.addEventListener("DOMContentLoaded", async function () {

    // автозаполнение полей
    const token = localStorage.getItem('authToken');

    if (token) {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                localStorage.removeItem('authToken');
            } else {
                
                if (lang === "en") {
                    window.location.href = `/account/`
                } else {
                    window.location.href = `/account/${lang}/`;
                }
            }

        } catch (err) {
            console.error("Не удалось загрузить данные профиля:", err);
        }
    }

});



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

// Клик вне меню закрывает всё
document.addEventListener('click', (e) => {
    const target = e.target;

    if (
        !target.closest('.site-nav') &&
        !target.closest('.header-language')
    ) {
        if (langSelect.classList.contains('active')) {
            langSelect.classList.remove('active');
            langDropDown.classList.remove('visible');
            langDropDown.classList.remove('line');
            navBackground.classList.add('hidden');
            header.classList.remove('active')
            document.body.style.overflow = '';
        }
    }
});




// --- Получаем элементы формы ---
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signInBtn = document.querySelector(".form-button-main");
const wrongData = document.querySelector(".wrong-data");
const changePassword = document.querySelector(".change-password");


// убираем ошибку поля
[emailInput, passwordInput].forEach(field => {
    field.addEventListener("input", () => {
        field.classList.remove("field-error");
    });

    field.addEventListener("change", () => {
        field.classList.remove("field-error");
    });
});

// --- Обработка клика на Sign In ---
signInBtn.addEventListener("click", async () => {

    let isValid = true;

    wrongData.classList.add("hidden");
    changePassword.classList.add("hidden");

    [emailInput, passwordInput].forEach(field => {
        if (!field.value.trim() && field.hasAttribute("required")) {
            field.classList.add("field-error");
            isValid = false;
        }
    });

    if (isValid) {
        try {
            const res = await fetch("/api/auth/sign-in", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailInput.value.trim(), password: passwordInput.value.trim() })
            });

            const data = await res.json();

            if (data.success) {
                // Сохраняем JWT в localStorage
                localStorage.setItem("authToken", data.token);
                

                // Перенаправление на страницу аккаунта
                if (lang === "en") {
                    window.location.href = `/account/`
                } else {
                    window.location.href = `/account/${lang}/`;
                }

            } else {
                // Показываем ошибку
                wrongData.classList.remove("hidden");
                changePassword.classList.remove("hidden");
            }
        } catch (err) {
            console.error("Sign in error:", err);
            wrongData.textContent = "Server error. Please try again later.";
            wrongData.classList.remove("hidden");
        }
    }
});