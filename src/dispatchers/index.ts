
import { ICommand } from '../commands';
import { IEvent } from '../events';

// Command Dispatcher
export class CommandDispatcher {
  private commandHandlers: Map<string, (command: ICommand) => Promise<void>> = new Map();
  private commandQueue: ICommand[] = [];
  private isProcessing: boolean = false;

  registerHandler<T extends ICommandHandler<ICommand>>(handler: T): void {
    this.commandHandlers.set(
      (handler as any).constructor.name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase().split('_').slice(0, (handler as any).constructor.name.replace(/([a-z])([A-Z])/g, '$1_$2').split('_').indexOf('Command') + 1).join('_'), 
      handler.handle as (command: ICommand) => Promise<void>
    );
  }

  async dispatch(command: ICommand): Promise<void> {
    this.commandQueue.push(command);
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.isProcessing = true;
    while (this.commandQueue.length > 0) {
      const command = this.commandQueue.shift()!;
      const handler = this.commandHandlers.get(command.type);
      if (handler) {
        try {
          await handler(command);
        } catch (error) {
          console.error(`Error in command handler:`, error);
        }
      } else {
        console.error(`No handler registered for command type: ${command.type}`);
      }
    }
    this.isProcessing = false;
    return;
  }
}

// Event Dispatcher
export class EventDispatcher {
  private eventHandlers: Map<string, (event: IEvent) => IEvent> = new Map();
  private eventQueue: IEvent[] = [];
  private isProcessing: boolean = false;

  registerHandler<T extends IEventHandler<IEvent>>(handler: T): void {
    this.eventHandlers.set(
      (handler as any).constructor.name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase().split('_').slice(0, (handler as any).constructor.name.replace(/([a-z])([A-Z])/g, '$1_$2').split('_').indexOf('Event') + 1).join('_'), 
      handler.handle as (event: IEvent) => IEvent
    );
  }

  async dispatch(event: IEvent): Promise<IEvent> {
    this.eventQueue.push(event);
    if (!this.isProcessing) {
      await this.processQueue();
    }
    return event;
  }

  private async processQueue(): Promise<void> {
    this.isProcessing = true;
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      const handler = this.eventHandlers.get(event.type);
      if (handler) {
        try {
           await handler(event);
        } catch (error) {
          console.error(`Error in event handler:`, error);
        }
      } else {
        console.error(`No handler registered for event type: ${event.type}`);
      }
    }
    this.isProcessing = false;
    return;
  }
}

export interface ICommandHandler<T extends ICommand> {
  handle(command: ICommand): Promise<void>;
}

export interface IEventHandler<T extends IEvent> {
  handle(event: IEvent): Promise<void>;
}

export abstract class CommandHandler<T extends ICommand> implements ICommandHandler<T> {
  abstract handle(command: ICommand): Promise<void>;
}

export abstract class EventHandler<T extends IEvent> implements IEventHandler<T> {
  abstract handle(event: IEvent): Promise<void>;
}
