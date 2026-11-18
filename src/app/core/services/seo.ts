import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/** Het enige domein dat zoekmachines moeten indexeren; vehictory.app wordt hierheen doorgestuurd. */
export const CANONICAL_ORIGIN = 'https://vehictory.com';

/** Routedata-sleutel: `data: { [NO_INDEX]: true }` houdt de pagina uit zoekresultaten. */
export const NO_INDEX = 'noIndex';

/**
 * Zet na elke navigatie een canonical-link (zonder query, fragment of trailing slash)
 * en voor niet-indexeerbare pagina's een `robots: noindex` meta-tag.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  init(): void {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.update(e.urlAfterRedirects));
  }

  private update(url: string): void {
    if (this.isNoIndex(this.router.routerState.snapshot.root)) {
      this.meta.updateTag({ name: 'robots', content: 'noindex' });
      this.removeCanonical();
      return;
    }
    this.meta.removeTag('name="robots"');
    this.setCanonical(CANONICAL_ORIGIN + canonicalPath(url));
  }

  private isNoIndex(route: ActivatedRouteSnapshot): boolean {
    let current: ActivatedRouteSnapshot | null = route;
    while (current) {
      if (current.data[NO_INDEX]) return true;
      current = current.firstChild;
    }
    return false;
  }

  private setCanonical(href: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = href;
  }

  private removeCanonical(): void {
    this.document.head.querySelector('link[rel="canonical"]')?.remove();
  }
}

/** `/login/?x=1#a` → `/login`; de root blijft `/`. */
export function canonicalPath(url: string): string {
  const path = url.split(/[?#]/)[0].replace(/\/+$/, '');
  return path === '' ? '/' : path;
}
