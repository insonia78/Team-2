"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzePagination = exports.collectPaginationSignals = exports.classifyPaginationKey = void 0;
const http_1 = require("../../shared/http");
const parsing_1 = require("../../shared/parsing");
// Pagination analysis can run via an AI model, but it always keeps a deterministic fallback path.
const AI_SYSTEM_PROMPT = 'You analyze raw API JSON for pagination evidence. Return JSON only. Never invent fields or values.';
const DEFAULT_AI_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_AI_MODEL = 'gpt-4.1-mini';
const DEFAULT_AI_TIMEOUT_SECONDS = 60;
const MAX_SIGNAL_ARRAY_ITEMS = 3;
const MAX_PAGINATION_ANALYSIS_DEPTH = 6;
const isConfidence = (value) => value === 'high' || value === 'medium' || value === 'low' || value === 'none';
// AI configuration is isolated here so the rest of the app can treat pagination analysis as one service.
const getAiPaginationConfig = () => {
    const apiKey = process.env.AI_API_KEY?.trim() ?? '';
    const baseUrl = process.env.AI_BASE_URL?.trim() || DEFAULT_AI_BASE_URL;
    const model = process.env.AI_MODEL?.trim() || DEFAULT_AI_MODEL;
    const timeoutSeconds = (0, parsing_1.parsePositiveInteger)(process.env.AI_TIMEOUT_SECONDS) ?? DEFAULT_AI_TIMEOUT_SECONDS;
    return {
        enabled: apiKey.length > 0,
        baseUrl,
        apiKey,
        model,
        timeoutMs: timeoutSeconds * 1000,
    };
};
// Deterministic key classification acts as the baseline understanding of common pagination field names.
const classifyPaginationKeyDeterministically = (key, currentPath) => {
    const normalizedKey = key.toLowerCase();
    const normalizedPath = currentPath.toLowerCase();
    if (normalizedKey === 'total_count' || normalizedKey === 'totalcount') {
        return {
            meaning: 'Total number of hackathons available across all pages.',
            confidence: 'high',
        };
    }
    if (normalizedKey === 'per_page' || normalizedKey === 'perpage') {
        return {
            meaning: 'Number of hackathons returned on each page.',
            confidence: 'high',
        };
    }
    if (normalizedKey === 'total_pages' ||
        normalizedKey === 'totalpages' ||
        normalizedKey === 'page_count' ||
        normalizedKey === 'pagecount') {
        return {
            meaning: 'Explicit total page count.',
            confidence: 'high',
        };
    }
    if (normalizedKey === 'page' ||
        normalizedKey === 'current_page' ||
        normalizedKey === 'currentpage') {
        return {
            meaning: 'Current page index for the API response.',
            confidence: 'medium',
        };
    }
    if (normalizedKey === 'next_page' ||
        normalizedKey === 'nextpage' ||
        normalizedKey === 'prev_page' ||
        normalizedKey === 'prevpage') {
        return {
            meaning: 'Pagination cursor pointing to a neighboring page.',
            confidence: 'medium',
        };
    }
    if (normalizedKey === 'limit' || normalizedKey === 'offset') {
        return {
            meaning: 'Offset/limit pagination signal.',
            confidence: 'medium',
        };
    }
    if ((normalizedKey === 'count' || normalizedKey === 'total') &&
        (normalizedPath.includes('.meta') || normalizedPath.includes('.pagination'))) {
        return {
            meaning: 'Count-like field that may help estimate pagination coverage.',
            confidence: 'low',
        };
    }
    return null;
};
// The deterministic collector traverses the JSON tree and extracts only primitive values that look pagination-related.
const collectPaginationSignalsDeterministically = (value, currentPath = 'payload', depth = 0) => {
    if (depth > MAX_PAGINATION_ANALYSIS_DEPTH || value === null || value === undefined) {
        return [];
    }
    if (Array.isArray(value)) {
        return value
            .slice(0, MAX_SIGNAL_ARRAY_ITEMS)
            .flatMap((item, index) => collectPaginationSignalsDeterministically(item, `${currentPath}[${index}]`, depth + 1));
    }
    if (typeof value !== 'object') {
        return [];
    }
    const signals = [];
    for (const [key, nestedValue] of Object.entries(value)) {
        const nextPath = `${currentPath}.${key}`;
        const paginationHint = classifyPaginationKeyDeterministically(key, nextPath);
        const primitiveValue = (0, parsing_1.getPrimitiveValue)(nestedValue);
        if (paginationHint && primitiveValue !== undefined) {
            signals.push({
                path: nextPath,
                value: primitiveValue,
                meaning: paginationHint.meaning,
                confidence: paginationHint.confidence,
            });
        }
        signals.push(...collectPaginationSignalsDeterministically(nestedValue, nextPath, depth + 1));
    }
    return signals;
};
// The deterministic analyzer computes totals directly from known fields when AI is unavailable.
const analyzePaginationDeterministically = (payload, requestedPage) => {
    const signals = collectPaginationSignalsDeterministically(payload);
    const explicitTotalCount = typeof payload.meta?.total_count === 'number' && payload.meta.total_count >= 0
        ? payload.meta.total_count
        : null;
    const explicitPerPage = typeof payload.meta?.per_page === 'number' && payload.meta.per_page > 0
        ? payload.meta.per_page
        : null;
    const explicitTotalPages = typeof payload.meta?.total_pages === 'number' && payload.meta.total_pages > 0
        ? payload.meta.total_pages
        : null;
    const inferredPerPage = explicitPerPage ??
        (requestedPage === 1 && payload.hackathons.length > 0 ? payload.hackathons.length : null);
    const totalPages = explicitTotalPages ??
        (explicitTotalCount !== null && inferredPerPage !== null
            ? Math.ceil(explicitTotalCount / inferredPerPage)
            : null);
    let confidence = 'none';
    if (explicitTotalPages !== null || (explicitTotalCount !== null && explicitPerPage !== null)) {
        confidence = 'high';
    }
    else if (explicitTotalCount !== null && inferredPerPage !== null) {
        confidence = 'medium';
    }
    else if (signals.length > 0) {
        confidence = 'low';
    }
    let recommendation = 'No reliable page count was found in the first fetch response.';
    if (totalPages !== null) {
        recommendation = `Fetch pages 1 through ${totalPages} to enumerate the current Devpost hackathon catalog.`;
    }
    else if (explicitTotalCount !== null) {
        recommendation = `The response exposes a total count of ${explicitTotalCount}, but it does not expose enough pagination detail to calculate a safe last page.`;
    }
    else if (signals.length > 0) {
        recommendation = 'Pagination hints were detected, but none were strong enough to calculate the full page range.';
    }
    return {
        analysisEngine: 'deterministic',
        requestedPage,
        hackathonsOnPage: payload.hackathons.length,
        totalCount: explicitTotalCount,
        perPage: inferredPerPage,
        totalPages,
        hasMorePages: totalPages !== null ? requestedPage < totalPages : null,
        canFetchAllPages: totalPages !== null,
        confidence,
        signals,
        recommendation,
    };
};
// The AI response is normalized back into strict local types before the API uses it.
const normalizePaginationClassifications = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }
    const classifications = [];
    for (const item of value) {
        if (typeof item !== 'object' || item === null) {
            continue;
        }
        const candidate = item;
        if (typeof candidate.key === 'string' &&
            typeof candidate.meaning === 'string' &&
            isConfidence(candidate.confidence) &&
            candidate.confidence !== 'none') {
            classifications.push({
                key: candidate.key,
                path: typeof candidate.path === 'string' ? candidate.path : undefined,
                meaning: candidate.meaning,
                confidence: candidate.confidence,
            });
        }
    }
    return classifications;
};
const normalizePaginationModelSummary = (value, fallback) => {
    if (typeof value !== 'object' || value === null) {
        return {
            totalCount: fallback.totalCount,
            perPage: fallback.perPage,
            totalPages: fallback.totalPages,
            hasMorePages: fallback.hasMorePages,
            canFetchAllPages: fallback.canFetchAllPages,
            confidence: fallback.confidence,
            recommendation: fallback.recommendation,
        };
    }
    const candidate = value;
    const totalCount = (0, parsing_1.parseNonNegativeInteger)(candidate.totalCount) ?? fallback.totalCount;
    const perPage = (0, parsing_1.parsePositiveInteger)(candidate.perPage) ?? fallback.perPage;
    const totalPages = (0, parsing_1.parsePositiveInteger)(candidate.totalPages) ?? fallback.totalPages;
    const hasMorePages = (0, parsing_1.toNullableBoolean)(candidate.hasMorePages) ?? fallback.hasMorePages;
    const canFetchAllPages = typeof candidate.canFetchAllPages === 'boolean'
        ? candidate.canFetchAllPages
        : fallback.canFetchAllPages;
    const confidence = isConfidence(candidate.confidence)
        ? candidate.confidence
        : fallback.confidence;
    const recommendation = typeof candidate.recommendation === 'string' && candidate.recommendation.trim() !== ''
        ? candidate.recommendation
        : fallback.recommendation;
    return {
        totalCount,
        perPage,
        totalPages,
        hasMorePages,
        canFetchAllPages,
        confidence,
        recommendation,
    };
};
// The prompt constrains the model to pagination evidence only so the response can be validated safely.
const buildPaginationAnalysisPrompt = (payload, requestedPage) => [
    'Inspect this API JSON and determine which fields are valid pagination evidence.',
    'Return JSON with this exact shape:',
    '{',
    '  "classifications": [',
    '    {',
    '      "key": "field_name",',
    '      "path": "payload.meta.total_count",',
    '      "meaning": "why this field matters for pagination",',
    '      "confidence": "high | medium | low"',
    '    }',
    '  ],',
    '  "summary": {',
    '    "totalCount": 0,',
    '    "perPage": 0,',
    '    "totalPages": 0,',
    '    "hasMorePages": true,',
    '    "canFetchAllPages": true,',
    '    "confidence": "high | medium | low | none",',
    '    "recommendation": "plain-English advice"',
    '  }',
    '}',
    'Rules:',
    '- Only include fields that genuinely indicate pagination, page counts, page cursors, offsets, or total item counts.',
    '- Do not include per-item popularity metrics such as registrations_count unless they directly prove pagination.',
    '- Never invent values or field paths.',
    '- You may derive totalPages only from values present in the payload.',
    `- The requested page is ${requestedPage}.`,
    '',
    `Payload:\n${JSON.stringify(payload, null, 2)}`,
].join('\n');
const requestPaginationModelResponse = async (payload, requestedPage, fallback) => {
    const aiConfig = getAiPaginationConfig();
    if (!aiConfig.enabled) {
        return {
            classifications: fallback.signals.map((signal) => ({
                key: signal.path.split('.').at(-1) ?? signal.path,
                path: signal.path,
                meaning: signal.meaning,
                confidence: signal.confidence,
            })),
            summary: {
                totalCount: fallback.totalCount,
                perPage: fallback.perPage,
                totalPages: fallback.totalPages,
                hasMorePages: fallback.hasMorePages,
                canFetchAllPages: fallback.canFetchAllPages,
                confidence: fallback.confidence,
                recommendation: fallback.recommendation,
            },
        };
    }
    const completionUrl = `${aiConfig.baseUrl.replace(/\/$/, '')}/chat/completions`;
    const completionResponse = await (0, http_1.requestJson)(completionUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${aiConfig.apiKey}`,
        },
        body: {
            model: aiConfig.model,
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: AI_SYSTEM_PROMPT,
                },
                {
                    role: 'user',
                    content: buildPaginationAnalysisPrompt(payload, requestedPage),
                },
            ],
        },
        timeoutMs: aiConfig.timeoutMs,
    });
    if (!completionResponse.ok) {
        throw new Error(`AI pagination analyzer request failed with status ${completionResponse.statusCode}.`);
    }
    const aiContent = completionResponse.body.choices?.[0]?.message?.content;
    if (typeof aiContent !== 'string' || aiContent.trim() === '') {
        throw new Error('AI pagination analyzer returned an empty completion payload.');
    }
    let parsedContent;
    try {
        parsedContent = JSON.parse(aiContent);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown JSON parse error';
        throw new Error(`AI pagination analyzer returned invalid JSON: ${message}`);
    }
    const record = typeof parsedContent === 'object' && parsedContent !== null
        ? parsedContent
        : {};
    return {
        classifications: normalizePaginationClassifications(record.classifications),
        summary: normalizePaginationModelSummary(record.summary, fallback),
    };
};
// AI classifications are preferred, but deterministic inference still fills any gaps the model leaves behind.
const classifyPaginationKey = (key, currentPath, classifications) => {
    const exactMatch = classifications.find((classification) => classification.path === currentPath ||
        (classification.path === undefined && classification.key === key));
    if (exactMatch) {
        return {
            meaning: exactMatch.meaning,
            confidence: exactMatch.confidence,
        };
    }
    return classifyPaginationKeyDeterministically(key, currentPath);
};
exports.classifyPaginationKey = classifyPaginationKey;
const collectPaginationSignals = (value, classifications, currentPath = 'payload', depth = 0) => {
    if (depth > MAX_PAGINATION_ANALYSIS_DEPTH || value === null || value === undefined) {
        return [];
    }
    if (Array.isArray(value)) {
        return value
            .slice(0, MAX_SIGNAL_ARRAY_ITEMS)
            .flatMap((item, index) => (0, exports.collectPaginationSignals)(item, classifications, `${currentPath}[${index}]`, depth + 1));
    }
    if (typeof value !== 'object') {
        return [];
    }
    const signals = [];
    for (const [key, nestedValue] of Object.entries(value)) {
        const nextPath = `${currentPath}.${key}`;
        const paginationHint = (0, exports.classifyPaginationKey)(key, nextPath, classifications);
        const primitiveValue = (0, parsing_1.getPrimitiveValue)(nestedValue);
        if (paginationHint && primitiveValue !== undefined) {
            signals.push({
                path: nextPath,
                value: primitiveValue,
                meaning: paginationHint.meaning,
                confidence: paginationHint.confidence,
            });
        }
        signals.push(...(0, exports.collectPaginationSignals)(nestedValue, classifications, nextPath, depth + 1));
    }
    return signals;
};
exports.collectPaginationSignals = collectPaginationSignals;
const analyzePagination = async (payload, requestedPage) => {
    const fallbackAnalysis = analyzePaginationDeterministically(payload, requestedPage);
    const modelResponse = await requestPaginationModelResponse(payload, requestedPage, fallbackAnalysis);
    const signals = (0, exports.collectPaginationSignals)(payload, modelResponse.classifications);
    return {
        analysisEngine: getAiPaginationConfig().enabled ? 'ai' : 'deterministic',
        requestedPage,
        hackathonsOnPage: payload.hackathons.length,
        totalCount: modelResponse.summary.totalCount,
        perPage: modelResponse.summary.perPage,
        totalPages: modelResponse.summary.totalPages,
        hasMorePages: modelResponse.summary.hasMorePages,
        canFetchAllPages: modelResponse.summary.canFetchAllPages,
        confidence: modelResponse.summary.confidence,
        signals,
        recommendation: modelResponse.summary.recommendation,
    };
};
exports.analyzePagination = analyzePagination;
