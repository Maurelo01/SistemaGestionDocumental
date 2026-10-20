require('dotenv').config();
const express = require('express');
const cors = require('cors');
const conectarDB = require('./config/db');

const rutasAutenticacion = require('./routes/autenticacionRoutes');
const rutasUsuarios = require('./routes/usuariosRoutes');

const app = express();
const PUERTO = process.env.PUERTO || 3000;

conectarDB();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', rutasAutenticacion);
app.use('/api/v1/usuarios', rutasUsuarios);

app.get('/api/v1/salud', (req, res) =>
{
    res.status(200).json({ exito: true, mensaje: 'API del Sistema de Gestión Documental activa' });
});

app.use((req, res) =>
{
    res.status(404).json({ exito: false, mensaje: 'Endpoint no encontrado' });
});

app.listen(PUERTO, () =>
{
    console.log(`[Servidor] Corriendo en http://localhost:${PUERTO}`);
});