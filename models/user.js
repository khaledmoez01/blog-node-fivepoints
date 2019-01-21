let mongoose = require('mongoose');

let Schema = mongoose.Schema;
let bcrypt = require('bcryptjs');

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

UserSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.user_password);
};

//Export model
module.exports = mongoose.model('User', UserSchema);