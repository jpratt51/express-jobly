'use strict';

const db = require('../db');
const { NotFoundError } = require('../expressError');
const { sqlForPartialUpdate, sqlForJobsFilter } = require('../helpers/sql');

/** Related functions for jobs. */

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { id, title, salary, equity, companyHandle }
     *
     * Returns { id, title, salary, equity, companyHandle }
     *
     * Throws BadRequestError if job already in database.
     * */

    static async create({ title, salary, equity, companyHandle }) {
        const result = await db.query(
            `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING title, salary, equity, company_handle AS "companyHandle"`,
            [title, salary, equity, companyHandle]
        );
        const job = result.rows[0];

        return job;
    }

    /** Find all jobs. Takes optional filters to narrow results: title, minSalary, hasEquity
     *
     * Works with no filters or with select filters, all are optional.
     *
     * title filter will return only jobs that contain the title query.
     * minSalary filter will return only jobs greater than the minSalary query.
     * hasEquity filter will return only jobs that have equity greater than zero.
     *
     * Returns [{ id, title, salary, equity, companyHandle }, ...]
     * */

    static async findAll(filters) {
        let jobsRes;
        if (filters) {
            const filterInputs = sqlForJobsFilter(filters);
            const jobFilters = filterInputs.join(' AND ');
            jobsRes = await db.query(
                `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
                FROM jobs
                WHERE ${jobFilters} ORDER BY title`
            );
        } else {
            jobsRes = await db.query(
                `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
                FROM jobs
                ORDER BY title`
            );
        }
        return jobsRes.rows;
    }

    /** Given a job title, return data about job.
     *
     * Returns { id, title, salary, equity, companyHandle }
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
            [id]
        );

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Update job data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {title, salary, equity, companyHandle}
     *
     * Returns {id, title, salary, equity, companyHandle}
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data, {
            companyHandle: 'company_handle',
        });
        const handleVarIdx = '$' + (values.length + 1);

        const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if job not found.
     **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
            [id]
        );
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;
