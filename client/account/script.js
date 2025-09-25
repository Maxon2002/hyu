let currentLang = document.querySelector('.nav-list.active').id

// Функция для получения данных аккаунта
async function fetchAccountData() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        // Если токен отсутствует, перенаправляем на вход
        if (currentLang === "en") {
            window.location.href = '/sign-in/';
        } else {
            window.location.href = `/sign-in/${currentLang}/`;
        }

        return;
    }

    try {
        const res = await fetch('/api/auth/account', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            // Токен недействителен или истёк
            localStorage.removeItem('authToken');

            if (currentLang === "en") {
                window.location.href = '/sign-in/';
            } else {
                window.location.href = `/sign-in/${currentLang}/`;
            }

            return;
        }


        const data = await res.json();
        populateAccount(data);
    } catch (err) {
        console.error(err);
    }
}

const signOutBtn = document.querySelector('#sign-out')

signOutBtn.addEventListener("click", () => {
    localStorage.removeItem("authToken"); // удаляем токен

    if (currentLang === "en") {
        window.location.href = '/sign-in/';
    } else {
        window.location.href = `/sign-in/${currentLang}/`;
    }
});



// Функция для заполнения страницы данными
function populateAccount(user) {
    // --- Основная информация ---
    document.getElementById('account-email').textContent = user.email;
    document.querySelectorAll('#account-id').forEach(el => el.textContent = user.referralCode);
    document.getElementById('account-discount').textContent = `${user.discount}%`;

    // --- QR код ---
    const qrContainer = document.getElementById('account-qr');
    QRCode.toDataURL(user.referralCode, { width: 500, margin: 2 })
        .then(url => {
            qrContainer.innerHTML = `<img src="${url}" alt="QR code">`;
        })
        .catch(err => console.error(err));

    // --- Посещения и прогресс к бесплатному блюду ---
    document.getElementById('account-visits').textContent = user.totalVisits;
    const visitsLeft = 5 - user.freeDishProgress; // пример, если нужно 5 посещений
    document.getElementById('account-visits-left').textContent = `${visitsLeft}`;

    const progressImages = document.querySelectorAll('.progress-images img');
    progressImages.forEach((img, index) => {
        if (currentLang === "en") {
            img.src = index < user.freeDishProgress
                ? '../images/progress-full-plate.svg'
                : '../images/progress-empty-plate.svg';
        } else {
            img.src = index < user.freeDishProgress
                ? '../../images/progress-full-plate.svg'
                : '../../images/progress-empty-plate.svg';
        }
    });

    let freeDishAchived = document.querySelector('.free-dish-achived')
    if (visitsLeft === 0) {
        freeDishAchived.classList.remove('hidden')
    } else {
        freeDishAchived.classList.add('hidden')
    }

    // --- Друзья ---
    document.querySelectorAll('#account-friends').forEach(el => el.textContent = user.friendsInvited);
    document.querySelectorAll('#account-friends-visited').forEach(el => el.textContent = user.friendsVisited);

    // --- Достижения ---
    const achievements = [
        { id: '5-invited', completed: user.friendsInvited >= 5 },
        { id: '10-invited', completed: user.friendsInvited >= 10 },
        { id: '5-visited', completed: user.friendsVisited >= 5 },
        { id: '10-visited', completed: user.friendsVisited >= 10 },
    ];

    achievements.forEach(ach => {
        const container = document.getElementById(ach.id);
        if (container) {
            const img = container.querySelector('.task-img');
            if (currentLang === "en") {
                img.src = ach.completed
                    ? '../images/completed-task.svg'
                    : '../images/uncompleted-task.svg';
            } else {
                img.src = ach.completed
                    ? '../../images/completed-task.svg'
                    : '../../images/uncompleted-task.svg';
            }
        }
    });
}

// Инициализация
fetchAccountData();






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





// открытие инфо про free dish

const freeDishButton = document.querySelector('.free-dish');
const overlay = document.querySelector('.overlay');
const closeOverlay = document.querySelector('.close-overlay');



freeDishButton.addEventListener('click', () => {
    overlay.classList.remove('hidden')
    document.body.style.overflow = 'hidden';
})

closeOverlay.addEventListener('click', () => {
    overlay.classList.add('hidden')
    document.body.style.overflow = '';
})


