const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const port = 8080;


// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require("./connector");

const covidModel = connection;


app.get('/',async(req,res)=>{
      res.send( await covidModel.find())
})

app.get("/totalRecovered", async (req, res) => {
  const recoveredPatient = await covidModel.aggregate([
    {
      $group: {
        _id: "total",
        recovered: { $sum: "$recovered" },
      },
    },
  ]);
  res.send({ data: recoveredPatient });
});

app.get("/totalActive", async (req, res) => {
  // one way
  const infectedPatients = await covidModel.aggregate([
    {
      $group: {
        _id: "total",
        infected: { $sum: "$infected" },
        recovered: { $sum: "$recovered" },
      },
    },
  ]);

  console.log(infectedPatients);

  const resultOfInfected = infectedPatients[0];

  const final = resultOfInfected.infected - resultOfInfected.recovered;

  res.send({ data: { _id: "total", active: final } });

  // second way

  // const recoveredPatients = await covidModel.aggregate([
  //     {
  //         $group:
  //         {_id:'total',
  //         recovered : {$sum:"$recovered"}
  //     }
  // }
  // ])

  // const resultOfRecovered = recoveredPatients[0]

  // let finalResult = resultOfInfected.infected - resultOfRecovered.recovered;

  // res.send({data:{_id:'total',active:finalResult}})
});

app.get("/totalDeath", async (req, res) => {
  const totalDeaths = await covidModel.aggregate([
    {
      $group: {
        _id: "total",
        Deaths: { $sum: "$death" },
      },
    },
  ]);

  const onlyDeath = totalDeaths[0];

  const result = onlyDeath.Deaths;

  console.log(totalDeaths);
  res.send({ data: { _id: "total", death: result } });
});

app.get("/hotspotStates", async (req, res) => {
  const rate = await covidModel.aggregate([
    {
      $project: {
        States: "$state",
        _id:false,
        rate: {
          $round: [
            {
              $divide: [
                { $subtract: ["$infected", "$recovered"] },
                "$infected",
              ],
            },
            5,
          ],
        },
      },
    },
    {
      $match: {
        rate: { $gt: 0.1 },
      },
    },
  ]);
  res.send({ data: rate });
});

app.get('/healthStates',async(req,res)=>{
    const health = await covidModel.aggregate([
        {
            $project:{
                states:'$state',
                _id:false,
                mortality:{
                    $round:[
                        {
                            $divide:['$death','$infected'],
                        },
                        5
                    ],
                }
            }
        },
        {
            $match:{
                mortality:{$lt:0.005}
            }
               
        }
    ])

    res.send({data:health})
})

app.listen(port, () => console.log(`App listening on port ${port}!`));

module.exports = app;
