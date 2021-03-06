'use strict';

var path = {};
path.join = require('url-join');

//Require dependencies
var express = require('express'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    config = require('./config/config'),
    database = require('./database/database'),
    swaggerTools = require('swagger-tools'),
    fs = require('fs'),
    jsyaml = require('js-yaml');

//add configuration
config.addConfiguration(path.join(__dirname, '/../app-configuration.yaml'));

//Require controllers
var groupsControllers = require('./controllers/groups-controllers'),
    tokensControllers = require('./controllers/tokens-controllers'),
    auth = require('./auth/auth');

//create express app
var app = express();
//add utilities middelwares
app.use(bodyParser.json());
app.use(cors());

/******************
 * PUBLIC FILES
 ******************/
app.use('/api/v1/auth/authorize', function (req, res) {
    res.redirect('https://dani8art.eu.auth0.com/authorize?client_id=' + req.query.client_id + '&response_type=' + req.query.response_type + '&redirect_uri=' + req.query.redirect_uri);
});
app.use('/', express.static('./public'));

/*****************************
 *  API ENDPOINT DEFINITIONS
 *****************************/
var apiBase = config.api.basePath;



/**
 *  GET ../groups
 *  
 *  query params:
 *    - search
 *    - limit
 *    - page
 */
app.get(path.join(apiBase, 'groups'), auth.authmiddelware, groupsControllers.getAll);

/**
 *  GET ../groups/:id
 * 
 * 
 *  query params: []
 */
app.get(path.join(apiBase, 'groups/:id'), auth.authmiddelware, groupsControllers.getOneById);

/**
 *  POST ../groups
 * 
 *  body: {
 *     "name": "ISA",
 *     "description": "Applied Software Engineering",
 *     "members": ["Pablo F.", "Antonio R."]
 *  }
 */
app.post(path.join(apiBase, 'groups'), auth.authmiddelware, groupsControllers.create);

/**
 *  PUT ../groups/:id
 *  
 *  body: {
 *     "name": "ISA",
 *     "description": "Applied Software Engineering",
 *     "members": ["Pablo F.", "Antonio R."]
 *  }
 */
app.put(path.join(apiBase, 'groups/:id'), auth.authmiddelware, groupsControllers.update);

/**
 *  DELETE ../groups
 */
app.delete(path.join(apiBase, 'groups'), auth.authmiddelware, groupsControllers.deleteAll);

/**
 *  DELETE ../groups/:id
 * 
 */
app.delete(path.join(apiBase, 'groups/:id'), auth.authmiddelware, groupsControllers.deleteOne);

/**
 *  GET ../stats/groups/count
 * 
 */
app.get(path.join(apiBase, 'stats/groups/count'), auth.authmiddelware, groupsControllers.count);

/**
 *  GET ../tokens/github
 *  
 *  query params:
 *    - clientId
 */
app.get(path.join(apiBase, 'tokens/github'), tokensControllers.getGitHub);

var swaggerDefinition = jsyaml.safeLoad(fs.readFileSync('./src/api/swagger.yaml'));
swaggerTools.initializeMiddleware(swaggerDefinition, function (middleware) {
    app.use(middleware.swaggerUi({
        apiDocs: swaggerDefinition.basePath + '/api-docs',
        swaggerUi: swaggerDefinition.basePath + '/docs'
    }));
});
//START APP
var port = process.env.PORT || config.port;

var server;
module.exports.deploy = function (callback) {
    database.connect(function (err) {
        if (!err) {
            server = app.listen(port, function (exErr) {
                if (exErr) {
                    console.log('Error with express ' + exErr.toString());
                } else {
                    console.log('Groups API is running on http://localhost:%s' + apiBase, port);
                    console.log('Groups UI is running on http://localhost:%s', port);
                    callback();
                }
            });
        } else {
            console.log('Error with database connection ' + err.toString());
            callback(err);
        }
    });
};

module.exports.undeploy = function (callback) {
    server.close(callback);
};