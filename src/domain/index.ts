import { Guid } from 'guid-typescript';
import { IEvent } from '../events';
import { Dispatch, Store } from 'redux';

export abstract class BaseEntity {
    Id: Guid;
    dispatch: Dispatch;
    constructor(dispatch: Dispatch, id: Guid) {
    this.dispatch = dispatch;
    this.Id = id;
  }
}

export abstract class AggregateRoot extends BaseEntity {
  protected abstract apply(event: IEvent): void;
}


export abstract class Domain extends AggregateRoot {
    public constructor(dispatch: Dispatch, id: Guid) {
        super(dispatch, id);
    }

    abstract apply(event: IEvent) : void;
}

type Constructor<T> = new (...args: any[]) => T;

export function hydrateEntity<T>(store: Store, entityClass: Constructor<T>, entityId: Guid): T {
  // Get the current state from the Redux store
  const state = store.getState();
  const stateSlice = entityClass.name.toLowerCase();

  // Extract the entities from the specified state slice
  const entities = state[stateSlice];

  // Find the entity data by ID
  const entityData = entities[entityId.toString()];

  // If the entity is not found, return new entity
 const domain : any = new entityClass(store.dispatch, entityId);


 if(entityData) {
  Object.keys(entityData).forEach((key : string) => {
    if (typeof entityData[key] === 'string' && entityData[key].match(/^[{]?[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}[}]?$/) && Guid.parse(entityData[key]) !== Guid.createEmpty()) {
        domain[key] = Guid.parse(entityData[key])
    } else {
        domain[key] = entityData[key]
    }
  })
 }
 
  // Use the EntityClass constructor to create a new instance
return domain as T;
}