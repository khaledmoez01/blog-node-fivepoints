let User = require('../models/user');
let passport = require('passport');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

let async = require('async');

//01   body(firstName, lastName, email, password, role) - Création d’un user
exports.index_signup_post = [

    // Sanitize fields.
    sanitizeBody('*').trim().escape(),

    (req, res, next) => {
        //res.send('NOT IMPLEMENTED: index_signup_post');
        // Check if USer with same email already exists.
        User.findOne({ 'user_email': req.body.email }).exec(function (err, found_user) { 
            if (err) { return next(err); }

            if (found_user) {
                // user exists
                return res.status(422).json({ code: "422", message: "user with email " + found_user.user_email + " already exists" });
            }
            else {
                User.create({
                    user_first_name: req.body.first_name,
                    user_family_name: req.body.family_name,
                    user_email: req.body.email,
                    user_password: req.body.password,
                    user_role: req.body.role
                },
                function (err, user) {
                    if (err) {
                        return res.status(500).send({ code: "500", message: "There was a problem adding the user to the database: " + err.message });
                    }
                    //res.status(200).send(user);
                    res.status(200).send({  code: "200",  message: 'Création d\'utilisateur réussie.' });
                });
            }
        })
    }
];

//02   body(email, password) - Authentification d’un user
exports.index_login_post = [
    body('email').isLength({ min: 1 }).trim().withMessage('User email must be specified.')
        .isEmail().withMessage('User email must be a valid mail.'),
    body('password', 'user password must be specified').isLength({ min: 1 }).trim().withMessage('User password must be specified.'),

    /*sanitizeBody('email').trim().escape(),
    sanitizeBody('password').trim().escape(),*/
    sanitizeBody('*').trim().escape(),

    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors.
            return res.status(422).json({ code: "422", message: errors.array()[0]['param'] + ' : ' + errors.array()[0]['msg'] });
        }
        else {
            User.findOne({ user_email: req.body.email }, function (err, user) {
                if (err) return res.status(500).send({ code: "500", message: "Error on the server." });
                if (!user) return res.status(404).send({ code: "404", message: "No user found." });

                return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
                    if(err) {
                      return next(err);
                    }
                
                    if(passportUser) {
                      const user = passportUser;
                      user.token = passportUser.generateJWT();
                
                      return res.json({ user: user.toAuthJSON() });
                    }
                
                    //return res.status(400).info;
                    return res.status(400).send({ code: "400", message: info.errors});
                  })(req, res, next);
            });
        }
    }
];