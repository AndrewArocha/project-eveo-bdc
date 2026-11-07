// src/data/stores/njx/integrations/index.ts
import { type Integration } from '../../../../types';

export const njxIntegrations: Integration[] = [
  { id: 'int_njx_1', type: 'Inventory', provider: 'vAuto Feed', value: 'ftp://feed.homenetinc.com/vauto...', status: 'Active' },
  { id: 'int_njx_2', type: 'CRM', provider: 'Elead', value: 'sk_live_***********892a', status: 'Active' },
  { id: 'int_njx_3', type: 'Social', provider: 'Facebook', value: '@NJAutoXchange', status: 'Active' },
];