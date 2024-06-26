//##################################################
//############### USER BACK UP MODEL ###############
//##################################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import mongoose from 'mongoose';

/////////////////////////////////
////// Connect to Mongoose //////
/////////////////////////////////
mongoose.connect(
  "mongodb://" + process.env.DB_USER + ":" + process.env.DB_PASSWORD + "@mongodb:27017/" + process.env.DB_DATABASE + "?authSource=admin",
  {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 2000,
  },
  (err) => {
    if (err) {
      console.error('FAILED TO CONNECT TO MONGODB');
    } else {
      //console.log('CONNECTED TO MONGODB');
    }
  }
);

/////////////////////////////
////// Mongoose Schema //////
/////////////////////////////
const Schema = mongoose.Schema;
const usersHistoryModelSchema = new Schema({
  user_id: {
    type: String,
    index: true,
    required: [true, ''],
    validate: {
      validator: function(value) {
        return value.trim() !== '';
      },
      message: ''
    },
    trim: true
  },
  platform: {
    type: String,
    index: true,
    required: [true, ''],
    validate: {
      validator: function(value) {
        return value.trim() !== '';
      },
      message: ''
    },
    trim: true
  },
  time_saved: {
    type: Number,
    index: true,
    required: [true, ''],
    validate: {
      validator: function(value) {
        return !isNaN(value) && isFinite(value);
      },
      message: ''
    },
    default: 0
  },
  data: { 
    type: Object,
    default: {}
   },
});

//////////////////////////
////// Model Export //////
//////////////////////////
const usersHistoryModel = mongoose.model('users_histories', usersHistoryModelSchema);

export { usersHistoryModel };
