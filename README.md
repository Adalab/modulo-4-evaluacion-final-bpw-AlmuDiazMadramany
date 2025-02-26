# Esquiar API

Este proyecto es una API REST desarrollada con Node.js, Express y MySQL para gestionar información sobre pistas de esquí en diferentes estaciones y usuarios.

## Tecnologías utilizadas

- Node.js
- Express
-  MySQL
- bcrypt
- jsonwebtoken
- dotenv

## Instalación

### Clona el repositorio:

https://github.com/Adalab/modulo-4-evaluacion-final-bpw-AlmuDiazMadramany.git

### Accede a la carpeta del proyecto:

cd esquiar-api

### Instala las dependencias:

npm install

### Crea un archivo .env en la raíz del proyecto y define la variable de entorno:

PASSWORDDB=tu_contraseña_mysql

### Inicia el servidor:

node index.js

## Endpoints

### Pistas

- Obtener todas las pistas

    - GET /pistas

    - Retorna una lista de todas las pistas de esquí.

- Crear una nueva pista

    - POST /nuevapista

    - Body:
        {
        "nombre": "Nombre de la pista",
        "dificultad": "Fácil",
        "estado": "Abierta",
        "longitud": 1200,
        "fk_estaciones": 1
        }

- Actualizar una pista existente

    - PUT /pistas/:id

    - Body igual al de creación.

- Eliminar una pista

    - DELETE /pistas/:id

###  Usuarios

- Registrar un usuario

    - POST /register

    - Body:

        {
        "email": "usuario@ejemplo.com",
        "nombre": "Usuario",
        "password": "contraseña"
        }

- Iniciar sesión

    - POST /login

    - Body:

        {
        "email": "usuario@ejemplo.com",
        "password": "contraseña"
        }

    - Respuesta:

        {
        "success": true,
        "token": "JWT_TOKEN"
        }

- Listar usuarios (requiere autenticación)

   - GET /userslist

    - Debe incluir un token en el header Authorization: Bearer JWT_TOKEN.

## Autenticación

Se utiliza jsonwebtoken para la autenticación de usuarios.

Los endpoints protegidos requieren un token JWT válido.

## Base de datos

El proyecto usa MySQL. Asegúrate de crear la base de datos esquiar y las tablas correspondientes antes de ejecutar la API.

## Ejecutar en otro puerto

Si deseas cambiar el puerto, modifica la variable PORT en index.js.


## Creado por AlmuDíazMadramany como prueba del Módulo 4 en Adalab
