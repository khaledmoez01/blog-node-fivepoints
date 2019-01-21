let mongoose = require('mongoose');
let moment = require('moment');

let Schema = mongoose.Schema;

let CommentSchema = new Schema(
  {
    comment_content : {
        type: String,
        required: [true, 'comment content is mandatory']
    },
    comment_user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'comment\'s associated user is mandatory']
    }, //reference to the associated user
    comment_date: {
        type: Date,
        default: Date.now,
        validate: [(v) => v instanceof Date, 'comment date shall be a date.']
    },
    comment_article: {
        type: Schema.Types.ObjectId,
        ref: 'Article',
        required: [true, 'comment\'s associated article is mandatory']
    }//reference to the associated article
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

// Virtual for user's full name
CommentSchema
.virtual('comment_virtual_url')
.get(function () {
  return '/admin/comment/' + this._id;
});

//Export model
module.exports = mongoose.model('Comment', CommentSchema);