import ThreadsHandler from './handler.js';
import createThreadsRouter from './routes.js';
import comments from '../comments/index.js';
import createAuthenticationMiddleware from '../../middlewares/authentication.js';

export default (container) => {
  const threadsHandler = new ThreadsHandler(container);
  const authenticate = createAuthenticationMiddleware(container);

  return createThreadsRouter(threadsHandler, authenticate, comments(container));
};
