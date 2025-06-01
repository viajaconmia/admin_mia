import mysql from "mysql2/promise"

let connection;

export const crearConeccion = async() => {
    if(!connection){
        connection = await mysql.createConnection({
            host:"127.0.0.1",
            port: 3306,
            user: "root",
            password: "juanin+3",
            database: "noktos_prueba"
        })
    }
    return connection;
}