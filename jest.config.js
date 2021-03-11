module.exports = async () => {
    return {
        clearMocks: true,
        moduleFileExtensions: ['js', 'ts'],
        rootDir: './src',
        testEnvironment: 'node',
        testMatch: ['**/__tests__/*.test.ts'],
        testRunner: 'jest-circus/runner',
        transform: {
            '^.+\\.ts$': 'ts-jest'
        },
        verbose: true
    };
};
