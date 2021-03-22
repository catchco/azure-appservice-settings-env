import * as core from '@actions/core';
import * as fs from 'fs';
import { AppConfiguration, AppSetting } from '../main';

export class AppSettingsBuilder {
    buildNewAppSettings(file: string, envAppSettings: Array<AppSetting>): AppConfiguration {
        const fileContent = fs.readFileSync(file, { encoding: 'utf8' });

        try {
            const patchedFileContent = this.applyNewAppSettings(fileContent, envAppSettings);
            core.info(`Settings file ${file} has been successfully patched.`)
            return patchedFileContent;
        } catch (error) {
            throw new Error(`Error encountered patching the AppSettings file ${file}: \n ${error.message}`);
        }
    }

    buildAppSettingRemovals(existingSettings: Array<AppSetting>, envAppSettings: Array<AppSetting>): object {
        if (!envAppSettings || envAppSettings.length === 0) {
            return [];
        }

        try {
            const removalSettings = this.buildAppSettingRemoves(existingSettings, envAppSettings);
            core.info('Removal settings have been successfully created.');
            return removalSettings;
        } catch (error) {
            throw new Error(`Error encountered creating the removal AppSettings: \n ${error.message}`);
        }
    }

    private buildAppSettingRemoves(existingSettings: Array<AppSetting>, envAppSettings: Array<AppSetting>): object {
        this.validateAppSettings(existingSettings);
        const removalSettings: any = {};
        envAppSettings.forEach(setting => {
            const existingSettingIndex = existingSettings.findIndex(ev => ev.name.toUpperCase() === setting.name.toUpperCase());            
            if (existingSettingIndex !== -1) {
                core.info(`Found existing setting ${setting.name}, preparing it for removal.`);                
                removalSettings[existingSettings[existingSettingIndex].name] = existingSettings[existingSettingIndex].value;
            }
        });

        return removalSettings;
    }

    private applyNewAppSettings(fileContent: string, envAppSettings: Array<AppSetting>): AppConfiguration {
        const patchedSettings = JSON.parse(fileContent) as AppConfiguration;

        this.validateFile(patchedSettings)
        core.debug(`Settings file determined to be valid. Beginning environment lookup.`);

        if (patchedSettings.appSettings) {
            patchedSettings.appSettings.forEach(setting => {
                const envIndex = envAppSettings.findIndex(ev => ev.name.toUpperCase() === setting.name.toUpperCase());
                if (envIndex !== -1) {
                    core.info(`Found setting ${setting.name} in the environment.`);
                    core.debug(`Setting value for setting ${setting.name} to ${envAppSettings[envIndex].value}`);
                    setting.value = envAppSettings[envIndex].value;
                    setting.slotSetting = envAppSettings[envIndex].slotSetting;
                }
            });
        }

        return patchedSettings;
    }

    private validateAppSettings(appSettings: Array<AppSetting>) {
        appSettings.forEach((setting, ix) => {
            if (!(setting
                && setting.name && typeof (setting.name) === 'string'
                && setting.slotSetting != undefined && setting.slotSetting != null && typeof (setting.slotSetting) === 'boolean')) {
                throw new Error('File content is not valid. Invalid object found at index ' + ix + '. Expected an AppSetting object but received ' + JSON.stringify(setting));
            };
        });
    }

    private validateFile(configuration: AppConfiguration) {
        if (!configuration) {
            throw new Error('Configuration file was empty or could not be parsed.');
        }

        if(!configuration.appSettings) {
            core.warning('An appSettings property was not found on the configuration object. If this was intentional you may ignore this warning, otherwise please check the casing of your property names.');
        }

        if (configuration.appSettings && !Array.isArray(configuration.appSettings)) {
            throw new Error('File content is not valid. Expecting an array of AppSetting objects');
        }

        if (configuration.appSettings) {
            this.validateAppSettings(configuration.appSettings);
        }
    }
}