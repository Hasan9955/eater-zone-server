const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;




// middleware
app.use(cors({
    origin: ['http://localhost:5173',
    'https://eater-zone.web.app',
    'https://eater-zone.firebaseapp.com'
],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())










const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.udflnrf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


// make a won middleware for verifying token
const verifyToken = async (req, res, next) => {
    const token = req?.cookies?.token;
    if (!token) {
        return res.status(401).send({ massage: 'unauthorized access' })

    }
    jwt.verify(token, process.env.TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(401).send({ massage: 'unauthorized access' })
        }
        req.user = decoded
        next()
    })

}








async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const sliderCollection = client.db('Slider_DB').collection('slider')
        const usersCollection = client.db('Users_DB').collection('user')
        const productsCollection = client.db('Product_DB').collection('product')
        const cartCollection = client.db('Cart_DB').collection('cart')




        // create token 
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '1h' })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none'
                })
                .send({ massage: 'token created successfully' })
        })


        app.post('/logout', async (req, res) => {
            const user = req.body
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })




        app.get('/sliders', async (req, res) => {
            const result = await sliderCollection.find().toArray()
            res.send(result)
        })


        app.get('/allProducts', async (req, res) => {
            const product = await productsCollection.find().toArray()
            res.send(product)
        })

        app.get('/topProducts', async (req, res) => {
            const topProducts = await productsCollection
                .find({})
                .sort({ sold: -1 })
                .limit(6)
                .toArray()
            res.send(topProducts)
        })


        // get a single product using id
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await productsCollection.findOne(query)
            res.send(result)
        })

        // get added products
        app.get('/products', verifyToken, async (req, res) => {
            const userEmail = req.query?.email
            if (userEmail !== req.user?.email) {
                return res.status(403).send({ massage: 'forbidden' })
            }
            const query = { email: userEmail }
            const result = await productsCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/productsCount', async (req, res) => {
            const count = await productsCollection.estimatedDocumentCount()
            res.send({ count })
        })


        // get pagination data
        app.get('/pageProducts', async (req, res) => {
            const page = parseInt(req.query.page)
            const size = parseInt(req.query.size);
            const result = await productsCollection.find()
                .skip(page * size)
                .limit(size)
                .toArray();
            res.send(result);
        })



        app.get('/cart', verifyToken, async (req, res) => {
            const userEmail = req.query?.email
            if (userEmail !== req?.user?.email) {
                return res.status(403).send({ massage: 'forbidden' })
            }
            const query = { email: userEmail }
            const result = await cartCollection.find(query).toArray()
            res.send(result)
        })



        // make search functionality with food origin or food category
        app.get('/searchProduct/:value', async (req, res) => {
            const body = req.params.value
            const queryCat = { category: { $regex: new RegExp(body, 'i') } }
            const queryOrig = { origin: { $regex: new RegExp(body, 'i') } }
            const result = await productsCollection.find({ $or: [queryCat, queryOrig] }).toArray()
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



        // post product for cart 
        app.post('/cartPost', async (req, res) => {
            const data = req.body;
            const id = data.id
            const email = data.email
            const query = { id, email }
            const upQuantity = data.value
            const find = await cartCollection.findOne(query)
            if (find) {
                const result = await cartCollection.updateOne(query, { $inc: { quantity: upQuantity } })
                return res.send(result)
            }
            else {
                const result = await cartCollection.insertOne(data)
                return res.send(result)
            }

        })


        // update a product when a user add a product
        app.put('/cartUpdate/:id', async (req, res) => {
            const id = req.params.id
            const product = req.body;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const newProduct = {
                $set: {
                    quantity: product.NewQuantity,
                    sold: product.TotalSold
                }
            }
            const result = await productsCollection.updateOne(filter, newProduct, options)
            res.send(result)
        })



        // update from update page
        app.put('/update/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const product = req.body
            const newProduct = {
                $set: {
                    name: product.name,
                    email: product.email,
                    foodName: product.foodName,
                    category: product.category,
                    origin: product.origin,
                    price: product.price,
                    quantity: product.quantity,
                    description: product.description,
                    photo: product.photo,
                    sold: product.sold
                }
            }

            const result = await productsCollection.updateOne(filter, newProduct, options)
            res.send(result)
        })

        app.delete('/delete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await productsCollection.deleteOne(query)
            res.send(result)
        })

        app.delete('/cartDelete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await cartCollection.deleteOne(query)
            res.send(result)
        })




        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");

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
