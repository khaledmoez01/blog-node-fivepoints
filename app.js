let createError     = require('http-errors');
let express         = require('express');
let swaggerUi       = require('swagger-ui-express');
let swaggerDocument = require('./swagger.json');
let path            = require('path');
let cookieParser    = require('cookie-parser');
let logger          = require('morgan');
let compression     = require('compression');
let helmet          = require('helmet'); // protection des vulnerabilites

let indexRouter      =  require('./routes/index');
let adminRouter      =  require('./routes/admin');
let simpleuserRouter =  require('./routes/simpleuser');

let app = express();
app.use(helmet());
//Set up mongoose connection
let mongoose = require('mongoose');
let mongoDB = 'mongodb://localhost:27017/fivePointsBlog';
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.set('useCreateIndex', true);
mongoose.Promise = global.Promise;
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());

app.use(compression()); //Compress all routes

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/simpleuser', simpleuserRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


let port = process.env.PORT || 3000;

let server = app.listen(port, function() {
  console.log('Express server listening on port ' + port);
});