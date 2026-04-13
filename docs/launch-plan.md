# Launch Plan

## Launch topology
- API service (horizontal-ready)
- PostgreSQL primary
- Redis for OTP and dashboard hot cache
- Admin web deployment
- Mobile app configured to stable API URL

## Expected load
- 2,000+ registrations
- Burst onboarding traffic around event windows
- Dashboard polling every 10-20 seconds

## Ops checklist
- Verify DB migration status
- Confirm Redis connectivity
- Enable structured logs + request IDs
- Test OTP cooldown and retry flows
- Validate dashboard summary response times
- Confirm health endpoint and alerts

## Rollback/fallback
- Switch to mock OTP provider fallback in controlled mode
- Disable expensive dashboard slices if degraded
- Use cached summaries when DB load spikes

## Event-day support actions
- Assign API and dashboard on-call ownership
- Monitor OTP failure rate and request latency
- Run hourly data integrity checks (registrations vs dashboard aggregates)
