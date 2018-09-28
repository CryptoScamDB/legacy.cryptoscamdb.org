const fs = require('fs-extra');
const yaml = require('js-yaml');
const url = require('url');
const path = require('path');
const config = require('./config');
const serialijse = require("serialijse");
const createDictionary = require('@cryptoscamdb/array-object-dictionary');
const Scam = require('../classes/scam.class');
const debug = require('debug')('db');

/* Declare Scam class for serialijse */
serialijse.declarePersistable(Scam);

/* Define empty database structure */
const db = {
	scams: [],
	verified: [],
	index: {
		featured: [],
		blacklist: [],
		whitelist: [],
		whitelistAddresses: [],
		addresses: [],
		ips: [],
		inactives: [],
		actives: []
	}
};

/* Read entries from yaml files and load them into DB object */
const readEntries = async () => {
	debug("Reading entries...");
	const scamsFile = await fs.readFile(path.join(__dirname, '../../data/blacklist_urls.yaml'),'utf8');
	const verifiedFile = await fs.readFile(path.join(__dirname, '../../data/whitelist_urls.yaml'),'utf8');
	const cacheExists = await fs.pathExists('./cache.db');
	if(!cacheExists) {
		yaml.safeLoad(scamsFile).map(entry => new Scam(entry)).forEach(entry => db.scams.push(entry));
		yaml.safeLoad(verifiedFile).forEach(entry => db.verified.push(entry));
	} else {
		const cacheFile = await fs.readFile('./cache.db','utf8');
		Object.assign(db,serialijse.deserialize(cacheFile));
		yaml.safeLoad(scamsFile).filter(entry => !db.scams.find(scam => scam.url == entry.url)).map(entry => new Scam(entry)).forEach(entry => db.scams.push(entry));
		yaml.safeLoad(verifiedFile).filter(entry => !db.verified.find(verified => verified.url == entry.url)).forEach(entry => db.verified.push(entry));
		yaml.safeLoad(scamsFile).forEach(entry => {
			var index = db.scams.indexOf(db.scams.find(scam => scam.url == entry.url))
			db.scams[index].category = entry.category;
			db.scams[index].subcategory = entry.subcategory;
            db.scams[index].description = entry.description;
            db.scams[index].reporter = entry.reporter;
            db.scams[index].coin = entry.coin;
		});
		yaml.safeLoad(verifiedFile).forEach(entry => {
			var index = db.verified.indexOf(db.verified.find(verified => verified.url == entry.url))
			db.verified[index].url = entry.url;
			db.verified[index].description = entry.description;
			if(entry.addresses) db.verified[index].addresses = entry.addresses;			
		});
	}
}

/* Create indexes for DB object */
const updateIndex = async () => {
	//debug("Updating index...");
	const scamDictionary = createDictionary(db.scams);
	const verifiedDictionary = createDictionary(db.verified);
	
	db.index.featured = db.verified.filter(entry => entry.featured).sort((a,b) => a.name.localeCompare(b.name));
	db.index.blacklist = [...db.scams.map(entry => entry.getHostname().replace('www.','')),...db.scams.map(entry => entry.getHostname().replace('www.','')),...Object.keys(scamDictionary.ip || {})];
	db.index.whitelist = [...db.verified.map(entry => url.parse(entry.url).hostname.replace('www.','')),...db.verified.map(entry => 'www.' + url.parse(entry.url).hostname.replace('www.',''))];
	db.index.whitelistAddresses = (verifiedDictionary.addresses || []);
	db.index.addresses = (scamDictionary.addresses || []);
	db.index.ips = (scamDictionary.ip || []);
	db.index.inactives = db.scams.filter(scam => scam.status !== 'Active');
	db.index.actives = db.scams.filter(scam => scam.status === 'Active');
}

/* Write DB on exit */
const exitHandler = () => {
	console.log("Cleaning up...");
	fs.writeFileSync('./cache.db',serialijse.serialize(db));
	console.log("Exited.");
}

module.exports.init = async () => {
	await readEntries();
	await updateIndex();
	await module.exports.persist();
	if(config.interval.databasePersist > 0) setInterval(module.exports.persist,config.interval.databasePersist);
	process.stdin.resume();
	process.once('beforeExit', exitHandler);
	process.once('SIGINT', exitHandler);
	process.once('SIGTERM', exitHandler);
}

module.exports.read = () => db;

module.exports.write = (url,data) => {
	const scam = db.scams.find(scam => scam.url == url);
	Object.keys(data).forEach(key => scam[key] = data[key]);
	updateIndex();
}

module.exports.persist = async () => {
	debug("Persisting cache...");
	await fs.writeFile('./cache.db',serialijse.serialize(db));
}

module.exports.exitHandler = exitHandler;

module.exports.readEntries = readEntries;

module.exports.updateIndex = updateIndex;