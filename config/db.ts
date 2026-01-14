
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();
const config: sql.config = {

    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST || 'localhost', 
    database: process.env.DB_NAME,
    
    options: {
    
        trustServerCertificate: true, 
        encrypt: false, 
    },
    
    pool: {
        max: 10, 
        min: 0,  
        idleTimeoutMillis: 30000 
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log(' SQL Server Connected successfully!');
        return pool;
    })
    .catch(err => {
        console.error(' Database Connection Failed!', err);
        throw err;
    });
export { sql, poolPromise };