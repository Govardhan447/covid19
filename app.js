const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const dbpath = path.join(__dirname, 'covid19India.db')

let db = null

const initilizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Runnning on http://localhost/3000/')
    })
  } catch (e) {
    console.log(`DB error:${e.meassage}`)
    process.exit(1)
  }
}

initilizeDBAndServer()

const ConverDbObjectToResponseObject = dbObject => {
  return {
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
    totalCases: dbObject.total_cases,
    totalCured: dbObject.total_cured,
    totalActive: dbObject.total_active,
    totalDeaths: dbObject.total_deaths,
  }
}

//GET all State list API1

app.get('/states/', async (request, response) => {
  const getStateDetails = `
    SELECT
    *
    FROM
        state;`
  const dbResponse = await db.all(getStateDetails)
  response.send(
    dbResponse.map(eachState => ConverDbObjectToResponseObject(eachState)),
  )
})

//GET all StateID list API2

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateDetails = `
    SELECT
      *
    FROM
        state
    WHERE 
        state_id = ${stateId};`
  const dbResponse = await db.all(getStateDetails)
  response.send(
    dbResponse.map(eachState => ConverDbObjectToResponseObject(eachState)),
  )
})
// POST create District Details API3

app.post('/districs/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const createDistricDetails = `
  INSERT INTO
    district (district_name, state_id, cases, cured, active,deaths)
  VALUES (
    '${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths}
  );`
  const dbResponse = await db.run(createDistricDetails)
  response.send('District Successfully Added')
})

// GET districtId details API4

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictDetails = `
  SELECT
  *
  FROM
    district
  WHERE
    district_id = ${districtId};`
  const dbResponse = await db.all(getDistrictDetails)
  response.send(
    dbResponse.map(eachitem => ConverDbObjectToResponseObject(eachitem)),
  )
})

//DELETE DistrictId API 5

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictDetails = `
  DELETE FROM
    district
  WHERE 
    district_id = ${districtId};`
  const dbResponse = await db.all(deleteDistrictDetails)
  response.send('District Removed')
})

// PUT update District Details API 6

app.put('/districs/:districtId/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateDistricDetails = `
  UPDATE
    district
  SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths =${deaths}
  ;`
  const dbResponse = await db.run(updateDistricDetails)
  response.send('District Details Updated')
})

// GET State Status API 7

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateStatusDetails = `
  SELECT
  state_id, 
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths) 
  FROM 
      district
  WHERE
    state_id = ${stateId}
  GROUP BY 
    state_id;`

  const dbResponse = await db.all(getStateStatusDetails)
  console.log(dbResponse)
  response.send({
    total_cases: dbResponse['SUM(cases)'],
    total_cured: dbResponse['SUM(cured)'],
    total_active: dbResponse['SUM(active)'],
    total_deaths: dbResponse['SUM(deaths)'],
  })
})

// GET State Names

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateStatusDetails = `
  SELECT
   state_name
  FROM 
    district INNER JOIN state ON
    district.state_id = state.state_id
  WHERE
    district.district_id = ${districtId} ;`

  const dbResponse = await db.all(getStateStatusDetails)

  response.send(
    dbResponse.map(eachItem => ConverDbObjectToResponseObject(eachItem)),
  )
})

module.exports = app
