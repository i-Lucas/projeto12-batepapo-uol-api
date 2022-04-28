import express from "express";
import mongodb from "mongodb";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const server = express();
server.use(cors(), express.json());

server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.SERVER_PORT}`);
});

const mongoClient = new mongodb.MongoClient(process.env.MONGO_PORT);
let db;

mongoClient.connect().then(() => {
	db = mongoClient.db("meu_lindo_projeto");
});