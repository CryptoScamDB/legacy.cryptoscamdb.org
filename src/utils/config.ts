import * as fs from 'fs';
import * as Debug from 'debug';

const debug = Debug('config');

export interface Config {
    manual: boolean;
    announcement: string;
    port: number;
    apiKeys: {
        Google_SafeBrowsing: string;
        VirusTotal: string;
    };
}

let configObject: Config;

if (!fs.existsSync('./config.json')) {
    /* Config wasn't found; return default config and show configuration page */
    configObject = {
        manual: false,
        announcement: null,
        port: 5111,
        apiKeys: {
            Google_SafeBrowsing: undefined,
            VirusTotal: undefined
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
    configObject = config;
}

export default configObject;
