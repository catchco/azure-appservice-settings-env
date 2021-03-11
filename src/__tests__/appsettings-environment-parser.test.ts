import getEnvironmentVariables from '../utilities/environment-reader';
import { AppSettingsEnvironmentParser } from '../utilities/appsettings-environment-parser';
import { AppSettingEnvironmentVariable } from '../utilities/environment-reader';

jest.mock('../utilities/environment-reader');

describe('appsettings environment parser', () => {
    describe('getting new app settings', () => {
        const slotName = 'test';
        const appSettingsReader = new AppSettingsEnvironmentParser(undefined, slotName);

        beforeAll(() => {
            let appSettings: AppSettingEnvironmentVariable[] = [
                {
                    name: 'APPSETTING',
                    value: 'value',
                    type: 'ADD'
                },
                {
                    name: 'SLOTAPPSETTING',
                    value: 'value',
                    type: 'SLOT'
                },
                {
                    name: 'RMVAPPSETTING',
                    value: 'value',
                    type: 'REMOVE'
                }
            ];

            (getEnvironmentVariables as jest.Mock).mockReturnValue(appSettings);
        });

        test('should have new settings', () => {
            var result = appSettingsReader.parse();
            expect(result.appSettings.newSettings.length).toBeGreaterThan(0);
        });

        test('should have slot setting set to true for slot app settings', () => {
            var result = appSettingsReader.parse();

            var appSettingIndex = result.appSettings.newSettings.findIndex(val => val.name === 'SLOTAPPSETTING');
            var appSetting = result.appSettings.newSettings[appSettingIndex]

            expect(appSetting.slotSetting).toBe(true);
            expect(appSetting.value).toBe('value');
        });

        test('should not contain any removed settings', () => {
            var result = appSettingsReader.parse();

            var appSettingIndex = result.appSettings.newSettings.findIndex(val => val.name === 'RMVAPPSETTING');            

            expect(appSettingIndex).toBe(-1);
        });
    });

    describe('getting removed app settings', () => {
        const slotName = 'test';
        const appSettingsReader = new AppSettingsEnvironmentParser(undefined, slotName);

        beforeAll(() => {
            let appSettings: AppSettingEnvironmentVariable[] = [
                {
                    name: 'APPSETTING',
                    value: 'value',
                    type: 'ADD'
                },
                {
                    name: 'SLOTAPPSETTING',
                    value: 'value',
                    type: 'SLOT'
                },
                {
                    name: 'RMVAPPSETTING',
                    value: 'value',
                    type: 'REMOVE'
                }
            ];

            (getEnvironmentVariables as jest.Mock).mockReturnValue(appSettings);
        });

        test('should have removed settings', () => {
            var result = appSettingsReader.parse();
            expect(result.appSettings.removedSettings.length).toBeGreaterThan(0);
        });

        test('should not contain any SLOT or ADD settings', () => {
            var result = appSettingsReader.parse();
            
            var addAppSettingIndex = result.appSettings.removedSettings.findIndex(val => val.name === 'APPSETTING');
            var slotAppSettingIndex = result.appSettings.removedSettings.findIndex(val => val.name === 'SLOTAPPSETTING');

            expect(addAppSettingIndex).toBe(-1);
            expect(slotAppSettingIndex).toBe(-1);
        });
    });
});