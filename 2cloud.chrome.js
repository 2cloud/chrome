twocloud.chrome = {};
twocloud.chrome.icon = {}
twocloud.chrome.devices = {};

twocloud.chrome.icon.auth_error = function() {
	chrome.browserAction.setIcon({
		"path": "images/error.png"
	});
	chrome.browserAction.setTitle({"title": "Please log in."});
	chrome.browserAction.setPopup({"popup": "browser_actions/auth.html"});
};

twocloud.chrome.devices.sync = function(user, onSuccess, onError) {
	if(onSuccess == null) {
		onSuccess = function() {};
	}
	if(onError == null) {
		onError = function(e) {
			console.log(e);
		};
	}
	twocloud.devices.list(user, function(data, textStatus, jqXHR) {
		if(textStatus == "error") {
			onError(data);
			return
		}
		var devices = data.data;
		twocloud.indexedDB.devices.clear(function() {
			twocloud.context.clear();
			for(var i=0; i < devices.length; i++) {
				twocloud.indexedDB.devices.add(devices[i], function(device) {
					var added_device = device;
					if(i == devices.length) {
						twocloud.indexedDB.devices.list(false, function(index_device) {
							twocloud.context.addDevice(index_device);
							if(index_device.slug == added_device.slug) {
								return onSuccess();
							}
						}, onError);
					}
				}, onError);
			}
		}, onError);
	});
};

twocloud.indexedDB.init(function() {
	twocloud.context.init();
	if(twocloud.auth.username != null && twocloud.auth.secret != null) {
		twocloud.chrome.devices.sync(twocloud.auth.username);
	} else {
		twocloud.chrome.icon.auth_error();
	}
});
