let hideCopiedMessageTimeout = false;

function copyToClipboard(element) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($(element).text()).select();
    document.execCommand("copy");
    $temp.remove();
}

function copiedAnimation() {
	$('.donation-address-copied').animate({opacity: 1}, 500);
	if(hideCopiedMessageTimeout) {
		clearTimeout(hideCopiedMessageTimeout);
	}
	hideCopiedMessageTimeout = setTimeout(function() {
		$('.donation-address-copied').animate({opacity: 0}, 500);
	},3000);
}

$(".donate-btn-grid.ethereum").click(function() {
	copyToClipboard(document.getElementById("donation-address-ethereum"));
	copiedAnimation();
});
$(".donate-btn-grid.bitcoin").click(function() {
	copyToClipboard(document.getElementById("donation-address-bitcoin"));
	copiedAnimation();
});
$(".donate-btn-grid.monero").click(function() {
	copyToClipboard(document.getElementById("donation-address-monero"));
	copiedAnimation();
});
$(".donate-btn-grid.bitcoincash").click(function() {
	copyToClipboard(document.getElementById("donation-address-bitcoincash"));
	copiedAnimation();
});