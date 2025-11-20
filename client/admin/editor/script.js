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



    const wrapperCategory = document.getElementById("categoriesWrapper");
    const wrapperItem = document.getElementById("itemsWrapper");
    const wrapperItemEditor = document.getElementById("itemEditorWrapper");
    let categoriesArr = []
    let itemsArr = []

    async function loadCategories() {
        try {
            const res = await fetch("/api/menuManager/categories");
            const data = await res.json();

            if (!data.success) return alert("Failed to load categories");


            wrapperCategory.innerHTML = ""; // очистить старые данные

            data.categories.forEach(category => {
                categoriesArr.push(category)
                wrapperCategory.appendChild(renderCategory(category));
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







    // изменить название/позицию категории и удалить категорию
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
                    en: blockEdit.querySelector('input[data-lang="en"]').value.trim(),
                    ru: blockEdit.querySelector('input[data-lang="ru"]').value.trim(),
                    ko: blockEdit.querySelector('input[data-lang="ko"]').value.trim(),
                    ar: blockEdit.querySelector('input[data-lang="ar"]').value.trim()
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


        let deleteBtnsCategory = document.querySelectorAll('.delete-btn-category')

        deleteBtnsCategory.forEach(deleteBtn => {
            deleteBtn.addEventListener('click', async () => {

                const categoryBlock = deleteBtn.closest(".category-block");
                const categoryId = categoryBlock.dataset.id;


                if (!confirm("Are you sure you want to delete this category?")) return;


                try {
                    const response = await fetch(`/api/menuManager/category/delete/${categoryId}`, {
                        method: "DELETE"
                    });

                    const result = await response.json();

                    if (!result.success) {
                        alert(result.error || "Delete error");
                        return;
                    }

                    alert("Category deleted");

                    // Перезагрузить категории
                    await loadCategories();

                } catch (err) {
                    console.error(err);
                    alert("Server error");
                }
            })
        })

        // открыть блюда категории
        let categoryBlocksInfo = document.querySelectorAll('.category-block-info')
        let itemsContainer = document.querySelector('.items-main-container')

        categoryBlocksInfo.forEach(catBlockInfo => {
            catBlockInfo.addEventListener('click', async () => {
                const categoryBlock = catBlockInfo.closest(".category-block");
                const categoryId = categoryBlock.dataset.id;

                await loadItems(categoryId)

                categoryBlocksInfo.forEach(catBlockInfo => {
                    catBlockInfo.classList.remove('active')
                })
                catBlockInfo.classList.add('active')
                itemsContainer.classList.remove('hidden')
            })
        })

    }

    // добавить категорию 
    let addCategoryBtn = document.querySelector('.add-category-btn')

    addCategoryBtn.addEventListener('click', () => {
        let addCategoryContainer = addCategoryBtn.closest('.add-container')

        addCategoryContainer.querySelector('input[id="position"]').value = categoriesArr.length + 1


        addCategoryBtn.classList.remove('active')
        addCategoryContainer.querySelector('.add-block').classList.add('active')
    })



    let addSaveBtnCategory = document.querySelector('.add-btn-category')
    let cancelBtnCategory = document.querySelector('.cancel-btn-category')

    addSaveBtnCategory.addEventListener('click', async () => {

        let addCategoryBlock = addSaveBtnCategory.closest('.add-block')
        let fields = addCategoryBlock.querySelectorAll('input')

        let valid = true

        fields.forEach(f => {
            if (!f.value.trim()) valid = false;
        });

        if (!valid) {
            alert("Position and names are required");
            return;
        }

        const position = Number(addCategoryBlock.querySelector('input[id="position"]').value);
        if (position <= 0) {
            alert("Position must be at least 1");
            return;
        }


        // --- формируем данные для сервера ---
        const data = {
            position: position - 1,   // важно!
            translations: {
                en: addCategoryBlock.querySelector('#en-category').value.trim(),
                ru: addCategoryBlock.querySelector('#ru-category').value.trim(),
                ko: addCategoryBlock.querySelector('#ko-category').value.trim(),
                ar: addCategoryBlock.querySelector('#ar-category').value.trim(),
            }
        };

        try {
            const response = await fetch("/api/menuManager/category/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!result.success) {
                alert(result.error || "Error");
                return;
            }

            // Успех
            alert("Category added successfully!");

            // закрываем блок
            addCategoryBlock.classList.remove('active');
            addCategoryBtn.classList.add('active');

            // Очищаем поля
            fields.forEach(field => field.value = "");

            // Перезагружаем категории
            await loadCategories();

        } catch (error) {
            console.error(error);
            alert("Server error");
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






    // рендер таблицы блюд
    async function loadItems(categoryId) {
        try {
            const res = await fetch(`/api/menuManager/category/items/${categoryId}`);
            const data = await res.json();

            if (!data.success) return alert("Failed to load items");


            wrapperItem.innerHTML = ""; // очистить старые данные
            itemsArr = [];

            data.items.forEach(item => {
                itemsArr.push(item)
                wrapperItem.appendChild(renderItem(item));
            });

            addListenerEditItem()

        } catch (err) {
            console.error(err);
            alert("Error loading items");
        }
    }


    function renderItem(item) {
        const block = document.createElement("div");
        block.classList.add("item-block");

        block.dataset.id = item.id

        // получаем переводы
        const tr = {};
        item.translations.forEach(t => tr[t.language] = t.title || "");

        block.innerHTML = `
        <div class="item-name">${tr.en || ""}</div>
        `;

        return block;
    }




    // рендер эдитора блюда

    async function loadItemEditor(itemId) {
        try {
            const res = await fetch(`/api/menuManager/item/${itemId}`);
            const data = await res.json();

            if (!data.success) return alert("Failed to load item editor");


            wrapperItemEditor.innerHTML = ""; // очистить старые данные


            wrapperItemEditor.appendChild(renderItemEditor(data.item));


            initOptionEditors()
            initImageUpload();
            initItemSave();

        } catch (err) {
            console.error(err);
            alert("Error loading items");
        }

    }

    function renderItemEditor(item) {
        const block = document.createElement("div");
        block.classList.add("item-editor-block");

        block.dataset.id = item.id

        // получаем переводы
        const tr = {};
        item.translations.forEach(t => {
            tr[t.language] = {
                title: t.title || "",
                description: t.description || ""
            };
        });


        block.innerHTML = `
        <div class="block-edit">
            <label for="position">Position</label>
            <input type="number" id="item-position" value="${item.position + 1}">

            <div class="change-buttons">
                <button type="button" class="act-btn save-item-position-btn">Save position</button>
            </div>
        </div>
        <div class="block-edit">
            <div class="block-edit-name">Name</div>

            <label>en</label>
            <input type="text" id="en-item-name" value="${tr.en?.title || ""}">
            <label>ru</label>
            <input type="text" id="ru-item-name" value="${tr.ru?.title || ""}">
            <label>ko</label>
            <input type="text" id="ko-item-name" value="${tr.ko?.title || ""}">
            <label>ar</label>
            <input type="text" id="ar-item-name" value="${tr.ar?.title || ""}">

            <div class="change-buttons">
                <button type="button" class="act-btn save-item-name-btn">Save name</button>
            </div>
        </div>
        <div class="block-edit">
            <div class="block-edit-name">Description</div>

            <label>en</label>
            <textarea id="en-item-description">${tr.en?.description || ""}</textarea>
            <label>ru</label>
            <textarea id="ru-item-description">${tr.ru?.description || ""}</textarea>
            <label>ko</label>
            <textarea id="ko-item-description">${tr.ko?.description || ""}</textarea>
            <label>ar</label>
            <textarea id="ar-item-description">${tr.ar?.description || ""}</textarea>

            <div class="change-buttons">
                <button type="button" class="act-btn save-item-description-btn">Save description</button>
            </div>
        </div>

        <div class="block-edit">
            <div class="block-edit-name">Image</div>
            <img src="/images/food/${item.imageSmall || "/images/no-image.webp"}" class="item-img">

            <div class="change-img active">Change image</div>

            <div class="add-block">
                <div class="block-edit">
                    <input type="file" accept="image/*" id="item-image-file">
                    <div class="change-buttons">
                        <button type="button" class="act-btn confirm-img-btn">Confirm</button>
                        <button type="button" class="act-btn cancel-img-btn">Cancel</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="block-edit">
            <div class="block-edit-name">Price</div>

            ${item.variants.map(renderOption).join("")}

            <div class="add-container">
                                        <div class="add-option-btn active">Add option</div>

                                        <div class="add-block">
                                            <div class="block-edit">
                                                <div class="item-name">New option</div>

                                                <label for="position">Position</label>
                                                <input type="number" id="position" name="position">

                                                <label for="price">Price</label>
                                                <input type="number" id="price" name="price">

                                                <div class="add-container">
                                                    <div class="add-option-name-btn active">Add option name</div>

                                                    <div class="add-block">
                                                        <div class="block-edit">
                                                            <label for="en-option">en</label>
                                                            <input type="text" id="en-option" name="en-option">

                                                            <label for="ru-option">ru</label>
                                                            <input type="text" id="ru-option" name="ru-option">

                                                            <label for="ko-option">ko</label>
                                                            <input type="text" id="ko-option" name="ko-option">

                                                            <label for="ar-option">ar</label>
                                                            <input type="text" id="ar-option" name="ar-option">

                                                            <div class="change-buttons">
                                                                <button type="button"
                                                                    class="act-btn save-btn-option-name">Save option name</button>
                                                                <button type="button"
                                                                    class="act-btn cancel-btn-option-name">Cancel</button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>


                                                <div class="change-buttons">
                                                    <button type="button" class="act-btn add-btn-option">Save
                                                        option</button>
                                                    <button type="button"
                                                        class="act-btn cancel-btn-option">Cancel</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
        </div>

        <div class="change-buttons-container">
            <div class="change-buttons">
                
                <button type="button" class="act-btn exit-btn-item-editor">Exit editor</button>
            </div>
            <button type="button" class="act-btn delete-btn delete-btn-item-editor">Delete item</button>
        </div>
    `;

        return block;
    }

    function renderEditOptionVariants(tr) {
        if (tr.en === "Standard") {
            return `
                <div class="add-container">
                                                    <div class="add-option-name-btn active">Add option name</div>

                                                    <div class="add-block">
                                                        <div class="block-edit">
                                                            <label for="en-option">en</label>
                                                            <input type="text" id="en-option" name="en-option">

                                                            <label for="ru-option">ru</label>
                                                            <input type="text" id="ru-option" name="ru-option">

                                                            <label for="ko-option">ko</label>
                                                            <input type="text" id="ko-option" name="ko-option">

                                                            <label for="ar-option">ar</label>
                                                            <input type="text" id="ar-option" name="ar-option">

                                                            <div class="change-buttons">
                                                                <button type="button"
                                                                    class="act-btn save-btn-option-name">Save
                                                                    name</button>
                                                                <button type="button"
                                                                    class="act-btn cancel-btn-option-name">Cancel</button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
            `
        } else {
            return `
            <label>en</label>
                    <input type="text" class="option-name-en" value="${tr.en || ""}">
                    <label>ru</label>
                    <input type="text" class="option-name-ru" value="${tr.ru || ""}">
                    <label>ko</label>
                    <input type="text" class="option-name-ko" value="${tr.ko || ""}">
                    <label>ar</label>
                    <input type="text" class="option-name-ar" value="${tr.ar || ""}">
            `
        }
    }

    function renderOption(option) {
        const tr = {};
        option.translations.forEach(t => tr[t.language] = t.name || "");

        return `
        <div class="option-container" data-id="${option.id}">
            <div class="option-block">
                <div>${tr.en || "Standard"} / ${option.price}</div>
                
                <img src="../../images/edit-btn.svg" class="edit-btn edit-btn-option">
            </div>

            <div class="add-block">
                <div class="block-edit">
                    <label>Position</label>
                    <input type="number" class="option-position" value="${option.position + 1}">

                    <label for="price">Price</label>
                    <input type="number" id="price" name="price" value="${option.price}>

                    ${renderEditOptionVariants(tr)}

                    <div class="change-buttons-container">
                        <div class="change-buttons">
                            <button type="button" class="act-btn save-btn-option">Save option changes</button>
                            <button type="button" class="act-btn exit-btn-option">Exit</button>
                        </div>
                        <button type="button" class="act-btn delete-btn delete-btn-option">Delete option</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    }





    // открыть editor блюда
    let itemEditorContainer = document.querySelector('.item-editor-main-container')
    function addListenerEditItem() {
        let itemBlocks = document.querySelectorAll('.item-block')


        itemBlocks.forEach(itemBlock => {
            itemBlock.addEventListener('click', async () => {

                let itemId = itemBlock.dataset.id

                await loadItemEditor(itemId);


                itemBlocks.forEach(itemBlock => {
                    itemBlock.classList.remove('active')
                })

                itemBlock.classList.add('active')

                addItemContainer.classList.add("hidden")
                itemEditorContainer.classList.remove('hidden')
            })
        })
    }

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
    function initOptionEditors() {


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


                    addOptionNameContainer.querySelector('.add-option-name-btn').classList.add('active')

                    // document.querySelectorAll('.add-option-name-btn').forEach(btn => {
                    //     btn.classList.add('active')
                    // })
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

                // while (addOptionNameContainer.parentElement && addOptionNameContainer.parentElement.classList.contains('.add-container')) {
                //     addOptionNameContainer.parentElement.querySelector('.add-option-name-btn').classList.add('active')
                // }

                addOptionNameContainer.querySelector('.add-option-name-btn').classList.add('active')
            })
        })
    }


    // сохрание всех изменений блюда

    function initItemSave() {
        // let saveBtnItemEditor = document.querySelector('.save-btn-item-editor')
        let exitBtnItemEditor = document.querySelector('.exit-btn-item-editor')

        // saveBtnItemEditor.addEventListener('click', () => {
        //     let valid = true
        //     let allEditorFields = itemEditorContainer.querySelectorAll('input, textarea')

        //     for (const field of allEditorFields) {
        //         if (!field.value.trim() && !field.closest('.add-block')) {
        //             alert('Not all fields are filled in')
        //             valid = false
        //             return
        //         }
        //     }




        //     if (valid) {
        //         alert('Changes have been successfully applied.')
        //     }
        // })


        exitBtnItemEditor.addEventListener('click', () => {




            itemEditorContainer.classList.add('hidden')

            itemBlocks.forEach(itemBlock => {
                itemBlock.classList.remove('active')
            })
        })
    }



    // изменить изображение
    function initImageUpload() {
        let changeImg = document.querySelector('.change-img')

        changeImg.addEventListener('click', () => {
            changeImg.classList.remove('active')
            changeImg.closest('.block-edit').querySelector('.add-block').classList.add('active')
        })


        // подвердить/отменить изменение изображения

        let confirmImgChange = document.querySelector('.confirm-img-btn')
        let cancelImgChange = document.querySelector('.cancel-img-btn')

        confirmImgChange.addEventListener('click', () => {

            let changeImgBlock = confirmImgChange.closest('.block-edit')
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
            let changeImgBlock = cancelImgChange.closest('.add-block')

            changeImgBlock.classList.remove('active')
            changeImgBlock.closest('.block-edit').querySelector('.change-img').classList.add('active')


        })
    }

});