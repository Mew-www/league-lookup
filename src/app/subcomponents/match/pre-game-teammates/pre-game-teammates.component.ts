import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {Summoner} from "../../../models/dto/summoner";
import {GameType} from "../../../enums/game-type";
import {CurrentGame} from "../../../models/dto/current-game";
import {Subscription} from "rxjs/Subscription";
import {GameMetadataService} from "../../../services/game-metadata.service";
import {GameApiService} from "../../../services/game-api.service";
import {PlayerApiService} from "../../../services/player-api.service";
import {RatelimitedRequestsService} from "../../../services/ratelimited-requests.service";
import {ChampionsContainer} from "../../../models/dto/containers/champions-container";
import {SummonerspellsContainer} from "app/models/dto/containers/summonerspells-container";
import {ResType} from "../../../enums/api-response-type";

@Component({
  selector: 'pre-game-teammates',
  templateUrl: './pre-game-teammates.component.html',
  styleUrls: ['./pre-game-teammates.component.scss']
})
export class PreGameTeammatesComponent implements OnInit, OnChanges {

  @Input() queue: GameType;
  @Input() teammates: Array<Summoner>;

  private display_icons: boolean = false;
  private minified_mode: boolean = true;
  private wait_role_selection: boolean = true;
  private roles_selected = 0;

  // Related to finding-a-currentgame
  private champions: ChampionsContainer;
  private summonerspells: SummonerspellsContainer;
  private ongoing_request: Subscription = null;
  private error_message = "";

  @Output() current_game_emitter: EventEmitter<CurrentGame> = new EventEmitter();

  constructor(private metadata: GameMetadataService,
              private game_api: GameApiService,
              private player_api: PlayerApiService,
              private bufferedRequests: RatelimitedRequestsService) { }

  private handleSelectedInitialRole() {
    this.roles_selected++;
  }

  private seek_current_game() {

    if (!this.teammates || this.teammates.length === 0) {
      return;
    }

    let random_teammate = this.teammates[0];

    if (this.ongoing_request !== null && !this.ongoing_request.closed) {
      this.ongoing_request.unsubscribe();
    }
    this.error_message = "";
    this.ongoing_request = this.bufferedRequests.buffer(() => {
      return this.game_api.getCurrentGame(random_teammate, this.champions, this.summonerspells);
    })
      .subscribe((game_api_res) => {
        if (game_api_res.type === ResType.NOT_FOUND) {
          this.error_message = `Teammate ${random_teammate.current_name} is not in game yet. Try again later.`;
        } else if (game_api_res.type === ResType.ERROR) {
          this.error_message = "An error happened trying to request current match. Try again.";
        } else if (game_api_res.type === ResType.SUCCESS) {
          this.current_game_emitter.emit(game_api_res.data);
        }
      })
  }

  ngOnInit() {
    // Get first loads of static data (except items, saved for later / in sub-components)
    this.metadata.champions$.first().subscribe(container => this.champions = container);
    this.metadata.summonerspells$.first().subscribe(container => this.summonerspells = container);
  }

  ngOnChanges(changes) {
    console.log("teammates component changed");
    // If teammates was given as input, and it wasn't the initial value, and it was changed
    if (changes.hasOwnProperty('teammates')
      && changes['teammates'].previousValue
      && JSON.stringify(changes['teammates'].currentValue) !== JSON.stringify(changes['teammates'].previousValue))
    {
      // Reset component state
      this.roles_selected = 0;
      this.wait_role_selection = true;
    }
  }

}
