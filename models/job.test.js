'use strict';

const db = require('../db.js');
const { BadRequestError, NotFoundError } = require('../expressError');
const Job = require('./job.js');
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

let testId;
let jobObj;

async function jobsBeforeEach() {
    const newJob = {
        title: 'test4',
        salary: 70000,
        equity: 0,
        companyHandle: 'c1',
    };

    await Job.create(newJob);

    let result = await db.query(
        `SELECT id, title, salary, equity, company_handle
       FROM jobs
       WHERE title = 'test4'`
    );
    jobObj = result.rows[0];
    testId = result.rows[0].id;
}

beforeEach(jobsBeforeEach);

/************************************** create */

describe('create', function () {
    test('works', async function () {
        expect(jobObj).toHaveProperty('title', 'test4');
        expect(jobObj).toHaveProperty('salary', 70000);
        expect(jobObj).toHaveProperty('equity', '0');
        expect(jobObj).toHaveProperty('company_handle', 'c1');

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${testId}`
        );
        expect(result.rows).toEqual([
            {
                id: testId,
                title: 'test4',
                salary: 70000,
                equity: '0',
                company_handle: 'c1',
            },
        ]);
    });
});

/************************************** findAll */

describe('findAll', function () {
    test('works: no filter', async function () {
        const jobs = await Job.findAll();
        expect(jobs[0]).toHaveProperty('title', 'test');
        expect(jobs[0]).toHaveProperty('salary', 55000);
        expect(jobs[0]).toHaveProperty('equity', '0');
        expect(jobs[0]).toHaveProperty('companyHandle', 'c1');
        expect(jobs[1]).toHaveProperty('title', 'test2');
        expect(jobs[1]).toHaveProperty('salary', 50000);
        expect(jobs[1]).toHaveProperty('equity', '0');
        expect(jobs[1]).toHaveProperty('companyHandle', 'c2');
        expect(jobs[2]).toHaveProperty('title', 'test3');
        expect(jobs[2]).toHaveProperty('salary', 45000);
        expect(jobs[2]).toHaveProperty('equity', '0');
        expect(jobs[2]).toHaveProperty('companyHandle', 'c3');
    });
});

/************************************** get */

describe('get', function () {
    test('works', async function () {
        let job = await Job.get(testId);
        expect(job).toEqual({
            id: testId,
            title: 'test4',
            salary: 70000,
            equity: '0',
            companyHandle: 'c1',
        });
    });

    test('not found if no such job', async function () {
        try {
            await Job.get(8);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe('update', function () {
    const updateData = {
        title: 'test5',
        salary: 85000,
        equity: 0.02,
        companyHandle: 'c3',
    };

    test('works', async function () {
        let job = await Job.update(testId, updateData);
        expect(job).toEqual({
            id: testId,
            title: 'test5',
            salary: 85000,
            equity: '0.02',
            companyHandle: 'c3',
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${testId}`
        );
        expect(result.rows).toEqual([
            {
                id: testId,
                title: 'test5',
                salary: 85000,
                equity: '0.02',
                company_handle: 'c3',
            },
        ]);
    });

    test('works: null fields', async function () {
        const updateDataSetNulls = {
            title: 'testTwo',
            salary: 90000,
            companyHandle: 'c2',
        };

        let job = await Job.update(testId, updateDataSetNulls);
        expect(job).toEqual({
            id: testId,
            equity: '0',
            ...updateDataSetNulls,
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${testId}`
        );
        expect(result.rows).toEqual([
            {
                id: testId,
                title: 'testTwo',
                salary: 90000,
                equity: '0',
                company_handle: 'c2',
            },
        ]);
    });

    test('not found if no such company', async function () {
        try {
            await Job.update(-1, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test('bad request with no data', async function () {
        try {
            await Job.update(testId, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe('remove', function () {
    test('works', async function () {
        await Job.remove(testId);
        const res = await db.query(`SELECT id FROM jobs WHERE id=${testId}`);
        expect(res.rows.length).toEqual(0);
    });

    test('not found if no such job', async function () {
        try {
            await Job.remove(-1);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
