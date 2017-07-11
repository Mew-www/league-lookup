import { Injectable } from '@angular/core';
import {StaticApiService} from "./static-api.service";
import {Subscription} from "rxjs/Subscription";
import {Observable} from "rxjs/Observable";
import {ApiResponse} from "../helpers/api-response";
import {ResType} from "../enums/api-response-type";
import {ChampionsContainer} from "../models/dto/containers/champions-container";
import {ItemsContainer} from "../models/dto/containers/items-container";
import {SummonerspellsContainer} from "../models/dto/containers/summonerspells-container";
import {ReplaySubject} from "rxjs/ReplaySubject";


@Injectable()
export class GameMetadataService {

  private _champions: ReplaySubject<ChampionsContainer> = new ReplaySubject(1);
  private _items: ReplaySubject<ItemsContainer> = new ReplaySubject(1);
  private _summonerspells: ReplaySubject<SummonerspellsContainer> = new ReplaySubject(1);
  private ongoing_reload: Subscription = null;

  public readonly champions$: Observable<ChampionsContainer> = this._champions.asObservable();
  public readonly items$: Observable<ItemsContainer> = this._items.asObservable();
  public readonly summonerspells$: Observable<SummonerspellsContainer> = this._summonerspells.asObservable();


  constructor(private static_api: StaticApiService) {
    // Load initial metadata, on failure emit null and let component figure what to do (whether crash or try reload)
    this.ongoing_reload = Observable.forkJoin([
      this.static_api.getChampions(),
      this.static_api.getItems(),
      this.static_api.getSummonerspells()
    ])
      .subscribe((static_api_responses: Array<ApiResponse<any, string, number>>) => {
        if (static_api_responses.every(api_res => api_res.type === ResType.SUCCESS)) {
          this._champions.next(static_api_responses[0].data);
          this._items.next(static_api_responses[1].data);
          this._summonerspells.next(static_api_responses[2].data);
        } else {
          this._champions.next(null);
          this._items.next(null);
          this._summonerspells.next(null);
        }
      })

  }

  public reload() {

    if (this.ongoing_reload && !this.ongoing_reload.closed) {
      // Already either mid-initial-loading or mid-reloading, NO-OP
      return;
    }

    // Reset in-app caches
    this.static_api.reloadChampions();
    this.static_api.reloadItemMap();
    this.static_api.reloadSummonerspellMap();

    this.ongoing_reload = Observable.forkJoin([
      this.static_api.getChampions(),
      this.static_api.getItems(),
      this.static_api.getSummonerspells()
    ])
      .subscribe((static_api_responses: Array<ApiResponse<any, string, number>>) => {
        if (static_api_responses.every(api_res => api_res.type === ResType.SUCCESS)) {
          this._champions.next(static_api_responses[0].data);
          this._items.next(static_api_responses[1].data);
          this._summonerspells.next(static_api_responses[2].data);
        } else {
          this._champions.next(null);
          this._items.next(null);
          this._summonerspells.next(null);
        }
      })
  }

}
