import {Summoner} from "./dto/summoner";

export class Premade {

  public readonly summoner: Summoner;
  public found_in_games_total: number;
  public searched_in_games_total: number;

  constructor(summoner: Summoner, found_in_games_total: number, searched_in_games_total: number) {
    this.summoner = summoner;
    this.found_in_games_total = found_in_games_total;
    this.searched_in_games_total = searched_in_games_total;
  }
}