// ============================================================
// app.js — ARCHIVO PRINCIPAL DE LA APLICACIÓN
// Inicia Express y conecta a MongoDB
// ============================================================

// ⚠️ DEBE SER LA PRIMERA LÍNEA - Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');

// Importar configuración y conexión a BD
const dbConnect = require('./config/db');
const config = require('./config/app');
const routes = require('./routes');
const { requireLogin } = require('./controllers/authMiddleware');

// Crear aplicación Express
const app = express();

// ════════════════════════════════════════════════════════════
// 1. CONECTAR A MONGODB
// ════════════════════════════════════════════════════════════
dbConnect();

// ════════════════════════════════════════════════════════════
// 2. CONFIGURAR VISTAS (EJS)
// ════════════════════════════════════════════════════════════
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ════════════════════════════════════════════════════════════
// 3. MIDDLEWARE - PARSER DE DATOS
// ════════════════════════════════════════════════════════════
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ════════════════════════════════════════════════════════════
// 4. ARCHIVOS ESTÁTICOS
// ════════════════════════════════════════════════════════════
app.use(express.static(path.join(__dirname, 'public')));

// ════════════════════════════════════════════════════════════
// 5. SESIONES
// ════════════════════════════════════════════════════════════
app.use(session({
  secret: process.env.SESSION_SECRET || config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: config.sessionMaxAge
  }
}));

// ════════════════════════════════════════════════════════════
// 6. FLASH MESSAGES
// ════════════════════════════════════════════════════════════
app.use(flash());

// ════════════════════════════════════════════════════════════
// 7. MIDDLEWARE - USUARIO EN VISTAS
// ════════════════════════════════════════════════════════════
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  res.locals.messages = req.flash();
  next();
});

// ════════════════════════════════════════════════════════════
// 8. RUTAS
// ════════════════════════════════════════════════════════════
app.use('/', routes);

// ════════════════════════════════════════════════════════════
// 9. MANEJO DE ERRORES 404
// ════════════════════════════════════════════════════════════
app.use((req, res) => {
  res.status(404).render('404', { titulo: 'Página no encontrada' });
});

// ════════════════════════════════════════════════════════════
// 10. INICIAR SERVIDOR
// ════════════════════════════════════════════════════════════
const PORT = process.env.PORT || config.port;

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║            ✅ SISFACTURA INICIADO CORRECTAMENTE        ║');
  console.log('║                                                        ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  🌐 URL:     http://localhost:${PORT}`);
  console.log('║  📊 BD:      MongoDB Atlas (Nube)');
  console.log('║  🔐 Login:   admin / admin123');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;