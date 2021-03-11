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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzAppSettings = void 0;
const core = __importStar(require("@actions/core"));
const crypto = __importStar(require("crypto"));
const azure_app_service_1 = require("azure-actions-appservice-rest/Arm/azure-app-service");
const AzureAppServiceUtility_1 = require("azure-actions-appservice-rest/Utilities/AzureAppServiceUtility");
const AzureResourceFilterUtility_1 = require("azure-actions-appservice-rest/Utilities/AzureResourceFilterUtility");
const AuthorizerFactory_1 = require("azure-actions-webclient/AuthorizerFactory");
const appsettings_builder_1 = require("./utilities/appsettings-builder");
const appsettings_environment_parser_1 = require("./utilities/appsettings-environment-parser");
var initialAgentString = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";
class AzAppSettings {
    constructor() {
        this.file = core.getInput('file', { required: true });
        this.webAppName = core.getInput('appname', { required: true });
        this.slotName = core.getInput('slotname', { required: false }) || 'production';
        this.prefix = (core.getInput('prefix', { required: false }));
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const appService = yield this.getAppService();
            const appSettingsReader = new appsettings_environment_parser_1.AppSettingsEnvironmentParser(this.prefix, this.slotName);
            const parsedAppSettings = appSettingsReader.parse();
            var builder = new appsettings_builder_1.AppSettingsBuilder();
            let newAppConfiguration = {};
            if (parsedAppSettings && parsedAppSettings.appSettings.newSettings && parsedAppSettings.appSettings.newSettings.length > 0) {
                newAppConfiguration = builder.buildNewAppSettings(this.file, parsedAppSettings.appSettings.newSettings);
            }
            var removedAppSettings = {};
            if (parsedAppSettings && parsedAppSettings.appSettings.removedSettings && parsedAppSettings.appSettings.removedSettings.length > 0) {
                var currentAppSettings = yield appService.getApplicationSettings();
                var existingAppSettings = this.convertToAppSettings(currentAppSettings.properties);
                removedAppSettings = builder.buildAppSettingRemovals(existingAppSettings, parsedAppSettings.appSettings.removedSettings);
            }
            core.debug('---AppSettings to be created/updated---');
            core.debug(JSON.stringify(newAppConfiguration));
            core.debug('---AppSettings to be removed---');
            core.debug(JSON.stringify(removedAppSettings));
            if (newAppConfiguration.appSettings) {
                yield this.updateAppServiceAppSettings(appService, newAppConfiguration.appSettings, removedAppSettings);
            }
        });
    }
    getAppService() {
        return __awaiter(this, void 0, void 0, function* () {
            const usrAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
            let actionName = `AzureAppServiceSettingsFromEnv`;
            let userAgentString = (!!initialAgentString ? `${initialAgentString}+` : '') + `GITHUBACTIONS_${actionName}_${usrAgentRepo}`;
            core.exportVariable(`AZURE_HTTP_USER_AGENT`, userAgentString);
            const endpoint = yield AuthorizerFactory_1.AuthorizerFactory.getAuthorizer();
            const appDetails = yield AzureResourceFilterUtility_1.AzureResourceFilterUtility.getAppDetails(endpoint, this.webAppName);
            const resourceGroupName = appDetails["resourceGroupName"];
            console.log("Resource group: " + resourceGroupName);
            const appService = new azure_app_service_1.AzureAppService(endpoint, resourceGroupName, this.webAppName, this.slotName);
            return appService;
        });
    }
    convertToAppSettings(rawAppSettings) {
        if (!rawAppSettings) {
            return [];
        }
        const appSettings = [];
        Object.keys(rawAppSettings).forEach(key => {
            appSettings.push({
                name: key,
                value: rawAppSettings[key],
                slotSetting: false
            });
        });
        return appSettings;
    }
    updateAppServiceAppSettings(appService, newAppSettings, removedAppSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            const appServiceUtility = new AzureAppServiceUtility_1.AzureAppServiceUtility(appService);
            return appServiceUtility.updateAndMonitorAppSettings(newAppSettings, removedAppSettings);
        });
    }
}
exports.AzAppSettings = AzAppSettings;
let appSettings = new AzAppSettings();
appSettings.run().catch((error) => {
    console.log(JSON.stringify(error));
    core.setFailed(error);
}).finally(() => {
    core.exportVariable('AZURE_HTTP_USER_AGENT', initialAgentString);
});
