/**
 * Dutch license plate (kenteken) validation and normalization utilities.
 */

/**
 * Normalize a kenteken input:
 * - Remove dashes and spaces
 * - Convert to uppercase
 */
export function normalizeKenteken(input: string): string {
  return input.replace(/[-\s]/g, "").toUpperCase();
}

/**
 * Validate a Dutch kenteken format.
 * Dutch plates follow specific side-code patterns (sidecodes 1-14+).
 * Rather than enforcing all patterns, we do a basic sanity check.
 */
export function validateKenteken(input: string): { valid: boolean; error?: string; normalized: string } {
  const normalized = normalizeKenteken(input);

  if (normalized.length < 4 || normalized.length > 8) {
    return {
      valid: false,
      error: `Kenteken "${input}" is te kort of te lang. Een Nederlands kenteken heeft 4–8 tekens (zonder streepjes). Voorbeeld: GJ680V, 12-AB-CD, H-123-BB.`,
      normalized,
    };
  }

  // Must contain only letters and digits
  if (!/^[A-Z0-9]+$/.test(normalized)) {
    return {
      valid: false,
      error: `Kenteken "${input}" bevat ongeldige tekens. Alleen letters en cijfers zijn toegestaan.`,
      normalized,
    };
  }

  return { valid: true, normalized };
}

/**
 * Format a normalized kenteken back with dashes for display.
 * This is a best-effort formatter based on common sidecode patterns.
 */
export function formatKenteken(normalized: string): string {
  const n = normalized.length;
  if (n <= 4) return normalized;

  // Try common patterns (6-char plates)
  if (n === 6) {
    // XX-99-99 (sidecode 1) or 99-99-XX, etc.
    // Common split: AB-12-CD
    return `${normalized.slice(0, 2)}-${normalized.slice(2, 4)}-${normalized.slice(4, 6)}`;
  }

  // Newer plates (sidecode 10+): X-999-XX, 9-XXX-99, etc.
  // Just return as-is for now
  return normalized;
}
