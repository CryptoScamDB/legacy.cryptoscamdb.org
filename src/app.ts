'use strict';

import * as Debug from 'debug';
import * as express from 'express';
import * as path from 'path';
import * as url from 'url';
import * as helmet from 'helmet';
import * as isIpPrivate from 'private-ip';
import * as checkForPhishing from 'eth-phishing-detect';
import * as dateFormat from 'dateformat';
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

    app.locals.announcement = null;
    app.locals.isIpPrivate = isIpPrivate;
    app.locals.checkForPhishing = checkForPhishing;
    app.locals.dateFormat = dateFormat;

    /* Compress pages */
    app.use(require('compression')());

    /* Serve static content*/
    app.use(express.static(path.join(__dirname, 'views/static'), { extensions: ['svg', 'png'] }));

    /* Seperately re-serve various other brand logos to flatten nested paths */
    app.use(
        '/assets',
        express.static(path.join(__dirname, 'views/static/assets/coins'), {
            extensions: ['svg', 'png']
        })
    );
    app.use(
        '/assets',
        express.static(path.join(__dirname, 'views/static/assets/exchanges'), {
            extensions: ['svg', 'png']
        })
    );
    app.use(
        '/assets',
        express.static(path.join(__dirname, 'views/static/assets/explorers'), {
            extensions: ['svg', 'png']
        })
    );
    app.use(
        '/assets',
        express.static(path.join(__dirname, 'views/static/assets/wallets'), {
            extensions: ['svg', 'png']
        })
    );
    app.use(
        '/assets',
        express.static(path.join(__dirname, 'views/static/assets/favicon'), {
            extensions: ['svg', 'png']
        })
    );
    app.use(
        '/assets',
        express.static(path.join(__dirname, 'views/static/assets/branding'), {
            extensions: ['svg', 'png']
        })
    );
    app.use(
        '/assets',
        express.static(path.join(__dirname, 'views/static/assets/symbols'), {
            extensions: ['svg', 'png']
        })
    );

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
            ip: req.params.ip
        });
    });

    /* Address pages */
    app.get('/address/:address', async (req, res) => {
        res.render('address', {
            address: req.params.address
        });
    });

    /* Scams index */
    app.get('/scams/:page?/:sorting?/', async (req, res) => {
        if (
            req.params.page &&
            (!isFinite(parseInt(req.params.page, 10)) ||
                isNaN(parseInt(req.params.page, 10)) ||
                parseInt(req.params.page, 10) < 1)
        ) {
            res.status(404).render('404');
        } else {
            res.render('scams', {
                page: req.params.page || 1,
                sorting: req.params.sorting || null,
                query: req.query
            });
        }
    });

    /* Entry pages */
    app.get('/scam/:id', async (req, res) => {
        const startTime = Date.now();

        const entry = await request(
            'https://api.cryptoscamdb.org/v1/entry/' + encodeURIComponent(req.params.id),
            {
                json: true
            }
        );

        if (entry.success) {
            res.render('entry', {
                id: req.params.id,
                entry: entry.result,
                domainurl: 'https://cryptoscamdb.org/scam/' + encodeURIComponent(req.params.id),
                startTime
            });
        } else {
            res.render('404');
        }
    });

    /* Domain pages */
    app.get('/domain/:url', async (req, res) => {
        const startTime = Date.now();
        const { hostname } = url.parse(
            'http://' + req.params.url.replace('http://', '').replace('https://')
        );

        const result = (await request(
            'https://api.cryptoscamdb.org/v1/domain/' + encodeURIComponent(hostname),
            {
                json: true
            }
        )).result;

        res.render('domain', {
            domain: hostname,
            entries: result,
            domainurl: 'https://cryptoscamdb.org/domain/' + encodeURIComponent(req.params.url),
            startTime
        });
    });

    /* Verified pages */
    app.get('/verified/', async (req, res) => res.render('verified'));

    /* Safe redirect pages */
    app.get('/redirect/:url', (req, res) => res.render('redirect', { url: req.params.url }));

    /* Serve all other pages as 404 */
    app.get('*', (req, res) => res.status(404).render('404'));

    /* Listen to port (defined in config */
    app.listen(80, () => debug('Content served on http://localhost:80'));
};

if (!module.parent) {
    this.serve().catch(console.error);
}
