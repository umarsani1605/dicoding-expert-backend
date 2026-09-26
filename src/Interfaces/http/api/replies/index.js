import RepliesHandler from './handler.js';
import createRepliesRouter from './routes.js';
import createAuthenticationMiddleware from '../../middlewares/authentication.js';

export default (container) => {
  const repliesHandler = new RepliesHandler(container);
  const authenticate = createAuthenticationMiddleware(container);

  return createRepliesRouter(repliesHandler, authenticate);
};
