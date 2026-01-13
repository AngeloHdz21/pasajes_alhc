CREATE OR REPLACE PROCEDURE EXPORTAR_CSV IS
    CURSOR c_datos IS
        SELECT 
            p.ID_PASAJE,
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
        ORDER BY p.ID_PASAJE ASC;

    v_archivo  UTL_FILE.FILE_TYPE;
    v_linea    VARCHAR2(4000); 
    v_nombre   VARCHAR2(50) := 'reporte_pasajes.csv';
    
BEGIN
    v_archivo := UTL_FILE.FOPEN('DIR_REPORTES', v_nombre, 'W');

    UTL_FILE.PUT_LINE(v_archivo, 'ID;FECHA;RUTA;N_UNIDAD;CLIENTE;TIPO;VALOR');

    FOR r IN c_datos LOOP
        v_linea := r.ID_PASAJE || ';' || 
                   r.FECHA || ';' || 
                   r.NOMBRE_RUTA || ';' || 
                   r.NUMERO_UNIDAD || ';' || 
                   r.NOMBRE_CLIENTE || ';' || 
                   r.NOMBRE_TIPO || ';' || 
                   r.VALOR;
        
        UTL_FILE.PUT_LINE(v_archivo, v_linea);
    END LOOP;

    UTL_FILE.FCLOSE(v_archivo);
    
EXCEPTION
    WHEN OTHERS THEN
        IF UTL_FILE.IS_OPEN(v_archivo) THEN
            UTL_FILE.FCLOSE(v_archivo);
        END IF;
        RAISE;
END;
/