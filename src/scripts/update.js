process.env.UV_THREADPOOL_SIZE = 128;
const debug = require('debug')('update');
const path = require('path');
const Scam = require('../classes/scam.class');
const serialijse = require("serialijse");
const fs = require('fs-extra');
const config = require('../utils/config');

serialijse.declarePersistable(Scam);
if(!process.send) throw new Error("This script can only run as a child process");	/* Script must be called from another process */

process.once('close', () => process.exit(1));	/* Close if parent process exits */

(async () => {
	const cacheExists = await fs.pathExists('./cache.db');
	if(!cacheExists) throw new Error("No cache file found");
	const cacheFile = await fs.readFile('./cache.db','utf8');

	debug("Updating scams...");

	/* Update all scams which weren't updated recently */
	await Promise.all(serialijse.deserialize(cacheFile).scams.reverse().filter(scam => scam.howRecent() > config.interval.cacheExpiration).map(async scam => {
		if(config.lookups.HTTP.enabled) await scam.getStatus();			/* Update status */
		if(config.lookups.DNS.IP.enabled) await scam.getIP();			/* Update IP */
		if(config.lookups.DNS.NS.enabled) await scam.getNameservers();	/* Update nameservers */

		/* Return updated data to parent process */
		process.send({
			url: scam.url,
			name: scam.name,
			ip: scam.ip,
			nameservers: scam.nameservers,
			status: scam.status,
			statusCode: scam.statusCode,
			updated: Date.now()
		});
	}));

	debug("Done updating!");
})();
