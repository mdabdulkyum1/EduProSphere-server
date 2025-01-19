require('dotenv').config()
const express = require('express');
const app = express();
const stripe = require('stripe')(process.env.PAYMENT_SECRET);
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;

// mid
const corsOptions = {
  origin: ['https://server-blond-xi-62.vercel.app'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
};
app.use(cors(corsOptions));
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
    
    const usersCollection = client.db("eduProSphereDB").collection("users");
    const teachersCollection = client.db("eduProSphereDB").collection("teachers");
    const classesCollection = client.db("eduProSphereDB").collection("classes");
    const paymentCollection = client.db("eduProSphereDB").collection("payments");
    const assignmentCollection = client.db("eduProSphereDB").collection("assignments");
    const feedbackCollection = client.db("eduProSphereDB").collection("feedbacks");


    // jwt apis 
    app.post('/jwt', async (req, res)=> {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '365d'})
      res.send({ token })
    })
 
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
    app.get('/user-profile/:email', async (req, res)=> {
      const email = req.params.email;
      const filter = {email}
      const result = await usersCollection.findOne(filter);
      res.send(result);
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

    // Teacher related api
    app.post('/teacher', verifyToken, async (req, res)=> {
        const teacherData = req.body;
        const result = await teachersCollection.insertOne(teacherData);
        res.send(result);
    })
    app.get('/teacher-request',  verifyToken,verifyAdmin, async(req, res)=> {
      const result = await teachersCollection.find().toArray();
      res.send(result);
    })
    app.get('/my-request/:email', verifyToken, async(req, res)=> {
        const email = req.params.email;
        const query = {email};
        const result = await teachersCollection.findOne(query);
        res.send(result);
    })
    app.patch('/teacher-request', verifyToken, verifyAdmin, async(req, res)=> {
        
        const {id, email, status, role} = req.body;
        const query = {_id: new ObjectId(id)};
        const filter = {email}
        const updateDoc = {
          $set: {
            status: status
          }
        }
        const updateData = {
          $set: {
            role: role
          }
        }
        const updateUserRole = await usersCollection.updateOne(filter, updateData)
        const result = await teachersCollection.updateOne(query, updateDoc);
        const data = {
          updatedUserRole: updateUserRole,
          updatedRequestStatus: result
      }
        res.send(data);
    })
    app.patch('/teacher-rejected', verifyToken, verifyAdmin, async(req, res)=> {
    
        const {id, status } = req.body;
        const query = {_id: new ObjectId(id)};
        const updateDoc = {
          $set: {
            status: status
          }
        }
   
        const result = await teachersCollection.updateOne(query, updateDoc);
        res.send(result);
    })
    app.patch('/teacher-pending', verifyToken, async(req, res)=> {
    
        const {id, status } = req.body;
        const query = {_id: new ObjectId(id)};
        const updateDoc = {
          $set: {
            status: status
          }
        }
   
        const result = await teachersCollection.updateOne(query, updateDoc);
        res.send(result);
    })

    // ========================================================================================
    //      ======================== Classes Api =======================================
    // ========================================================================================
    app.get('/all-classes', async (req, res)=> {
      const query = { status: "accepted" }
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    })
    app.get('/popular-classes', async (req, res)=> {
      const popularClasses = await classesCollection
      .find({status: "accepted"})
      .sort({totalEnrolment: -1})
      .limit(6)
      .toArray();
      res.send(popularClasses);
    })
    app.get('/class-details/:id', async (req, res)=> {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await classesCollection.findOne(query);
        res.send(result);
    })
    app.post('/classes', verifyToken, async (req, res) => {
        const classData = req.body;
        const result = await classesCollection.insertOne(classData);
        res.send(result);
    })
    app.get('/classes', verifyToken, async (req, res) => {
        const email = req.query.email;
        const query = {email}
        const result = await classesCollection.find(query).toArray();
        res.send(result);
    })
    app.get('/class-request', verifyToken, verifyAdmin, async (req, res) => {
         const result = await classesCollection.find().toArray();
         res.send(result);
    });

    app.patch('/class-approve', verifyToken, verifyAdmin, async (req, res)=> {
          const { id, status } = req.body;
          const query = {_id: new ObjectId(id)}
          const updateDoc = {
            $set: {
              status
            }
          }
          const result = await classesCollection.updateOne(query, updateDoc);
          res.send(result);
    })
    app.patch('/class-reject', verifyToken, verifyAdmin, async (req, res)=> {
          const { id, status } = req.body;
          const query = {_id: new ObjectId(id)}
          const updateDoc = {
            $set: {
              status
            }
          }
          const result = await classesCollection.updateOne(query, updateDoc);
          res.send(result);
    })

   app.patch('/class-update', verifyToken, async(req, res)=> {
       const {id, title, price, description, photoUrl} = req.body;
       
       const filter = { _id: new ObjectId(id) };
       const updateDoc = {
          $set: {
            title,
            price,
            description,
            photoUrl
          }
       }
       const result = await classesCollection.updateOne(filter, updateDoc);
       res.send(result)

   })
   app.delete('/class-delete/:id',   verifyToken, async (req, res)=> {
    const id = req.params.id;  
    const query = { _id: new ObjectId(id)}
    const result = await classesCollection.deleteOne(query);
    res.send(result)
  })

 // 





   //==================================================
   //                 Payments related api
  app.post('/create-payment-intent',  verifyToken, async (req, res)=>{
    const payAmount = req.body;
    const price = payAmount?.price

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

  app.post('/payments', verifyToken, async (req, res)=> {
    const payment = req.body;
    const id = payment.classId;
    const query = { _id: new ObjectId(id)}
    const updateDoc = {
      $inc: {
        totalEnrolment: 1
      }
    }
    const updateResult = await classesCollection.updateOne(query, updateDoc);

    const paymentResult = await paymentCollection.insertOne(payment);
    res.send({
      paymentResult,
      updateResult,
    })
})
 
// enrolled-classes
app.get('/enrolled-classes/:email', verifyToken, async (req, res)=> {
    const email = req.params.email;
    const query  = {email};
    const result = await paymentCollection.find(query).toArray();
    res.send(result) 
})

// =============================================================
//      ============   assignments Apis ========================
// =============================================================
app.post('/assignments', verifyToken, async(req, res)=> {
  const assignmentData = req.body;
  const result = await assignmentCollection.insertOne(assignmentData);
  res.send(result)
})
app.get('/assignments/:id', verifyToken, async(req, res)=> {
  const id = req.params.id;
  const query = {classId: id}
  const result = await assignmentCollection.find(query).toArray();
  res.send(result)
})
app.get('/totalEnrollment/:id', verifyToken, async (req, res)=> {
  const id = req.params.id;
  const query = {_id: new ObjectId(id)};
  const result = await classesCollection.findOne(query);
  res.send({total: result?.totalEnrolment || 0 });

})

// get assignments 
app.get('/my-assignments/:id', verifyToken, async (req, res)=> {
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await paymentCollection.findOne(query);
  const classId = result?.classId;
  const filter = {classId}
  const myAssignments = await assignmentCollection.find(filter).toArray();
  res.send(myAssignments)
})

// ===========================================================
//    ================= feedback api ===================
// ===========================================================

app.post('/feedback', verifyToken, async (req, res)=> {
  const feedbackData = req.body;
  const result = await feedbackCollection.insertOne(feedbackData);
  res.send(result)
})

app.get('/all-feedbacks', async (req, res)=> {
  const result = await feedbackCollection.find().toArray();
  res.send(result)
})


  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res)=> {
    res.send("assignment 12 server running...");
})
app.listen(port, ()=>{
    console.log(`server running on PORT: ${port}`);
})
