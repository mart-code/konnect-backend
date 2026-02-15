import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import AuthRoutes from "./routes/AuthRoute.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const databaseUrl = process.env.DATABASE_URL;

app.use(cors({
  origin: [process.env.ORIGIN],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", AuthRoutes);

 app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

mongoose.connect(databaseUrl).then(() => {
  console.log("Connected to MongoDB");
}).catch(()=> {
  console.error("Failed to connect to MongoDB");
});


app.get("/", (req, res) => {
  res.send("Hello, World!");
});
