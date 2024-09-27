
import { ICommand } from '../commands';
import { IEvent } from '../events';
import { Store } from 'redux';

// Command Dispatcher
export class CommandDispatcher {
  private commandHandlers: Map<string, (command: ICommand) => void> = new Map();

  registerHandler<T extends ICommandHandler<ICommand>>(handler: T): void {
    this.commandHandlers.set((handler as any).constructor.name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase().split('_').slice(0, (handler as any).constructor.name.replace(/([a-z])([A-Z])/g, '$1_$2').split('_').indexOf('Command') + 1).join('_'), handler.handle as (command: ICommand) => void);
  }

  dispatch(command: ICommand): void {
    const handler = this.commandHandlers.get(command.type);
    if (handler) {
      handler(command);
    } else {
      throw new Error(\`No handler registered for command type: \${command.type}\`);
    }
  }
}

// Event Dispatcher
export class EventDispatcher {
  private eventHandlers: Map<string, (event: IEvent) => void> = new Map();

  registerHandler<T extends IEventHandler<IEvent>>(handler: T): void {
    this.eventHandlers.set((handler as any).constructor.name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase().split('_').slice(0, (handler as any).constructor.name.replace(/([a-z])([A-Z])/g, '$1_$2').split('_').indexOf('Event') + 1).join('_'), handler.handle as (event: IEvent) => void);
  }

  dispatch(event: IEvent): void {
    const handler = this.eventHandlers.get(event.type);
    if (handler) {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in event handler:`, error);
      }
    } else {
      throw new Error(\`No handler registered for event type: \${event.type}\`);
    }
  }
}

export interface ICommandHandler<T extends ICommand> {
  handle(command: ICommand): void;
}

export interface IEventHandler<T extends IEvent> {
  handle(event: IEvent): void;
}

export abstract class CommandHandler<T extends ICommand> implements ICommandHandler<T> {
  abstract handle(command: ICommand): void;
}

export abstract class EventHandler<T extends IEvent> implements IEventHandler<T> {
  abstract handle(event: IEvent): void;
}
