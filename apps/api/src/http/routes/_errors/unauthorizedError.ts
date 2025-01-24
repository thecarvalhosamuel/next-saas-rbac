export class UnautorizedError extends Error {
  constructor(message?: string) {
    super(message ?? 'Unauthorized')
  }
}
