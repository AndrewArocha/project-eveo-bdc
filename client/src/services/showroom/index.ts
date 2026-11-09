import { apiShowroomRepository } from './apiShowroomRepository';
import { mockShowroomRepository } from './mockShowroomRepository';
import type { ShowroomRepository } from '../../types/showroom';

export function getShowroomRepository(isDemo: boolean): ShowroomRepository {
  return isDemo ? mockShowroomRepository : apiShowroomRepository;
}
