let express = require('express');
let router = express.Router();

// Require controller modules.
let simple_user_controller = require('../controllers/simpleUserController');

//18   Récupérer la liste des articles
router.get('/articles', simple_user_controller.user_articles_get  );

//19   Récupérer les détails d’un article, de son auteur, de ses commentaires et le commentateur de chaque commentateur
router.get('/article/:id_article', simple_user_controller.user_article_get  );

//20   Récupérer les détails de user authentifié et des articles écrits par ce user et les commentaires écrits par ce user
router.get('/', simple_user_controller.user_get  );

//21   body(Contenu, date ) -  Créer un commentaire sur un article. Le commentateur sera ce même utilisateur
router.post('/comment/:id_article/create', simple_user_controller.user_comment_create_post );

module.exports = router;