var twocloud = {};
twocloud.links = {};
twocloud.sessions = {};
twocloud.users = {};
twocloud.devices = {};
twocloud.messages = {};
twocloud.auth = {
        "username": null,
        "secret": null
};
twocloud.hosts = {
        "api": "http://api.2cloud.org",
        "tinkerbell": "http://tink1.2cloud.org",
        "bootstrap": "http://bessie.2cloud.org"
};
twocloud.config = {};
twocloud.config.values = {};
twocloud.config.get = function(key) {
        if(!key in twocloud.config.values) {
                return null;
        }
        return twocloud.config.values[key];
};

twocloud._request = function(method, url, body, callback) {
        parsed_callback = function(data, textStatus, jqXHR) {
                try {
                        data = JSON.parse(data);
                        callback(data, textStatus, jqXHR);
                } catch(e) {
                        callback(data, "error", jqXHR);
                }
        };
        parsed_error_callback = function(jqXHR, textStatus, errorThrown) {
                try {
                        jqXHR.responseText = JSON.parse(jqXHR.responseText);
                        callback(jqXHR.responseText, textStatus, jqXHR);
                } catch(e) {
                        callback(jqXHR.responseText, textStatus, jqXHR);
                }
        };
        headers = {
                "X-2cloud-Username": twocloud.auth.username,
                "X-2cloud-Secret": twocloud.auth.secret
        };
        if(url.substr(0,1) == "/") {
                url = twocloud.hosts.api + url;
        }
        $.ajax({
                url: url,
                data: body,
                success: parsed_callback,
                error: parsed_error_callback,
                type: method,
                headers: headers,
                dataType: "text"
        });
};

twocloud._get = function(url, params, callback) {
        paramstring = "?";
        for(var key in params) {
                paramstring += escape(key) + "=" + escape(params[key]) + "&";
        }
        paramstring = paramstring.replace(/&$/g, '');
        twocloud._request("GET", url+paramstring, null, callback);
};

twocloud._post = function(url, body, callback) {
        twocloud._request("POST", url, body, callback);
};

twocloud._put = function(url, body, callback) {
        twocloud._request("PUT", url, body, callback);
};

twocloud._delete = function(url, callback) {
        twocloud._request("DELETE", url, null, callback);
};

twocloud.config.sync = function(callback, attempt) {
        if(attempt == null) {
                attempt = 0;
        }
        if(attempt < 5) {
                console.log("Config sync attempt #" + (attempt + 1));
                twocloud._get(twocloud.hosts.bootstrap + "/config.json", {}, function(data, textStatus, jqXHR) {
                        if(jqXHR.status < 400 || jqXHR.status >= 200) {
                                twocloud.config.values = data;
                                twocloud.hosts.api = twocloud.config.values.api_endpoint;
                                twocloud.hosts.tinkerbell = twocloud.config.values.websocket_endpoint;
                                callback(true);
                        } else {
                                twocloud.config.sync(callback, attempt++);
                        }
                });
        } else {
                callback(false);
        }
};


twocloud.links.list = function(user, device, status, role, limit, callback) {
        params = {};
        params["status"] = status;
        params["role"] = role;
        if(limit != null && limit != -1) {
                params["limit"] = limit;
        }
        twocloud._get("/users/" + user + "/devices/" + device + "/links", params, callback);
};

twocloud.links.unread = function(user, device, limit, callback) {
        twocloud.links.list(user, device, "unread", "receiver", limit, callback);
};

twocloud.links.send = function(user, device, url, comment, origin, source, encrypted, read, callback) {
        params = {};
        params["url"] = url;
        params["origin"] = origin;
        params["source"] = source;
        if(comment != null && comment != "") {
                params["comment"] = comment;
        }
        params["encrypted"] = encrypted;
        params["read"] = read;
        twocloud._post("/users/" + user + "/devices/" + device + "/links", JSON.stringify(params), callback);
}

twocloud.links.update = function(user, device, link, comment, read, callback) {
        params = {};
        if(comment != null) {
                params["comment"] = comment;
        }
        if(read != null) {
                params["read"] = read;
                params["mark_read"] = true;
        }
        twocloud._put("/users/" + user + "/devices/" + device + "/links/" + link, JSON.stringify(params), callback);
};

twocloud.links.mark_read = function(user, device, link, callback) {
        twocloud.links.update(user, device, link, null, true, callback);
};

// TODO: Not implemented in API yet
twocloud.links.remove = function(user, device, link, callback) {
};

twocloud.sessions.url = function(callback_url) {
        url = twocloud.hosts.api + "/sessions?callback=" + escape(callback_url);
        return url;
};

twocloud.users.create = function(identifier, username, email, given_name, family_name, stripe_token, callback) {
	url = "/users";
	data = {};
	data["id"] = identifier;
	data["username"] = username;
	data["email"] = email;
	if(stripe_token != null) {
		data["stripe_token"] = stripe_token;
	}
	if(given_name == null) {
		given_name = "";
	}
	if(family_name == null) {
		family_name = "";
	}
	data["given_name"] = given_name;
	data["family_name"] = family_name;
	data = JSON.stringify(data);
	twocloud._post(url, data, callback);
};

twocloud.users.get = function(username, callback) {
	twocloud._get("/users/" + username, null, callback);
};

twocloud.users.update = function(username, email, reset_secret, given_name, family_name, admin, email_verification, stripe_token, callback) {
	url = "/users/" + username;
	params = {};
	if(email != null) {
		params["email"] = email;
	}
	if(reset_secret) {
		params["reset_secret"] = reset_secret;
	}
	if(given_name != null) {
		params["given_name"] = given_name;
	}
	if(family_name != null) {
		params["family_name"] = family_name;
	}
	if(admin != null) {
		params["is_admin"] = admin;
		params["update_admin"] = true;
	}
	if(email_verification != null) {
		params["email_verification"] = email_verification;
	}
	if(stripe_token != null) {
		params["stripe_token"] = stripe_token;
	}
	params = JSON.stringify(params);
	twocloud._put(url, params, callback);
};

twocloud.users.verify_email = function(username, code, callback) {
        twocloud.users.update(username, null, false, null, null, null, code, null, callback);
};

twocloud.users.reset_secret = function(username, callback) {
        twocloud.users.update(username, null, true, null, null, null, null, null, callback);
};

twocloud.users.make_admin = function(username, callback) {
        twocloud.users.update(username, null, false, null, null, true, null, null, callback);
};

// TODO: Not implemented in API yet
twocloud.users.remove = function(username, callback) {
};

twocloud.users.welcome = function(username, message, callback) {
	url = "/users/" + username + "/welcome";
	params = {
		"message": message
	};
	params = JSON.stringify(params);
	twocloud._post(url, params, callback);
};

twocloud.devices.add = function(username, name, platform, callback) {
	url = "/users/" + username + "/devices";
	data = {};
	data["platform"] = platform;
	data["name"] = name;
	data = JSON.stringify(data);
	twocloud._post(url, data, callback);
};

twocloud.devices.list = function(username, callback) {
	twocloud._get("/users/" + username + "/devices", {}, callback);
};

twocloud.devices.get = function(username, device, callback) {
	twocloud._get("/users/" + username + "/devices/" + device, {}, callback);
};

twocloud.devices.update = function(username, device, name, platform, callback) {
	url = "/users/" + username + "/devices/" + device;
	data = {};
	if(name != null) {
		data["name"] = name;
	}
	if(platform != null) {
		data["platform"] = platform;
	}
	data = JSON.stringify(data);
	twocloud._put(url, data, callback);
};

// TODO: Not implemented in API yet
twocloud.devices.remove = function(username, device, callback) {
};

// TODO: Not implemented in API yet
twocloud.messages.list = function(username, callback) {
};

// TODO: Not implemented in API yet
twocloud.messages.send = function(username, body, persistent, callback) {
};

// TODO: Not implemented in API yet
twocloud.messages.broadcast = function(body, persistent, callback) {
};

// TODO: Not implemented in API yet
twocloud.messages.remove = function(username, message, callback) {
};
