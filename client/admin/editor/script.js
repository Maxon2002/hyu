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



    const wrapper = document.getElementById("categoriesWrapper");
    let categoriesArr = []

    async function loadCategories() {
        try {
            const res = await fetch("/api/menuManager/categories");
            const data = await res.json();

            if (!data.success) return alert("Failed to load categories");


            wrapper.innerHTML = ""; // очистить старые данные

            data.categories.forEach(category => {
                categoriesArr.push(category)
                wrapper.appendChild(renderCategory(category));
            });

            addListenerEditCategory()

        } catch (err) {
            console.error(err);
            alert("Error loading categories");
        }
    }

    loadCategories()


    function renderCategory(cat) {
        const block = document.createElement("div");
        block.classList.add("category-block");

        block.dataset.id = cat.id
        block.dataset.slug = cat.slug;
        block.dataset.position = cat.position;

        // получаем переводы
        const tr = {};
        cat.translations.forEach(t => tr[t.language] = t.title || "");

        block.innerHTML = `
        <div class="category-block-info-wrapper">
            <div class="category-block-info" id="${cat.slug}">
                <div class="item-name">${tr.en || ""}</div>
            </div>
            <img src="../../images/edit-btn.svg" class="edit-btn edit-btn-category" />
        </div>

        <div class="add-block">
            <div class="block-edit">
                <label>Position</label>
                <input type="number" min="1" value="${cat.position + 1}" data-field="position">

                <label>en</label>
                <input type="text" value="${tr.en || ""}" data-lang="en">

                <label>ru</label>
                <input type="text" value="${tr.ru || ""}" data-lang="ru">

                <label>ko</label>
                <input type="text" value="${tr.ko || ""}" data-lang="ko">

                <label>ar</label>
                <input type="text" value="${tr.ar || ""}" data-lang="ar">

                <div class="change-buttons-container">
                    <div class="change-buttons">
                        <button class="act-btn save-btn-category" data-id="${cat.id}">Save</button>
                        <button class="act-btn exit-btn-category">Exit</button>
                    </div>
                    <button class="act-btn delete-btn delete-btn-category" data-id="${cat.id}">
                        Delete category
                    </button>
                </div>
            </div>
        </div>
    `;

        return block;
    }



    // function rerenderCategoriesUI() {
    //     wrapper.innerHTML = "";

    //     categoriesArr
    //         .sort((a, b) => a.position - b.position)
    //         .forEach(c => wrapper.appendChild(renderCategory(c)));

    //     addListenerEditCategory()
    // }






    // изменить название/позицию категории
    function addListenerEditCategory() {
        let editBtnsCategory = document.querySelectorAll('.edit-btn-category')

        editBtnsCategory.forEach(editBtnCategory => {
            editBtnCategory.addEventListener('click', () => {
                const categoryBlock = editBtnCategory.closest('.category-block');
                const categoryId = categoryBlock.dataset.id;

                const category = categoriesArr.find(c => c.id === categoryId);

                const blockEdit = categoryBlock.querySelector('.add-block');

                // 🔄 ПЕРЕД ОТКРЫТИЕМ — снова заполняем поля актуальными данными
                function fillCategoryEditForm(block, category) {
                    const tr = {};
                    category.translations.forEach(t => tr[t.language] = t.title || "");
                    // position
                    block.querySelector('input[data-field="position"]').value = category.position + 1;
                    // translations
                    block.querySelector('input[data-lang="en"]').value = tr.en || "";
                    block.querySelector('input[data-lang="ru"]').value = tr.ru || "";
                    block.querySelector('input[data-lang="ko"]').value = tr.ko || "";
                    block.querySelector('input[data-lang="ar"]').value = tr.ar || "";
                }
                fillCategoryEditForm(blockEdit, category);

                // Показать/скрыть блок
                blockEdit.classList.toggle('active');
            })
        })

        let saveBtnsCategory = document.querySelectorAll('.save-btn-category')
        let exitBtnsCategory = document.querySelectorAll('.exit-btn-category')

        // saveBtnsCategory.forEach(saveBtnCategory => {
        //     saveBtnCategory.addEventListener('click', () => {
        //         let categoryBlockEdit = saveBtnCategory.closest('.add-block')
        //         let fields = categoryBlockEdit.querySelectorAll('input')

        //         let validFirst = true
        //         let validSecond = true
        //         for (const field of fields) {
        //             if (!field.value.trim()) {
        //                 alert('Position and names are required');
        //                 validFirst = false
        //                 return;
        //             }
        //         }

        //         if (categoryBlockEdit.querySelector('input[data-field="position"]').value <= 0) {
        //             alert('Position have to at least 1');
        //             validSecond = false
        //         }

        //         if (validFirst && validSecond) {
        //             categoryBlockEdit.classList.toggle('active')

        //         }
        //     })
        // })

        saveBtnsCategory.forEach(saveBtn => {
            saveBtn.addEventListener("click", async () => {

                const blockEdit = saveBtn.closest(".add-block");
                const categoryBlock = saveBtn.closest(".category-block");
                const categoryId = categoryBlock.dataset.id;
                const fields = blockEdit.querySelectorAll("input");

                // ---- Валидация ----
                let valid = true;

                fields.forEach(f => {
                    if (!f.value.trim()) valid = false;
                });

                if (!valid) {
                    alert("Position and names are required");
                    return;
                }

                const newPosition = Number(blockEdit.querySelector('input[data-field="position"]').value);
                if (newPosition <= 0) {
                    alert("Position must be at least 1");
                    return;
                }

                // ---- Формирование данных ----
                const translations = {
                    en: blockEdit.querySelector('input[data-lang="en"]').value,
                    ru: blockEdit.querySelector('input[data-lang="ru"]').value,
                    ko: blockEdit.querySelector('input[data-lang="ko"]').value,
                    ar: blockEdit.querySelector('input[data-lang="ar"]').value
                };

                const payload = {
                    id: categoryId,
                    position: newPosition - 1,     // UI → DB (минус 1)
                    translations
                };

                // ---- Отправляем на сервер ----
                try {
                    const res = await fetch("/api/menuManager/category/update", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        alert(data.error || "Error updating category");
                        return;
                    }

                    // // обновляем локальный массив
                    // const idx = categoriesArr.findIndex(c => c.id === categoryId);
                    // categoriesArr[idx] = data.category;

                    // // перерендерить UI
                    // rerenderCategoriesUI();

                    await loadCategories()

                    alert('Categories have been successfully updated.')

                } catch (err) {
                    console.error(err);
                    alert("Server error");
                }
            });
        });








        exitBtnsCategory.forEach(exitBtnCategory => {
            exitBtnCategory.addEventListener('click', () => {

                exitBtnCategory.closest('.add-block').classList.toggle('active')
            })
        })
    }

    // добавить категорию 
    let addCategoryBtn = document.querySelector('.add-category-btn')

    addCategoryBtn.addEventListener('click', () => {


        addCategoryBtn.classList.remove('active')
        addCategoryBtn.closest('.add-container').querySelector('.add-block').classList.add('active')
    })



    let addSaveBtnCategory = document.querySelector('.add-btn-category')
    let cancelBtnCategory = document.querySelector('.cancel-btn-category')

    addSaveBtnCategory.addEventListener('click', () => {

        let addCategoryBlock = addSaveBtnCategory.closest('.add-block')
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

        let addCategoryBlock = addSaveBtnCategory.closest('.add-block')
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

            addItemContainer.classList.add("hidden")
            itemEditorContainer.classList.remove('hidden')
        })
    })


    // открыть окно добавления блюда 

    let openAddItem = document.querySelector('.add-item-btn')
    let addItemContainer = document.querySelector('.add-item-main-container')

    openAddItem.addEventListener('click', () => {
        exitBtnItemEditor.click()
        addItemContainer.classList.remove("hidden")
    })


    // добавить новое блюдо/отменить
    let addItemBtn = document.querySelector('.save-btn-add-item')
    let cancelAddItemBtn = document.querySelector('.exit-btn-add-item')



    addItemBtn.addEventListener('click', () => {
        let validFirst = true
        let validSecond = true
        let allEditorFields = addItemContainer.querySelectorAll('input, textarea')

        for (const field of allEditorFields) {
            if (!field.value.trim() && !field.closest('.add-block')) {
                alert('Not all fields are filled in')
                validFirst = false
                return
            }
        }

        if (!addItemContainer.querySelector('.option-container')) {
            alert('At least one option is requeried')
            validSecond = false
        }




        if (validFirst && validSecond) {
            alert('New item have been successfully added.')
        }
    })



    cancelAddItemBtn.addEventListener('click', () => {

        addItemContainer.classList.add("hidden")

        addItemContainer.querySelectorAll('input, textarea').forEach(field => {
            field.value = ""
        })
    })





    // изменить название/позицию опции блюда
    let editBtnsOption = document.querySelectorAll('.edit-btn-option')

    editBtnsOption.forEach(editBtnOption => {
        editBtnOption.addEventListener('click', () => {
            let optionContainer = editBtnOption.closest('.option-container')
            let optionBlockEdit = optionContainer.querySelector('.add-block')

            optionBlockEdit.classList.toggle('active')
        })
    })

    let saveBtnsOption = document.querySelectorAll('.save-btn-option')
    let exitBtnsOption = document.querySelectorAll('.exit-btn-option')

    saveBtnsOption.forEach(saveBtnOption => {
        saveBtnOption.addEventListener('click', () => {

            let optionBlockEdit = saveBtnOption.closest('.add-block')
            let fields = optionBlockEdit.querySelectorAll('input')

            let valid = true
            for (const field of fields) {
                if (!field.value.trim()) {
                    alert('Position and names of option are required');
                    valid = false
                    return;
                }
            }

            if (valid) {
                optionBlockEdit.classList.toggle('active')
            }

        })
    })

    exitBtnsOption.forEach(exitBtnOption => {
        exitBtnOption.addEventListener('click', () => {



            exitBtnOption.closest('.add-block').classList.toggle('active')
        })
    })




    // добавить опцию блюда 
    let addOptionBtns = document.querySelectorAll('.add-option-btn')

    addOptionBtns.forEach(addOptionBtn => {
        addOptionBtn.addEventListener('click', () => {


            addOptionBtn.classList.remove('active')
            addOptionBtn.closest('.add-container').querySelector('.add-block').classList.add('active')

        })
    })




    // сохранить добавленную опцию блюда/отменить
    let addSaveBtnsOption = document.querySelectorAll('.add-btn-option')
    let cancelBtnsOption = document.querySelectorAll('.cancel-btn-option')

    addSaveBtnsOption.forEach(addSaveBtnOption => {


        addSaveBtnOption.addEventListener('click', () => {

            let addOptionContainer = addSaveBtnOption.closest('.add-container')
            let fields = addOptionContainer.querySelectorAll('#position, #price')

            let valid = true
            for (const field of fields) {
                if (!field.value.trim()) {
                    alert('Position and price of option are required');
                    valid = false
                    return;
                }
            }


            if (valid) {
                let allFields = addOptionContainer.querySelectorAll('input')
                allFields.forEach(field => {
                    field.value = ""
                })

                addOptionContainer.querySelector('.add-option-name-btn').textContent = "Add option name"

                addOptionContainer.querySelectorAll('.add-block').forEach(block => {
                    block.classList.remove('active')
                })

                addOptionContainer.querySelector('.add-option-btn').classList.add('active')
            }
        })
    })

    cancelBtnsOption.forEach(cancelBtnOption => {


        cancelBtnOption.addEventListener('click', () => {
            let addOptionContainer = cancelBtnOption.closest('.add-container')
            let fields = addOptionContainer.querySelectorAll('input')
            fields.forEach(field => {
                field.value = ""
            })

            let addOptionNameBtn = addOptionContainer.querySelector('.add-option-name-btn')
            addOptionNameBtn.textContent = "Add option name"


            addOptionContainer.querySelectorAll('.add-block').forEach(block => {
                block.classList.remove('active')
            })

            addOptionNameBtn.classList.add('active')

            addOptionContainer.querySelector('.add-option-btn').classList.add('active')
        })
    })



    // добавить имя опции блюда 
    let addOptionNameBtns = document.querySelectorAll('.add-option-name-btn')


    addOptionNameBtns.forEach(addOptionNameBtn => {
        addOptionNameBtn.addEventListener('click', () => {
            addOptionNameBtn.classList.remove('active')
            addOptionNameBtn.closest('.add-container').querySelector('.add-block').classList.add('active')
        })
    })



    // сохранить добавленное имя опции блюда/отменить
    let saveBtnsOptionName = document.querySelectorAll('.save-btn-option-name')
    let cancelBtnsOptionName = document.querySelectorAll('.cancel-btn-option-name')

    saveBtnsOptionName.forEach(saveBtnOptionName => {


        saveBtnOptionName.addEventListener('click', () => {

            let addOptionNameContainer = saveBtnOptionName.closest('.add-container')
            let fields = addOptionNameContainer.querySelectorAll('input')

            let valid = true
            for (const field of fields) {
                if (!field.value.trim()) {
                    alert('Not all fields for option name are filled in');
                    valid = false
                    return;
                }
            }



            if (valid) {
                fields.forEach(field => {
                    if (field.id === "en-option") {
                        addOptionNameContainer.querySelector('.add-option-name-btn').textContent = field.value.trim()
                    }
                })

                saveBtnOptionName.closest('.add-block').classList.remove('active')
                document.querySelectorAll('.add-option-name-btn').forEach(btn => {
                    btn.classList.add('active')
                })
            }
        })
    })

    cancelBtnsOptionName.forEach(cancelBtnOptionName => {


        cancelBtnOptionName.addEventListener('click', () => {
            let addOptionNameContainer = cancelBtnOptionName.closest('.add-container')
            let fields = addOptionNameContainer.querySelectorAll('input')

            fields.forEach(field => {
                field.value = ""
                addOptionNameContainer.querySelector('.add-option-name-btn').textContent = "Add option name"
            })


            cancelBtnOptionName.closest('.add-block').classList.remove('active')

            document.querySelectorAll('.add-option-name-btn').forEach(btn => {
                btn.classList.add('active')
            })
        })
    })

    // сохрание всех изменений блюда

    let saveBtnItemEditor = document.querySelector('.save-btn-item-editor')
    let exitBtnItemEditor = document.querySelector('.exit-btn-item-editor')

    saveBtnItemEditor.addEventListener('click', () => {
        let valid = true
        let allEditorFields = itemEditorContainer.querySelectorAll('input, textarea')

        for (const field of allEditorFields) {
            if (!field.value.trim() && !field.closest('.add-block')) {
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

    // изменить изображение
    let changeImg = document.querySelector('.change-img')

    changeImg.addEventListener('click', () => {
        changeImg.classList.remove('active')
        changeImg.closest('.item-editor-block').querySelector('.add-block').classList.add('active')
    })


    // подвердить/отменить изменение изображения

    let confirmImgChange = document.querySelector('.confirm-img-btn')
    let cancelImgChange = document.querySelector('.cancel-img-btn')

    confirmImgChange.addEventListener('click', () => {

        let changeImgBlock = confirmImgChange.closest('.item-editor-block')
        let valid = true

        if (!changeImgBlock.querySelector('input').value.trim()) {
            valid = false
            alert('Image is required')
        }

        if (valid) {
            changeImgBlock.querySelector('.add-block').classList.remove('active')
            changeImgBlock.querySelector('.change-img').classList.add('active')
        }
    })


    cancelImgChange.addEventListener('click', () => {
        let changeImgBlock = cancelImgChange.closest('.item-editor-block')

        changeImgBlock.querySelector('.add-block').classList.remove('active')
        changeImgBlock.querySelector('.change-img').classList.add('active')


    })


});