const { BadRequestError, NotFoundError } = require('../expressError');

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
 * {name: 'net', minEmployees: 200} => ['"name" ILIKE '%$1%'', '"num_employees" > $2']
 *
 * Will accept provided filters even if not all filters are provided.
 *
 * If minEmployees > maxEmployees, throws 404 error.
 */

function sqlForCompaniesFilter(filterCriteria) {
    let filters = [];
    let idx = 1;
    if (filterCriteria.name) {
        filters.push(`name ILIKE '%${filterCriteria.name}%'`);
        idx++;
    }
    if (filterCriteria.minEmployees && filterCriteria.maxEmployees) {
        if (filterCriteria.minEmployees > filterCriteria.maxEmployees)
            throw new NotFoundError();
        filters.push(
            `num_employees < ${filterCriteria.maxEmployees} AND num_employees > ${filterCriteria.minEmployees}`
        );
    } else {
        if (filterCriteria.minEmployees) {
            filters.push(`num_employees > ${filterCriteria.minEmployees}`);
            idx++;
        }
        if (filterCriteria.maxEmployees) {
            filters.push(`num_employees < ${filterCriteria.maxEmployees}`);
        }
    }
    return filters;
}

module.exports = { sqlForPartialUpdate, sqlForCompaniesFilter };
