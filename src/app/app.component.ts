import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {PlatformLocation} from "@angular/common";
import {GameMetadataService} from "./services/game-metadata.service";
import {Http} from "@angular/http";
import {LoggingHttpService} from "./services/logging-http.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  private is_setup_ready: boolean = false;
  private is_konami_triggered: boolean = false;
  private is_metadata_ready: boolean = false;

  constructor(private platformLocation: PlatformLocation,
              private router: Router,
              private metadata: GameMetadataService,
              private logging_http: Http) { }

  public handleSetupReady(e) {
    // If setup was first time instantiated, default route redirects any given path to /
    // ...so if it's NOT first time, then pathname != base href.
    // Initially router doesn't trigger the default route when CanActivateViaRouteGuard would let it
    // ...so we trigger it here manually after "isFirstTime" -check.
    // Else (if it's NOT first time) the Guard won't prevent router, and it'll route by itself.
    if (this.platformLocation.getBaseHrefFromDOM() === this.platformLocation.pathname) {
      this.router.navigateByUrl('/match');
    }
    // Activate menu
    this.is_setup_ready = true;
  }

  public handleKonamiTriggered(e) {
    this.is_konami_triggered = true;
  }

  ngOnInit() {
    (<LoggingHttpService>this.logging_http).logger.log('App-root initialized', 'Misc', 'OK');

    this.metadata.load();
    let self = this; // Using anonymous function is currently the only way to cancel subscription inside .subscribe()
    this.metadata.requests_finished$
      .subscribe(function(finished) {
        if (finished && self.metadata.is_ready) {
          self.is_metadata_ready = true;
          this.unsubscribe();
        }
      });
  }
}