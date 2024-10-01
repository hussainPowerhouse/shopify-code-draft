/**
* @NApiVersion 2.1
* @NScriptType Restlet
* @NModuleScope Public
*/

/* 

------------------------------------------------------------------------------------------
Script Information
------------------------------------------------------------------------------------------

Name:
Saved Search API

ID:
_saved_search_api

Description
An API that can be used to provide data via saved searches.


------------------------------------------------------------------------------------------
MIT License
------------------------------------------------------------------------------------------

Copyright (c) 2021 Timothy Dietrich.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


------------------------------------------------------------------------------------------
Developer
------------------------------------------------------------------------------------------

Tim Dietrich
* timdietrich@me.com
* https://timdietrich.me


------------------------------------------------------------------------------------------
History
------------------------------------------------------------------------------------------

20211207 - Tim Dietrich
- Initial public release.


*/


var 
     log,
     search,
     response = new Object();     


define( [ 'N/log', 'N/search' ], main);


function main( logModule, searchModule ) {
    
  
     log = logModule;
     search = searchModule;

    return { get: postProcess }

}

/**
 * NetSuite RESTlet function to retrieve paginated search results.
 * @param {Object} request - The incoming request containing offset and limit parameters.
 * @returns {string} - The JSON string containing search results and the total number of records.
 */
function postProcess(request) {
  // Load the saved search
  var savedSearch = search.load({ id: "customsearch284776" });
  var searchResultSet = savedSearch.run();

  // Determine offset and limit values from request
  var start = parseInt(request.offset) || 0;
  var limit = parseInt(request.limit) || 30;

  // Get the total number of records
  var totalRecords = 0;
  if (!request.totalRecords) {
    var totalRecordsSearch = search.create({
      type: savedSearch.searchType,
      filters: savedSearch.filters,
      columns: [search.createColumn({ name: 'internalid', summary: 'COUNT' })]
    }).run().getRange({ start: 0, end: 1 });
    totalRecords = totalRecordsSearch.length > 0 ? parseInt(totalRecordsSearch[0].getValue({ name: 'internalid', summary: 'COUNT' })) : 0;
  } else {
    totalRecords = parseInt(request.totalRecords);
  }
  
  // Retrieve the specific range of records
  var searchRecords = searchResultSet.getRange({ start: start, end: start + limit });

  // Convert search records to an array of JSON objects
  var results = searchRecords.map(function(record) {
    return record.toJSON(); // Assuming that records have toJSON or custom mapping function
  });
//............
  // Return both results and totalRecords in an object
  return JSON.stringify({
    results: results,
    totalRecords: totalRecords,
    offset: start,
    limit: limit
  });
}
