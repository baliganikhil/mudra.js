var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var Q = require('q');

mongoose.connect('mongodb://localhost/mudra');

var User = mongoose.Schema({
	username: {type: String, required: true, index: {unique: true}},
	name: String,
	hash: {type: String, required: true}
});

var Role = mongoose.Schema({
	role: {type: String, required: true, index: {unique: true}},
	users: [{
				username: {type: String, required: true, index: {unique: true}},
				name: String
			}]
});

var Permission = mongoose.Schema({
	permission: {type: String, required: true, index: {unique: true}},
	roles: [{
				role: {type: String, required: true, index: {unique: true}},
			}]
});

User = mongoose.model('User', User);
Role = mongoose.model('Role', Role);
Permission = mongoose.model('Permission', Permission);

exports.register = function(payload, callback) {
	var deferred = Q.defer();

	if (noe(callback)) {
		callback = function() {};
	}

	var username = payload.username;
	var password = payload.password;

	if (noe(username) || noe(password)) {
		var payload = {status: 'error', message: 'Username and password are mandatory fields'};
		deferred.reject(payload);
		callback(payload);
		return deferred.promise;
	}

	create_auth_token(username, password).then(save_user, function(err) {
		return_error(err, deferred, callback);
	});

	function save_user(hash) {
		delete payload.password;
		payload.hash = hash;

		(new User(payload)).save(function(err, doc) {
			if (err) {
				deferred.reject(err);
				callback({status: 'error', data: doc});
				return false;
			}

			deferred.resolve(doc);
		});
	}

	return deferred.promise;
};

exports.login = function(payload, callback) {
	var deferred = Q.defer();

	if (noe(callback)) {
		callback = function() {};
	}

	var username = payload.username;
	var password = payload.password;

	User.findOne({username: username}, function(err, user) {
		if (err) {
			return_error(err, deferred, callback);
			return;
		}

		if (noe(user)) {
			return_error('No such user found', deferred, callback);
			return;
		}

		bcrypt.compare(password, user.hash, function(err, result) {
			if (err) {
				return_error(err, deferred, callback);
				return;
			}

			var payload = {status: 'success', data: user};

			if (result) {
				callback(payload);
				deferred.resolve(payload);
			} else {
				return_error('Password did not match', deferred, callback);
			}

		});
	});

	return deferred.promise;
};

exports.authenticate = function(payload, callback) {
	var deferred = Q.defer();

	if (noe(callback)) {
		callback = function() {};
	}

	var username = payload.username;
	var hash = payload.hash;

	User.findOne({username: username}, function(err, user) {
		if (err) {
			return_error(err, deferred, callback);
			return;
		}

		if (noe(user)) {
			return_error('No such user found', deferred, callback);
			return;
		}

		if (user.hash === hash) {
			var payload = {status: 'success', data: 'authenticated'};
			deferred.resolve(payload);
			callback(payload);
			return;
		} else {
			var payload = 'User not authenticated';
			return_error(payload, deferred, callback);
			return;
		}
	});

	return deferred.promise;
};

exports.create_role = function(params, callback) {
	var deferred = Q.defer();

	if (noe(callback)) {
		callback = function() {};
	}

	(new Role(params)).save(function(err, doc) {
        if (err) {
        	return_error(err, deferred, callback);
        	return false;
        }

        var payload = {status: 'success', data: doc};
        deferred.resolve(payload);
        callback(payload);
	});

	return deferred.promise;
};

exports.create_permission = function(params, callback) {
	var deferred = Q.defer();

	if (noe(callback)) {
		callback = function() {};
	}

	(new Permission(params)).save(function(err, doc) {
        if (err) {
        	return_error(err, deferred, callback);
        	return false;
        }

        var payload = {status: 'success', data: doc};
        deferred.resolve(payload);
        callback(payload);
	});

	return deferred.promise;
};

exports.update_role = function(params, callback) {
	var deferred = Q.defer();

	if (noe(callback)) {
		callback = function() {};
	}

	var role = params.role;

	Role.findOne({role: role}, function(err, role) {
		if (err) {
        	return_error(err, deferred, callback);
        	return false;
        }

        if (noe(role)) {
			return_error('No such role found', deferred, callback);
			return;
		}

		role = JSON.parse(JSON.stringify(role));
        role.users = params.users;
        delete role._id;

        Role.findOneAndUpdate({role: role.role}, role, function(err) {
	        if (err) {
	        	return_error(err, deferred, callback);
	        	return false;
	        }

        	var payload = {status: 'success', data: role};
	        deferred.resolve(payload);
	        callback(payload);
        });
	});

	return deferred.promise;
};

exports.update_permission = function(params, callback) {
	var deferred = Q.defer();

	if (noe(callback)) {
		callback = function() {};
	}

	var permission = params.permission;

	Permission.findOne({permission: permission}, function(err, permission) {
		if (err) {
        	return_error(err, deferred, callback);
        	return false;
        }

        if (noe(permission)) {
			return_error('No such permission found', deferred, callback);
			return;
		}

		permission = JSON.parse(JSON.stringify(permission));
        permission.roles = params.roles;
        delete permission._id;

        Permission.findOneAndUpdate({permission: permission.permission}, permission, function(err) {
	        if (err) {
	        	return_error(err, deferred, callback);
	        	return false;
	        }

        	var payload = {status: 'success', data: permission};
	        deferred.resolve(payload);
	        callback(payload);
        });
	});

	return deferred.promise;
};

exports.check_permission = function(params, callback) {
	var deferred = Q.defer();

	if (noe(callback)) {
		callback = function() {};
	}

	exports.authenticate(params).then(
		function() {
			var permission = params.permission;
			var username = params.username;

			Role.find({"users.username": username}, {role: 1, _id: 0}, function(err, docs) {
		        if (err) {
		        	return_error(err, deferred, callback);
		        	return false;
		        }

		        var roles = [];
		        docs.forEach(function(role) {
		        	roles.push(role.role);
		        });

				Permission.findOne({permission: permission, "roles.role": {'$in': roles}}, function(err, doc) {
			        if (err) {
			        	return_error(err, deferred, callback);
			        	return false;
			        }

			        if (doc === null) {
			        	return_error('Unauthorised', deferred, callback);
			        	return;
			        }

			        var payload = {status: 'success', data: 'Authorised'};
			        deferred.resolve(payload);
			        callback(payload);


				});
			});

		},

		function(err) {
	       	return_error(err, deferred, callback);
		});

	return deferred.promise;
};

function create_auth_token(username, password) {
	var deferred = Q.defer();

    bcrypt.hash(password, 8, function (err, hash) {
        if (err) {
        	return_error(err, deferred, callback);
        	return false;
        }

        deferred.resolve(hash);
    });

	return deferred.promise;
}

function return_error(err, deferred, callback) {
	var payload = {status: 'error', data: err};
	deferred.reject(payload);
	callback(payload);
}

function noe(i) {
	return [undefined, null, ''].indexOf(i) > -1;
}