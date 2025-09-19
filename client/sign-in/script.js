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
                // const payload = JSON.parse(atob(data.token.split('.')[1]));
                // console.log("Decoded payload:", payload);

                // Перенаправление на страницу аккаунта
                window.location.href = "/account/";
            } else {
                // Показываем ошибку
                wrongData.classList.remove("hidden");
            }
        } catch (err) {
            console.error("Sign in error:", err);
            wrongData.textContent = "Server error. Please try again later.";
            wrongData.classList.remove("hidden");
        }
    }
});