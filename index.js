const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const cors=require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// herologistic
// ix42sw6LwKtowJwc
const stripe = require('stripe')(process.env.PAYMENT_GATEWAY_KEY);

app.use(cors({
  origin:"http://localhost:5173"
}))
app.use(express.json())


// originallllllllllllllllllllllllllllllllllllllllll


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
const paymentCollection = myDB.collection("payments");
const trackingCollection=myDB.collection("tracking")
const userCollection=myDB.collection('users')
const riderCollection=myDB.collection('riders')
const myyDB = client.db("contacts");
const myColl = myyDB.collection("contacts");





// // get api for specific id in payment page


app.get('/parcels/:id',async(req,res)=>{
  const id=req.params.id;
  const parcel=await parcelCollection.findOne({_id:new ObjectId(id)});
  res.send(parcel)
})



// Create Checkout Session endpoint
app.post('/create-payment-intent', async (req, res) => {

  try {

    const { amountInCents } = req.body;

    const paymentIntent =
      await stripe.paymentIntents.create({

        amount: amountInCents,

        currency: 'usd',

        payment_method_types: ['card'],

      });

    res.send({
      clientSecret: paymentIntent.client_secret
    });

  }

  catch (error) {

    res.status(500).send({
      error: error.message
    });

  }

});

// after payment api-
// SAVE PAYMENT & UPDATE PARCEL STATUS

app.post('/payments', async (req, res) => {

  const paymentData = req.body;

  // SAVE PAYMENT HISTORY
  const paymentResult =
    await paymentCollection.insertOne(paymentData);

  // UPDATE PARCEL PAYMENT STATUS
  const query = {
    _id: new ObjectId(paymentData.parcelId)
  };

  const updateDoc = {
    $set: {
      payment_status: 'paid',
      transactionId: paymentData.transactionId,
      paid_at: new Date()
    }
  };

  const updateResult =
    await parcelCollection.updateOne(query, updateDoc);

  res.send({
    paymentResult,
    updateResult
  });

});
// GET PAYMENT HISTORY

app.get('/payments', async (req, res) => {

  const result = await paymentCollection
    .find()
    .sort({ paid_at: -1 }) // latest payment first
    .toArray();

  res.send(result);

});


// tracking 
app.post('/tracking',async(req,res)=>{
  const {tracking_id,parcel_id,status,message,updated_by=''}=req.body;

  const log={
    tracking_id,
    status,
    message,parcel_id:parcel_id? new ObjectId(parcel_id):undefined,
    time:new Date(),
    updated_by
  };
  const result=await trackingCollection.insertOne(log);
  res.send({message:true,insertId:result.insertedId})
})
// post regsiter rest data
app.post('/users',async(req,res)=>{
  const user=req.body;
  const result=await userCollection.insertOne(user);
  res.send(result)
})
// after stored data get data from mongo



app.get('/riders', async (req, res) => {

  const result = await riderCollection.find().toArray();

  res.send(result);

});
app.get('/users/:email', async(req,res)=>{

  const email = req.params.email;

  const result = await userCollection.findOne({
    email: email
  });

  res.send(result);

})
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


// rider form submit

app.post('/riders', async(req,res)=>{
  const newRider=req.body;
  const result=await riderCollection.insertOne(newRider);
  res.send(result)
})



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
// update

app.patch('/parcels/:id', async (req, res) => {

  const id = req.params.id;

  const updatedData = req.body;

  const filter = {
    _id: new ObjectId(id)
  };

  const updateDoc = {
    $set: {
      senderName: updatedData.senderName,
      senderContact: updatedData.senderContact,
      receiverName: updatedData.receiverName,
      receiverContact: updatedData.receiverContact,
      parcelType: updatedData.parcelType,
      parcelWeight: updatedData.parcelWeight,
      deliveryAddress: updatedData.deliveryAddress,
      cost: updatedData.cost,
    }
  };

  const result = await parcelCollection.updateOne(
    filter,
    updateDoc
  );

  res.send(result);

});




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