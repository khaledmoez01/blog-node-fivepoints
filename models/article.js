let mongoose = require('mongoose');
let moment = require('moment');

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

//Export model
module.exports = mongoose.model('Article', ArticleSchema);