/** Validators: Parse company queries.
 *
 * Parses user query inputs for name, minEmployees, and maxEmployees and converts min and max employees to integers.
 * Returns new object containing parsed queries.
 */

function parseQueries(queryParams) {
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

module.exports = { parseQueries };
