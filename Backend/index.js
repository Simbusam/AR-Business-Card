// require('dotenv').config(); // Load .env first
// const express = require("express");
// const mongoose = require('mongoose');
// const cors = require('cors');

// const app = express();

// app.use(cors('*'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));


// // Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => {
//     console.log('✅ Connected to MongoDB Atlas!');
//   })
//   .catch(err => {
//     console.error('❌ MongoDB connection error:', err.message);
//   });

// // Routes
// app.get('/', (req, res) => {
//   res.send("Welcome to MARKERLESS AUGMENTED REALITY EXPERIENCES");
// });

// // Start server
// const PORT = process.env.PORT || 3005;
// app.listen(PORT, () => {
//   console.log(`Server is running at http://localhost:${PORT}`);
// });