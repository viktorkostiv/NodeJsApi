const express = require('express');
const rateLimit = require('express-rate-limit');
// const helmet = require('helmet');
const xss = require('xss-clean');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

const ApiRouter = require('./routes/ApiRouter');


const app = express();
// app.use(express.static(path.join(__dirname, 'frontend', 'dist')));
app.use(express.json());

// app.use(helmet());

const limiter = rateLimit({
    max: 100,
    windowMs: 15 * 60 * 1000,
    massage: "Too many requests from this IP, please try again in an hour",
    headers: true,
});

const corsOptions = {
    // origin: 'https://yourdomain.com', 
    // methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

app.use('/', limiter);
app.use(cors(corsOptions));
app.use(xss());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(compression())

app.use('/api', ApiRouter);

// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
// });

module.exports = app;