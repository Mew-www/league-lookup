import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {SummonerspellsContainer} from "../../../models/dto/containers/summonerspells-container";
import {ChampionsContainer} from "../../../models/dto/containers/champions-container";
import {RatelimitedRequestsService} from "../../../services/ratelimited-requests.service";
import {GameApiService} from "../../../services/game-api.service";
import {CurrentGame} from "../../../models/dto/current-game";
import {PlayerApiService} from "../../../services/player-api.service";
import {GameMetadataService} from "../../../services/game-metadata.service";
import {Subscription} from "rxjs/Subscription";
import {Observable} from "rxjs/Observable";
import {ResType} from "../../../enums/api-response-type";
import {Summoner} from "../../../models/dto/summoner";

@Component({
  selector: 'current-game',
  templateUrl: './current-game.component.html',
  styleUrls: ['./current-game.component.scss']
})
export class CurrentGameComponent implements OnInit, OnChanges {

  @Input() current_game: CurrentGame;

  private ongoing_request: Subscription;
  private enemies: Array<Summoner>;
  private allies: Array<Summoner>;
  private errors = [];

  private getTeammatesOfPlayer(summoner: Summoner) {
    return this.enemies.filter(t => t.id != summoner.id);
  }


  constructor(private player_api: PlayerApiService,
              private buffered_requests: RatelimitedRequestsService) { }

  ngOnInit() {  }

  ngOnChanges(changes) {
    if (
      changes.hasOwnProperty('current_game')
      &&
      (
        !changes['current_game'].previousValue
        || (<CurrentGame>changes['current_game'].previousValue).game_id !== (<CurrentGame>changes['current_game'].currentValue.game_id)
      )
    ) {
      this.ongoing_request = Observable.forkJoin(
        this.current_game.enemies.map(participant => this.buffered_requests.buffer(() => {
          return this.player_api.getSummonerByName(this.current_game.region, participant.summoner_name);
        }))
      )
        .subscribe(api_responses => {
          let responses = Object.keys(api_responses).map(k => api_responses[k]);
          if (responses.every(api_res => api_res.type === ResType.SUCCESS)) {
            this.enemies = responses.map(api_res => <Summoner>api_res.data);
          }

          this.ongoing_request = Observable.forkJoin(
            this.current_game.allies.map(participant => this.buffered_requests.buffer(() => {
              return this.player_api.getSummonerByName(this.current_game.region, participant.summoner_name);
            }))
          )
            .subscribe(api_responses => {
              let responses = Object.keys(api_responses).map(k => api_responses[k]);
              if (responses.every(api_res => api_res.type === ResType.SUCCESS)) {
                this.allies = responses.map(api_res => <Summoner>api_res.data);
              }
            });
        });
    }
  }

}
