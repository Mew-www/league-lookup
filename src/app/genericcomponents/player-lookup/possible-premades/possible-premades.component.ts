import {Component, Input, OnInit} from '@angular/core';
import {GameReference} from "../../../models/dto/game-reference";
import {Summoner} from "../../../models/dto/summoner";
import {Observable} from "rxjs/Observable";
import {ResType} from "../../../enums/api-response-type";
import {GameRecordPersonalised} from "../../../models/game-record-personalised";
import {GameRecord} from "../../../models/dto/game-record";
import {Premade} from "../../../models/premade";
import {GameApiService} from "../../../services/game-api.service";
import {RatelimitedRequestsService} from "../../../services/ratelimited-requests.service";
import {ChampionsContainer} from "../../../models/dto/containers/champions-container";
import {ItemsContainer} from "../../../models/dto/containers/items-container";
import {SummonerspellsContainer} from "../../../models/dto/containers/summonerspells-container";
import {GameMetadataService} from "../../../services/game-metadata.service";
import {Subscription} from "rxjs/Subscription";

@Component({
  selector: 'possible-premades',
  templateUrl: './possible-premades.component.html',
  styleUrls: ['./possible-premades.component.scss']
})
export class PossiblePremadesComponent implements OnInit {

  @Input() recent_matches: Array<GameReference>;
  @Input() past_game_limit: number;
  @Input() player_itself: Summoner;
  @Input() other_teammates: Array<Summoner>;

  private possible_premades: Array<Premade> = null;
  private errors: Array<string> = [];
  private subscription: Subscription = null;

  // Metadata
  private champions: ChampionsContainer;
  private items: ItemsContainer;
  private summonerspells: SummonerspellsContainer;

  constructor(private metadata: GameMetadataService,
              private game_api: GameApiService,
              private buffered_requests: RatelimitedRequestsService) { }

  private filterLikelyPremades(premade: Premade) {
    return premade.found_in_games_total >= 2;
  }

  private queryRecentPremades() {
    if (this.subscription && !this.subscription.closed) {
      return; // Requests in progress so noop
    }

    this.errors = [];

    let gamereferences = this.recent_matches.slice(0,this.past_game_limit);
    if (gamereferences.length === 0) {
      this.possible_premades = [];
      return; // No gamereferences passed to input
    }

    this.subscription = Observable.forkJoin(
      gamereferences.map((gameref: GameReference) => this.buffered_requests.buffer(() => {
        return this.game_api.getHistoricalGame(gameref.region, gameref.game_id);
      }))
    )
      .subscribe(game_api_responses => {
        if (game_api_responses.every(api_res => api_res.type == ResType.SUCCESS)) {
          let game_details: Array<GameRecordPersonalised> = [];
          for (let i = 0; i < gamereferences.length; i++) {
            game_details.push(new GameRecordPersonalised(
              (<GameRecord> game_api_responses[i].data).raw_origin,
              this.player_itself,
              gamereferences[i].chosen_champion.id,
              this.champions,
              this.items,
              this.summonerspells
            ));
          }
          let possible_premades: Array<Premade> = [];
          for (let g of game_details) {
            for (let teammate_summoner of this.other_teammates) {
              if (g.teams.ally.players.map(p => p.summoner.id).indexOf(teammate_summoner.id) !== -1) {
                let existing_premade = possible_premades.find(premade => premade.summoner.id === teammate_summoner.id);
                if (!existing_premade) {
                  possible_premades.push(new Premade(teammate_summoner, 1, game_details.length));
                } else {
                  existing_premade.found_in_games_total++;
                }
              }
            }
          }
          this.possible_premades = possible_premades;
        } else {
          for (let game_api_res of game_api_responses) {
            if (game_api_res.type === ResType.ERROR) {
              this.errors.push(`Error when requesting match details. (${game_api_res.error})`);
            }
          }
        }
      });
  }

  ngOnInit() {
    // Get first loads of static data
    this.metadata.champions$.first().subscribe(container => this.champions = container);
    this.metadata.items$.first().subscribe(container => this.items = container);
    this.metadata.summonerspells$.first().subscribe(container => this.summonerspells = container);
    this.queryRecentPremades();
  }

}
