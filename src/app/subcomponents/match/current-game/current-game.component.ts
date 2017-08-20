import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {RatelimitedRequestsService} from "../../../services/ratelimited-requests.service";
import {CurrentGame} from "../../../models/dto/current-game";
import {PlayerApiService} from "../../../services/player-api.service";
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

  private display_icons: boolean = false;
  private minified_mode: boolean = true;

  private ongoing_request: Subscription;
  private enemies: Array<Summoner>;
  private allies: Array<Summoner>;
  private errors = [];

  @Output() close_emitter: EventEmitter<boolean> = new EventEmitter();

  constructor(private player_api: PlayerApiService,
              private buffered_requests: RatelimitedRequestsService) { }

  private getTeammatesOfPlayer(summoner: Summoner, team: Array<Summoner>) {
    return team.filter(t => t.id != summoner.id);
  }

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
