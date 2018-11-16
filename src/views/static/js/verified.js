window.addEventListener("load", function() {
	$.getJSON("https://api.cryptoscamdb.org/v1/featured", function(data) {
		const featured = data.result.sort(function(a, b) {
			return a.name.localeCompare(b.name);
		});
		featured.forEach(function(entry) {
			const row = $("<tr onclick=\"location.href='/domain/" + $('<a>').prop('href', entry.url).prop('hostname') + "'\">");
			row.append("<td><div class='featured-name'><img class='project-icon' src='/assets/" + entry.name.toLowerCase().replace(/ /g, "") + "'>" + entry.name + "</div></td>");
			row.append("<td class='featured-url'><a target='_blank' href='" + entry.url + "'>" + entry.url + "</a></td>");
			row.append("<td class='featured-description'>" + (entry.description || '') + "</td>");
			row.appendTo("tbody");
		});
	});
});