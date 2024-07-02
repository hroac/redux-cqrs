export * from './commands';
export * from './events';
export * from './domain';
export * from './dispatchers';
export * from './middleware';
export const ActionType: (constructor: any) => string = (constructor: any) => constructor.name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
