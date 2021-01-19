import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, from, Observable, throwError } from 'rxjs';
import { FamousPerson } from '../famous/dto/famousPerson.dto';
import { languageMap } from '../models/languageMap';
import { Page } from '../models/page';
import {
  catchError,
  map,
  mergeMap,
  shareReplay,
  switchMap,
  toArray,
} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class WikiService {
  constructor(private http: HttpClient) {}

  getWikiItem(title: string): Observable<FamousPerson> {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&format=json&origin=*&titles=${title}`;

    return this.http.get<any>(wikiUrl).pipe(
      map((p) => ({
        title: p.query.normalized[0].to,
        titleNoSpace: p.query.normalized[0].from,
        wikibase_item: (Object.values(p.query.pages)[0] as any).pageprops
          .wikibase_item,
      })),
      catchError(this.handleError)
    );
  }

  getWikiItems(titles: string[]): Observable<FamousPerson[]> {
    return from(titles).pipe(
      mergeMap((t) => this.getWikiItem(t)),
      toArray(),
      catchError(this.handleError)
    );
  }

  getItemPagesById(id: string): Observable<Page[]> {
    const wikiUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&props=sitelinks&ids=${id}`;
    return this.http.get<any>(wikiUrl).pipe(
      map((p) => {
        const pages = this.excractPagesOutOfApiSitelinks(p, id).filter((p) =>
          languageMap.has(p.keyword)
        );
        return pages;
      }),
      mergeMap((pages) => pages),
      mergeMap((page) =>
        this.getWordcount(page).pipe(
          map((wordCount) => ({ ...page, wordCount } as Page))
        )
      ),
      toArray(),
      catchError(this.handleError)
    );
  }

  private excractPagesOutOfApiSitelinks(data: any, id: string): Page[] {
    const ApiSitelinks: any[] = Object.values(data.entities[`${id}`].sitelinks);

    const pages: Page[] = ApiSitelinks.map((el) => {
      const site = el.site as string;
      const keyword = site.substring(0, site.indexOf('wiki'));
      const titleNoSpace = el.title.replaceAll(' ', '_');

      const newElement: Page = {
        keyword: keyword,
        language: languageMap.get(keyword),
        title: el.title.replaceAll(' ', '_'),
        link: `https://${keyword}.wikipedia.org/wiki/${titleNoSpace}`,
      };
      return newElement;
    });
    return pages;
  }

  // second solution for this function / just for practice:
  getItemPagesById2(id: string): Observable<Page[]> {
    const wikiUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&props=sitelinks&ids=${id}`;
    return this.http.get<any>(wikiUrl).pipe(
      switchMap((p) => {
        const pages = this.excractPagesOutOfApiSitelinks(p, id).filter((p) =>
          languageMap.has(p.keyword)
        );
        return from(pages).pipe(
          mergeMap((page) =>
            this.getWordcount(page).pipe(
              map((wordCount) => ({ ...page, wordCount } as Page))
            )
          ),
          toArray()
        );
      }),
      catchError(this.handleError)
    );
  }

  // third solution for this function just for practice:
  getItemPagesById3(id: string): Observable<Page[]> {
    const wikiUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&props=sitelinks&ids=${id}`;
    return this.http.get<any>(wikiUrl).pipe(
      map((p) => {
        const pages = this.excractPagesOutOfApiSitelinks(p, id).filter((p) =>
          languageMap.has(p.keyword)
        );
        return pages;
      }),

      switchMap((pages) =>
        forkJoin(pages.map((page) => this.getPageWithCount(page)))
      ),
      shareReplay(1),
      catchError(this.handleError)
    );
  }

  private getPageWithCount(page: Page): Observable<Page> {
    return this.getWordcount(page).pipe(
      map((wordCount) => ({ ...page, wordCount } as Page)),
      catchError(this.handleError)
    );
  }

  getWordcount(page: Page): Observable<number> {
    const keyword = page.keyword;
    const title = page.title;
    const wikiUrl = `http://${keyword}.wikipedia.org/w/api.php?format=json&origin=*&action=query&list=search&srwhat=nearmatch&srlimit=1&srsearch=${title}`;

    return this.http.get<any>(wikiUrl).pipe(
      map((d) => +d.query.search[0].wordcount),
      catchError(this.handleError)
    );
  }

  private handleError(err: any): Observable<never> {
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred:
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // backend/api error:
      errorMessage = `Backend returned code ${err.status}: ${err.body.error}`;
    }
    console.error(err);
    return throwError(errorMessage);
  }
}
