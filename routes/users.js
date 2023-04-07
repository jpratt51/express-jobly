'use strict';

/** Routes for users. */

const jsonschema = require('jsonschema');

const express = require('express');
const { ensureLoggedIn, ensureAdmin } = require('../middleware/auth');
const { BadRequestError, UnauthorizedError } = require('../expressError');
const User = require('../models/user');
const { createToken } = require('../helpers/tokens');
const userNewSchema = require('../schemas/userNew.json');
const userUpdateSchema = require('../schemas/userUpdate.json');
const applyNewSchema = require('../schemas/applyNew.json');

const router = express.Router();

/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: login, Admin
 **/

router.post('/', ensureLoggedIn, ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, userNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map((e) => e.stack);
            throw new BadRequestError(errs);
        }

        const user = await User.register(req.body);
        const token = createToken(user);
        return res.status(201).json({ user, token });
    } catch (err) {
        return next(err);
    }
});

/** POST / { username, job_id }  => { username, id }
 *
 * Adds a new job application to database. The new application can be added by either the logged in user or an
 * admin.
 *
 * This returns application confirmation:
 *  { applied: job_id }
 *
 * Authorization required: login and/or admin
 **/

router.post(
    '/:username/jobs/:id',
    ensureLoggedIn,
    async function (req, res, next) {
        try {
            if (
                req.params.username === res.locals.user.username ||
                res.locals.user.isAdmin === true
            ) {
                let params = {
                    username: req.params.username,
                    id: Number(req.params.id),
                };
                const validator = jsonschema.validate(params, applyNewSchema);
                if (!validator.valid) {
                    const errs = validator.errors.map((e) => e.stack);
                    throw new BadRequestError(errs);
                }

                let application = await User.apply({
                    username: req.params.username,
                    id: req.params.id,
                });
                console.log(application);
                return res.status(201).json({ applied: req.params.id });
            }
            throw new UnauthorizedError();
        } catch (err) {
            return next(err);
        }
    }
);

/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: login
 **/

router.get('/', ensureLoggedIn, ensureAdmin, async function (req, res, next) {
    try {
        const users = await User.findAll();
        return res.json({ users });
    } catch (err) {
        return next(err);
    }
});

/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: login and/or admin
 **/

router.get('/:username', ensureLoggedIn, async function (req, res, next) {
    try {
        if (
            req.params.username === res.locals.user.username ||
            res.locals.user.isAdmin === true
        ) {
            const user = await User.get(req.params.username);
            return res.json({ user });
        }
        throw new UnauthorizedError();
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: login and/or admin
 **/

router.patch('/:username', ensureLoggedIn, async function (req, res, next) {
    try {
        if (
            req.params.username === res.locals.user.username ||
            res.locals.user.isAdmin === true
        ) {
            const validator = jsonschema.validate(req.body, userUpdateSchema);
            if (!validator.valid) {
                const errs = validator.errors.map((e) => e.stack);
                throw new BadRequestError(errs);
            }

            const user = await User.update(req.params.username, req.body);
            return res.json({ user });
        }
        throw new UnauthorizedError();
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: login and/or admin
 **/

router.delete('/:username', ensureLoggedIn, async function (req, res, next) {
    try {
        if (
            req.params.username === res.locals.user.username ||
            res.locals.user.isAdmin === true
        ) {
            await User.remove(req.params.username);
            return res.json({ deleted: req.params.username });
        }
        throw new UnauthorizedError();
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
