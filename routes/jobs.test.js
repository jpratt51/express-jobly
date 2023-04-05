'use strict';

const request = require('supertest');

const db = require('../db');
const app = require('../app');

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    u4Token,
} = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

let testJob;

async function getTestJob() {
    let res = await db.query(`SELECT * FROM jobs WHERE title = 'j1'`);
    testJob = res.rows[0];
    return testJob;
}

beforeEach(getTestJob);

/************************************** POST /jobs */

describe('POST /jobs', function () {
    const newJob = {
        title: 'Spray Foam Technician',
        salary: 47850,
        equity: 0,
        companyHandle: 'c1',
    };

    test('ok for Admin', async function () {
        const resp = await request(app)
            .post('/jobs')
            .send(newJob)
            .set('authorization', `Bearer ${u4Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                title: 'Spray Foam Technician',
                salary: 47850,
                equity: '0',
                companyHandle: 'c1',
            },
        });
    });

    test('unauth for non Admin user', async function () {
        const resp = await request(app)
            .post('/jobs')
            .send(newJob)
            .set('authorization', `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test('bad request with missing data', async function () {
        const resp = await request(app)
            .post('/jobs')
            .send({
                title: 'Duct Truck Worker',
                salary: 50000,
            })
            .set('authorization', `Bearer ${u4Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test('bad request with invalid data', async function () {
        const resp = await request(app)
            .post('/jobs')
            .send({
                title: 'Spray Foam Technician',
                salary: 'seven',
                equity: 0,
                companyHandle: 'c1',
            })
            .set('authorization', `Bearer ${u4Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe('GET /jobs', function () {
    test('ok for anon', async function () {
        const resp = await request(app).get('/jobs');
        expect(resp.body.jobs[0]).toHaveProperty('title', 'j1');
        expect(resp.body.jobs[1]).toHaveProperty('title', 'j2');
        expect(resp.body.jobs[2]).toHaveProperty('title', 'j3');
    });

    test('test all filters', async function () {
        const resp = await request(app)
            .get('/jobs')
            .query({ title: 'j', minSalary: 1, hasEquity: false });
        expect(resp.body.jobs[0]).toHaveProperty('title', 'j1');
        expect(resp.body.jobs[1]).toBeUndefined();
        expect(resp.body.jobs[2]).toBeUndefined();
    });

    test('test only title filter', async function () {
        const resp = await request(app).get('/jobs').query({ title: 'j' });
        expect(resp.body.jobs[0]).toHaveProperty('title', 'j1');
        expect(resp.body.jobs[0]).toHaveProperty('title', 'j1');
        expect(resp.body.jobs[0]).toHaveProperty('title', 'j1');
    });

    test('test only minSalary filter', async function () {
        const resp = await request(app).get('/jobs').query({ minSalary: 11 });
        expect(resp.body.jobs[0]).toHaveProperty('title', 'j2');
        expect(resp.body.jobs[1]).toHaveProperty('title', 'j3');
        expect(resp.body.jobs[2]).toBeUndefined();
    });

    test('test only hasEquity filter', async function () {
        const resp = await request(app).get('/jobs').query({ hasEquity: true });
        expect(resp.body.jobs[0]).toHaveProperty('title', 'j2');
        expect(resp.body.jobs[1]).toHaveProperty('title', 'j3');
        expect(resp.body.jobs[2]).toBeUndefined();
    });
});

/************************************** GET /jobs/:id */

describe('GET /jobs/:id', function () {
    test('works for anon', async function () {
        const resp = await request(app).get(`/jobs/${testJob.id}`);
        expect(resp.body).toEqual({
            job: {
                id: testJob.id,
                title: 'j1',
                salary: 10,
                equity: '0',
                companyHandle: 'c1',
            },
        });
    });

    test('not found for no such job', async function () {
        const resp = await request(app).get(`/jobs/-1`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:id */

describe('PATCH /jobs/:id', function () {
    test('works for Admin all fields', async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJob.id}`)
            .send({
                title: 'j17',
                salary: 57000,
                equity: 0.33,
                companyHandle: 'c2',
            })
            .set('authorization', `Bearer ${u4Token}`);
        expect(resp.body).toEqual({
            job: {
                id: testJob.id,
                title: 'j17',
                salary: 57000,
                equity: '0.33',
                companyHandle: 'c2',
            },
        });
    });

    test('works for Admin missing fields', async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJob.id}`)
            .send({
                title: 'j4',
            })
            .set('authorization', `Bearer ${u4Token}`);
        expect(resp.body).toEqual({
            job: {
                id: testJob.id,
                title: 'j4',
                salary: testJob.salary,
                equity: testJob.equity,
                companyHandle: testJob.company_handle,
            },
        });
    });

    test('unauth for non Admin user', async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJob.id}`)
            .send({
                title: 'j4',
            })
            .set('authorization', `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test('unauth for anon', async function () {
        const resp = await request(app).patch(`/jobs/${testJob.id}`).send({
            title: 'j4',
        });
        expect(resp.statusCode).toEqual(401);
    });

    test('not found for no such job', async function () {
        const resp = await request(app)
            .patch(`/jobs/-1`)
            .send({
                title: 'j4',
            })
            .set('authorization', `Bearer ${u4Token}`);
        expect(resp.statusCode).toEqual(404);
    });

    test('bad request on id change attempt', async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJob.id}`)
            .send({
                id: 17,
            })
            .set('authorization', `Bearer ${u4Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test('bad request on invalid data', async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJob.id}`)
            .send({
                title: 17,
            })
            .set('authorization', `Bearer ${u4Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:id */

describe('DELETE /jobs/:id', function () {
    test('works for Admin', async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJob.id}`)
            .set('authorization', `Bearer ${u4Token}`);
        expect(resp.body).toEqual({ deleted: String(testJob.id) });
    });

    test('unauth for non Admin user', async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJob.id}`)
            .set('authorization', `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test('unauth for anon', async function () {
        const resp = await request(app).delete(`/jobs/${testJob.id}`);
        expect(resp.statusCode).toEqual(401);
    });

    test('not found for no such job', async function () {
        const resp = await request(app)
            .delete(`/jobs/-1`)
            .set('authorization', `Bearer ${u4Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});
