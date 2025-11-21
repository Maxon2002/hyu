import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import menuRoutes from "./routes/menu.js";
import bookingRoutes from "./routes/booking.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import menuManager from "./routes/menu-manager.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const __dirname = path.resolve();


// middleware
app.use(cors());

app.use("/api/menuManager", menuManager);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// отдаём статику (фронтенд папка "client")
app.use(express.static(path.join(process.cwd(), "client")));

// маршруты
app.use("/", menuRoutes);
app.use("/api/reservation", bookingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);


app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});


// Указываем папку для EJS-шаблонов
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Публичные файлы (картинки, css, js)
// app.use("/public", express.static(path.join(__dirname, "../images")));
app.use("/images", express.static(path.join(__dirname, "client/images"))); 
app.use('/css', express.static(path.join(__dirname, 'client/css')));
app.use('/js', express.static(path.join(__dirname, 'client/js')));