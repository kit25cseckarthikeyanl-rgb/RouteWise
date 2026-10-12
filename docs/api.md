# RouteWise API Reference

Base URL: `http://localhost:8080/api`. All endpoints except `/auth/**` require `Authorization: Bearer <token>`. Full request/response examples: `docs/RouteWise.postman_collection.json`.

Response envelope:
```json
{ "success": true, "message": "OK", "data": { }, "errorCode": null, "timestamp": "2026-09-17T10:00:00" }
```
Error envelope (4xx/5xx):
```json
{ "timestamp": "...", "status": 400, "error": "VALIDATION_ERROR", "message": "...", "path": "/api/..." }
```

## Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | `{ name, email, password, phone?, role }` → `AuthResponse` (token + user) |
| POST | `/auth/login` | `{ email, password }` → `AuthResponse` |
| GET | `/auth/me` | Current user profile |

## Users
| Method | Path | Auth |
|---|---|---|
| GET | `/users` | ADMIN only |
| GET | `/users/{id}` | any authenticated user |
| PUT | `/users/{id}` | update name/phone |
| DELETE | `/users/{id}` | ADMIN only |

## Emergencies
| Method | Path | Notes |
|---|---|---|
| POST | `/emergencies` | Citizen creates; triggers dispatch automatically |
| GET | `/emergencies` | Citizens see only their own; other roles see all |
| GET | `/emergencies/{id}` | |
| PUT | `/emergencies/{id}/status` | `{ status }` — any valid `EmergencyStatus` |
| POST | `/emergencies/{id}/dispatch` | Re-run ranking + assignment |
| POST | `/emergencies/{id}/accept` | Driver accepts; triggers route calc + hospital ranking |
| POST | `/emergencies/{id}/cancel` | |
| POST | `/emergencies/{id}/simulate/{ambulanceId}` | Start DEMO SIMULATION MODE |
| POST | `/emergencies/simulate/{ambulanceId}/stop` | Stop simulation |

## Ambulances
| Method | Path |
|---|---|
| GET | `/ambulances` |
| GET | `/ambulances/{id}` |
| POST | `/ambulances` |
| PUT | `/ambulances/{id}/status` |
| PUT | `/ambulances/{id}/location` |

## Drivers
| Method | Path |
|---|---|
| GET | `/drivers` |
| GET | `/drivers/me` — current logged-in driver's profile |
| GET | `/drivers/{id}` |
| GET | `/drivers/{id}/assignments` |

## Hospitals
| Method | Path |
|---|---|
| GET | `/hospitals` |
| POST | `/hospitals` |
| PUT | `/hospitals/{id}/status` |
| PUT | `/hospitals/{id}/capacity` |

## Routes
| Method | Path | Notes |
|---|---|---|
| POST | `/routes/calculate` | Default (A*, simulated traffic 1.2×) |
| POST | `/routes/dijkstra` | `{ sourceLatitude, sourceLongitude, destinationLatitude, destinationLongitude, trafficFactor? }` |
| POST | `/routes/astar` | Same body shape |

## Dispatch
| Method | Path | Notes |
|---|---|---|
| POST | `/dispatch/{emergencyId}/rank` | Returns the full ranked ambulance list with reasons |
| POST | `/dispatch/{emergencyId}/assign` | Assigns the top-ranked ambulance |

## Dashboard
| Method | Path |
|---|---|
| GET | `/dashboard/summary` |
| GET | `/dashboard/analytics` |
| GET | `/dashboard/active-emergencies` |
| GET | `/dashboard/ambulances` |

## Notifications
| Method | Path |
|---|---|
| GET | `/notifications` |
| PUT | `/notifications/{id}/read` |

## Audit logs
| Method | Path | Auth |
|---|---|---|
| GET | `/audit-logs?page=&size=` | ADMIN only |
