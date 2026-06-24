export function normalizePhoneNumber(phone) {
  const compactPhone = phone.replace(/\s+/g, '')

  if (compactPhone.startsWith('+')) {
    return compactPhone
  }

  const digitsOnly = compactPhone.replace(/\D/g, '')

  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`
  }

  return compactPhone
}

export function isValidPhoneNumber(phone) {
  return /^\+[1-9]\d{9,14}$/.test(normalizePhoneNumber(phone))
}
