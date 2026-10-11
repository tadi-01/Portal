/** Display semantics only; this does not decide registration eligibility. */
export function registrationStatusClass(status: string): string {
  switch (status.trim().toUpperCase()) {
    case 'REGISTERED':
      return 'chip--success'
    case 'PENDING':
      return 'chip--warning'
    case 'NOT REGISTERED':
    case 'UNREGISTERED':
      return 'chip--danger'
    default:
      return 'chip--neutral'
  }
}
