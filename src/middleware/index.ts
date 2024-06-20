import { CommandDispatcher, EventDispatcher } from '../dispatchers';
import { ICommand, IEvent } from '../index';

export function createCQRSReduxMiddleware(
  commandDispatcher: CommandDispatcher,
  eventDispatcher: EventDispatcher
) {
  return ({ dispatch }: any) => (next: any) => (action: any) => {
    if ((action as ICommand).type.endsWith('_COMMAND') && !action.payload) {
      // Dispatch command
      commandDispatcher.dispatch(action as ICommand);
    } else if ((action as IEvent).type.endsWith('_EVENT') && !action.payload) {
      // Dispatch event
      eventDispatcher.dispatch(action as IEvent);
    } else {
      return next(action);
    }
  };
}