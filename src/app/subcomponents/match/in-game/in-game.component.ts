import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {Summoner} from "../../../models/dto/summoner";
import {SummonerspellsContainer} from "../../../models/dto/containers/summonerspells-container";
import {ItemsContainer} from "../../../models/dto/containers/items-container";
import {ChampionsContainer} from "../../../models/dto/containers/champions-container";
import {Subscription} from "rxjs/Subscription";
import {RatelimitedRequestsService} from "../../../services/ratelimited-requests.service";
import {GameApiService} from "../../../services/game-api.service";
import {ResType} from "../../../enums/api-response-type";
import {CurrentGame} from "../../../models/dto/current-game";
import {Observable} from "rxjs/Observable";
import {PlayerApiService} from "../../../services/player-api.service";
import {GameType} from "../../../enums/game-type";
import {GameMetadataService} from "../../../services/game-metadata.service";

@Component({
  selector: 'in-game',
  templateUrl: './in-game.component.html',
  styleUrls: ['./in-game.component.scss']
})
export class InGameComponent implements OnInit, OnChanges {

  @Input() ally_teammate: Summoner;
  @Output() gameNotFound: EventEmitter<Summoner> = new EventEmitter();

  private ongoing_request: Subscription = null;
  private gamemode: GameType = null;
  private enemies: Array<Summoner> = null;
  private champions: ChampionsContainer;
  private summonerspells: SummonerspellsContainer;

  constructor(private metadata: GameMetadataService,
              private game_api: GameApiService,
              private player_api: PlayerApiService,
              private bufferedRequests: RatelimitedRequestsService) {
  }

  ngOnInit() {
    // Get first loads of static data (except items, saved for later / in sub-components)
    this.metadata.champions$.first().subscribe(container => this.champions = container);
    this.metadata.summonerspells$.first().subscribe(container => this.summonerspells = container);
  }

  ngOnChanges(changes) {
    if (changes.hasOwnProperty('ally_teammate') && changes['ally_teammate'].previousValue !== changes['ally_teammate'].currentValue) {
      if (this.ongoing_request !== null && !this.ongoing_request.closed) {
        this.ongoing_request.unsubscribe();
      }
      this.ongoing_request = this.bufferedRequests.buffer(() => {
        return this.game_api.getCurrentGame(this.ally_teammate, this.champions, this.summonerspells);
      })
        .subscribe((game_api_res) => {
          if (game_api_res.type === ResType.NOT_FOUND) {
            this.gameNotFound.emit(this.ally_teammate);
          } else if (game_api_res.type === ResType.ERROR) {
            this.gameNotFound.emit(null);
          } else if (game_api_res.type === ResType.SUCCESS) {
            let current_game: CurrentGame = game_api_res.data;
            this.gamemode = current_game.game_type;
            this.ongoing_request = Observable.forkJoin(
              current_game.enemies.map(participant => this.bufferedRequests.buffer(() => {
                return this.player_api.getSummonerByName(this.ally_teammate.region, participant.summoner_name);
              }))
            )
              .subscribe(api_responses => {
                let responses = Object.keys(api_responses).map(k => api_responses[k]);
                if (responses.every(api_res => api_res.type === ResType.SUCCESS)) {
                  this.enemies = responses.map(api_res => <Summoner>api_res.data);
                }
              });
          }
        })
    }
  }

}
