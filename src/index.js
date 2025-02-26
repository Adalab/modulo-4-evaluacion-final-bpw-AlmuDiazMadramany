//imports
const express = require('express');
const cors = require('cors');
const mysql = require ('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

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
  
// --> CRUD 

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
// URL POSTMAN: http://localhost:5005/pistas/15 (La laguna repetida)
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


// --> REGISTRO USUARIO
// URL POSTMAN: http://localhost:5005/register
server.post('/register', async (req, res) => {
  try {
    const conn = await dbConnection();
    const { email, nombre, password } = req.body;

    const selectEmail = 'SELECT email FROM esquiar.usuarios_db WHERE email = ?';
    const [emailResult] = await conn.query(selectEmail, [email]);

    if (emailResult.length === 0) {

      const passwordHashed = await bcrypt.hash(password, 10);
      const insertUser = 'INSERT INTO esquiar.usuarios_db (email, nombre, password) values (?, ?, ?)';
      const [result] = await conn.query(insertUser, [email, nombre, passwordHashed]);
      conn.end();
      res.status(201).json({ success: true, id: result.insertId });

    } else {
      res.status(200).json({ success: false, message: 'El usuario ya existe'});
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al registrar al usuario"
    });
  }
});


// --> LOGIN USUARIO
// URL POSTMAN: http://localhost:5005/login
server.post('/login', async (req, res) => {

  try {
    const conn = await dbConnection();
    const { email, password } = req.body;

  const selectEmail = 'SELECT * FROM esquiar.usuarios_db WHERE email = ?';
  const [emailResult] = await conn.query(selectEmail, [email]);


  if (emailResult.length !== 0) {
    const passwordDB = emailResult[0].password;
    const isSamePassword = await bcrypt.compare(password, passwordDB);

    if (isSamePassword) {
      const infoToken = { email: emailResult[0].email, id: emailResult[0].id };
      const token = jwt.sign(infoToken, 'usuarioesquiar', { expiresIn: '1h' });
      res.status(200).json({ success: true, token: token });
    } else {
      res
        .status(200).json({ success: false, message: 'contraseña incorrecta' });
    }
  } else {
    res.status(200).json({ success: false, message: 'email incorrecto'});
  }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error en el login"
    });
  }
});

// Usuario registrado: { "email": "almu@prueba.com", "nombre": "almu", "password": "prueba123"}

// Middleware
function auth(req, res, next) {
  const tokenString = req.headers.authorization;
  if (!tokenString) {
    res.status(401).json({ success: false, message: 'No esta autorizado' });
  } else {
    try {
      const token = tokenString.split(' ')[1];
      const verifyToken = jwt.verify(token, 'usuarioesquiar');
      req.data = verifyToken;
      next();
    } catch (error) {
      res.status(403).json({ success: false, message: "El token no es correcto" });
    }
    
  }
};

//lista de usuarios con autorización
// URL: http://localhost:5005/userslist
server.get('/userslist', auth, async (req, res) => {
  try {
    const conn = await dbConnection();
    const sqlUser = 'SELECT id_usuarios_db, email, nombre FROM esquiar.usuarios_db';
    const [results] = await conn.query(sqlUser);
    conn.end()
    res.status(200).json({
      success: true, 
      data: results
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener los usuarios"
    })
  }
});

// Token postman: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFsbXVAcHJ1ZWJhLmNvbSIsImlhdCI6MTc0MDU2NjA3MCwiZXhwIjoxNzQwNTY5NjcwfQ.3Jp1Qn7xb6aiAFBEw8XYib11NhU3u9XJuRLdox0m8AY

const PORT = 5005;
server.listen(PORT, () => {
  console.log(`Server is running http://localhost:${PORT}`);
});
