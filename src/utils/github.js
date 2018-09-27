const request = require('request');
const download = require('download');
const crypto = require('crypto');
const config = require('./config');
const db = require('./db');
const debug = require('debug')('github');

/* Pull yaml files from Github repos to data/whitelist_urls.yaml and data/blacklist_urls.yaml */
const pullDataFiles = async () => {
	debug("Pulling data files...");
	await download("https://raw.githubusercontent.com/CryptoScamDB/whitelist/master/data/urls.yaml", "data", { filename: "whitelist_urls.yaml" });
	await download("https://raw.githubusercontent.com/CryptoScamDB/blacklist/master/data/urls.yaml", "data", { filename: "blacklist_urls.yaml" });
	debug("Done");
}

/* What to do on incoming Github webhook (new commit pushed) */
module.exports.webhook = async (req,res) => {
	if(!config.apiKeys.Github_WebHook) {
		debug("Warning: Incoming Github Webhook attempt - but no secret was found in config");
		res.status(403).end();
	} else if(!('x-hub-signature' in req.headers)) {
		debug("Warning: Incoming Github Webhook attempt without x-hub-signature header");
		res.status(403).end();
	} else {
		const githubSig = Buffer.from(req.headers['x-hub-signature']);
		const localSig = Buffer.from("sha1=" + crypto.createHmac("sha1", config.apiKeys.Github_WebHook).update(req.rawBody).digest("hex"));
		if(crypto.timingSafeEqual(githubSig,localSig)) {
			debug("Valid incoming Github webhook!");
				await pullDataFiles();
				await db.readEntries();
				await db.updateIndex();
				await db.persist();
			res.status(200).end();
		} else {
			debug("Warning: Invalid Github webhook attempt");
			res.status(403).end();
		}
	}
}

module.exports.pullRaw = pullDataFiles;

module.exports.pullData = async () => {
	await pullDataFiles();
	await db.readEntries();
	await db.updateIndex();
	await db.persist();
}