import express from "express";
import cors from "cors";
import * as sql from "mssql";
import * as middleware from "../middleware/errorHandler";
import dotenv from "dotenv";

dotenv.config();
declare global {
  var db: sql.ConnectionPool;
}
// Import the new payments router
import authRoutes from "../routes/auth.routes";
import userRoutes from "../routes/userRoutes";
import vetProfileRoutes from "../routes/vetProfileRoutes";
import serviceRoutes from "../routes/serviceRoutes";
import vetServiceRoutes from "../routes/vetServiceRoutes";
import reviewRoutes from "../routes/reviewRoutes";
import appointmentRoutes from "../routes/appointmentRoutes";
import paymentRoutes from "../routes/payments.routes"; // <--- NEW IMPORT

const app = express();
app.use(cors());
app.use(express.json()); 
app.use(middleware.logger);

const dbConfig: sql.config = {
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "12344321",
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_NAME || "vet",
  options: {
    encrypt: false,
    enableArithAbort: true,
  },
};
sql
  .connect(dbConfig)
  .then((pool) => {
    console.log("Database connected");
    global.db = pool;
  })
  .catch((err) => console.error("Database connection failed:", err));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vetprofile", vetProfileRoutes); 
app.use("/api/services", serviceRoutes);
app.use("/api/vetservices", vetServiceRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/payments", paymentRoutes); // <--- NEW ROUTE MOUNTED
app.use(middleware.errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(` API running on http://localhost:${PORT}`)
);