export function toFieldErrors(issues: Array<{ field: string; message: string }>) {
  return Object.fromEntries(issues.map(issue => [issue.field, issue.message]))
}
