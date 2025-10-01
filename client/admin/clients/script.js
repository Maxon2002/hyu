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
});