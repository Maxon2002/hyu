import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

const supportedLangs = ["en", "ru", "ko", "ar"];

// старый маршрут /menu для редиректа по Accept-Language и с сохранением query
router.get("/menu", (req, res) => {
  const acceptLang = req.headers["accept-language"] || "";
  const userLang = acceptLang.split(",")[0].split("-")[0];

  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";

  if (supportedLangs.includes(userLang) && userLang !== "en") {
    res.redirect(`/menu/${userLang}/${query}`);
  } else {
    res.redirect(`/menu/${query}`);
  }
});

// новый маршрут для динамической генерации страницы с меню
router.get("/menu/:lang", async (req, res) => {
  const lang = supportedLangs.includes(req.params.lang) ? req.params.lang : "en";
  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";

  try {
    const categories = await prisma.menuCategory.findMany({
      orderBy: { position: "asc" },
      include: {
        translations: true,
        items: {
          orderBy: { position: "asc" },
          include: {
            translations: true,
            variants: {
              orderBy: { position: "asc" },
              include: { translations: true }
            }
          }
        }
      }
    });

    // подготовка данных под выбранный язык
    const menuData = categories.map(cat => {
      const catTitleObj = cat.translations.find(t => t.language === lang) || {};
      return {
        slug: cat.slug,
        title: catTitleObj.title || "",
        items: cat.items.map(item => {
          const itemTitleObj = item.translations.find(t => t.language === lang) || {};
          return {
            imageSmall: item.imageSmall,
            imageMedium: item.imageMedium,
            imageLarge: item.imageLarge,
            title: itemTitleObj.title || "",
            description: itemTitleObj.description || "",
            variants: item.variants.map(variant => {
              const variantNameObj = variant.translations.find(t => t.language === lang) || {};
              return {
                price: variant.price,
                showLabel: variant.showLabel,
                name: variantNameObj.name || ""
              };
            })
          };
        })
      };
    });

    // рендер EJS
    res.render("menu", { menu: menuData, lang, query });
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
});

export default router;