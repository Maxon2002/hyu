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



// регистрация

// Получаем элементы формы
const emailInput = document.getElementById("email");
const otpInput = document.getElementById("otp");
const verifyEmailBtn = document.querySelector(".verify-email");
const verifyEmailSent = document.querySelector(".verify-email-sent");
const resendSpan = verifyEmailSent.querySelector(".verify-email-resend");
const timerSpan = verifyEmailSent.querySelector(".verify-email-timer");
const signUpBtn = document.querySelector(".form-button-main");
const changeEmailBtn = document.querySelector(".verify-email-change");

const nameInput = document.getElementById("name");
const referralCodeInput = document.getElementById("referral-code");
const phoneInput = document.getElementById("phone");
const passwordInput = document.getElementById("password");

let allFields = [emailInput, otpInput, nameInput, referralCodeInput, phoneInput, passwordInput]

const wrongReferral = document.querySelector(".wrong-referral");
const wrongPassword = document.querySelector(".wrong-password");
const wrongOtp = document.querySelector(".wrong-otp");
const emailExists = document.querySelector(".email-exists");

let countdown = null;


// --- Функция проверки email ---
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// --- Включение/выключение кнопки Verify Email ---
emailInput.addEventListener("input", () => {
    const email = emailInput.value.trim();
    if (isValidEmail(email)) {
        verifyEmailBtn.classList.add("active");
    } else {
        verifyEmailBtn.classList.remove("active");
    }
});

// --- Отправка OTP ---
verifyEmailBtn.addEventListener("click", async () => {
    if (!verifyEmailBtn.classList.contains("active")) return;

    const email = emailInput.value.trim();

    try {
        const res = await fetch("/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.success) {
            emailExists.classList.add("hidden");
            emailInput.disabled = true;
            verifyEmailBtn.classList.add("hidden");
            verifyEmailSent.classList.remove("hidden");
            changeEmailBtn.classList.remove("hidden");
            wrongOtp.classList.add("hidden");
            otpInput.disabled = false;


            let time = 30;
            timerSpan.textContent = time;
            countdown = setInterval(() => {
                time--;
                timerSpan.textContent = time;
                if (time <= 0) {
                    clearInterval(countdown);
                    resendSpan.classList.add("active")
                }
            }, 1000);
        } else {
            // Если сервер вернул, что email уже зарегистрирован
            if (data.message === "Email already registered") {
                emailInput.classList.add("field-error");
                emailExists.classList.remove("hidden");
            } else {
                console.log(data.message || "Ошибка при отправке OTP");
            }
        }
    } catch (err) {
        console.error(err);
        console.log("Ошибка при отправке OTP");
    }
});


// --- Повторная отправка OTP ---
resendSpan.addEventListener("click", async () => {
    if (!resendSpan.classList.contains("active")) return;
    resendSpan.classList.remove("active");
    verifyEmailBtn.click();
});


// --- Нажатие на Change email? ---
changeEmailBtn.addEventListener("click", () => {
    clearInterval(countdown);
    timerSpan.textContent = "30";
    otpInput.value = "";
    otpInput.disabled = true;

    emailInput.disabled = false;
    verifyEmailBtn.classList.remove("hidden");
    verifyEmailSent.classList.add("hidden");
    changeEmailBtn.classList.add("hidden");
});



// убираем ошибку поля
allFields.forEach(field => {
    field.addEventListener("input", () => {
        field.classList.remove("field-error");
    });

    field.addEventListener("change", () => {
        field.classList.remove("field-error");
    });
});


// --- Отправка формы регистрации ---
signUpBtn.addEventListener("click", async (e) => {

    let isValid = true;

    allFields.forEach(field => {
        if (!field.value.trim() && field.hasAttribute("required")) {
            field.classList.add("field-error");
            isValid = false;
        }
    });

    // --- Проверка пароля ---
    const passwordValue = passwordInput.value.trim();
    const passwordRegex = /^(?=.*\d).{8,}$/; // минимум 8 символов и 1 цифра
    if (!passwordRegex.test(passwordValue)) {
        passwordInput.classList.add("field-error");
        wrongPassword.classList.remove("hidden");
        isValid = false;
    } else {
        passwordInput.classList.remove("field-error");
        wrongPassword.classList.add("hidden");
    }


    // --- Проверка реферального кода ---
    if (referralCodeInput.value.trim()) {
        try {
            const res = await fetch("/api/auth/validate-referral", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: referralCodeInput.value.trim() })
            });
            const data = await res.json();
            if (!data.valid) {
                referralCodeInput.classList.add("field-error");
                wrongReferral.classList.remove("hidden");
                isValid = false;
            } else {
                referralCodeInput.classList.remove("field-error");
                wrongReferral.classList.add("hidden");
            }
        } catch (err) {
            console.error(err);
            console.log("Ошибка проверки реферального кода");
            return;
        }
    }


    // --- Проверка OTP ---
    if (otpInput.value.trim()) {
        try {
            const otpRes = await fetch("/api/auth/validate-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailInput.value.trim(), otp: otpInput.value.trim() })
            });
            const otpData = await otpRes.json();

            if (!otpData.valid) {
                otpInput.classList.add("field-error");
                wrongOtp.classList.remove("hidden");

                timerSpan.textContent = 0;
                clearInterval(countdown);
                resendSpan.classList.add("active")

                isValid = false;
            } else {
                otpInput.classList.remove("field-error");
                wrongOtp.classList.add("hidden");
            }
        } catch (err) {
            console.error(err);
            console.log("Ошибка проверки OTP");
            return;
        }
    }

    if (isValid) {

        const payload = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value.trim(),
            referralCode: referralCodeInput.value.trim() || null,
            phone: phoneInput.value.trim() || null
        };


        try {
            const res = await fetch("/api/auth/sign-up", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('authToken', data.token);
                let lang = document.querySelector('.nav-list.active')
                window.location.href = `/account/${lang}/`;
            } else {
                console.log(data.message || "Registration failed");
            }
        } catch (err) {
            console.error(err);
            console.log("Ошибка при регистрации");
        }
    }
});

