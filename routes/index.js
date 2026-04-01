// ============================================================
// routes/index.js — Todas las rutas de la aplicación
// ============================================================

const express            = require('express');
const router             = express.Router();
const AuthController     = require('../controllers/AuthController');
const FacturaController  = require('../controllers/FacturaController');
const ConceptoController = require('../controllers/ConceptoController');
const UsuarioController  = require('../controllers/UsuarioController');
const { requireLogin, requirePermiso } = require('../controllers/authMiddleware');

const ReporteController   = require('../controllers/ReporteController');

// ── Auth ─────────────────────────────────────────────────────
router.get ('/',                 (req, res) => res.redirect('/dashboard'));
router.get ('/login',            AuthController.showLogin);
router.post('/login',            AuthController.login);
router.post('/logout',           AuthController.logout);
router.post('/cambiar-password', AuthController.cambiarPassword);

// ── Dashboard ────────────────────────────────────────────────
router.get('/dashboard', requireLogin, UsuarioController.dashboard);

// ── Facturas ─────────────────────────────────────────────────
router.get ('/facturas',              requireLogin, requirePermiso('ver_facturas'),       FacturaController.index);
router.get ('/facturas/nueva',        requireLogin, requirePermiso('crear_factura'),      FacturaController.nueva);
router.post('/facturas',              requireLogin, requirePermiso('crear_factura'),      FacturaController.crear);
router.get ('/facturas/:id',          requireLogin, requirePermiso('ver_facturas'),       FacturaController.ver);
router.post('/facturas/:id/anular',   requireLogin, requirePermiso('gestionar_usuarios'), FacturaController.anular);

// ── Conceptos ────────────────────────────────────────────────
router.get ('/conceptos',             requireLogin, requirePermiso('ver_facturas'),        ConceptoController.index);
router.post('/conceptos',             requireLogin, requirePermiso('gestionar_conceptos'), ConceptoController.crear);
router.post('/conceptos/:id/desactivar', requireLogin, requirePermiso('gestionar_conceptos'), ConceptoController.desactivar);

// ── Usuarios ─────────────────────────────────────────────────
router.get ('/usuarios',                requireLogin, requirePermiso('gestionar_usuarios'), UsuarioController.index);
router.post('/usuarios/crear',          requireLogin, requirePermiso('gestionar_usuarios'), UsuarioController.crear);
router.post('/usuarios/:id/rol',        requireLogin, requirePermiso('gestionar_usuarios'), UsuarioController.cambiarRol);
router.post('/usuarios/:id/toggle',     requireLogin, requirePermiso('gestionar_usuarios'), UsuarioController.toggleActivo);
router.post('/usuarios/:id/eliminar',   requireLogin, requirePermiso('gestionar_usuarios'), UsuarioController.eliminar);

// ── Reportes ─────────────────────────────────────────────────
router.get ('/reportes',           requireLogin, requirePermiso('ver_facturas'), ReporteController.index);
router.post('/reportes/buscar',    requireLogin, requirePermiso('ver_facturas'), ReporteController.buscar);
router.get ('/reportes/imprimir',  requireLogin, requirePermiso('ver_facturas'), ReporteController.imprimir);

module.exports = router;
