var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var Q = require('q');

mongoose.connect('mongodb://localhost/mudra');

var User = mongoose.Schema({
	username: {type: String, required: true, index: {unique: true}},
	hash: {type: String, required: true}
});

User = mongoose.model('User', User);

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

	create_auth_token(username, password).then(save_user, return_error);

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

	function return_error(err) {
		deferred.reject(err);
		callback({status: 'error', data: err});
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

	function return_error(err) {
		var payload = {status: 'error', data: err};
		deferred.reject(payload);
		callback(payload);
	}

	User.findOne({username: username}, function(err, user) {
		if (err) {
			return_error(err);
			return;
		}

		if (noe(user)) {
			return_error('No such user found');
			return;
		}

		bcrypt.compare(password, user.hash, function(err, result) {
			if (err) {
				return_error(err);
				return;
			}

			var payload = {status: 'success', data: user};

			if (result) {
				callback(payload);
				deferred.resolve(payload);
			} else {
				return_error('Password did not match');
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

	function return_error(err) {
		var payload = {status: 'error', data: err};
		deferred.reject(payload);
		callback(payload);
	}

	User.findOne({username: username}, function(err, user) {
		if (err) {
			return_error(err);
			return;
		}

		if (noe(user)) {
			return_error('No such user found');
			return;
		}

		if (user.hash === hash) {
			var payload = {status: 'success', data: 'authenticated'};
			deferred.resolve(payload);
			callback(payload);
			return;
		} else {
			var payload = 'User not authenticated';
			return_error(payload);
			return;
		}
	});

	return deferred.promise;
};

function create_auth_token(username, password) {
	var deferred = Q.defer();

    bcrypt.hash(password, 8, function (err, hash) {
        if (err) {
        	deferred.reject(err);
        	return false;
        }

        deferred.resolve(hash);
    });

	return deferred.promise;
}

function noe(i) {
	return [undefined, null, ''].indexOf(i) > -1;
}

exports.authenticate({username: 'nikhil.baliga@zovi.com', hash: '$2a$08$4Y7NNgKwZavoT8B.xy6RyuZPXOpxsitDNjq9nSlApRFh/ZAVL3WV2'}).then(function(d) {console.log(d)}, function(err) {console.log(err)});