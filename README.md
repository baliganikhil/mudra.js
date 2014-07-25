mudra.js
===

Mudra is a simple authentication and authorisation library for NodeJS that uses MongoDB for storing credentials.

###Installation
```
npm install mudra
```

##Usage
```
var mudra = require('mudra');
```

**Mudra functions support both callbacks and promises using Q**

___
###Authentication

####Register account

Example using Callback
```javascript
var params = {username: 'bill.gates@microsoft.com', password: 'microsoft', name: 'Bill Gates'};
mudra.register(params, function(response) {
   console.log(response);
});
```

Example using promises
```javascript
var params = {username: 'bill.gates@microsoft.com', password: 'microsoft', name: 'Bill Gates'};
mudra.register(params).then(success, error);

function success(response) {
   console.log('success: ', response);
}

function error(response) {
   console.error('Error: ', response);
}
```

####Login
```javascript
var params = {username: 'bill.gates@microsoft.com', password: 'microsoft'};
mudra.login(params, function(response) {
   console.log(response);
});
```

####Authenticate
```javascript
var params = {username: 'bill.gates@microsoft.com', hash: '$2a$08$4Y7NNgKwZavoT8B.xy6RyuZPXOpxsitDNjq9nSlApRFh/ZAVL3WV2'};
mudra.authenticate(params, function(response) {
   console.log(response);
});
```
___
###Authorisation


####Create Role
```javascript
var params = {role: 'admin'};
mudra.create_role(params, function(response) {
   console.log(response);
});
```

####Update Role (add or remove members)
```javascript
var params = {role: 'admin', users: [{username: 'bill.gates@microsoft', name: 'Bill Gates'}]};
mudra.update_roles(params, function(callback) {
   console.log(response);
});
```
####Create Permission
```javascript
var params = {permission: 'cancel_order'};
mudra.create_permission(params, function(response) {
   console.log(response);
});
```
####Update Permission (add or remove roles)
```javascript
var params = {permission: 'cancel_order', roles: ['admin']};
mudra.update_permission(params, function(callback) {
   console.log(response);
});
```
####Check if user has permission
```javascript
var params = {username: 'bill.gates@microsoft.com', hash: '$2a$08$4Y7NNgKwZavoT8B.xy6RyuZPXOpxsitDNjq9nSlApRFh/ZAVL3WV2', permission: 'cancel_order'};
mudra.check_permission(params, function(callback) {
   console.log(response);
});
```
###Contexts
For example, a project might require readonly privileges given to a certain group but edit privileges given to another group. Admins might get all privileges. You can add permissions by using contexts as follows
```javascript
var params = {
                "permission": "important_project",
                "roles": [
                    "admin"
                ],
                "context": [
                    {
                        "read": [
                            "read_group",
                            "edit_group"
                        ],
                        "edit": [
                            "edit_group"
                        ]
                    }
                ]
            };

mudra.update_permission(params, function(callback) {
   console.log(response);
});
```