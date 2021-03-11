import core from '@actions/core';
import crypto from 'crypto';

import { AzureAppService } from 'azure-actions-appservice-rest/Arm/azure-app-service';
import { AzureAppServiceUtility } from 'azure-actions-appservice-rest/Utilities/AzureAppServiceUtility';
import { AzureResourceFilterUtility } from 'azure-actions-appservice-rest/Utilities/AzureResourceFilterUtility';
import { IAuthorizer } from 'azure-actions-webclient/Authorizer/IAuthorizer';
import { AuthorizerFactory } from 'azure-actions-webclient/AuthorizerFactory';

import { AppSettingsBuilder } from './utilities/appsettings-builder';
import { AppSettingsEnvironmentParser } from './utilities/appsettings-environment-parser'

export interface AppConfiguration {
    appSettings?: Array<AppSetting>;
    connectionStrings?: Array<ConnectionStringSetting>;
    generalConfiguration?: ConfigurationSettings;
}

export interface AppSetting {
    name: string;
    slotSetting: boolean;
    value: any | null;
}

export interface ConnectionStringSetting extends AppSetting {
    type: 'SQLServer' | 'PostgreSQL' | 'MySQL' | 'SQLAzure' | 'Custom';
}

export interface ConfigurationSettings {
    alwaysOn?: boolean;
    autoHealEnabled?: boolean;
    defaultDocuments?: Array<string>;
    detailedErrorLoggingEnabled?: boolean;
    httpLoggingEnabled?: boolean;
    managedPipelineMode?: boolean;
    minTlsVersion?: '1.1' | '1.2';
    netFrameworkVersion?: '4.0';
    numberOfWorkers?: number;
    phpVersion?: '5.6';
    remoteDebuggingEnabled?: boolean;
    requestTracingEnabled?: boolean;
    scmType?: 'None';
    use32BitWorkerProcess?: boolean;
    webSocketsEnabled?: boolean;
}

var initialAgentString = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";

export class AzAppSettings {
    file: string;
    slotName: string;
    webAppName: string;
    prefix: string;

    constructor() {
        this.file = core.getInput('file', { required: true });
        this.webAppName = core.getInput('appname', { required: true });
        this.slotName = core.getInput('slotname', { required: false }) || 'production';
        this.prefix = (core.getInput('prefix', { required: false }));
    }

    async run() {
        if (this.prefix.length > 0) {
            const appService = await this.getAppService();

            const appSettingsReader = new AppSettingsEnvironmentParser(this.prefix, this.slotName);
            const parsedAppSettings = appSettingsReader.parse();

            var builder = new AppSettingsBuilder();
            let newAppConfiguration: AppConfiguration = {};
            if (parsedAppSettings && parsedAppSettings.appSettings.newSettings && parsedAppSettings.appSettings.newSettings.length > 0) {
                newAppConfiguration = builder.buildNewAppSettings(this.file, parsedAppSettings.appSettings.newSettings);
            }

            var removedAppSettings: object = {};
            if (parsedAppSettings && parsedAppSettings.appSettings.removedSettings && parsedAppSettings.appSettings.removedSettings.length > 0) {
                var currentAppSettings = await appService.getApplicationSettings();
                var existingAppSettings = this.convertToAppSettings(currentAppSettings.properties);
                removedAppSettings = builder.buildAppSettingRemovals(existingAppSettings, parsedAppSettings.appSettings.removedSettings);
            }

            core.debug('---AppSettings to be created/updated---');
            core.debug(JSON.stringify(newAppConfiguration));

            core.debug('---AppSettings to be removed---');
            core.debug(JSON.stringify(removedAppSettings));

            if (newAppConfiguration.appSettings) {
                await this.updateAppServiceAppSettings(appService, newAppConfiguration.appSettings, removedAppSettings);
            }
        }
    }

    async getAppService(): Promise<AzureAppService> {
        const usrAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
        let actionName = `AzureAppServiceSettingsFromEnv`;
        let userAgentString = (!!initialAgentString ? `${initialAgentString}+` : '') + `GITHUBACTIONS_${actionName}_${usrAgentRepo}`;
        core.exportVariable(`AZURE_HTTP_USER_AGENT`, userAgentString);

        const endpoint: IAuthorizer = await AuthorizerFactory.getAuthorizer();
        const appDetails = await AzureResourceFilterUtility.getAppDetails(endpoint, this.webAppName);
        const resourceGroupName = appDetails["resourceGroupName"];
        console.log("Resource group: " + resourceGroupName);

        const appService: AzureAppService = new AzureAppService(endpoint, resourceGroupName, this.webAppName, this.slotName)

        return appService;
    }

    private convertToAppSettings(rawAppSettings: any): Array<AppSetting> {
        if (!rawAppSettings) {
            return [];
        }

        const appSettings: Array<AppSetting> = [];
        Object.keys(rawAppSettings).forEach(key => {
            appSettings.push({
                name: key,
                value: rawAppSettings[key],
                slotSetting: false
            });
        });

        return appSettings;
    }

    async updateAppServiceAppSettings(appService: AzureAppService, newAppSettings: Array<AppSetting>, removedAppSettings?: object): Promise<boolean> {
        const appServiceUtility: AzureAppServiceUtility = new AzureAppServiceUtility(appService);
        return appServiceUtility.updateAndMonitorAppSettings(newAppSettings, removedAppSettings);
    }
}

let appSettings = new AzAppSettings();
appSettings.run().catch((error) => {
    console.log(JSON.stringify(error));
    core.setFailed(error);
}).finally(() => {
    core.exportVariable('AZURE_HTTP_USER_AGENT', initialAgentString);
});

