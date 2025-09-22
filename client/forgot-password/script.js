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



// --- Получаем элементы формы ---
const emailInput = document.getElementById("email");
const sendResetBtn = document.querySelector(".form-button-main");
const errorMessage = document.querySelector(".error-message");
const successMessage = document.querySelector(".success-message");

let currentLang = document.querySelector('.nav-list.active').id

// убираем ошибку поля
emailInput.addEventListener("input", () => {
    emailInput.classList.remove("field-error");
});

emailInput.addEventListener("change", () => {
    emailInput.classList.remove("field-error");
});

// --- Обработка клика ---
sendResetBtn.addEventListener("click", async () => {
    let isValid = true;

    if (!emailInput.value.trim()) {
        emailInput.classList.add("field-error");
        isValid = false;
    }

    if (isValid) {
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailInput.value.trim(), language: currentLang })
            });

            const data = await res.json();

            if (data.success) {
                errorMessage.classList.add("hidden");
                successMessage.classList.remove("hidden");
            } else {
                successMessage.classList.add("hidden");
                errorMessage.classList.remove("hidden");
            }
        } catch (err) {
            console.error("Error sending reset link:", err);
            successMessage.classList.add("hidden");
            errorMessage.classList.remove("hidden");
        }
    }
});