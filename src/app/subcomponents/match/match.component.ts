import { Component, OnInit } from '@angular/core';
import {Summoner} from "../../models/dto/summoner";
import {GameMetadataService} from "../../services/game-metadata.service";
import {Observable} from "rxjs/Observable";

@Component({
  selector: 'match',
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.scss']
})
export class MatchComponent implements OnInit {

  private is_metadata_ready: boolean = false;
  private game_possibly_started: boolean = false;
  private ally_teammate: Summoner = null;
  private error_message = "";

  constructor(private metadata: GameMetadataService) { }

  private handleGameStartedWithTeammate(ally_summoner: Summoner) {
    this.game_possibly_started = true;
    this.ally_teammate = ally_summoner;
  }

  private handleGameNotFound(invalid_ally: Summoner) {
    if (invalid_ally === null) {
      this.error_message = "An error happened trying to request current match. Try again.";
    } else {
      this.error_message = `Teammate ${invalid_ally.current_name} is not in game yet. Try again later.`;
    }
    this.game_possibly_started = false;
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
}