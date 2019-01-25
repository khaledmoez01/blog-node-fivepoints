let path = require('path')
let fs = require('fs')

// __dirname: C:\Users\Khaled\Desktop\fivepoints\03_niveau03\06_projetBlog\fivePointsBlog\controllers
let dir = path.join(process.cwd(), process.env.IMAGE_UPLOAD_DIR)

let mime = {
  html: 'text/html',
  txt: 'text/plain',
  css: 'text/css',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  js: 'application/javascript'
}

// 22   recuperation d'une image
exports.imageDownload_image_get = [

  (req, res, next) => {
    // on a suivi la reponse de "rsp" dans la discussion suivante:
    //    https://stackoverflow.com/questions/5823722/how-to-serve-an-image-using-nodejs

    // ici, par exemple, ces deux variables "req.path" et "dir" valent:
    // req.path : /20190121120157_petitchat.jpg
    // dir      : C:\Users\Khaled\Desktop\fivepoints\03_niveau03\06_projetBlog\fivePointsBlog\uploads

    let file = path.join(dir, req.path.replace(/\/$/, ''))
    // ici, par exemple, ces deux variables file" et "path.sep" valent:
    // file     : C:\Users\Khaled\Desktop\fivepoints\03_niveau03\06_projetBlog\fivePointsBlog\uploads\20190121120157_petitchat.jpg
    // path.sep : \

    if (file.indexOf(dir + path.sep) !== 0) {
      return res.status(403).end('Forbidden')
    }

    let type = mime[path.extname(file).slice(1)] || 'text/plain'
    let s = fs.createReadStream(file)
    s.on('open', function () {
      res.set('Content-Type', type)
      s.pipe(res)
    })
    s.on('error', function () {
      res.set('Content-Type', 'text/plain')
      res.status(404).end('Not found')
    })
  }
]
