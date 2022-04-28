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
    })
});

server.get("/", (req, res) => {
    res.send('Hello World');
});

server.post("/devinsert", (req, res) => {

    const dev = { email: "development-test@email.com", password: "super-secret-password" };

    database.collection("development_test").insertOne({ dev }).then(() => {
        return res.status(200).send("Inserted successfully!");
    }).catch(err => {
        return res.status(400).send("Error while inserting: ", err);
    })
})

server.get("/devfind/:find", (req, res) => {

    // "development-test@email.com"
    const find = req.params.find;

    database.collection("development_test").findOne({ email: find }).then(result => {
        if (result === null) return res.status(404).send("Not found!");
        res.send(result).status(200);
    }).catch(err => {
        res.status(400).send("Error while fetching: ", err);
    })
})

server.get("/devlist", (req, res) => {

    database.collection("development_test").find().toArray().then(result => {
        if (result.length === 0) return res.status(404).send("Empty list!");
        res.send(result).status(200);
    }).catch(err => {
        res.status(400).send("Error while fetching: ", err);
    });
})

server.post("/devdelet", (req, res) => {

    database.collection("development_test").drop().then(() => {
        res.status(200).send("Deleted successfully!");
    }).catch(err => {
        res.status(400).send("Error while deleting: ", err);
    })
});