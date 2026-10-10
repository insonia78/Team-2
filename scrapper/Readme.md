# Devpost hackathon scraper

This service exposes an Express endpoint that scrapes hackathon data from `https://devpost.com/api/hackathons` and returns a cleaner JSON response.

MongoDB is wired so the scraper can persist normalized hackathons to a `hackathons` collection.

## Run

```bash
npm start
```

The server uses port `3000` by default. You can override it with `PORT`.

## MongoDB configuration

Set `MONGODB_CONNECTION_STRING` in your local `.env` file before using the persistence routes.

## Endpoints

- `GET /` - health check and quick usage info
- `GET /hackathons` - fetch and normalize Devpost hackathons
- `GET /hackathons?persist=true` - fetch, normalize, and store hackathons in MongoDB
- `GET /hackathons/cache` - return the cached MongoDB documents

Example:

```bash
curl "http://localhost:3000/hackathons?page=1"
```

Persist results to MongoDB:

```bash
curl "http://localhost:3000/hackathons?persist=true&page=1"
```