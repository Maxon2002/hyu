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