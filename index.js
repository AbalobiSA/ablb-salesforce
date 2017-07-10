/**
 * Created by Carl on 2017-05-24.
 */
let jsforce = require('jsforce');
let secrets;

try {
    secrets = require("../../secrets/secrets.js");
} catch (ex) {
    console.log("./secrets/secrets.js - Secrets file does not exist! Please copy this in before continuing.");
    process.exit();
}

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

module.exports = {
    query: createQuery,
    search: createSearch,
    update: update,
    createConnection: createConnection
};
