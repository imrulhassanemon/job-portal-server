const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.port || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const logger = (req, res, next) => {
  console.log("inside the logger ");
  // console.log("hello bai", req.cookies);
  next();
};


// const veryfiToken = (req, res, next) => {
//   console.log('inside veryfy token middleware kemon achen apnara ', req.cookies);
//   const token = req?.cookies?.token;
//   console.log(token + '...');
//   console.log(`${req.method} request to ${req.url}`)
//   if(!token){
//     return res.status(401).send({message: 'UnAuthorized Access'})
//   }
//   jwt.verify(token, process.env.ACCESS_JWT_SECRET, (err, decoded) => {
//     if(err){
//       return res.status(401).send({message: 'UnAuthorized Access '})
//     }
//     next()
      
//   })
  
// }


const verifyToken  = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log(token);
  if(!token){
    return res.status(401).send({message: 'UnAuthorized Token'})
  }
  jwt.verify(token, process.env.ACCESS_JWT_SECRET, (err, decoded) => {
    if(err){
      return res.status(401).send({message: "UnAuthorized Token"})
    }
    req.user = decoded;
    next()
  })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p6yi1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


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
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // jobs related apis

    const jobsCollection = client.db("job-portal").collection("jobs");
    const jobApplicationConnection = client
      .db("job-portal")
      .collection("job-applications");

    // Auth related Apis
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_JWT_SECRET, {
        expiresIn: "10d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false, // {false} for localhost {true} for production 
        })
        .send({ success: true });
    });

    // JOB RELATED API
    app.get("/jobs", logger,    async (req, res) => {
      console.log("now inside the api callback");
      console.log(req.cookies.token);
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hr_email: email };
      }
      const cursor = jobsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get specific job by id

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    app.post("/jobs", async (req, res) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    });

    // job application api

    // veryfiToken,
    app.get("/job-application", verifyToken,  async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email };
      const result = await jobApplicationConnection.find(query).toArray();

      if(req.user.email !== email){
        return res.status(403).send({message: "Forbidden User"})
      }

      for (const application of result) {
        const query = { _id: new ObjectId(application.job_id) };
        const job = await jobsCollection.findOne(query);
        if (job) {
          (application.title = job.title), (application.company = job.company);
          application.company_logo = job.company_logo;
          application.location = job.location;
        }
      }
      res.send(result);
    });

    app.get("/viewapplications/jobs/:job_id", async (req, res) => {
      const jobId = req.params.job_id;
      const qurey = { job_id: jobId };
      const result = await jobApplicationConnection.find(qurey).toArray();
      res.send(result);
    });

    app.post("/job-applications",   async (req, res) => {
      const application = req.body;
      const result = jobApplicationConnection.insertOne(application);

      const id = application.job_id;
      const query = { _id: new ObjectId(id) };
      const job = await jobsCollection.findOne(query);

      let newCount = 0;
      if (job.applicationCount) {
        newCount = job.applicationCount + 1;
      } else {
        newCount = 1;
      }

      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          applicationCount: newCount,
        },
      };
      const updateResult = await jobsCollection.updateOne(filter, updateDoc);

      res.send(result);
    });

    // delete my applications

    app.delete("/jobdelete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobApplicationConnection.deleteOne(query);
      res.send(result);
    });
    // update existing data

    app.patch("/job-applications/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: data.status,
        },
      };
      const result = await jobApplicationConnection.updateOne(
        filter,
        updateDoc
      );
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("job is falling from the sky");
});

app.listen(port, () => {
  console.log(`job is waiting at : ${port}`);
});
