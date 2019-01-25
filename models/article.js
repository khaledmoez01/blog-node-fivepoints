let mongoose = require('mongoose')

let Schema = mongoose.Schema

let ArticleSchema = new Schema(
  {
    article_title: {
      type: String,
      required: [true, 'article title is mandatory']
    },
    article_user: {
      type: Schema.Types.ObjectId,
      ref: 'User', // reference to the associated user
      required: [true, 'article user is mandatory']
    },
    article_content: {
      type: String,
      required: [true, 'article content is mandatory']
    },
    article_image: {
      type: String,
      default: ''
    },
    article_date: {
      type: Date,
      default: Date.now,
      validate: [(v) => v instanceof Date, 'article date shall be a date.']
    }
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
)

ArticleSchema
  .virtual('article_virtual_content_introduction')
  .get(function () {
    return this.article_content.slice(0, 15)
  })

// Virtual for user's full name
ArticleSchema
  .virtual('article_virtual_url')
  .get(function () {
    return '/admin/article/' + this._id
  })

ArticleSchema.pre('save', function (next) {
  // on met le require ici, car sinon on aurait l'erreer User.findById is not a function:
  // la grande trouvaille de Chehir!!!
  // on a cette erreur, car le User ne connait pas le "this", pour parer a cela, utiliser 'use strict' a voir
  let User = require('./user')

  User.findById(this.article_user, function (err, user) {
    if (err) {
      return next(err)
    }

    if (user == null) {
      const errorUser = new Error('no user found for the article to create.')
      return next(errorUser)
    }

    return next() // everything is done, so let's call the next callback.
  })
})

ArticleSchema.pre('remove', { document: true, query: false }, function (next) {
  let Comment = require('./comment')

  Comment.deleteMany(
    { comment_article: this._id },
    (err, mongooseDeleteCommentsResult) => {
      if (err) {
        return next(err)
      }

      // mongooseDeleteCommentsResult est un objet qui contient ces trois clé
      //     { n: 1, ok: 1, deletedCount: 1 }
      //         ok: 1 if no errors occurred
      //         deletedCount: the number of documents deleted
      //         n: the number of documents deleted. Equal to deletedCount.
      return next()
    }
  )
  return next()
})

// Export model
module.exports = mongoose.model('Article', ArticleSchema)
