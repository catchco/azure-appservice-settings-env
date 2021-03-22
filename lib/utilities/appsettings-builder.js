"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSettingsBuilder = void 0;
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
class AppSettingsBuilder {
    buildNewAppSettings(file, envAppSettings) {
        const fileContent = fs.readFileSync(file, { encoding: 'utf8' });
        try {
            const patchedFileContent = this.applyNewAppSettings(fileContent, envAppSettings);
            core.info(`Settings file ${file} has been successfully patched.`);
            return patchedFileContent;
        }
        catch (error) {
            throw new Error(`Error encountered patching the AppSettings file ${file}: \n ${error.message}`);
        }
    }
    buildAppSettingRemovals(existingSettings, envAppSettings) {
        if (!envAppSettings || envAppSettings.length === 0) {
            return [];
        }
        try {
            const removalSettings = this.buildAppSettingRemoves(existingSettings, envAppSettings);
            core.info('Removal settings have been successfully created.');
            return removalSettings;
        }
        catch (error) {
            throw new Error(`Error encountered creating the removal AppSettings: \n ${error.message}`);
        }
    }
    buildAppSettingRemoves(existingSettings, envAppSettings) {
        this.validateAppSettings(existingSettings);
        const removalSettings = {};
        envAppSettings.forEach(setting => {
            const existingSettingIndex = existingSettings.findIndex(ev => ev.name.toUpperCase() === setting.name.toUpperCase());
            if (existingSettingIndex !== -1) {
                core.info(`Found existing setting ${setting.name}, preparing it for removal.`);
                removalSettings[existingSettings[existingSettingIndex].name] = existingSettings[existingSettingIndex].value;
            }
        });
        return removalSettings;
    }
    applyNewAppSettings(fileContent, envAppSettings) {
        const patchedSettings = JSON.parse(fileContent);
        this.validateFile(patchedSettings);
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
    validateAppSettings(appSettings) {
        appSettings.forEach((setting, ix) => {
            if (!(setting
                && setting.name && typeof (setting.name) === 'string'
                && setting.slotSetting != undefined && setting.slotSetting != null && typeof (setting.slotSetting) === 'boolean')) {
                throw new Error('File content is not valid. Invalid object found at index ' + ix + '. Expected an AppSetting object but received ' + JSON.stringify(setting));
            }
            ;
        });
    }
    validateFile(configuration) {
        if (!configuration) {
            throw new Error('Configuration file was empty or could not be parsed.');
        }
        if (!configuration.appSettings) {
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
exports.AppSettingsBuilder = AppSettingsBuilder;
