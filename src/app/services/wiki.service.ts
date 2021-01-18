import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import {
  catchError,
  map,
  tap,
  switchMap,
  mergeMap,
  toArray,
} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class WikiService {
  constructor(private http: HttpClient) {}

  getWikiItem(title: string): Observable<any> {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&format=json&origin=*&titles=${title}`;

    return this.http.get<any>(wikiUrl).pipe(catchError(this.handleError));
  }

  getItemPages(wikiItem): Observable<any> {
    const id: string = (Object.values(wikiItem.query.pages)[0] as any).pageprops
      .wikibase_item;

    const languages$ = this.getLanguaesById(id);
    // languages$
    //   .pipe(
    //     tap((languages) => {console.log(languages)}),
    //     switchMap((languages) =>
    //       from(languages).pipe(
    //         mergeMap((language) => this.getWordcount(language, title)),
    //         toArray()
    //       )
    //     )
    //   )

    return languages$;
  }

  getLanguaesById(id: string): Observable<any[]> {
    const wikiUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&props=sitelinks&ids=${id}`;
    return this.http.get<any>(wikiUrl).pipe(
      map((data) => {
        const sitelinks: any[] = Object.values(
          data.entities[`${id}`].sitelinks
        );

        const modifiedSiteLinks = sitelinks.map((el) => {
          const site = el.site as string;
          const newElement = {
            language: site.substring(0, site.indexOf('wiki')),
            title: el.title.replaceAll(' ', '_'),
          };

          return newElement;
        });
        return modifiedSiteLinks;
      }),

      catchError(this.handleError)
    );
  }

  getWordcount(language: string, title: string) {
    let wikiUrl = `http://${language}.wikipedia.org/w/api.php?format=json&origin=*&action=query&list=search&srwhat=nearmatch&srlimit=1&srsearch=${title}`;

    return this.http.get<any>(wikiUrl).pipe(
      tap((data) => console.log(JSON.stringify(data))),
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
