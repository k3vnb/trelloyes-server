require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const logger = require('./logger')
const cardRouter = require('./card/cardRouter')
const listRouter = require('./list/listRouter')
const { NODE_ENV } = require('./config')


const app = express()

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';


app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.use(express.json())

app.use(function validateBearerToken(req, res, next){
  logger.error(`Unauthorized request to path: ${req.path}`)
  const apiToken = process.env.API_TOKEN
  const authToken = req.get('Authorization')

  if(!authToken || authToken.split(' ')[1] !== apiToken){
    return res.status(401).json({
      error: 'Unauthorized request'
    })
  }

  next()
})

app.use(cardRouter)
app.use(listRouter)


app.use(function errorHandler(error, req, res, next){
  let response
  if (NODE_ENV === 'production'){
    response = { error: { message: 'server error' } }
  } else {
    console.error(error)
    response = { message: error.message, error }
  }
  res.status(500).json(response)
})


module.exports = app
