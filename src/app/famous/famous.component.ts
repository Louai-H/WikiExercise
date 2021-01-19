import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { defer, Observable, Subscription } from 'rxjs';
import { WikiService } from '../services/wiki.service';
import { FamousPerson } from './dto/famousPerson.dto';
import { famousAmericans } from './famous-americans.data';
import { Page } from '../models/page';
import { finalize, take } from 'rxjs/operators';

@Component({
  selector: 'app-famous',
  templateUrl: './famous.component.html',
  styleUrls: ['./famous.component.css'],
  changeDetection: ChangeDetectionStrategy.Default, // since I used the async pipe in the template and there are no critical subscriptions here then I can optimize the app later by limiting change Detection by using OnPush strategy
})
export class FamousComponent implements OnInit, OnDestroy {
  titles: string[] = famousAmericans;
  famousPeople$: Observable<FamousPerson[]>;
  showPagesList: boolean = false;
  pages$: Observable<Page[]>;
  selectedItem: FamousPerson;
  loading: boolean = false;
  loadingSubscription: Subscription;

  constructor(private wikiService: WikiService) {}

  ngOnInit(): void {
    this.famousPeople$ = this.wikiService.getWikiItems(this.titles);
  }

  showPages(selectedItem: FamousPerson): void {
    this.showPagesList = true;
    this.selectedItem = { ...selectedItem };

    const loading = defer(() => {
      this.loading = true;

      this.pages$ = this.wikiService.getItemPagesById(
        selectedItem.wikibase_item
      );

      return this.pages$;
    });

    this.loadingSubscription = loading
      .pipe(finalize(() => (this.loading = false)))
      .subscribe();
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) this.loadingSubscription.unsubscribe();
  }
}
