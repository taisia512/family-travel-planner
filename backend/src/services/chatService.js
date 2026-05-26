const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Message = require('../models/Message');

const messagesPath = path.join(__dirname, '../data/chatMessages.json');

const readJsonMessages = () => {
  const data = fs.readFileSync(messagesPath, 'utf8');
  return JSON.parse(data || '[]');
};

const writeJsonMessages = (messages) => {
  fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));
};

const isMongoConnected = () => mongoose.connection.readyState === 1;

const getPrivateMessages = async (user1, user2) => {
  if (isMongoConnected()) {
    return await Message.find({
      $or: [
        { senderEmail: user1, receiverEmail: user2 },
        { senderEmail: user2, receiverEmail: user1 }
      ]
    }).sort({ createdAt: 1 });
  }

  const allMsgs = readJsonMessages();
  return allMsgs.filter(msg => 
    (msg.senderEmail === user1 && msg.receiverEmail === user2) ||
    (msg.senderEmail === user2 && msg.receiverEmail === user1)
  );
};

const addMessage = async (msg) => {
  if (isMongoConnected()) {
    const newMessage = new Message({
      senderName: msg.senderName,
      senderEmail: msg.senderEmail,
      receiverEmail: msg.receiverEmail,
      text: msg.text
    });

    return await newMessage.save();
  }

  const messages = readJsonMessages();

  const newMessage = {
    id: Date.now(),
    senderName: msg.senderName,
    senderEmail: msg.senderEmail,
    receiverEmail: msg.receiverEmail,
    text: msg.text,
    createdAt: new Date().toISOString()
  };

  messages.push(newMessage);
  writeJsonMessages(messages);

  return newMessage;
};

module.exports = {
  getPrivateMessages,
  addMessage
};