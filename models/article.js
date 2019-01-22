let mongoose = require('mongoose');
let moment = require('moment');
let User = require('./user');
let Comment = require('./comment');

let Schema = mongoose.Schema;

let ArticleSchema = new Schema(
  {
    article_title : {
        type: String,
        required: [true, 'article title is mandatory']
    },
    article_user: {
        type: Schema.Types.ObjectId,
        ref: 'User', //reference to the associated user
        required: [true, 'article user is mandatory']
    },
    article_content: {
        type: String,
        required: [true, 'article content is mandatory']
    },
    /*article_comments: [{
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    }],*/ // kmg commentairechange
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
);

ArticleSchema
.virtual('article_virtual_content_introduction')
.get(function () {
  return this.article_content.slice(0,15);
});

// Virtual for user's full name
ArticleSchema
.virtual('article_virtual_url')
.get(function () {
  return '/admin/article/' + this._id;
});

ArticleSchema.pre('save', function (next) {
    User.findById(this.article_user).exec(function (err, user) {
        if (err) {
            return next(err);
        }

        if (user == null) {
            const error_user = new Error('no user found for the article to create.');
            return next(error_user);
        }

        return next(); // everything is done, so let's call the next callback.
    });
});

ArticleSchema.pre('remove', { document: true }, function (next) {

    Comment.deleteMany(
        { comment_article: this._id},
        (err, mongooseDeleteCommentsResult) => {
            if (err) {
                return next(err);
            }

            // mongooseDeleteCommentsResult est un objet qui contient ces trois clé
            //     { n: 1, ok: 1, deletedCount: 1 }       
            //         ok: 1 if no errors occurred
            //         deletedCount: the number of documents deleted
            //         n: the number of documents deleted. Equal to deletedCount.            
            return next();
        }
    );
    return next();
});

//Export model
module.exports = mongoose.model('Article', ArticleSchema);