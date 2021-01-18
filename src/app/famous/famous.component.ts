import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { WikiService } from '../services/wiki.service';
import { FamousPerson } from './dto/famousPerson.dto';
import { famousAmericans } from './famous-americans.data';
import { Page } from '../models/page';

@Component({
  selector: 'app-famous',
  templateUrl: './famous.component.html',
  styleUrls: ['./famous.component.css'],
})
export class FamousComponent implements OnInit {
  titles: string[] = famousAmericans;
  famousPeople$: Observable<FamousPerson[]>;
  showPagesList: boolean = false;
  pages$: Observable<Page[]>;
  selectedItem: FamousPerson;

  constructor(private wikiService: WikiService) {}

  ngOnInit(): void {
    this.famousPeople$ = this.wikiService.getWikiItems(this.titles);
  }

  showPages(selectedItem: FamousPerson): void {
    this.showPagesList = true;
    this.selectedItem = { ...selectedItem };

    this.pages$ = this.wikiService.getItemPagesById(selectedItem.wikibase_item);
  }
}
