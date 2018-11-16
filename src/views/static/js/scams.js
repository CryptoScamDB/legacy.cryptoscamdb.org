const MAX_RESULTS_PER_PAGE = 30;
let scams = [];

function loadStats() {
	console.log("Refreshing stats...");
	$.getJSON("https://api.cryptoscamdb.org/v1/stats", function(data) {
		const stats = data.result;
		$("body > div.stats-grid-frame > div > div.total-scams-value > div").html(stats.scams.toLocaleString('en-US'));
		$("body > div.stats-grid-frame > div > div.active-scams-value > div").html(stats.actives.toLocaleString('en-US'));
		$("body > div.stats-grid-frame > div > div.addresses-value > div").html(stats.addresses.toLocaleString('en-US'));
		$("body > div.stats-grid-frame > div > div.inactive-scams-value > div").html(stats.inactives.toLocaleString('en-US'));
		console.log("Refreshed stats!");
	});
}

function loadScams(callback) {
	$.getJSON("https://api.cryptoscamdb.org/v1/scams", function(data) {
		scams = data.result.reverse();
		callback();
	});
}

function filterScams() {
	if(query.coin) {
		scams = scams.filter(function(scam) {
			return scam.coin == query.coin;
		});
	}
	if(query.category) {
		scams = scams.filter(function(scam) {
			return scam.category == query.category;
		});
	}
	if(query.subcategory) {
		scams = scams.filter(function(scam) {
			return scam.subcategory == query.subcategory;
		});
	}
	if(query.status) {
		scams = scams.filter(function(scam) {
			return scam.status == query.status;
		});
	}
}

function sortScams() {
	if(sorting == "name") {
		scams.sort(function(a, b) {
			return (a.name || '').localeCompare(b.name || '')
		});
	} else if(sorting == "coin") {
		scams.sort(function(a, b) {
			return (a.coin || '').localeCompare(b.coin || '')
		});
	} else if(sorting == "category") {
		scams.sort(function(a, b) {
			return (a.category || '').localeCompare(b.category || '')
		});
	} else if(sorting == "subcategory") {
		scams.sort(function(a, b) {
			return (a.subcategory || '').localeCompare(b.subcategory || '')
		});
	} else if(sorting == "status") {
		scams.sort(function(a, b) {
			return (a.status || '').localeCompare(b.status || '')
		});
	}
}

function changePage(newPage) {
	page = newPage;
	if(sorting) {
		history.replaceState({},"",'/scams/' + page + '/' + sorting);
	} else {
		history.replaceState({},"",'/scams/' + page);
	}
	renderScams();
	renderPagination();
}

function changeSorting(newSorting) {
	sorting = newSorting;
	history.replaceState({},"",'/scams/' + page + '/' + sorting);
	sortScams();
	renderScams();
	renderPagination();
}

function renderScams() {
	$("tbody").html("");
	let index = [((page-1) * MAX_RESULTS_PER_PAGE),(page * MAX_RESULTS_PER_PAGE)];
	for (var i = index[0]; i < index[1]; i++) {
		const scam = scams[i];
		const row = $("<tr onclick=\"location.href='/scam/" + scam.id + "'\">");
		
		if(scam.name.length > 40) {
			row.append("<td>" + scam.name.substring(0, 40) + "...</td>");
		} else {
			row.append("<td>" + scam.name + "</td>");
		}
		
		if(scam.coin) {
			row.append("<td><div class='cat-container'><img src='/assets/coins/" + scam.coin + ".svg' alt='Icon - " + scam.coin + "' class='categoryicon cat-icon' style='height:24px; width:24px;' onerror='this.style.display=\"none\"' />  <span class='cat-text'>" + scam.coin + "</span></div></td>");
		} else {
			row.append("<td>None</td>");
		}
		
		if(scam.category) {
			row.append("<td><div class='cat-container'><img src='/assets/" + scam.category.toLowerCase().replace(/\s/g, "") + ".svg' alt='Icon - " + scam.category + "' class='categoryicon cat-icon' style='height:24px; width:24px;' onerror='this.style.display=\"none\"' />  <span class='cat-text'>" + scam.category + "</span></div></td>");
		} else {
			row.append("<td>None</td>");
		}
		
		if(scam.subcategory) {
			row.append("<td><img src='/assets/" + scam.subcategory.toLowerCase().replace(/\s/g, "") + ".svg' alt='Icon - " + scam.subcategory + "' class='subcategoryicon' style='height:24px; width:24px;' onerror='this.style.display=\"none\"' /> " + scam.subcategory + "</td>");
		} else {
			row.append("<td>None</td>");
		}
		
		if(scam.status && scam.status == "Active") {
			row.append("<td><div class='active status-container'><img src='/assets/symbols/exclamation.svg' alt='Icon - <%= scam.status %>' class='statusicon' style='height:11.5px; width:11.5px;' /> <span class='statustext'> Active </span></div></td>");
		} else if(scam.status && scam.status == "Inactive") {
			row.append("<td><div class='suspended status-container'><img src='/assets/symbols/check.svg' alt='Icon - <%= scam.status %>' class='statusicon' style='height:11.5px; width:11.5px;' /> <span class='statustext'> Inactive </span></div></td>");
		} else if(scam.status && scam.status == "Suspended") {
			row.append("<td><div class='suspended status-container'><img src='/assets/symbols/x.svg' alt='Icon - <%= scam.status %>' class='statusicon' style='height:11.5px; width:11.5px;' /> <span class='statustext'> Suspended </span></div></td>");
		} else if(scam.status && scam.status == "Offline") {
			row.append("<td><div class='offline status-container'><img src='/assets/symbols/check.svg' alt='Icon - <%= scam.status %>' class='statusicon' style='height:11.5px; width:11.5px;' /> <span class='statustext'> Offline </span></div></td>");
		} else {
			row.append("<td>Unknown</td>");
		}
		
		row.appendTo("tbody");
	}
}

function renderPagination() {
	let strPagination = "";
	let arrLoop = [-2, 3];

	if (page == 1) arrLoop = [0, 5];
	else if (page == 2) arrLoop = [-1, 4];

	if (page > 3) { 
		strPagination += "<a class='scams-nav-item' onclick='changePage(1)'> << </a>";
        strPagination += "<a class='scams-nav-item' onclick='changePage(" + Math.ceil(page - 1) + ")'> < </a>";
    }

    for (var i = arrLoop[0]; i < arrLoop[1]; i++) {
		const intPageNumber = page+i;
		let strItemClass = "scams-nav-item";
		if ((intPageNumber > (scams.length) / MAX_RESULTS_PER_PAGE) || (intPageNumber < 1)) {
			strItemClass = "disabled scams-nav-item";
		} else if (page == intPageNumber) {
			strItemClass = "active scams-nav-item";
		}
		strPagination += "<a onclick='changePage(" + intPageNumber + ")' class='" + strItemClass + "'>" + intPageNumber + "</a>";
	}
	
	if (page < Math.ceil(scams.length / MAX_RESULTS_PER_PAGE) - 3) {
        strPagination += "<a class='scams-nav-item' onclick='changePage(" + Math.ceil(page + 1) + ")'> > </a>";
		strPagination += "<a class='scams-nav-item' onclick='changePage(" + (Math.ceil(scams.length / MAX_RESULTS_PER_PAGE) - 1) + ")'> >> </a>";
	}
	
	$(".next-page").html(strPagination);
}

window.addEventListener("load", function() {
	loadStats();
	setInterval(loadStats,20*1000);
	loadScams(function() {
		filterScams();
		sortScams();
		renderScams();
		renderPagination();
	});
});