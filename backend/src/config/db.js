const mongoose = require('mongoose');

const conectarDB = async () =>
{
    try
    {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gestor_documentos';
        const conexion = await mongoose.connect(uri,
        {
            autoIndex: true,
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`Conectado exitosamente en: ${conexion.connection.host}`);
    }
    catch (error)
    {
        console.error(`Error al conectar a la base de datos: ${error.message}`);
        process.exit(1);
    }
};

module.exports = conectarDB;