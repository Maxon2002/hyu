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


let editBtnsCategory = document.querySelectorAll('.edit-btn-category')

editBtnsCategory.forEach(editBtnCategory => {
    editBtnCategory.addEventListener('click', () => {
        let categoryBlock = editBtnCategory.closest('.category-block')
        let categoryBlockEdit = categoryBlock.querySelector('.category-block-edit')

        categoryBlockEdit.classList.toggle('active')
    })
})

let saveBtnsCategory = document.querySelectorAll('.save-btn-category')
let exitBtnsCategory = document.querySelectorAll('.exit-btn-category')

saveBtnsCategory.forEach(saveBtnCategory => {
    saveBtnCategory.addEventListener('click', () => {



        saveBtnCategory.closest('.category-block-edit').classList.toggle('active')
    })
})

exitBtnsCategory.forEach(exitBtnCategory => {
    exitBtnCategory.addEventListener('click', () => {

        exitBtnCategory.closest('.category-block-edit').classList.toggle('active')
    })
})



let addCategoryBtn = document.querySelector('.add-category-btn')

addCategoryBtn.addEventListener('click', () => {
    addCategoryBtn.classList.remove('active')
    addCategoryBtn.closest('.add-category-container').querySelector('.add-category-block').classList.add('active')
})



let addSaveBtnCategory = document.querySelector('.add-btn-category')
let cancelBtnCategory = document.querySelector('.cancel-btn-category')

addSaveBtnCategory.addEventListener('click', () => {
    addSaveBtnCategory.closest('.add-category-block').classList.remove('active')

    addSaveBtnCategory.closest('.add-category-container').querySelector('.add-category-btn').classList.add('active')
})

cancelBtnCategory.addEventListener('click', () => {
    cancelBtnCategory.closest('.add-category-block').classList.remove('active')

    cancelBtnCategory.closest('.add-category-container').querySelector('.add-category-btn').classList.add('active')
})