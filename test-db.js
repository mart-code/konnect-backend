import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const databaseUrl = process.env.DATABASE_URL;

console.log("Testing connection to:", databaseUrl);

mongoose
  .connect(databaseUrl)
  .then(() => {
    console.log("SUCCESS: Connected to MongoDB");
    process.exit(0);
  })
  .catch((err) => {
    console.error("FAILURE: Failed to connect to MongoDB");
    console.error("Error details:", err);
    process.exit(1);
  });
