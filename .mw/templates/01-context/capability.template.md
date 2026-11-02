# {{CAPABILITY_ID}}: {{CAPABILITY_NAME}}

> **Level:** {{LEVEL}} (L0-L4)
> **Domain:** {{DOMAIN}}
> **Last Updated:** {{TIMESTAMP}}
> **Baseline Version:** {{BASELINE_VERSION}}

## Summary

{{SUMMARY}}

## Business Context

### Purpose
{{PURPOSE}}

### Stakeholders
| Role | Responsibility |
|------|----------------|
| {{STAKEHOLDER_ROLE}} | {{STAKEHOLDER_RESPONSIBILITY}} |

### Business Rules

| ID | Rule | Source | Confidence |
|----|------|--------|------------|
| BR-001 | {{RULE_TEXT}} | {{SOURCE}} | `STATED` \| `DERIVED` |

## Technical Context

### Components
| Component | Repository | Purpose |
|-----------|------------|---------|
| {{COMPONENT_NAME}} | {{REPO}} | {{COMPONENT_PURPOSE}} |

### Dependencies
- **Upstream:** {{UPSTREAM_CAPABILITIES}}
- **Downstream:** {{DOWNSTREAM_CAPABILITIES}}

### Contracts
| Contract | Type | Location |
|----------|------|----------|
| {{CONTRACT_NAME}} | API \| Event \| Schema | {{CONTRACT_LOCATION}} |

## Behavioural Specification

### Invariants
| ID | Invariant | Enforcement |
|----|-----------|-------------|
| INV-001 | {{INVARIANT_TEXT}} | {{ENFORCEMENT_MECHANISM}} |

### State Transitions
```
{{STATE_DIAGRAM}}
```

### Edge Cases
| Scenario | Expected Behaviour | Test Reference |
|----------|-------------------|----------------|
| {{SCENARIO}} | {{BEHAVIOUR}} | {{TEST_REF}} |

## Integration Points

### APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| {{ENDPOINT}} | {{METHOD}} | {{API_PURPOSE}} |

### Events
| Event | Direction | Schema |
|-------|-----------|--------|
| {{EVENT_NAME}} | Published \| Consumed | {{SCHEMA_REF}} |

## Open Questions

- [ ] **{{QUESTION_OWNER}}:** {{QUESTION_TEXT}}

## Change History

| Version | Date | Change | Author |
|---------|------|--------|--------|
| {{VERSION}} | {{DATE}} | {{CHANGE_DESCRIPTION}} | {{AUTHOR}} |
