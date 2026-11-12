import { parcelStatusLabel } from '../src/shared/shipments/parcel-status-labels';
import type { TaggedTransaction } from '../src/server/features/maintenance/credit-repair';

const SUNYANI = 'Sunyani';
const ACCRA = 'Accra';
const OLD_LOCATION = 'Circle Kumasi office';
const NEW_LOCATION = 'Circle Sunyani Old Office';
const normalize = (name: string) => name.trim().toLowerCase();

export type RouteBranch = { id: string; name: string; company_id: string };
export type PickupLocation = RouteBranch & {
  branch_id: string;
  can_receive: boolean;
  is_deleted: boolean;
};

function requireMatch<T>(rows: T[], label: string) {
  if (rows.length !== 1) throw new Error(`Expected exactly one ${label}, found ${rows.length}.`);
  return rows[0]!;
}

export function resolveSunyaniAccraRoute(
  companyId: string,
  branches: readonly RouteBranch[],
  locations: readonly PickupLocation[],
) {
  const branchNamed = (name: string) =>
    requireMatch(
      branches.filter(
        (branch) => branch.company_id === companyId && normalize(branch.name) === normalize(name),
      ),
      `active ${name} branch in the selected company`,
    );
  const source = branchNamed(SUNYANI);
  const destination = branchNamed(ACCRA);
  const accraLocations = locations.filter(
    (location) => location.company_id === companyId && location.branch_id === destination.id,
  );
  const from = requireMatch(
    accraLocations.filter((location) => normalize(location.name) === normalize(OLD_LOCATION)),
    `${OLD_LOCATION} location in Accra`,
  );
  const to = requireMatch(
    accraLocations.filter(
      (location) =>
        normalize(location.name) === normalize(NEW_LOCATION) &&
        location.can_receive &&
        !location.is_deleted,
    ),
    `active receiving location named ${NEW_LOCATION} in Accra`,
  );
  return { companyId, source, destination, from, to };
}

type Route = ReturnType<typeof resolveSunyaniAccraRoute>;

export async function loadSunyaniAccraRoute(
  tx: TaggedTransaction,
  companyId: string,
  lock: boolean,
) {
  const branches = await tx`
    select id, name, company_id from branches
    where company_id = ${companyId} and not is_deleted
      and lower(btrim(name)) in (${normalize(SUNYANI)}, ${normalize(ACCRA)})
    order by id ${lock ? tx`for share` : tx``}
  `;
  const locations = await tx`
    select l.id, l.name, l.company_id, l.branch_id, l.can_receive, l.is_deleted
    from locations l
    join branches b on b.id = l.branch_id and b.company_id = l.company_id
    where l.company_id = ${companyId} and not b.is_deleted and lower(btrim(b.name)) = ${normalize(ACCRA)}
      and lower(btrim(l.name)) in (${normalize(OLD_LOCATION)}, ${normalize(NEW_LOCATION)})
    order by l.id ${lock ? tx`for share of l` : tx``}
  `;
  return resolveSunyaniAccraRoute(
    companyId,
    branches.map((branch) => ({
      id: String(branch.id),
      name: String(branch.name),
      company_id: String(branch.company_id),
    })),
    locations.map((location) => ({
      id: String(location.id),
      name: String(location.name),
      company_id: String(location.company_id),
      branch_id: String(location.branch_id),
      can_receive: location.can_receive === true,
      is_deleted: location.is_deleted === true,
    })),
  );
}

function routeFilter(tx: TaggedTransaction, route: Route) {
  return tx`
    p.company_id = ${route.companyId}
      and p.source_id = ${route.source.id} and p.destination_id = ${route.destination.id}
      and not p.is_deleted and p.deleted_at is null
  `;
}

export async function lockSunyaniAccraParcels(tx: TaggedTransaction, route: Route) {
  const rows = await tx`
    select p.id from parcels p
    where ${routeFilter(tx, route)} and p.pickup_location_id = ${route.from.id}
    order by p.id for update
  `;
  return rows.map(({ id }) => String(id));
}

export async function previewSunyaniAccraMove(tx: TaggedTransaction, route: Route) {
  const groupRows = await tx`
    select p.pickup_location_id as "pickupLocationId", l.name as "pickupLocationName",
      p.status, count(*)::int as count
    from parcels p
    left join locations l on l.id = p.pickup_location_id and l.company_id = p.company_id
    where ${routeFilter(tx, route)}
    group by p.pickup_location_id, l.name, p.status
    order by l.name nulls first, p.pickup_location_id, p.status
  `;
  const groups = groupRows.map((row) => ({
    pickupLocationId: row.pickupLocationId == null ? null : String(row.pickupLocationId),
    pickupLocationName: row.pickupLocationName == null ? null : String(row.pickupLocationName),
    status: Number(row.status),
    count: Number(row.count),
  }));
  const [dependencies] = await tx`
    select
      count(*) filter (where p.receiving_office_id is not null)::int as "officeAssignmentsToClear",
      count(*) filter (where p.pending_receiver_handover is not null)::int as "pendingReceiverHandovers",
      count(*) filter (where exists (
        select 1 from pickup_queues q
        where q.parcel_id = p.id and q.company_id = p.company_id and q.ended_at is null
          and q.queue_date >= date_trunc('day', now() at time zone 'UTC')
          and (q.location_id is distinct from ${route.to.id} or q.branch_id <> ${route.destination.id})
      ))::int as "parcelsWithConflictingPickupTickets",
      count(*) filter (where exists (
        select 1 from parcel_internal_holders h
        where h.parcel_id = p.id and h.company_id = p.company_id
          and (h.branch_id <> p.destination_id or h.warehouse_id is not null
            or (h.location_id is not null and h.location_id <> ${route.to.id}))
      ))::int as "parcelsWithCustodyElsewhere"
    from parcels p
    where ${routeFilter(tx, route)} and p.pickup_location_id = ${route.from.id}
  `;
  const countAt = (id: string | null) =>
    groups.reduce((total, group) => total + (group.pickupLocationId === id ? group.count : 0), 0);
  const totalOnRoute = groups.reduce((total, group) => total + group.count, 0);
  const toMove = countAt(route.from.id);
  const alreadyAtTarget = countAt(route.to.id);
  const missingPickupLocation = countAt(null);
  return {
    totalOnRoute,
    toMove,
    alreadyAtTarget,
    missingPickupLocation,
    otherPickupLocation: totalOnRoute - toMove - alreadyAtTarget - missingPickupLocation,
    officeAssignmentsToClear: Number(dependencies?.officeAssignmentsToClear ?? 0),
    pendingReceiverHandovers: Number(dependencies?.pendingReceiverHandovers ?? 0),
    parcelsWithConflictingPickupTickets: Number(
      dependencies?.parcelsWithConflictingPickupTickets ?? 0,
    ),
    parcelsWithCustodyElsewhere: Number(dependencies?.parcelsWithCustodyElsewhere ?? 0),
    byPickupLocationAndStatus: groups.map((group) => ({
      ...group,
      statusLabel: parcelStatusLabel(group.status),
    })),
  };
}

export async function moveLockedSunyaniAccraParcels(
  tx: TaggedTransaction,
  route: Route,
  parcelIds: string[],
  runId: string,
) {
  const [result] = await tx`
    with previous as (
      select p.id, p.receiving_office_id from parcels p
      where ${routeFilter(tx, route)} and p.pickup_location_id = ${route.from.id}
        and p.id = any(${tx.array(parcelIds)}::varchar[])
    ), moved as (
      update parcels p
      set pickup_location_id = ${route.to.id}, receiving_office_id = null, updated_at = now()
      from previous
      where p.id = previous.id
      returning p.id, p.booking_code, p.status, previous.receiving_office_id as previous_office_id
    ), audited as (
      insert into audit_logs (id, company_id, actor_user_id, entity_type, entity_id, action, message, metadata)
      select substr(md5(${runId}::text || ':' || id), 1, 25), ${route.companyId}, null,
        'parcel', id, 'PARCEL_PICKUP_LOCATION_MOVED',
        'Pickup location changed to Circle Sunyani Old Office for ' || booking_code,
        json_build_object(
          'runId', ${runId}::text, 'sourceId', ${route.source.id}::text,
          'destinationId', ${route.destination.id}::text,
          'previous', json_build_object('pickupLocationId', ${route.from.id}::text,
            'pickupLocationName', ${route.from.name}::text, 'receivingOfficeId', previous_office_id, 'status', status),
          'patch', json_build_object('pickupLocationId', ${route.to.id}::text,
            'pickupLocationName', ${route.to.name}::text, 'receivingOfficeId', null::text)
        )
      from moved
      returning id
    )
    select (select count(*)::int from moved) as moved, (select count(*)::int from audited) as audited
  `;
  if (result?.moved !== parcelIds.length || result?.audited !== parcelIds.length)
    throw new Error('Parcel or audit count changed during the move. Transaction rolled back.');
  return { moved: parcelIds.length, audited: parcelIds.length };
}
