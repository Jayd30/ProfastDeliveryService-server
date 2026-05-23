const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const cors=require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// herologistic
// ix42sw6LwKtowJwc

app.use(cors({
  origin:"http://localhost:5173"
}))
app.use(express.json())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@simple-crud-server.wz75wnp.mongodb.net/?appName=Simple-crud-server`;

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

const myDB = client.db("parcels");

const parcelCollection = myDB.collection("parcels");


const myyDB = client.db("contacts");
const myColl = myyDB.collection("contacts");


app.get('/parcels', async(req,res)=>{
  // fetch mail id 
  const userEmail=req.query.email;
  // query
  const query=userEmail? {created_by:userEmail}:{};
  //sorting

  const options={
    sort:{createdAt: -1},
  }

  const parcels=await parcelCollection.find(query,options).toArray();
  res.send(parcels)
})

// app.get('/parcels', async(req,res)=>{
//   const userEmail =req.query.email
//   const query=userEmail?{created_by:userEmail}:{}
//   const option={
//     sort:{createdAt:-1}
//   }
//   const result=await parcelCollection.find(query,option);
//   res.send(result)
// })


// contact post
app.post('/contacts',async(req,res)=>{
  const newContact=req.body
  const newResult=await myColl.insertOne(newContact);
  res.send(newResult)
})

// contact get 
app.get('/contacts', async (req,res)=>{
  const contactEmail=req.query.email;
  const query=contactEmail?{email:contactEmail}:{};
  const contacts=await myColl.find(query).toArray();
  res.send(contacts)
})

// contact delete
app.delete('/contacts/:id',async(req,res)=>{
  const id =req.params.id;

  const result=await myColl.deleteOne({_id:new ObjectId(id)});
  res.send(result)
})






app.post('/parcels', async (req, res) => {

  const newParcel = req.body;

  const result = await parcelCollection.insertOne(newParcel);

  res.status(201).send(result);

});

app.delete('/parcels/:id',async(req,res)=>{
  const id=req.params.id;
  const result=await parcelCollection.deleteOne({_id:new ObjectId(id)});
  // if(result.deletedCount===0){
  //   return res.status(404).send({message:'parcel not found'})
  // }
  res.send(result)
})




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
   
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Hero logistic is on port ${port}`)
})