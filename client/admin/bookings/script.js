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

        if (bookings.length > 0) {
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

                            infoDiv.id = b.id

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
        } else {
            const div = document.createElement("div")
            div.innerHTML = "Bookings not found"
            bookingsTableWrapper.appendChild(div);
        }
    }

    // Загружаем при открытии страницы
    loadBookings();



    const panel = document.querySelector('.filter-panel');
    const dropdown = document.querySelector('.filter-dropdown');

    panel.addEventListener('click', () => {
        dropdown.classList.toggle('active');
    });



    const dateInput = document.querySelector('#date');
    const applyBtn = document.querySelector('.apply-filters');
    const resetBtn = document.querySelector('.reset-filters');
    const filterValue = document.querySelector('.filter-value');

    // Быстрые кнопки
    const yesterdayBtn = document.getElementById("yesterday");
    const todayBtn = document.getElementById("today");
    const tomorrowBtn = document.getElementById("tommorow");

    dateInput.addEventListener('change', () => {
        if (dateInput.value) {
            applyBtn.classList.remove('hidden');
        } else {
            applyBtn.classList.add("hidden");
        }
    });

    function formatDate(date) {
        return date.toISOString().split("T")[0];
    }

    // === Быстрые фильтры ===
    yesterdayBtn.addEventListener("click", async () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const dateStr = formatDate(d);
        dateInput.value = dateStr;
        applyBtn.classList.remove('hidden');
    });

    todayBtn.addEventListener("click", async () => {
        const d = new Date();
        const dateStr = formatDate(d);
        dateInput.value = dateStr;
        applyBtn.classList.remove('hidden');
    });

    tomorrowBtn.addEventListener("click", async () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const dateStr = formatDate(d);
        dateInput.value = dateStr;
        applyBtn.classList.remove('hidden');
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

            dropdown.classList.remove('active')
        }
    });

    resetBtn.addEventListener('click', async () => {

        let succesLoading = await loadBookings();

        if (succesLoading) {
            dateInput.value = ""
            filterValue.textContent = "Upcoming bookings";
            resetBtn.classList.add('hidden');
            applyBtn.classList.add('hidden');
        }
    });

    let bookingInfo = document.querySelector(".booking-info-wrapper")
    let bookingInfoClose = document.querySelector(".booking-info-close")
    let bookingName = bookingInfo.querySelector("#booking-name")
    let bookingDate = bookingInfo.querySelector("#booking-date")
    let bookingTime = bookingInfo.querySelector("#booking-time")
    let bookingGuests = bookingInfo.querySelector("#booking-guests")
    let bookingEmail = bookingInfo.querySelector("#booking-email")
    let bookingPhone = bookingInfo.querySelector("#booking-phone")
    let bookingMessage = bookingInfo.querySelector("#booking-message")
    let bookingComment = bookingInfo.querySelector("#booking-comment")

    let accountInfo = document.querySelectorAll(".account-info")

    let currentEmail


    document.querySelector(".bookings-table-wrapper").addEventListener("click", async (e) => {

        if (e.target.closest(".bookings-table-info")) {

            let booking = e.target.closest(".bookings-table-info")

            const res = await fetch(`/api/admin/get-booking?id=${booking.id}`, {
                headers: { "Authorization": `Bearer ${adminToken}` }
            });
            const data = await res.json();

            if (!data.success) {
                console.error("Ошибка при загрузке бронирований:", data.message);
                return data.success;
            }

            let bookingInformation = data.booking

            bookingName.innerHTML = bookingInformation.name
            bookingDate.innerHTML = bookingInformation.date.slice(0, 10)
            bookingTime.innerHTML = bookingInformation.time
            bookingGuests.innerHTML = bookingInformation.guests
            bookingEmail.innerHTML = bookingInformation.email
            bookingPhone.innerHTML = bookingInformation.phone ? bookingInformation.phone : "Not provided"
            bookingMessage.innerHTML = bookingInformation.message ? bookingInformation.message : "None"

            if (bookingInformation.user) {
                accountInfo.forEach(acInfo => {
                    acInfo.classList.remove('hidden')
                })

                currentEmail = bookingInformation.user.email

                bookingComment.innerHTML = bookingInformation.user.comment ? bookingInformation.user.comment : "No comments"
            } else {
                accountInfo.forEach(acInfo => {
                    acInfo.classList.add('hidden')
                })
            }

            document.querySelectorAll('.bookings-table-info').forEach(booking => {
                booking.classList.remove('active')
                let imgAccount = booking.querySelector('img')
                if (imgAccount) {
                    imgAccount.src = "../../images/account-icon.svg";
                }
            })

            booking.classList.add('active')
            let imgAccount = booking.querySelector('img')
            if (imgAccount) {
                imgAccount.src = "../../images/account-icon-light.svg";
            }

            bookingInfo.classList.add('active')
        }

    });

    bookingInfoClose.addEventListener('click', () => {
        bookingInfo.closest('.booking-info-wrapper').classList.remove('active')



        document.querySelectorAll('.bookings-table-info').forEach(booking => {
            booking.classList.remove('active')
            let imgAccount = booking.querySelector('img')
            if (imgAccount) {
                imgAccount.src = "../../images/account-icon.svg";
            }
        })
    })



    const modalClient = document.getElementById("client-modal");
    const modalClientClose = modalClient.querySelector(".modal-close");
    const modalClientBody = modalClient.querySelector("tbody");

    document.querySelector('.view-account').addEventListener('click', () => {
        // запрос на сервер за полными данными клиента
        fetch(`/api/admin/search-result?email=${currentEmail}`)
            .then((res) => res.json())
            .then((client) => {

                const lastVisit = client.visits[0]?.visitDate || null;
                // рендерим строку в модальное окно
                modalClientBody.innerHTML = `
            <tr>
              <td><span class="clickable table-email">${currentEmail}</span></td>
              <td>${client.referralCode}</td>
              <td>${client.createdAt.slice(0, 10)}</td>
              <td><span class="clickable table-visits">${client.totalVisits}</span></td>
              <td>${lastVisit ? lastVisit.slice(0, 10) : "-"}</td>
              <td><span class="clickable table-discount">${client.discount}%</span></td>
              <td><span class="clickable table-friends">${client.friendsInvited}</span></td>
            </tr>
          `;
                modalClient.style.display = "block";
                document.body.style.overflow = 'hidden'
            })
            .catch((err) => {
                console.error("Error loading client:", err);
            });
    })

    // закрытие модалки
    modalClientClose.addEventListener("click", () => {
        modalClient.style.display = "none";
        modalClientBody.innerHTML = "";
        document.body.style.overflow = ''
    });


    window.addEventListener("click", e => {

        if (e.target === modalClient) {
            modalClient.style.display = "none";
            modalClientBody.innerHTML = "";
            document.body.style.overflow = ''
        }
        if(!e.target.closest(".filter-dropdown") && dropdown.classList.contains('active') && !e.target.closest(".filter-panel")) {
            dropdown.classList.remove('active')
        }
    });

});