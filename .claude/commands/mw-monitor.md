---
name: Millwright Monitor
description: Set up monitoring and handle escapes
user-invocable: true
allowed-tools: [Read, Write, Edit, Task]
---

# /mw-monitor

> Set up monitoring and handle escapes

## Usage

```
/mw-monitor [TICKET]
```

## Instructions

# Monitoring (Activity 04)

Set up monitoring and create sensors for escaped defects.

## What Monitor Produces

- `sensors/sensor-*.md` - Sensor definitions for escaped defects

## States Handled

- RELEASED → MONITORING
- MONITORING → CLOSED

## Delegate To

monitoring-agent with skills:
- sensor-authoring

## Key Invariants

- I-21: Every escaped defect leaves a sensor

## Sensor Format

When a defect escapes to production:

```markdown
# Sensor: booking-null-check

## Trigger
Escaped defect TICKET-456: NullPointerException in booking flow

## Detection
- Alert: booking_errors_total > threshold
- Log pattern: "NullPointerException.*BookingService"

## Prevention
- Test added: booking.service.spec.ts:L45
- Policy check: null-safety-booking

## Linked
- Original ticket: TICKET-123
- Defect ticket: TICKET-456
```
