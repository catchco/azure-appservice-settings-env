"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSettingsEnvironmentParser = void 0;
const environment_reader_1 = __importDefault(require("./environment-reader"));
class AppSettingsEnvironmentParser {
    constructor(prefix, slotName) {
        this.prefix = prefix;
        this.slotName = slotName;
    }
    parse() {
        const environmentValues = environment_reader_1.default(this.prefix, this.slotName);
        return {
            appSettings: {
                newSettings: this.getNewSettings(environmentValues),
                removedSettings: this.getRemovedSettings(environmentValues)
            }
        };
    }
    getNewSettings(environmentValues) {
        const appSettingsArr = [];
        environmentValues.map(ev => {
            if (ev.type === 'ADD' || ev.type === 'SLOT') {
                const existingIndex = appSettingsArr.findIndex(e => e.name === ev.name);
                if (existingIndex === -1) {
                    appSettingsArr.push({
                        name: ev.name,
                        slotSetting: ev.type === 'SLOT',
                        value: ev.value
                    });
                }
                else {
                    throw new Error(`Duplicate setting found for in environment variables. The offending setting is ${ev.name}`);
                }
            }
        });
        return appSettingsArr;
    }
    getRemovedSettings(environmentValues) {
        const appSettingsArr = [];
        environmentValues.map(ev => {
            if (ev.type === 'REMOVE') {
                const existingIndex = appSettingsArr.findIndex(e => e.name === ev.name);
                if (existingIndex === -1) {
                    appSettingsArr.push({
                        "name": ev.name,
                        "slotSetting": false,
                        "value": null
                    });
                }
            }
        });
        return appSettingsArr;
    }
}
exports.AppSettingsEnvironmentParser = AppSettingsEnvironmentParser;
