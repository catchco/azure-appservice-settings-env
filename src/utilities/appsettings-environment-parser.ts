import { AppSetting, ConfigurationSettings, ConnectionStringSetting } from '../main';
import getEnvironmentVariables, { AppSettingEnvironmentVariable } from './environment-reader'

export interface AppSettingsCollection {
    newSettings: Array<AppSetting>,
    removedSettings: Array<AppSetting>
}

export interface AppSettingsParseResult {
    appSettings: AppSettingsCollection
    configurationSettings?: ConfigurationSettings
    connectionStrings?: Array<ConnectionStringSetting>
}

export class AppSettingsEnvironmentParser {
    constructor(private prefix: string | undefined, private slotName: string) {}    

    parse(): AppSettingsParseResult {
        const environmentValues = getEnvironmentVariables(this.prefix, this.slotName);
        return {
            appSettings: {
                newSettings: this.getNewSettings(environmentValues),
                removedSettings: this.getRemovedSettings(environmentValues)
            }
        }        
    }

    private getNewSettings(environmentValues: Array<AppSettingEnvironmentVariable>): Array<AppSetting> {
        const appSettingsArr: Array<AppSetting> = [];
        environmentValues.map(ev => {            
            if(ev.type === 'ADD' || ev.type === 'SLOT') {                
                const existingIndex = appSettingsArr.findIndex(e => e.name === ev.name);

                if(existingIndex === -1) {
                    appSettingsArr.push({
                        name: ev.name,
                        slotSetting: ev.type === 'SLOT',
                        value: ev.value
                    });                    
                } else {                    
                    throw new Error(`Duplicate setting found for in environment variables. The offending setting is ${ev.name}`);
                }
            }
        });

        return appSettingsArr;
    }

    private getRemovedSettings(environmentValues: Array<AppSettingEnvironmentVariable>): Array<AppSetting> {
        const appSettingsArr: Array<AppSetting> = [];
        environmentValues.map(ev => {            
            if(ev.type === 'REMOVE') {                
                const existingIndex = appSettingsArr.findIndex(e => e.name === ev.name);
                
                if(existingIndex === -1) {
                    appSettingsArr.push({
                        "name":ev.name,
                        "slotSetting": false,
                        "value": null
                    });                    
                }
            }
        });

        return appSettingsArr;
    }
}