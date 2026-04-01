// ============================================================
// scripts/seed.js — Datos iniciales para MongoDB
// ============================================================
// Ejecutar UNA SOLA VEZ con: npm run seed
// Crea los 3 usuarios y 5 conceptos de ejemplo
// ============================================================

const mongoose = require('mongoose');
const Usuario  = require('../models/UsuarioModel');
const Concepto = require('../models/ConceptoModel');

async function seed() {
  await mongoose.connect('mongodb://127.0.0.1:27017/SisFactura');
  console.log('✅ Conectado a MongoDB');

  // Limpiar colecciones
  await Usuario.deleteMany({});
  await Concepto.deleteMany({});
  console.log('🗑  Colecciones limpiadas');

  // Crear usuarios
  const admin = await Usuario.crearConHash({
    username:       'admin',
    nombreCompleto: 'Administrador',
    password:       'admin123',
    rol:            'admin'
  });

  await Usuario.crearConHash({
    username:       'carlos',
    nombreCompleto: 'Carlos Ramírez',
    password:       'carlos123',
    rol:            'privileged'
  });

  await Usuario.crearConHash({
    username:       'laura',
    nombreCompleto: 'Laura Solano',
    password:       'laura123',
    rol:            'viewer'
  });

  console.log('👤 Usuarios creados: admin / carlos / laura');

  // Crear conceptos
  await Concepto.insertMany([
    { nombre: 'Donación',              descripcion: 'Aporte voluntario',              precioSugerido: 0,     creadoPor: admin._id },
    { nombre: 'Almuerzo',              descripcion: 'Servicio de alimentación',        precioSugerido: 5.50,  creadoPor: admin._id },
    { nombre: 'Pago de mantenimiento', descripcion: 'Cuota mensual de servicio',       precioSugerido: 35.00, creadoPor: admin._id },
    { nombre: 'Consultoría',           descripcion: 'Horas de asesoría profesional',   precioSugerido: 75.00, creadoPor: admin._id },
    { nombre: 'Transporte',            descripcion: 'Servicio de traslado',            precioSugerido: 15.00, creadoPor: admin._id }
  ]);

  console.log('📋 Conceptos de ejemplo creados');
  console.log('');
  console.log('========================================');
  console.log('  ✅ Seed completado exitosamente');
  console.log('  Usuarios de prueba:');
  console.log('    admin   / admin123   → Administrador');
  console.log('    carlos  / carlos123  → Privilegiado');
  console.log('    laura   / laura123   → Visor');
  console.log('========================================');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
