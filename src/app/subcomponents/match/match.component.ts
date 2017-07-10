import { Component, OnInit } from '@angular/core';
import {Summoner} from "../../models/dto/summoner";
import {SummonerspellsContainer} from "../../models/dto/containers/summonerspells-container";
import {ItemsContainer} from "../../models/dto/containers/items-container";
import {ChampionsContainer} from "../../models/dto/containers/champions-container";
import {GameMetadataService} from "../../services/game-metadata.service";
import {Subscription} from "rxjs/Subscription";

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
  private initial_sub: Subscription;
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
    let self = this; // Using anonymous function is currently the only way to cancel subscription inside .subscribe()
    this.metadata.requests_finished$
      .subscribe(function(finished) {
        if (finished && self.metadata.is_ready) {
          self.champions = self.metadata.champions;
          self.items = self.metadata.items;
          self.summonerspells = self.metadata.summonerspells;
          self.is_metadata_ready = true;
          this.unsubscribe();
        }
      });
  }
}