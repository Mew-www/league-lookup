import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {GameReference} from "../../../models/dto/game-reference";
import {Subscription} from "rxjs/Subscription";
import {Observable} from "rxjs/Observable";
import {RatelimitedRequestsService} from "../../../services/ratelimited-requests.service";
import {GameApiService} from "../../../services/game-api.service";
import {ResType} from "../../../enums/api-response-type";
import {Summoner} from "../../../models/dto/summoner";
import {GameRecordPersonalised} from "../../../models/game-record-personalised";
import {GameRecord} from "../../../models/dto/game-record";
import {ChampionsContainer} from "../../../models/dto/containers/champions-container";
import {ItemsContainer} from "../../../models/dto/containers/items-container";
import {SummonerspellsContainer} from "../../../models/dto/containers/summonerspells-container";
import {TranslatorService} from "../../../services/translator.service";
import {Champion} from "../../../models/dto/champion";
import {GameMetadataService} from "../../../services/game-metadata.service";
import {PreferencesService} from "../../../services/preferences.service";

@Component({
  selector: 'previous-games',
  templateUrl: './previous-games.component.html',
  styleUrls: ['./previous-games.component.scss']
})
export class PreviousGamesComponent implements OnInit {

  @Input() summoner: Summoner; // Required
  @Input() slice_of_gamehistory: Array<GameReference>; // Required
  @Input() limit: number = null; // Optional; First N games

  @Input() display_summary_kda: boolean = true;
  @Input() display_summary_cs: boolean = true;
  @Input() display_summary_cs10: boolean = true;
  @Input() display_summary_damageth: boolean = true;

  // State output
  @Output() loadStart: EventEmitter<boolean> = new EventEmitter();
  @Output() loaded: EventEmitter<boolean> = new EventEmitter();

  private current_region;
  private subscription: Subscription = null;
  private days_ago_collections = null;
  private error_message = '';
  private champion_id_filter = null;

  // Metadata
  private champions: ChampionsContainer;
  private items: ItemsContainer;
  private summonerspells: SummonerspellsContainer;

  // Utils
  private gettext: Function;
  private Math = Math;

  constructor(private preferences_service: PreferencesService,
              private metadata: GameMetadataService,
              private buffered_requests: RatelimitedRequestsService,
              private game_api: GameApiService,
              private translator: TranslatorService) {
    this.gettext = this.translator.getTranslation;
  }

  private getTimeAgoAsString(date: Date) {

    let time_difference_ms = new Date().getTime() - date.getTime(); // now - then
    let local_yesterday_begin = ((new Date()).getHours() + 24) * 1000 * 60 * 60; // (Hours today + 24 hours) earlier

    if (time_difference_ms < 1000*60*60*24) {
      // Less-than-day ago
      let full_hours_ago = Math.floor(time_difference_ms / (1000*60*60));
      if (full_hours_ago == 0) {
        // Count minutes instead
        let full_minutes_ago = Math.floor(time_difference_ms / (1000*60));
        if (full_minutes_ago == 0) {
          return `${this.gettext("just_now")}`;
        }
        if (full_minutes_ago == 1) {
          return `1 ${this.gettext("minute_ago")}`;
        }
        // Else
        return `${full_minutes_ago} ${this.gettext("n_minutes_ago")}`;
      }
      if (full_hours_ago == 1) {
        return `1  ${this.gettext("hour_ago")}`;
      }
      // Else
      return `${full_hours_ago} ${this.gettext("n_hours_ago")}`;

    } else if (time_difference_ms < local_yesterday_begin) {
      // Since (local-/browsertime) "yesterday" began
      return this.gettext("yesterday");

    } else {
      // DD. MM. YYYY
      return ("0"+date.getDate()).slice(-2) + '.' + ("0"+(date.getMonth()+1)).slice(-2) + '.' + date.getFullYear();
    }
  }

  private getDaysAgoAsString(collection) {
    let nr_of_days = collection.days_ago;
    if (nr_of_days === 0) {
      return this.gettext("today");
    } else if (nr_of_days === 1) {
      return this.gettext("yesterday");
    } else {
      if (collection.contents.length === 1) {
        return nr_of_days.toString() + ' ' + this.gettext("days_ago").slice(0,1) + '..';
      } else {
        return nr_of_days.toString() + ' ' + this.gettext("days_ago");
      }
    }
  }

  private getPlayedChampionsNameOrdered(): Array<Champion> {
    let played_champions = this.slice_of_gamehistory.map(gameref => gameref.chosen_champion.id)
      .filter((id, idx, self) => self.indexOf(id) === idx); // Filter unique, like set(<list>) in python
    return this.champions.listChampions()
      .filter(champion => played_champions.indexOf(champion.id) !== -1)
      .sort((a,b) => a.name.localeCompare(b.name));
  }

  private loadPreviousGames(opt_champion_id_filter?, opt_role_filter?) {
    // Cancel if any unfinished ongoing requests
    if (this.subscription && !this.subscription.closed) {
      return;
    }

    this.error_message = '';

    // If champion-filter is set then apply it
    let gamereferences = opt_champion_id_filter ?
      this.slice_of_gamehistory.filter(gameref => gameref.chosen_champion.id.toString() === opt_champion_id_filter)
      : this.slice_of_gamehistory;

    // If role-filter is set then apply it
    gamereferences = opt_role_filter ?
      gamereferences.filter(gameref => gameref.presumed_lane === opt_role_filter)
      : gamereferences;

    // If limit is set then apply it -> first N gamereferences
    gamereferences = this.limit ? gamereferences.slice(0, this.limit) : gamereferences;

    if (gamereferences.length === 0) {
      this.days_ago_collections = [];
      return;
    }

    // Start loading (optionally limited) game details
    this.loadStart.emit(true);
    this.subscription = Observable.forkJoin(
      gamereferences.map((gameref: GameReference) => this.buffered_requests.buffer(() => {
        return this.game_api.getHistoricalGame(gameref.region, gameref.game_id);
      }))
    )
      .subscribe(game_api_responses => {
        if (game_api_responses.every(api_res => api_res.type == ResType.SUCCESS)) {
          let game_details = [];
          for (let i=0; i<gamereferences.length; i++) {
            game_details.push(new GameRecordPersonalised(
              (<GameRecord> game_api_responses[i].data).raw_origin,
              this.summoner,
              gamereferences[i].chosen_champion.id,
              this.champions,
              this.items,
              this.summonerspells
            ));
          }

          let time_now = (new Date()).getTime();
          let time_since_daybreak = (new Date()).getHours() * 1000 * 60 * 60; // Hour accuracy
          this.days_ago_collections = game_details.reduce((days_ago_collections, g, i) => {
            // Parse the [today: [matches], yesterday: [matches], etc.] times
            let time_then = g.match_start_time.getTime();
            let happened_today = (time_now - time_then - time_since_daybreak) <= 0;
            let days_ago = happened_today ? 0 : Math.ceil((time_now - time_then - time_since_daybreak) / (1000*60*60*24));
            let collection = days_ago_collections.find(coll => coll.days_ago === days_ago);
            if (!collection) {
              collection = {
                days_ago: days_ago,
                contents: []
              };
              days_ago_collections.push(collection);
            }
            // Parse match itself
            let player_itself = g.teams.ally.players.find(p => p.is_the_target);
            collection.contents.push({
              region: g.region,
              player_as_participant: player_itself,
              role: gamereferences[i].presumed_lane,
              victory: g.teams.ally.stats.isWinningTeam,
              start_time: g.match_start_time,
              duration: g.match_duration_seconds,
              nr_carry: g.teams.ally.players
                .sort((p1,p2) => p2.stats.combat_totals.damage_dealt_vs_champions.all - p1.stats.combat_totals.damage_dealt_vs_champions.all)
                .map(p => p.summoner.id)
                .indexOf(this.summoner.id)+1,
              kda: player_itself.stats.kda.kills + '/' + player_itself.stats.kda.deaths + '/' + player_itself.stats.kda.assists,
              cs_lane: player_itself.stats.creeps.lane,
              cs_jungle: player_itself.stats.creeps.jungle,
              cs_at_ten: player_itself.stats.timeline.cs_at_ten
            });
            return days_ago_collections;
          }, []);
        } else {
          this.error_message = 'Something went wrong when requesting game details.';
        }
        this.loaded.emit(true);
      });
  }

  ngOnInit() {
    this.current_region = this.preferences_service.getPref('region'); // Expected to be set before init (see: Setup -component)

    // Get first loads of static data
    this.metadata.champions$.first().subscribe(container => this.champions = container);
    this.metadata.items$.first().subscribe(container => this.items = container);
    this.metadata.summonerspells$.first().subscribe(container => this.summonerspells = container);
    this.loadPreviousGames();
  }

}
