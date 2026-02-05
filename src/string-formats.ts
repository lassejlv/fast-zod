// String format schemas - top-level validators (Zod v4 style)

import { StringSchema } from './primitives';
import { ParseContext } from './types';

// Pre-compiled regex patterns for performance
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const CUID_REGEX = /^c[a-z0-9]{24}$/;
const CUID2_REGEX = /^[a-z][a-z0-9]{23}$/;
const NANOID_REGEX = /^[a-zA-Z0-9_-]{21}$/;
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_REGEX = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$|^::(?:[a-fA-F0-9]{1,4}:){0,6}[a-fA-F0-9]{1,4}$|^[a-fA-F0-9]{1,4}::(?:[a-fA-F0-9]{1,4}:){0,5}[a-fA-F0-9]{1,4}$|^[a-fA-F0-9]{1,4}:[a-fA-F0-9]{1,4}::(?:[a-fA-F0-9]{1,4}:){0,4}[a-fA-F0-9]{1,4}$|^(?:[a-fA-F0-9]{1,4}:){0,2}[a-fA-F0-9]{1,4}::(?:[a-fA-F0-9]{1,4}:){0,3}[a-fA-F0-9]{1,4}$|^(?:[a-fA-F0-9]{1,4}:){0,3}[a-fA-F0-9]{1,4}::(?:[a-fA-F0-9]{1,4}:){0,2}[a-fA-F0-9]{1,4}$|^(?:[a-fA-F0-9]{1,4}:){0,4}[a-fA-F0-9]{1,4}::(?:[a-fA-F0-9]{1,4}:)?[a-fA-F0-9]{1,4}$|^(?:[a-fA-F0-9]{1,4}:){0,5}[a-fA-F0-9]{1,4}::[a-fA-F0-9]{1,4}$|^(?:[a-fA-F0-9]{1,4}:){0,6}[a-fA-F0-9]{1,4}::$/;
const BASE64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const BASE64URL_REGEX = /^[A-Za-z0-9_-]+$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIME_REGEX = /^\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
const ISO_DURATION_REGEX = /^P(?:\d+Y)?(?:\d+M)?(?:\d+W)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?)?$/;
const EMOJI_REGEX = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u;
const JWT_REGEX = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

// Email schema
export class EmailSchema extends StringSchema {
  _parse(data: unknown, ctx: ParseContext): string {
    const str = super._parse(data, ctx);
    if (!EMAIL_REGEX.test(str)) {
      this._fail('invalid_string', 'Invalid email address', ctx);
    }
    return str;
  }
}

// UUID schema (RFC 4122)
export class UuidSchema extends StringSchema {
  _parse(data: unknown, ctx: ParseContext): string {
    const str = super._parse(data, ctx);
    if (!UUID_REGEX.test(str)) {
      this._fail('invalid_string', 'Invalid UUID', ctx);
    }
    return str;
  }
}

// GUID schema (looser than UUID)
export class GuidSchema extends StringSchema {
  _parse(data: unknown, ctx: ParseContext): string {
    const str = super._parse(data, ctx);
    if (!GUID_REGEX.test(str)) {
      this._fail('invalid_string', 'Invalid GUID', ctx);
    }
    return str;
  }
}

// URL schema
export class UrlSchema extends StringSchema {
  _parse(data: unknown, ctx: ParseContext): string {
    const str = super._parse(data, ctx);
    if (!URL_REGEX.test(str)) {
      this._fail('invalid_string', 'Invalid URL', ctx);
    }
    return str;
  }
}

// ULID schema
export class UlidSchema extends StringSchema {
  _parse(data: unknown, ctx: ParseContext): string {
    const str = super._parse(data, ctx);
    if (!ULID_REGEX.test(str)) {
      this._fail('invalid_string', 'Invalid ULID', ctx);
    }
    return str;
  }
}

// CUID schema
export class CuidSchema extends StringSchema {
  _parse(data: unknown, ctx: ParseContext): string {
    const str = super._parse(data, ctx);
    if (!CUID_REGEX.test(str)) {
      this._fail('invalid_string', 'Invalid CUID', ctx);
    }
    return str;
  }
}

// CUID2 schema
export class Cuid2Schema extends StringSchema {
  _parse(data: unknown, ctx: ParseContext): string {
    const str = super._parse(data, ctx);
    if (!CUID2_REGEX.test(str)) {
      this._fail('invalid_string', 'Invalid CUID2', ctx);
    }
    return str;
  }
}

// NanoID schema
export class NanoidSchema extends StringSchema {
  _parse(data: unknown, ctx: ParseContext): string {
    const str = super._parse(data, ctx);
    if (!NANOID_REGEX.test(str)) {
      this._fail('invalid_string', 'Invalid NanoID', ctx);
    }
    return str;
  }
}

// IPv4 schema
export class Ipv4Schema extends StringSchema {
  _parse(data: unknown, ctx: ParseContext): string {
    const str = super._parse(data, ctx);
    if (!IPV4_REGEX.test(str)) {
      this._fail('invalid_string', 'Invalid IPv4 address', ctx);
    }
    return str;
  }
}

// IPv6 schema
export class Ipv6Schema extends StringSchema {
  _parse(data: unknown, ctx: ParseContext): string {
    const str = super._parse(data, ctx);
    if (!IPV6_REGEX.test(str)) {
      this._fail('invalid_string', 'Invalid IPv6 address', ctx);
    }
    return str;
  }
}

// Base64 schema
export class Base64Schema extends StringSchema {
  _parse(data: unknown, ctx: ParseContext): string {
    const str = super._parse(data, ctx);
    if (!BASE64_REGEX.test(str)) {
      this._fail('invalid_string', 'Invalid Base64 string', ctx);
    }
    return str;
  }
}

// Base64URL schema
export class Base64UrlSchema extends StringSchema {
  _parse(data: unknown, ctx: ParseContext): string {
    const str = super._parse(data, ctx);
    if (!BASE64URL_REGEX.test(str)) {
      this._fail('invalid_string', 'Invalid Base64URL string', ctx);
    }
    return str;
  }
}

// Emoji schema (single emoji)
export class EmojiSchema extends StringSchema {
  _parse(data: unknown, ctx: ParseContext): string {
    const str = super._parse(data, ctx);
    if (!EMOJI_REGEX.test(str)) {
      this._fail('invalid_string', 'Invalid emoji', ctx);
    }
    return str;
  }
}

// JWT schema
export class JwtSchema extends StringSchema {
  _parse(data: unknown, ctx: ParseContext): string {
    const str = super._parse(data, ctx);
    if (!JWT_REGEX.test(str)) {
      this._fail('invalid_string', 'Invalid JWT', ctx);
    }
    return str;
  }
}

// ISO date/time schemas namespace
export const iso = {
  date: () => new IsoDateSchema(),
  time: () => new IsoTimeSchema(),
  datetime: () => new IsoDatetimeSchema(),
  duration: () => new IsoDurationSchema(),
};

class IsoDateSchema extends StringSchema {
  _parse(data: unknown, ctx: ParseContext): string {
    const str = super._parse(data, ctx);
    if (!ISO_DATE_REGEX.test(str)) {
      this._fail('invalid_string', 'Invalid ISO date', ctx);
    }
    return str;
  }
}

class IsoTimeSchema extends StringSchema {
  _parse(data: unknown, ctx: ParseContext): string {
    const str = super._parse(data, ctx);
    if (!ISO_TIME_REGEX.test(str)) {
      this._fail('invalid_string', 'Invalid ISO time', ctx);
    }
    return str;
  }
}

class IsoDatetimeSchema extends StringSchema {
  _parse(data: unknown, ctx: ParseContext): string {
    const str = super._parse(data, ctx);
    if (!ISO_DATETIME_REGEX.test(str)) {
      this._fail('invalid_string', 'Invalid ISO datetime', ctx);
    }
    return str;
  }
}

class IsoDurationSchema extends StringSchema {
  _parse(data: unknown, ctx: ParseContext): string {
    const str = super._parse(data, ctx);
    if (!ISO_DURATION_REGEX.test(str)) {
      this._fail('invalid_string', 'Invalid ISO duration', ctx);
    }
    return str;
  }
}
