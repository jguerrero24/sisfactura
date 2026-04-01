# SisFactura — Sistema de Facturación (MongoDB)

## 📁 Estructura MVC

```
sisfactura/
├── app.js                          ← Entrada principal
├── package.json
│
├── config/
│   ├── db.js                       ← Conexión a MongoDB (mongoose)
│   └── app.js                      ← Puerto, sesión, permisos por rol
│
├── models/                         ← MODEL
│   ├── UsuarioModel.js             ← Schema Mongoose de usuarios
│   ├── ConceptoModel.js            ← Schema Mongoose de conceptos
│   └── FacturaModel.js             ← Schema Mongoose de facturas + ítems
│
├── controllers/                    ← CONTROLLER
│   ├── authMiddleware.js
│   ├── AuthController.js
│   ├── FacturaController.js
│   ├── ConceptoController.js
│   └── UsuarioController.js
│
├── routes/
│   └── index.js                    ← Todas las rutas con permisos
│
├── views/                          ← VIEW (EJS)
│   ├── partials/
│   │   ├── header.ejs
│   │   └── factura-paper.ejs       ← Factura imprimible documentada
│   ├── auth/login.ejs
│   ├── facturas/{index,nueva,ver,imprimir}.ejs
│   ├── conceptos/index.ejs
│   ├── usuarios/index.ejs
│   ├── dashboard.ejs
│   └── errors/{404,500}.ejs
│
├── public/
│   ├── css/main.css
│   └── js/main.js
│
└── scripts/
    └── seed.js                     ← Datos iniciales (ejecutar 1 vez)
```

## ⚙️ Instalación paso a paso

### 1. Verificar MongoDB Compass
Abrir MongoDB Compass y asegurarse de que la conexión `mongodb://localhost:27017` esté activa (botón Connect).

### 2. Instalar dependencias
```bash
cd sisfactura
npm install
```

### 3. Cargar datos iniciales
```bash
npm run seed
```
Esto crea los 3 usuarios y 5 conceptos de ejemplo en MongoDB.

### 4. Iniciar la aplicación
```bash
npm start
```
Abrir: **http://localhost:3000**

## 👥 Usuarios

| Usuario | Contraseña  | Rol           |
|---------|-------------|---------------|
| admin   | admin123    | Administrador |
| carlos  | carlos123   | Privilegiado  |
| laura   | laura123    | Visor         |

## 🔒 Permisos por rol

| Permiso              | Admin | Privilegiado | Visor |
|----------------------|-------|--------------|-------|
| Ver facturas         | ✅    | ✅           | ✅    |
| Crear factura        | ✅    | ✅           | ❌    |
| Imprimir factura     | ✅    | ✅           | ❌    |
| Gestionar conceptos  | ✅    | ✅           | ❌    |
| Gestionar usuarios   | ✅    | ❌           | ❌    |

## 🧾 Campos de la Factura

| Campo           | MongoDB field      | CSS class           | Ubicación            |
|-----------------|--------------------|---------------------|----------------------|
| N° Factura      | `numeroFactura`    | `.inv-id`           | Encabezado izquierda |
| Empresa         | `nombreEmpresa`    | `.inv-company-name` | Encabezado centro    |
| Teléfono        | `telefonoEmpresa`  | `.inv-phone`        | Encabezado derecha   |
| Comprador       | `nombreComprador`  | `.inv-buyer`        | Partes izquierda     |
| Vendedor        | `nombreVendedor`   | `.inv-seller`       | Partes derecha       |
| Fecha           | `fecha`            | `.inv-date`         | Meta derecha         |
| Concepto ítem   | `items[].concepto` | `.inv-item-concept` | Tabla ítems          |
| Total           | `total`            | `.inv-total-amount` | Pie derecha          |
