# Redux CQRS Integration Guide

This guide provides a comprehensive overview of implementing the CQRS (Command Query Responsibility Segregation) pattern in a Redux-based application using the 'redux-cqrs' package. We’ll demonstrate how to define commands, handle them in command handlers, apply business logic in domain models, and update the Redux store.

## Step-by-Step Implementation

### 1. Setting Up the Redux Store with CQRS Middleware

Set up the Redux store to use the CQRS middleware, which will intercept and route commands and events.

````typescript
// ./cqrs/store.ts

import { createStore, applyMiddleware } from 'redux';
import { CommandDispatcher, EventDispatcher, createCQRSReduxMiddleware } from 'redux-cqrs';
import rootReducer from './reducers';

export const commandDispatcher = new CommandDispatcher();
export const eventDispatcher = new EventDispatcher();

const cqrsMiddleware = createCQRSReduxMiddleware(commandDispatcher, eventDispatcher);

const store = createStore(rootReducer, applyMiddleware(cqrsMiddleware));

export default store;
````

### 2. Defining the Login Command

Define the 'LoginUserCommand' to represent a login action. This command will encapsulate the data required for a login attempt and be handled by a command handler.

````typescript
// ./cqrs/commands/user/LoginUserCommand.ts

import { Command } from '../Command';
import { Guid } from 'guid-typescript';

export class LoginUserCommand extends Command {
  constructor(userId: Guid, accessToken: string) {
    super(userId);
    this.AccessToken = accessToken;
  }

  public AccessToken: string;
}
````

### 3. Implementing the Command Handler

The 'LoginUserCommandHandler' processes the 'LoginUserCommand', interacts with the 'User' domain, and updates the user state. Command handlers are responsible for executing any logic related to the command.

````typescript
// ./cqrs/handlers/user/LoginUserCommandHandler.ts

import { CommandHandler } from 'redux-cqrs';
import { LoginUserCommand } from '../../commands/user';
import { User } from '../../domains/User';
import { hydrateEntity } from 'redux-cqrs';
import store from '../../store';

export class LoginUserCommandHandler extends CommandHandler<LoginUserCommand> {
  async handle(command: LoginUserCommand): Promise<void> {
    const user = hydrateEntity(store, User, command.Id);
    user.login(command.AccessToken, '', '', false);
  }
}
````

In this handler:
- **Domain Hydration**: The 'User' domain is fetched using 'hydrateEntity'.
- **Domain Method Execution**: The 'user.login()' method is called with data from the command.

### 4. Defining the Login Event

Define the 'UserLoggedInEvent' class to represent the successful login event. Events are used to capture and propagate the results of commands.

````typescript
// ./cqrs/events/user/UserLoggedInEvent.ts

import { Event } from 'redux-cqrs';
import { Guid } from 'guid-typescript';

export class UserLoggedInEvent extends Event {
  constructor(userId: Guid, email: string, name: string, premium: boolean) {
    super(userId);
    this.Email = email;
    this.Name = name;
    this.Premium = premium;
  }

  public Email: string;
  public Name: string;
  public Premium: boolean;
}
````

### 5. Updating the Domain Model

The 'User' domain model encapsulates the business logic for handling user-related actions. It defines the 'login' method, which applies the 'UserLoggedInEvent' upon successful login. This domain model aligns with your current project structure and handles events through the 'apply' method.

````typescript
// ./cqrs/domains/User.ts

import { Domain } from './Domain';
import { IEvent } from 'redux-cqrs/';
import { Address } from '../../../../../Template/implementations';
import { UserCreatedEvent, UserLoggedInEvent, UserLoggedOutEvent, PremiumUnlockedEvent, ResultsSavedEvent } from '../events/user';
import { Dispatch } from 'redux';
import { Guid } from 'guid-typescript';
import store from '../store';

export class User extends Domain {
  constructor(dispatch: Dispatch, id: Guid, name: string, email: string, password: string, DoB: Date, address: Address, role: number) {
    super(dispatch, id);
    this.Name = name;
    this.Email = email;
    this.Password = password;
    this.DoB = DoB;
    this.Address = address;
    this.Role = role;
  }

  public Name!: string;
  public Email!: string;
  public Password!: string;
  public DoB!: Date;
  public Address!: Address;
  public Role!: number;
  public AccessToken!: string;
  public LastLogin!: Date;
  public Premium!: boolean;

  public login(accessToken: string, email: string, name: string, premium: boolean): void {
    this.Email = email;
    this.Name = name;
    this.AccessToken = accessToken;
    this.apply(new UserLoggedInEvent(this.Id, this.Email, this.Name, premium));
  }

  public apply(event: IEvent): void {
    store.dispatch(event);
  }
}
````

### 6. Updating the Auth Reducer

The 'authReducer' listens for the 'UserLoggedInEvent' and updates the Redux store to reflect the authenticated user state.

````typescript
// ./cqrs/reducers/auth/authReducer.ts

import { IEvent, ActionType } from 'redux-cqrs';
import { UserLoggedInEvent } from '../../events/user/UserLoggedInEvent';

interface AuthState {
  isAuthenticated: boolean;
  userId: string;
  email?: string;
  name?: string;
}

const initialState: AuthState = {
  isAuthenticated: false,
  userId: '',
};

export const authReducer = (state = initialState, action: IEvent): AuthState => {
  if (action.type.toUpperCase() === ActionType(UserLoggedInEvent)) {
    const event = action as UserLoggedInEvent;
    return {
      ...state,
      isAuthenticated: true,
      userId: event.Id.toString(),
      email: event.Email,
      name: event.Name,
    };
  }

  return state;
};
````

### 7. Implementing the Login Component

Create a 'LoginContainer' component to dispatch the 'LoginUserCommand'. This component initializes the command with the user ID and access token, then dispatches it.

````typescript
// ./components/Login/Container.tsx

import React from 'react';
import { commandDispatcher } from '../../cqrs/store';
import { LoginUserCommand } from '../../cqrs/commands/user/LoginUserCommand';
import { Guid } from 'guid-typescript';

const LoginContainer: React.FC = () => {
  const handleLogin = (accessToken: string) => {
    const userId = Guid.create();
    commandDispatcher.dispatch(new LoginUserCommand(userId, accessToken));
  };

  return <LoginPage onLogin={handleLogin} />;
};

export default LoginContainer;
````

## Summary

1. **Commands**: Define actions that change the system’s state.
2. **Command Handlers**: Process commands and execute related logic in the domain model.
3. **Events**: Capture the results of commands and are used to update the store.
4. **Domain Model**: Encapsulate business logic and manage state changes.
5. **Reducers**: Update Redux store in response to events.
6. **React Component**: Dispatch commands to perform actions within the application.

This guide demonstrates how to establish a clear CQRS structure in your project using 'redux-cqrs', ensuring maintainability, scalability, and efficient state management.
