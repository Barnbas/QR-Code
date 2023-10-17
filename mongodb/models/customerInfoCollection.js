// customerInfoCollection.js
const mongoose = require('mongoose');

const customerInfoSchema = new mongoose.Schema({
  customerId: String,
  firstName: String,
  lastName: String,
  phone: String,
  email: String,
  type: String,
  date: Date,
  description: String,
  status: String,
  address:String,
});

module.exports = mongoose.model('CustomerInfo', customerInfoSchema);
