const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/WebAR';

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));