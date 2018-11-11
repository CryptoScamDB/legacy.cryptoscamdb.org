'use strict';

import * as Debug from 'debug';
import * as express from 'express';
import * as path from 'path';
import config from './utils/config';
import writeConfig from './utils/writeConfig';
import * as fs from 'fs';
import * as url from 'url';
import * as helmet from 'helmet';
import * as isIpPrivate from 'private-ip';
import * as checkForPhishing from 'eth-phishing-detect';
import * as dateFormat from 'dateformat';
import createDictionary from '@cryptoscamdb/array-object-dictionary';
import { getGoogleSafeBrowsing, getURLScan, getVirusTotal } from './utils/lookup';
import * as request from 'request-promise-native';

const debug = Debug('app');
const app = express();

export const serve = async (): Promise<void> => {
    /* Allow both JSON and URL encoded bodies */
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    /* Set security headers */
    app.use(helmet());
    app.use(helmet.referrerPolicy());

    /* Set EJS config */
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views/pages'));

    app.locals.announcement = config.announcement;

    /* Compress pages */
    app.use(require('compression')());

    /* Serve static content*/
    app.use(express.static(path.join(__dirname, 'views/static')));

    /* Seperately re-serve various other brand logos to flatten nested paths */
    app.use('/assets', express.static(path.join(__dirname, 'views/static/assets/coins')));
    app.use('/assets', express.static(path.join(__dirname, 'views/static/assets/exchanges')));
    app.use('/assets', express.static(path.join(__dirname, 'views/static/assets/explorers')));
    app.use('/assets', express.static(path.join(__dirname, 'views/static/assets/wallets')));
    app.use('/assets', express.static(path.join(__dirname, 'views/static/assets/favicon')));
    app.use('/assets', express.static(path.join(__dirname, 'views/static/assets/branding')));
    app.use('/assets', express.static(path.join(__dirname, 'views/static/assets/symbols')));

    /* Configuration middleware */
    app.use(async (req, res, next) => {
        const { NODE_ENV } = process.env;
        if (!config.manual && req.path !== '/config/' && NODE_ENV === 'development') {
            res.render('config', { production: false, done: false });
        } else if (!config.manual && req.path !== '/config/' && NODE_ENV === 'production') {
            res.render('config', { production: true, done: false });
        } else if (
            req.path === '/config' &&
            (req.method !== 'POST' || !req.body || config.manual)
        ) {
            res.status(403).end();
        } else if (req.path === '/config/' && req.method === 'POST' && !config.manual) {
            await writeConfig(req.body);
            res.render('config', { production: false, done: true });
        } else {
            next();
        }
    });

    /* Homepage */
    app.get('/(/|index.html)?', (req, res) => res.render('index'));

    /* FAQ page */
    app.get('/faq/', (req, res) => res.render('faq'));

    /* Donate page */
    app.get('/donate/', (req, res) => res.render('donate'));

    /* API documentation page */
    app.get('/api/', (req, res) => res.render('api'));

    /* Report pages */
    app.get('/report/', (req, res) => res.render('report'));

    app.get('/report/domain/:domain?', (req, res) =>
        res.render('report', {
            domain: req.params.domain || true
        })
    );

    app.get('/report/address/:address?', (req, res) =>
        res.render('report', {
            address: req.params.address || true
        })
    );

    /* IP pages */
    app.get('/ip/:ip', async (req, res) => {
        await res.render('ip', {
            ip: req.params.ip,
            isPrivate: isIpPrivate(req.params.ip),
            related:
                (await request('https://api.cryptoscamdb.org/v1/ips', { json: true })).result[
                    req.params.ip
                ] || []
        });
    });

    /* Address pages */
    app.get('/address/:address', async (req, res) => {
        const addresses = (await request('https://api.cryptoscamdb.org/v1/addresses', {
            json: true
        })).result;
        const whitelistAddresses = createDictionary(
            (await request('https://api.cryptoscamdb.org/v1/verified', { json: true })).result
        ).addresses;
        if (whitelistAddresses[req.params.address]) {
            res.render('address', {
                address: req.params.address,
                related: whitelistAddresses[req.params.address],
                type: 'verified'
            });
        } else if (addresses[req.params.address]) {
            res.render('address', {
                address: req.params.address,
                related: addresses[req.params.address] || [],
                type: 'scam'
            });
        } else {
            res.render('address', {
                address: req.params.address,
                related: addresses[req.params.address] || [],
                type: 'neutral'
            });
        }
    });

    /* Scams index */
    app.get('/scams/:page?/:sorting?/', async (req, res) => {
        const fullScams = (await request('https://api.cryptoscamdb.org/v1/scams', {
            json: true
        })).result
            .filter(scam => scam.url)
            .map(scam => {
                scam.hostname = url.parse(scam.url).hostname;
                return scam;
            });
        const fullAddresses = (await request('https://api.cryptoscamdb.org/v1/addresses', {
            json: true
        })).result;

        const MAX_RESULTS_PER_PAGE = 30;
        const scamList = [];
        let scams = [...fullScams].reverse();
        let index = [0, MAX_RESULTS_PER_PAGE];

        if (
            req.params.page &&
            req.params.page !== 'all' &&
            (!isFinite(parseInt(req.params.page, 10)) ||
                isNaN(parseInt(req.params.page, 10)) ||
                parseInt(req.params.page, 10) < 1)
        ) {
            res.status(404).render('404');
        } else {
            if (req.params.sorting === 'oldest') {
                scams = fullScams;
            } else if (req.params.sorting === 'status') {
                scams = [...fullScams].sort((a, b) =>
                    (a.status || '').localeCompare(b.status || '')
                );
            } else if (req.params.sorting === 'category') {
                scams = [...fullScams].sort((a, b) =>
                    (a.category || '').localeCompare(b.category || '')
                );
            } else if (req.params.sorting === 'subcategory') {
                scams = [...fullScams].sort((a, b) =>
                    (a.subcategory || '').localeCompare(b.subcategory || '')
                );
            } else if (req.params.sorting === 'name') {
                scams = [...fullScams].sort((a, b) =>
                    a.getHostname().localeCompare(b.getHostname())
                );
            }

            if (req.params.page === 'all') {
                index = [0, scams.length - 1];
            } else if (req.params.page) {
                index = [
                    (req.params.page - 1) * MAX_RESULTS_PER_PAGE,
                    req.params.page * MAX_RESULTS_PER_PAGE
                ];
            }

            for (let i = index[0]; i <= index[1]; i++) {
                if (scams.hasOwnProperty(i) === false) {
                    continue;
                }
                scamList.push(scams[i]);
            }

            res.render('scams', {
                page: req.params.page,
                sorting: req.params.sorting,
                total: scams.length.toLocaleString('en-US'),
                active: Object.keys(
                    scams.filter(scam => scam.status === 'Active')
                ).length.toLocaleString('en-US'),
                total_addresses: Object.keys(fullAddresses).length.toLocaleString('en-US'),
                inactive: Object.keys(
                    scams.filter(scam => scam.status === 'Inactive')
                ).length.toLocaleString('en-US'),
                scams: scamList,
                MAX_RESULTS_PER_PAGE,
                scamsLength: scams.length
            });
        }
    });

    /* Coin pages */
    app.get('/coin/:coin/:page?/:sorting?/', async (req, res) => {
        const MAX_RESULTS_PER_PAGE = 30;
        const scamList = [];
        const fullScams = (await request('https://api.cryptoscamdb.org/v1/scams', {
            json: true
        })).result.map(scam => {
            scam.hostname = url.parse(scam.url).hostname;
            if (scam.coin) {
                scam.coin = scam.coin.toLowerCase();
            }
            return scam;
        });
        const fullAddresses = (await request('https://api.cryptoscamdb.org/v1/addresses', {
            json: true
        })).result;

        let scams = [...fullScams.filter(scam => scam.coin === req.params.coin)].reverse();
        let index = [0, MAX_RESULTS_PER_PAGE];

        if (
            req.params.page &&
            req.params.page !== 'all' &&
            (!isFinite(parseInt(req.params.page, 10)) ||
                isNaN(parseInt(req.params.page, 10)) ||
                parseInt(req.params.page, 10) < 1)
        ) {
            res.status(404).render('404');
        } else {
            if (req.params.sorting === 'oldest') {
                scams = fullScams.filter(scam => scam.coin === req.params.coin);
            } else if (req.params.sorting === 'status') {
                scams = [...fullScams.filter(scam => scam.coin === req.params.coin)].sort((a, b) =>
                    (a.status || '').localeCompare(b.status || '')
                );
            } else if (req.params.sorting === 'category') {
                scams = [...fullScams.filter(scam => scam.coin === req.params.coin)].sort((a, b) =>
                    (a.category || '').localeCompare(b.category || '')
                );
            } else if (req.params.sorting === 'subcategory') {
                scams = [...fullScams.filter(scam => scam.coin === req.params.coin)].sort((a, b) =>
                    (a.subcategory || '').localeCompare(b.subcategory || '')
                );
            } else if (req.params.sorting === 'name') {
                scams = [...fullScams.filter(scam => scam.coin === req.params.coin)].sort((a, b) =>
                    a.getHostname().localeCompare(b.getHostname())
                );
            }

            if (req.params.page === 'all') {
                index = [0, scams.length - 1];
            } else if (req.params.page) {
                index = [
                    (req.params.page - 1) * MAX_RESULTS_PER_PAGE,
                    req.params.page * MAX_RESULTS_PER_PAGE
                ];
            }

            for (let i = index[0]; i <= index[1]; i++) {
                if (scams.hasOwnProperty(i) === false) {
                    continue;
                }
                scamList.push(scams[i]);
            }

            res.render('coin', {
                coin: req.params.coin,
                page: req.params.page,
                sorting: req.params.sorting,
                total: scams.length.toLocaleString('en-US'),
                active: Object.keys(
                    scams.filter(scam => scam.status === 'Active')
                ).length.toLocaleString('en-US'),
                total_addresses: Object.keys(fullAddresses)
                    .filter(address =>
                        fullAddresses[address].some(scam => scam.coin === req.params.coin)
                    )
                    .length.toLocaleString('en-US'),
                inactive: Object.keys(
                    scams.filter(scam => scam.status === 'Inactive')
                ).length.toLocaleString('en-US'),
                scams: scamList,
                MAX_RESULTS_PER_PAGE,
                scamsLength: scams.length
            });
        }
    });

    /* Domain pages */
    app.get('/domain/:url', async (req, res) => {
        const startTime = Date.now();
        const { hostname } = url.parse(
            'http://' + req.params.url.replace('http://', '').replace('https://')
        );
        const fullScams = (await request('https://api.cryptoscamdb.org/v1/scams', {
            json: true
        })).result
            .filter(scam => scam.url)
            .map(scam => {
                scam.hostname = url.parse(scam.url).hostname;
                return scam;
            });
        const fullVerified = (await request('https://api.cryptoscamdb.org/v1/verified', {
            json: true
        })).result.map(scam => {
            scam.hostname = url.parse(scam.url).hostname;
            return scam;
        });

        const scamEntry = fullScams.find(scam => scam.hostname === hostname);
        const verifiedEntry = fullVerified.find(verified => verified.hostname === hostname);

        const urlScan = await getURLScan(hostname);
        const domainurl = 'https://cryptoscamdb.org/domain/' + hostname;
        let googleSafeBrowsing;
        let virusTotal;

        if ((scamEntry || !verifiedEntry) && config.apiKeys.Google_SafeBrowsing) {
            googleSafeBrowsing = await getGoogleSafeBrowsing(hostname);
        }
        if ((scamEntry || !verifiedEntry) && config.apiKeys.VirusTotal) {
            virusTotal = await getVirusTotal(hostname);
        }

        if (verifiedEntry) {
            res.render('domain', {
                type: 'verified',
                result: verifiedEntry,
                domain: hostname,
                urlScan,
                metamask: false,
                googleSafeBrowsing,
                virusTotal,
                startTime,
                dateFormat,
                domainurl
            });
        } else if (scamEntry) {
            res.render('domain', {
                type: 'scam',
                result: scamEntry,
                domain: hostname,
                urlScan,
                metamask: checkForPhishing(hostname),
                googleSafeBrowsing,
                virusTotal,
                startTime,
                dateFormat,
                abuseReport: (await request(
                    'https://api.cryptoscamdb.org/v1/abusereport/' + encodeURIComponent(hostname),
                    { json: true }
                )).result,
                domainurl
            });
        } else {
            res.render('domain', {
                type: 'neutral',
                domain: hostname,
                result: false,
                urlScan,
                metamask: checkForPhishing(hostname),
                googleSafeBrowsing,
                virusTotal,
                addresses: [],
                startTime,
                domainurl
            });
        }
    });

    /* Verified pages */
    app.get('/verified/', async (req, res) =>
        res.render('verified', {
            featured: (await request('https://api.cryptoscamdb.org/v1/featured', {
                json: true
            })).result.sort((a, b) => a.name.localeCompare(b.name))
        })
    );

    /* Safe redirect pages */
    app.get('/redirect/:url', (req, res) => res.render('redirect', { url: req.params.url }));

    /* Serve all other pages as 404 */
    app.get('*', (req, res) => res.status(404).render('404'));

    /* Listen to port (defined in config */
    app.listen(config.port, () => debug('Content served on http://localhost:%s', config.port));
};

if (!module.parent) {
    this.serve().catch(console.error);
}
