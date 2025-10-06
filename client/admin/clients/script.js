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
});

document.addEventListener("DOMContentLoaded", () => {


    const tableBody = document.querySelector(".clients-table tbody");
    const paginationContainer = document.querySelector(".pagination");

    let currentPage = 1;
    const limit = 30;


    // загрузка бриф инфо
    function briefInfo() {
        fetch(`/api/admin/clients-brief`)
            .then((res) => res.json())
            .then((data) => {

                document.getElementById("total-clients").textContent = data.total;
                document.getElementById("month-visits").textContent = data.monthVisits;

            })
            .catch((err) => {
                console.error("Error loading clients:", err);
            });
    }

    briefInfo()



    // фильтры
    const applyBtn = document.querySelector(".apply-filters");
    const resetBtn = document.querySelector(".reset-filters");
    const filterButtons = document.querySelectorAll(".filter-button");

    // Сбор значений фильтров
    function collectFilters() {
        return {
            registrationDate: {
                from: document.getElementById("date-from").value || null,
                to: document.getElementById("date-to").value || null,
            },
            totalVisits: {
                from: document.getElementById("total-visits-from").value || null,
                to: document.getElementById("total-visits-to").value || null,
            },
            lastVisit: {
                from: document.getElementById("last-visit-from").value || null,
                to: document.getElementById("last-visit-to").value || null,
            },
            discount: {
                from: document.getElementById("discount-from").value || null,
                to: document.getElementById("discount-to").value || null,
            },
            friends: {
                from: document.getElementById("friends-from").value || null,
                to: document.getElementById("friends-to").value || null,
            }
        };
    }



    // Загрузка клиентов с сервера
    function fetchClients(filters = {}, page = 1) {
        const params = {
            filters,
            page,
            limit
        };

        fetch("/api/admin/clients-table", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params)
        })
            .then(res => res.json())
            .then(data => {
                renderTable(data.clients);
                renderPagination(data.total, page);
            })
            .catch(err => console.error("Error fetching clients:", err));
    }

    // Применение фильтров
    applyBtn.addEventListener("click", () => {

        if (!applyBtn.classList.contains("active")) return;
        fetchClients(collectFilters(), 1);
        // включаем reset-filters
        resetBtn.classList.add("active");
        const resetIcon = resetBtn.querySelector("img");
        resetIcon.src = "../../images/reset-filters-active.svg";

        document.querySelectorAll('.filter-panel').forEach(panel => {
            panel.classList.remove('active')
        });

        document.querySelectorAll('.filter-dropdown').forEach(dropdown => {
            dropdown.classList.remove('active')
        });



    });

    // Сброс фильтров
    resetBtn.addEventListener("click", () => {
        if (!resetBtn.classList.contains("active")) return;

        document.querySelectorAll(".filter-dropdown input").forEach(input => {
            input.value = "";
        });

        filterButtons.forEach(button => {
            button.classList.remove("checked");
            const arrow = button.querySelector(".filter-panel img");
            arrow.src = "../../images/panel-arrow.svg";
        });

        applyBtn.classList.remove("active");
        applyBtn.querySelector("img").src = "../../images/apply-filters.svg";

        resetBtn.classList.remove("active");
        resetBtn.querySelector("img").src = "../../images/reset-filters.svg";

        document.querySelectorAll('.filter-panel').forEach(panel => {
            panel.classList.remove('active')
        });

        document.querySelectorAll('.filter-dropdown').forEach(dropdown => {
            dropdown.classList.remove('active')
        });

        fetchClients({}, 1);
    });



    // рендер таблицы
    function renderTable(clients) {

        if (!clients || clients.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7">No clients found</td></tr>`;
            return;
        }

        tableBody.innerHTML = clients
            .map((client) => {
                const lastVisit = client.visits[0]?.visitDate || null;

                return `<tr>
          <td><span class="clickable table-email">${client.email}</span></td>
          <td>${client.referralCode}</td>
          <td>${client.createdAt.slice(0, 10)}</td>
          <td><span class="clickable table-visits">${client.totalVisits}</span></td>
          <td>${lastVisit ? lastVisit.slice(0, 10) : "-"}</td>
          <td><span class="clickable table-discount">${client.discount}%</span></td>
          <td><span class="clickable table-friends">${client.friendsInvited}</span></td>
        </tr>`
            })
            .join("");
    }

    // рендер пагинации
    function renderPagination(total, page) {
        const totalPages = Math.ceil(total / limit);
        currentPage = page;

        let buttonsHTML = "";

        // prev
        buttonsHTML += `<button class="page-btn prev" ${page === 1 ? "disabled" : ""
            }>Prev</button>`;

        // номера страниц (ограничим 5 страниц вокруг текущей)
        const start = Math.max(1, page - 2);
        const end = Math.min(totalPages, page + 2);

        for (let i = start; i <= end; i++) {
            buttonsHTML += `<button class="page-btn ${i === page ? "active" : ""
                }">${i}</button>`;
        }

        // next
        buttonsHTML += `<button class="page-btn next" ${page === totalPages ? "disabled" : ""
            }>Next</button>`;

        paginationContainer.innerHTML = buttonsHTML;

        // обработчики кликов
        paginationContainer
            .querySelectorAll(".page-btn")
            .forEach((btn) =>
                btn.addEventListener("click", () => handlePageClick(btn, totalPages))
            );
    }

    // обработка клика
    function handlePageClick(btn, totalPages) {
        if (btn.classList.contains("prev") && currentPage > 1) {
            loadClients(currentPage - 1);
        } else if (btn.classList.contains("next") && currentPage < totalPages) {
            loadClients(currentPage + 1);
        } else {
            const pageNum = parseInt(btn.textContent);
            if (!isNaN(pageNum)) {
                loadClients(pageNum);
            }
        }
    }


    // первый запрос
    // loadClients(1);
    // Первая загрузка
    fetchClients({}, 1);








    const searchInput = document.getElementById("search-input");
    const resultsContainer = document.querySelector(".search-results");

    let debounceTimer;

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim();

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (query.length === 0) {
                resultsContainer.classList.remove("active");
                resultsContainer.innerHTML = "";
                return;
            }

            fetch(`/api/admin/search?email=${encodeURIComponent(query)}`)
                .then((res) => res.json())
                .then((clients) => {
                    renderResults(clients);
                })
                .catch((err) => {
                    console.error("Search error:", err);
                });
        }, 300);
    });

    function renderResults(clients) {
        if (!clients || clients.length === 0) {
            resultsContainer.classList.remove("active");
            resultsContainer.innerHTML = "";
            return;
        }

        resultsContainer.classList.add("active");
        resultsContainer.innerHTML = clients
            .map((client) => `<li>${client.email}</li>`)
            .join("");
    }


    const modalClient = document.getElementById("client-modal");
    const modalClientClose = modalClient.querySelector(".modal-close");
    const modalClientBody = modalClient.querySelector("tbody");


    // обработка клика по email в списке результатов
    resultsContainer.addEventListener("click", (e) => {
        if (e.target.tagName === "LI") {
            const email = e.target.textContent.trim();

            // запрос на сервер за полными данными клиента
            fetch(`/api/admin/search-result?email=${encodeURIComponent(email)}`)
                .then((res) => res.json())
                .then((client) => {

                    const lastVisit = client.visits[0]?.visitDate || null;
                    // рендерим строку в модальное окно
                    modalClientBody.innerHTML = `
            <tr>
              <td><span class="clickable table-email">${email}</span></td>
              <td>${client.referralCode}</td>
              <td>${client.createdAt.slice(0, 10)}</td>
              <td><span class="clickable table-visits">${client.totalVisits}</span></td>
              <td>${lastVisit ? lastVisit.slice(0, 10) : "-"}</td>
              <td><span class="clickable table-discount">${client.discount}%</span></td>
              <td><span class="clickable table-friends">${client.friendsInvited}</span></td>
            </tr>
          `;
                    modalClient.style.display = "block";
                })
                .catch((err) => {
                    console.error("Error loading client:", err);
                });
        }
    });

    // закрытие модалки
    modalClientClose.addEventListener("click", () => {
        modalClient.style.display = "none";
        modalClientBody.innerHTML = "";
    });






    filterButtons.forEach(button => {
        const panel = button.querySelector('.filter-panel');
        const dropdown = button.querySelector('.filter-dropdown');

        panel.addEventListener('click', () => {
            panel.classList.toggle('active');
            dropdown.classList.toggle('active');
        });
    });



    // Проверка состояния фильтров
    function updateFilterStates() {
        let anyChecked = false;

        filterButtons.forEach(button => {
            const panel = button.querySelector(".filter-panel");
            const arrow = panel.querySelector("img");
            const inputs = button.querySelectorAll("input");

            // если хотя бы одно поле внутри фильтра заполнено → checked
            let isChecked = Array.from(inputs).some(input => input.value.trim() !== "");
            button.classList.toggle("checked", isChecked);

            if (isChecked) {
                anyChecked = true;
                arrow.src = "../../images/panel-arrow-active.svg";
            } else {
                arrow.src = "../../images/panel-arrow.svg";
            }
        });

        // apply-filters активен, если есть хотя бы один фильтр
        applyBtn.classList.toggle("active", anyChecked);
        const applyIcon = applyBtn.querySelector("img");
        applyIcon.src = anyChecked
            ? "../../images/apply-filters-active.svg"
            : "../../images/apply-filters.svg";
    }

    // Навешиваем на все input фильтров
    document.querySelectorAll(".filter-dropdown input").forEach(input => {
        input.addEventListener("input", updateFilterStates);
    });

    // первая инициализация
    updateFilterStates();




    const modalEmail = document.getElementById("email-modal");
    const modalEmailEmail = modalEmail.querySelector(".modal-email");
    const modalEmailBody = modalEmail.querySelector("tbody");
    const modalEmailClose = modalEmail.querySelector(".modal-close");
    let currentEmail

    // функция загрузки и рендера данных
    async function loadClientComment(email) {
        currentEmail = email
        try {
            const res = await fetch("/api/admin/client-comment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            if (!res.ok) throw new Error("Ошибка запроса");
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
            modalEmailBody.innerHTML = "<tr><td>Error loading visits</td></tr>";
        }
    }



    // закрытие модалки
    modalEmailClose.addEventListener("click", () => {
        modalEmail.style.display = "none";
        // очищаем прошлые данные
        modalEmailBody.innerHTML = "";

        editCommentForm.classList.add("hidden");
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

    // функция загрузки и рендера данных
    async function loadClientVisits(email) {
        try {
            const res = await fetch("/api/admin/client-visits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            if (!res.ok) throw new Error("Ошибка запроса");
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
    });






    const friendsModal = document.getElementById("friends-modal");
    const friendsEmail = friendsModal.querySelector(".modal-email");
    const friendsTableBody = friendsModal.querySelector("tbody");
    const friendsClose = friendsModal.querySelector(".modal-close");

    async function loadClientFriends(email) {
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
    });



    // обработка кликов по модалкам

    document.querySelector(".clients-table tbody").addEventListener("click", (e) => {
        if (e.target.classList.contains("table-visits")) {

            const row = e.target.closest("tr");
            const email = row.querySelector("td").textContent.trim();

            modalVisitsEmail.textContent = `Client: ${email}`;
            modalVisits.style.display = "block";

            loadClientVisits(email);
        }
        if (e.target.classList.contains("table-friends")) {
            const row = e.target.closest("tr");
            const email = row.querySelector("td").textContent.trim();

            friendsEmail.textContent = `Client: ${email}`;
            friendsModal.style.display = "block";

            loadClientFriends(email);
        }

        if (e.target.classList.contains("table-email")) {
            const row = e.target.closest("tr");
            const email = row.querySelector("td").textContent.trim();

            modalEmailEmail.textContent = `Client: ${email}`;
            modalEmail.style.display = "block";

            loadClientComment(email);
        }
    });

    friendsTableBody.addEventListener("click", (e) => {
        if (e.target.classList.contains("table-visits")) {
            friendsModal.style.display = "none";
            friendsTableBody.innerHTML = "";


            const row = e.target.closest("tr");
            const email = row.querySelector("td").textContent.trim();

            modalVisitsEmail.textContent = `Client: ${email}`;
            modalVisits.style.display = "block";

            loadClientVisits(email);
        }
        if (e.target.classList.contains("table-friends")) {
            friendsModal.style.display = "none";
            friendsTableBody.innerHTML = "";


            const row = e.target.closest("tr");
            const email = row.querySelector("td").textContent.trim();

            friendsEmail.textContent = `Client: ${email}`;
            friendsModal.style.display = "block";

            loadClientFriends(email);
        }

        if (e.target.classList.contains("table-email")) {
            friendsModal.style.display = "none";
            friendsTableBody.innerHTML = "";

            const row = e.target.closest("tr");
            const email = row.querySelector("td").textContent.trim();

            modalEmailEmail.textContent = `Client: ${email}`;
            modalEmail.style.display = "block";

            loadClientComment(email);
        }
    });

    modalClientBody.addEventListener("click", (e) => {
        if (e.target.classList.contains("table-visits")) {
            modalClient.style.display = "none";
            modalClientBody.innerHTML = "";

            const row = e.target.closest("tr");
            const email = row.querySelector("td").textContent.trim();

            modalVisitsEmail.textContent = `Client: ${email}`;
            modalVisits.style.display = "block";

            loadClientVisits(email);
        }
        if (e.target.classList.contains("table-friends")) {
            modalClient.style.display = "none";
            modalClientBody.innerHTML = "";

            const row = e.target.closest("tr");
            const email = row.querySelector("td").textContent.trim();

            friendsEmail.textContent = `Client: ${email}`;
            friendsModal.style.display = "block";

            loadClientFriends(email);
        }

        if (e.target.classList.contains("table-email")) {
            modalClient.style.display = "none";
            modalClientBody.innerHTML = "";

            const row = e.target.closest("tr");
            const email = row.querySelector("td").textContent.trim();

            modalEmailEmail.textContent = `Client: ${email}`;
            modalEmail.style.display = "block";

            loadClientComment(email);
        }
    });





    window.addEventListener("click", e => {
        if (e.target === friendsModal) {
            friendsModal.style.display = "none";
            friendsTableBody.innerHTML = "";
        }
        if (e.target === modalVisits) {
            modalVisits.style.display = "none";
            modalVisitsBody.innerHTML = "";
        }
        if (e.target === modalClient) {
            modalClient.style.display = "none";
            modalClientBody.innerHTML = "";
        }
        if (e.target === modalEmail) {
            modalEmail.style.display = "none";
            modalEmailBody.innerHTML = "";
        }
    });



});