import AuthenticationError from '../../../Commons/exceptions/AuthenticationError.js';
import AuthenticationTokenManager from '../../../Applications/security/AuthenticationTokenManager.js';

const BEARER_PATTERN = /^Bearer (.+)$/;

const createAuthenticationMiddleware = (container) => async (req, res, next) => {
  try {
    const [, accessToken] = BEARER_PATTERN.exec(req.headers.authorization || '') || [];

    if (!accessToken) {
      throw new AuthenticationError('Missing authentication');
    }

    const authenticationTokenManager = container.getInstance(AuthenticationTokenManager.name);
    const { id, username } = await authenticationTokenManager.verifyAccessToken(accessToken);

    req.auth = { credentials: { id, username } };

    return next();
  } catch (error) {
    return next(error);
  }
};

export default createAuthenticationMiddleware;
