document.querySelectorAll('.filter-button').forEach(button => {
    const panel = button.querySelector('.filter-panel');
    const dropdown = button.querySelector('.filter-dropdown');

    panel.addEventListener('click', () => {
        panel.classList.toggle('active');
        dropdown.classList.toggle('active');
    });
});



document.addEventListener("DOMContentLoaded", () => {
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
              <td>${client.createdAt}</td>
              <td><span class="clickable table-visits">${client.totalVisits}</span></td>
              <td>${lastVisit ? lastVisit : "-"}</td>
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