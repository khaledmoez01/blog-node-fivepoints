let express = require('express');
let router = express.Router();

// Require controller modules.
let index_controller = require('../controllers/indexController');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.send('Hello World!');
});

//01   body(firstName, lastName, email, password, role) - Création d’un user
router.post('/signup', index_controller.index_signup_post);  // kmg done

//02   body(email, password) - Authentification d’un user
router.post('/login', index_controller.index_login_post);  // kmg done

module.exports = router;