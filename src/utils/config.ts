import * as fs from 'fs';
import * as dns from '@cryptoscamdb/graceful-dns';
import * as Debug from 'debug';

const debug = Debug('config');

interface Config {
    manual;
    announcement;
    port;
    interval: {
        cacheExpiration;
        cacheRenewCheck;
        databasePersist;
    };
    apiKeys: {
        Google_SafeBrowsing;
        Github_WebHook;
        VirusTotal;
    };
    autoPull: {
        enabled;
        interval?;
    };
    lookups: {
        DNS: {
            IP: {
                enabled;
            };
            NS: {
                enabled;
            };
        };
        HTTP: {
            enabled;
            minTime?;
            maxConcurrent?;
            timeoutAfter?;
        };
    };
}

let configObject: Config;

if (!fs.existsSync('./config.json')) {
    /* Config wasn't found; return default config and show configuration page */
    configObject = {
        manual: false,
        announcement: null,
        port: 5111,
        interval: {
            cacheExpiration: -1,
            cacheRenewCheck: -1,
            databasePersist: -1
        },
        apiKeys: {
            Google_SafeBrowsing: undefined,
            Github_WebHook: undefined,
            VirusTotal: undefined
        },
        autoPull: { enabled: false },
        lookups: {
            DNS: {
                IP: { enabled: false },
                NS: { enabled: false }
            },
            HTTP: { enabled: false }
        }
    };
} else {
    /* Config was found */
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    config.manual = true;
    if (!config.apiKeys.Google_SafeBrowsing) {
        debug('Warning: No Google SafeBrowsing API key found');
    }
    if (!config.apiKeys.VirusTotal) {
        debug('Warning: No VirusTotal API key found');
    }
    if (config.lookups.DNS.servers.length > 0) {
        dns.setServers(config.lookups.DNS.servers);
    }
    configObject = config;
}

export default configObject;
