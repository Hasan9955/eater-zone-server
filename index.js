const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;




// middleware
app.use(cors())
app.use(express.json())








const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.udflnrf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const usersCollection = client.db('Users_DB').collection('user')
        const productsCollection = client.db('Product_DB').collection('product')




        app.get('/products', async (req, res) => {
            const userEmail = req.query?.email
            const query = { email: userEmail }
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })


        app.get('/products/:id', async (req, res) =>{
            const id = req.params.id
            const query = {_id: new ObjectId(id)}
            const result = await productsCollection.findOne(query)
            res.send(result)
        })


        app.post('/users', async (req, res) => {
            const data = req.body
            const result = await usersCollection.insertOne(data)
            res.send(result)
        })


        app.post('/products', async (req, res) => {
            const data = req.body
            const result = await productsCollection.insertOne(data)
            res.send(result)
        })

        app.delete('/delete/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await productsCollection.deleteOne(query)
            res.send(result)
        })




        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);










app.get('/', (req, res) => {
    res.send('Eater Zone server is running')
})

app.listen(port, () => {
    console.log(`Eater zone server is running on port: ${port}`)
})
