function getParameterByName(name)
{
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.search);
  if(results == null)
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}

var bg = chrome.extension.getBackgroundPage();

var registered = getParameterByName("registered");
if(registered == "true") {
	bg.twocloud.auth.username = unescape(getParameterByName("username"));
	bg.twocloud.auth.secret = unescape(getParameterByName("secret"));
	bg.twocloud.users.get(bg.twocloud.auth.username,
		function(data, textStatus, jqXHR) {
			if(textStatus == "error") {
				console.log(data);
				// TODO: Handle error
				return
			}
			bg.twocloud.indexedDB.users.add(data.data, function() {
				localStorage["username"] = bg.twocloud.auth.username;
				localStorage["setup"] = true;
			}, function(error) {
				console.log(error);
				// TODO: Handle error
				return
			});
		});
} else {
	alert("Not registered. Implement this later.");
}
