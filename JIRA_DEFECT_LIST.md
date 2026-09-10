# Jira Defect List — KAN

## Export Information

| Property | Value |
|---|---|
| Jira site | [phunghao2701.atlassian.net](https://phunghao2701.atlassian.net) |
| Project | My Software Team |
| Project key | `KAN` |
| Project type | Team-managed software |
| Export date | 2026-07-23 |
| Defect representation | Jira `Task` with the `defect` label because the project has no `Bug` issue type |
| JQL | `project = KAN AND labels = defect ORDER BY priority DESC, created ASC` |
| Result | **8 defects** |
| Data source | Jira Cloud through Atlassian Rovo |

## Defect List

| Defect ID | Module | Related Test Case ID | Defect Title | Detailed Description | Severity | Priority | Status | Reporter | Assignee/Fixer | Detected Date | Fixed Date | Notes/Jira link |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KAN-146 | AUTH | ST_005, ST_097 | Public registration allows Administrator privilege escalation | Public registration accepts the `ADMINISTRATOR` role. The account can be activated and used to log in with administrator privileges. | Critical | Highest | To Do | Hao Phung | Unassigned | 2026-07-23 | — | [Open KAN-146](https://phunghao2701.atlassian.net/browse/KAN-146) |
| KAN-147 | SECURITY | N/A | Production database credentials are hard-coded in tracked source files | Two tracked backend source files contain a complete production PostgreSQL connection string with embedded credentials. The credential value is intentionally omitted from this document. | Critical | Highest | To Do | Hao Phung | Unassigned | 2026-07-23 | — | [Open KAN-147](https://phunghao2701.atlassian.net/browse/KAN-147) |
| KAN-148 | PROJECT | ST_073, ST_074 | VIP project activation crashes because a React Hook is called inside an event handler | The VIP activation handler calls `useTranslation()` inside an event handler, violating React Hook rules and potentially stopping the activation flow. | High | High | To Do | Hao Phung | Unassigned | 2026-07-23 | — | [Open KAN-148](https://phunghao2701.atlassian.net/browse/KAN-148) |
| KAN-149 | ADMIN | ST_126 | Create Issue sends issue_number=null to the backend | The modal formats issue number `1` as `No. 1`; the journal store parses that value as `NaN`, and JSON serialization sends `issue_number: null`. | High | High | To Do | Hao Phung | Unassigned | 2026-07-23 | — | [Open KAN-149](https://phunghao2701.atlassian.net/browse/KAN-149) |
| KAN-150 | ADMIN | ST_124, ST_126 | Volume and Issue modals close before the create request completes | The create request is not awaited. The form resets and the modal closes before the server confirms success, including when the request fails. | Medium | High | To Do | Hao Phung | Unassigned | 2026-07-23 | — | [Open KAN-150](https://phunghao2701.atlassian.net/browse/KAN-150) |
| KAN-151 | ADMIN | ST_097, ST_100 | Admin preview pages are accessible without route protection | Admin preview routes are mounted outside frontend authentication and administrator route guards, allowing logged-out users to render the admin preview interface. | High | High | To Do | Hao Phung | Unassigned | 2026-07-23 | — | [Open KAN-151](https://phunghao2701.atlassian.net/browse/KAN-151) |
| KAN-152 | AUTH / ROUTING | ST_001, ST_004 | Invalid or legacy URLs can violate React Hook execution order | `LangLayout` returns before calling `useEffect` for an invalid language segment, allowing a different number of Hooks to run across renders after redirect. | High | High | To Do | Hao Phung | Unassigned | 2026-07-23 | — | [Open KAN-152](https://phunghao2701.atlassian.net/browse/KAN-152) |
| KAN-153 | I18N | ST_002, ST_003 | Some translated labels do not update after changing language | Several labels are translated in module-level constants and remain cached after an in-app language change until a full page reload. | Medium | Medium | To Do | Hao Phung | Unassigned | 2026-07-23 | — | [Open KAN-153](https://phunghao2701.atlassian.net/browse/KAN-153) |

## Summary by Module

| Module | Critical | High | Medium | Total |
|---|---:|---:|---:|---:|
| AUTH | 1 | 0 | 0 | 1 |
| SECURITY | 1 | 0 | 0 | 1 |
| PROJECT | 0 | 1 | 0 | 1 |
| ADMIN | 0 | 2 | 1 | 3 |
| AUTH / ROUTING | 0 | 1 | 0 | 1 |
| I18N | 0 | 0 | 1 | 1 |
| **Total** | **2** | **4** | **2** | **8** |

## Status Summary

| Status | Count |
|---|---:|
| To Do | 8 |
| In Progress | 0 |
| Done | 0 |
| **Total** | **8** |

## Notes

- Every Jira issue contains English reproduction steps, expected behavior, actual behavior, impact, and supporting evidence.
- All issues are currently unassigned.
- Fixed dates remain blank until the corresponding Jira issues are resolved.
- The database credential itself is not copied into Jira or this export.
