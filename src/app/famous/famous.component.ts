import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { WikiService } from '../services/wiki.service';

@Component({
  selector: 'app-famous',
  templateUrl: './famous.component.html',
  styleUrls: ['./famous.component.css'],
})
export class FamousComponent implements OnInit, OnDestroy {
  titles: string[] = [
    'Wilson_Lumpkin',
    'Robert_Toombs',
    'Saxby_Chambliss',
    'Wyche_Fowler',
  ];
  americans: any[] = [];
  showPagesList: boolean = false;
  pages: any[] = [];
  selectedName: string = '';
  pagesSubscription: Subscription;

  constructor(private wikiService: WikiService) {}

  ngOnInit(): void {
    this.titles.forEach((title) => {
      this.wikiService
        .getWikiItem(title)
        .pipe(take(1))
        .subscribe((item) => {
          this.americans.push(item);
        });
    });
  }

  showPages(american: any): void {
    this.showPagesList = true;
    this.selectedName = american.query.normalized[0].to;
    this.pages = [];

    this.pagesSubscription = this.wikiService
      .getItemPages(american)
      .subscribe((pages) => {
        const modifiedpages = pages.map((el) => ({
          language: el.language,
          link: `https://${el.language}.wikipedia.org/wiki/${el.title}`,
        }));

        return (this.pages = modifiedpages);
      });
  }

  ngOnDestroy(): void {
    if (this.pagesSubscription) this.pagesSubscription.unsubscribe();
  }
}
