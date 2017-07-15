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

@Component({
  selector: 'current-game-finder',
  templateUrl: './current-game-finder.component.html',
  styleUrls: ['./current-game-finder.component.scss']
})
export class CurrentGameFinderComponent implements OnInit {

  private current_region = null;

  private target = "";
  private error_message ="";
  private subscription: Subscription = null;

  private minimized = false;

  private champions: ChampionsContainer;
  private summonerspells: SummonerspellsContainer;
  private gettext: Function;

  @Output() current_game_emitter: EventEmitter<CurrentGame> = new EventEmitter();

  constructor(private metadata: GameMetadataService,
              private player_api: PlayerApiService,
              private game_api: GameApiService,
              private bufferedRequests: RatelimitedRequestsService,
              private preferencesService: PreferencesService,
              private translator: TranslatorService) {
    this.gettext = translator.getTranslation;
  }

  private findGame() {
    this.subscription = this.bufferedRequests.buffer(() => {
      return this.player_api.getSummonerByName(this.current_region, this.target);
    })
      .subscribe(api_res => {
        if (api_res.type === ResType.NOT_FOUND) {
          this.error_message = `Could not find player named ${this.target} from server ${this.current_region}.`;
        } else if (api_res.type === ResType.ERROR) {
          this.error_message = "An error happened trying to request player data. Try again.";
        } else if (api_res.type === ResType.SUCCESS) {
          let target_summoner: Summoner = api_res.data;

          this.subscription = this.bufferedRequests.buffer(() => {
            return this.game_api.getCurrentGame(target_summoner, this.champions, this.summonerspells);
          })
            .subscribe((game_api_res) => {
              if (game_api_res.type === ResType.NOT_FOUND) {
                this.error_message = `Teammate ${target_summoner.current_name} is not currently in game. Try again later.`;
              } else if (game_api_res.type === ResType.ERROR) {
                this.error_message = "An error happened trying to request current match. Try again.";
              } else if (game_api_res.type === ResType.SUCCESS) {
                this.current_game_emitter.emit(game_api_res.data);
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
    this.current_region = this.preferencesService['region'];

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
