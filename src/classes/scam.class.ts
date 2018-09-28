import { parse } from 'url';
import * as dns from '@cryptoscamdb/graceful-dns';
import { lookup, getURLScan } from '../utils/lookup';

export interface ScamData {
    readonly url?;
    readonly name?;
    readonly category?;
    readonly subcategory?;
    readonly description?;
    readonly addresses?;
    readonly reporter?;
    readonly coin?;
    ip?;
    nameservers?;
    statusCode?;
    status?;
    updated?;
}

export default class Scam implements ScamData {
    readonly url?;
    readonly name?;
    readonly category?;
    readonly subcategory?;
    readonly description?;
    readonly addresses?;
    readonly reporter?;
    readonly coin?;
    ip?;
    nameservers?;
    statusCode?;
    status?;
    updated?;

    /* Create new Scam instance */
    constructor(scamObject: ScamData = {}) {
        if (scamObject.url) {
            this.name = parse(scamObject.url).hostname.replace('www.', '');
            this.url = scamObject.url;
        }
        if (scamObject.category) {
            this.category = scamObject.category;
        }
        if (scamObject.subcategory) {
            this.subcategory = scamObject.subcategory;
        }
        if (scamObject.description) {
            this.description = scamObject.description;
        }
        if (scamObject.addresses) {
            this.addresses = scamObject.addresses;
        }
        if (scamObject.reporter) {
            this.reporter = scamObject.reporter;
        }
        if (scamObject.coin) {
            this.coin = scamObject.coin;
        }
    }

    /* Returns either `false` or a request response */
    async lookup() {
        return lookup(this.url);
    }

    /* Returns URL hostname (domain.example) */
    getHostname() {
        return parse(this.url).hostname;
    }

    /* Returns IP from URL */
    async getIP() {
        this.ip = await dns.getIP(this.url);
        return this.ip;
    }

    /* Returns nameservers from URL */
    async getNameservers() {
        this.nameservers = await dns.getNS(this.url);
        return this.nameservers;
    }

    /* Get URL status */
    async getStatus() {
        // TODO: Replace 'any' with proper type
        const result: any = await this.lookup();

        if (result && result.statusCode) {
            this.statusCode = result.statusCode;
        } else {
            this.statusCode = -1;
        }

        if (!result) {
            this.status = 'Offline'; /* No response; server is offline */
        } else if (
            result &&
            result.request &&
            result.request.uri &&
            result.request.uri.path &&
            result.request.uri.path === '/cgi-sys/suspendedpage.cgi'
        ) {
            this.status =
                'Suspended'; /* URL redirects to /cgi-sys/suspendedpage.cgi; server is likely suspended */
        } else if (
            result &&
            (result.body === '' ||
                (result.request &&
                    result.request.uri &&
                    result.request.uri.path &&
                    result.request.uri.path === '/cgi-sys/defaultwebpage.cgi'))
        ) {
            this.status =
                'Inactive'; /* URL redirects to /cgi-sys/defaultwebpage.cgi; domain is likely parked or not set up yet */
        } else if (result && this.subcategory && this.subcategory === 'MyEtherWallet') {
            const isMEW = await lookup(
                'http://' +
                    parse(this.url).hostname.replace('www.', '') +
                    '/js/etherwallet-static.min.js'
            );
            if (isMEW) {
                this.status =
                    'Active'; /* /js/etherwallet-static.min.js can be reached; server is active */
            } else {
                this.status =
                    'Inactive'; /* /js/etherwallet-static.min.js can't be reached; server is likely inactive */
            }
        } else if (result && this.subcategory && this.subcategory === 'MyCrypto') {
            const isMYC = await lookup(
                'http://' +
                    parse(this.url).hostname.replace('www.', '') +
                    '/js/mycrypto-static.min.js'
            );
            if (isMYC) {
                this.status =
                    'Active'; /* /js/mycrypto-static.min.js can't be reached; server is likely inactive */
            } else {
                this.status =
                    'Inactive'; /* /js/mycrypto-static.min.js can't be reached; server is likely inactive */
            }
        } else {
            this.status = 'Active'; /* URL can be reached; server is possibly active */
        }

        return this.status;
    }

    /* Retrieve URLScan results */
    getURLScan() {
        return getURLScan(this.getHostname());
    }

    /* Look up how recent domain status was updated */
    howRecent() {
        return Date.now() - (this.updated || 0);
    }
}
