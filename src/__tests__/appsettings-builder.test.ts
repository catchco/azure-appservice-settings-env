import * as core from '@actions/core';
import fs from 'fs';
import { AppConfiguration, AppSetting } from '../main';
import { AppSettingsBuilder } from '../utilities/appsettings-builder';

jest.mock('fs', () => ({
    promises: {
        access: jest.fn()
    },
    readFileSync: jest.fn()
}));
jest.mock('@actions/core');

describe('app settings builder', () => {
    describe('removed app settings', () => {
        const builder: AppSettingsBuilder = new AppSettingsBuilder();
        let existingAppSettings: AppSetting[];
        let environmentAppSettings: AppSetting[];

        beforeEach(() => {
            existingAppSettings = [
                {
                    name: 'UPPERCASE_SETTING',
                    slotSetting: false,
                    value: 'value'
                },
                {
                    name: 'lowercase_setting',
                    slotSetting: false,
                    value: 'value'
                },
                {
                    name: 'variablecase_SETTING',
                    slotSetting: false,
                    value: 'value'
                }
            ];

            environmentAppSettings = [
                {
                    name: 'uppercase_setting',
                    slotSetting: false,
                    value: 'value'
                },
                {
                    name: 'LOWERCASE_SETTING',
                    slotSetting: false,
                    value: 'value'
                },
                {
                    name: 'VARIABLECASE_setting',
                    slotSetting: false,
                    value: 'value'
                }
            ];
        });

        test('should return a value', () => {
            const result = builder.buildAppSettingRemovals(existingAppSettings, environmentAppSettings);
            expect(result).not.toBeNull();
        });

        test('should match regardless of case', () => {
            const result: any = builder.buildAppSettingRemovals(existingAppSettings, environmentAppSettings);
            existingAppSettings.forEach(setting => {
                expect(result[setting.name]).toBeTruthy();
            });
        });

    });

    describe('new app settings', () => {

        describe('bad property casing', () => {
            const builder: AppSettingsBuilder = new AppSettingsBuilder();
            let existingAppSettings: AppSetting[];
            let environmentAppSettings: AppSetting[];

            beforeEach(() => {
                existingAppSettings = [
                    {
                        name: 'UPPERCASE_SETTING',
                        slotSetting: false,
                        value: 'value'
                    },
                    {
                        name: 'lowercase_setting',
                        slotSetting: false,
                        value: 'value'
                    },
                    {
                        name: 'variablecase_SETTING',
                        slotSetting: false,
                        value: 'value'
                    },
                    {
                        name: 'unmatched_environment_VARIABLE',
                        slotSetting: false,
                        value: 'value'
                    },
                    {
                        name: 'slot_setting',
                        slotSetting: true,
                        value: 'value'
                    }
                ];

                environmentAppSettings = [
                    {
                        name: 'uppercase_setting',
                        slotSetting: false,
                        value: 'value-new'
                    },
                    {
                        name: 'LOWERCASE_SETTING',
                        slotSetting: false,
                        value: 'value-new'
                    },
                    {
                        name: 'VARIABLECASE_setting',
                        slotSetting: false,
                        value: 'value-new'
                    },
                    {
                        name: 'slot_setting',
                        slotSetting: true,
                        value: 'value-new'
                    }
                ];

                const fileAppSettings = {
                    appsettings: existingAppSettings
                };

                (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(fileAppSettings));
            });

            test('should warn on unmatched propery', () => {
                let logWarning = '';
                (core.warning as jest.Mock).mockImplementation(cb => {
                    logWarning = cb;
                });

                const result = builder.buildNewAppSettings('file.json', environmentAppSettings);

                expect(logWarning).toBe('An appSettings property was not found on the configuration object. If this was intentional you may ignore this warning, otherwise please check the casing of your property names.')
            })
        });

        describe('proper property casing', () => {
            const builder: AppSettingsBuilder = new AppSettingsBuilder();
            let existingAppSettings: AppSetting[];
            let environmentAppSettings: AppSetting[];

            beforeEach(() => {
                existingAppSettings = [
                    {
                        name: 'UPPERCASE_SETTING',
                        slotSetting: false,
                        value: 'value'
                    },
                    {
                        name: 'lowercase_setting',
                        slotSetting: false,
                        value: 'value'
                    },
                    {
                        name: 'variablecase_SETTING',
                        slotSetting: false,
                        value: 'value'
                    },
                    {
                        name: 'unmatched_environment_VARIABLE',
                        slotSetting: false,
                        value: 'value'
                    },
                    {
                        name: 'slot_setting',
                        slotSetting: true,
                        value: 'value'
                    }
                ];

                environmentAppSettings = [
                    {
                        name: 'uppercase_setting',
                        slotSetting: false,
                        value: 'value-new'
                    },
                    {
                        name: 'LOWERCASE_SETTING',
                        slotSetting: false,
                        value: 'value-new'
                    },
                    {
                        name: 'VARIABLECASE_setting',
                        slotSetting: false,
                        value: 'value-new'
                    },
                    {
                        name: 'slot_setting',
                        slotSetting: true,
                        value: 'value-new'
                    }
                ];

                const fileAppSettings: AppConfiguration = {
                    appSettings: existingAppSettings
                };

                (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(fileAppSettings));
            });

            test('should return a value', () => {
                const result = builder.buildNewAppSettings('file.json', environmentAppSettings);
                expect(result).not.toBeNull();
            })

            test('should add file setting regardless of match in environment', () => {
                const result = builder.buildNewAppSettings('file.json', environmentAppSettings);

                const unmatchedIndex = result.appSettings.findIndex(setting => setting.name === 'unmatched_environment_VARIABLE');

                expect(unmatchedIndex).not.toBe(-1);
                if (unmatchedIndex != -1) {
                    expect(result.appSettings[unmatchedIndex].value).toBe('value');
                }
            });

            test('should patch value of environment matched app setting', () => {
                const result = builder.buildNewAppSettings('file.json', environmentAppSettings);

                const matchedIndex = result.appSettings.findIndex(setting => setting.name === 'slot_setting');

                expect(result.appSettings[matchedIndex].value).toBe('value-new');
            });
        });
    });
});
