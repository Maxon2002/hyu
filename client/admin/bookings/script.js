let adminToken = localStorage.getItem("adminToken");

document.addEventListener("DOMContentLoaded", async () => {

    if (!adminToken) {
        window.location.href = "/admin/sign-in/";
        return;
    }

    // Проверка токена на сервере
    try {
        const res = await fetch("/api/admin/verify-token", {
            headers: { "Authorization": `Bearer ${adminToken}` }
        });

        if (!res.ok) {
            // Токен недействителен
            localStorage.removeItem("adminToken");
            window.location.href = "/admin/sign-in/";
            return;
        }

    } catch (err) {
        console.error("Token verification error:", err);
        localStorage.removeItem("adminToken");
        window.location.href = "/admin/sign-in/";
    }



    const bookingsTableWrapper = document.querySelector(".bookings-table-wrapper");

    async function loadBookings(date = null) {
        try {
            // const res = await fetch(`/api/admin/bookings?date=${date}`);
            const res = await fetch(`/api/admin/bookings?date=${date}`, {
                headers: { "Authorization": `Bearer ${adminToken}` }
            });
            const data = await res.json();

            if (!data.success) {
                console.error("Ошибка при загрузке бронирований:", data.message);
                return data.success;
            }

            renderBookingsTable(data.bookings);

            return data.success;
        } catch (err) {
            console.error("Ошибка при запросе бронирований:", err);
        }
    }



    function renderBookingsTable(bookings) {
        bookingsTableWrapper.innerHTML = "";

        // Группируем по дате
        const grouped = {};
        bookings.forEach((b) => {
            const date = b.date.split("T")[0]; // "2025-10-09"
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(b);
        });

        Object.keys(grouped)
            .sort() // сортировка по дате
            .forEach((date) => {
                const dayBookings = grouped[date];

                const totalBookings = dayBookings.length;
                const totalGuests = dayBookings.reduce((sum, b) => sum + b.guests, 0);

                // контейнер дня
                const container = document.createElement("div");
                container.className = "bookings-table-container";

                // верхний блок с датой
                const dateDiv = document.createElement("div");
                dateDiv.className = "bookings-table-date";
                dateDiv.innerHTML = `
                <div class="bookings-table-date-date">${date}</div>
                <div class="bookings-table-date-total">${totalBookings} (${totalGuests})</div>
            `;
                container.appendChild(dateDiv);

                // блоки бронирований этого дня
                dayBookings
                    .sort((a, b) => a.time.localeCompare(b.time)) // сортировка по времени
                    .forEach((b) => {
                        const infoDiv = document.createElement("div");
                        infoDiv.className = "bookings-table-info";

                        const hasAccount = !!b.user;

                        infoDiv.innerHTML = `
                        <div class="bookings-table-info-top">
                            <div class="bookings-table-time">${b.time}</div>
                            <div class="bookings-table-pax">${b.guests}</div>
                        </div>
                        <div class="bookings-table-info-bottom">
                            <div class="bookings-table-name">${b.name}</div>
                            ${hasAccount
                                ? `<img src="../../images/account-icon.svg" alt="" class="bookings-table-img">`
                                : ""
                            }
                        </div>
                    `;

                        container.appendChild(infoDiv);
                    });

                bookingsTableWrapper.appendChild(container);
            });
    }

    // Загружаем при открытии страницы
    loadBookings();



    const panel = document.querySelector('.filter-panel');
    const dropdown = document.querySelector('.filter-dropdown');

    panel.addEventListener('click', () => {
        panel.classList.toggle('active');
        dropdown.classList.toggle('active');
    });



    const dateInput = document.querySelector('#date');
    const applyBtn = document.querySelector('.apply-filters');
    const resetBtn = document.querySelector('.reset-filters');
    const filterValue = document.querySelector('.filter-value');

    dateInput.addEventListener('change', () => {
        if (dateInput.value) {
            applyBtn.classList.remove('hidden');
        }
    });


    applyBtn.addEventListener('click', async () => {
        const selectedDate = dateInput.value;
        if (!selectedDate) return;

        let succesLoading = await loadBookings(selectedDate);


        if (succesLoading) {
            // renderBookings(data.bookings); 
            filterValue.textContent = selectedDate.slice(0, 10);
            applyBtn.classList.add('hidden');
            resetBtn.classList.remove('hidden');
        }
    });

    resetBtn.addEventListener('click', async () => {

        let succesLoading = await loadBookings();

        if (succesLoading) {
            filterValue.textContent = "Upcoming bookings";
            applyBtn.classList.add('hidden');
            resetBtn.classList.remove('hidden');
        }
    });


});