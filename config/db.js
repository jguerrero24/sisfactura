// ============================================================
// config/db.js — ACTUALIZADO PARA MONGODB ATLAS (NUBE)
// Conexión segura a MongoDB en la nube
// ============================================================

const mongoose = require('mongoose');
require('dotenv').config(); // Para leer variables de entorno

// Obtener URL de MongoDB desde variable de entorno o usar la proporcionada
const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://guejose94_db_user:<db_password>@cluster0.skra0ge.mongodb.net/?appName=Cluster0';

// ⚠️ IMPORTANTE: REEMPLAZA <db_password> CON TU CONTRASEÑA REAL
// Ejemplo correcto:
// mongodb+srv://guejose94_db_user:tu_contraseña_aqui@cluster0.skra0ge.mongodb.net/?appName=Cluster0

// Configuración de conexión
const mongooseConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,      // Timeout de 5 segundos
  connectTimeoutMS: 10000,              // Timeout de conexión
  socketTimeoutMS: 45000,               // Timeout de socket
  retryWrites: true,                    // Reintentar escrituras
  w: 'majority',                        // Esperar confirmación de mayoría
  family: 4                             // IPv4 (evita problemas con IPv6)
};

const dbConnect = async () => {
  try {
    console.log('[MongoDB] Conectando a MongoDB Atlas...');
    
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI, mongooseConfig);
    
    console.log('✅ Conectado a MongoDB — SisFactura');
    console.log(`📊 Base de datos: ${mongoose.connection.db.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    
    // Eventos de conexión
    mongoose.connection.on('connected', () => {
      console.log('[MongoDB] Conexión establecida');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Error de conexión:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Desconectado de MongoDB');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n[MongoDB] Cerrando conexión...');
      await mongoose.connection.close();
      console.log('[MongoDB] Conexión cerrada');
      process.exit(0);
    });
    
  } catch (err) {
    console.error('❌ Error al conectar a MongoDB:');
    console.error('   Mensaje:', err.message);
    console.error('   Código:', err.code);
    
    if (err.message.includes('authentication failed')) {
      console.error('\n⚠️  ERROR DE AUTENTICACIÓN');
      console.error('   Verifica tu contraseña en la URL de conexión');
      console.error('   URL: mongodb+srv://usuario:CONTRASEÑA@cluster.mongodb.net/...');
    }
    
    if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
      console.error('\n⚠️  ERROR DE RED');
      console.error('   No se puede conectar al servidor MongoDB');
      console.error('   Verifica tu conexión a internet');
    }
    
    if (err.message.includes('Timeout')) {
      console.error('\n⚠️  TIMEOUT');
      console.error('   La conexión tardó demasiado');
      console.error('   Intenta nuevamente en unos momentos');
    }
    
    // Reintentar conexión después de 5 segundos
    console.log('\n🔄 Reintentando conexión en 5 segundos...');
    setTimeout(dbConnect, 5000);
  }
};

module.exports = dbConnect;