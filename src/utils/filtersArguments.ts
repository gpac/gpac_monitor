/**
 * Convert argument value to GPAC-compatible string format
 * GPAC parses all arguments as strings internally, so we normalize
 * values to their string representation according to type
 */
export function convertArgumentValue(value: any, type: string): string | null {
  if (value === null || value === undefined) return null;

  // Handle specific types - convert to string format expected by GPAC
  switch (type) {
    case 'bool':
      // GPAC expects "true"/"false" or "1"/"0"
      if (typeof value === 'boolean') return value ? 'true' : 'false';
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        return lower === 'true' || lower === '1' ? 'true' : 'false';
      }
      return value ? 'true' : 'false';

    case 'uint':
    case 'sint':
    case 'luint':
    case 'lsint': {
      const parsed = parseInt(String(value), 10);
      if (isNaN(parsed)) {
        console.warn(`Invalid integer value: ${value}, using 0`);
        return '0';
      }
      return String(parsed);
    }

    case 'flt':
    case 'dbl': {
      const parsed = parseFloat(String(value));
      if (isNaN(parsed)) {
        console.warn(`Invalid float value: ${value}, using 0.0`);
        return '0.0';
      }
      return String(parsed);
    }

    case 'frac':
    case 'lfrac':
      // Ensure consistent fraction format (num/den)
      if (typeof value === 'string' && value.includes('/')) {
        return value.trim();
      } else if (
        typeof value === 'object' &&
        'num' in value &&
        'den' in value
      ) {
        return `${value.num}/${value.den}`;
      } else {
        return `${value}/1`; // Default denominator
      }

    // For list types, ensure they're properly formatted as comma-separated
    case 'strl':
    case 'uintl':
    case 'sintl':
    case '4ccl':
      if (Array.isArray(value)) {
        return value.map((v) => String(v).trim()).join(',');
      }
      return String(value).trim();

    default:
      return String(value).trim();
  }
}

/**
 * Convert enum string value to GPAC index (for sending to server)
 * Handles two formats:
 * - "0=no|1=v|2=h|3=vh|4=hv" returns "3" for "vh"
 * - "no|v|h|vh|hv" returns "3" for "vh" (position-based)
 */
export function convertEnumValueToIndex(
  value: string,
  minMaxEnum: string,
): string {
  if (!minMaxEnum || !value) return value;

  const options = minMaxEnum.split('|');

  for (let i = 0; i < options.length; i++) {
    const trimmed = options[i].trim();

    if (trimmed.includes('=')) {
      // Format: "0=no|1=v|2=h|3=vh|4=hv"
      const [index, enumValue] = trimmed.split('=');
      if (enumValue.trim() === value.trim()) {
        return index.trim();
      }
    } else {
      // Format: "no|v|h|vh|hv" - use position as index
      if (trimmed === value.trim()) {
        return String(i);
      }
    }
  }

  return value;
}

/**
 * Convert GPAC enum index to string value (for displaying from server)
 * Handles two formats:
 * - "3" with enum "0=no|1=v|2=h|3=vh|4=hv" returns "vh"
 * - "3" with enum "no|v|h|vh|hv" returns "vh" (position-based)
 */
export function convertEnumIndexToValue(
  index: string | number,
  minMaxEnum: string,
): string {
  if (!minMaxEnum) return String(index);

  const indexNum = typeof index === 'number' ? index : parseInt(index, 10);
  const options = minMaxEnum.split('|');

  // Check if options use "index=value" format
  const hasExplicitIndex = options.some((opt) => opt.includes('='));

  if (hasExplicitIndex) {
    // Format: "0=no|1=v|2=h|3=vh|4=hv"
    for (const opt of options) {
      const trimmed = opt.trim();
      if (trimmed.includes('=')) {
        const [optIndex, enumValue] = trimmed.split('=');
        if (parseInt(optIndex.trim(), 10) === indexNum) {
          return enumValue.trim();
        }
      }
    }
  } else {
    // Format: "no|v|h|vh|hv" - use position as index
    if (indexNum >= 0 && indexNum < options.length) {
      return options[indexNum].trim();
    }
  }

  return String(index);
}

/**
 * Determines if an argument is of enum type by analyzing its metadata
 */
export function isEnumArgument(argument: any): boolean {
  // Check for explicit enum type
  if (argument.type === 'enum') return true;

  // Check min_max_enum format that indicates an enum
  if (
    argument.min_max_enum &&
    (argument.min_max_enum.includes('|') || argument.min_max_enum.includes('='))
  ) {
    const parts = argument.min_max_enum.split('|');
    if (parts.length > 1) {
      // Multiple options separated by |
      return true;
    }

    // Check for key=value pairs
    if (parts[0].includes('=')) {
      return true;
    }
  }

  return false;
}
