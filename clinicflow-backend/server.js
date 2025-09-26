const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const keys = require('./config/keys');

const app = express();

// middleware
app.use(morgan('dev'));
app.use(bodyParser.json());

const db = keys.mongoURI;

//connect to MongoDB
mongoose
  .connect(db /* , { useNewUrlParser: true, useUnifiedTopology: true } */)
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

// routes
app.use('/api', require('./routes/api'));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server started on port ${port}`));
