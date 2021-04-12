const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const fileUpload = require('express-fileupload')
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7wr7p.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


const app = express()

app.use(bodyParser.json());
app.use(cors());

app.use(express.static('doctors'));
app.use(fileUpload());

const port = process.env.PORT || 5055;

app.get('/', (req, res) => {
    res.send("hello from db it's working")
})

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const appointmentCollection = client.db("doctorsPortal").collection("appointment");
    const doctorCollection = client.db("doctorsPortal").collection("doctors");

    app.post('/addAppointment', (req, res) => {
        const appointment = req.body;
        appointmentCollection.insertOne(appointment)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })


    app.post('/appointmentsByDate', (req, res) => {
        const date = req.body;
        const email = req.body.email;
        doctorCollection.find({ email: email })
            .toArray((err, doctors) => {
                const filter = { date: date.date }
                if (doctors.length === 0) {
                    filter.email = email;
                }
                appointmentCollection.find(filter)
                    .toArray((err, documents) => {
                        console.log(email, date.date, doctors, documents)
                        res.send(documents);
                    })
            })

    })


    app.get('/appointments', (req, res) => {
        appointmentCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    app.get('/doctors', (req, res) => {
        doctorCollection.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })
    })

    app.post('/addADoctor', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const mobile = req.body.mobile;
        const email = req.body.email;
        // const filePath = `${__dirname}/doctors/${file.name}`;
        // file.mv(filePath, err => {
        //     if (err) {
        //         console.log(err)
        //         res.status(500).send({ msg: 'Failed to upload image' });
        //     }//fs.readFileSync(filePath);
        const newImg = file.data;
        const encImg = newImg.toString('base64');

        // req.files removed 89 and 90, 84 line theke

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        doctorCollection.insertOne({ name, email, image, mobile })
            .then(result => {
                // fs.remove(filePath, error =>{
                //     if(error){
                //         console.log(error);
                //         res.status(500).send({ msg: 'Failed to upload image' });
                //     }
                res.send(result.insertedCount > 0)
                // })

            })
        // })
    })

    app.post('/isDoctor', (req, res) => {
        const email = req.body.email;
        doctorCollection.find({ email: email })
            .toArray((err, doctors) => {
                res.send(doctors.length > 0)
            })

    })

});


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})