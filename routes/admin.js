let express = require('express');
let router  = express.Router();
let upload  = require('../upload_image');


// Require controller modules.
let admin_controller = require('../controllers/adminController');

//03   Récupérer la liste des articles
router.get('/articles', admin_controller.admin_articles_get ); // kmg done


//04   body(Titre, contenu, image) - Créer un nouvel article. l’auteur sera ce même utilisateur et les commentaires seront vides.
//router.post('/article/create', admin_controller.admin_article_create_post);
router.post('/article/create', upload.single('image'), admin_controller.admin_article_create_post ); // kmg done


//05   Récupérer les détails d’un article, de son auteur, de ses commentaires et le commentateur de chaque commentaire
router.get('/article/:id_article', admin_controller.admin_article_get ); // kmg done

//06   body(Titre, contenu, image, date) - Mettre à jour un article mais pas ses commentaires qui seront pris en compte plus tard
router.post('/article/:id_article/update', upload.single('image'), admin_controller.admin_article_update_post); // kmg done

//07   Suppression des commentaires d’un article puis suppression d’un article
router.post('/article/:id_article/delete', admin_controller.admin_article_delete_post); // kmg done

//08   Récupérer la liste des users
router.get('/users', admin_controller.admin_users_get ); // kmg done

//09   body(firstName, lastName, email, password, role) - Création d’un user
router.post('/user/create', admin_controller.admin_user_create_post);

//10   Récupérer les détails d’un user et des articles écrits par ce user et les commentaires écrits par ce user
router.get('/user/:id_user', admin_controller.admin_user_get ); // kmg done

//11   body(firstName, lastName, email, password, role)  - Modifier un user
router.post('/user/:id_user/update', admin_controller.admin_user_update_post); //kmg done

//12   Pour chaque article écrit par :id_user, supprimer tous les commentaires de cet article. Puis supprimer tous les commentaires écrits par ce :id_user, puis supprimer ce :id_user
router.post('/user/:id_user/delete', admin_controller.admin_user_delete_post);

//13   Récupérer la liste des comments
router.get('/comments', admin_controller.admin_comments_get );  // kmg done

//14   body(Contenu, date) - Créer un commentaire sur un article. Le commentateur sera ce même utilisateur
//router.post('/comment/:id_article/create', admin_controller.admin_comment_create_post); // // kmg commentairechange
//14   body(article, Contenu, date) - Créer un commentaire sur un article. Le commentateur sera ce même utilisateur
router.post('/comment/create', admin_controller.admin_comment_create_post); // kmg done

//15   Récupérer les détails d’un commentaire, de son article et du commentateur qui y sont liés
router.get('/comment/:id_comment', admin_controller.admin_comment_get );// kmg done

//16   body(Contenu, date)  -  Modifier un commentaire
router.post('/comment/:id_comment/update', admin_controller.admin_comment_update_post); //kmg done

//17   Supprimer un commentaire
router.post('/comment/:id_comment/delete', admin_controller.admin_comment_delete_post); // kmg done


module.exports = router;