const headerSignin = document.querySelector('.header-signin')
const headerAccount = document.querySelector('.header-account')

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
                headerSignin.classList.add('hidden')
                headerAccount.classList.remove('hidden')

            }

        } catch (err) {
            console.error("Не удалось загрузить данные профиля:", err);
        }
    }

});

const signOutBtn = document.querySelector('#sign-out')

signOutBtn.addEventListener("click", () => {
    localStorage.removeItem("authToken"); // удаляем токен
    headerSignin.classList.remove("hidden");
    headerAccount.classList.add("hidden");
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

    if (
        !target.closest('.header-account-nav') &&
        !target.closest('.header-account-btn') &&
        !target.closest('.header-account-nav-btn')
    ) {
        if (accountBtn.classList.contains('active')) {
            accountBtn.classList.remove('active');
            accountPanel.classList.remove('visible');

        }
    }
});


// раскрытие панели аккаунта

const accountBtn = document.querySelector('.header-account-btn');
const accountPanel = document.querySelector('.header-account-nav');

accountBtn.addEventListener('click', (e) => {
    const isOpen = accountPanel.classList.contains('visible');

    if (isOpen) {
        accountBtn.classList.remove('active');
        accountPanel.classList.remove('visible');
        // langDropDown.classList.remove('line');
    } else {
        accountBtn.classList.add('active');
        accountPanel.classList.add('visible');
        // setTimeout(() => {
        //     langDropDown.classList.add('line');
        // }, 200);
    }
});