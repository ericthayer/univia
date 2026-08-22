import { describe, expect, it } from 'vitest';
import { isPublicIp, validateAuditRequest, validateAuditUrl } from './audit-validation';

describe('validateAuditUrl', () => {
  it('accepts a public HTTPS hostname and normalizes it', () => {
    expect(validateAuditUrl('https://example.com/path')?.toString()).toBe('https://example.com/path');
    expect(validateAuditUrl('https://example.com:443/path')?.toString()).toBe('https://example.com/path');
  });

  it('rejects non-HTTPS, credentialed, fragmented, private, and unusual targets', () => {
    const rejected = [
      'http://example.com',
      'https://user:password@example.com',
      'https://example.com/#fragment',
      'https://localhost',
      'https://service.localhost',
      'https://127.0.0.1',
      'https://[::1]',
      'https://2130706433',
      'https://example.com:8443',
      'https://xn--example-dk9c.com',
    ];

    for (const value of rejected) {
      expect(validateAuditUrl(value), value).toBeNull();
    }
  });

  it('rejects malformed or oversized URLs', () => {
    expect(validateAuditUrl('not a URL')).toBeNull();
    expect(validateAuditUrl(`https://${'a'.repeat(250)}.example`)).toBeNull();
    expect(validateAuditUrl(`https://example.com/${'a'.repeat(2_050)}`)).toBeNull();
  });
});

describe('validateAuditRequest', () => {
  it('rejects unknown fields and invalid business identifiers', () => {
    expect(validateAuditRequest({ url: 'https://example.com', user_id: 'forged' })).toMatchObject({
      ok: false,
      status: 422,
    });
    expect(validateAuditRequest({ url: 'https://example.com', business_id: 'not-a-uuid' })).toMatchObject({
      ok: false,
      status: 422,
    });
  });
});

describe('isPublicIp', () => {
  it('rejects private, reserved, link-local, multicast, and mapped addresses', () => {
    const rejected = [
      '0.0.0.0',
      '10.0.0.1',
      '100.64.0.1',
      '127.0.0.1',
      '169.254.169.254',
      '172.16.0.1',
      '192.168.1.1',
      '224.0.0.1',
      '::',
      '::1',
      '::ffff:192.168.1.1',
      'fc00::1',
      'fe80::1',
      'ff02::1',
      '2001:db8::1',
    ];

    for (const value of rejected) {
      expect(isPublicIp(value), value).toBe(false);
    }
  });

  it('accepts ordinary public IPv4 and IPv6 addresses', () => {
    expect(isPublicIp('8.8.8.8')).toBe(true);
    expect(isPublicIp('2606:4700:4700::1111')).toBe(true);
  });
});
