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
describe('***** 02Login *****', () => {
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
    let user01 = new User({
      'user_first_name': 'user01',
      'user_family_name': 'family01',
      'user_email': 'user01@yahoo.fr',
      'user_password': 'user01',
      'user_role': 'admin'
    })

    it('it should login, return 200 status and a token', (done) => {
      user01.save((err, user02) => {
        if (err) {
          done(err)
        }

        chai.request(server)
          .post('/login')
          .send({
            'email': user02.user_email,
            'password': 'user01'
          })
          .end((err, res) => {
            if (err) {
              done(err)
            }
            res.should.have.status(200)
            res.body.should.be.a('object')
            res.body.should.have.property('user')
            res.body.user.should.have.property('_id')
            res.body.user.should.have.property('email').eql('user01@yahoo.fr')
            res.body.user.should.have.property('token')
            done()
          })
      })
    })

    it('it should not login, return 400 status', (done) => {
      chai.request(server)
        .post('/login')
        .send({
          'email': user01.user_email,
          'password': 'user0' // le mot de passe ici est erronné, le mot de passe correct est "user01"
        })
        .end((err, res) => {
          if (err) {
            done(err)
          }
          res.should.have.status(400)
          res.body.should.be.a('object')
          res.body.should.have.property('message').eql('email or password is invalid')
          done()
        })
    })
  })
})
