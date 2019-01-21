let Article = require('../models/article');
let User    = require('../models/user');
let Comment = require('../models/comment');
let jwt     = require('jsonwebtoken');
let config  = require('../config');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

let async = require('async');


function verifyToken(req, res, next) {
    //let token = req.headers['x-access-token'];
    let token = req.headers['authorization'];

    if (!token)
        return res.status(403).send({ code: "403", auth: false, token: null, message: 'No token provided.' });

    let token_split = token.split(' ').pop();

    jwt.verify(token_split, config.secret, function (err, decoded) {
        if (err)
            return res.status(403).send({ code: "403", auth: false, token: null, message: 'Failed to authenticate token.' });

        // if everything good, save to request for use in other routes
        req.userId = decoded.id;
        req.role = decoded.role;
        next(token);
    });
}

//18   Récupérer la liste des articles
exports.user_articles_get = [
    (req, res, next) => {
        res.send('NOT IMPLEMENTED: user_articles_get');
    }
];
//19   Récupérer les détails d’un article, de son auteur, de ses commentaires et le commentateur de chaque commentateur
exports.user_article_get = [
    (req, res, next) => {
        res.send('NOT IMPLEMENTED: user_article_get');
    }
];

//20   Récupérer les détails de user authentifié et des articles écrits par ce user et les commentaires écrits par ce user
exports.user_get = [
    (req, res, next) => {
        res.send('NOT IMPLEMENTED: user_get');
    }
];

//21   body(Contenu, date ) -  Créer un commentaire sur un article. Le commentateur sera ce même utilisateur
exports.user_comment_create_post = [
    (req, res, next) => {
        res.send('NOT IMPLEMENTED: user_comment_create_post');
    }
];