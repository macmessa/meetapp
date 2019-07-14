import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import authMiddleware from './app/middlewares/auth';
import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import MeetupController from './app/controllers/MeetupController';
import OrganizingController from './app/controllers/OrganizingController';
import SubscriptionController from './app/controllers/SubscriptionController';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);

// Update user info
routes.put('/users', UserController.update);

// Handle uploaded files
routes.post('/files', upload.single('file'), FileController.store);

// Meetup routes
routes.get('/meetups', MeetupController.index); // List all
routes.post('/meetups', MeetupController.store);
routes.put('/meetups/:id', MeetupController.update);
routes.delete('/meetups/:id', MeetupController.delete);

// Meetups where logged user is the owner
routes.get('/organizing', OrganizingController.index);

// List subscriptions
routes.get('/subscriptions', SubscriptionController.index);

// Subscribe to meetup
routes.post('/meetups/:id/subscriptions', SubscriptionController.store);

export default routes;
