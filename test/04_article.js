/* global it, describe, before  */
// During the test the env variable is set to test
process.env.NODE_ENV = 'test'
process.env.DB_NAME = 'fivePointsBlogTest'

// let mongoose = require('mongoose')
let User = require('../models/user')
let Article = require('../models/article')

// require the edv-dependencies
let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../app')
chai.should()

chai.use(chaiHttp)

let adminJwtToken = ''
let adminUser// = new User({})

let simpleJwtToken = ''
let simpleUser// = new User({})

let article01// = new Article({})

describe('***** 04Article *****', () => {
  before(() => {
    User.deleteMany({}, () => { })
    Article.deleteMany({}, () => { })

    adminUser = new User({
      'user_first_name': 'user_admin',
      'user_family_name': 'family01',
      'user_email': 'user_admin@yahoo.fr',
      'user_password': 'user_admin',
      'user_role': 'admin'
    })
    adminUser.save(() => { })

    simpleUser = new User({
      'user_first_name': 'user_simpleuser',
      'user_family_name': 'family01',
      'user_email': 'user_simpleuser@yahoo.fr',
      'user_password': 'user_simpleuser',
      'user_role': 'simpleuser'
    })
    simpleUser.save(() => { })
  })

  it('Recuperer le token valide d\'un admin', () =>
    chai.request(server)
      .post('/login')
      .send({
        'email': adminUser.user_email,
        'password': 'user_admin'
      })
      .then((res) => {
        res.body.user.should.have.property('token')
        adminJwtToken = `Bearer ${res.body.user.token}`
      })
  )

  it('Recuperer le token valide d\'un simpleuser', () =>
    chai.request(server)
      .post('/login')
      .send({
        'email': simpleUser.user_email,
        'password': 'user_simpleuser'
      })
      .then((res) => {
        res.body.user.should.have.property('token')
        simpleJwtToken = `Bearer ${res.body.user.token}`
      })
  )

  it('it should create an article', (done) => {
    chai.request(server)
      .post('/admin/article/create')
      .set('Authorization', adminJwtToken)
      .attach('image', './test/bon.png', 'bon.png')
      .field('title', 'article01')
      .field('content', 'content of article01')
      .end((err, res) => {
        if (err) {
          done(err)
        }
        res.should.have.status(200)
        res.body.should.be.a('object')
        res.body.should.have.property('article_user')
        article01 = new Article({
          'article_title': res.body.article_title,
          'article_user': res.body.article_user,
          'article_content': res.body.article_content,
          'article_image': res.body.article_image,
          'article_date': res.body.article_date
        })
        done()
      })
  })

  it('# Interdire l\'acces a un utilisateur non authentifié', (done) => {
    chai.request(server)
      .get('/admin/articles')
      .end((err, res) => {
        if (err) {
          done(err)
        }
        res.should.have.status(401)
        res.body.should.be.a('object')
        res.body.should.have.property('message').eql('No authorization token was found')
        done()
      })
  })

  it('# Interdire l\'acces au simpleuser de tous les chemins admin', (done) => {
    chai.request(server)
      .get('/admin/articles')
      .set('Authorization', simpleJwtToken)
      .end((err, res) => {
        if (err) {
          done(err)
        }
        res.should.have.status(403)
        res.body.should.be.a('object')
        res.body.should.have.property('message').eql('access denied')
      })

    chai.request(server)
      .post('/admin/article/create')
      .set('Authorization', simpleJwtToken)
      .end((err, res) => {
        if (err) {
          done(err)
        }
        res.should.have.status(403)
        res.body.should.be.a('object')
        res.body.should.have.property('message').eql('access denied')
      })

    chai.request(server)
      .get('/admin/article/' + article01.id)
      .set('Authorization', simpleJwtToken)
      .end((err, res) => {
        if (err) {
          done(err)
        }
        res.should.have.status(403)
        res.body.should.be.a('object')
        res.body.should.have.property('message').eql('access denied')
      })

    chai.request(server)
      .post('/admin/article/' + article01.id + '/update')
      .set('Authorization', simpleJwtToken)
      .end((err, res) => {
        if (err) {
          done(err)
        }
        res.should.have.status(403)
        res.body.should.be.a('object')
        res.body.should.have.property('message').eql('access denied')
      })

    chai.request(server)
      .post('/admin/article/' + article01.id + '/delete')
      .set('Authorization', simpleJwtToken)
      .end((err, res) => {
        if (err) {
          done(err)
        }
        res.should.have.status(403)
        res.body.should.be.a('object')
        res.body.should.have.property('message').eql('access denied')
      })
    done()
  })

  it('# Interdire l\'acces à admin de tous les chemins simpleuser', (done) => {
    chai.request(server)
      .get('/simpleuser/articles')
      .set('Authorization', adminJwtToken)
      .end((err, res) => {
        if (err) {
          done(err)
        }
        res.should.have.status(403)
        res.body.should.be.a('object')
        res.body.should.have.property('message').eql('Access Denied')
      })
    chai.request(server)
      .get('/simpleuser/article/' + article01.id)
      .set('Authorization', adminJwtToken)
      .end((err, res) => {
        if (err) {
          done(err)
        }
        res.should.have.status(403)
        res.body.should.be.a('object')
        res.body.should.have.property('message').eql('Access Denied')
        done()
      })
  })
})
