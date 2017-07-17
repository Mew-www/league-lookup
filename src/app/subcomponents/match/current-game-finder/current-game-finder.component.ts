import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {CurrentGame} from "../../../models/dto/current-game";
import {Subscription} from "rxjs/Subscription";
import {PlayerApiService} from "../../../services/player-api.service";
import {RatelimitedRequestsService} from "../../../services/ratelimited-requests.service";
import {PreferencesService} from "../../../services/preferences.service";
import {TranslatorService} from "../../../services/translator.service";
import {ResType} from "../../../enums/api-response-type";
import {GameApiService} from "../../../services/game-api.service";
import {Summoner} from "../../../models/dto/summoner";
import {ChampionsContainer} from "../../../models/dto/containers/champions-container";
import {SummonerspellsContainer} from "../../../models/dto/containers/summonerspells-container";
import {GameMetadataService} from "../../../services/game-metadata.service";
import {InGameSearch} from "../../../models/ingame_search";

@Component({
  selector: 'current-game-finder',
  templateUrl: './current-game-finder.component.html',
  styleUrls: ['./current-game-finder.component.scss']
})
export class CurrentGameFinderComponent implements OnInit {

  @Output() current_game_emitter: EventEmitter<CurrentGame> = new EventEmitter();

  private current_region = null;

  private search_history: Array<InGameSearch> = [];
  private search_history_used: boolean = false;
  private target = "";
  private error_message ="";
  private subscription: Subscription = null;

  private champions: ChampionsContainer;
  private summonerspells: SummonerspellsContainer;
  private gettext: Function;

  public minimized = false;

  constructor(private metadata: GameMetadataService,
              private player_api: PlayerApiService,
              private game_api: GameApiService,
              private bufferedRequests: RatelimitedRequestsService,
              private preferencesService: PreferencesService,
              private translator: TranslatorService) {
    this.gettext = translator.getTranslation;
  }

  private findGame(past_search?: InGameSearch) {
    if (past_search) {
      this.target = `${past_search.summoner_name} (${past_search.region})`;
      if (!this.search_history_used) {
        this.search_history_used = true;
      }
    }
    let region = this.target.indexOf('(') !== -1 ? this.target.split('(')[1].slice(0,-1) : this.current_region;
    let target = this.target.indexOf('(') !== -1 ? this.target.split('(')[0] : this.target;

    this.error_message = "";

    this.subscription = this.bufferedRequests.buffer(() => {
      return this.player_api.getSummonerByName(region, target);
    })
      .subscribe(api_res => {
        if (api_res.type === ResType.NOT_FOUND) {
          this.error_message = `Could not find player named ${target} from server ${region}.`;
        } else if (api_res.type === ResType.ERROR) {
          this.error_message = "An error happened trying to request player data. Try again.";
        } else if (api_res.type === ResType.SUCCESS) {
          let target_summoner: Summoner = api_res.data;

          this.subscription = this.bufferedRequests.buffer(() => {
            return this.game_api.getCurrentGame(target_summoner, this.champions, this.summonerspells);
          })
            .subscribe((game_api_res) => {
              if (game_api_res.type === ResType.NOT_FOUND) {
                this.error_message = `${target_summoner.current_name} is not currently in game. Try again later.`;
              } else if (game_api_res.type === ResType.ERROR) {
                this.error_message = "An error happened trying to request current match. Try again.";
              } else if (game_api_res.type === ResType.SUCCESS) {
                this.current_game_emitter.emit(game_api_res.data);
                // Update search history
                let existing_past_search = this.search_history.find(s => s.summoner_id === target_summoner.id && s.region === region);
                if (existing_past_search) {
                  // Increase search count
                  existing_past_search.count++;
                  // If name has changed since, update it too
                  if (existing_past_search.summoner_name !== target_summoner.current_name) {
                    existing_past_search.summoner_name = target_summoner.current_name;
                  }
                } else {
                  this.search_history.push(new InGameSearch(target_summoner.id, target_summoner.current_name, region));
                }
                this.search_history.sort((a,b) => a.count - b.count);
                this.preferencesService.setPref('game_searches', this.search_history);
              }
            })
        }
      });
  }

  ngOnInit() {
    // Get first loads of static data (except items, saved for later / in sub-components)
    this.metadata.champions$.first().subscribe(container => this.champions = container);
    this.metadata.summonerspells$.first().subscribe(container => this.summonerspells = container);

    // Expected to be set before init (see: Setup -component)
    this.current_region = this.preferencesService.getPref('region');

    this.search_history = this.preferencesService.getPref('game_searches') ? this.preferencesService.getPref('game_searches') : [];

    this.preferencesService.preferences$
      .subscribe(new_prefs => {
        if (new_prefs.hasOwnProperty('region') && new_prefs.region !== this.current_region) {
          if (this.subscription !== null && !this.subscription.closed) {
            this.error_message = "Region was changed. Cancelled loading. Please try again.";
            this.subscription.unsubscribe();
          }
          this.current_region = new_prefs.region;
        }
      });
  }

}
