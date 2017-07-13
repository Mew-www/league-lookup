import {Summoner} from "./summoner";
import {GameType} from "../../enums/game-type";

export class GameLobby {

  public readonly teammates: Array<Summoner>;
  public readonly game_type: GameType;

  constructor(teammates: Array<Summoner>, game_type: GameType) {
    this.teammates = teammates;
    this.game_type = game_type;
  }
}