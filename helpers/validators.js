/** Validators: Parse company queries.
 *
 * Parses user query inputs for name, minEmployees, and maxEmployees and converts min and max employees to integers.
 * Returns new object containing parsed queries.
 */

function parseCompaniesQueries(queryParams) {
    let params = {};
    if (queryParams.name) {
        params['name'] = queryParams.name;
    }
    if (queryParams.minEmployees) {
        params['minEmployees'] = Number(queryParams.minEmployees);
    }
    if (queryParams.maxEmployees) {
        params['maxEmployees'] = Number(queryParams.maxEmployees);
    }
    return params;
}

/** Parse job queries
 *
 * Parses user query input for title, minSalary and hasEquity and converts minSalary and hasEquity to integers.
 * Returns new object containing parsed queries.
 */

function parseJobsQueries(queryParams) {
    let params = {};
    if (queryParams.title) {
        params['title'] = queryParams.title;
    }
    if (queryParams.minSalary) {
        params['minSalary'] = Number(queryParams.minSalary);
    }
    if (queryParams.hasEquity) {
        params['hasEquity'] = Boolean(queryParams.hasEquity);
    }
    return params;
}

module.exports = { parseCompaniesQueries, parseJobsQueries };
