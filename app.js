const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
// const helmet = require('helmet');
const xss = require('xss-clean');
const admin = require("firebase-admin");

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const compression = require('compression');

const ApiRouter = require('./routes/ApiRouter');

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const app = express();
// app.use(express.static(path.join(__dirname, 'frontend', 'dist')));
app.use(express.json());

// app.use(helmet());

const limiter = rateLimit({
    max: 1000,
    windowMs: 60 * 60 * 1000,
    massage: "Too many requests from this IP, please try again in an hour",
});
app.use('/', limiter);
app.use(cors());
app.use(xss());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(compression())

app.use('/api', ApiRouter);

// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
// });

module.exports = app;