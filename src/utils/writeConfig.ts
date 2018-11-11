import * as fs from 'fs-extra';

export interface ConfigOptions {
    port: string;
    'google-safebrowsing': string;
    virustotal: string;
}

export default async (options: ConfigOptions): Promise<void> => {
    /* Define config */
    const config = {
        port: parseInt(options.port, 10),
        announcement: null,
        apiKeys: {
            Google_SafeBrowsing: options['google-safebrowsing'] || null,
            VirusTotal: options.virustotal || null
        }
    };

    /* Write config to file */
    await fs.writeJson('./config.json', config, { spaces: 4 });
};
