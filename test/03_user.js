/* global it, describe, before  */
// During the test the env variable is set to test
process.env.NODE_ENV = 'test'
process.env.DB_NAME = 'fivePointsBlogTest'

// let mongoose = require('mongoose')
let User = require('../models/user')

// require the edv-dependencies
let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../app')
chai.should()

chai.use(chaiHttp)

let adminJwtToken = ''
let adminUser = new User({})

let simpleJwtToken = ''
let simpleUSer = new User({})

describe('***** 03User *****', () => {
  before(() => {
    User.deleteMany({}, () => { })

    adminUser = new User({
      'user_first_name': 'user_admin',
      'user_family_name': 'family01',
      'user_email': 'user_admin@yahoo.fr',
      'user_password': 'user_admin',
      'user_role': 'admin'
    })
    adminUser.save(() => { })

    simpleUSer = new User({
      'user_first_name': 'user_simpleuser',
      'user_family_name': 'family01',
      'user_email': 'user_simpleuser@yahoo.fr',
      'user_password': 'user_simpleuser',
      'user_role': 'simpleuser'
    })
    simpleUSer.save(() => { })
  })

  describe('## Recuperer le token valide d\'un admin et d\'un simpleuser', () => {
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
          'email': simpleUSer.user_email,
          'password': 'user_simpleuser'
        })
        .then((res) => {
          res.body.user.should.have.property('token')
          simpleJwtToken = `Bearer ${res.body.user.token}`
        })
    )

    it('# Interdire l\'acces a un utilisateur non authentifié', (done) => {
      chai.request(server)
        .get('/admin/users')
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
        .get('/admin/users')
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
        .get('/admin/user/' + simpleUSer.id)
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
        .post('/admin/user/' + simpleUSer.id + '/update')
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
        .post('/admin/user/' + simpleUSer.id + '/delete')
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
        .get('/simpleuser/user')
        .set('Authorization', adminJwtToken)
        .end((err, res) => {
          if (err) {
            done(err)
          }
          res.should.have.status(403)
          res.body.should.be.a('object')
          res.body.should.have.property('message').eql('Access Denied')
        })
      done()
    })

    it('# Recuperer la liste de tous les users par un admin', (done) => {
      chai.request(server)
        .get('/admin/users')
        .set('Authorization', adminJwtToken)
        .end((err, res) => {
          if (err) {
            done(err)
          }
          res.should.have.status(200)
          res.body.should.be.a('array')
          done()
        })
    })

    it('# Recuperer les détails d\'un user par un admin', (done) => {
      chai.request(server)
        .get('/admin/user/' + simpleUSer.id)
        .set('Authorization', adminJwtToken)
        .end((err, res) => {
          if (err) {
            done(err)
          }
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.user_articles.should.be.a('array')
          res.body.user_comments.should.be.a('array')
          res.body.user.should.be.a('object')
          done()
        })
    })

    it('# Non Mise a jour d\'un user lorsque body vide par un admin', (done) => {
      chai.request(server)
        .post('/admin/user/' + simpleUSer.id + '/update')
        .set('Authorization', adminJwtToken)
        .end((err, res) => {
          if (err) {
            done(err)
          }
          res.should.have.status(204)
          done()
        })
    })

    it('# Mise a jour d\'un user par un admin', (done) => {
      chai.request(server)
        .post('/admin/user/' + simpleUSer.id + '/update')
        .set('Authorization', adminJwtToken)
        .send({
          'first_name': 'xxxx',
          'family_name': 'yyyyy'
        })
        .end((err, res) => {
          if (err) {
            done(err)
          }
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('user_first_name').eql('xxxx')
          done()
        })
    })

    it('# Suppression d\'un user par un admin', (done) => {
      chai.request(server)
        .post('/admin/user/' + simpleUSer.id + '/delete')
        .set('Authorization', adminJwtToken)
        .end((err, res) => {
          if (err) {
            done(err)
          }
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('message').eql('Suppression du user, des articles et leurs commentaires associés écrits par ce user et des commentaires écrits par ce user réussie.')
          done()
        })
    })
  })
})
