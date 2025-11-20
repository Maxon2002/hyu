import express from "express";
import jwt from "jsonwebtoken";
import { authenticateAdmin } from "../utils/auth.js";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const router = express.Router();



// получить все категории
router.get("/categories", async (req, res) => {
    try {
        const categories = await prisma.menuCategory.findMany({
            orderBy: { position: "asc" },
            include: {
                translations: true
            }
        });

        res.json({ success: true, categories });
    } catch (err) {
        console.error("Error loading categories:", err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});


function makeSlug(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// обновить категорию
router.put("/category/update", async (req, res) => {
    const { id, position, translations } = req.body;

    if (!id || position === undefined || !translations) {
        return res.status(400).json({ error: "Missing data" });
    }

    try {
        // 1. Получаем категорию
        const category = await prisma.menuCategory.findUnique({
            where: { id },
            include: { translations: true }
        });

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        const oldPosition = category.position;

        // 2. Получаем общее количество категорий
        const total = await prisma.menuCategory.count();

        if (position < 0 || position >= total) {
            return res.status(400).json({ error: "Invalid position" });
        }

        // --------------------------------------------
        //       ЛОГИКА СМЕЩЕНИЯ ДРУГИХ КАТЕГОРИЙ
        // --------------------------------------------

        if (position !== oldPosition) {
            if (position > oldPosition) {
                // сдвиг вверх → позиции old+1..new уменьшить на 1
                await prisma.menuCategory.updateMany({
                    where: {
                        position: {
                            gt: oldPosition,
                            lte: position
                        }
                    },
                    data: { position: { decrement: 1 } }
                });
            } else {
                // сдвиг вниз → позиции new..old-1 увеличить на 1
                await prisma.menuCategory.updateMany({
                    where: {
                        position: {
                            gte: position,
                            lt: oldPosition
                        }
                    },
                    data: { position: { increment: 1 } }
                });
            }
        }

        // 3. Обновляем саму категорию
        // вычисляем slug из английского названия
        const newSlug = makeSlug(translations.en);


        const updated = await prisma.menuCategory.update({
            where: { id },
            data: {
                slug: newSlug,
                position,
                translations: {
                    deleteMany: {},

                    create: Object.entries(translations).map(([language, title]) => ({
                        language,
                        title
                    }))
                }
            },
            include: { translations: true }
        });

        res.json({ category: updated });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// добавить категорию
router.post("/category/add", async (req, res) => {
    try {
        const { position, translations } = req.body;

        if (position === undefined || !translations)
            return res.status(400).json({ error: "Missing data" });


        // 2. Получаем общее количество категорий
        const total = await prisma.menuCategory.count();

        if (position < 0 || position > total) {
            return res.status(400).json({ error: "Invalid position" });
        }

        const oldPosition = total;

        // --------------------------------------------
        //       ЛОГИКА СМЕЩЕНИЯ ДРУГИХ КАТЕГОРИЙ
        // --------------------------------------------

        if (position !== oldPosition) {

            // сдвиг вниз → позиции new..old-1 увеличить на 1
            await prisma.menuCategory.updateMany({
                where: {
                    position: {
                        gte: position,
                        lt: oldPosition
                    }
                },
                data: { position: { increment: 1 } }
            });

        }


        // 3. Добавляем саму категорию
        // вычисляем slug из английского названия
        const newSlug = makeSlug(translations.en);


        const category = await prisma.menuCategory.create({
            data: {
                slug: newSlug,
                position, // уже приходит position - 1
                translations: {
                    create: Object.entries(translations).map(([language, title]) => ({
                        language,
                        title
                    }))
                }
            }
        });



        res.json({ success: true, category });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});


// удалить категорию
router.delete("/category/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Находим категорию и её позицию
        const category = await prisma.menuCategory.findUnique({
            where: { id },
            select: { id: true, position: true }
        });

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        const deletedPosition = category.position;

        // --------------------------------------------
        //       2. УДАЛЯЕМ ВСЕ СВЯЗАННЫЕ ДАННЫЕ
        // --------------------------------------------

        // Сначала получаем все items категории, чтобы удалить variants
        const items = await prisma.menuItem.findMany({
            where: { categoryId: id },
            select: { id: true }
        });

        const itemIds = items.map(i => i.id);

        if (itemIds.length > 0) {
            // Удаляем переводы вариантов
            await prisma.menuItemVariantTranslation.deleteMany({
                where: { variant: { itemId: { in: itemIds } } }
            });

            // Удаляем варианты
            await prisma.menuItemVariant.deleteMany({
                where: { itemId: { in: itemIds } }
            });

            // Удаляем переводы items
            await prisma.menuItemTranslation.deleteMany({
                where: { itemId: { in: itemIds } }
            });

            // Удаляем сами items
            await prisma.menuItem.deleteMany({
                where: { id: { in: itemIds } }
            });
        }

        // Удаляем переводы категории
        await prisma.menuCategoryTranslation.deleteMany({
            where: { categoryId: id }
        });

        // Удаляем категорию
        await prisma.menuCategory.delete({
            where: { id }
        });

        // --------------------------------------------
        //     3. РЕОРГАНИЗУЕМ ПОЗИЦИИ (смещаем вверх)
        // --------------------------------------------
        await prisma.menuCategory.updateMany({
            where: {
                position: { gt: deletedPosition }
            },
            data: {
                position: { decrement: 1 }
            }
        });

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});



// октрытие блюд категории
router.get("/category/items/:categoryId", async (req, res) => {
    try {
        const { categoryId } = req.params;

        // существует ли категория?
        const category = await prisma.menuCategory.findUnique({
            where: { id: categoryId }
        });

        if (!category) {
            return res.status(404).json({ success: false, error: "Category not found" });
        }

        const items = await prisma.menuItem.findMany({
            where: { categoryId },
            include: {
                translations: true
            },
            orderBy: { position: 'asc' }
        });

        res.json({ success: true, items });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});


// открыть эдитор блюда 
router.get("/item/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const item = await prisma.menuItem.findUnique({
            where: { id },
            include: {
                translations: true,
                variants: {
                    include: {
                        translations: true
                    },
                    orderBy: { position: "asc" }
                }
            }
        });

        if (!item) {
            return res.json({ success: false, error: "Item not found" });
        }

        res.json({ success: true, item });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});











export default router;