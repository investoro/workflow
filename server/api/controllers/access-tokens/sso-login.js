/*
 * Endpoint: POST /access-tokens/sso-login
 * Description: Loguje użytkownika na podstawie tokena SSO (JWT) wygenerowanego przez WordPressa.
 * Odpowiada standardowym tokenem JWT Planki.
 */

const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { getRemoteAddress } = require('../../../utils/remote-address');

const Errors = {
  INVALID_TOKEN: {
    invalidToken: 'Invalid or expired SSO token',
  },
  USER_NOT_FOUND: {
    userNotFound: 'User not found',
  },
};

module.exports = {
  inputs: {
    ssoToken: {
      type: 'string',
      required: true,
    },
    withHttpOnlyToken: {
      type: 'boolean',
      defaultsTo: false,
    },
  },

  exits: {
    invalidToken: {
      responseType: 'unauthorized',
    },
    userNotFound: {
      responseType: 'unauthorized',
    },
  },

  async fn(inputs) {
    const SSO_SECRET = process.env.SSO_SHARED_SECRET || sails.config.custom.ssoSharedSecret;
    let payload;
    try {
      payload = jwt.verify(inputs.ssoToken, SSO_SECRET);
    } catch (err) {
      sails.log.warn('Invalid SSO token:', err.message);
      throw Errors.INVALID_TOKEN;
    }

    const userId = payload.user_id;
    const { email } = payload;
    let user = null;
    if (userId) {
      user = await User.findOne({ id: userId });
    } else if (email) {
      user = await User.findOne({ email });
    }
    if (!user) {
      sails.log.warn('User not found for SSO token');
      throw Errors.USER_NOT_FOUND;
    }

    const remoteAddress = getRemoteAddress(this.req);
    const { token: accessToken, payload: accessTokenPayload } = sails.helpers.utils.createJwtToken(
      user.id,
    );
    const httpOnlyToken = inputs.withHttpOnlyToken ? uuid() : null;

    await Session.qm.createOne({
      accessToken,
      httpOnlyToken,
      remoteAddress,
      userId: user.id,
      userAgent: this.req.headers['user-agent'],
    });

    if (httpOnlyToken && !this.req.isSocket) {
      sails.helpers.utils.setHttpOnlyTokenCookie(httpOnlyToken, accessTokenPayload, this.res);
    }

    return {
      item: accessToken,
      httpOnlyToken,
    };
  },
};
