var acl = require('acl');

// create a redis backend
var client = require('redis').createClient(27017, 'localhost', {no_ready_check: true});

// initialize acl system storing data in the redis backend
acl = new acl(new acl.redisBackend(client, "acl_"));

/* now assign permissions to roles */

// allow students to view projects
acl.allow('student', 'project', 'view');


// allow administrators to perform any action on posts
acl.allow('lecturer', 'project', '*');