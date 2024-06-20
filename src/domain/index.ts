import { Guid } from 'guid-typescript';
import { IEvent } from '../events';
import { Dispatch, Store } from 'redux';

export abstract class BaseEntity {
    id: Guid;
  dispatch: Dispatch;
    constructor(dispatch: Dispatch, id: Guid) {
    this.dispatch = dispatch;
    this.id = id;
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

export function hydrateEntity<T>(store: Store, entityClass: Constructor<T>, entityId: string): T {
  // Get the current state from the Redux store
  const state = store.getState();
  const stateSlice = entityClass.name.toLowerCase();

  // Extract the entities from the specified state slice
  const entities = state[stateSlice];

  // Find the entity data by ID
  const entityData = entities[entityId];

  // If the entity is not found, return new entity
  if (!entityData) {
    return new entityClass(store.dispatch, entityId);
  }

  // Use the EntityClass constructor to create a new instance
return new entityClass(store.dispatch, ...Object.values(entityData));
}