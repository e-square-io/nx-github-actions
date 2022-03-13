import { resolve } from 'path';

export const tree = new (jest.requireActual('../fs').GHTree)(resolve(__dirname, '../../../../../'));
