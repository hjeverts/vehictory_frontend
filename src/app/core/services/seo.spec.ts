import { Component, DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NO_INDEX, SeoService, canonicalPath } from './seo';

@Component({ template: '' })
class Dummy {}

describe('canonicalPath', () => {
  it('strips query, fragment and trailing slashes', () => {
    expect(canonicalPath('/login/?x=1#top')).toBe('/login');
    expect(canonicalPath('/register')).toBe('/register');
    expect(canonicalPath('/')).toBe('/');
    expect(canonicalPath('/?utm=1')).toBe('/');
  });
});

describe('SeoService', () => {
  let router: Router;
  let doc: Document;

  const canonical = () => doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const robots = () => doc.head.querySelector<HTMLMetaElement>('meta[name="robots"]');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Dummy },
          { path: 'login', component: Dummy },
          { path: 'vehicles', component: Dummy, data: { [NO_INDEX]: true } },
          { path: '**', component: Dummy, data: { [NO_INDEX]: true } },
        ]),
      ],
    });
    router = TestBed.inject(Router);
    doc = TestBed.inject(DOCUMENT);
    TestBed.inject(SeoService).init();
  });

  afterEach(() => {
    canonical()?.remove();
    robots()?.remove();
  });

  it('sets a vehictory.com canonical for indexable pages', async () => {
    await router.navigateByUrl('/login?returnUrl=%2Fvehicles');
    expect(canonical()?.href).toBe('https://vehictory.com/login');
    expect(robots()).toBeNull();
  });

  it('marks noindex pages and drops the canonical', async () => {
    await router.navigateByUrl('/login');
    await router.navigateByUrl('/vehicles');
    expect(robots()?.content).toBe('noindex');
    expect(canonical()).toBeNull();

    await router.navigateByUrl('/');
    expect(robots()).toBeNull();
    expect(canonical()?.href).toBe('https://vehictory.com/');
  });

  it('marks unknown routes noindex', async () => {
    await router.navigateByUrl('/bestaat-niet');
    expect(robots()?.content).toBe('noindex');
  });
});
