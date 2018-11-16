window.addEventListener("load", function() {
	const ip = $("h1").html();
	$.getJSON("https://api.cryptoscamdb.org/v1/ips", function(data) {
        const result = data.result;
		if(ip in result) {
			const list = $("<div class='ui bulleted list flex-cent'></div>");
			result[ip].forEach(function(entry) {
				list.append("<div class='item'><a href='/scam/" + entry.id + "/'>" + entry.name + "</div>");
			});
			$("#related-list").html(list);
			$("#related-count").html(" (" + result[ip].length + ")");
		} else {
			$("#related-list").html("<i>(none)</i>");
		}
    });
    $.getJSON("https://freegeoip.app/json/" + encodeURIComponent(ip), function(data) {
        flag = '<i class="' + data.country_code.toLowerCase() + ' flag"></i>';
        $("#location").html('<span>' + flag + data.country_name + '</span>');
        $("#map").html('<iframe width="100%" height="400px" frameborder="0" style="border:0" src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBw2MrKbJrjg6NYIq6kClIVvUx3vSj-a1s&q=' + data.latitude + ',' + data.longitude + '" allowfullscreen></iframe>');
    });
	setTimeout(function() {
		if($("#location").html() === "loading...") {
			$("#location").html("loading... <b>(This seems to be taking a long time, adblock might be blocking the HTTP request)</b>");
		}
	},2000);
});