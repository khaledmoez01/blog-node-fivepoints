let jwt = require('jsonwebtoken');
let config = require('../config');

let path = require('path');
let fs = require('fs');

// __dirname: C:\Users\Khaled\Desktop\fivepoints\03_niveau03\06_projetBlog\fivePointsBlog\controllers
let dir = path.join(__dirname, '..\\uploads');

let mime = {
     html: 'text/html'
    ,txt : 'text/plain'
    ,css : 'text/css'
    ,gif : 'image/gif'
    ,jpg : 'image/jpeg'
    ,png : 'image/png'
    ,svg : 'image/svg+xml'
    ,js  : 'application/javascript'
};

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

//22   recuperation d'une image
exports.imageDownload_image_get = [

    verifyToken,

    (token, req, res, next) => {
        //on a suivi la réponse de "rsp" dans la discussion suivante:
        //    https://stackoverflow.com/questions/5823722/how-to-serve-an-image-using-nodejs

        // ici, par exemple, ces deux variables "req.path" et "dir" valent:
        // req.path : /20190121120157_petitchat.jpg
        // dir      : C:\Users\Khaled\Desktop\fivepoints\03_niveau03\06_projetBlog\fivePointsBlog\uploads

        let file = path.join(dir, req.path.replace(/\/$/, ''));
        // ici, par exemple, ces deux variables file" et "path.sep" valent:
        // file     : C:\Users\Khaled\Desktop\fivepoints\03_niveau03\06_projetBlog\fivePointsBlog\uploads\20190121120157_petitchat.jpg
        // path.sep : \

        if (file.indexOf(dir + path.sep) !== 0) {
            return res.status(403).end('Forbidden');
        }

        let type = mime[path.extname(file).slice(1)] || 'text/plain';
        let s = fs.createReadStream(file);
        s.on('open', function () {
            res.set('Content-Type', type);
            s.pipe(res);
        });
        s.on('error', function () {
            res.set('Content-Type', 'text/plain');
            res.status(404).end('Not found');
        });
    }
];
