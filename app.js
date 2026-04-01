// ============================================================
// app.js — Punto de entrada de SisFactura (MongoDB)
// ============================================================

const express        = require('express');
const session        = require('express-session');
const flash          = require('connect-flash');
const methodOverride = require('method-override');
const path           = require('path');

const { conectar }   = require('./config/db');
const appConfig      = require('./config/app');
const routes         = require('./routes/index');
const { exposeUser } = require('./controllers/authMiddleware');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret:            appConfig.sessionSecret,
  resave:            false,
  saveUninitialized: false,
  cookie: { maxAge: appConfig.sessionMaxAge }
}));

app.use(flash());
app.use(exposeUser);
app.use('/', routes);

app.use((req, res) => res.status(404).render('errors/404', { titulo: '404' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('errors/500', { titulo: 'Error' });
});

async function start() {
  await conectar();
  app.listen(appConfig.port, () => {
    console.log(`🚀 SisFactura en http://localhost:${appConfig.port}`);
  });
}

start();
