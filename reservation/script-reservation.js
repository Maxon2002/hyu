window.addEventListener('resize', () => {
    changeFormWidth()
})





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







const dateInput = document.getElementById("date");
const timeSelect = document.getElementById("time");
const timeOptions = timeSelect.querySelectorAll("option");

let currentLang = document.querySelector('.site-nav .active').id;


function getLocale(lang) {
    switch (lang) {
        case 'ru':
            return flatpickr.l10ns.ru;
        case 'en':
            return flatpickr.l10ns.default;
        case 'ko':
            return flatpickr.l10ns.ko;
        case 'ar':
            return flatpickr.l10ns.ar;
        default:
            return flatpickr.l10ns.default;
    }
}

document.addEventListener("DOMContentLoaded", function () {

    let selectedDate

    // Установим flatpickr
    let calendar = flatpickr(dateInput, {
        dateFormat: "Y-m-d",
        disableMobile: true, // заставляет всегда использовать календарь
        // defaultDate: "today",
        minDate: "today",
        locale: {
            ...getLocale(currentLang),
            firstDayOfWeek: 1
        },
        onChange: function () {
            selectedDate = calendar.selectedDates[0]
            if (selectedDate) {
                timeSelect.disabled = false;
                updateTimeOptions();
            }
        }
    });

    function updateTimeOptions() {

        const now = new Date();
        const selectedDate = calendar.selectedDates[0];
        const isToday = selectedDate && selectedDate.toDateString() === now.toDateString();

        timeOptions.forEach(option => {
            const timeStr = option.value;

            // Пропускаем пустую первую опцию
            if (!timeStr) return;

            const timeValue = new Date(selectedDate || now);
            const [hour, min] = timeStr.split(":");
            timeValue.setHours(parseInt(hour), parseInt(min), 0, 0);


            if (isToday && timeValue <= now) {

                if (option.value === timeSelect.value) {
                    timeSelect.selectedIndex = 0
                }

                option.disabled = true;
            } else {
                option.disabled = false;
            }

        });
    }

});



const bookingForm = document.querySelector('.reservation-form')
let bookingFormWidth = document.querySelector('.reservation-form-wrapper').offsetWidth
const formParts = bookingForm.querySelectorAll('.part-form')
const firstFormPart = formParts[0]
const requiredFields = firstFormPart.querySelectorAll("input[required], select[required], textarea[required]");

const nextFormBtn = document.querySelector('.next-form')
const prevFormBtn = document.querySelector('.prev-form')

let formIndex = 0

function updateFormPosition() {
    const offset = -formIndex * bookingFormWidth;

    formParts.forEach((block, index) => {
        block.classList.remove('active')
        if (index === formIndex) {
            block.classList.add('active')
        }
    })

    if (currentLang !== "ar") {
        bookingForm.style.transform = `translateX(${offset}px)`;
    } else {
        bookingForm.style.transform = `translateX(${-offset}px)`;
    }
}




function checkFormValidity() {
    let isValid = true;
    requiredFields.forEach(field => {
        if (!field.value.trim() || (field.id === "guests" && parseInt(field.value, 10) < 1)) {
            isValid = false;
        }
    });

    // Переключаем состояние кнопки
    if (isValid) {
        nextFormBtn.classList.add("active");
    } else {
        nextFormBtn.classList.remove("active");
    }
}


requiredFields.forEach(field => {
    field.addEventListener("input", () => {
        if (field.id !== "guests") {
            field.classList.remove("field-error");
        }
        checkFormValidity();
    });

    field.addEventListener("change", () => {
        if (field.id !== "guests") {
            field.classList.remove("field-error");
        } else {
            if (!field.value.trim()) {
                field.classList.remove("field-error")
            }
        }
        checkFormValidity();
    });
});


const guestsInput = document.getElementById("guests");

guestsInput.addEventListener("input", () => {
    const value = parseInt(guestsInput.value, 10);
    console.log(value)

    if (value < 1 || isNaN(value)) {
        guestsInput.classList.add("field-error");
        nextFormBtn.classList.remove("active");
    } else {
        guestsInput.classList.remove("field-error");
        checkFormValidity(); // обновит состояние кнопки
    }
});



nextFormBtn.addEventListener('click', () => {


    if (!nextFormBtn.classList.contains("active")) {
        // Подсветить незаполненные
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add("field-error");
            }
        });
        return;
    }


    formIndex++

    updateFormPosition();



});

prevFormBtn.addEventListener('click', () => {
    formIndex--

    updateFormPosition();
});




const submitBtn = document.querySelector(".submit-btn");
const secondFormPart = formParts[1]; // вторая часть
const secondRequired = secondFormPart.querySelectorAll("input, textarea");


const confirmPopup = document.querySelector(".confirm-form-container");

const confirmName = confirmPopup.querySelector(".confirm-name");
// const confirmType = confirmPopup.querySelector(".confirm-type");
const confirmDate = confirmPopup.querySelector(".confirm-date");
const confirmTime = confirmPopup.querySelector(".confirm-time");
const guestName = document.getElementById("name");

submitBtn.addEventListener("click", () => {
    let isValid = true;

    secondRequired.forEach(field => {
        if (!field.value.trim() && field.hasAttribute("required")) {
            field.classList.add("field-error");
            isValid = false;
        }
    });

    if (isValid) {
        // console.log('отправлено');
        // отправка формы на сервер

        // (async () => {
        //     const formData = {
        //         menu: menuSelect.value,
        //         date: dateInput.value,
        //         time: timeSelect.value,
        //         guests: guestsInput.value,
        //         name: guestName.value,
        //         phone: document.querySelector('#phone').value,
        //         email: document.querySelector('#email').value,
        //         message: document.querySelector('#message').value,
        //     };

        //     try {
        //         const res = await fetch('https://restaurant-backend-cpjp.onrender.com/api/reservation', {
        //             method: 'POST',
        //             headers: { 'Content-Type': 'application/json' },
        //             body: JSON.stringify(formData)
        //         });

        //         if (res.ok) {
        //             console.log('Reservation sent successfully!');
        //         } else {
        //             console.log('Something went wrong. Please try again.');
        //         }
        //     } catch (err) {
        //         console.error(err);
        //         console.log('Error sending reservation.');
        //     }
        // })();


        ////////////////////////////////////////////////////////






        confirmName.textContent = guestName.value
        // confirmType.textContent = menuSelect.value
        confirmDate.textContent = dateInput.value
        confirmTime.textContent = timeSelect.value

        confirmPopup.classList.add('active')

    }
});



secondRequired.forEach(field => {
    field.addEventListener("input", () => {
        field.classList.remove("field-error");
    });

    field.addEventListener("change", () => {
        field.classList.remove("field-error");
    });
});



const closeConfirmForm = document.querySelector(".close-confirm-form");

closeConfirmForm.addEventListener('click', () => {
    requiredFields.forEach(field => {
        field.value = ""
    });
    secondRequired.forEach(field => {
        field.value = ""
    });
    confirmPopup.classList.remove('active')

    formParts[1].classList.remove("active")
    formParts[0].classList.add("active")
    formIndex = 0

    bookingForm.style.transform = `translateX(0px)`;
})



function changeFormWidth() {
    bookingFormWidth = document.querySelector('.reservation-form-wrapper').offsetWidth
    updateFormPosition()
}