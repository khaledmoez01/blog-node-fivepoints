let mongoose = require('mongoose');

let Schema = mongoose.Schema;
let bcrypt = require('bcryptjs');

let jwt = require('jsonwebtoken');  
let config = require('../config');

let UserSchema = new Schema(
  {
    user_first_name : {
        type: String,
        required: [true, 'user first name is mandatory']
    },
    user_family_name: {
        type: String,
        required: [true, 'user last name is mandatory']
    },
    user_email: {
        type: String,
        required: [true, 'user email is mandatory'],
        match: [/\S+@\S+\.\S+/, 'User email must be a valid mail format'],
        unique: true,
        index: true
    },
    user_password: {
        type: String,
        required: [true, 'user password is mandatory']
    },
    user_role: {
        type: String,
        required: [true, 'user role is mandatory'],
        enum: {
            values: ['admin', 'simpleuser'],
            message: 'user role shall be admin or simpleuser'
        },
        default: 'simpleuser'
    }
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

// Virtual for user's full name
UserSchema
.virtual('user_virtual_full_name')
.get(function () {
  return this.user_family_name + ', ' + this.user_first_name;
});

// Virtual for user's full name
UserSchema
.virtual('user_virtual_url')
.get(function () {
  return '/admin/user/' + this._id;
});


UserSchema.pre('save', function (next) {

  // this represente le user qui s'apprete a ete inséré
  // check if password is present and is modified.
  if (this.user_password && this.isModified('user_password')) {
      // call your hashPassword method here which will return the hashed password.
      this.user_password = bcrypt.hashSync(this.user_password, 8);
  }

  next(); // everything is done, so let's call the next callback.
});

UserSchema.pre(
  'remove',
  { document: true },

    async function (next)  {
    let Comment = require('./comment');
    let Article = require('./article');

    // je fais un await car il faut d'abord supprimer les commentaires faits par ce user puis une fois cela fait,
    // supprimer les articles écrits par ce user et leurs commentaires.
    // en effet, si on lance les deux opérations en paralléle, on pourrait avoir un conflit si ce
    // user a commenté un article qu'il a lui même écrit.
    await Comment.deleteMany(
        { comment_user: this._id},
        (err, mongooseDeleteCommentsResult) => {
            if (err) {
                return next(err);
            }
        }
    );

    Article.find({ article_user:  mongoose.Types.ObjectId(this._id)}, function(err, articles) {
        for (let i = 0; i < articles.length; i++)
        {
            Article.findById(articles[i]._id).exec(function (err, article) {
                if (err) {
                    return next(err);
                }
                if (article == null) {
                    return next(err);
                }
                article.remove().catch(function (err) {
                    return next(err);
                });
            });
        }
        return next();
    });

    return next();
  }

);

UserSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compareSync(candidatePassword, this.user_password);
};

UserSchema.methods.generateJWT = function() {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);
  
    return jwt.sign({
      email: this.user_email,
      id: this._id,
      role: this.user_role,
      exp: parseInt(expirationDate.getTime() / 1000, 10),
    }, config.secret);
}

UserSchema.methods.toAuthJSON = function() {
    return {
      _id: this._id,
      email: this.user_email,
      token: this.generateJWT(),
    };
};

//Export model
module.exports = mongoose.model('User', UserSchema);