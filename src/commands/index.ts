import { Guid } from "guid-typescript";
import { UnknownAction } from "redux";
export declare interface ICommand extends UnknownAction {
  Id: Guid;
  type: string;
}

export abstract class Command implements ICommand {
  [index: string]: any; // Add index signature for type 'string'
  constructor(id: Guid) {
      this.Id = id;
      this.type = this.constructor.name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
  }

  public Id: Guid;

  public type: string;
  
}