import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {Http, HttpModule, RequestOptions, XHRBackend} from '@angular/http';

import { AppComponent } from './app.component';
import { KonamiComponent } from './konami/konami.component';
import {PreferencesService} from "./services/preferences.service";
import {TranslatorService} from "./services/translator.service";
import {StaticApiService} from "./services/static-api.service";
import {PlayerApiService} from "./services/player-api.service";
import {GameApiService} from "./services/game-api.service";
import { SetupComponent } from './subcomponents/setup/setup.component';
import { LanguageSelectorComponent } from './subcomponents/setup/language-selector/language-selector.component';
import { RegionSelectorComponent } from './subcomponents/setup/region-selector/region-selector.component';
import { StringifyGameTypePipe } from './pipes/stringify-game-type.pipe';
import { SummonerComponent } from './genericcomponents/summoner/summoner.component';
import {RatelimitedRequestsService} from "./services/ratelimited-requests.service";
import {RouterModule, Routes} from "@angular/router";
import { MatchComponent } from './subcomponents/match/match.component';
import { PreGameComponent } from './subcomponents/match/pre-game/pre-game.component';
import { PreGameChatparserComponent } from './subcomponents/match/pre-game/pre-game-chatparser/pre-game-chatparser.component';
import { PreGameTeammatesComponent } from './subcomponents/match/pre-game/pre-game-teammates/pre-game-teammates.component';
import {DragulaModule} from "ng2-dragula";
import { PreGameTeammateComponent } from './subcomponents/match/pre-game/pre-game-teammates/pre-game-teammate/pre-game-teammate.component';
import { TeammateLeaguePositionComponent } from './subcomponents/match/pre-game/pre-game-teammates/pre-game-teammate/teammate-league-position/teammate-league-position.component';
import { RoleSelectorComponent } from './subcomponents/match/pre-game/pre-game-teammates/pre-game-teammate/teammate-role-selector/role-selector.component';
import { PreferredLanesComponent } from './genericcomponents/preferred-lanes/preferred-lanes.component';
import { PreviousGamesComponent } from './subcomponents/match/pre-game/pre-game-teammates/pre-game-teammate/previous-games/previous-games.component';
import { SquarebraceTitledContainerComponent } from './genericcomponents/squarebrace-titled-container/squarebrace-titled-container.component';
import {CanActivateViaRegionGuard} from "./guards/can-activate-via-region.guard";
import { PreviousRolesComponent } from './subcomponents/match/pre-game/pre-game-teammates/pre-game-teammate/previous-roles/previous-roles.component';
import { InGameComponent } from './subcomponents/match/in-game/in-game.component';
import {GameMetadataService} from "./services/game-metadata.service";
import {LoggingHttpService} from "./services/logging-http.service";
import { DebugComponent } from './subcomponents/debug/debug.component';
import {LogHistoryService} from "./services/log-history.service";

const routes: Routes = [
  {'path': "debug", component: DebugComponent},
  {'path': "match", component: MatchComponent, canActivate: [CanActivateViaRegionGuard]},
  {'path': "**", component: MatchComponent, canActivate: [CanActivateViaRegionGuard]}
];

export function loggedHttpFactory (xhr_backend: XHRBackend, request_options: RequestOptions, log_history: LogHistoryService): Http {
  return new LoggingHttpService(xhr_backend, request_options, log_history);
}

@NgModule({
  declarations: [
    AppComponent, KonamiComponent,
    SetupComponent, LanguageSelectorComponent, RegionSelectorComponent,
    SummonerComponent,
    StringifyGameTypePipe,
    MatchComponent,
    PreGameComponent,
    PreGameChatparserComponent,
    PreGameTeammatesComponent,
    PreGameTeammateComponent,
    TeammateLeaguePositionComponent,
    RoleSelectorComponent,
    PreferredLanesComponent,
    PreviousGamesComponent,
    SquarebraceTitledContainerComponent,
    PreviousRolesComponent,
    InGameComponent,
    DebugComponent
  ],
  imports: [
    DragulaModule,
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    {
      provide: Http,
      useFactory: loggedHttpFactory,
      deps: [XHRBackend, RequestOptions, LogHistoryService]
    },
    PreferencesService, TranslatorService,
    CanActivateViaRegionGuard,
    StaticApiService, PlayerApiService, GameApiService,
    RatelimitedRequestsService,
    GameMetadataService,
    LogHistoryService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
