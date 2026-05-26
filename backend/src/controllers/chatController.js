const chatService = require('../services/chatService');

exports.getMessages = (req, res) => {
  const messages = chatService.getAllMessages();
  res.json(messages);
};