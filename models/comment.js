let mongoose = require('mongoose');
let moment = require('moment');

let Schema = mongoose.Schema;

let CommentSchema = new Schema(
  {
    comment_content: {
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

CommentSchema.pre('save', async function (next) {

  let Article = require('./article');
  
  const updatedArticle = await Article.findByIdAndUpdate(
    this.comment_article,
    { $push: { article_comments: {comment_id: this._id } }},
    { new: true, runValidators: true }
  );

  if(!updatedArticle) {
      return next(new Error('no article found for the comment to create.'));
  }

  return next(); // everything is done, so let's call the next callback.
});


CommentSchema.post('remove', function (doc) {

    let Article = require('./article');
    
    Article.updateOne(
      { _id: mongoose.Types.ObjectId(doc.comment_article) },
      { $pull: { article_comments: { comment_id: doc._id } }},
      { runValidators:true },
      function(err, result) {
          if (err)
              return res.status(500).send({ code: "500", message: "Error when deleting a comment from article_comments: " + err });
          else if (!result['n'])
              return res.status(404).send({ code: "404", message: "No comment found when deleting a comment from article_comments" });
          else if (!result['nModified'])
              return res.status(404).send({ code: "404", message: "No comment found when deleting a comment from article_comments" });              
      }
    );
    
});


//Export model
module.exports = mongoose.model('Comment', CommentSchema);