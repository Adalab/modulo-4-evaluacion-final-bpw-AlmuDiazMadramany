//imports
const express = require('express');
const cors = require('cors');
const mysql = require ('mysql2/promise')

//crear el servidor
const server = express();
require("dotenv").config();

// configurar el servidor
server.use(cors());
server.use(express.json());

// conectarse a la BD 
async function dbConnection (){
  const connection = await mysql.createConnection ({
    host: "localhost",
    user: "root",
    password:process.env.PASSWORDDB,
    database: "esquiar",
  });
  await connection.connect();
  return connection;
}
  
// --> CRUD <--

// ENDPOINT PARA LISTAR TODAS LAS ENTRADAS EXISTENTES
// URL: http://localhost:5005/pistas
server.get('/pistas', async (req, res) =>{
  try {
    const conn = await dbConnection();
    const select = `SELECT esquiar.pistas.id_pistas, 
     esquiar.pistas.nombre AS nombre_pista,
     esquiar.pistas.dificultad, 
     esquiar.pistas.estado,
     esquiar.pistas.longitud, 
     esquiar.estaciones.nombre AS nombre_estacion,
     esquiar.estaciones.ubicacion
     FROM esquiar.pistas
     INNER JOIN esquiar.estaciones ON esquiar.pistas.fk_estaciones = esquiar.estaciones.id_estaciones`;
    const [results] = await conn.query(select);
    conn.end();

    res.status(200).json({
      info: {count: results.length}, // numero de pistas
      results: results, // listado de pistas
    });
  } catch (error) {res.status(500).json({
      success: false,
      message: "Error al obtener las pistas"
    })}
});


// ENDPOINT PARA INSERTAR UNA ENTRADA EN SU ENTIDAD PRINCIPAL
// URL POSTMAN: http://localhost:5005/nuevapista
server.post('/nuevapista', async (req, res)=>{
  try {
    const conn = await dbConnection();
    const {nombre, dificultad, estado, longitud, fk_estaciones} = req.body;

    // Validación de todos los campos
    if(!nombre || !dificultad || !estado || !longitud || !fk_estaciones){
      return res.status(400).json({
        success: false, 
        message: "Todos los campos son obligatorios",
      });
    };

    // Validación de que la estación existe:
    const checkStation = "SELECT id_estaciones FROM esquiar.estaciones WHERE id_estaciones = ?";
    const [stationResult] = await conn.query (checkStation, [fk_estaciones]);
    if (stationResult.length === 0){
      return res.status(400).json({
        success: false, 
        message: "La etación no existe"
      });
    }

    const sqlInsert = 'INSERT INTO esquiar.pistas (nombre, dificultad, estado, longitud, fk_estaciones) VALUES (?,?,?,?,?)'
    const [results] = await conn.query (sqlInsert, [
      nombre, 
      dificultad, 
      estado, 
      longitud,
      fk_estaciones,
    ]); 
    conn.end();

    if (results && results.affectedRows>0){
      res.status(201).json({
        success: true,
        id: results.insertId,
      });
    } else{
      res.status(400).json({
        success: false,
        message: "No se pudo agregar la pista",
      });
    }
  } catch (error) {res.status(500).json({
    success: false,
    message: "Error al insertar la pista"
  })}
});


// ENDOPOINT PARA ACTUALIZAR UNA ENTRADA EXISTENTE 
// URL POSTMAN: http://localhost:5005/pistas/13 (La laguna a cerrada)
server.put('/pistas/:id', async (req, res)=>{
  try {
    const {id} = req.params;
    const {nombre, dificultad, estado, longitud, fk_estaciones} = req.body;

    // Validar que la pista existe antes de modificarla
    const conn = await dbConnection();
    const checkPista = "SELECT * FROM esquiar.pistas WHERE id_pistas=?";
    const [pistaResult] = await conn.query (checkPista, [id]);
    if (pistaResult.length === 0){
      return res.status(400).json({
        success: false, 
        message: "Error: la pista no existe"
      })
    };

    const updatePistas = "UPDATE esquiar.pistas SET nombre =?, dificultad=?, estado=?, longitud=?, fk_estaciones=? WHERE id_pistas=?"

    const [result] = await conn.query (updatePistas, [nombre, dificultad, estado, longitud, fk_estaciones, id])
    
    conn.end();
    
    if (result.affectedRows >0){
      res.status(200).json({
        succes: true,
        message: "La pista ha sido modificada"
      });
    } else {
      res.status(400).json({
        success: false, 
        message: "Error: la pista no ha sido modificada"
      });
    }
  } catch (error) {res.status(500).json({
    success: false,
    message: "Error al actualizar la pista"
  })}
});


// ENDOPOINT PARA ELIMINAR UNA ENTRADA EXISTENTE 
// URL: http://localhost:5005/pistas/15 (La laguna repetida)
server.delete('/pistas/:id', async (req, res)=>{
  try {
    const {id} = req.params;
    const conn = await dbConnection();

    const checkPista = "SELECT * FROM esquiar.pistas WHERE id_pistas=?";
    const [pistaResult] = await conn.query (checkPista, [id]);
    if (pistaResult.length === 0){
      return res.status(400).json({
        success: false, 
        message: "Error: la pista no existe"
      })
    };

    const deletePista = "DELETE FROM esquiar.pistas WHERE id_pistas =?"

    const [result] = await conn.query(deletePista, [id]);
    conn.end();

    if (result.affectedRows >0){
      res.status(200).json({
        succes: true,
        message: "La pista ha sido eliminada"
      });
    } else {
      res.status(400).json({
        success: false, 
        message: "Error: la pista no ha sido eliminada"
      });
    }
  } catch (error) {res.status(500).json({
    success: false,
    message: "Error al eliminar la pista"
  });}
})


const PORT = 5005;
server.listen(PORT, () => {
  console.log(`Server is running http://localhost:${PORT}`);
});
