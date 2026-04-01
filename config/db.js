// ============================================================
// config/db.js — Conexión a MongoDB con Mongoose
// ============================================================
// MongoDB Compass corre en: mongodb://localhost:27017
// No requiere usuario ni contraseña en instalación local
// ============================================================

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/SisFactura';

async function conectar() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB — SisFactura');
  } catch (err) {
    console.error('❌ Error al conectar a MongoDB:', err.message);
    process.exit(1);
  }
}

module.exports = { conectar };
