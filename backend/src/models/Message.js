const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderName: String,
  senderEmail: String,
  receiverEmail: String,
  text: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);