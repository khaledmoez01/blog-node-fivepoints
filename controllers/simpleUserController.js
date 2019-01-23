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
    verifyToken,
    (token, req, res, next) => {        
        if (token && req.role == 'simpleuser') {
            Article.find({})
                .select(' -article_image ') // le '-' sert à exclure ces donnes
                .populate('article_user', 'user_first_name user_family_name ')
                .exec(function (err, list_articles) {
                    if (err) {
                        return res.status(500).send({ code: "500", message: "There was a problem listing the articles from the database: " + err.message });
                    }
                    res.status(200).send(list_articles);

                });
        }
    }
];
//19   Récupérer les détails d’un article, de son auteur, de ses commentaires et le commentateur de chaque commentateur
exports.user_article_get = [
    verifyToken,
    (token, req, res, next) => {        
        if (token && req.role == 'simpleuser') {
            async.parallel(
                {
                    article: function (callback) {
                        Article.findById(req.params.id_article)
                            .populate('article_user', 'user_first_name user_family_name ')
                            .exec(callback);
                    },
                    article_comments: function (callback) {
                        Comment.find({ 'comment_article': req.params.id_article }).exec(callback);
                    }
                },
                function (err, results) {
                    if (err) {
                        return res.status(500).send({ code: "500", message: "There was a problem listing the article's details from the database: " + err.message });
                    }
                    else if (results.article == null) {
                        return res.status(404).send({ code: "404", message: "No article found." });
                    }
                    res.status(200).send(results);
                }
            );
        }
    }
];

//20   Récupérer les détails de user authentifié et des articles écrits par ce user et les commentaires écrits par ce user
exports.user_get = [
    verifyToken,
    (token, req, res, next) => {        
        if (token && req.role == 'simpleuser') {
            async.parallel(
                {
                    user: function (callback) {
                        User.findById(req.userId).select(' -user_password').exec(callback);
                    },
                    user_articles: function (callback) {
                        Article.find({ 'article_user': req.userId }, 'article_title article_content').exec(callback);
                    },
                    user_comments: function (callback) {
                        Comment.find({ 'comment_user': req.userId }, 'comment_content').exec(callback);
                    }
                },
                function (err, results) {
                    if (err) {
                        return res.status(500).send({ code: "500", message: "There was a problem listing the user's details from the database: " + err.message });
                    }
                    else if (results.user == null) {
                        return res.status(404).send({ code: "404", message: "No user found." });
                    }
                    res.status(200).send(results);
                }
            );
        }
    }
];
//21   body(Contenu, date ) -  Créer un commentaire sur un article. Le commentateur sera ce même utilisateur
exports.user_comment_create_post = [
    sanitizeBody('article').trim().escape(),
    sanitizeBody('content').trim().escape(),
    sanitizeBody('date').toDate(),
    verifyToken,
    (token, req, res, next) => {        
        if (token && req.role == 'simpleuser') {
            Article.findById(req.body.article).exec(function (err, article) {
                if (err) {
                    return res.status(500).send({ code: "500", message: "There was a problem finding an article related to the comment to create to the database: " + err.message, });
                }

                if (article == null) {
                    return res.status(404).send({ code: "404", message: "No article found matching the req.body.article when creating a comment" });
                }

                let comment = new Comment({
                    comment_content: req.body.content,
                    comment_user: req.userId,
                    comment_date: req.body.date,
                    comment_article: article._id  // article._id req.body.article
                });

                comment.save(function (err) {
                    if (err) {
                        return res.status(500).send({ code: "500", message: "There was a problem adding a comment to the database: " + err.message, });
                    }
                    //successful
                    res.status(200).send(comment);
                });
            });
        }
    }
];