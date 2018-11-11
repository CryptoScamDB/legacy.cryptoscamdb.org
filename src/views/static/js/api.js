window.addEventListener("load", function() {
	$.getJSON("https://api.cryptoscamdb.org/v1/check/0xDaa29859836D97C810c7F9D350D4A1B3E8CafC9a",function(data) {
		$(".check.lds-dual-ring").remove();
		$("#check_segment").css("overflow","scroll");
		$(".check_response").html(JSON.stringify(data, null, 2));
	});
	$.getJSON("https://api.cryptoscamdb.org/v1/scams/",function(data) {
		$(".scams.lds-dual-ring").remove();
		$("#scams_segment").css("overflow","scroll");
		$(".scams_response").html(JSON.stringify(data, null, 2));
	});
	$.getJSON("https://api.cryptoscamdb.org/v1/addresses/",function(data) {
		$(".addresses.lds-dual-ring").remove();
		$("#addresses_segment").css("overflow","scroll");
		$(".addresses_response").html(JSON.stringify(data, null, 2));
	});
	$.getJSON("https://api.cryptoscamdb.org/v1/ips/",function(data) {
		$(".ips.lds-dual-ring").remove();
		$("#ips_segment").css("overflow","scroll");
		$(".ips_response").html(JSON.stringify(data, null, 2));
	});
	$.getJSON("https://api.cryptoscamdb.org/v1/verified/",function(data) {
		$(".verified.lds-dual-ring").remove();
		$("#verified_segment").css("overflow","scroll");
		$(".verified_response").html(JSON.stringify(data, null, 2));
	});
	$.getJSON("https://cdn.cryptoscamdb.org/blacklist/urls.json",function(data) {
		$(".raw.lds-dual-ring").remove();
		$("#raw_segment").css("overflow","scroll");
		$(".raw_response").html(JSON.stringify(data, null, 2));
	});
});
