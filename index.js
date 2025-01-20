const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://blood-donation-website-e55bf.web.app',
    'https://blood-donation-website-e55bf.firebaseapp.com'

   
  ],
  credentials: true
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1befr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );

    // collection
    const districtCollection = client.db("bloodBD").collection("district");
    const upazilaCollection = client.db("bloodBD").collection("upazila");
    const usersCollection = client.db("bloodBD").collection("users");
    const requestsCollection = client.db("bloodBD").collection("requests");
    const blogsCollection = client.db("bloodBD").collection("blogs");

    // jwt related apis
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "10h",
      });
      res.send({ token });
    });

    // middlewares
    const verifyToken = (req, res, next) => {
      console.log("inside verify token", req.headers.authorization);

      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorize access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorize access" });
        }
        req.decoded = decoded;
      });

      next();
    };

    // use verify admin

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // user related apis

    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;

      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exist", insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // admin role

    app.patch(
      "/users/admin/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            role: "admin",
          },
        };
        const result = await usersCollection.updateOne(filter, updatedDoc);
        res.send(result);
      }
    );

    // admin

    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const query = { email: email };
      const user = await usersCollection.findOne(query);

      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    // profile page get apis

    app.get("/users/profile", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    //  profile data related apis

    app.patch("/users/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          name: item.name,

          avatar: item.avatar,
          district: item.district,
          upazila: item.upazila,
          group: item.group,
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // requests related apis
    app.post('/requests', async(req, res) =>{
      const request = req.body;
      const newRequest = {
        ...request, 
        donationStatus: "pending"
      }
     
      const result = await requestsCollection.insertOne(newRequest);
      res.send(result)
    })

    // total request admin home

    app.get('/requests/adminHome',verifyToken, verifyAdmin, async(req,res) =>{
      const result = await requestsCollection.find().toArray();
      res.send(result);

    })


    

    app.get('/requests', async(req, res) =>{
      const email = req.query.email;
      const query ={"requester-email" : email}
      const result = await requestsCollection.find(query).toArray();
      res.send(result);
    })


    app.get('/requests/public', async(req,res) =>{
      const query = { donationStatus: "pending"}
      const result = await requestsCollection.find(query).toArray();
      res.send(result)

    })

    app.get('/requests/public/:id', verifyToken,async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await requestsCollection.findOne(query);
      res.send(result);
    })

    // admin request
    app.get('/requests/admin',verifyToken, verifyAdmin, async(req, res)=>{
      const result = await requestsCollection.find().toArray();
      res.send(result)
    })

    app.delete('/requests/:id',verifyToken, async(req,res) =>{
      const id = req.params.id;
      const query ={ _id: new ObjectId(id)}
      const result = await requestsCollection.deleteOne(query);
      res.send(result);

    })

    app.get('/requests/:id', async(req,res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await requestsCollection.findOne(query);
      res.send(result)
    })

    app.patch('/requests/:id', async(req, res) =>{
      const item = req.body;
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
        $set: {
          recipentName : item.recipentName,
          district : item.district,
          upazila: item.upazila,
          hospitalName : item.hospitalName,
          address : item.address,
          group : item.group,
          date: item.date,
          time: item.time,
          message: item.message


          
        }
      }
      const result = await requestsCollection.updateOne(filter, updatedDoc)
      res.send(result);

    })

    // blogs related apis

    app.post('/blogs', async(req, res) =>{
      const blog = req.body;
      const result = await blogsCollection.insertOne(blog);
      res.send(result)
    })

    app.get('/blogs', async(req, res) =>{
      const result = await blogsCollection.find().toArray();
      res.send(result)

    })

    app.get('/blogs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }; 
      const blog = await blogsCollection.findOne(query);
      res.send(blog);
    });



  





  

    // district related collection

    app.get("/district", async (req, res) => {
      const cursor = districtCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // upazila releted apis

    app.get("/upazila", async (req, res) => {
      const cursor = upazilaCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Blood donation campaign is running");
});

app.listen(port, () => {
  console.log(`This is blood donation website : ${port}`);
});


