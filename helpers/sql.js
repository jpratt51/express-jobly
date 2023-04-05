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

/** SQL for Companies Filter.
 *
 * Parses and converts user input into sql for filtering companies:
 * {name: 'net', minEmployees: 200} => ['"name" ILIKE '%net%'', '"num_employees" >= 200']
 *
 * Searching by name is case insensitive by use of ILIKE operator.
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
            `num_employees BETWEEN ${filterCriteria.minEmployees} AND ${filterCriteria.maxEmployees}`
        );
    } else {
        if (filterCriteria.minEmployees) {
            filters.push(`num_employees >= ${filterCriteria.minEmployees}`);
            idx++;
        }
        if (filterCriteria.maxEmployees) {
            filters.push(`num_employees <= ${filterCriteria.maxEmployees}`);
        }
    }
    return filters;
}

function sqlForJobsFilter(filterCriteria) {
    let filters = [];
    let idx = 1;
    if (filterCriteria.title) {
        filters.push(`title ILIKE '%${filterCriteria.title}%'`);
        idx++;
    }
    if (filterCriteria.minSalary) {
        filters.push(`salary >= ${filterCriteria.minSalary}`);
        idx++;
    }
    if (filterCriteria.hasEquity === 'true') {
        filters.push(`equity > 0`);
    } else if (filterCriteria.hasEquity === 'false') {
        filters.push(`equity = 0`);
    }
    return filters;
}

module.exports = {
    sqlForPartialUpdate,
    sqlForCompaniesFilter,
    sqlForJobsFilter,
};
