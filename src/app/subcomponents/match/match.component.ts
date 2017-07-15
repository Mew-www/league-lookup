import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {GameMetadataService} from "../../services/game-metadata.service";
import {Observable} from "rxjs/Observable";
import {GameLobby} from "../../models/dto/game-lobby";
import {CurrentGame} from "../../models/dto/current-game";
import {LobbyGeneratorComponent} from "./lobby-generator/lobby-generator.component";
import {CurrentGameFinderComponent} from "./current-game-finder/current-game-finder.component";

@Component({
  selector: 'match',
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.scss']
})
export class MatchComponent implements OnInit, AfterViewInit {

  @ViewChild(LobbyGeneratorComponent) lobby_generator: LobbyGeneratorComponent;
  @ViewChild(CurrentGameFinderComponent) current_game_finder: CurrentGameFinderComponent;

  private is_metadata_ready: boolean = false;
  private lobby: GameLobby = null;
  private current_game: CurrentGame = null;

  constructor(private metadata: GameMetadataService) { }

  private handleNewLobby(new_lobby) {
    this.lobby = new_lobby;
    // Reset the current_game if a new lobby is given
    this.current_game = null;
    this.lobby_generator.minimized = true;
    this.current_game_finder.minimized = true;
  }

  private handleNewCurrentGame(new_current_game) {
    this.current_game = new_current_game;
    this.lobby_generator.minimized = true;
    this.current_game_finder.minimized = true;
  }

  ngOnInit() {
    Observable.forkJoin([
      this.metadata.champions$.first(),
      this.metadata.items$.first(),
      this.metadata.summonerspells$.first()
    ])
      .subscribe(metadata_containers => {
        this.is_metadata_ready = true;
      })
  }

  ngAfterViewInit() {

  }
}