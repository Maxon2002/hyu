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
    let wrapperItemOption
    const wrapperItemOptionAdder = document.getElementById("itemOptionAdderWrapper");
    let categoriesArr = []
    let itemsArr = []
    let optionsArr = []

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


                if (isNaN(newPosition) || newPosition <= 0) {
                    return alert('Position must be a valid positive number');
                }

                if (newPosition > categoriesArr.length) {
                    return alert('Position should not exceed the number of categories');
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

                document.querySelector('.item-editor-main-container')?.classList.add('hidden')
                document.querySelector('.add-item-main-container')?.classList.add('hidden')
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

            optionsArr = [];
            data.item.variants.forEach(variant => {
                optionsArr.push(variant)
            });


            wrapperItemEditor.innerHTML = ""; // очистить старые данные

            wrapperItemEditor.appendChild(renderItemEditor(data.item));

            wrapperItemOption = document.getElementById('itemOptionWrapper')

            initMainChangesItem()
            initOptionEditors()
            initAddOption()
            initAddOptionGeneral()
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
            <div class="block-edit-name">Option / Price</div>

            <div id="itemOptionWrapper">
                ${item.variants.map(renderOption).join("")}
            </div>
            <div class="add-container">
                                        <div class="add-option-btn active">Add option</div>

                                        <div class="add-block">
                                            <div class="block-edit">
                                                <div class="item-name">New option</div>

                                                <label for="position">Position</label>
                                                <input type="number" class="option-position" name="position" required>

                                                <label for="price">Price</label>
                                                <input type="number" id="price" name="price" required>

                                                <div class="add-container">
                                                    <div class="add-option-name-btn active">Add option name</div>

                                                    <div class="add-block">
                                                        <div class="block-edit">
                                                            <label for="en-option">en</label>
                                                            <input type="text" class="option-name-en" name="en-option">

                                                            <label for="ru-option">ru</label>
                                                            <input type="text" class="option-name-ru" name="ru-option">

                                                            <label for="ko-option">ko</label>
                                                            <input type="text" class="option-name-ko" name="ko-option">

                                                            <label for="ar-option">ar</label>
                                                            <input type="text" class="option-name-ar" name="ar-option">

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
                                                    <button type="button" class="act-btn add-btn-option-editor">Save new option</button>
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
                                                            <input type="text" class="option-name-en" name="en-option">

                                                            <label for="ru-option">ru</label>
                                                            <input type="text" class="option-name-ru" name="ru-option">

                                                            <label for="ko-option">ko</label>
                                                            <input type="text" class="option-name-ko" name="ko-option">

                                                            <label for="ar-option">ar</label>
                                                            <input type="text" class="option-name-ar" name="ar-option">

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
                    <input type="text" class="option-name-en" value="${tr.en || ""}" required>
                    <label>ru</label>
                    <input type="text" class="option-name-ru" value="${tr.ru || ""}" required>
                    <label>ko</label>
                    <input type="text" class="option-name-ko" value="${tr.ko || ""}" required>
                    <label>ar</label>
                    <input type="text" class="option-name-ar" value="${tr.ar || ""}" required>
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
                    <input type="number" class="option-position" value="${option.position + 1}" required>

                    <label for="price">Price</label>
                    <input type="number" id="price" name="price" value="${option.price}" required>

                    ${renderEditOptionVariants(tr)}

                    <div class="change-buttons-container">
                        <div class="change-buttons">
                            <button type="button" class="act-btn save-btn-option">Save option</button>
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


    function initMainChangesItem() {


        // сохранить изменение позиции блюда
        let saveChangeItemPosition = document.querySelector('.save-item-position-btn')

        saveChangeItemPosition.addEventListener('click', async () => {
            let itemEditorBlock = saveChangeItemPosition.closest('.item-editor-block')
            let itemId = itemEditorBlock.dataset.id
            let newPosition = Number(saveChangeItemPosition.closest('.block-edit').querySelector('input[id=item-position]').value)

            if (isNaN(newPosition) || newPosition <= 0) {
                return alert('Position must be a valid positive number');
            }

            if (newPosition > itemsArr.length) {
                return alert('Position should not exceed the number of dishes in the category');
            }

            try {
                const response = await fetch('/api/menuManager/item/update/position', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        itemId,
                        position: newPosition - 1
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    alert(data.message || 'Error updating position');
                    return;
                }

                alert('Position updated successfully');

                await loadItems(data.item.categoryId)

                document.querySelectorAll('.item-block').forEach(itemBlock => {
                    if (itemBlock.dataset.id === data.item.id) {
                        itemBlock.classList.add('active')
                    }
                })

            } catch (err) {
                console.error(err);
                alert('Server error');
            }

        })


        // сохранить изменения названия блюда
        let saveChangeItemName = document.querySelector('.save-item-name-btn')

        saveChangeItemName.addEventListener('click', async () => {
            let itemEditorBlock = saveChangeItemName.closest('.item-editor-block')
            let itemId = itemEditorBlock.dataset.id

            let blockEdit = saveChangeItemName.closest('.block-edit')

            const fields = blockEdit.querySelectorAll("input");

            // ---- Валидация ----
            let valid = true;

            fields.forEach(f => {
                if (!f.value.trim()) valid = false;
            });

            if (!valid) {
                alert("All name fields are required");
                return;
            }

            // ---- Формирование данных ----
            const translations = {
                en: blockEdit.querySelector('input[id="en-item-name"]').value.trim(),
                ru: blockEdit.querySelector('input[id="ru-item-name"]').value.trim(),
                ko: blockEdit.querySelector('input[id="ko-item-name"]').value.trim(),
                ar: blockEdit.querySelector('input[id="ar-item-name"]').value.trim()
            };


            // ---- Отправляем на сервер ----
            try {
                const res = await fetch("/api/menuManager/item/update/name", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        itemId,
                        translations
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    alert(data.error || "Error updating item name");
                    return;
                }

                alert('Item name has been successfully updated.')

                document.querySelectorAll('.item-block').forEach(itemBlock => {
                    if (itemBlock.dataset.id === data.item.id) {
                        itemBlock.querySelector('.item-name').innerHTML = translations.en
                    }
                })

            } catch (err) {
                console.error(err);
                alert("Server error");
            }

        })



        // сохранить изменения описания блюда
        let saveChangeItemDescription = document.querySelector('.save-item-description-btn')

        saveChangeItemDescription.addEventListener('click', async () => {
            let itemEditorBlock = saveChangeItemDescription.closest('.item-editor-block')
            let itemId = itemEditorBlock.dataset.id

            let blockEdit = saveChangeItemDescription.closest('.block-edit')

            const fields = blockEdit.querySelectorAll("textarea");

            // ---- Валидация ----
            let valid = true;

            fields.forEach(f => {
                if (!f.value.trim()) valid = false;
            });

            if (!valid) {
                alert("All description fields are required");
                return;
            }

            // ---- Формирование данных ----
            const translations = {
                en: blockEdit.querySelector('textarea[id="en-item-description"]').value.trim(),
                ru: blockEdit.querySelector('textarea[id="ru-item-description"]').value.trim(),
                ko: blockEdit.querySelector('textarea[id="ko-item-description"]').value.trim(),
                ar: blockEdit.querySelector('textarea[id="ar-item-description"]').value.trim()
            };


            // ---- Отправляем на сервер ----
            try {
                const res = await fetch("/api/menuManager/item/update/description", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        itemId,
                        translations
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    alert(data.error || "Error updating item name");
                    return;
                }

                alert('Item description has been successfully updated.')


            } catch (err) {
                console.error(err);
                alert("Server error");
            }

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

        confirmImgChange.addEventListener('click', async () => {
            // Находим блок блюда, чтобы получить itemId
            let itemEditorBlock = confirmImgChange.closest('.item-editor-block');
            let itemId = itemEditorBlock.dataset.id;

            let blockEdit = confirmImgChange.closest('.add-block')

            let imageInput = blockEdit.querySelector('#item-image-file')


            if (imageInput.files.length === 0) {
                alert("Please select an image");
                return;
            }

            const formData = new FormData();
            formData.append("image", imageInput.files[0]);
            formData.append("itemId", itemId);

            try {
                const res = await fetch("/api/menuManager/item/update/image", {
                    method: "POST",
                    body: formData
                });

                const data = await res.json();

                if (!res.ok) {
                    alert(data.error || "Error updating image");
                    return;
                }

                alert("Image successfully updated");

                // Мгновенно обновляем изображение в UI
                const imgEl = itemEditorBlock.querySelector(".item-img");

                imgEl.src = `/images/food/${data.images.small}?t=${Date.now()}`;
                // cache-busting через ?t=timestamp

                // Очищаем input
                imageInput.value = "";

                // Скрываем блок выбора 
                blockEdit.classList.remove("active");
                changeImg.classList.add('active')


            } catch (err) {
                console.error(err);
                alert("Server error");
            }
        });


        cancelImgChange.addEventListener('click', () => {
            let changeImgBlock = cancelImgChange.closest('.add-block')
            let imageInput = changeImgBlock.querySelector('#item-image-file')
            imageInput.value = ""

            changeImgBlock.classList.remove('active')
            changeImgBlock.closest('.block-edit').querySelector('.change-img').classList.add('active')


        })
    }



    function initOptionEditors() {

        // открыть редактор опции
        let editBtnsOption = document.querySelectorAll('.edit-btn-option')

        editBtnsOption.forEach(editBtnOption => {
            editBtnOption.addEventListener('click', () => {

                const optionBlock = editBtnOption.closest('.option-container');
                const optionId = optionBlock.dataset.id;

                const option = optionsArr.find(c => c.id === optionId);

                const blockEdit = optionBlock.querySelector('.add-block');

                // 🔄 ПЕРЕД ОТКРЫТИЕМ — снова заполняем поля актуальными данными
                function fillOptinEditForm(block, option) {
                    const tr = {};
                    option.translations.forEach(t => tr[t.language] = t.name || "");
                    // position
                    block.querySelector('input[class="option-position"]').value = option.position + 1;
                    block.querySelector('input[id="price"]').value = option.price
                    // translations
                    if (tr.en === "Standard") {
                        block.querySelector('input[class="option-name-en"]').value = "";
                        block.querySelector('input[class="option-name-ru"]').value = "";
                        block.querySelector('input[class="option-name-ko"]').value = "";
                        block.querySelector('input[class="option-name-ar"]').value = "";
                    } else {
                        block.querySelector('input[class="option-name-en"]').value = tr.en || "";
                        block.querySelector('input[class="option-name-ru"]').value = tr.ru || "";
                        block.querySelector('input[class="option-name-ko"]').value = tr.ko || "";
                        block.querySelector('input[class="option-name-ar"]').value = tr.ar || "";
                    }
                }
                fillOptinEditForm(blockEdit, option);

                // Показать/скрыть блок
                blockEdit.classList.toggle('active');


            })
        })


        // сохранить изменеия опции

        let saveBtnsOption = document.querySelectorAll('.save-btn-option')

        saveBtnsOption.forEach(saveBtnOption => {
            saveBtnOption.addEventListener('click', async () => {

                const blockEdit = saveBtnOption.closest(".add-block");
                const optionBlock = saveBtnOption.closest(".option-container");
                const optionId = optionBlock.dataset.id;
                const fields = blockEdit.querySelectorAll("input");

                let itemEditorBlock = saveBtnOption.closest('.item-editor-block');
                let itemId = itemEditorBlock.dataset.id;

                // ---- Валидация ----
                let valid = true;

                fields.forEach(f => {
                    if (!f.value.trim() && f.hasAttribute('required')) {

                        valid = false;
                    }
                });

                if (!valid) {
                    alert("Position and price are required");
                    return;
                }

                const newPosition = Number(blockEdit.querySelector('input[class="option-position"]').value);


                if (isNaN(newPosition) || newPosition <= 0) {
                    return alert('Position must be a valid positive number');
                }

                if (newPosition > optionsArr.length) {
                    return alert('Position should not exceed the number of options');
                }

                const price = blockEdit.querySelector('input[id="price"]').value.trim()

                // ---- Формирование данных ----

                let translations
                let trCheck = true

                fields.forEach(f => {
                    if (!f.value.trim() && !f.hasAttribute('required')) {

                        translations = null
                        trCheck = false
                    }
                });

                if (trCheck) {
                    translations = {
                        en: blockEdit.querySelector('input[class="option-name-en"]').value.trim(),
                        ru: blockEdit.querySelector('input[class="option-name-ru"]').value.trim(),
                        ko: blockEdit.querySelector('input[class="option-name-ko"]').value.trim(),
                        ar: blockEdit.querySelector('input[class="option-name-ar"]').value.trim()
                    };
                }



                const payload = {
                    optionId,
                    itemId,
                    position: newPosition - 1,
                    price,
                    translations
                };

                // ---- Отправляем на сервер ----
                try {
                    const res = await fetch("/api/menuManager/itemOption/update", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        alert(data.error || "Error updating option");
                        return;
                    }


                    optionsArr = [];
                    data.item.variants.forEach(variant => {
                        optionsArr.push(variant)
                    });


                    wrapperItemOption.innerHTML = ""
                    wrapperItemOption.innerHTML = data.item.variants.map(renderOption).join("")

                    initOptionEditors()
                    // initAddOption()
                    // initAddOptionGeneral()

                    alert('Option has been successfully updated.')

                } catch (err) {
                    console.error(err);
                    alert("Server error");
                }


            })
        })



        let exitBtnsOption = document.querySelectorAll('.exit-btn-option')

        exitBtnsOption.forEach(exitBtnOption => {
            exitBtnOption.addEventListener('click', () => {

                let addBlock = exitBtnOption.closest('.add-block')

                addBlock.classList.remove('active')

                if (addBlock.querySelector('.add-container')) {
                    let addContainer = addBlock.querySelector('.add-container')
                    addContainer.querySelector('.add-block').classList.remove('active')
                    addContainer.querySelector('.add-option-name-btn').classList.add('active')

                    addContainer.querySelector('.add-option-name-btn').textContent = "Add option name"
                }

            })
        })


        let deleteBtnsOption = document.querySelectorAll('.delete-btn-option')

        deleteBtnsOption.forEach(deleteBtn => {
            deleteBtn.addEventListener('click', async () => {

                const optionContainer = deleteBtn.closest(".option-container");
                const optionId = optionContainer.dataset.id;


                if (!confirm("Are you sure you want to delete this option?")) return;


                try {
                    const res = await fetch(`/api/menuManager/itemOption/delete/${optionId}`, {
                        method: "DELETE"
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        alert(data.error || "Error updating option");
                        return;
                    }


                    optionsArr = [];
                    data.item.variants.forEach(variant => {
                        optionsArr.push(variant)
                    });


                    wrapperItemOption.innerHTML = ""
                    wrapperItemOption.innerHTML = data.item.variants.map(renderOption).join("")

                    initOptionEditors()
                    // initAddOption()
                    // initAddOptionGeneral()


                    alert("Option deleted");


                } catch (err) {
                    console.error(err);
                    alert("Server error");
                }

            })
        })
    }

    function initAddOption() {



        // открыть добавление опции блюда
        let addOptionBtn = document.querySelector('.add-option-btn')


        addOptionBtn.addEventListener('click', () => {

            let addOptionContainer = addOptionBtn.closest('.add-container')

            addOptionContainer.querySelector('input[class="option-position"]').value = optionsArr.length + 1


            addOptionBtn.classList.remove('active')
            addOptionContainer.querySelector('.add-block').classList.add('active')


        })

        // сохранить добавленную опцию блюда/отменить
        let addSaveBtnOption = document.querySelector('.add-btn-option-editor')

        addSaveBtnOption.addEventListener('click', async () => {


            let addOptionContainer = addSaveBtnOption.closest('.add-container')
            let blockEdit = addOptionContainer.querySelector('.add-block')
            let fields = blockEdit.querySelectorAll('input')

            let itemEditorBlock = addSaveBtnOption.closest('.item-editor-block');
            let itemId = itemEditorBlock.dataset.id;

            let valid = true

            fields.forEach(f => {
                if (!f.value.trim() && f.hasAttribute('required')) valid = false;
            });

            if (!valid) {
                alert("Position and price are required");
                return;
            }

            const newPosition = Number(blockEdit.querySelector('input[class="option-position"]').value);


            if (isNaN(newPosition) || newPosition <= 0) {
                return alert('Position must be a valid positive number');
            }

            if (newPosition > optionsArr.length + 1) {
                return alert(`Position should not exceed ${optionsArr.length + 1}`);
            }

            const price = blockEdit.querySelector('input[id="price"]').value.trim()

            // ---- Формирование данных ----

            let translations
            let trCheck = true

            fields.forEach(f => {
                if (!f.value.trim() && !f.hasAttribute('required')) {

                    translations = null
                    trCheck = false
                }
            });

            if (trCheck) {
                translations = {
                    en: blockEdit.querySelector('input[class="option-name-en"]').value.trim(),
                    ru: blockEdit.querySelector('input[class="option-name-ru"]').value.trim(),
                    ko: blockEdit.querySelector('input[class="option-name-ko"]').value.trim(),
                    ar: blockEdit.querySelector('input[class="option-name-ar"]').value.trim()
                };
            }



            const payload = {
                itemId,
                position: newPosition - 1,
                price,
                translations
            };

            try {
                const res = await fetch("/api/menuManager/itemOption/add", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (!res.ok) {
                    alert(data.error || "Error adding option");
                    return;
                }


                optionsArr = [];
                data.item.variants.forEach(variant => {
                    optionsArr.push(variant)
                });


                fields.forEach(field => {
                    field.value = ""
                })

                addOptionContainer.querySelector('.add-option-name-btn').textContent = "Add option name"

                // addOptionContainer.querySelectorAll('.add-block').forEach(block => {
                //     block.classList.remove('active')
                // })
                blockEdit.classList.remove('active')

                addOptionContainer.querySelector('.add-option-btn').classList.add('active')


                wrapperItemOption.innerHTML = ""
                wrapperItemOption.innerHTML = data.item.variants.map(renderOption).join("")

                initOptionEditors()
                // initAddOption()
                // initAddOptionGeneral()

                alert('Option has been successfully added.')

            } catch (error) {
                console.error(error);
                alert("Server error");
            }
        })

    }
    function initAddOptionGeneral() {
        let cancelBtnsOption = document.querySelectorAll('.cancel-btn-option')
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

                addOptionContainer.querySelector('.add-option-btn')?.classList.add('active')
                addOptionContainer.querySelector('.add-option-btn-adder')?.classList.add('active')
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
                        if (field.classList.contains('option-name-en')) {
                            addOptionNameContainer.querySelector('.add-option-name-btn').textContent = field.value.trim()
                        }
                    })

                    saveBtnOptionName.closest('.add-block').classList.remove('active')
                    addOptionNameContainer.querySelector('.add-option-name-btn').classList.add('active')
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

                addOptionNameContainer.querySelector('.add-option-name-btn').classList.add('active')
            })
        })
    }



    // сохрание всех изменений блюда

    function initItemSave() {
        // let saveBtnItemEditor = document.querySelector('.save-btn-item-editor')
        let exitBtnItemEditor = document.querySelector('.exit-btn-item-editor')

        exitBtnItemEditor.addEventListener('click', () => {

            itemEditorContainer.classList.add('hidden')
            wrapperItemEditor.innerHTML = ""
            let itemBlocks = document.querySelectorAll('.item-block')

            itemBlocks.forEach(itemBlock => {
                itemBlock.classList.remove('active')
            })
        })


        let deleteItemBtn = document.querySelector('.delete-btn-item-editor')

        deleteItemBtn.addEventListener('click', async () => {

            let itemEditorBlock = deleteItemBtn.closest('.item-editor-block')
            let itemId = itemEditorBlock.dataset.id

            if (!confirm("Are you sure you want to delete this item?")) return;


            try {
                const res = await fetch(`/api/menuManager/item/delete/${itemId}`, {
                    method: "DELETE"
                });

                const data = await res.json();

                if (!res.ok) {
                    alert(result.error || "Delete error");
                    return;
                }


                itemEditorContainer.classList.add('hidden')
                wrapperItemEditor.innerHTML = ""
                alert("Item deleted");
                // Перезагрузить список блюд
                await loadItems(data.item.categoryId)



            } catch (err) {
                console.error(err);
                alert("Server error");
            }


        })
    }









    // открыть окно добавления блюда 

    let openAddItem = document.querySelector('.add-item-btn')
    let addItemContainer = document.querySelector('.add-item-main-container')

    openAddItem.addEventListener('click', () => {


        addItemContainer.querySelector('input[id="item-position"]').value = itemsArr.length + 1

        itemEditorContainer.classList.add('hidden')
        let itemBlocks = document.querySelectorAll('.item-block')

        itemBlocks.forEach(itemBlock => {
            itemBlock.classList.remove('active')
        })

        addItemContainer.classList.remove("hidden")
    })


    // открыть добавление опции блюда
    let addOptionBtnAdder = document.querySelector('.add-option-btn-adder')

    addOptionBtnAdder.addEventListener('click', () => {

        let addOptionContainer = addOptionBtnAdder.closest('.add-container')

        addOptionContainer.querySelector('input[class="option-position"]').value = tempOptionsArr.length + 1


        addOptionBtnAdder.classList.remove('active')
        addOptionContainer.querySelector('.add-block').classList.add('active')


    })

    // 

    let cancelBtnOptionAdder = document.querySelector('.cancel-btn-option-adder')

    cancelBtnOptionAdder.addEventListener('click', () => {
        let addOptionContainer = cancelBtnOptionAdder.closest('.add-container')
        let fields = addOptionContainer.querySelectorAll('input')
        fields.forEach(field => {
            field.value = ""
        })

        let addOptionNameBtn = addOptionContainer.querySelector('.add-option-name-btn-adder')
        addOptionNameBtn.textContent = "Add option name"


        addOptionContainer.querySelectorAll('.add-block').forEach(block => {
            block.classList.remove('active')
        })

        addOptionNameBtn.classList.add('active')


        addOptionContainer.querySelector('.add-option-btn-adder').classList.add('active')
    })


    // добавить имя опции блюда 
    let addOptionNameBtnAdder = document.querySelector('.add-option-name-btn-adder')

    addOptionNameBtnAdder.addEventListener('click', () => {
        addOptionNameBtnAdder.classList.remove('active')
        addOptionNameBtnAdder.closest('.add-container').querySelector('.add-block').classList.add('active')
    })


    // сохранить добавленное имя опции блюда/отменить
    let saveBtnOptionNameAdder = document.querySelector('.save-btn-option-name-adder')
    let cancelBtnOptionNameAdder = document.querySelector('.cancel-btn-option-name-adder')


    saveBtnOptionNameAdder.addEventListener('click', () => {

        let addOptionNameContainer = saveBtnOptionNameAdder.closest('.add-container')
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
                if (field.classList.contains('option-name-en')) {
                    addOptionNameContainer.querySelector('.add-option-name-btn-adder').textContent = field.value.trim()
                }
            })

            saveBtnOptionNameAdder.closest('.add-block').classList.remove('active')
            addOptionNameContainer.querySelector('.add-option-name-btn-adder').classList.add('active')
        }
    })



    cancelBtnOptionNameAdder.addEventListener('click', () => {
        let addOptionNameContainer = cancelBtnOptionNameAdder.closest('.add-container')
        let fields = addOptionNameContainer.querySelectorAll('input')

        fields.forEach(field => {
            field.value = ""
            addOptionNameContainer.querySelector('.add-option-name-btn-adder').textContent = "Add option name"
        })

        cancelBtnOptionNameAdder.closest('.add-block').classList.remove('active')

        addOptionNameContainer.querySelector('.add-option-name-btn-adder').classList.add('active')
    })



    // 

    function renderTempOption(option) {
        const el = document.createElement('div');
        el.className = 'option-block';
        el.id = String(option.position);

        el.innerHTML = `          
            <div>${option.translations.en} / ${option.price}</div>           
            <img src="../../images/delete-icon.svg" class="edit-btn delete-icon-btn-option">
            `;

        return el;
    }


    let saveOptionBtnAdder = document.querySelector('.add-btn-option-adder')
    let tempOptionsArr = []


    saveOptionBtnAdder.addEventListener('click', () => {

        let addOptionContainer = saveOptionBtnAdder.closest('.add-container')
        let blockEdit = addOptionContainer.querySelector('.add-block')
        let fields = blockEdit.querySelectorAll('input')


        let valid = true

        fields.forEach(f => {
            if (!f.value.trim() && f.hasAttribute('required')) valid = false;
        });

        if (!valid) {
            alert("Position and price are required");
            return;
        }

        const newPosition = Number(blockEdit.querySelector('input[class="option-position"]').value);


        if (isNaN(newPosition) || newPosition <= 0) {
            return alert('Position must be a valid positive number');
        }

        if (newPosition > tempOptionsArr.length + 1) {
            return alert(`Position should not exceed ${tempOptionsArr.length + 1}`);
        }

        const price = blockEdit.querySelector('input[id="price"]').value.trim()


        let translations
        let trCheck = true

        fields.forEach(f => {
            if (!f.value.trim() && !f.hasAttribute('required')) {

                trCheck = false
            }
        });

        if (trCheck) {
            translations = {
                en: blockEdit.querySelector('input[class="option-name-en"]').value.trim(),
                ru: blockEdit.querySelector('input[class="option-name-ru"]').value.trim(),
                ko: blockEdit.querySelector('input[class="option-name-ko"]').value.trim(),
                ar: blockEdit.querySelector('input[class="option-name-ar"]').value.trim()
            };
        } else {
            translations = {
                en: "Standard",
                ru: "Стандарт",
                ko: "기본",
                ar: "عادي"
            };
        }


        // 1. Сдвигаем позиции существующих опций
        tempOptionsArr = tempOptionsArr.map(opt => {
            if (opt.position >= newPosition - 1) {
                return { ...opt, position: opt.position + 1 }
            }
            return opt
        })

        // 2. Создаём новый объект
        let optionObj = {
            position: newPosition - 1,
            price,
            showLabel: trCheck,
            translations
        }

        // 3. Добавляем новую опцию
        tempOptionsArr.push(optionObj)

        // 4. Сортируем по position
        tempOptionsArr.sort((a, b) => a.position - b.position)




        wrapperItemOptionAdder.innerHTML = ""

        tempOptionsArr.forEach(option => {
            wrapperItemOptionAdder.appendChild(renderTempOption(option));
        });


        initDeleteIconBtn()



        fields.forEach(field => {
            field.value = ""
        })

        addOptionContainer.querySelector('.add-option-name-btn').textContent = "Add option name"


        blockEdit.classList.remove('active')

        addOptionContainer.querySelector('.add-option-btn-adder').classList.add('active')
    })


    function initDeleteIconBtn() {
        let deleteIcons = document.querySelectorAll('.delete-icon-btn-option')

        deleteIcons.forEach(deleteBtn => {
            deleteBtn.addEventListener('click', () => {
                let optionBlock = deleteBtn.closest('.option-block')
                let optionPosition = Number(optionBlock.id)

                // 1. Удаляем элемент с этой позицией
                tempOptionsArr = tempOptionsArr.filter(opt => opt.position !== optionPosition)

                // 2. Сдвигаем позиции у оставшихся
                tempOptionsArr = tempOptionsArr.map(opt => {
                    if (opt.position > optionPosition) {
                        return { ...opt, position: opt.position - 1 }
                    }
                    return opt
                })

                wrapperItemOptionAdder.innerHTML = ""

                tempOptionsArr.forEach(option => {
                    wrapperItemOptionAdder.appendChild(renderTempOption(option));
                });


                initDeleteIconBtn()


            })
        })
    }






    // добавить новое блюдо/отменить
    let addItemBtn = document.querySelector('.save-btn-add-item')
    let cancelAddItemBtn = document.querySelector('.exit-btn-add-item')



    addItemBtn.addEventListener('click', async () => {

        let categoryId = document.querySelector('.category-block-info.active').closest('.category-block').dataset.id


        let valid = true
        let addItemMainContainer = addItemBtn.closest('.add-item-main-container')
        let allAdderFields = addItemMainContainer.querySelectorAll('input, textarea')

        for (const field of allAdderFields) {
            if (!field.value.trim() && !field.closest('.add-container')) {

                valid = false
            }
        }

        if (!valid) {
            alert('Not all fields are filled in')
            return
        }

        if (tempOptionsArr.length === 0) {
            alert('At least one option is requeried')
            return
        }

        let imageInput = addItemMainContainer.querySelector('#item-image-file')


        if (imageInput.files.length === 0) {
            alert("Please select an image");
            return;
        }

        // формируем объект запроса

        let itemPosition = Number(addItemMainContainer.querySelector('input[id="item-position"]').value);
        if (isNaN(itemPosition) || itemPosition <= 0) {
            return alert('Position must be a valid positive number');
        }
        if (itemPosition > itemsArr.length + 1) {
            return alert(`Position should not exceed ${itemsArr.length + 1}`);
        }

        let translationsName = {
            en: addItemMainContainer.querySelector('input[id="en-item-name"]').value.trim(),
            ru: addItemMainContainer.querySelector('input[id="ru-item-name"]').value.trim(),
            ko: addItemMainContainer.querySelector('input[id="ko-item-name"]').value.trim(),
            ar: addItemMainContainer.querySelector('input[id="ar-item-name"]').value.trim()
        };

        let translationsDescription = {
            en: addItemMainContainer.querySelector('textarea[id="en-item-description"]').value.trim(),
            ru: addItemMainContainer.querySelector('textarea[id="ru-item-description"]').value.trim(),
            ko: addItemMainContainer.querySelector('textarea[id="ko-item-description"]').value.trim(),
            ar: addItemMainContainer.querySelector('textarea[id="ar-item-description"]').value.trim()
        };

        itemPosition--

        const formData = new FormData();
        formData.append("image", imageInput.files[0]);
        formData.append("categoryId", categoryId);
        formData.append("itemPosition", itemPosition);
        formData.append("translationsName", JSON.stringify(translationsName));
        formData.append("translationsDescription", JSON.stringify(translationsDescription));
        formData.append("options", JSON.stringify(tempOptionsArr));


        try {
            const res = await fetch("/api/menuManager/item/add", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Error updating option");
                return;
            }


            await loadItems(categoryId)

            alert('Item has been successfully added.')


            addItemMainContainer.classList.add("hidden")

            wrapperItemOptionAdder.innerHTML = ""

            addItemMainContainer.querySelectorAll('input, textarea').forEach(field => {
                field.value = ""
            })
            tempOptionsArr = []


        } catch (err) {
            console.error(err);
            alert("Server error");
        }

    })



    cancelAddItemBtn.addEventListener('click', () => {



        addItemContainer.classList.add("hidden")

        wrapperItemOptionAdder.innerHTML = ""

        addItemContainer.querySelectorAll('input, textarea').forEach(field => {
            field.value = ""
        })

        tempOptionsArr = []
    })



});