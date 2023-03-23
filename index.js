const { MongoClient, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const stripe = require("stripe")('sk_test_51M6AoIBSIlSsQgf2N7eHeJzPmd4aBzcD7V3VIUoqndAjtI7N4MN9x9RKVVabWfL9dRz87r842cRduHEsquEZmyQ500uVhrMSIE');
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('pHeroTask server is running')
})




const url = `mongodb+srv://server11:server11@cluster0.czo9kw9.mongodb.net/?retryWrites=true&w=majority`;
console.log(url);
const client = new MongoClient(url);

async function run() {
    try {
        const usersCollection = client.db('pHeroServer').collection('users');
        const courseCollection = client.db('pHeroServer').collection('PremiumCourse');
        //post user 
        app.post('/users', async (req, res) => {
            try {
                const users = req.body;
                const result = await usersCollection.insertOne(users);
                res.send(result)
            } catch (err) {
                res.send({
                    success: false,
                    error: err.message,
                })
            }
        });
        //get all users
        const PAGE_SIZE = 10;

        app.get('/allUsers', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const search = req.query.search;
            console.log(page, size, search);
            const query = {};
            if (search && search.trim() !== '') {
                // add multiple search fields and their values to the query object
                query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }];
            }

            const cursor = usersCollection.find(query);
            const users = await cursor.skip(page * size).limit(size).toArray();
            const count = await usersCollection.estimatedDocumentCount();
            res.send({ count, users })
        });

        app.put('/users/:id', async (req, res) => {
            const userId = req.params.id;
            const filter = { _id: new ObjectId(userId) };
            const update = { $set: { block: true } };
            const options = { returnOriginal: false };
            const result = await usersCollection.findOneAndUpdate(filter, update, options);
            res.send(result.value);
        });


        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            res.send({ isAdmin: user?.role === 'Admin' })
        })
        app.get('/users/learner/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            res.send({ isLearner: user?.role === 'learner' })
        })


        app.get('/premium', async (req, res) => {
            const query = {};
            const cursor = courseCollection.find(query);
            const course = await cursor.toArray();
            res.send(course)
        });
        app.get('/premium/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const course = await courseCollection.findOne(query)
            res.send(course)
        });

        app.post('/create-payment-intent', async (req, res) => {
            try {
                const premium = req.body;
                const price = premium.price;
                const amount = price * 100;

                const paymentIntent = await stripe.paymentIntents.create({
                    currency: "usd",
                    amount: amount,
                    "payment_method_types": [
                        "card"
                    ]
                });
                res.send({
                    clientSecret: paymentIntent.client_secret,
                });
            } catch (error) {
                console.log(error.message);
            }
        })




    }
    catch (err) {

    }
}

run();











app.listen(port, () => console.log(`programming hero task server is running on port ${port}`))