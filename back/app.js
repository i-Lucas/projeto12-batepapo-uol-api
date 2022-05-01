import express from "express";
import mongodb from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import joi from "joi";

dotenv.config();
const app = express();
app.use(cors(), express.json());

let db = null;

app.listen(process.env.SERVER_PORT, () => {

    console.log(`Server is running on port ${process.env.SERVER_PORT}`);
    const mongoClient = new mongodb.MongoClient(process.env.MONGO_PORT);

    mongoClient.connect().then(() => {
        db = mongoClient.db(process.env.DATABASE_NAME);
        console.log("Connected to database successfully! Happy hacking !");

    }).catch(err => {
        console.log("Error while connecting to database: ", err);
    })
});

app.post('/participants', async (req, res) => {

    const username = req.body.name;
    const data = req.body;

    const schema = joi.object({
        name: joi.string().alphanum().min(3).max(10).required()
    });

    const validate = schema.validate(data);
    if (validate.error) return res.status(422).send(validate.error.details[0].message);

    try {
        const exists = await db.collection('participants').findOne({ username })
        if (exists) return res.status(409).send('username already exists');

        await db.collection('participants').insertOne({ username, lastStatus: Date.now() })

        const message = { from: username, to: 'Todos', text: 'entra da sala...', type: 'status', time: new Date().toLocaleTimeString() };
        const dbcollection_messages = db.collection("messages");
        await dbcollection_messages.insertOne(message);

        return res.status(201).send("user registered successfully");

    } catch (error) {
        console.error(error);
        return res.status(500).send("error while accessing database");
    }
});

app.get('/participants', async (req, res) => {

    try {
        const participants = await db.collection('participants').find().toArray();
        return res.status(200).send(participants);

    } catch (error) {
        console.error(error);
        return res.status(500).send("error while accessing database");
    }
});

app.post('/messages', async (req, res) => {

    const data = req.body;
    const from = req.headers.user;
    const { to, text, type } = data;

    const schema = joi.object({
        to: joi.string().alphanum().min(3).max(10).required(),
        text: joi.string().min(1).max(100).required(),
        type: joi.string().valid('message', 'private_message').required()
    });

    const validate = schema.validate(data);
    if (validate.error) return res.status(422).send(validate.error.details[0].message);

    try {

        const messages = db.collection("messages");
        const message = { from, to, text, type, time: new Date().toLocaleTimeString() };
        await messages.insertOne(message);
        res.send(200);

    } catch (error) {
        console.error(error);
        return res.status(500).send("error while accessing database");
    }
});

app.get("/messages", async (req, res) => {

    const limit = req.query.limit;
    const header = req.headers.user;

    try {

        const messages = db.collection("messages");
        const messages_list = await messages.find().toArray();
        const user_messages = messages_list.filter(message => message.to === header || message.from === header);
        if (limit === 0) return res.send(user_messages);
        const messages_limit = user_messages.slice(user_messages.length - limit);
        return res.status(200).send(messages_limit);

    } catch (error) {
        console.error(error);
        return res.status(500).send("error while accessing database");
    }
});

app.post("/status", async (req, res) => {

    const header = req.headers.user;

    try {

        const participants = db.collection("participants");
        const validate = await participants.findOne({ username: header });
        if (!validate) return res.status(404).send("user disconnected");

        const lastStatus = Date.now();
        await participants.updateOne({ username: header }, { $set: { lastStatus } });

        const participants_list = await participants.find().toArray();
        const participants_to_remove = participants_list.filter(participant => participant.lastStatus > lastStatus - 15000);

        if (participants_to_remove > 0) {

            await participants.deleteMany({ username: { $in: participants_to_remove.map(participant => participant.username) } });
            const message = { from: header, to: 'Todos', text: 'sai da sala...', type: 'status', time: new Date().toLocaleTimeString() };
            const messages = db.collection("messages");
            await messages.insertOne(message);
        }

        res.sendStatus(200);

    } catch (error) {

        console.error(error);
        return res.status(500).send("error while accessing database");
    }

});