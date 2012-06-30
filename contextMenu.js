twocloud.context = {};
twocloud.context.map = {};

twocloud.context.callback = function(info, tab) {
	if(twocloud.auth.username == null || twocloud.auth.secret == null) {
		alert("Ooops. You need to log in before you can send links.");
		return;
	} else {
		twocloud.links.send(twocloud.auth.username, twocloud.context.map[info.menuItemId].slug, info.linkUrl, null, "chrome", "chrome/context_menu", false, false, function(data, textStatus, jqXHR) {
			if(textStatus == "error") {
				console.log(data);
				console.log(jqXHR);
			}
		});
	}
};

twocloud.context.addDevice = function(device) {
	for(id in twocloud.context.map) {
		if(twocloud.context.map[id].slug == device.slug) {
			return twocloud.context.updateDevice(device);
		}
	}
	id = chrome.contextMenus.create({
		"title": device.name,
		"contexts": ["link"],
		"parentId": twocloud.context.root,
		"onclick": twocloud.context.callback
	});
	twocloud.context.map[id] = device;
};

twocloud.context.removeDevice = function(device) {
	for(id in twocloud.context.map) {
		if(twocloud.context.map[id].slug == device.slug) {
			chrome.contextMenus.remove(parseInt(id));
			delete twocloud.context.map[id];
			break;
		}
	}
};

twocloud.context.updateDevice = function(device) {
	for(id in twocloud.context.map) {
		if(twocloud.context.map[id].slug == device.slug) {
			chrome.contextMenus.update(parseInt(id), {
				"title": device.name
			});
			break;
		}
	}
};

twocloud.context.init = function() {
	twocloud.context.root = chrome.contextMenus.create({
		"title": "Send With 2cloud",
		"contexts": ["link"]
	});
	twocloud.indexedDB.devices.list(false, function(device) { twocloud.context.addDevice(device); });
};
