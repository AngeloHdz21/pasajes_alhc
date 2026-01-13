const express = require('express');
const cors = require('cors');
const database = require('./src/config/database');
const pasajesRoutes = require('./src/routes/pasajes.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static('public')); 

app.use('/api', pasajesRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    await database.initialize();
});