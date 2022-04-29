import express from "express";
import mongodb from "mongodb";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors(), express.json());

app.listen(process.env.SERVER_PORT, () => {
    console.log(`Server is running on port ${process.env.SERVER_PORT}`);
});

let db = null;
const mongo = new mongodb.MongoClient(process.env.MONGO_PORT);

app.post("/participants", async (req, res) => {

    const username = req.body.name;
    if (!username) return res.status(422).send("username cannot be empty");

    try {
        await mongo.connect();
        db = mongo.db(process.env.DATABASE_NAME);

        const dbcollection = db.collection("participants");
        const check_username = await dbcollection.findOne({ name: username });
        if (check_username) return res.status(409).send("username already exists");

        const user = { name: username, lastStatus: Date.now() };
        await dbcollection.insertOne(user);
        res.status(201).send("participant added successfully");
        mongo.close();

    } catch (error) {
        console.error(error);
        res.status(500).send("error while accessing database");
        mongo.close();
    }

});

app.get("/participants", async (req, res) => {

    try {
        await mongo.connect();
        db = mongo.db(process.env.DATABASE_NAME);

        const dbcollection = db.collection("participants");
        const participants = await dbcollection.find().toArray();
        res.send(participants);
        mongo.close();

    } catch (error) {
        console.error(error);
        res.status(500).send("error while accessing database");
        mongo.close();
    }

});

app.post("/messages", async (req, res) => {

    const header = req.headers.user;
    const { to, text, type } = req.body;

    if (!to || !text || !type) return res.status(422).send("to, text and type cannot be empty");
    if (type !== 'message' && type !== 'private_message') return res.status(422).send("type must be 'message' or 'private_message'");

    try {
        await mongo.connect();
        db = mongo.db(process.env.DATABASE_NAME);

        const dbcollection = db.collection("participants");
        const check_username = await dbcollection.findOne({ name: to });
        if (!check_username) return res.status(422).send("to must be a participant");

        const message = { from: header, to, text, type, time: new Date().toLocaleTimeString() };
        const dbcollection_messages = db.collection("messages");
        await dbcollection_messages.insertOne(message);
        res.status(201).send("message added successfully");
        mongo.close();

    } catch (error) {
        console.error(error);
        res.status(500).send("error while accessing database");
        mongo.close();
    }

});

app.get("/messages", async (req, res) => {

    const limit = parseInt(req.query.limit);
    const header = req.headers.user;

    try {
        await mongo.connect();
        db = mongo.db(process.env.DATABASE_NAME);

        const dbcollection = db.collection("messages");
        const all_messages = await dbcollection.find().toArray();
        const user_messages = all_messages.filter(message => message.to === header || message.from === header);

        if (limit === 0) return res.send(user_messages);
        const messages_limit = user_messages.slice(user_messages.length - limit);
        res.send(messages_limit);
        mongo.close();

    } catch (error) {
        console.error(error);
        res.status(500).send("error while accessing database");
        mongo.close();
    }

})


app.post("/status", async (req, res) => {

    const header = req.headers.user;

    try {
        await mongo.connect();
        db = mongo.db(process.env.DATABASE_NAME);

        const dbcollection = db.collection("participants");
        const check_username = await dbcollection.findOne({ name: header });
        if (!check_username) return res.status(404).send("user disconnected");

        const user = { name: header, lastStatus: Date.now() };
        await dbcollection.updateOne(user, { $set: user });
        res.status(200).send("status updated successfully");
        mongo.close();

    } catch (error) {
        console.error(error);
        res.status(500).send("error while accessing database");
        mongo.close();
    }

})


// app.post("/status", async (req, res) => {

//     const header = req.headers.user;

//     try {

//         await mongo.connect();
//         db = mongo.db(process.env.DATABASE_NAME);

//         const dbcollection = db.collection("participants");
//         const check_username = await dbcollection.findOne({ name: header });
//         if (!check_username) return res.status(404).send("user not found");

//         const user = { name: header, lastStatus: Date.now() };
//         await dbcollection.updateOne({ name: header }, { $set: user });

//         // const dbcollection = db.collection("participants");
//         const participants = await dbcollection.find().toArray();
//         const participants_to_remove = participants.filter(participant => participant.lastStatus < Date.now() - 10000);
//         await dbcollection.deleteMany({ name: { $in: participants_to_remove.map(participant => participant.name) } });

//         const message = { from: header, to: 'Todos', text: 'sai da sala...', type: 'status', time: new Date().toLocaleTimeString() };
//         const dbcollection_messages = db.collection("messages");
//         await dbcollection_messages.insertOne(message);
//         res.sendStatus(200);
//         mongo.close();

//     } catch (error) {

//         console.error(error);
//         res.status(500).send("error while accessing database");
//         mongo.close();
//     }
// })