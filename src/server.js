'use strict';

require('dotenv').config(); // reads process.env

const express   = require('express');
const helmet    = require('helmet');
const cors      = require('cors');
const morgan    = require('morgan');
const connectDB = require('./config/db');

connectDB();

const app = express();

app.get('/', (req, res) => {
  res.json({ message: '🚀 MiniWall SaaS API is LIVE ...' });
});

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));

// for docker liveness probes
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// 4 args = express error handler
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Server] MiniWall API running on port ${PORT}`);
});

module.exports = app; // for tests
