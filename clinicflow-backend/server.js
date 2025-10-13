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
      'https://clinicflow-dashboard.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

mongoose
  .connect(keys.mongoURI)
  .then(() => console.log('✅ MongoDB Connected...'))
  .catch(err => console.error('❌ MongoDB Error:', err));

app.use('/api', require('./routes/api'));

app.get('/ping', (req, res) => res.json({ ok: true, ts: Date.now() }));

app.get('/', (req, res) => {
  res.send('✅ ClinicFlow Backend is Live and Running!');
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
