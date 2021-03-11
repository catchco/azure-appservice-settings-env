"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (prefix, slotName, input) => {
    const rawObject = input || process.env;
    const environmentKeys = Object.keys(rawObject).filter(e => {
        if (prefix && prefix.length > 0) {
            return e.toUpperCase().startsWith(prefix.toUpperCase());
        }
        else if (!prefix || prefix.length == 0) {
            return true;
        }
    });
    const environmentValues = [];
    environmentKeys.forEach(key => {
        let keyName = prefix && prefix.length > 0 ? key.substring(prefix.length + 1) : key;
        const isRemoval = keyName.toUpperCase().startsWith('REMOVE_');
        const isSlot = !isRemoval && keyName.toUpperCase().startsWith('SLOT_');
        if (isRemoval) {
            keyName = keyName.substring(7);
        }
        var envSlotName = undefined;
        if (!isRemoval && isSlot) {
            keyName = keyName.substring(5);
            envSlotName = keyName.substring(0, keyName.indexOf('_'));
            keyName = keyName.substring(envSlotName.length + 1);
        }
        if (!envSlotName || envSlotName.toUpperCase() === slotName.toUpperCase()) {
            environmentValues.push({
                name: keyName,
                value: rawObject[keyName],
                type: isRemoval ? 'REMOVE' : isSlot ? 'SLOT' : 'ADD'
            });
        }
    });
    return environmentValues;
};
