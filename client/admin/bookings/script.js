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
    let currentModalEmail


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

    const prevModal = document.querySelectorAll('.modal-prev')

    let modalObj = {}
    let countModalObj = 0

    const modalClient = document.getElementById("client-modal");
    const modalClientClose = modalClient.querySelector(".modal-close");
    const modalClientBody = modalClient.querySelector("tbody");

    async function loadClientOne(email) {

        fetch(`/api/admin/search-result?email=${email}`)
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
    }

    document.querySelector('.view-account').addEventListener('click', () => {
        loadClientOne(currentEmail)
    })

    // закрытие модалки
    modalClientClose.addEventListener("click", () => {
        modalClient.style.display = "none";
        modalClientBody.innerHTML = "";
        document.body.style.overflow = ''
        prevModal.forEach(prev => {
            prev.classList.add('hidden')
        })
        modalObj = {}
        countModalObj = 0
    });



    const modalEmail = document.getElementById("email-modal");
    const modalEmailEmail = modalEmail.querySelector(".modal-email");
    const modalEmailBody = modalEmail.querySelector("tbody");
    const modalEmailClose = modalEmail.querySelector(".modal-close");
    const modalEmailPrev = modalEmail.querySelector(".modal-prev");


    // функция загрузки и рендера данных
    async function loadClientComment(email) {
        modalEmailEmail.textContent = `Client: ${email}`;
        modalEmail.style.display = "block";
        document.body.style.overflow = 'hidden'
        modalEmailPrev.classList.remove('hidden')

        try {
            const res = await fetch("/api/admin/client-comment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            if (!res.ok) throw new Error("error");
            const data = await res.json();



            if (data.comment && data.comment.length > 0) {

                const tr = document.createElement("tr");
                const td = document.createElement("td");
                td.classList.add('comment')
                td.textContent = data.comment;
                tr.appendChild(td);
                modalEmailBody.appendChild(tr);

            } else {
                const tr = document.createElement("tr");
                const td = document.createElement("td");
                td.classList.add('comment')
                td.textContent = "No comments";
                tr.appendChild(td);
                modalEmailBody.appendChild(tr);
            }

        } catch (err) {
            console.error(err);
            modalEmailBody.innerHTML = "<tr><td>Error loading comments</td></tr>";
        }
    }



    // закрытие модалки
    modalEmailClose.addEventListener("click", () => {
        modalEmail.style.display = "none";
        // очищаем прошлые данные
        modalEmailBody.innerHTML = "";

        editCommentForm.classList.add("hidden");

        document.body.style.overflow = ''

        prevModal.forEach(prev => {
            prev.classList.add('hidden')
        })

        modalObj = {}
        countModalObj = 0
    });

    // предыдущая модалка 
    modalEmailPrev.addEventListener("click", () => {
        const keys = Object.keys(modalObj);
        const lastKey = keys[keys.length - 1];
        const lastModal = modalObj[lastKey];

        if (lastModal.modal === "modalClient") {
            loadClientOne(lastModal.email)
        }

        if (lastModal.modal === "modalFriends") {
            loadClientFriends(lastModal.email)
        }

        modalEmail.style.display = "none";
        modalEmailBody.innerHTML = "";

        editCommentForm.classList.add("hidden");
        modalEmailPrev.classList.add("hidden");

        delete modalObj[lastKey];
        countModalObj--
    });




    const editCommentBtn = document.getElementById("edit-comment-btn");
    const editCommentForm = document.getElementById("edit-comment-form");
    const commentInput = document.getElementById("comment-input");
    const saveCommentBtn = document.getElementById("save-comment-btn");
    const cancelCommentBtn = document.getElementById("cancel-comment-btn");

    editCommentBtn.addEventListener("click", () => {
        // показать форму и подставить текст
        commentInput.value = document.querySelector('.comment').textContent !== "No comments" ? document.querySelector('.comment').textContent : "";
        editCommentForm.classList.remove("hidden");
    });

    cancelCommentBtn.addEventListener("click", () => {
        // скрыть форму без изменений
        editCommentForm.classList.add("hidden");
    });

    saveCommentBtn.addEventListener("click", async () => {
        const newComment = commentInput.value.trim();

        try {
            const res = await fetch("/api/admin/update-comment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${adminToken}` // если у тебя как в других запросах
                },
                body: JSON.stringify({
                    email: currentEmail,
                    comment: newComment
                })
            });

            const data = await res.json();

            if (data.success) {
                document.querySelector('.comment').textContent = newComment || "No comments";
                editCommentForm.classList.add("hidden");
            } else {
                alert(data.message || "Failed to update comment");
            }
        } catch (err) {
            console.error("Update comment error:", err);
            alert("Server error. Please try again later.");
        }
    });





    const modalVisits = document.getElementById("visits-modal");
    const modalVisitsEmail = modalVisits.querySelector(".modal-email");
    const modalVisitsBody = modalVisits.querySelector("tbody");
    const modalVisitsClose = modalVisits.querySelector(".modal-close");
    const modalVisitsPrev = modalVisits.querySelector(".modal-prev");

    // функция загрузки и рендера данных
    async function loadClientVisits(email) {
        modalVisitsEmail.textContent = `Client: ${email}`;
        modalVisits.style.display = "block";
        document.body.style.overflow = 'hidden'
        modalVisitsPrev.classList.remove('hidden')

        try {
            const res = await fetch("/api/admin/client-visits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            if (!res.ok) throw new Error("error");
            const data = await res.json();



            if (data.visits && data.visits.length > 0) {
                data.visits.forEach(date => {
                    const tr = document.createElement("tr");
                    const td = document.createElement("td");
                    td.textContent = date;
                    tr.appendChild(td);
                    modalVisitsBody.appendChild(tr);
                });
            } else {
                const tr = document.createElement("tr");
                const td = document.createElement("td");
                td.textContent = "No visits";
                tr.appendChild(td);
                modalVisitsBody.appendChild(tr);
            }

        } catch (err) {
            console.error(err);
            modalTableBody.innerHTML = "<tr><td>Error loading visits</td></tr>";
        }
    }



    // закрытие модалки
    modalVisitsClose.addEventListener("click", () => {
        modalVisits.style.display = "none";
        // очищаем прошлые данные
        modalVisitsBody.innerHTML = "";
        document.body.style.overflow = ''

        prevModal.forEach(prev => {
            prev.classList.add('hidden')
        })

        modalObj = {}
        countModalObj = 0
    });


    // предыдущая модалка 
    modalVisitsPrev.addEventListener("click", () => {
        const keys = Object.keys(modalObj);
        const lastKey = keys[keys.length - 1];
        const lastModal = modalObj[lastKey];

        if (lastModal.modal === "modalClient") {
            loadClientOne(lastModal.email)
        }

        if (lastModal.modal === "modalFriends") {
            loadClientFriends(lastModal.email)
        }

        modalVisits.style.display = "none";
        // очищаем прошлые данные
        modalVisitsBody.innerHTML = "";
        modalVisitsPrev.classList.add("hidden");

        delete modalObj[lastKey];
        countModalObj--
    });







    const modalDiscount = document.getElementById("discount-modal");
    const modalDiscountEmail = modalDiscount.querySelector(".modal-email");
    const modalDiscountBody = modalDiscount.querySelector("tbody");
    const modalDiscountClose = modalDiscount.querySelector(".modal-close");
    const modalDiscountPrev = modalDiscount.querySelector(".modal-prev");

    // функция загрузки и рендера данных
    async function loadClientDiscount(email) {
        modalDiscountEmail.textContent = `Client: ${email}`;
        modalDiscount.style.display = "block";
        document.body.style.overflow = 'hidden'
        modalDiscountPrev.classList.remove('hidden')

        try {
            const res = await fetch("/api/admin/client-discount", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            if (!res.ok) throw new Error("error");
            const data = await res.json();


            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.classList.add('discount')
            td.textContent = data.discount;
            tr.appendChild(td);
            modalDiscountBody.appendChild(tr);


        } catch (err) {
            console.error(err);
            modalDiscountBody.innerHTML = "<tr><td>Error loading discount</td></tr>";
        }
    }



    // закрытие модалки
    modalDiscountClose.addEventListener("click", () => {
        modalDiscount.style.display = "none";
        // очищаем прошлые данные
        modalDiscountBody.innerHTML = "";

        editDiscountForm.classList.add("hidden");
        document.body.style.overflow = ''

        prevModal.forEach(prev => {
            prev.classList.add('hidden')
        })

        modalObj = {}
        countModalObj = 0
    });


    // предыдущая модалка 
    modalDiscountPrev.addEventListener("click", () => {
        const keys = Object.keys(modalObj);
        const lastKey = keys[keys.length - 1];
        const lastModal = modalObj[lastKey];

        

        if (lastModal.modal === "modalClient") {
            loadClientOne(lastModal.email)
        }

        if (lastModal.modal === "modalFriends") {
            loadClientFriends(lastModal.email)
        }

        modalDiscount.style.display = "none";
        // очищаем прошлые данные
        modalDiscountBody.innerHTML = "";

        editDiscountForm.classList.add("hidden");
        modalDiscountPrev.classList.add("hidden");

        delete modalObj[lastKey];
        countModalObj--
    });



    const editDiscountBtn = document.getElementById("edit-discount-btn");
    const editDiscountForm = document.getElementById("edit-discount-form");
    const discountInput = document.getElementById("discount-input");
    const saveDiscountBtn = document.getElementById("save-discount-btn");
    const cancelDiscountBtn = document.getElementById("cancel-discount-btn");

    editDiscountBtn.addEventListener("click", () => {
        // показать форму и подставить текст
        discountInput.value = "";
        editDiscountForm.classList.remove("hidden");
    });

    cancelDiscountBtn.addEventListener("click", () => {
        // скрыть форму без изменений
        editDiscountForm.classList.add("hidden");
    });

    saveDiscountBtn.addEventListener("click", async () => {
        const newDiscount = discountInput.value.trim();


        try {
            const res = await fetch("/api/admin/update-discount", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    email: currentEmail,
                    discount: newDiscount
                })
            });

            const data = await res.json();

            if (data.success) {
                document.querySelector('.discount').textContent = newDiscount;
                editDiscountForm.classList.add("hidden");
            } else {
                alert(data.message || "Failed to update discount");
            }
        } catch (err) {
            console.error("Update discount error:", err);
            alert("Server error. Please try again later.");
        }
    });






    const friendsModal = document.getElementById("friends-modal");
    const friendsEmail = friendsModal.querySelector(".modal-email");
    const friendsTableBody = friendsModal.querySelector("tbody");
    const friendsClose = friendsModal.querySelector(".modal-close");
    const modalfriendsPrev = friendsModal.querySelector(".modal-prev");

    async function loadClientFriends(email) {
        friendsEmail.textContent = `Client: ${email}`;
        friendsModal.style.display = "block";
        document.body.style.overflow = 'hidden'
        modalfriendsPrev.classList.remove('hidden')

        try {
            const res = await fetch("/api/admin/client-friends", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            if (!res.ok) throw new Error("Ошибка запроса");
            const data = await res.json();



            if (data.friends && data.friends.length > 0) {
                data.friends.forEach(friend => {
                    const tr = document.createElement("tr");

                    const lastVisit = friend.visits[0]?.visitDate || null;

                    tr.innerHTML = `
          <td><span class="clickable table-email">${friend.email}</span></td>
          <td>${friend.referralCode}</td>
          <td>${friend.createdAt.slice(0, 10)}</td>
          <td><span class="clickable table-visits">${friend.totalVisits}</span></td>
          <td>${lastVisit ? lastVisit.slice(0, 10) : "-"}</td>
          <td><span class="clickable table-discount">${friend.discount}%</span></td>
          <td><span class="clickable table-friends">${friend.friendsInvited}</span></td>
        `;

                    friendsTableBody.appendChild(tr);
                });
            } else {
                friendsTableBody.innerHTML = `<tr><td colspan="7">No invited friends</td></tr>`;
            }

        } catch (err) {
            console.error(err);
            friendsTableBody.innerHTML = "<tr><td colspan='7'>Error loading friends</td></tr>";
        }
    }


    // закрытие
    friendsClose.addEventListener("click", () => {
        friendsModal.style.display = "none";
        friendsTableBody.innerHTML = "";
        document.body.style.overflow = ''

        prevModal.forEach(prev => {
            prev.classList.add('hidden')
        })

        modalObj = {}
        countModalObj = 0
    });


    // предыдущая модалка 
    modalfriendsPrev.addEventListener("click", () => {
        const keys = Object.keys(modalObj);
        const lastKey = keys[keys.length - 1];
        const lastModal = modalObj[lastKey];
        console.log(modalObj)

        if (lastModal.modal === "modalClient") {
            loadClientOne(lastModal.email)
        }

        if (lastModal.modal === "modalFriends") {
            loadClientFriends(lastModal.email)
        }

        friendsModal.style.display = "none";
        friendsTableBody.innerHTML = "";
        modalfriendsPrev.classList.add("hidden");

        delete modalObj[lastKey];
        countModalObj--
    });




    modalClientBody.addEventListener("click", (e) => {
        if (e.target.classList.contains("table-visits")) {
            modalClient.style.display = "none";
            modalClientBody.innerHTML = "";

            const row = e.target.closest("tr");
            const email = row.querySelector("td").textContent.trim();


            countModalObj++
            modalObj[countModalObj] = {
                modal: "modalClient",
                email
            }

            loadClientVisits(email);
        }
        if (e.target.classList.contains("table-friends")) {
            modalClient.style.display = "none";
            modalClientBody.innerHTML = "";

            console.log(modalObj)
            const row = e.target.closest("tr");
            const email = row.querySelector("td").textContent.trim();
            currentModalEmail = email

            countModalObj++
            modalObj[countModalObj] = {
                modal: "modalClient",
                email
            }


            loadClientFriends(email);
        }

        if (e.target.classList.contains("table-email")) {
            modalClient.style.display = "none";
            modalClientBody.innerHTML = "";

            const row = e.target.closest("tr");
            const email = row.querySelector("td").textContent.trim();


            countModalObj++
            modalObj[countModalObj] = {
                modal: "modalClient",
                email
            }

            loadClientComment(email);
        }

        if (e.target.classList.contains("table-discount")) {
            modalClient.style.display = "none";
            modalClientBody.innerHTML = "";

            const row = e.target.closest("tr");
            const email = row.querySelector("td").textContent.trim();


            countModalObj++
            modalObj[countModalObj] = {
                modal: "modalClient",
                email
            }

            loadClientDiscount(email);
        }
    });


    friendsTableBody.addEventListener("click", (e) => {
        if (e.target.classList.contains("table-visits")) {
            friendsModal.style.display = "none";
            friendsTableBody.innerHTML = "";


            const row = e.target.closest("tr");
            const email = row.querySelector("td").textContent.trim();

            // modalVisitsEmail.textContent = `Client: ${email}`;
            // modalVisits.style.display = "block";
            // document.body.style.overflow = 'hidden'
            // modalVisitsPrev.classList.remove('hidden')

            countModalObj++
            modalObj[countModalObj] = {
                modal: "modalFriends",
                email: currentModalEmail
            }

            loadClientVisits(email);
        }
        if (e.target.classList.contains("table-friends")) {
            friendsModal.style.display = "none";
            friendsTableBody.innerHTML = "";

            console.log(modalObj)
            const row = e.target.closest("tr");
            const email = row.querySelector("td").textContent.trim();

            // friendsEmail.textContent = `Client: ${email}`;
            // friendsModal.style.display = "block";
            // document.body.style.overflow = 'hidden'
            // modalfriendsPrev.classList.remove('hidden')

            countModalObj++
            modalObj[countModalObj] = {
                modal: "modalFriends",
                email: currentModalEmail
            }

            currentModalEmail = email

            loadClientFriends(email);
        }

        if (e.target.classList.contains("table-email")) {
            friendsModal.style.display = "none";
            friendsTableBody.innerHTML = "";

            const row = e.target.closest("tr");
            const email = row.querySelector("td").textContent.trim();

            // modalEmailEmail.textContent = `Client: ${email}`;
            // modalEmail.style.display = "block";
            // document.body.style.overflow = 'hidden'
            // modalEmailPrev.classList.remove('hidden')

            countModalObj++
            modalObj[countModalObj] = {
                modal: "modalFriends",
                email: currentModalEmail
            }


            loadClientComment(email);
        }

        if (e.target.classList.contains("table-discount")) {
            friendsModal.style.display = "none";
            friendsTableBody.innerHTML = "";

            const row = e.target.closest("tr");
            const email = row.querySelector("td").textContent.trim();

            // modalDiscountEmail.textContent = `Client: ${email}`;
            // modalDiscount.style.display = "block";
            // document.body.style.overflow = 'hidden'
            // modalDiscountPrev.classList.remove('hidden')

            countModalObj++
            modalObj[countModalObj] = {
                modal: "modalFriends",
                email: currentModalEmail
            }

            loadClientDiscount(email);
        }
    });



    window.addEventListener("click", e => {

        if (e.target === friendsModal) {
            friendsModal.style.display = "none";
            friendsTableBody.innerHTML = "";
            document.body.style.overflow = ''
            prevModal.forEach(prev => {
                prev.classList.add('hidden')
            })

            modalObj = {}
            countModalObj = 0
        }
        if (e.target === modalVisits) {
            modalVisits.style.display = "none";
            modalVisitsBody.innerHTML = "";
            document.body.style.overflow = ''
            prevModal.forEach(prev => {
                prev.classList.add('hidden')
            })

            modalObj = {}
            countModalObj = 0
        }
        if (e.target === modalClient) {
            modalClient.style.display = "none";
            modalClientBody.innerHTML = "";
            document.body.style.overflow = ''
            prevModal.forEach(prev => {
                prev.classList.add('hidden')
            })

            modalObj = {}
            countModalObj = 0
        }
        if (e.target === modalEmail) {
            modalEmail.style.display = "none";
            modalEmailBody.innerHTML = "";
            document.body.style.overflow = ''
            prevModal.forEach(prev => {
                prev.classList.add('hidden')
            })

            modalObj = {}
            countModalObj = 0
        }
        if (e.target === modalDiscount) {
            modalDiscount.style.display = "none";
            modalDiscountBody.innerHTML = "";
            document.body.style.overflow = ''
            prevModal.forEach(prev => {
                prev.classList.add('hidden')
            })

            modalObj = {}
            countModalObj = 0
        }
        if (!e.target.closest(".filter-dropdown") && dropdown.classList.contains('active') && !e.target.closest(".filter-panel")) {
            dropdown.classList.remove('active')
        }
    });


    let changeBookingInfoBtn = document.querySelectorAll('.change-booking-info-btn')

    changeBookingInfoBtn.forEach(changeBtn => {
        changeBtn.addEventListener('click', () => {
            let inputBlock = changeBtn.closest(".change-booking-info").querySelector(".change-input")
            if (changeBtn.classList.contains('active')) {

                inputBlock.classList.add('hidden')
                changeBtn.classList.remove('active')
                inputBlock.querySelector('input').value = ""
            } else {
                changeBtn.classList.add('active')

                inputBlock.classList.remove('hidden')
            }
        })
    })

    let changeDateBtn = document.querySelector('.change-date')
    let changeTimeBtn = document.querySelector('.change-time')
    let changeGuestsBtn = document.querySelector('.change-guests')

    changeDateBtn.addEventListener('click', async () => {

        if (changeDateBtn.classList.contains('active')) return
        changeDateBtn.classList.add('active')

        let dateInput = document.getElementById('date-change')
        if (dateInput.value) {
            let bookingId = document.querySelector('.bookings-table-info.active').id
            const parsedDate = new Date(`${dateInput.value}T00:00:00.000Z`);
            fetch("/api/admin/change-booking-date", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    id: bookingId,
                    date: parsedDate
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        bookingDate.innerHTML = dateInput.value.slice(0, 10)

                        changeDateBtn.closest('.change-input').classList.add('hidden')
                        changeDateBtn.closest('.change-booking-info').querySelector('.change-booking-info-btn').classList.remove('active')

                        dateInput.value = ""

                        changeDateBtn.classList.remove('active')
                    } else {
                        alert(data.message || "Failed to change the booking date");
                    }
                })
                .catch(err => console.error("Error fetching:", err));
        } else {
            changeDateBtn.classList.remove('active')
        }
    })


    changeTimeBtn.addEventListener('click', async () => {

        if (changeTimeBtn.classList.contains('active')) return
        changeTimeBtn.classList.add('active')

        let timeInput = document.getElementById('time-change')
        if (timeInput.value) {
            let bookingId = document.querySelector('.bookings-table-info.active').id

            fetch("/api/admin/change-booking-time", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    id: bookingId,
                    time: timeInput.value
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        bookingTime.innerHTML = timeInput.value

                        changeTimeBtn.closest('.change-input').classList.add('hidden')
                        changeTimeBtn.closest('.change-booking-info').querySelector('.change-booking-info-btn').classList.remove('active')

                        timeInput.value = ""

                        changeTimeBtn.classList.remove('active')
                    } else {
                        alert(data.message || "Failed to change the booking time");
                    }
                })
                .catch(err => console.error("Error fetching:", err));
        } else {
            changeTimeBtn.classList.remove('active')
        }
    })

    changeGuestsBtn.addEventListener('click', async () => {

        if (changeGuestsBtn.classList.contains('active')) return
        changeGuestsBtn.classList.add('active')

        let guestsInput = document.getElementById('guests-change')
        if (guestsInput.value) {
            let bookingId = document.querySelector('.bookings-table-info.active').id

            fetch("/api/admin/change-booking-guests", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    id: bookingId,
                    guests: guestsInput.value
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        bookingGuests.innerHTML = guestsInput.value

                        changeGuestsBtn.closest('.change-input').classList.add('hidden')
                        changeGuestsBtn.closest('.change-booking-info').querySelector('.change-booking-info-btn').classList.remove('active')

                        guestsInput.value = ""

                        changeGuestsBtn.classList.remove('active')
                    } else {
                        alert(data.message || "Failed to change the booking guests");
                    }
                })
                .catch(err => console.error("Error fetching:", err));
        } else {
            changeGuestsBtn.classList.remove('active')
        }
    })

});