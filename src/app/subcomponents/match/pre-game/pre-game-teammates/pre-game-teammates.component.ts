import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {Summoner} from "../../../../models/dto/summoner";
import {GameType} from "../../../../enums/game-type";

@Component({
  selector: 'pre-game-teammates',
  templateUrl: './pre-game-teammates.component.html',
  styleUrls: ['./pre-game-teammates.component.scss']
})
export class PreGameTeammatesComponent implements OnInit, OnChanges {

  @Input() queue: GameType;
  @Input() teammates: Array<Summoner>;

  @Output() gameStartedWithTeammate: EventEmitter<Summoner> = new EventEmitter();

  private display_icons: boolean = false;
  private minified_mode: boolean = true;
  private wait_role_selection: boolean = true;
  private roles_selected = 0;
  constructor() { }

  handleSelectedInitialRole() {
    this.roles_selected++;
  }

  ngOnInit() {
  }

  ngOnChanges(changes) {
    // If teammates was given as input, and it wasn't the initial value, and it was changed
    if (changes.hasOwnProperty('teammates')
      && changes['teammates'].previousValue
      && JSON.stringify(changes['teammates'].currentValue) !== JSON.stringify(changes['teammates'].previousValue))
    {
      // Reset component state
      this.roles_selected = 0;
      this.wait_role_selection = true;
    }
  }

}
