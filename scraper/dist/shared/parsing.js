"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrimitiveValue = exports.toNullableBoolean = exports.parseNonNegativeInteger = exports.parsePositiveInteger = void 0;
// Shared parsing helpers keep query strings, env values, and AI payloads consistent across domains.
const parsePositiveInteger = (value) => {
    if (Array.isArray(value)) {
        for (const item of value) {
            const parsed = (0, exports.parsePositiveInteger)(item);
            if (parsed !== null) {
                return parsed;
            }
        }
        return null;
    }
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
        return value;
    }
    if (typeof value !== 'string') {
        return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};
exports.parsePositiveInteger = parsePositiveInteger;
const parseNonNegativeInteger = (value) => {
    if (Array.isArray(value)) {
        for (const item of value) {
            const parsed = (0, exports.parseNonNegativeInteger)(item);
            if (parsed !== null) {
                return parsed;
            }
        }
        return null;
    }
    if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
        return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number.parseInt(value, 10);
        return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
    }
    return null;
};
exports.parseNonNegativeInteger = parseNonNegativeInteger;
const toNullableBoolean = (value) => {
    if (typeof value === 'boolean') {
        return value;
    }
    return null;
};
exports.toNullableBoolean = toNullableBoolean;
const getPrimitiveValue = (value) => {
    if (value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean') {
        return value;
    }
    return undefined;
};
exports.getPrimitiveValue = getPrimitiveValue;
