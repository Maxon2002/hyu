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


// изменить название/позицию категории
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
        let categoryBlockEdit = saveBtnCategory.closest('.category-block-edit')
        let fields = categoryBlockEdit.querySelectorAll('input')

        let valid = true
        for (const field of fields) {
            if (!field.value.trim()) {
                alert('Position and names are required');
                valid = false
                return;
            }
        }

        if (valid) {
            categoryBlockEdit.classList.toggle('active')
        }
    })
})

exitBtnsCategory.forEach(exitBtnCategory => {
    exitBtnCategory.addEventListener('click', () => {

        exitBtnCategory.closest('.category-block-edit').classList.toggle('active')
    })
})


// добавить категорию 
let addCategoryBtn = document.querySelector('.add-category-btn')

addCategoryBtn.addEventListener('click', () => {


    addCategoryBtn.classList.remove('active')
    addCategoryBtn.closest('.add-category-container').querySelector('.add-category-block').classList.add('active')
})



let addSaveBtnCategory = document.querySelector('.add-btn-category')
let cancelBtnCategory = document.querySelector('.cancel-btn-category')

addSaveBtnCategory.addEventListener('click', () => {

    let addCategoryBlock = addSaveBtnCategory.closest('.add-category-block')
    let fields = addCategoryBlock.querySelectorAll('input')

    let valid = true
    for (const field of fields) {
        if (!field.value.trim()) {
            alert('Position and names of category are required');
            valid = false
            return;
        }
    }


    if (valid) {
        fields.forEach(field => {
            field.value = ""
        })

        addCategoryBlock.classList.remove('active')

        addCategoryBtn.classList.add('active')
    }

})

cancelBtnCategory.addEventListener('click', () => {

    let addCategoryBlock = addSaveBtnCategory.closest('.add-category-block')
    let fields = addCategoryBlock.querySelectorAll('input')
    fields.forEach(field => {
        field.value = ""
    })

  
    addCategoryBlock.classList.remove('active')
    addCategoryBtn.classList.add('active')
})


// открыть блюда категории
let categoryBlocks = document.querySelectorAll('.category-block-info')
let itemsContainer = document.querySelector('.items-main-container')

categoryBlocks.forEach(categoryBlock => {
    categoryBlock.addEventListener('click', () => {

        categoryBlocks.forEach(categoryBlock => {
            categoryBlock.classList.remove('active')
        })

        categoryBlock.classList.add('active')


        itemsContainer.classList.remove('hidden')
    })
})

// открыть editor блюда
let itemBlocks = document.querySelectorAll('.item-block')
let itemEditorContainer = document.querySelector('.item-editor-main-container')

itemBlocks.forEach(itemBlock => {
    itemBlock.addEventListener('click', () => {

        itemBlocks.forEach(itemBlock => {
            itemBlock.classList.remove('active')
        })

        itemBlock.classList.add('active')


        itemEditorContainer.classList.remove('hidden')
    })
})


// изменить название/позицию опции блюда
let editBtnsOption = document.querySelectorAll('.edit-btn-option')

editBtnsOption.forEach(editBtnOption => {
    editBtnOption.addEventListener('click', () => {
        let optionContainer = editBtnOption.closest('.option-container')
        let optionBlockEdit = optionContainer.querySelector('.category-block-edit')

        optionBlockEdit.classList.toggle('active')
    })
})

let saveBtnsOption = document.querySelectorAll('.save-btn-option')
let exitBtnsOption = document.querySelectorAll('.exit-btn-option')

saveBtnsOption.forEach(saveBtnOption => {
    saveBtnOption.addEventListener('click', () => {

        let categoryBlockEdit = saveBtnsOption.closest('.category-block-edit')
        let fields = categoryBlockEdit.querySelectorAll('input')

        let valid = true
        for (const field of fields) {
            if (!field.value.trim()) {
                alert('Position and names of option are required');
                valid = false
                return;
            }
        }

        if (valid) {
            categoryBlockEdit.classList.toggle('active')
        }

    })
})

exitBtnsOption.forEach(exitBtnOption => {
    exitBtnOption.addEventListener('click', () => {



        exitBtnOption.closest('.category-block-edit').classList.toggle('active')
    })
})




// добавить опцию блюда 
let addOptionBtn = document.querySelector('.add-option-btn')

addOptionBtn.addEventListener('click', () => {


    addOptionBtn.classList.remove('active')
    addOptionBtn.closest('.add-option-container').querySelector('.add-option-block').classList.add('active')

})



let addSaveBtnOption = document.querySelector('.add-btn-option')
let cancelBtnOption = document.querySelector('.cancel-btn-option')

addSaveBtnOption.addEventListener('click', () => {

    let addOptionBlock = addSaveBtnOption.closest('.add-option-block')
    let fields = addOptionBlock.querySelectorAll('#position, #price')

    let valid = true
    for (const field of fields) {
        if (!field.value.trim()) {
            alert('Position and price of option are required');
            valid = false
            return;
        }
    }


    if (valid) {
        let allFields = addOptionBlock.querySelectorAll('input')
        allFields.forEach(field => {
            field.value = ""
        })
        addOptionNameBtn.textContent = "Add option name"

        addOptionBlock.classList.remove('active')
        addOptionBtn.classList.add('active')
    }
})

cancelBtnOption.addEventListener('click', () => {
    let addOptionBlock = cancelBtnOption.closest('.add-option-block')
    let fields = addOptionBlock.querySelectorAll('input')
    fields.forEach(field => {
        field.value = ""
    })

    addOptionNameBtn.textContent = "Add option name"

    addOptionBlock.classList.remove('active')

    addOptionBtn.classList.add('active')
})



// добавить имя опции блюда 
let addOptionNameBtn = document.querySelector('.add-option-name-btn')
let addOptionNameContainer = document.querySelector('.add-option-name-container')

addOptionNameBtn.addEventListener('click', () => {
    addOptionNameBtn.classList.remove('active')
    addOptionNameContainer.querySelector('.add-option-name-block').classList.add('active')
})



let saveBtnOptionName = document.querySelector('.save-btn-option-name')
let cancelBtnOptionName = document.querySelector('.cancel-btn-option-name')
let optionNameFields = addOptionNameContainer.querySelectorAll('input')

saveBtnOptionName.addEventListener('click', () => {


    let valid = true
    for (const field of optionNameFields) {
        if (!field.value.trim()) {
            alert('Not all fields for option name are filled in');
            valid = false
            return;
        }
    }



    if (valid) {
        optionNameFields.forEach(field => {
            if (field.id === "en-option") {
                addOptionNameBtn.textContent = field.value.trim()

            }
        })

        saveBtnOptionName.closest('.add-option-name-block').classList.remove('active')
        addOptionNameBtn.classList.add('active')
    }
})

cancelBtnOptionName.addEventListener('click', () => {

    optionNameFields.forEach(field => {
        field.value = ""
        addOptionNameBtn.textContent = "Add option name"
    })


    cancelBtnOptionName.closest('.add-option-name-block').classList.remove('active')

    addOptionNameBtn.classList.add('active')
})


// сохрание всех изменений блюда

let saveBtnItemEditor = document.querySelector('.save-btn-item-editor')
let exitBtnItemEditor = document.querySelector('.exit-btn-item-editor')

saveBtnItemEditor.addEventListener('click', () => {
    let valid = true
    let allEditorFields = itemEditorContainer.querySelectorAll('input, textarea')

    for (const field of allEditorFields) {
        if (!field.value.trim() && !field.closest('.add-option-block')) {
            alert('Not all fields are filled in')
            valid = false
            return
        }
    }




    if (valid) {
        alert('Changes have been successfully applied.')
    }
})


exitBtnItemEditor.addEventListener('click', () => {




    itemEditorContainer.classList.add('hidden')

    itemBlocks.forEach(itemBlock => {
        itemBlock.classList.remove('active')
    })
})