import * as core from "@actions/core";
import * as fs from 'fs';
import { AppConfiguration, AppSetting } from '../main';

export class AppSettingsBuilder {
    buildNewAppSettings(file: string, envAppSettings: Array<AppSetting>): AppConfiguration {
        const fileContent = fs.readFileSync(file, { encoding: 'utf8' });

        try {
            var patchedFileContent = this.applyNewAppSettings(fileContent, envAppSettings);
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
            var removalSettings = this.buildAppSettingRemoves(existingSettings, envAppSettings);
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
            var existingSettingIndex = existingSettings.findIndex(ev => ev.name.toUpperCase() === setting.name.toUpperCase());            
            if (existingSettingIndex !== -1) {
                removalSettings[existingSettings[existingSettingIndex].name] = existingSettings[existingSettingIndex].value;
            }
        });

        return removalSettings;
    }

    private applyNewAppSettings(fileContent: string, envAppSettings: Array<AppSetting>): AppConfiguration {
        var patchedSettings = JSON.parse(fileContent) as AppConfiguration;;

        this.validateFile(patchedSettings)

        if (patchedSettings.appSettings) {
            patchedSettings.appSettings.forEach(setting => {
                var envIndex = envAppSettings.findIndex(ev => ev.name.toUpperCase() === setting.name.toUpperCase());
                if (envIndex !== -1) {
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

        if (configuration.appSettings && !Array.isArray(configuration.appSettings)) {
            throw new Error('File content is not valid. Expecting an array of AppSetting objects');
        }

        if (configuration.appSettings) {
            this.validateAppSettings(configuration.appSettings);
        }
    }
}