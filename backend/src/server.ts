import * as dotenv from "dotenv";
import express from "express";
import * as colors from "colors";
import connectDB from "e:/backup/comrpessed/devcamper-api-finished/devcamper-api/config/db";

// Enabel colors in our terminal
colors.enable();

// Load env variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  );
});
