# Redux CQRS Package Overview

This guide provides an overview of implementing a Redux CQRS pattern with domain logic using the Redux CQRS package. It explains how to define commands and events, handle them using command and event handlers, apply business logic in domain models, and update the Redux store.

## Step-by-Step Implementation

### 1. Define Commands and Events

Create command and event classes to represent actions and their outcomes.

```typescript
// src/redux/cqrs/updateItemCommands.ts

import { ICommand } from 'redux-cqrs/src/commands';
import { IEvent } from 'redux-cqrs/src/events';

// Command for updating an item
export class UpdateItemCommand implements ICommand {
  type = 'UPDATE_ITEM_COMMAND';
  constructor(public itemId: string, public newItemName: string, public newQuantity: number) {}
}

// Event for item updated
export class ItemUpdatedEvent implements IEvent {
  type = 'ITEM_UPDATED_EVENT';
  constructor(public itemId: string, public newItemName: string, public newQuantity: number) {}
}
```

### 2. Implement Command and Event Handlers

Create handlers to process commands and update the state in response to events.

```typescript
// src/redux/cqrs/handlers.ts

import { CommandHandler, EventHandler } from 'redux-cqrs/src/dispatchers';
import { UpdateItemCommand, ItemUpdatedEvent } from './updateItemCommands';
import { store } from '../store';
import { Item } from './domain/itemDomain';
import { updateItemInStore } from '../reducers/itemReducer';

// Command Handler for UpdateItemCommand
export class UpdateItemCommandHandler extends CommandHandler<UpdateItemCommand> {
  async handle(command: UpdateItemCommand): Promise<void> {
    try {
      const response = await fetch(\`https://api.example.com/items/\${command.itemId}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: command.newItemName, quantity: command.newQuantity }),
      });

      if (response.ok) {
        const item = new Item(command.itemId, command.newItemName, command.newQuantity);
        const event = item.updateItem(command.newItemName, command.newQuantity);
        store.dispatch(event);
      } else {
        console.error('Failed to update item:', response.statusText);
      }
    } catch (error) {
      console.error('API call failed:', error);
    }
  }
}

// Event Handler for ItemUpdatedEvent
export class ItemUpdatedEventHandler extends EventHandler<ItemUpdatedEvent> {
  handle(event: ItemUpdatedEvent): void {
    store.dispatch(updateItemInStore(event));
  }
}
```

### 3. Update the Domain Model

Extend the domain model to apply business logic and manage state changes.

```typescript
// src/redux/cqrs/domain/itemDomain.ts

import { AggregateRoot } from 'redux-cqrs/src/domain';
import { ItemUpdatedEvent } from '../updateItemCommands';

export class Item extends AggregateRoot {
  itemName: string;
  quantity: number;

  constructor(id: string, itemName: string, quantity: number) {
    super(id);
    this.itemName = itemName;
    this.quantity = quantity;
  }

  updateItem(newItemName: string, newQuantity: number): ItemUpdatedEvent {
    const event = new ItemUpdatedEvent(this.id, newItemName, newQuantity);
    this.applyChange(event);  // Apply and store the event
    return event;
  }

  protected apply(event: ItemUpdatedEvent): void {
    if (event instanceof ItemUpdatedEvent) {
      this.itemName = event.newItemName;
      this.quantity = event.newQuantity;
    }
  }
}
```

### 4. Modify the Reducer

Update the Redux store in response to events.

```typescript
// src/redux/reducers/itemReducer.ts

import { IEvent } from 'redux-cqrs/src/events';
import { ItemUpdatedEvent } from '../cqrs/updateItemCommands';

const ITEM_UPDATED = 'ITEM_UPDATED';

export const updateItemInStore = (event: ItemUpdatedEvent) => ({
  type: ITEM_UPDATED,
  payload: event,
});

const initialState = { items: [] };

const itemReducer = (state = initialState, action: { type: string; payload: any }) => {
  switch (action.type) {
    case ITEM_UPDATED:
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.itemId
            ? { ...item, name: action.payload.newItemName, quantity: action.payload.newQuantity }
            : item
        ),
      };
    default:
      return state;
  }
};

export default itemReducer;
```

### 5. Integrate with the Store

Register handlers and integrate middleware in your store configuration.

```typescript
// src/redux/store.ts

import { createStore, applyMiddleware } from 'redux';
import rootReducer from './reducers';
import { CommandDispatcher, EventDispatcher } from 'redux-cqrs/src/dispatchers';
import { createCQRSReduxMiddleware } from 'redux-cqrs/src/middleware';
import { UpdateItemCommandHandler, ItemUpdatedEventHandler } from './cqrs/handlers';

const commandDispatcher = new CommandDispatcher();
const eventDispatcher = new EventDispatcher();

commandDispatcher.registerHandler('UPDATE_ITEM_COMMAND', new UpdateItemCommandHandler());
eventDispatcher.registerHandler('ITEM_UPDATED_EVENT', new ItemUpdatedEventHandler());

const cqrsMiddleware = createCQRSReduxMiddleware(commandDispatcher, eventDispatcher);

const store = createStore(
  rootReducer,
  applyMiddleware(cqrsMiddleware)
);

export default store;
```

### 6. Create a Component to Dispatch Commands

Use the command in a React component to update an item.

```typescript
// src/components/UpdateItemComponent.tsx

import React from 'react';
import { useDispatch } from 'react-redux';
import { UpdateItemCommand } from '../redux/cqrs/updateItemCommands';

const UpdateItemComponent: React.FC = () => {
  const dispatch = useDispatch();

  const updateItem = () => {
    const command = new UpdateItemCommand('1', 'Updated Item Name', 20);
    dispatch(command);
  };

  return (
    <div>
      <button onClick={updateItem}>Update Item</button>
    </div>
  );
};

export default UpdateItemComponent;
```

## Summary

1. **Commands and Events**: Define what actions should occur and their outcomes.
2. **Handlers**: Process commands, make API calls, and handle events to update the store.
3. **Domain Model**: Encapsulate business logic and manage state changes.
4. **Reducers**: Update Redux store based on events.
5. **Middleware and Store Integration**: Ensure commands and events flow through the middleware.
6. **React Component**: Use commands to perform actions within your app.

This README provides a comprehensive overview and example of using the Redux CQRS package to implement a feature in a Redux-based project.