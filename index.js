/**
 * Created by Carl on 2017-05-24.
 */
let jsforce = require('jsforce');
let RateLimiter = require('limiter').RateLimiter;
let secrets;

try {
    secrets = require("../../secrets/secrets.js");
} catch (ex) {
    console.log("./secrets/secrets.js - Secrets file does not exist! Please copy this in before continuing.");
    process.exit();
}

/**
 * Creates a manual connection to salesforce and passes back the connection
 * object in a callback
 * @param callback
 */
function createConnection(callback) {
    let conn = new jsforce.Connection();
    console.log("Salesforce: Logging in...");
    return new Promise((resolve, reject) => {

        // console.log("Salesforce: Logging in...");
        conn.login(secrets.SF_USER, secrets.SF_PASSWORD, function(err, res) {
            if (err) {
                reject(err);
            } else {
                console.log("Salesforce: Login Successful.\n");
                resolve(conn);
            }
        });
    });
}


/**
 * DEPRECATED - Use CreateConnection.then(conn => {conn.query() ... })
 * @param queryString
 * @param success
 * @param error
 */
function createQuery(queryString, success, error){
    let conn = new jsforce.Connection();

    console.log("Salesforce: Logging in...");
    conn.login(secrets.SF_USER, secrets.SF_PASSWORD, function(err, res) {
        if (err) {
            return console.error(err);
        }
        console.log("Salesforce: Login Successful.\n");
        // callback(connection, response);

        //'SELECT Id, FirstName, LastName, primary_community__c, FullPhotoUrl FROM User'
        console.log(`Salesforce: Querying query string: \n${queryString}`);
        conn.query(queryString, function(err, res) {
            if (err) {
                error(err);
                return console.error(err);
            }
            console.log("Salesforce: Query successful.");

            success(res);
        });
    });
}

function createSearch(queryString, success, error){
    let conn = new jsforce.Connection();

    conn.login(secrets.SF_USER, secrets.SF_PASSWORD, function(err, res) {
        if (err) {
            return console.error(err);
        }

        conn.search(queryString,
            function(err, res) {

                if (err) {
                    error(err);
                    return console.error(err);
                }
                // console.log(res);
                console.log(`RESPONSES RECEIVED: ${res.searchRecords.length}`);
                success(res);
            }
        );
    });
}



function update(table, updateobject, success, error) {
    let conn = new jsforce.Connection();
    conn.login(secrets.SF_USER, secrets.SF_PASSWORD, function(err, res) {
        if (err) {
            error(err);
            return console.error(err);
        }

        // Single record update
        conn.sobject(table).update(updateobject, function(err, ret) {
            if (err || !ret.success) {
                error(err);
                return console.error(err, ret);
            }
            else {
                success('Updated Successfully : ' + ret.id);
                console.log('Updated Successfully : ' + ret.id);
            }
        });

    });
}

/**
 * Takes an array of objects to insert into a Salesforce table.
 * @param conn - Connection passed into this function
 * @param sfObject - Table to insert objects into
 * @param data - Array of data to insert into table
 */
function createMultiple(conn, sfObject, data) {
    let limiter = new RateLimiter(1, 250);
    let splitData = splitArray(data);

    for (let i = 0; i < splitData.length; i++) {
        limiter.removeTokens(1, function() {
            conn.sobject(sfObject).create(splitData[i], (err, rets) => {
                if (err) { return console.error(err); }
                for (let i=0; i < rets.length; i++) {
                    if (rets[i].success) {
                        console.log("Created record id : " + rets[i].id);
                    }
                }
            })
        });
    }

    // Splits the array of data into chunks of 10
    function splitArray(array) {
        let i,j,temparray,chunk = 10;
        let newArray = [];
        for (i=0,j=array.length; i<j; i+=chunk) {
            temparray = array.slice(i,i+chunk);
            newArray.push(temparray);
        }
        return newArray;
    }
}


module.exports = {
    query: createQuery,
    search: createSearch,
    update: update,
    createConnection: createConnection,
    createMultiple: createMultiple
};
