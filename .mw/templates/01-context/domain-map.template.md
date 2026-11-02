# Domain Map

> **Baseline Version:** {{BASELINE_VERSION}}
> **Generated:** {{TIMESTAMP}}
> **Repositories:** {{REPO_COUNT}}

## Overview

{{DOMAIN_OVERVIEW}}

## Capability Hierarchy

```
{{CAPABILITY_TREE}}
```

### Level 0 (Business Domains)
| ID | Name | Description |
|----|------|-------------|
| L0-{{ID}} | {{NAME}} | {{DESCRIPTION}} |

### Level 1 (Capabilities)
| ID | Parent | Name | Description |
|----|--------|------|-------------|
| L1-{{ID}} | L0-{{PARENT}} | {{NAME}} | {{DESCRIPTION}} |

### Level 2 (Sub-capabilities)
| ID | Parent | Name | Description |
|----|--------|------|-------------|
| L2-{{ID}} | L1-{{PARENT}} | {{NAME}} | {{DESCRIPTION}} |

### Level 3 (Features)
| ID | Parent | Name | Description |
|----|--------|------|-------------|
| L3-{{ID}} | L2-{{PARENT}} | {{NAME}} | {{DESCRIPTION}} |

### Level 4 (Components)
| ID | Parent | Name | Repository | Path |
|----|--------|------|------------|------|
| L4-{{ID}} | L3-{{PARENT}} | {{NAME}} | {{REPO}} | {{PATH}} |

## Repository to Capability Mapping

| Repository | Capabilities | Primary Domain |
|------------|--------------|----------------|
| {{REPO}} | {{CAPABILITY_IDS}} | {{DOMAIN}} |

## Unmapped Code

> Per I-04: Code belonging to no capability must be listed, not silently ignored.

| Repository | Path | Reason | Owner |
|------------|------|--------|-------|
| {{REPO}} | {{PATH}} | {{REASON}} | {{OWNER}} |

## Cross-Cutting Concerns

| Concern | Affected Capabilities | Implementation |
|---------|----------------------|----------------|
| {{CONCERN}} | {{CAPABILITIES}} | {{IMPLEMENTATION}} |

## Domain Boundaries

### Bounded Contexts
| Context | Capabilities | Integration Style |
|---------|--------------|-------------------|
| {{CONTEXT}} | {{CAPABILITIES}} | Sync API \| Async Event \| Shared DB |

### Anti-Corruption Layers
| Source Context | Target Context | Adapter Location |
|----------------|----------------|------------------|
| {{SOURCE}} | {{TARGET}} | {{ADAPTER_PATH}} |

## Statistics

- **Total Capabilities:** {{TOTAL_CAPABILITIES}}
- **Mapped Code Coverage:** {{COVERAGE_PERCENT}}%
- **Unmapped Paths:** {{UNMAPPED_COUNT}}
- **Cross-Repo Dependencies:** {{CROSS_REPO_COUNT}}
