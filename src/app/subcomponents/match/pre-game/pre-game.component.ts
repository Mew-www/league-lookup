import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Summoner} from "../../../models/dto/summoner";
import {GameLobby} from "../../../models/dto/game-lobby";

@Component({
  selector: 'pre-game',
  templateUrl: './pre-game.component.html',
  styleUrls: ['./pre-game.component.scss']
})
export class PreGameComponent implements OnInit {

  @Output() gameStartedWithTeammate: EventEmitter<Summoner> = new EventEmitter();

  private lobby: GameLobby;

  constructor() { }

  private handleNewLobby(game_lobby) {
    this.lobby = game_lobby;
  }

  ngOnInit() {
  }

}
