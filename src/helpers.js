const fetchAsPromised = require('node-fetch');
const Table = require('cli-table');

/**
 * GET-only fetch.
 *
 * @param  {String} endpoint Endpoint to fetch.
 * @return {Promise}         Promise resolving in the json response.
 */
function fetch(endpoint) {
  return fetchAsPromised(endpoint).then(response => response.json());
}

/**
 * Flatten a two-dimensional array into a single one.
 *
 * @param  {Array} arrayOfArrays  Array pf arrays.
 * @return {Array}                Flattened array.
 */
function flatten(arrayOfArrays) {
  return arrayOfArrays.reduce((reduced, current) => [...reduced, ...current]);
}

/**
 * Generate a table that will be printed to the console.
 *
 * @param  {Array} head  Array of head labels.
 * @param  {Array} rows  Array of rows to insert.
 * @return {String}      ToStringed version of the table. Ready to output wherever.
 */
function generateCliTable(head, rows) {
  const table = new Table({ head });
  table.push(...rows);

  return table.toString();
}

module.exports = {
  fetch,
  flatten,
  generateCliTable,
};
