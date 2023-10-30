import express from 'express';
import { query } from 'express-validator';

import { handleError, sanitize } from '../helpers/routing.js';
import { getDeeplink, getToken } from '../helpers/zoom-api.js';

import session from '../session.js';

const router = express.Router();

const codeMin = 32;
const codeMax = 64;


// Custom validation function to check if the state is base64 encoded
const isBase64Encoded = (value, { req }) => {
    try {
        // Attempt to decode the value from base64
        const decodedState = Buffer.from(value, 'base64').toString('utf-8');

        // Check if the decoded state matches the value stored in the session
        if (decodedState === req.session.state) {
            return true;
        } else {
            throw new Error('Invalid state parameter');
        }
    } catch (err) {
        throw new Error('Invalid state parameter');
    }
};

// Validate the Authorization Code sent from Zoom
const validateQuery = [
    query('code')
        .isString()
        .withMessage('code must be a string')
        .isLength({ min: codeMin, max: codeMax })
        .withMessage(`code must be > ${codeMin} and < ${codeMax} chars`)
        .escape(),
    query('state')
        .isString()
        .withMessage('state must be a string')
        .custom((value, { req }) => value === req.session.state)
        .withMessage('invalid state parameter')
        .escape(),
];

/*
 * Redirect URI - Zoom App Launch handler
 * The user is redirected to this route when they authorize your app
 */
router.get('/', session, validateQuery, async (req, res, next) => {
    req.session.state = null;

    try {
        // sanitize code and state query parameters
        sanitize(req);

        const code = req.query.code;
        const verifier = req.session.verifier;

        req.session.verifier = null;

        // get Access Token from Zoom
        const { access_token: accessToken } = await getToken(code, verifier);

        // fetch deeplink from Zoom API
        const deeplink = await getDeeplink(accessToken);

        // redirect the user to the Zoom Client
        res.redirect(deeplink);
    } catch (e) {
        next(handleError(e));
    }
});

export default router;
