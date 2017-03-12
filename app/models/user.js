// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({
    local            : {
        email        : String,
        id_social    : String,
        name         : String,
        birthday: String,
        job: String,
        gender:String,
        hometown:String,
        education: String,
        image        : String,
        cover        : String,
        password     : String,
    },
    followers:[{userId:String,image:String,name:String}],
    addfriend:[],
    notify:[],
    message:[{id:String,image:String,name: String,content: String,date: {type: Date, default: Date.now},seen:String}]
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
