import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Summoner} from "../../models/dto/summoner";
import {PlayerApiService} from "../../services/player-api.service";
import {RatelimitedRequestsService} from "../../services/ratelimited-requests.service";
import {ResType} from "../../enums/api-response-type";
import {GameType} from "../../enums/game-type";
import {GameReference} from "../../models/dto/game-reference";
import {GameApiService} from "../../services/game-api.service";
import {GameMetadataService} from "../../services/game-metadata.service";
import {Subscription} from "rxjs/Subscription";
import {ChampionsContainer} from "../../models/dto/containers/champions-container";
import {CurrentGameParticipant} from "../../models/dto/current-game-participant";

@Component({
  selector: 'player-lookup',
  templateUrl: './player-lookup.component.html',
  styleUrls: ['./player-lookup.component.scss']
})
export class PlayerLookupComponent implements OnInit {

  @Input() summoner: Summoner;
  @Input() participant_if_ingame: CurrentGameParticipant;
  @Input() other_teammates: Array<Summoner>;
  @Input() queueing_for: GameType;
  @Input() display_summoner_icon: boolean = false;
  @Input() use_minified_components: boolean = false;

  @Input() display_summary_kda: boolean = false;
  @Input() display_summary_cs: boolean = false;
  @Input() display_summary_cs10: boolean = false;
  @Input() display_summary_damageth: boolean = true;

  @Input() hide_statistics: boolean;
  @Output() selectedInitialRole: EventEmitter<boolean> = new EventEmitter();

  private role = null;
  private error_message = '';
  private subscription: Subscription = null;
  private readonly time_limit_days = 21;
  private soloqueue_games_this_season = null;
  private flexqueue_games_this_season = null;
  private soloqueue_games_past_3_weeks = null;
  private flexqueue_games_past_3_weeks = null;
  private current_queue_past_3_weeks = null;
  private loading_ready: boolean = false;

  // Metadata
  private champions: ChampionsContainer;

  // Utils
  private GameType = GameType;

  constructor(private metadata: GameMetadataService,
              private player_api: PlayerApiService,
              private game_api: GameApiService,
              private buffered_requests: RatelimitedRequestsService) {
  }

  private handleSelectedRole(role) {
    let is_initial_update = this.role === null;
    // First update role
    this.role = role;
    // Then send upstream "we have selected initial role" if so
    if (is_initial_update) {
      this.selectedInitialRole.emit(true);
    }
  }

  private queryMatchHistory() {
    if (this.subscription && !this.subscription.closed) {
      return; // Request in progress, noop
    }

    this.error_message = '';

    this.subscription = this.buffered_requests.buffer(() => {
      return this.player_api.getListOfRankedGamesJson(this.summoner.region, this.summoner.account_id, GameType.SOLO_AND_FLEXQUEUE_5V5, this.champions)
    })
      .subscribe(api_res => {
        if (api_res.type === ResType.SUCCESS) {
          let all_games = <Array<GameReference>>api_res.data;
          let soloqueue_games_this_season = all_games.filter(gameref => gameref.game_type === GameType.SOLO_QUEUE);
          let flexqueue_games_this_season = all_games.filter(gameref => gameref.game_type === GameType.FLEX_QUEUE_5V5);
          let soloqueue_games_past_3_weeks = soloqueue_games_this_season
            .filter(gameref => gameref.game_start_time.getTime() > (new Date().getTime()-1000*60*60*24*this.time_limit_days));
          let flexqueue_games_past_3_weeks = flexqueue_games_this_season
            .filter(gameref => gameref.game_start_time.getTime() > (new Date().getTime()-1000*60*60*24*this.time_limit_days));

          if (soloqueue_games_this_season.length > 0) {
            this.soloqueue_games_this_season = soloqueue_games_this_season;
          }
          if (flexqueue_games_this_season.length > 0) {
            this.flexqueue_games_this_season = flexqueue_games_this_season;
          }
          if (soloqueue_games_past_3_weeks.length > 0) {
            this.soloqueue_games_past_3_weeks = soloqueue_games_past_3_weeks;
          }
          if (flexqueue_games_past_3_weeks.length > 0) {
            this.flexqueue_games_past_3_weeks = flexqueue_games_past_3_weeks;
          }

          if (this.queueing_for === GameType.SOLO_QUEUE) {
            this.current_queue_past_3_weeks = soloqueue_games_past_3_weeks;
          } else if (this.queueing_for === GameType.FLEX_QUEUE_5V5) {
            this.current_queue_past_3_weeks = flexqueue_games_past_3_weeks;
          } else {
            // Unsupported queue type
            //this.error_message = "Unsupported queue type. (This shouldn't be possible. UI y u let this happen?)";
            //this.current_queue_past_3_weeks = [];
            // tmp default to soloqueue and prompt note
            this.error_message = "Unsupported queue type -> defaulting to soloqueue. (Do not click try again it is pointless)";
            this.current_queue_past_3_weeks = soloqueue_games_past_3_weeks;
          }
        } else if (api_res.type === ResType.ERROR) {
          this.error_message = `An error happened. Try again later. (${api_res.error})`;
        }
      });
  }

  ngOnInit() {
    // Get first loads of static data (except items, saved for later / in sub-components)
    this.metadata.champions$.first().subscribe(container => this.champions = container);
    this.queryMatchHistory();
  }

}
