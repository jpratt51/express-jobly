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
    return {
        setCols: cols.join(', '),
        values: Object.values(dataToUpdate),
    };
}

/** Helpers: SQL for Companies Filter.
 *
 * Parses and converts user input into sql for filtering companies:
 * {name: 'net', minEmployees: 200} => ['"name"=$1', '"num_employees" > $2']
 *
 * Will accept provided filters even if not all filters are provided.
 */

function sqlForCompaniesFilter(filterCriteria) {
    let filters = [];
    let idx = 1;
    if (filterCriteria.name) {
        filters.push(`"name" ILIKE '$$${idx}$'`);
        idx++;
    }
    if (filterCriteria.minEmployees && filterCriteria.maxEmployees) {
        filters.push(
            `"num_employees < $${idx} AND num_employees > $${idx + 1}`
        );
    } else {
        if (filterCriteria.minEmployees) {
            filters.push(`"num_employees>$${idx}`);
            idx++;
        }
        if (filterCriteria.maxEmployees) {
            filters.push(`"num_employees<$${idx}`);
        }
    }
    return filters;
}

module.exports = { sqlForPartialUpdate, sqlForCompaniesFilter };
