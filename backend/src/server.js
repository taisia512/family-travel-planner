require('dotenv').config();

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const { Server } = require('socket.io');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express5');

const app = require('./app');
const initDatabase = require('./database/init');
const { typeDefs, resolvers } = require('./graphql/schema');
const connectMongo = require('./database/mongo');
const chatService = require('./services/chatService');

const HTTP_PORT = process.env.PORT || process.env.HTTP_PORT || 5000;
const HTTPS_PORT = process.env.HTTPS_PORT || 5443;

const certsDir = path.join(__dirname, '../certs');
const keyPath = path.join(certsDir, 'server.key');
const certPath = path.join(certsDir, 'server.crt');

const certsExist = fs.existsSync(keyPath) && fs.existsSync(certPath);

let primaryServer;
let usingHttps = false;

if (process.env.NODE_ENV === 'production') {
  primaryServer = http.createServer(app);
  console.log(
    `Production environment detected. HTTP server will run internally on port ${HTTP_PORT} (HTTPS managed by Render).`
  );
} else if (certsExist) {
  const tlsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };

  primaryServer = https.createServer(tlsOptions, app);
  usingHttps = true;
  console.log(`TLS certificates loaded. HTTPS will run on port ${HTTPS_PORT}`);
} else {
  primaryServer = http.createServer(app);
  console.warn('WARNING: No TLS certificates found in backend/certs/.');
  console.warn('Run node scripts/generate-cert.js to enable HTTPS.');
  console.warn(`Falling back to HTTP on port ${HTTP_PORT}.`);
}

const io = new Server(primaryServer, {
  cors: {
    origin: '*'
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('join', async (userEmail) => {
    try {
      socket.join(userEmail);

      const unreadCounts = await chatService.getUnreadCounts(userEmail);
      socket.emit('unreadCounts', unreadCounts);
    } catch (error) {
      console.error('Join error:', error);
    }
  });

  socket.on('getChatHistory', async ({ user1, user2 }) => {
    try {
      await chatService.markMessagesAsRead(user1, user2);

      const messages = await chatService.getPrivateMessages(user1, user2);
      const unreadCounts = await chatService.getUnreadCounts(user1);

      socket.emit('chatHistory', messages);
      socket.emit('unreadCounts', unreadCounts);
    } catch (error) {
      console.error('Chat history error:', error);
    }
  });

  socket.on('sendMessage', async (msg) => {
    try {
      const savedMessage = await chatService.addMessage(msg);

      const plainMessage =
        typeof savedMessage.toObject === 'function'
          ? savedMessage.toObject()
          : savedMessage;

      const messageToSend = {
        ...plainMessage,
        tempId: msg.tempId
      };

      io.to(msg.receiverEmail).emit('receiveMessage', messageToSend);
      io.to(msg.senderEmail).emit('receiveMessage', messageToSend);

      const receiverUnreadCounts = await chatService.getUnreadCounts(
        msg.receiverEmail
      );

      io.to(msg.receiverEmail).emit('unreadCounts', receiverUnreadCounts);
    } catch (error) {
      console.error('Send message error:', error);

      socket.emit('messageError', {
        tempId: msg.tempId,
        error: 'Message could not be sent'
      });
    }
  });

  socket.on('markAsRead', async ({ currentUserEmail, otherUserEmail }) => {
    try {
      await chatService.markMessagesAsRead(currentUserEmail, otherUserEmail);
      const unreadCounts = await chatService.getUnreadCounts(currentUserEmail);
      socket.emit('unreadCounts', unreadCounts);
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

async function startServer() {
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers
  });

  await apolloServer.start();
  app.use('/graphql', expressMiddleware(apolloServer));

  await connectMongo();
  await initDatabase();

  const port = usingHttps ? HTTPS_PORT : HTTP_PORT;
  const protocol = usingHttps ? 'https' : 'http';

  primaryServer.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on ${protocol}://localhost:${port}`);
  });
}

startServer();