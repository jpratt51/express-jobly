const { BadRequestError } = require('../expressError');

/** Helpers: SQL for Update.
 *
 * Converts user input into sql for updating database:
 * {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
 *
 * Will accept provided fields even if not all fields are provided and only update * provided fields.
 *
 * If no input is sent, throws BadRequestError.
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
    const keys = Object.keys(dataToUpdate);
    if (keys.length === 0) throw new BadRequestError('No data');

    const cols = keys.map(
        (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
    );
    console.log({
        setCols: cols.join(', '),
        values: Object.values(dataToUpdate),
    });
    return {
        setCols: cols.join(', '),
        values: Object.values(dataToUpdate),
    };
}

module.exports = { sqlForPartialUpdate };
