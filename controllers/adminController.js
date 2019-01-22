let Article = require('../models/article');
let User = require('../models/user');
let Comment = require('../models/comment');
let jwt = require('jsonwebtoken');
let config = require('../config');
let mongoose = require('mongoose');

const { body, validationResult } = require('express-validator/check');
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

//03   Récupérer la liste des articles 00000011111
exports.admin_articles_get = [
    verifyToken,
    (token, req, res, next) => {
        if (token && req.role == 'admin') {
            Article.find({}/*, 'article_title article_virtual_content_introduction'*/)
                // kmg commentairechange
                //.select('-article_comments -article_image ') // le '-' sert à exclure ces donnes
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
//04   body(Titre, contenu, image, date) - Créer un nouvel article. l’auteur sera ce même utilisateur et les commentaires seront vides.
exports.admin_article_create_post = [
    sanitizeBody('title').trim().escape(),
    sanitizeBody('content').trim().escape(),
    sanitizeBody('date').toDate(),

    verifyToken,

    (token, req, res, next) => {

        if (token && req.role == 'admin') {

            // Create an article object with escaped and trimmed data.
            let article = new Article({
                article_title: req.body.title,
                article_content: req.body.content,
                article_image: req.file ? req.file.path : '',
                article_date: req.body.date,
                article_user: req.userId/*, // kmg commentairechange
                article_comments: []*/
            });
            article.save(function (err) {
                if (err) {
                    return res.status(500).send({ code: "500", message: "There was a problem adding the article to the database: " + err.message, });
                }
                //successful
                res.status(200).send(article);
            });
        }
    }
];

//05   Récupérer les détails d’un article, de son auteur, de ses commentaires et le commentateur de chaque commentateur
exports.admin_article_get = [
    verifyToken,
    (token, req, res, next) => {
        if (token && req.role == 'admin') {
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

//06   body(Titre, contenu, image, date) - Mettre à jour un article mais pas ses commentaires qui seront pris en compte plus tard
exports.admin_article_update_post = [
    sanitizeBody('title').trim().escape(),
    sanitizeBody('content').trim().escape(),
    sanitizeBody('date').toDate(),
    verifyToken,
    (token, req, res, next) => {
        if (token && req.role == 'admin') {
            let query = {
                "_id": mongoose.Types.ObjectId(req.params.id_article)
            };

            let update_set = {};

            if (req.body["title"])
                update_set['article_title'] = req.body.title;

            if (req.body["content"])
                update_set['article_content'] = req.body.title;

            if (req.body["date"])
                update_set['article_date'] = req.body.date;

            if (req.file)
                if (req.file["path"])
                    update_set['article_image'] = req.file.path;

            if (!Object.keys(update_set).length) {
                // si req.body est vide, on retourne 204 qui veut dire
                // 'tout est ok, mais tu n'as pas mis de données à mettre à jour'
                // le status 204 est envoyé vide car meme si je mets un objet avec un message et un code
                // dans le send je ne recevrai rien
                return res.status(204).send();
            }
            else {
                Article.findOneAndUpdate(
                    query,
                    { '$set': update_set },
                    { new: true, runValidators: true },
                    function (err, article) {
                        if (err) {
                            return res.status(500).send({ code: "500", message: "There was a problem updating the article in the database: " + err.message });
                        }
                        else if (article == null) {
                            return res.status(404).send({ code: "404", message: "No article found." });
                        }

                        res.status(200).send(article);

                    }
                );
            }
        }
    }
];

//07   Suppression des commentaires d’un article puis suppression d’un article
exports.admin_article_delete_post = [
    verifyToken,
    (token, req, res, next) => {
        if (token && req.role == 'admin') {

            Article.findById(req.params.id_article).exec(function (err, article) {
                if (err) {
                    return res.status(500).send({ code: "500", message: "There was a problem finding the article in the database: " + err.message });
                }
                else if (article == null) {
                    return res.status(404).send({ code: "404", message: "No article found." });
                }
                // la suppression des commentaires liés à cet article se fait dans le hook dans "../models/article.js"
                //     "ArticleSchema.pre('remove' ..."
                // le seul moyen de lancer ce même trigger remove est de faire ainsi. "article.remove()" 
                // qui retourne une promise puis faire then()

                article.remove().then(function (article_deleted) {
                    res.status(200).send({  code: "200",  message: 'Suppression d\'article et des commentaires associés réussie.' });
                 }).catch(function (err) {
                    return res.status(500).send({ code: "500", message: "There was a problem deleting the article in the database: " + err.message });
                 });
            });
        }
    }
];

//08   Récupérer la liste des users
exports.admin_users_get = [
    verifyToken,
    (token, req, res, next) => {
        if (token && req.role == 'admin') {
            User.find({}, 'user_first_name user_family_name user_email')
                .exec(function (err, list_users) {
                    if (err) {
                        return res.status(500).send({ code: "500", message: "There was a problem listing the users from the database: " + err.message });
                    }
                    res.status(200).send(list_users);
                });
        }
    }
];

//09   body(firstName, lastName, email, password, role) - Création d’un user
exports.admin_user_create_post = [
    verifyToken,
    (token, req, res, next) => {
        if (token && req.role == 'admin') {
            res.send('NOT IMPLEMENTED: admin_user_create_post');
        }
    }
];

//10   Récupérer les détails d’un user et des articles écrits par ce user et les commentaires écrits par ce user
exports.admin_user_get = [
    verifyToken,
    (token, req, res, next) => {
        if (token && req.role == 'admin') {
            async.parallel(
                {
                    user: function (callback) {
                        User.findById(req.params.id_user).select(' -user_password').exec(callback);
                    },
                    user_articles: function (callback) {
                        Article.find({ 'article_user': req.params.id_user }, 'article_title article_content').exec(callback);
                    },
                    user_comments: function (callback) {
                        Comment.find({ 'comment_user': req.params.id_user }, 'comment_content').exec(callback);
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

//11   body(firstName, lastName, email, password, role)  - Modifier un user
exports.admin_user_update_post = [
    sanitizeBody('*').trim().escape(),
    verifyToken,
    (token, req, res, next) => {
        if (token && req.role == 'admin') {

            let update_set = {};

            if (req.body["first_name"])
                update_set['user_first_name'] = req.body.first_name;

            if (req.body["family_name"])
                update_set['user_family_name'] = req.body.family_name;

            if (req.body["role"])
                update_set['user_role'] = req.body.role;

            if (!Object.keys(update_set).length) {
                // si req.body est vide, on retourne 204 qui veut dire
                // 'tout est ok, mais tu n'as pas mis de données à mettre à jour'
                // le status 204 est envoyé vide car meme si je mets un objet avec un message et un code
                // dans le send je ne recevrai rien
                return res.status(204).send();
            }
            else {
                let query = {
                    "_id": mongoose.Types.ObjectId(req.params.id_user)
                };

                let options = {
                    new: true,                // retourner le nouvel objet modifié
                    runValidators: true,      // retester de nouveau la validité des nouveaux champs
                    fields: "-user_password"  // ne pas afficher le mot de passe à la sortie
                };

                User.findOneAndUpdate(
                    query,
                    { '$set': update_set },
                    options,
                    function (err, user) {
                        if (err) {
                            return res.status(500).send({ code: "500", message: "There was a problem updating the user in the database: " + err.message });
                        }
                        else if (user == null) {
                            return res.status(404).send({ code: "404", message: "No user found." });
                        }

                        res.status(200).send(user);
                    }
                );
            }
        }
    }
];

//12   Pour chaque article écrit par :id_user, supprimer tous ses commentaires. Puis supprimer tous les commentaires écrits par ce :id_user, puis supprimer ce user
exports.admin_user_delete_post = [

    verifyToken,
    (token, req, res, next) => {
        if (token && req.role == 'admin') {

            User.findById(req.params.id_user).exec(function (err, user) {
                if (err) {
                    return res.status(500).send({ code: "500", message: "There was a problem finding the user in the database: " + err.message });
                }
                else if (user == null) {
                    return res.status(404).send({ code: "404", message: "No user found for delete." });
                }

                user.remove().then(function (user_deleted) {
                    res.status(200).send({  code: "200",  message: 'Suppression du user, des articles et leurs commentaires associés écrits par ce user et des commentaires écrits par ce user réussie.' });
                 }).catch(function (err) {
                    return res.status(500).send({ code: "500", message: "There was a problem deleting the user in the database: " + err.message });
                 });
            });
        }
    }
];

//13   Récupérer la liste des comments
exports.admin_comments_get = [
    verifyToken,
    (token, req, res, next) => {
        if (token && req.role == 'admin') {
            Comment.find({}, 'comment_content comment_date')
                .populate('comment_user', 'user_first_name user_family_name ')
                .populate('comment_article', 'article_title article_content ')
                .exec(function (err, list_comments) {
                    if (err) {
                        return res.status(500).send({ code: "500", message: "There was a problem listing the users from the database: " + err.message });
                    }
                    res.status(200).send(list_comments);
                });
        }
    }
];

//14   body(article, Contenu, date) - Créer un commentaire sur un article. Le commentateur sera ce même utilisateur
exports.admin_comment_create_post = [
    sanitizeBody('article').trim().escape(),
    sanitizeBody('content').trim().escape(),
    sanitizeBody('date').toDate(),
    verifyToken,
    (token, req, res, next) => {
        if (token && req.role == 'admin') {
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

//15   Récupérer les détails d’un commentaire, de son article et du commentateur qui y sont liés
exports.admin_comment_get = [
    verifyToken,
    (token, req, res, next) => {
        if (token && req.role == 'admin') {
            Comment.findById(req.params.id_comment)
                .populate('comment_user', 'user_first_name user_family_name ')
                .populate('comment_article', 'article_title article_content ')
                .exec(function (err, comment) {
                    if (err) {
                        return res.status(500).send({ code: "500", message: "There was a problem finding a comment from the database: " + err.message, });
                    }
                    if (comment == null) { // No results.{
                        return res.status(404).send({ code: "404", message: "No comment found matching the req.body.id_comment in the database" });
                    }
                    // Successful, so render.
                    res.status(200).send(comment);
                });
        }
    }
];

//16   body(Contenu, date)  -  Modifier un commentaire
exports.admin_comment_update_post = [
    sanitizeBody('content').trim().escape(),
    sanitizeBody('date').toDate(),
    verifyToken,
    (token, req, res, next) => {
        if (token && req.role == 'admin') {
            let update_set = {};

            if (req.body["content"])
                update_set['comment_content'] = req.body.content;

            if (req.body["date"])
                update_set['comment_date'] = req.body.date;

            if (!Object.keys(update_set).length) {
                // si req.body est vide, on retourne 204 qui veut dire
                // 'tout est ok, mais tu n'as pas mis de données à mettre à jour'
                // le status 204 est envoyé vide car meme si je mets un objet avec un message et un code
                // dans le send je ne recevrai rien
                return res.status(204).send();
            }
            else {
                let query = {
                    "_id": mongoose.Types.ObjectId(req.params.id_comment)
                };

                let options = {
                    new: true,                // retourner le nouvel objet modifié
                    runValidators: true,      // retester de nouveau la validité des nouveaux champs
                };

                Comment.findOneAndUpdate(
                    query,
                    { '$set': update_set },
                    options,
                    function (err, comment) {
                        if (err) {
                            return res.status(500).send({ code: "500", message: "There was a problem updating the comment in the database: " + err.message });
                        }
                        else if (comment == null) {
                            return res.status(404).send({ code: "404", message: "No comment found." });
                        }

                        res.status(200).send(comment);
                    }
                );
            }
        }
    }
];

//17   Supprimer un commentaire
exports.admin_comment_delete_post = [
    verifyToken,
    (token, req, res, next) => {
        if (token && req.role == 'admin') {
            // Delete object and redirect to the list of book instances.
            Comment.findByIdAndRemove(req.params.id_comment, (err, comment) => {
                if (err) {
                    return res.status(500).send({ code: "500", message: "There was a problem deleting the comment in the database: " + err.message });
                }
                else if (comment == null) {
                    return res.status(404).send({ code: "404", message: "No comment found." });
                }
                res.status(200).send({  code: "200",  message: 'Suppression de commentaire réussie.' });
            })
        }
    }
];
