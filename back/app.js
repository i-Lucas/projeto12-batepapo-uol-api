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
    })

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
})


app.post("/joitest", (req, res) => {

    const dados = req.body;
    console.log(dados)

    const dados_schema = joi.object({

        titulo: joi.string().required(),
        preparo: joi.string().required(),
        ingredientes: joi.string().required(),
    });

    const validate = dados_schema.validate(dados);
    if (validate.error) return res.status(404).send(validate.error.details[0].message);

    res.sendStatus(200);

});