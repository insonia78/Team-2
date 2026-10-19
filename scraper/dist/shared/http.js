"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestJson = void 0;
const node_http_1 = require("node:http");
const node_https_1 = require("node:https");
// Shared HTTP transport gives every domain the same JSON parsing and timeout behavior.
const requestJson = (url, options) => new Promise((resolve, reject) => {
    const targetUrl = new URL(url);
    const transport = targetUrl.protocol === 'http:' ? node_http_1.request : node_https_1.request;
    const serializedBody = options.body === undefined ? undefined : JSON.stringify(options.body);
    const headers = {
        ...options.headers,
        ...(serializedBody
            ? {
                'Content-Length': Buffer.byteLength(serializedBody).toString(),
                'Content-Type': options.headers['Content-Type'] ?? 'application/json',
            }
            : {}),
    };
    const upstreamRequest = transport(targetUrl, {
        method: options.method ?? 'GET',
        headers,
    }, (upstreamResponse) => {
        const chunks = [];
        upstreamResponse.setEncoding('utf8');
        upstreamResponse.on('data', (chunk) => {
            chunks.push(chunk);
        });
        upstreamResponse.on('end', () => {
            const statusCode = upstreamResponse.statusCode ?? 500;
            const responseBody = chunks.join('');
            try {
                resolve({
                    ok: statusCode >= 200 && statusCode < 300,
                    statusCode,
                    body: JSON.parse(responseBody),
                });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown JSON parse error';
                reject(new Error(`Failed to parse JSON response from ${targetUrl.origin} (status ${statusCode}): ${message}`));
            }
        });
    });
    upstreamRequest.on('error', reject);
    if (typeof options.timeoutMs === 'number' && options.timeoutMs > 0) {
        upstreamRequest.setTimeout(options.timeoutMs, () => {
            upstreamRequest.destroy(new Error(`Request to ${targetUrl.origin} timed out after ${options.timeoutMs}ms.`));
        });
    }
    if (serializedBody !== undefined) {
        upstreamRequest.write(serializedBody);
    }
    upstreamRequest.end();
});
exports.requestJson = requestJson;
