'use strict';

/** Routes for jobs. */

const jsonschema = require('jsonschema');
const express = require('express');

const { BadRequestError } = require('../expressError');
const { ensureLoggedIn, ensureAdmin } = require('../middleware/auth');
const Job = require('../models/job');
const { parseJobsQueries } = require('../helpers/validators');

const jobNewSchema = require('../schemas/jobNew.json');
const jobUpdateSchema = require('../schemas/jobUpdate.json');
const jobFilterSchema = require('../schemas/jobFilter.json');

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { id, title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: login
 */

router.post('/', ensureLoggedIn, ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map((e) => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - title
 * - minSalary
 * - hasEquity
 *
 * Authorization required: none
 */

router.get('/', async function (req, res, next) {
    try {
        let jobs;
        let params = {};
        if (req.query.title || req.query.minSalary || req.query.hasEquity) {
            params = parseJobsQueries(req.query);
            const validator = jsonschema.validate(params, jobFilterSchema);
            if (!validator.valid) {
                const errs = validator.errors.map((e) => e.stack);
                throw new BadRequestError(errs);
            }
            jobs = await Job.findAll(req.query);
        } else {
            jobs = await Job.findAll();
        }
        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, companyHandle }
 *
 * Authorization required: none
 */

router.get('/:id', async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity, company_handle }
 *
 * Returns { id, title, salary, equity, company_handle }
 *
 * Authorization required: admin, login
 */

router.patch(
    '/:id',
    ensureLoggedIn,
    ensureAdmin,
    async function (req, res, next) {
        try {
            const validator = jsonschema.validate(req.body, jobUpdateSchema);
            if (!validator.valid || req.body.id) {
                const errs = validator.errors.map((e) => e.stack);
                throw new BadRequestError(errs);
            }

            const job = await Job.update(req.params.id, req.body);
            return res.json({ job });
        } catch (err) {
            return next(err);
        }
    }
);

/** DELETE /[id]  =>  { deleted: handle }
 *
 * Authorization: admin, login
 */

router.delete(
    '/:id',
    ensureLoggedIn,
    ensureAdmin,
    async function (req, res, next) {
        try {
            await Job.remove(req.params.id);
            return res.json({ deleted: req.params.id });
        } catch (err) {
            return next(err);
        }
    }
);

module.exports = router;
