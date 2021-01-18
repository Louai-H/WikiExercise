import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { FamousPerson } from '../famous/dto/famousPerson.dto';
import { languageMap } from '../models/languageMap';
import { Page } from '../models/page';
import {
  catchError,
  map,
  mergeMap,
  switchMap,
  take,
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
        const sitelinks: any[] = Object.values(p.entities[`${id}`].sitelinks);

        const modifiedSiteLinks: Page[] = sitelinks.map((el) => {
          const site = el.site as string;
          const keyword = site.substring(0, site.indexOf('wiki'));
          const titleNoSpace = el.title.replaceAll(' ', '_');

          const newElement: Page = {
            keyword: keyword,
            language: languageMap.get(keyword),
            title: el.title.replaceAll(' ', '_'),
            link: `https://${keyword}.wikipedia.org/wiki/${titleNoSpace}`,
            wordCount: -10,
          };

          return newElement;
        });
        const modifiedSiteLinksFiltered = modifiedSiteLinks.filter((p) =>
          languageMap.has(p.keyword)
        );
        return modifiedSiteLinksFiltered;
      }),
      catchError(this.handleError)
    );
  }

  getWordcount(keyword: string, title: string): Observable<number> {
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
