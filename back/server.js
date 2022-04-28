import express from "express";
import mongodb from "mongodb";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const server = express();
server.use(cors(), express.json());
let database = undefined;

server.listen(process.env.SERVER_PORT, () => {

    console.log(`Server is running on port ${process.env.SERVER_PORT}`);
    const mongoClient = new mongodb.MongoClient(process.env.MONGO_PORT);

    mongoClient.connect().then(() => {
        console.log("Connected to database successfully! Happy hacking !");
        database = mongoClient.db("UOL_API");
    }).catch(err => {
        console.log("Error while connecting to database: ", err);
        server.close();
    })
});

