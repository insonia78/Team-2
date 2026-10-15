"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const routes_1 = require("./domains/hackathons/routes");
// The entrypoint now focuses on app bootstrap while domain modules own the business logic.
const DEFAULT_PORT = 3000;
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || DEFAULT_PORT;
app.use(express_1.default.json());
// Root and health endpoints stay lightweight so operators can quickly discover and verify the service.
app.get('/', (_request, response) => {
    response.json({
        message: 'Devpost hackathon scraper is running.',
        endpoints: {
            health: '/health',
            scrape: '/hackathons',
            scrapeAndPersist: '/hackathons?persist=true&page=1',
            persistAll: '/hackathons/persist-all?startPage=1',
            cache: '/hackathons/cache',
        },
    });
});
app.get('/health', (_request, response) => {
    response.json({
        status: 'ok',
    });
});
(0, routes_1.registerHackathonRoutes)(app);
app.listen(port, () => {
    console.log(`Scraper is running at http://localhost:${port}`);
});
