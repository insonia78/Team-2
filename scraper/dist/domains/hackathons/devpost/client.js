"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchDevpostPage = exports.buildDevpostUrl = exports.buildDevpostUrlFromQuery = exports.BATCH_QUERY_KEYS_TO_EXCLUDE = exports.SCRAPE_QUERY_KEYS_TO_EXCLUDE = void 0;
const http_1 = require("../../../shared/http");
// Devpost-specific constants and query rules live together so upstream request behavior stays centralized.
const DEVPOST_API_URL = 'https://devpost.com/api/hackathons';
const DEVPOST_REQUEST_HEADERS = {
    Accept: 'application/json',
    'User-Agent': 'devpost-scraper/1.0',
};
exports.SCRAPE_QUERY_KEYS_TO_EXCLUDE = new Set(['persist']);
exports.BATCH_QUERY_KEYS_TO_EXCLUDE = new Set(['persist', 'page', 'startPage', 'maxPages']);
// URL builders preserve user filters while stripping internal control parameters from upstream requests.
const buildDevpostUrlFromQuery = (query, options) => {
    const url = new URL(DEVPOST_API_URL);
    const excludedKeys = options?.excludedKeys ?? new Set();
    for (const [key, value] of Object.entries(query)) {
        if (excludedKeys.has(key)) {
            continue;
        }
        if (Array.isArray(value)) {
            for (const item of value) {
                if (typeof item === 'string') {
                    url.searchParams.append(key, item);
                }
            }
            continue;
        }
        if (typeof value === 'string') {
            url.searchParams.set(key, value);
        }
    }
    if (typeof options?.page === 'number') {
        url.searchParams.set('page', String(options.page));
    }
    return url.toString();
};
exports.buildDevpostUrlFromQuery = buildDevpostUrlFromQuery;
const buildDevpostUrl = (request) => (0, exports.buildDevpostUrlFromQuery)(request.query, { excludedKeys: exports.SCRAPE_QUERY_KEYS_TO_EXCLUDE });
exports.buildDevpostUrl = buildDevpostUrl;
// The Devpost client wraps the shared JSON transport with the hackathon API's request/response contract.
const fetchDevpostPage = async (sourceUrl) => {
    const upstreamResponse = await (0, http_1.requestJson)(sourceUrl, {
        headers: { ...DEVPOST_REQUEST_HEADERS },
    });
    if (!upstreamResponse.ok) {
        return {
            ok: false,
            statusCode: upstreamResponse.statusCode,
        };
    }
    return {
        ok: true,
        payload: upstreamResponse.body,
    };
};
exports.fetchDevpostPage = fetchDevpostPage;
