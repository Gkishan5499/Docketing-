const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
	origin: (origin, callback) => {
		if (!origin || origin === env.clientUrl || (env.nodeEnv !== 'production' && /^http:\/\/localhost:\d+$/.test(origin))) return callback(null, true);
		return callback(new Error('Origin is not allowed by CORS'));
	},
	credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok', service: 'lawyers-diary-api' } }));
app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);
module.exports = app;
