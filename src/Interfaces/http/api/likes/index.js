import LikesHandler from './handler.js';
import createLikesRouter from './routes.js';
import createAuthenticationMiddleware from '../../middlewares/authentication.js';

export default (container) => {
  const likesHandler = new LikesHandler(container);
  const authenticate = createAuthenticationMiddleware(container);

  return createLikesRouter(likesHandler, authenticate);
};
