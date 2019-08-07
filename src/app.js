require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const winston = require('winston')
const cors = require('cors')
const helmet = require('helmet')
const uuid = require('uuid/v4')
const { NODE_ENV } = require('./config')


const app = express()

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

  const cards = [{
    id: 1,
    title: 'Task One',
    content: 'This is card one'
  }]
  const lists = [{
    id: 1,
    header: 'List One',
    cardIds: [1]
  }]

  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({
        filename: 'info.log'
      })
    ]
  });

  if (NODE_ENV !== 'production'){
    logger.add(new winston.transports.Console({
      format: winston.format.simple()
    }))
  }

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

app.get('/', (req, res) => {
  res.send('Hello, world!')
})

app.get('/cards', (req, res) => {
  res.json(cards)
})

app.get('/list', (req, res) => {
  res.json(lists)
})

app.get('/card/:id', (req, res) => {
  const { id } = req.params
  const card = cards.find(c => c.id == id)

  if(!card){
    logger.error(`Card with id ${id} not found`)
    return res.status(404).send('Card not found')
  }

  res.json(card)
})

app.get('/list/:id', (req, res) => {
  const { id } = req.params
  const list = lists.find(li => li.id == id)

  if (!list){
    logger.error(`List with id ${id} not found`)
    return res.status(404).send('List not found')
  }

  res.json(list)
})

app.post('/card', (req, res) => {
  const { title, content } = req.body

  if (!title){
    logger.error('Title is required')
    return res.status(400).send('Invalid data')
  }

  if (!content){
    logger.error('Content is required')
    return res.status(400).send('Invalid data')
  }

  const id = uuid()

  const newCard = {
    id,
    title,
    content
  }

  cards.push(newCard)

  logger.info(`Card with id ${id} created`)
  res.status(201).location(`http://localhost:8000/card/${id}`).json(newCard)
})

app.post('/list', (req, res) => {
  const { header, cardIds = [] } = req.body

  if (!header){
    logger.error(`Header is required`)
    res.status(400).send('Invalid data')
  }

  if (cardIds.length > 0){
    let valid = true
    cardIds.forEach(cid => {
      const card = cards.find(c => c.id == cid)
      if (!card){
        logger.error
      }
    })
  }
})

app.delete('/list/:id', (req, res) => {
  const { id } = req.params

  const listIndex = lists.findIndex(li => li.id == id)

  if (listIndex === -1){
    logger.error(`List with id ${id} not found`)
    return res.status(404).send('Not Found')
  }

  lists.splice(listIndex, 1)

  logger.info(`List with id ${id} deleted`)

  res.status(204).end()
})

app.delete('/card/:id', (req, res) => {
  const { id } = req.params

  const cardIndex = cards.findIndex(c => c.id == id)

  if (cardIndex === -1){
    logger.error(`Card with id ${id} not found`)
    return res.status(404).send('Not found')
  }

  lists.forEach(list => {
    const cardIds = list.cardIds.filter(cid => cid !== id)
    list.cardIds = cardIds

    cards.splice(cardIndex, 1)
    logger.info(`Card with id ${id} deleted`)

    res.status(204).end
  })
})


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
