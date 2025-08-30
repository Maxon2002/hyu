import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import menuRoutes from "./routes/menu.js";
import bookingRoutes from "./routes/booking.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// отдаём статику (фронтенд папка "client")
app.use(express.static(path.join(process.cwd(), "client")));

// маршруты
app.use("/", menuRoutes);
app.use("/api/reservation", bookingRoutes);

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});