window.addEventListener("load", function() {
    $.getJSON("https://api.cryptoscamdb.org/v1/check/" + $("h1").html(), function(data) {
        $.getJSON("https://api.cryptoscamdb.org/v1/balance/" + data.coin + "/" + $("h1").html(), function(val) {
            $("#balance").html(val.balance.toFixed(2) + " " + data.coin.toUpperCase());
            $("#value").html("$"+ val.usdvalue.toFixed(2) + " ($" + (val.usdvalue / val.balance).toFixed(2) + " USD/" + data.coin.toUpperCase() + ")");
            $("#explorer").attr("href", val.blockexplorer);
        });
    });
});