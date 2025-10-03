document.querySelectorAll('.filter-button').forEach(button => {
    const panel = button.querySelector('.filter-panel');
    const dropdown = button.querySelector('.filter-dropdown');

    panel.addEventListener('click', () => {
        panel.classList.toggle('active');
        dropdown.classList.toggle('active');
    });
});



document.addEventListener("DOMContentLoaded", () => {


    const tableBody = document.querySelector(".clients-table tbody");
    const paginationContainer = document.querySelector(".pagination");
    const totalClients = document.querySelector("#total-clients")

    let currentPage = 1;
    const limit = 2;

    // загрузка клиентов
    function loadClients(page = 1) {
        fetch(`/api/admin/clients-table?page=${page}&limit=${limit}`)
            .then((res) => res.json())
            .then((data) => {
                // data = { clients: [...], total: number }
                renderTable(data.clients);
                renderPagination(data.total, page);

                totalClients.innerHTML = data.total
            })
            .catch((err) => {
                console.error("Error loading clients:", err);
            });
    }

    // рендер таблицы
    function renderTable(clients) {
        tableBody.innerHTML = clients
            .map((client) => {
                const lastVisit = client.visits[0]?.visitDate || null;

        return `<tr>
          <td>${client.email}</td>
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
    loadClients(1);








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


    const modal = document.getElementById("client-modal");
    const modalClose = document.querySelector(".modal-close");
    const modalBody = document.getElementById("modal-client-body");


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
                    modalBody.innerHTML = `
            <tr>
              <td>${email}</td>
              <td>${client.referralCode}</td>
              <td>${client.createdAt.slice(0, 10)}</td>
              <td><span class="clickable table-visits">${client.totalVisits}</span></td>
              <td>${lastVisit ? lastVisit.slice(0, 10) : "-"}</td>
              <td><span class="clickable table-discount">${client.discount}%</span></td>
              <td><span class="clickable table-friends">${client.friendsInvited}</span></td>
            </tr>
          `;
                    modal.style.display = "block";
                })
                .catch((err) => {
                    console.error("Error loading client:", err);
                });
        }
    });

    // закрытие модалки
    modalClose.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // закрытие по клику вне окна
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
});