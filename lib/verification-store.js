const globalForVerification = globalThis

if (!globalForVerification.__verificationCodes) {
  globalForVerification.__verificationCodes = new Map()
}

export const verificationCodes = globalForVerification.__verificationCodes

export function setVerificationData(email, data) {
  verificationCodes.set(email, data)
}

export function getVerificationData(email) {
  return verificationCodes.get(email)
}

export function deleteVerificationData(email) {
  verificationCodes.delete(email)
}