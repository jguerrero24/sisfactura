const mongoose = require('mongoose');
const Usuario  = require('../models/UsuarioModel');
const Concepto = require('../models/ConceptoModel');
require('dotenv').config(); // IMPORTANTE: Para leer tu MONGO_URI de Atlas

async function seed() {
  try {
    // 1. Conexión dinámica usando variables de entorno
    const uri = process.env.MONGODB_URI; 
    
    if (!uri) {
      throw new Error('❌ No se encontró la variable MONGO_URI en el archivo .env');
    }

    await mongoose.connect(uri);
    console.log(`✅ Conectado a MongoDB Atlas: ${mongoose.connection.name}`);

    // 2. Limpiar colecciones
    await Usuario.deleteMany({});
    await Concepto.deleteMany({});
    console.log('🗑️  Colecciones limpiadas en la nube');

    // 3. Crear usuarios
    // Nota: He corregido los nombres para que coincidan con los logs finales
    const admin = await Usuario.crearConHash({
      username:       'admin',
      nombreCompleto: 'Administrador',
      password:       'admin123',
      rol:            'admin'
    });

    await Usuario.crearConHash({
      username:       'carlos', // Cambiado de 'super' a 'carlos' para consistencia
      nombreCompleto: 'Carlos - Supervisor',
      password:       'carlos123',
      rol:            'privileged'
    });

    await Usuario.crearConHash({
      username:       'laura', // Cambiado de 'visor' a 'laura' para consistencia
      nombreCompleto: 'Laura - Visor',
      password:       'laura123',
      rol:            'viewer'
    });

    console.log('👤 Usuarios creados exitosamente');

    // 4. Crear conceptos
    await Concepto.insertMany([
      { nombre: 'Donación',              descripcion: 'Aporte voluntario',               precioSugerido: 0,     creadoPor: admin._id },
      { nombre: 'Almuerzo',              descripcion: 'Servicio de alimentación',        precioSugerido: 5.50,  creadoPor: admin._id },
      { nombre: 'Pago de mantenimiento', descripcion: 'Cuota mensual de servicio',       precioSugerido: 35.00, creadoPor: admin._id },
      { nombre: 'Consultoría',           descripcion: 'Horas de asesoría profesional',   precioSugerido: 75.00, creadoPor: admin._id },
      { nombre: 'Transporte',            descripcion: 'Servicio de traslado',            precioSugerido: 15.00, creadoPor: admin._id }
    ]);

    console.log('📋 Conceptos de ejemplo creados');
    console.log('\n========================================');
    console.log('  ✅ Seed completado exitosamente en Atlas');
    console.log('  Usuarios de prueba:');
    console.log('    admin   / admin123   → Administrador');
    console.log('    carlos  / carlos123  → Privilegiado');
    console.log('    laura   / laura123   → Visor');
    console.log('========================================');

  } catch (err) {
    console.error('❌ Error en el proceso de seed:', err.message);
  } finally {
    // 5. Cerrar siempre la conexión
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();