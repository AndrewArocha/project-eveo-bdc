import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';

/** Keep visit deep links on the shared, multi-step showroom workflow. */
export default function ShowroomVisitDomain() {
  const { visitId } = useParams<{ visitId: string }>();
  const [searchParams] = useSearchParams();
  const { activeStoreId, activeStoreDomainId } = useStoreAppearance();

  if (!visitId) return <Navigate to="/app/showroom?view=showroom" replace />;

  const params = new URLSearchParams({ view: 'visit', visitId });
  const storeId = searchParams.get('storeId') || activeStoreDomainId || activeStoreId;
  if (storeId) params.set('storeId', storeId);

  return <Navigate to={`/app/showroom?${params.toString()}`} replace />;
}
