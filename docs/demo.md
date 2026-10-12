# RouteWise — 10-Minute Demo Script

All accounts and data below are fictional/simulated. Password for every seeded demo account is whatever `DEMO_PASSWORD` is set to (default `Demo@1234`, see `.env.example`).

| Role | Email |
|---|---|
| Admin | `admin@routewise.demo` |
| Citizen | `citizen@routewise.demo` |
| Driver | `driver1@routewise.demo` … `driver5@routewise.demo` |
| Hospital | `hospital1@routewise.demo` |

## Steps

1. **Landing page** (`/`) — walk through the hero, problem/solution, and workflow sections.
2. **Citizen login** — log in as `citizen@routewise.demo`.
3. **Create a CRITICAL emergency** — go to *Create emergency*, choose `ACCIDENT` + `CRITICAL`, click **Use my location** (falls back to a demo coordinate if browser GPS is unavailable/denied), and submit.
4. **Show emergency created** — the emergency detail page opens immediately with a request number like `RW-2026-000011` and status `SEARCHING_RESOURCE` → `ASSIGNED` (dispatch runs synchronously on creation).
5. **Show resource ranking & reasoning** — as admin (separate browser/incognito), open *Admin → Emergencies*, or call `POST /api/dispatch/{id}/rank` in Postman, to show the full ranked ambulance list with each one's `selectionReason` — note it is *not* simply the nearest vehicle.
6. **Login as driver** — the ambulance that was assigned belongs to one of `driver1`–`driver5`; log in as that driver in another session.
7. **Driver accepts** — click **Accept assignment** on the driver dashboard. This triggers a Dijkstra route calculation and hospital ranking automatically.
8. **Show Dijkstra vs A***  — as admin, open *Admin → Routes*, enter the same source/destination, and click **Compare Dijkstra vs A\*** to show distance/ETA/nodes-explored side by side.
9. **Show hospital selection** — the emergency detail page (citizen view) now shows the selected hospital and why (ETA, capability, ICU, beds).
10. **Start GPS simulation** — on the driver dashboard, click **Start trip** then **Start demo GPS simulation**. The label "DEMO SIMULATION MODE" is shown — this is clearly not real GPS.
11. **Show live map** — the ambulance marker moves step-by-step across the citizen's map, the driver's map, and the admin's live map, all via the same WebSocket broadcast.
12. **Show citizen tracking** — switch back to the citizen tab; the position updates without a page refresh.
13. **Show hospital notification** — log in as `hospital1@routewise.demo`; the incoming-emergency table shows the case with ETA.
14. **Show admin control room** — summary cards, live map with all markers, active emergency list, hospital/ambulance status tables.
15. **Complete the emergency** — back on the driver dashboard, step through **Arrived at patient → Start trip to hospital → Arrived at hospital → Complete emergency**.
16. **Show analytics** — *Admin → Analytics* now reflects the completed emergency in the type/priority breakdown and completed count.
17. **Show audit log** — *Admin → Audit logs* shows the full trail: `EMERGENCY_CREATED`, `AMBULANCE_ASSIGNED` (with reason), `ROUTE_CALCULATED`, `HOSPITAL_SELECTED`, `STATUS_UPDATED` × N, `EMERGENCY_COMPLETED`.

## Notes for presenters

- All GPS, traffic, and hospital-capacity data are simulated for this academic prototype — say so explicitly if asked.
- The resource-ranking and hospital-ranking reasoning strings are the key differentiator to highlight versus naive nearest-ambulance dispatch.
