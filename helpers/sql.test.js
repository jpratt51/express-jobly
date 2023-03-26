const { sqlForPartialUpdate } = require('./sql');
const { BadRequestError } = require('../expressError');

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
