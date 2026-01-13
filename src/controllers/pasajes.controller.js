const database = require('../config/database');
const oracledb = require('oracledb');

const getPasajes = async (req, res) => {
    let connection;
    try {
        connection = await database.openConnection();
        const result = await connection.execute(
            `SELECT p.ID_PASAJE, 
                    p.ID_RUTA, 
                    p.ID_UNIDAD, 
                    p.ID_TIPO, 
                    p.NUMERO_ASIENTO, 
                    p.CEDULA_CLIENTE, 
                    r.NOMBRE_RUTA, 
                    u.NUMERO_UNIDAD, 
                    t.NOMBRE_TIPO, 
                    TO_CHAR(p.FECHA_VIAJE, 'YYYY-MM-DD HH24:MI') AS FECHA, 
                    p.VALOR_FINAL, 
                    p.NOMBRE_CLIENTE 
             FROM PASAJES p
             JOIN RUTAS r ON p.ID_RUTA = r.ID_RUTA
             JOIN UNIDADES u ON p.ID_UNIDAD = u.ID_UNIDAD
             JOIN TIPOS_PASAJE t ON p.ID_TIPO = t.ID_TIPO
             ORDER BY p.ID_PASAJE ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener pasajes' });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) { console.error(e); } }
    }
};

const createPasaje = async (req, res) => {
    const { id_ruta, id_unidad, id_tipo, valor, cedula, nombre, asiento, fecha_viaje } = req.body;
    let connection;
    try {
        connection = await database.openConnection();
        
        const binds = {
            id_ruta: Number(id_ruta),
            id_unidad: Number(id_unidad),
            id_tipo: Number(id_tipo),
            valor: parseFloat(valor),
            cedula: String(cedula),
            nombre: String(nombre),
            asiento: Number(asiento),
            fecha: fecha_viaje,
            id_pasaje: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        };

        const sql = `
            INSERT INTO PASAJES (ID_RUTA, ID_UNIDAD, ID_TIPO, VALOR_FINAL, CEDULA_CLIENTE, NOMBRE_CLIENTE, NUMERO_ASIENTO, FECHA_VIAJE)
            VALUES (:id_ruta, :id_unidad, :id_tipo, :valor, :cedula, :nombre, :asiento, 
                    TO_TIMESTAMP(:fecha, 'YYYY-MM-DD"T"HH24:MI')) 
            RETURNING ID_PASAJE INTO :id_pasaje
        `;
        
        const result = await connection.execute(sql, binds);
        await connection.commit(); 
        
        res.status(201).json({ 
            message: 'Pasaje creado exitosamente', 
            id_pasaje: result.outBinds.id_pasaje[0] 
        });

    } catch (err) {
        console.error("Error en createPasaje:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) { console.error(e); } }
    }
};

const updatePasaje = async (req, res) => {
    const { id } = req.params; 
    const { id_ruta, id_unidad, id_tipo, valor, cedula, nombre, asiento, fecha_viaje } = req.body;
    let connection;
    try {
        connection = await database.openConnection();
        
        const binds = {
            id: Number(id),
            id_ruta: Number(id_ruta),
            id_unidad: Number(id_unidad),
            id_tipo: Number(id_tipo),
            valor: parseFloat(valor),
            cedula: String(cedula),
            nombre: String(nombre),
            asiento: Number(asiento),
            fecha: fecha_viaje
        };

        const sql = `
            UPDATE PASAJES 
            SET ID_RUTA = :id_ruta, 
                ID_UNIDAD = :id_unidad, 
                ID_TIPO = :id_tipo, 
                VALOR_FINAL = :valor, 
                CEDULA_CLIENTE = :cedula, 
                NOMBRE_CLIENTE = :nombre, 
                NUMERO_ASIENTO = :asiento,
                FECHA_VIAJE = TO_TIMESTAMP(:fecha, 'YYYY-MM-DD"T"HH24:MI')
            WHERE ID_PASAJE = :id
        `;
        
        const result = await connection.execute(sql, binds);
        await connection.commit();

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Pasaje no encontrado' });
        }

        res.json({ message: 'Pasaje actualizado correctamente' });

    } catch (err) {
        console.error("Error en updatePasaje:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) { console.error(e); } }
    }
};

const deletePasaje = async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await database.openConnection();
        const result = await connection.execute(`DELETE FROM PASAJES WHERE ID_PASAJE = :id`, [id]);
        await connection.commit();

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Pasaje no encontrado' });
        }
        res.json({ message: 'Pasaje eliminado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar pasaje' });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) { console.error(e); } }
    }
};

const generarCSV = async (req, res) => {
    let connection;
    try {
        connection = await database.openConnection();

        try {
            await connection.execute(`BEGIN EXPORTAR_CSV; END;`);
            console.log("✅ Procedure PL/SQL ejecutado en Azure.");
        } catch (plsqlError) {
            console.warn("⚠️ Alerta PL/SQL:", plsqlError.message);
        }

        const result = await connection.execute(
            `SELECT p.ID_PASAJE,
                    TO_CHAR(p.FECHA_VIAJE, 'YYYY-MM-DD HH24:MI') AS FECHA,
                    r.NOMBRE_RUTA,
                    u.NUMERO_UNIDAD,
                    p.NOMBRE_CLIENTE,
                    t.NOMBRE_TIPO,
                    TO_CHAR(p.VALOR_FINAL, '9990.00') AS VALOR
             FROM PASAJES p
             JOIN RUTAS r ON p.ID_RUTA = r.ID_RUTA
             JOIN UNIDADES u ON p.ID_UNIDAD = u.ID_UNIDAD
             JOIN TIPOS_PASAJE t ON p.ID_TIPO = t.ID_TIPO
             ORDER BY p.ID_PASAJE ASC`
        );

        let csvContent = 'ID;FECHA;RUTA;UNIDAD;CLIENTE;TIPO;VALOR\n';
        
        result.rows.forEach(row => {
            csvContent += row.join(';') + '\n';
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('reporte_ventas.csv');
        res.send(csvContent);

    } catch (err) {
        console.error("Error generando CSV:", err);
        res.status(500).json({ error: 'Error al generar CSV: ' + err.message });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) { console.error(e); } }
    }
};

module.exports = {
    getPasajes,
    createPasaje,
    updatePasaje,
    deletePasaje,
    generarCSV
};