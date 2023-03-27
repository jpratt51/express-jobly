const { sqlForPartialUpdate, sqlForCompaniesFilter } = require('./sql');
const { BadRequestError, NotFoundError } = require('../expressError');

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require('../models/_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe('sqlForPartialUpdate', function () {
    test('converts JS to SQL for update', function () {
        const userInput = {
            firstName: 'user1First',
            lastName: 'user1Last',
        };
        const jsToSql = sqlForPartialUpdate(userInput, {
            firstName: 'first_name',
            lastName: 'last_name',
            isAdmin: 'is_admin',
        });
        expect(jsToSql).toEqual({
            setCols: '"first_name"=$1, "last_name"=$2',
            values: ['user1First', 'user1Last'],
        });
    });
    test('invalid user input throws BadRequestError', function () {
        try {
            sqlForPartialUpdate('', {
                firstName: 'first_name',
                lastName: 'last_name',
                isAdmin: 'is_admin',
            });
            fail();
        } catch (e) {
            expect(e instanceof BadRequestError).toBeTruthy();
        }
    });
});

describe('sqlForCompaniesFilter', function () {
    test('Parses and converts JS to SQL for filtering companies', function () {
        const userInput = {
            name: 'c',
            minEmployees: 1,
            maxEmployees: 2,
        };
        const jsToSql = sqlForCompaniesFilter(userInput);
        expect(jsToSql).toEqual([
            "name ILIKE '%c%'",
            'num_employees BETWEEN 1 AND 2',
        ]);
    });
    test('Works for name only user input', function () {
        const userInput = {
            name: 'c',
        };
        const jsToSql = sqlForCompaniesFilter(userInput);
        expect(jsToSql).toEqual(["name ILIKE '%c%'"]);
    });
    test('Works for minEmployees only user input', function () {
        const userInput = {
            minEmployees: 2,
        };
        const jsToSql = sqlForCompaniesFilter(userInput);
        expect(jsToSql).toEqual(['num_employees >= 2']);
    });
    test('Works for maxEmployees only user input', function () {
        const userInput = {
            maxEmployees: 2,
        };
        const jsToSql = sqlForCompaniesFilter(userInput);
        expect(jsToSql).toEqual(['num_employees <= 2']);
    });
    test('Works for maxEmployees only user input', function () {
        const userInput = {
            minEmployees: 1,
            maxEmployees: 2,
        };
        const jsToSql = sqlForCompaniesFilter(userInput);
        expect(jsToSql).toEqual(['num_employees BETWEEN 1 AND 2']);
    });
    test('If minEmployees > maxEmployees, throws 404 error.', function () {
        try {
            sqlForCompaniesFilter({
                minEmployees: 2,
                maxEmployees: 1,
            });
            fail();
        } catch (e) {
            expect(e instanceof NotFoundError).toBeTruthy();
        }
    });
});
