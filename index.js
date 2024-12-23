const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.port || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require('dotenv').config()
app.use(cors());
app.use(express.json());

const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p6yi1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const jobsCollection = client.db('job-portal').collection('jobs')
    const jobApplicationConnection = client.db('job-portal').collection('job-applications')
    // JOB RELATED API 
    app.get('/jobs', async (req, res) => {
        const cursor = jobsCollection.find();
        const result = await cursor.toArray();
        res.send(result)
    })


    // get specific job by id

    app.get('/jobs/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await jobsCollection.findOne(query)
        res.send(result)

    })


    app.post('/jobs', async(req, res) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob)
      console.log(result);
      res.send(result)
    })


    // job application api


    app.get('/job-application', async (req, res) => {
      const email = req.query.email;
      const query = {applicant_email: email}
      const result = await jobApplicationConnection.find(query).toArray();

      for(const application of result) {
        console.log(application.job_id);
        const query = {_id: new ObjectId(application.job_id)}
        const job = await jobsCollection.findOne(query)
        if(job){
          application.title = job.title,
          application.company = job.company;
          application.company_logo = job.company_logo;
          application.location = job.location;
        }
      }
      res.send(result)
    })



    app.post('/job-applications', async(req, res) => {
      const application = req.body;
      const result = jobApplicationConnection.insertOne(application)
      res.send(result)
    })


    // delete my applications 

    app.delete('/jobdelete/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await jobApplicationConnection.deleteOne(query)
      res.send(result)
    })




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
