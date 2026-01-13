const oracledb = require('oracledb');
require('dotenv').config();

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

async function initialize() {
    try {
        await oracledb.createPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECTION_STRING,
            poolMin: 1,
            poolMax: 10,
            poolIncrement: 1
        });
        console.log('✅ Conectado exitosamente a Oracle Database');
    } catch (err) {
        console.error('❌ Error al conectar con Oracle:', err.message);
        process.exit(1);
    }
}

async function close() {
    await oracledb.getPool().close(0);
}

async function openConnection() {
    try {
        return await oracledb.getConnection();
    } catch (err) {
        console.error('Error obteniendo conexión del pool', err);
        throw err;
    }
}

module.exports = {
    initialize,
    close,
    openConnection
};