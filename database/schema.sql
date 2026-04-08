-- ============================================================
-- SisFactura — Script de Base de Datos
-- Motor: SQL Server (SSMS)
-- Versión: 1.0
-- ============================================================
-- INSTRUCCIONES:
--   1. Abrir SSMS y conectarse al servidor
--   2. Ejecutar primero el bloque CREATE DATABASE
--   3. Seleccionar la base de datos y ejecutar el resto
-- ============================================================

-- ── 1. CREAR BASE DE DATOS ──────────────────────────────────
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'SisFactura')
BEGIN
    CREATE DATABASE SisFactura;
END
GO

USE SisFactura;
GO

-- ── 2. TABLA: Roles ─────────────────────────────────────────
-- Define los tres niveles de acceso del sistema
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Roles' AND xtype='U')
BEGIN
    CREATE TABLE Roles (
        Id          INT IDENTITY(1,1) PRIMARY KEY,
        Nombre      NVARCHAR(50)  NOT NULL UNIQUE,  -- 'admin' | 'privileged' | 'viewer'
        Descripcion NVARCHAR(200) NULL
    );
END
GO

-- ── 3. TABLA: Usuarios ──────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Usuarios' AND xtype='U')
BEGIN
    CREATE TABLE Usuarios (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        Username     NVARCHAR(50)  NOT NULL UNIQUE,
        NombreCompleto NVARCHAR(150) NOT NULL,
        PasswordHash NVARCHAR(256) NOT NULL,        -- SHA-256 en hex (sin sal, demo)
        RolId        INT           NOT NULL REFERENCES Roles(Id),
        Activo       BIT           NOT NULL DEFAULT 1,
        CreadoEn     DATETIME2     NOT NULL DEFAULT GETDATE()
    );
END
GO

-- ── 4. TABLA: Conceptos ─────────────────────────────────────
-- Catálogo de conceptos de facturación (donación, almuerzo, etc.)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Conceptos' AND xtype='U')
BEGIN
    CREATE TABLE Conceptos (
        Id             INT IDENTITY(1,1) PRIMARY KEY,
        Nombre         NVARCHAR(150) NOT NULL,
        Descripcion    NVARCHAR(300) NULL,
        PrecioSugerido DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        Activo         BIT           NOT NULL DEFAULT 1,
        CreadoPorId    INT           NULL REFERENCES Usuarios(Id),
        CreadoEn       DATETIME2     NOT NULL DEFAULT GETDATE()
    );
END
GO

-- ── 5. TABLA: Facturas ──────────────────────────────────────
/*
 * ESTRUCTURA DE LA FACTURA — cada columna mapea a un campo visible:
 *
 *  NumeroFactura  → ID de factura mostrado (FAC-0001)
 *  NombreEmpresa  → Nombre de la empresa   [centro del encabezado]
 *  TelefonoEmpresa→ Teléfono               [derecha del encabezado]
 *  NombreComprador→ Nombre del comprador
 *  NombreVendedor → Nombre del vendedor
 *  Fecha          → Fecha formato DD-MM-AAAA
 *  Total          → Suma calculada de todos los ítems
 *
 * Para agregar un campo nuevo:
 *   1. ALTER TABLE Facturas ADD NuevoCampo TIPO;
 *   2. Actualizar FacturaModel.crear() en models/FacturaModel.js
 *   3. Actualizar FacturaController y la vista views/factura.html
 */
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Facturas' AND xtype='U')
BEGIN
    CREATE TABLE Facturas (
        Id              INT IDENTITY(1,1) PRIMARY KEY,
        NumeroFactura   NVARCHAR(20)   NOT NULL UNIQUE,   -- FAC-0001
        NombreEmpresa   NVARCHAR(200)  NOT NULL,
        TelefonoEmpresa NVARCHAR(50)   NULL,
        NombreComprador NVARCHAR(200)  NOT NULL,
        NombreVendedor  NVARCHAR(200)  NOT NULL,
        Fecha           DATE           NOT NULL,           -- almacenado como DATE
        FechaFormateada AS (                               -- columna calculada DD-MM-AAAA
            CONVERT(NVARCHAR(10), Fecha, 105)
        ),
        Total           DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
        CreadoPorId     INT            NOT NULL REFERENCES Usuarios(Id),
        CreadoEn        DATETIME2      NOT NULL DEFAULT GETDATE(),
        Anulada         BIT            NOT NULL DEFAULT 0
    );
END
GO

-- ── 6. TABLA: FacturaItems ──────────────────────────────────
-- Líneas de detalle de cada factura
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='FacturaItems' AND xtype='U')
BEGIN
    CREATE TABLE FacturaItems (
        Id          INT IDENTITY(1,1) PRIMARY KEY,
        FacturaId   INT            NOT NULL REFERENCES Facturas(Id) ON DELETE CASCADE,
        ConceptoId  INT            NULL     REFERENCES Conceptos(Id),
        Concepto    NVARCHAR(150)  NOT NULL,  -- nombre guardado al momento de facturar
        Cantidad    DECIMAL(10,2)  NOT NULL DEFAULT 1,
        PrecioUnitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        Subtotal    AS (Cantidad * PrecioUnitario) PERSISTED  -- columna calculada
    );
END
GO

-- ── 7. ÍNDICES ──────────────────────────────────────────────
CREATE INDEX IX_Facturas_CreadoEn   ON Facturas(CreadoEn DESC);
CREATE INDEX IX_Facturas_NomEmpresa ON Facturas(NombreEmpresa);
CREATE INDEX IX_Usuarios_RolId      ON Usuarios(RolId);
GO

-- ── 8. DATOS INICIALES: Roles ───────────────────────────────
INSERT INTO Roles (Nombre, Descripcion) VALUES
    ('admin',      'Administrador: gestiona usuarios, conceptos y facturas'),
    ('privileged', 'Privilegiado: crea conceptos e imprime facturas'),
    ('viewer',     'Visor: solo puede consultar facturas y conceptos');
GO

-- ── 9. DATOS INICIALES: Usuarios ────────────────────────────
-- Contraseñas hasheadas SHA-256:
--   admin123   → 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a
--   carlos123  → hash generado por la app al registrar
--   laura123   → hash generado por la app al registrar
-- NOTA: En producción usar bcrypt. Aquí SHA-256 solo para demo.
INSERT INTO Usuarios (Username, NombreCompleto, PasswordHash, RolId) VALUES
    ('admin',  'Administrador',  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a', 1),
    ('priv', 'privilegiado', CONVERT(NVARCHAR(256), HASHBYTES('SHA2_256', 'priv123'), 2),     2),
    ('visor',  'visor',   CONVERT(NVARCHAR(256), HASHBYTES('SHA2_256', 'visor123'),  2),     3);
GO

-- ── 10. DATOS INICIALES: Conceptos ──────────────────────────
INSERT INTO Conceptos (Nombre, Descripcion, PrecioSugerido, CreadoPorId) VALUES
    ('Donación',              'Aporte voluntario',           0.00,  1),
    ('Almuerzo',              'Servicio de alimentación',    5.50,  1),
    ('Pago de mantenimiento', 'Cuota mensual de servicio',  35.00,  1),
    ('Consultoría',           'Horas de consultoría',       75.00,  1);
GO

-- ── 11. STORED PROCEDURES ───────────────────────────────────

-- SP: Obtener todos los usuarios con su rol
CREATE OR ALTER PROCEDURE sp_GetUsuarios
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.Id, u.Username, u.NombreCompleto, u.Activo, u.CreadoEn,
           r.Nombre AS Rol
    FROM   Usuarios u
    JOIN   Roles r ON r.Id = u.RolId
    ORDER  BY u.Id;
END
GO

-- SP: Login — valida credenciales
CREATE OR ALTER PROCEDURE sp_Login
    @Username     NVARCHAR(50),
    @PasswordHash NVARCHAR(256)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.Id, u.Username, u.NombreCompleto, u.Activo,
           r.Nombre AS Rol
    FROM   Usuarios u
    JOIN   Roles r ON r.Id = u.RolId
    WHERE  u.Username     = @Username
      AND  u.PasswordHash = @PasswordHash
      AND  u.Activo       = 1;
END
GO

-- SP: Crear factura + sus ítems (transacción)
CREATE OR ALTER PROCEDURE sp_CrearFactura
    @NombreEmpresa    NVARCHAR(200),
    @TelefonoEmpresa  NVARCHAR(50),
    @NombreComprador  NVARCHAR(200),
    @NombreVendedor   NVARCHAR(200),
    @Fecha            DATE,
    @Total            DECIMAL(10,2),
    @CreadoPorId      INT,
    @Items            NVARCHAR(MAX)   -- JSON: [{conceptoId, concepto, cantidad, precio}]
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Generar número de factura
        DECLARE @Seq INT;
        SELECT @Seq = ISNULL(MAX(Id), 0) + 1 FROM Facturas;
        DECLARE @NumFac NVARCHAR(20) = 'FAC-' + RIGHT('0000' + CAST(@Seq AS NVARCHAR), 4);

        INSERT INTO Facturas (NumeroFactura, NombreEmpresa, TelefonoEmpresa,
                              NombreComprador, NombreVendedor, Fecha, Total, CreadoPorId)
        VALUES (@NumFac, @NombreEmpresa, @TelefonoEmpresa,
                @NombreComprador, @NombreVendedor, @Fecha, @Total, @CreadoPorId);

        DECLARE @FacturaId INT = SCOPE_IDENTITY();

        -- Insertar ítems desde JSON
        INSERT INTO FacturaItems (FacturaId, ConceptoId, Concepto, Cantidad, PrecioUnitario)
        SELECT @FacturaId,
               JSON_VALUE(item.value, '$.conceptoId'),
               JSON_VALUE(item.value, '$.concepto'),
               JSON_VALUE(item.value, '$.cantidad'),
               JSON_VALUE(item.value, '$.precio')
        FROM   OPENJSON(@Items) AS item;

        COMMIT;
        SELECT @FacturaId AS FacturaId, @NumFac AS NumeroFactura;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END
GO

-- SP: Listar facturas con paginación
CREATE OR ALTER PROCEDURE sp_GetFacturas
    @Pagina  INT = 1,
    @PorPag  INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    SELECT f.Id, f.NumeroFactura, f.NombreEmpresa, f.NombreComprador,
           f.NombreVendedor, f.FechaFormateada AS Fecha, f.Total,
           f.CreadoEn, f.Anulada,
           u.NombreCompleto AS CreadoPor
    FROM   Facturas f
    JOIN   Usuarios u ON u.Id = f.CreadoPorId
    ORDER  BY f.CreadoEn DESC
    OFFSET (@Pagina - 1) * @PorPag ROWS
    FETCH  NEXT @PorPag ROWS ONLY;
END
GO

-- SP: Obtener factura completa con ítems
CREATE OR ALTER PROCEDURE sp_GetFacturaById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    -- Cabecera
    SELECT f.Id, f.NumeroFactura, f.NombreEmpresa, f.TelefonoEmpresa,
           f.NombreComprador, f.NombreVendedor, f.FechaFormateada AS Fecha,
           f.Total, f.CreadoEn, f.Anulada,
           u.NombreCompleto AS CreadoPor
    FROM   Facturas f
    JOIN   Usuarios u ON u.Id = f.CreadoPorId
    WHERE  f.Id = @Id;

    -- Ítems
    SELECT fi.Id, fi.ConceptoId, fi.Concepto,
           fi.Cantidad, fi.PrecioUnitario, fi.Subtotal
    FROM   FacturaItems fi
    WHERE  fi.FacturaId = @Id
    ORDER  BY fi.Id;
END
GO
