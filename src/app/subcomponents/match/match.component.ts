import { Component, OnInit } from '@angular/core';
import {Summoner} from "../../models/dto/summoner";
import {Observable} from "rxjs/Observable";
import {SummonerspellsContainer} from "../../models/dto/containers/summonerspells-container";
import {ItemsContainer} from "../../models/dto/containers/items-container";
import {ChampionsContainer} from "../../models/dto/containers/champions-container";
import {ResType} from "../../enums/api-response-type";
import {StaticApiService} from "../../services/static-api.service";
import {GameMetadataService} from "../../services/game-metadata.service";

@Component({
  selector: 'match',
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.scss']
})
export class MatchComponent implements OnInit {

  // Metadata - loaded in this class during initialization
  private champions: ChampionsContainer;
  private items: ItemsContainer;
  private summonerspells: SummonerspellsContainer;
  private is_metadata_ready: boolean = false;

  private game_possibly_started: boolean = false;
  private ally_teammate: Summoner = null;
  private error_message = "";

  constructor(private metadata: GameMetadataService) {
  }

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
    this.metadata.load();
    let initial_sub = this.metadata.requests_finished$
      .subscribe(finished => {
        if (finished && this.metadata.is_ready) {
          this.champions = this.metadata.champions;
          this.items = this.metadata.items;
          this.summonerspells = this.metadata.summonerspells;
          this.is_metadata_ready = true;
          initial_sub.unsubscribe();
        }
      });
  }
}