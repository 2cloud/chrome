var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
if ('webkitIndexedDB' in window) {
	window.IDBTransaction = window.webkitIDBTransaction;
	window.IDBKeyRange = window.webkitIDBKeyRange;
}

twocloud.indexedDB = {};
twocloud.indexedDB.db = null;

twocloud.indexedDB.devices = {};
twocloud.indexedDB.links = {};
twocloud.indexedDB.messages = {};
twocloud.indexedDB.users = {};

twocloud.indexedDB.open = function(onSuccess, onError) {
	var request = indexedDB.open("twocloud");

	if (onSuccess == null) {
		onSuccess = function(){};
	}
	if (onError == null) {
		onError = function(error){
			console.log(error);
		};
	}
	
	request.onsuccess = function(e) {
		var v = "2";
		twocloud.indexedDB.db = e.target.result;
		var db = twocloud.indexedDB.db;
		// We can only create Object stores in a setVersion transaction;
		if (v!= db.version) {
			var setVrequest = db.setVersion(v);
	    
			// onsuccess is the only place we can create Object Stores
			setVrequest.onerror = onError;
			setVrequest.onsuccess = function(e) {
				if(db.objectStoreNames.contains("devices")) {
					db.deleteObjectStore("devices");
				}

				if(db.objectStoreNames.contains("links")) {
					db.deleteObjectStore("links");
				}

				if(db.objectStoreNames.contains("users")) {
					db.deleteObjectStore("users");
				}
				
				if(db.objectStoreNames.contains("messages")) {
					db.deleteObjectStore("messages");
				}
				
				var device_store = db.createObjectStore("devices", {
					keyPath: "slug"
				});

				var last_link_index = device_store.createIndex("last_link", "last_link");

				var link_store = db.createObjectStore("links", {
					keyPath: "id"
				});

				var user_store = db.createObjectStore("users", {
					keyPath: "username"
				});

				var message_store = db.createObjectStore("messages", {
					keyPath: "id"
				});

				onSuccess();
			};
		} else {
	    		onSuccess();
		}
	};
	request.onerror = onError;
}

twocloud.indexedDB.users.add = function(user, onSuccess, onError) {
	if(onSuccess == null) {
		onSuccess = function(){};
	}
	if(onError == null) {
		onError = function(error) {
			console.log(error);
		};
	}
	var db = twocloud.indexedDB.db;
	var trans = db.transaction(["users"], IDBTransaction.READ_WRITE);
	var store = trans.objectStore("users");

	var data = {
		"active": user.Active,
		"confirmed": user.Confirmed,
		"email": user.Email.Name + "@" + user.Email.Domain,
		"email_confirmed": user.Email.Confirmed,
		"admin": user.IsAdmin,
		"joined": new Date(user.Joined).getTime(),
		"last_active": new Date(user.LastActive).getTime(),
		"given_name": user.Name.Given,
		"family_name": user.Name.Family,
		"secret": user.Secret,
		"stripe_id": user.StripeID,
		"subscription_expiration": new Date(user.SubscriptionExpiration).getTime(),
		"username": user.Username.Display,
		"last_synced": new Date().getTime()
	};

	var request = store.put(data);

	request.onsuccess = function(e) {
		onSuccess();
	};

	request.onerror = function(e) {
		onError(e);
	};
};

twocloud.indexedDB.users.remove = function(username, onSuccess, onError) {
	if(onSuccess == null) {
		onSuccess = function(){};
	}
	if(onError == null) {
		onError = function(error) {
			console.log(error);
		};
	}
	var db = twocloud.indexedDB.db;
	var trans = db.transaction(["users"], IDBTransaction.READ_WRITE);
	var store = trans.objectStore("users");
	
	var request = store.delete(username);
	
	request.onsuccess = function(e) {
		onSuccess();
	};
	
	request.onerror = function(e) {
		onError(e)
	};
};

twocloud.indexedDB.users.list = function(onSuccess, onError) {
	if(onSuccess == null) {
		onSuccess = function(row){};
	}
	if(onError == null) {
		onError = function(error) {
			console.log(error);
		};
	}

	var db = twocloud.indexedDB.db;
	var trans = db.transaction(["users"], IDBTransaction.READ_WRITE);
	var store = trans.objectStore("users");
	
	// Get everything in the store;
	var keyRange = IDBKeyRange.lowerBound(0);
	var cursorRequest = store.openCursor(keyRange);
	
	cursorRequest.onsuccess = function(e) {
		var result = e.target.result;
		if(!!result == false)
			return;
		
		onSuccess(result.value);
		result.continue();
	};
	
	cursorRequest.onerror = onError;
};

twocloud.indexedDB.users.get = function(username, onSuccess, onError) {
	if(onSuccess == null) {
		onSuccess = function(user){};
	}
	if(onError == null) {
		onError = function(error) {
			console.log(error);
		};
	}

	var db = twocloud.indexedDB.db;
	var trans = db.transaction(["users"], IDBTransaction.READ_WRITE);
	var store = trans.objectStore("users");

	var request = store.get(username);

	request.onsuccess = function(e) {
		var result = e.target.result;
		return onSuccess(result);
	};

	request.onerror = onError;
};


twocloud.indexedDB.devices.add = function(device, onSuccess, onError) {
	if(onSuccess == null) {
		onSuccess = function(){};
	}
	if(onError == null) {
		onError = function(error) {
			console.log(error);
		};
	}
	var db = twocloud.indexedDB.db;
	var trans = db.transaction(["devices"], IDBTransaction.READ_WRITE);
	var store = trans.objectStore("devices");
	
	var data = {
		"slug": device.Slug,
		"name": device.Name,
		"platform": device.Platform,
		"last_link": new Date(device.LastLink).getTime(),
		"last_synced": new Date().getTime()
	};
	
	var request = store.put(data);
	
	request.onsuccess = function(e) {
		onSuccess(data);
	};
	
	request.onerror = function(e) {
		onError(e);
	};
};

twocloud.indexedDB.devices.remove = function(slug, onSuccess, onError) {
	if(onSuccess == null) {
		onSuccess = function(){};
	}
	if(onError == null) {
		onError = function(error) {
			console.log(error);
		};
	}
	var db = twocloud.indexedDB.db;
	var trans = db.transaction(["devices"], IDBTransaction.READ_WRITE);
	var store = trans.objectStore("devices");
	
	var request = store.delete(slug);
	
	request.onsuccess = function(e) {
		onSuccess();
	};
	
	request.onerror = function(e) {
		onError(e)
	};
};

twocloud.indexedDB.devices.clear = function(onSuccess, onError) {
	if(onSuccess == null) {
		onSuccess = function(){};
	}
	if(onError == null) {
		onError = function(e) {
			console.log(e);
		};
	}
	var db = twocloud.indexedDB.db;
	var trans = db.transaction(["devices"], IDBTransaction.READ_WRITE);
	var store = trans.objectStore("devices");
	var request = store.clear();

	request.onsuccess = function(e) {
		onSuccess();
	};

	request.onerror = function(e) {
		onError(e);
	};
};

twocloud.indexedDB.devices.list = function(sortByName, onSuccess, onError) {
	if(onSuccess == null) {
		onSuccess = function(row){};
	}
	if(onError == null) {
		onError = function(error) {
			console.log(error);
		};
	}

	var db = twocloud.indexedDB.db;
	var trans = db.transaction(["devices"], IDBTransaction.READ_WRITE);
	var store = trans.objectStore("devices");

	if(!sortByName) {
		var index = store.index("last_link");
		// Get everything in the store sorted by last_link;
		var cursorRequest = index.openCursor(null, 2);
	} else {
		var cursorRequest = store.openCursor();
	}
	
	cursorRequest.onsuccess = function(e) {
		var result = e.target.result;
		if(!!result == false)
			return;
		
		onSuccess(result.value);
		result.continue();
	};
	
	cursorRequest.onerror = onError;
};

twocloud.indexedDB.links.add = function(link, onSuccess, onError) {
	if(onSuccess == null) {
		onSuccess = function(){};
	}
	if(onError == null) {
		onError = function(error) {
			console.log(error);
		};
	}
	var db = twocloud.indexedDB.db;
	var trans = db.transaction(["links"], IDBTransaction.READ_WRITE);
	var store = trans.objectStore("links");

	var url = "";
	if(link.Link.EncryptedURL != "") {
		url = link.Link.EncryptedURL;
	} else {
		url = link.Link.URL.Scheme + "://" + link.Link.URL.Host + link.Link.URL.Path;
		if(link.Link.URL.RawQuery != "") {
			url += "?" + link.Link.URL.RawQuery;
		}
		if(link.Link.URL.Fragment != "") {
			url += "#" + link.Link.URL.Fragment;
		}
	}
	var data = {
		"comment": link.Comment,
		"destination": link.Destination,
		"id": link.Id,
		"encrypted": link.Link.Encrypted,
		"url": url,
		"unread": link.New,
		"origin": link.Origin,
		"sent": new Date(link.Sent).getTime(),
		"received": new Date(link.Received).getTime(),
		"last_synced": new Date().getTime()
	};

	var request = store.put(data);

	request.onsuccess = function(e) {
		onSuccess();
	};

	request.onerror = function(e) {
		onError(e);
	};
};

twocloud.indexedDB.links.remove = function(id, onSuccess, onError) {
	if(onSuccess == null) {
		onSuccess = function(){};
	}
	if(onError == null) {
		onError = function(error) {
			console.log(error);
		};
	}
	var db = twocloud.indexedDB.db;
	var trans = db.transaction(["links"], IDBTransaction.READ_WRITE);
	var store = trans.objectStore("links");
	
	var request = store.delete(id);
	
	request.onsuccess = function(e) {
		onSuccess();
	};
	
	request.onerror = function(e) {
		onError(e)
	};
};

twocloud.indexedDB.links.list = function(onSuccess, onError) {
	if(onSuccess == null) {
		onSuccess = function(row){};
	}
	if(onError == null) {
		onError = function(error) {
			console.log(error);
		};
	}

	var db = twocloud.indexedDB.db;
	var trans = db.transaction(["links"], IDBTransaction.READ_WRITE);
	var store = trans.objectStore("links");
	
	// Get everything in the store;
	var keyRange = IDBKeyRange.lowerBound(0);
	var cursorRequest = store.openCursor(keyRange);
	
	cursorRequest.onsuccess = function(e) {
		var result = e.target.result;
		if(!!result == false)
			return;
		
		onSuccess(result.value);
		result.continue();
	};
	
	cursorRequest.onerror = onError;
};

twocloud.indexedDB.init = function(onSuccess, onError) {
	twocloud.indexedDB.open(onSuccess, onError);
};
