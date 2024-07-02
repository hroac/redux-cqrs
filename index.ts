export * from './src'
export const ActionType: (constructor: any) => string = (constructor: any) => constructor.name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
