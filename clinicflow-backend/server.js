const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const keys = require('./config/keys');

const app = express();

app.use(morgan('dev'));
app.use(bodyParser.json());

app.use(
  cors({
    origin: [
      'http://localhost:3000', 
      'https://clinicflow-dashboard.vercel.app'
    ],
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    credentials: true,
  })
);

// MongoDB connection
const db = keys.mongoURI;
mongoose
  .connect(db /* , { useNewUrlParser: true, useUnifiedTopology: true } */)
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

// Routes
app.use('/api', require('./routes/api'));

// Health check
app.get('/ping', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server started on port ${port}`));
