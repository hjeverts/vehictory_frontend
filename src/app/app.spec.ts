import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render copyright, license, and repository links', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const footer = compiled.querySelector('.app-footer');

    expect(footer?.textContent).toContain('© 2026 Hans Everts');
    expect(footer?.textContent).toContain('info@vehictory.com');
    expect(footer?.textContent).toContain('MIT-licentie');
    expect(footer?.textContent).toContain('Open source op GitHub');
    expect(footer?.querySelector('a[href="https://github.com/hjeverts/vehictory_frontend/blob/main/LICENSE"]')).toBeTruthy();
    expect(footer?.querySelector('a[href="https://github.com/hjeverts/vehictory_frontend"]')).toBeTruthy();
  });
});
