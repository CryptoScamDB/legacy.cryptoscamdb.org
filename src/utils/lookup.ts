import * as request from 'request';
import config from './config';
import * as Debug from 'debug';
import Bottleneck from 'bottleneck';

const debug = Debug('lookup');

/* Create Bottleneck limiter for HTTP lookups with limits defined in config */
const limiter = new Bottleneck({
    minTime: config.lookups.HTTP.minTime,
    maxConcurrent: config.lookups.HTTP.maxConcurrent
});

/* Do a URL lookup */
export const lookup = limiter.wrap(url => {
    return new Promise(resolve => {
        debug('Requesting ' + url + '...');
        request(
            {
                url,
                timeout: config.lookups.HTTP.timeoutAfter,
                followAllRedirects: true,
                maxRedirects: 5
            },
            (err, response) => {
                if (err) {
                    resolve(undefined);
                } else {
                    resolve(response);
                }
            }
        );
    });
});

/* Retrieve latest VirusTotal report (no API key required) */
export const getURLScan = url => {
    return new Promise((resolve, reject) => {
        request(
            'https://urlscan.io/api/v1/search/?q=domain%3A' + url,
            { json: true },
            (err, response, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            }
        );
    });
};

/* Retrieve Google SafeBrowsing status for URL */
export const getGoogleSafeBrowsing = url => {
    return new Promise((resolve, reject) => {
        debug('Google SafeBrowsing: %o', url);
        request(
            {
                url:
                    'https://safebrowsing.googleapis.com/v4/threatMatches:find?key=' +
                    encodeURIComponent(config.apiKeys.Google_SafeBrowsing),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                json: {
                    client: {
                        clientId: 'EtherScamDB',
                        clientVersion: '3.0.0'
                    },
                    threatInfo: {
                        threatTypes: [
                            'THREAT_TYPE_UNSPECIFIED',
                            'MALWARE',
                            'SOCIAL_ENGINEERING',
                            'UNWANTED_SOFTWARE',
                            'POTENTIALLY_HARMFUL_APPLICATION'
                        ],
                        platformTypes: [
                            'PLATFORM_TYPE_UNSPECIFIED',
                            'WINDOWS',
                            'LINUX',
                            'ANDROID',
                            'OSX',
                            'IOS',
                            'ANY_PLATFORM',
                            'ALL_PLATFORMS',
                            'CHROME'
                        ],
                        threatEntryTypes: ['THREAT_ENTRY_TYPE_UNSPECIFIED', 'URL', 'EXECUTABLE'],
                        threatEntries: [
                            {
                                url
                            }
                        ]
                    }
                }
            },
            (err, response, body) => {
                debug('%s returned %s %o', url, response ? response.statusCode : -1, body);
                if (err) {
                    reject(err);
                } else if (response.statusCode !== 200) {
                    reject('Google SafeBrowsing returned an invalid status code');
                } else if (body && body.matches && body.matches[0]) {
                    resolve(body.matches[0]);
                } else {
                    resolve(false);
                }
            }
        );
    });
};

/* Retrieve latest VirusTotal report */
export const getVirusTotal = url => {
    return new Promise((resolve, reject) => {
        request(
            {
                uri:
                    'https://www.virustotal.com/vtapi/v2/url/report?apikey=' +
                    encodeURIComponent(config.apiKeys.VirusTotal) +
                    '&resource=' +
                    url,
                method: 'GET',
                json: true
            },
            (err, response, body) => {
                if (err) {
                    reject(err);
                } else if (response.statusCode !== 200) {
                    reject('VirusTotal returned an invalid status code');
                } else if (body.response_code === 0) {
                    reject('VirusTotal returned an invalid internal status code');
                } else {
                    resolve(body);
                }
            }
        );
    });
};
