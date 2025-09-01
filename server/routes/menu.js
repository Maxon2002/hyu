import express from "express";
const router = express.Router();

const supportedLangs = ["en", "ru", "ko", "ar"];

router.get("/menu", (req, res) => {
  const acceptLang = req.headers["accept-language"] || "";
  const userLang = acceptLang.split(",")[0].split("-")[0];

  // получаем query-строку, если она есть
  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";

  // если язык поддерживается — редиректим в папку
  if (supportedLangs.includes(userLang) && userLang !== "en") {
    res.redirect(`/menu/${userLang}/${query}`);
  } else {
    // по умолчанию английский
    res.redirect(`/menu/${query}`);
  }
});

export default router;