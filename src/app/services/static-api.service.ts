import { Injectable } from '@angular/core';
import {Http, Response} from "@angular/http";
import {ApiRoutes} from "../constants/api-routes";
import {Observable} from "rxjs/Observable";
import {ApiResponse, ApiResponseError, ApiResponseSuccess} from "../helpers/api-response";
import {ChampionsContainer} from "../models/dto/containers/champions-container";
import {ItemsContainer} from "app/models/dto/containers/items-container";
import {SummonerspellsContainer} from "../models/dto/containers/summonerspells-container";

@Injectable()
export class StaticApiService {

  private _champions: ChampionsContainer = null;
  private _champions_request: Observable<ApiResponse<ChampionsContainer, string, any>> = null;
  private _items: ItemsContainer = null;
  private _items_request: Observable<ApiResponse<ItemsContainer, string, any>> = null;
  private _summonerspells: SummonerspellsContainer = null;
  private _summonerspells_request: Observable<ApiResponse<SummonerspellsContainer, string, any>> = null;

  constructor(private http: Http) { }

  private _cacheAndWrapChampionApiResponse(res: Response): ApiResponse<ChampionsContainer, string, any> {
    const champion_list = new ChampionsContainer(res.json());
    // Cache
    this._champions = champion_list;
    // ..and return
    return new ApiResponseSuccess(champion_list);
  }
  private _cacheAndWrapItemsApiResponse(res: Response): ApiResponse<ItemsContainer, string, any> {
    const items = new ItemsContainer(res.json());
    // Cache
    this._items = items;
    // ..and return
    return new ApiResponseSuccess(items);
  }
  private _cacheAndWrapSummonerspellsApiResponse(res: Response): ApiResponse<SummonerspellsContainer, string, any> {
    const summonerspells = new SummonerspellsContainer(res.json());
    // Cache
    this._summonerspells = summonerspells;
    // ..and return
    return new ApiResponseSuccess(summonerspells);
  }

  public getChampions(): Observable<ApiResponse<ChampionsContainer, string, any>> {
    // #1 retrieve data from cache
    if (this._champions) {
      return Observable.of(new ApiResponseSuccess(this._champions));
    }
    // #2 retrieve an ongoing request for data
    if (this._champions_request) {
      return this._champions_request;
    }
    // #3 create a request and return it
    this._champions_request = this.http.get(ApiRoutes.CHAMPION_LIST_URI)
      .map(res => this._cacheAndWrapChampionApiResponse(res))
      .catch(error => Observable.of(new ApiResponseError(`Error when requesting URI "${ApiRoutes.CHAMPION_LIST_URI}"`)))
      .share();
    return this._champions_request;
  }
  public getItems(): Observable<ApiResponse<ItemsContainer, string, any>> {
    // #1 retrieve data from cache
    if (this._items) {
      return Observable.of(new ApiResponseSuccess(this._items));
    }
    // #2 retrieve an ongoing request for data
    if (this._items_request) {
      return this._items_request;
    }
    // #3 create a request and return it
    this._items_request = this.http.get(ApiRoutes.ITEM_LIST_URI)
      .map(res => this._cacheAndWrapItemsApiResponse(res))
      .catch(error => Observable.of(new ApiResponseError(`Error when requesting URI "${ApiRoutes.ITEM_LIST_URI}"`)))
      .share();
    return this._items_request;
  }
  public getSummonerspells(): Observable<ApiResponse<SummonerspellsContainer, string, any>> {
    // #1 retrieve data from cache
    if (this._summonerspells) {
      return Observable.of(new ApiResponseSuccess(this._summonerspells));
    }
    // #2 retrieve an ongoing request for data
    if (this._summonerspells_request) {
      return this._summonerspells_request;
    }
    // #3 create a request and return it
    this._summonerspells_request = this.http.get(ApiRoutes.SUMMONERSPELL_LIST_URI)
      .map(res => this._cacheAndWrapSummonerspellsApiResponse(res))
      .catch(error => Observable.of(new ApiResponseError(`Error when requesting URI "${ApiRoutes.SUMMONERSPELL_LIST_URI}"`)))
      .share();
    return this._summonerspells_request;
  }
  public reloadChampions() {
    this._champions = null;
    this._champions_request = this.http.get(ApiRoutes.CHAMPION_LIST_URI)
      .map(res => this._cacheAndWrapChampionApiResponse(res))
      .share();
  }
  public reloadItemMap() {
    this._items = null;
    this._items_request = this.http.get(ApiRoutes.ITEM_LIST_URI)
      .map(res => this._cacheAndWrapItemsApiResponse(res))
      .share();
  }
  public reloadSummonerspellMap() {
    this._summonerspells = null;
    this._summonerspells_request = this.http.get(ApiRoutes.SUMMONERSPELL_LIST_URI)
      .map(res => this._cacheAndWrapSummonerspellsApiResponse(res))
      .share();
  }
  public updateChampionDatabase(): Observable<boolean> {
    return this.http.get(ApiRoutes.CHAMPION_REFRESH_URI)
      .map(res => {
        return res.status === 200;
      });
  }
  public updateItemDatabase(): Observable<boolean> {
    return this.http.get(ApiRoutes.ITEM_REFRESH_URI)
      .map(res => {
        return res.status === 200;
      });
  }
  public updateSummonerspellDatabase(): Observable<boolean> {
    return this.http.get(ApiRoutes.SUMMONERSPELL_REFRESH_URI)
      .map(res => {
        return res.status === 200;
      });
  }

}