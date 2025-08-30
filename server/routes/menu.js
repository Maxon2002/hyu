import express from "express";
const router = express.Router();

const supportedLangs = ["en", "ru", "ko", "ar"];

router.get("/menu", (req, res) => {
  const acceptLang = req.headers["accept-language"] || "";
  const userLang = acceptLang.split(",")[0].split("-")[0];

  // если язык поддерживается — редиректим в папку
  if (supportedLangs.includes(userLang) && userLang !== "en") {
    res.redirect(`/menu/${userLang}/`);
  } else {
    // по умолчанию английский
    res.redirect("/menu/");
  }
});

export default router;