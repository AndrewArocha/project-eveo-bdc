import { apiShowroomRepository } from './apiShowroomRepository';
import { mockShowroomRepository } from './mockShowroomRepository';
import type { ShowroomRepository } from '../../types/showroom';

function activeRepository(): ShowroomRepository {
  return localStorage.getItem('eveo_token') ? apiShowroomRepository : mockShowroomRepository;
}

/** Authenticated users use the tenant-scoped API; public/demo sessions retain the local demo adapter. */
export const showroomRepository: ShowroomRepository = {
  listVisits: (...args) => activeRepository().listVisits(...args),
  getVisit: (...args) => activeRepository().getVisit(...args),
  createVisit: (...args) => activeRepository().createVisit(...args),
  appendEvent: (...args) => activeRepository().appendEvent(...args),
  assignVisit: (...args) => activeRepository().assignVisit(...args),
  subscribe: (...args) => activeRepository().subscribe(...args),
};
