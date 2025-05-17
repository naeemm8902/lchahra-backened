import express from 'express';
import connectToMongo from './db.js';
import usersRouter from './routes/userRouter.js';
import cors from 'cors';
import workspaceRouter from './routes/workspaceRouter.js';
import { authenticateUser } from './middleware/authMiddleware.js';
import invitationRoutes from './routes/invitationRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
const app = express();
const port = 4001;

app.use(express.json());
app.use(
  cors({
    origin: '*', // Allow all origins (change this in production)
    allowedHeaders: ['Authorization', 'Content-Type'], // Allow Authorization header
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }),
);
app.use(authenticateUser);
app.use('/api/users', usersRouter);
app.use('/api/workspace', workspaceRouter);
app.use('/api/invitations', invitationRoutes);
app.use('/api/project', projectRoutes);

// making routes for chat and message
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
connectToMongo(port);
console.log('Server is running on port : ', port);

app.listen(port, function () {
  console.log('Server is running on port : ', port);
});
