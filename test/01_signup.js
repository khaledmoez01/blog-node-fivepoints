/* global it, describe, before */
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

// Our parent block
describe('***** 01SignUp *****', () => {
  // beforeEach((done) => {
  before((done) => {
    User.deleteMany({}, (err) => {
      if (err) {
        done(err)
      }
      done()
    })
  })

  // test the get route
  describe('/POST sign up user', () => {
    it('it should create a user and return 200 status', (done) => {
      let user = {
        'first_name': 'user01',
        'family_name': 'family01',
        'email': 'user01@yahoo.fr',
        'password': 'user01',
        'role': 'admin'
      }
      chai.request(server)
        .post('/signup')
        .send(user)
        .end((err, res) => {
          if (err) {
            done(err)
          }
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('message').eql('Création d\'utilisateur réussie.')
          done()
        })
    })

    it('it should return an error when create a user with email already exists', (done) => {
      let user = {
        'first_name': 'xxxx',
        'family_name': 'xxx',
        'email': 'user01@yahoo.fr',
        'password': 'xxx',
        'role': 'simpleuser'
      }
      chai.request(server)
        .post('/signup')
        .send(user)
        .end((err, res) => {
          if (err) {
            done(err)
          }
          res.should.have.status(422)
          res.body.should.be.a('object')
          res.body.should.have.property('message').eql('user with email ' + user.email + ' already exists')
          done()
        })
    })

    it('it should return an error when create a user with role not admin or simpleuser', (done) => {
      let user = {
        'first_name': 'xxxx',
        'family_name': 'xxx',
        'email': 'user02@yahoo.fr',
        'password': 'xxx',
        'role': 'xx'
      }
      chai.request(server)
        .post('/signup')
        .send(user)
        .end((err, res) => {
          if (err) {
            done(err)
          }
          res.should.have.status(500)
          res.body.should.be.a('object')
          res.body.should.have.property('message').eql('There was a problem adding the user to the database: User validation failed: user_role: user role shall be admin or simpleuser')
          done()
        })
    })

    it('it should return an error when create a user without password', (done) => {
      let user = {
        'first_name': 'xxxx',
        'family_name': 'xxx',
        'email': 'user02@yahoo.fr',
        'role': 'simpleuser'
      }
      chai.request(server)
        .post('/signup')
        .send(user)
        .end((err, res) => {
          if (err) {
            done(err)
          }
          res.should.have.status(500)
          res.body.should.be.a('object')
          res.body.should.have.property('message').eql('There was a problem adding the user to the database: User validation failed: user_password: user password is mandatory')
          done()
        })
    })
  })
})
