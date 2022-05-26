const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const OrderCollection = client.db("OrderCollection").collection("order");
        const Usercollection = client.db("Usercollection").collection("users");
        const ReviewCollection = client.db("ReviewCollection").collection("review");


        // Send Logged User Data on server

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email.toLowerCase()
            const user = req.body
            const filter = { email: email }
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            };
            const result = await Usercollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token })
        })

        // Update User Info
        app.put('/myprofile/:email', async (req, res) => {
            const email = req.params.email
            const updateUser = req.body
            const filter = { email: email };
            const options = { upsert: true };
            const updateDocument = {
                $set: updateUser
            };
            const result = await Usercollection.updateOne(filter, updateDocument, options)

            res.send(result)

        })

        // Admin Check
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email
            const user = await Usercollection.findOne({ email: email })
            const isadmin = user?.role === 'admin'
            res.send({ admin: isadmin })

        })

        // Make Admin Api

        app.put('/user/admin/:email', async (req, res) => {
            const email = req.params.email
            const requester = req.decoded.email
            const requesterAccount = await Usercollection.findOne({ email: requester })
            if (requesterAccount.role == 'admin') {
                const filter = { email: email }
                const updateDoc = {
                    $set: { role: 'admin' }
                }
                const result = await Usercollection.updateOne(filter, updateDoc)
                res.send(result)
            }
            else {
                return res.status(403).send({ message: 'Forbidden Access', erorCode: 403 })
            }

        })

        // Get All USers
        app.get('/users', async (req, res) => {
            const query = {};
            const cursor = Usercollection.find(query);
            const result = (await cursor.toArray())
            res.send(result)
        })
        // Get user Data
        app.get('/myfrofiledata/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email };
            const cursor = Usercollection.find(query);
            const result = await cursor.toArray()
            res.send(result)
        })


        // Get All Products
        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = ProductsCollection.find(query);
            const result = (await cursor.toArray()).reverse()
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

        // Update Product After Order
        app.put('/product/:id', async (req, res) => {
            const id = req.params.id
            const Updatedproductquantity = req.body
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    availableQuantity: Updatedproductquantity.reamining
                }
            };
            const result = await ProductsCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })

        // Add A Order
        app.post('/addorder', async (req, res) => {
            const order = req.body
            const result = await OrderCollection.insertOne(order);
            res.send(result)

        })
        // Get All Order
        app.get('/orders', async (req, res) => {
            const query = {};
            const cursor = OrderCollection.find(query);
            const result = (await cursor.toArray()).reverse()
            res.send(result)
        })
        // Get My Order
        app.get('/myorder/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email };
            const cursor = OrderCollection.find(query);
            const result = await cursor.toArray()
            res.send(result)
        })

        // Add A Review
        app.post('/addreview', async (req, res) => {
            const product = req.body
            const result = await ReviewCollection.insertOne(product);
            res.send(result)

        })
        // Get All Review from server
        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = ReviewCollection.find(query);
            const result = (await cursor.toArray()).reverse()
            res.send(result)
        })

        // Cancel Order   Api from my order page
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const result = await OrderCollection.deleteOne(query);
            res.send(result)

        })
        // Delete product Api
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const result = await ProductsCollection.deleteOne(query);
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