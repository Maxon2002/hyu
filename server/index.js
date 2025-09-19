import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import menuRoutes from "./routes/menu.js";
import bookingRoutes from "./routes/booking.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;


// app.use((req, res, next) => {
//     console.log("Incoming request:", req.method, req.url);
//     next();
// });
// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// отдаём статику (фронтенд папка "client")
app.use(express.static(path.join(process.cwd(), "client")));

// маршруты
app.use("/", menuRoutes);
app.use("/api/reservation", bookingRoutes);
app.use("/api/auth", authRoutes);

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});