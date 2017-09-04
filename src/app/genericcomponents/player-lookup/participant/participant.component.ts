import {Component, Input, OnInit} from '@angular/core';
import {CurrentGameParticipant} from "../../../models/dto/current-game-participant";

@Component({
  selector: 'participant',
  templateUrl: './participant.component.html',
  styleUrls: ['./participant.component.scss']
})
export class ParticipantComponent implements OnInit {

  @Input() participant: CurrentGameParticipant;

  constructor() { }

  ngOnInit() {
  }

}
