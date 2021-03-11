import getEnvironmentVariables from '../utilities/environment-reader';

describe ('app-settings environment reader', () => {

    describe('reading environment variables with prefix', () => {
        const prefix = 'TEST';
        const slotName = 'test';        
        let environmentSettings: object;

        beforeAll(() => {
            environmentSettings = {
                'TEST_APPSETTING': 'value',
                'TEST_SLOT_TEST_SLOTAPPSETTING': 'value',
                'TEST_SLOT_NOTTEST_UNMATCHEDSLOTAPPSETTING': 'value',
                'TEST_REMOVE_RMVAPPSETTING': 'value'
            };
        });

        test('should remove prefix', () => {
            let result = getEnvironmentVariables(prefix, slotName, environmentSettings);

            expect(result.findIndex(v => v.name.startsWith(prefix))).toBe(-1);
        });

        test('should set proper name for slot setting', () => {
            let result = getEnvironmentVariables(prefix, slotName, environmentSettings);

            const variableIndex = result.findIndex(r => r.name === 'SLOTAPPSETTING');

            expect(variableIndex).not.toBe(-1);
        });

        test('should set type to SLOT for slot setting', () => {
            let result = getEnvironmentVariables(prefix, slotName, environmentSettings);

            const variableIndex = result.findIndex(r => r.name === 'SLOTAPPSETTING');
            const slotType = result[variableIndex].type

            expect(slotType).toBe('SLOT');
        });

        test('should exclude settings where slot name does not match', () => {
            let result = getEnvironmentVariables(prefix, slotName, environmentSettings);

            const variableIndex = result.findIndex(r => r.name === 'UNMATCHEDSLOTAPPSETTING');

            expect(variableIndex).toBe(-1);
        });

        test('should set proper name for removal setting', () => {
            let result = getEnvironmentVariables(prefix, slotName, environmentSettings);

            const variableIndex = result.findIndex(r => r.name === 'RMVAPPSETTING');

            expect(variableIndex).not.toBe(-1);
        });

        test('should set type to REMOVE for removal setting', () => {
            let result = getEnvironmentVariables(prefix, slotName, environmentSettings);

            const variableIndex = result.findIndex(r => r.name === 'RMVAPPSETTING');
            const slotType = result[variableIndex].type

            expect(slotType).toBe('REMOVE');
        });
    });

    describe('reading environment variables without prefix', () => {
        const prefix = undefined;
        const slotName = 'test';        
        let environmentSettings: object;

        beforeAll(() => {
            environmentSettings = {
                'APPSETTING': 'value',
                'SLOT_TEST_SLOTAPPSETTING': 'value',
                'SLOT_NOTTEST_UNMATCHEDSLOTAPPSETTING': 'value',
                'REMOVE_RMVAPPSETTING': 'value'
            };
        });

        test('should set proper name for slot setting', () => {
            let result = getEnvironmentVariables(prefix, slotName, environmentSettings);

            const variableIndex = result.findIndex(r => r.name === 'SLOTAPPSETTING');

            expect(variableIndex).not.toBe(-1);
        });

        test('should set type to SLOT for slot setting', () => {
            let result = getEnvironmentVariables(prefix, slotName, environmentSettings);

            const variableIndex = result.findIndex(r => r.name === 'SLOTAPPSETTING');
            const slotType = result[variableIndex].type

            expect(slotType).toBe('SLOT');
        });

        test('should exclude settings where slot name does not match', () => {
            let result = getEnvironmentVariables(prefix, slotName, environmentSettings);

            const variableIndex = result.findIndex(r => r.name === 'UNMATCHEDSLOTAPPSETTING');

            expect(variableIndex).toBe(-1);
        });

        test('should set proper name for removal setting', () => {
            let result = getEnvironmentVariables(prefix, slotName, environmentSettings);

            const variableIndex = result.findIndex(r => r.name === 'RMVAPPSETTING');

            expect(variableIndex).not.toBe(-1);
        });

        test('should set type to REMOVE for removal setting', () => {
            let result = getEnvironmentVariables(prefix, slotName, environmentSettings);

            const variableIndex = result.findIndex(r => r.name === 'RMVAPPSETTING');
            const slotType = result[variableIndex].type

            expect(slotType).toBe('REMOVE');
        });
    });
});
