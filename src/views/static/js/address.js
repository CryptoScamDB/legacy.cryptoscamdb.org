window.addEventListener("load", function() {
	const address = $("h1").html();
    $.getJSON("https://api.cryptoscamdb.org/v1/check/" + encodeURIComponent(address), function(data) {
		if(data.result.status == "neutral") {
			$("#notice").html("<div class='ui mini brown message'><i class='warning sign icon'></i>This is an unclassified address. <br> This does not mean that it is safe. It simply means that it hasn't been classified.</div>");
		} else if(data.result.status == "blocked") {
			$("#notice").html("<div class='ui mini red message'><i class='warning sign icon'></i> Warning: Do not send money to this address</div>");
		} else if(data.result.status == "whitelisted") {
			$("#notice").html("<div class='ui mini green message'>This is a verified address</div>");
		}
		if(data.result.entries.length > 0) {
			const list = $("<ul class='ui bulleted list'></li>");
			data.result.entries.forEach(function(entry) {
				if(entry.type == "verified") {
					list.append("<li class='item'><a href='" + entry.url + "'>" + entry.name + "</a> (verified)</li>");
				} else {
					list.append("<li class='item'><a href='/scam/" + entry.id + "/'>" + entry.name + "</a></li>");
				}
			});
			$("#related-list").html(list);
			$("#related-count").html(" (" + data.result.entries.length + ")");
		} else {
			$("#related-list").html("<i>(none)</i>");
		}
        $.getJSON("https://api.cryptoscamdb.org/v1/balance/" + data.coin + "/" + encodeURIComponent(address), function(val) {
            $("#balance").html(val.balance.toFixed(2) + " " + data.coin.toUpperCase());
            $("#value").html("$"+ val.usdvalue.toFixed(2) + " ($" + (val.usdvalue / val.balance).toFixed(2) + " USD/" + data.coin.toUpperCase() + ")");
            $("#explorer").attr("href", val.blockexplorer);
        });
    });
});