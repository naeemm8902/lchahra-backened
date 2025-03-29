import { connect } from 'mongoose';
import dotenv from 'dotenv';
const mongoUrl = 'mongodb://localhost:27017/lchahra-db';

dotenv.config(); // Load environment variabless
// const mongoUrl = process.env.MONGO_URI;

function connectToMongo() {
  connect(mongoUrl)
    .then(function (db) {
      console.log('connected to the database');
    })
    .catch(function (err) {
      console.log(err);
    });
}
export default connectToMongo;
