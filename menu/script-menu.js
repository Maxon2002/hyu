document.addEventListener("DOMContentLoaded", () => {



    if (window.scrollY > 0) {

        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 10);
    }


    let isAutoScrolling = false;
    //

    let waitingForFirstUserScroll = false;
    let lastScrollY = window.scrollY;


    let lastScrollTop = window.scrollY;

    let lastActiveСategoryId = null;


    const categoryButtons = document.querySelectorAll(".category-btn");

    const categorySections = document.querySelectorAll('.category-section');

    // Функция для скролла с учётом высоты навигации
    let buttonWasPush = false
    const scrollWithOffset = (id) => {
        const el = document.getElementById(id);
        if (!el) return;

        buttonWasPush = true

        isAutoScrolling = true; //
        readyToObserve = false;


        const wasAtPageBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 2;


        // const subcategoryHeight = document.querySelector(".nav-subcategories.active")?.offsetHeight || 0

        const offset = el.getBoundingClientRect().top + window.scrollY - document.querySelector(".navigation-container").offsetHeight;
        window.scrollTo({ top: offset, behavior: "smooth" });
        // Отслеживаем достижение нужной позиции
        const checkIfReached = () => {
            const currentOffset = el.getBoundingClientRect().top - document.querySelector(".navigation-container").offsetHeight;

            //////
            const scrolledToBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 2;//
            const reachedTarget = Math.abs(currentOffset) < 2 || (!wasAtPageBottom && scrolledToBottom);
            ////////

            //   console.log(reachedTarget)


            if (reachedTarget) {
                isAutoScrolling = false;
                //////
                waitingForFirstUserScroll = true;
                lastScrollY = window.scrollY;
                buttonWasPush = false
                //////
            } else {
                if (buttonWasPush) {
                    requestAnimationFrame(checkIfReached);
                }
            }
        };

        requestAnimationFrame(checkIfReached);
    };


    // Активация нужной кнопки
    const activateButton = (buttons, id) => {
        buttons.forEach(btn => {
            btn.classList.toggle("active", btn.dataset.target === id);
        });
    };


    categoryButtons.forEach(btn => {
        btn.addEventListener("click", () => {


            categoryButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const categoryId = btn.dataset.target;

            // Прокрутка к самой категории
            scrollWithOffset(categoryId);


        });
    });



    // авто подсветка

    let ticking = false;

    const highlightClosestSubcategory = () => {
        if (isAutoScrolling) return;

        if (waitingForFirstUserScroll) return;


        const centerY = window.innerHeight / 2;
        let visibleSection = null;

        categorySections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= centerY && rect.bottom >= centerY) {
                visibleSection = section;
            }
        });

        const isNearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 5;
        if (isNearBottom) {
            visibleSection = categorySections[categorySections.length - 1];
        }

        if (visibleSection && visibleSection.id !== lastActiveСategoryId) {
            lastActiveСategoryId = visibleSection.id;

            const categoryId = visibleSection.id;
            activateButton(categoryButtons, categoryId);
        }


    };



    window.addEventListener("scroll", () => {

        const currentScroll = window.scrollY;
        scrollDirection = currentScroll > lastScrollTop ? "down" : "up";
        lastScrollTop = currentScroll;

        if (waitingForFirstUserScroll && !isAutoScrolling) {
            const delta = Math.abs(window.scrollY - lastScrollY);
            if (delta > 10) {
                waitingForFirstUserScroll = false;
                // reobserveSubcategories(); // можно удалить позже
            }
        }

        if (!ticking) {
            window.requestAnimationFrame(() => {
                highlightClosestSubcategory();
                ticking = false;
            });
            ticking = true;
        }
    });

});