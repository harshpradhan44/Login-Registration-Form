const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/users', {useNewUrlParser: true,  useCreateIndex: true, useUnifiedTopology: true});
var conn = mongoose.Collection;
var create_profile_Schema = new mongoose.Schema ({
	User: {
		type: String,
		required: true,
		index: {
			unique: true,
		}
	},
	Name: {
		type: String,
		required: true,
	},
	Age: {
		type: Number,
		required: true,
	},
	Gender: {
		type: String,
		required:  true,
	},
	img: {
		data: Buffer, 
        contentType: String 
	},
	date: {
		type: Date,
		default: Date.now
	}
});

var CreateProfileModel = mongoose.model('create_profile', create_profile_Schema);
module.exports = CreateProfileModel;