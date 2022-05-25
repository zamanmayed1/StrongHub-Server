const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion ,ObjectId} = require('mongodb');
const port = process.env.PORT || 5000;
const app = express()
// middleware
app.use(cors())
app.use(express.json())
app.use(bodyParser.json())

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden' })
        }
        req.decoded = decoded;
        next();
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.3dogvsv.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const ProductsCollection = client.db("ProductsCollection").collection("products");

        console.log('Mongodb Connected');


        app.post('/login', (req, res) => {
            const user = req.body;
            console.log(user);

            if (user) {
                const accessToken = jwt.sign({
                    email: user.email
                },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: '1h' })
                res.send({
                    success: true,
                    accessToken: accessToken
                })
            }
            else {
                res.status(401).send({ success: false });
            }
        })
        // Get All Products
        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = ProductsCollection.find(query);
            const result = await cursor.toArray()
            res.send(result)
        })
        // Add A Product
        app.post('/addproduct', async (req, res) => {
            const product = req.body
            const result = await ProductsCollection.insertOne(product);
            res.send(result)

        })
        // get a single Product
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const result = await ProductsCollection.findOne(query)
            res.send(result)
        })


        app.get('/', (req, res) => {
            res.send('Stock Room Server IS Running On Heroku ')
        })

    } finally {

    }
}
run().catch(console.dir);
app.listen(port, () => {
    console.log("server is  running on ", port);
})