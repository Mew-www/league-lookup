import {Component, Input, OnInit} from '@angular/core';
import {Summoner} from "../../models/dto/summoner";
import {TranslatorService} from "../../services/translator.service";
import {PreferencesService} from "../../services/preferences.service";
import {ChampionsContainer} from "../../models/dto/containers/champions-container";
import {ItemsContainer} from "../../models/dto/containers/items-container";
import {ProfileType} from "../../enums/profile-type";
import {SummonerspellsContainer} from "../../models/dto/containers/summonerspells-container";
import {StaticApiService} from "../../services/static-api.service";
import {Observable} from "rxjs/Observable";
import {ResType} from "../../enums/api-response-type";
import {GameMetadataService} from "../../services/game-metadata.service";

@Component({
  selector: 'profiling',
  templateUrl: './profiling.component.html',
  styleUrls: ['./profiling.component.scss']
})
export class ProfilingComponent implements OnInit {

  private champions: ChampionsContainer;
  private items: ItemsContainer;
  private summonerspells: SummonerspellsContainer;
  private is_metadata_ready: boolean = false;

  private selected_summoner: Summoner = null;
  private profileTypeEnum = ProfileType;
  private selected_profile_type: ProfileType = null;
  private gettext: Function;
  private current_region;

  constructor(private metadata: GameMetadataService,
              private translator: TranslatorService,
              private preferencesService: PreferencesService) {
    this.gettext = this.translator.getTranslation;
  }

  public handleSummonerChanged(new_selected_summoner) {
    this.selected_summoner = new_selected_summoner;
  }

  public handleProfileTypeChanged(new_type) {
    this.selected_profile_type = new_type;
  }

  ngOnInit() {
    this.current_region = this.preferencesService.getPref('region'); // Expected to be set before init (see: Setup -component)
    this.preferencesService.preferences$
      .subscribe(new_prefs => {
        if (new_prefs.hasOwnProperty('region') && new_prefs.region !== this.current_region) {
          this.current_region = new_prefs.region;
          this.selected_summoner = null;
        }
      });

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