const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const stripe = require('stripe')(process.env.PAYMENT_GATEWAY_KEY);

const app = express();
const port = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// ============================================
// JWT VERIFY MIDDLEWARE
// ============================================

const verifyToken = (req, res, next) => {

  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({
      message: 'unauthorized access'
    });
  }

  jwt.verify(
    token,
    process.env.JWT_ACCESS_SECRET,
    (error, decoded) => {

      if (error) {
        return res.status(401).send({
          message: 'unauthorized access'
        });
      }

      req.decoded = decoded;

      next();
    }
  );
};

// ============================================
// JWT API
// ============================================

app.post('/jwt', async (req, res) => {

  const { email } = req.body;

  const user = { email };

  const token = jwt.sign(
    user,
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: '1d'
    }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
   
  });

  res.send({
    success: true
  });
});

// ============================================
// LOGOUT API
// ============================================

app.post('/logout', async (req, res) => {

  res.clearCookie('token', {
    httpOnly: true,
    secure: false,
   
  });

  res.send({
    success: true
  });
});

// ============================================
// MONGODB URI
// ============================================

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@simple-crud-server.wz75wnp.mongodb.net/?retryWrites=true&w=majority&appName=Simple-crud-server`;

// ============================================
// MONGODB CLIENT
// ============================================

const client = new MongoClient(uri, {

  serverApi: {
    version: ServerApiVersion.v1,
    deprecationErrors: true,
  }

});

// ============================================
// RUN SERVER
// ============================================

async function run() {

  try {

    await client.connect();

    console.log('MongoDB Connected');

    // ============================================
    // DATABASE & COLLECTIONS
    // ============================================

    const myDB = client.db('parcels');

    const parcelCollection = myDB.collection('parcels');

    const paymentCollection = myDB.collection('payments');

    const trackingCollection = myDB.collection('tracking');

    const userCollection = myDB.collection('users');

    const riderCollection = myDB.collection('riders');

    const contactCollection = myDB.collection('contacts');

    // ============================================
    // USERS API
    // ============================================

    // SAVE USER
    app.post('/users', async (req, res) => {

      try {

        const user = req.body;

        const existingUser =
          await userCollection.findOne({
            email: user.email
          });

        if (existingUser) {

          return res.send({
            message: 'user already exists'
          });

        }

        if (user.email === 'raja@gmail.com') {

          user.role = 'admin';

        }
        else {

          user.role = 'user';

        }

        user.createdAt = new Date();

        const result =
          await userCollection.insertOne(user);

        res.send(result);

      }

      catch (error) {

        console.log(error);

        res.status(500).send({
          error: error.message
        });

      }

    });

    // GET ALL USERS
    app.get('/users', async (req, res) => {

      try {

        const users =
          await userCollection.find().toArray();

        res.send(users);

      }

      catch (error) {

        res.status(500).send({
          error: error.message
        });

      }

    });

    // SEARCH USERS
    app.get(
      '/users/search',
      verifyToken,
      async (req, res) => {

        try {

          const email = req.query.email;

          if (email !== req.decoded.email) {

            return res.status(403).send({
              message: 'forbidden access'
            });

          }

          const users = await userCollection.find({

            email: {
              $regex: email,
              $options: 'i'
            }

          })
            .project({
              email: 1,
              role: 1,
              createdAt: 1
            })
            .limit(10)
            .toArray();

          res.send(users);

        }

        catch (error) {

          res.status(500).send({
            error: error.message
          });

        }

      }
    );

    // GET SINGLE USER
    app.get('/users/:email', async (req, res) => {

      try {

        const email = req.params.email;

        const result =
          await userCollection.findOne({
            email: email
          });

        res.send(result);

      }

      catch (error) {

        res.status(500).send({
          error: error.message
        });

      }

    });

    // MAKE ADMIN
    app.patch('/users/admin/:id', async (req, res) => {

      try {

        const id = req.params.id;

        const result =
          await userCollection.updateOne(

            {
              _id: new ObjectId(id)
            },

            {
              $set: {
                role: 'admin'
              }
            }

          );

        res.send(result);

      }

      catch (error) {

        res.status(500).send({
          error: error.message
        });

      }

    });

    // REMOVE ADMIN
    app.patch('/users/remove-admin/:id', async (req, res) => {

      try {

        const id = req.params.id;

        const result =
          await userCollection.updateOne(

            {
              _id: new ObjectId(id)
            },

            {
              $set: {
                role: 'user'
              }
            }

          );

        res.send(result);

      }

      catch (error) {

        res.status(500).send({
          error: error.message
        });

      }

    });

    // CHECK ADMIN
    app.get('/users/admin/:email', async (req, res) => {

      try {

        const email = req.params.email;

        const user =
          await userCollection.findOne({
            email: email
          });

        const admin =
          user?.role === 'admin';

        res.send({ admin });

      }

      catch (error) {

        res.status(500).send({
          error: error.message
        });

      }

    });

    // ============================================
    // PARCEL API
    // ============================================

    // GET SINGLE PARCEL
    app.get('/parcels/:id', async (req, res) => {

      try {

        const id = req.params.id;

        const parcel =
          await parcelCollection.findOne({
            _id: new ObjectId(id)
          });

        res.send(parcel);

      }

      catch (error) {

        res.status(500).send({
          error: error.message
        });

      }

    });

    // GET ALL PARCELS
    app.get(
      '/parcels',
      verifyToken,
      async (req, res) => {

        try {

          const userEmail = req.query.email;

          if (userEmail !== req.decoded.email) {

            return res.status(403).send({
              message: 'forbidden access'
            });

          }

          const query =
            userEmail
              ? { created_by: userEmail }
              : {};

          const parcels =
            await parcelCollection
              .find(query)
              .sort({ createdAt: -1 })
              .toArray();

          res.send(parcels);

        }

        catch (error) {

          res.status(500).send({
            error: error.message
          });

        }

      }
    );

    // ADD PARCEL
    app.post('/parcels', async (req, res) => {

      try {

        const newParcel = req.body;

        newParcel.createdAt = new Date();

        const result =
          await parcelCollection.insertOne(newParcel);

        res.status(201).send(result);

      }

      catch (error) {

        res.status(500).send({
          error: error.message
        });

      }

    });

    // DELETE PARCEL
    app.delete('/parcels/:id', async (req, res) => {

      try {

        const id = req.params.id;

        const result =
          await parcelCollection.deleteOne({
            _id: new ObjectId(id)
          });

        res.send(result);

      }

      catch (error) {

        res.status(500).send({
          error: error.message
        });

      }

    });

    // UPDATE PARCEL
    app.patch('/parcels/:id', async (req, res) => {

      try {

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

        const result =
          await parcelCollection.updateOne(
            filter,
            updateDoc
          );

        res.send(result);

      }

      catch (error) {

        res.status(500).send({
          error: error.message
        });

      }

    });

    // ============================================
    // PAYMENT API
    // ============================================

    app.post('/create-payment-intent', async (req, res) => {

      try {

        const { amountInCents } = req.body;

        const paymentIntent =
          await stripe.paymentIntents.create({

            amount: amountInCents,

            currency: 'usd',

            payment_method_types: ['card']

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

    // SAVE PAYMENT
    app.post('/payments', async (req, res) => {

      try {

        const paymentData = req.body;

        const paymentResult =
          await paymentCollection.insertOne(paymentData);

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
          await parcelCollection.updateOne(
            query,
            updateDoc
          );

        res.send({
          paymentResult,
          updateResult
        });

      }

      catch (error) {

        res.status(500).send({
          error: error.message
        });

      }

    });

    // ============================================
    // RIDERS API
    // ============================================

    app.post('/riders', async (req, res) => {

      try {

        const newRider = req.body;

        newRider.createdAt = new Date();

        const result =
          await riderCollection.insertOne(newRider);

        res.send(result);

      }

      catch (error) {

        res.status(500).send({
          error: error.message
        });

      }

    });

    app.get('/riders', async (req, res) => {

      try {

        const result =
          await riderCollection.find().toArray();

        res.send(result);

      }

      catch (error) {

        res.status(500).send({
          error: error.message
        });

      }

    });

    // ============================================
    // CONTACT API
    // ============================================

    app.post('/contacts', async (req, res) => {

      try {

        const newContact = req.body;

        newContact.createdAt = new Date();

        const result =
          await contactCollection.insertOne(newContact);

        res.send(result);

      }

      catch (error) {

        res.status(500).send({
          error: error.message
        });

      }

    });

    app.get('/contacts', async (req, res) => {

      try {

        const contactEmail = req.query.email;

        const query =
          contactEmail
            ? { email: contactEmail }
            : {};

        const contacts =
          await contactCollection.find(query).toArray();

        res.send(contacts);

      }

      catch (error) {

        res.status(500).send({
          error: error.message
        });

      }

    });

    app.delete('/contacts/:id', async (req, res) => {

      try {

        const id = req.params.id;

        const result =
          await contactCollection.deleteOne({
            _id: new ObjectId(id)
          });

        res.send(result);

      }

      catch (error) {

        res.status(500).send({
          error: error.message
        });

      }

    });

    // ============================================
    // MONGODB PING
    // ============================================

    await client.db('admin').command({ ping: 1 });

    console.log(
      'Pinged your deployment. Successfully connected to MongoDB!'
    );

  }

  finally {

  }

}

run().catch(console.dir);

// ============================================
// ROOT API
// ============================================

app.get('/', (req, res) => {

  res.send('Hero Logistic Server Running');

});

// ============================================
// SERVER LISTEN
// ============================================

app.listen(port, () => {

  console.log(`Hero Logistic is running on port ${port}`);

});