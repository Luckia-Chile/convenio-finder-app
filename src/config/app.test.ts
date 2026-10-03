import { describe, expect, it } from 'vitest';
import { BRAND, COMPANIES_WITHOUT_LIST, MAX_UPLOAD_BYTES, SEARCH_PAGE_SIZE } from './app';

describe('config/app', () => {
  it('valores por defecto', () => {
    expect(SEARCH_PAGE_SIZE).toBe(200);
    expect(MAX_UPLOAD_BYTES).toBe(50 * 1024 * 1024);
    expect(BRAND.logo).toMatch(/^\/.+\.svg$/);
    expect(COMPANIES_WITHOUT_LIST).toContain('ARICA COLLEGE');
  });
});
