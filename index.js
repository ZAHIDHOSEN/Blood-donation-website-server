const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;




app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1befr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // collection
    const districtCollection = client.db('bloodBD').collection('district');
    const upazilaCollection = client.db('bloodBD').collection('upazila');
    const usersCollection = client.db('bloodBD').collection('users');


    // user related apis

    app.get('/users', async(req,res) =>{
      const result = await usersCollection.find().toArray();
      res.send(result)
    });

    app.post('/users', async(req, res)=>{
      const user = req.body;

      const query = {email: user.email}
      const existingUser = await usersCollection.findOne(query);
      if(existingUser){
        return res.send({message: 'user already exist', insertedId: null})
      }
      const result = await usersCollection.insertOne(user);
      res.send(result)
    })

    // admin related apis

    app.patch('/users/admin/:id', async(req,res) =>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc = {
        $set: {
          role: 'admin'

        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc)
      res.send(result); 

    })


    app.get('/users', async(req, res) =>{

      const email = req.query.email;
       const query = {email: email}
      const result = await usersCollection.findOne(query)
      res.send(result)

    })


    app.patch('/users/:id', async(req,res) =>{
      const item = req.body;
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
        $set: {
          name: item.name,
          avatar:item.avatar,
          district: item.district,
          upazila: item.upazila,
          group: item.group
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc)
      res.send(result);

    })





    // district related collection

    app.get('/district', async(req, res) =>{
      const cursor = districtCollection.find();
      const result = await cursor .toArray();
      res.send(result);

    })


    // upazila releted apis

    app.get('/upazila',async(req,res) =>{
      const cursor = upazilaCollection.find();
      const result = await cursor .toArray();
      res.send(result)
    })



    

    



  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res)=>{
    res.send('Blood donation campaign is running')
})



app.listen(port, () =>{
    console.log(`This is blood donation website : ${port}`)

})


