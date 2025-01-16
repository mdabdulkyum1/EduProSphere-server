const express = require('express');
const app = express();
const stripe = require('stripe')('sk_test_51QfhLYKCphGy46gXvGzFkZkfM6gFMbNmJ3dUtu1QnkQBX5qLXnQQakLbDrPzerg6noTUQZo5BTjpmCxxcFKGmYe000zTFPF81b')
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const port = process.env.PORT || 5000;

// mid
app.use(cors());
app.use(express.json());






const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@cluster0.kzmhu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();

    
    const usersCollection = client.db("eduProSphereDB").collection("users");


    // jwt apis 
    app.post('/jwt', async (req, res)=> {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '365d'})
      res.send({ token })
    })

    // mislayers 
    const verifyToken = (req, res, next) => {
      // console.log("inside verifyToken",req.headers.authorization);
      
      if(!req.headers.authorization){
        return res.status(401).send({ message: 'unauthorized access' })
      }
      
      const token = req.headers.authorization;
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
          return res.status(401).send({ message: 'unauthorized access' });
        }
        req.decoded = decoded
        next();
      })
    }

    const verifyAdmin = async (req, res, next) => {
        const email = req.decoded.email;
        const query = { email }
        const user = await usersCollection.findOne(query);
        const isAdmin = user?.role === 'admin';
        if(!isAdmin){
          return res.status(403).send({ message: 'forbidden access'})
        }        
        next();
    }

    // user related apis
    app.get('/users/role/:email', async (req, res)=> {
      const email = req.params.email;
      const filter = {email}
      const result = await usersCollection.findOne(filter);
      const role = result?.role;
      res.send({role});
    })


    app.get('/users/:email', verifyToken, verifyAdmin, async(req, res)=>{
       const email = req.params.email;

       const query = { email: { $ne: email} };
       const cursor = await usersCollection.find(query).toArray();
       res.send(cursor);
    })
    app.post('/users', async (req, res) => {
      const userInfo = req.body;
      const email = userInfo?.email;
      const query = { email };
    
      const isExist = await usersCollection.findOne(query);
    
      if (isExist) {
        return res.send("User already has an account");
      }
      const userWithRole = {
        ...userInfo,
        role: "student", 
      };
    
      const result = await usersCollection.insertOne(userWithRole);
      res.send(result);
    });
    
    app.patch('/user/:id', verifyToken, verifyAdmin, async(req, res)=> {
        const id = req.params.id;
        const info = req.body;
        const query = { _id: new ObjectId(id) }
        const updateDoc = {
          $set:{
             ...info
          }
        }
        const result = await usersCollection.updateOne(query, updateDoc);
        res.send(result);
    })
    app.delete('/user/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await usersCollection.deleteOne(query);
        res.send(result);
    })




   //==================================================
   //                 Payments related api
  app.post('/create-payment-intent', async (req, res)=>{
    const { price } = req.body;
    const amount = parseInt(price*100);

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"]
    });

    res.send({ clientSecret: paymentIntent.client_secret })
  })

  app.get('/payments/:email', verifyToken, async(req, res)=> {
      const email = req.params.email;
      const query = { email }

      if(email !== req.decoded.email){
        return res.status(403).send({message: "forbidden access"})
      }

      const result = await paymentCollection.find(query).toArray();
      res.send(result);
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



app.get('/', (req, res)=> {
    res.send("final project running...");
})
app.listen(port, ()=>{
    console.log(`server running on PORT: ${port}`);
})
