import express from "express";
import cors from "cors";
import mongodb from "mongodb";
import dotenv from "dotenv";

dotenv.config();
const server = express();
server.use(cors(), express.json());
server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});