const connectDatabase = require('./database');
const mongoose = require('mongoose');

connectDatabase().then(() => mongoose.disconnect()).catch(() => process.exit(1));
