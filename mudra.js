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

User = mongoose.model('User', User);
Role = mongoose.model('Role', Role);

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

exports.update_role({role: 'admin', users: [{username: 'nikhil.baliga@zovi.com', name: 'Nikhil'}]}).
then(
		function(d) {console.log(d)},
		function(err) {console.log(err)}
	);