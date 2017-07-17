export class InGameSearch {

  public readonly summoner_id: string;
  public readonly region: string;
  public summoner_name: string;
  public count: number;

  constructor(summoner_id, summoner_name, region) {
    this.summoner_id = summoner_id;
    this.summoner_name = summoner_name;
    this.region = region;
    this.count = 1;
  }
}