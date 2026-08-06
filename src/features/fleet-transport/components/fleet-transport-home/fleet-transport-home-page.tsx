import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useListFleetDriverComplianceAlertsQuery,
  useListFleetVehicleComplianceAlertsQuery,
} from '../../api/fleet-transport.api';

export function FleetTransportHomePage() {
  const { data: complianceAlerts, isLoading: loadingComplianceAlerts } =
    useListFleetVehicleComplianceAlertsQuery({ horizonDays: 30, limit: 5 });
  const { data: driverComplianceAlerts, isLoading: loadingDriverComplianceAlerts } =
    useListFleetDriverComplianceAlertsQuery({ horizonDays: 30, limit: 5 });

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Fleet & Transport</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/fleet-transport/vehicles">Vehicles</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/trips">Trips</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/routes/plans">Route Plans</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/routes/plans/new">Create Route Plan</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/fuel-logs">Fuel Logs</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/fuel-analytics">Fuel Analytics</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/fuel-analytics/fraud-signals">Fuel Fraud Signals</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/fuel-logs/approvals">Fuel Approvals</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/drivers/compliance">Driver Compliance</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/drivers/compliance/new">Add Driver Compliance Record</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/drivers/training">Training Records</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/drivers/training/new">Add Training Record</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/drivers/incidents/history">Driver Incident History</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/drivers/rosters/history">Driver Roster History</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/rosters">Shift Rosters</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/rosters/new">Create Shift Roster</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/compliance">Compliance Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/compliance/kpis">Compliance KPIs</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/compliance/ops">Compliance Ops</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/compliance/escalation-policy">
                Compliance Escalation Policy
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/compliance/ops/incidents/new">Record Incident</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/compliance/ops/policy-acks/new">
                Policy Acknowledgment
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/maintenance">Maintenance</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/maintenance/plans/new">Create Preventive Plan</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/maintenance/work-orders/new">Create Work Order</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/maintenance/work-orders">Work Orders List</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/maintenance/downtime">Downtime Events</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/maintenance/downtime/workflows">
                Downtime RCA Workflows
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/maintenance/parts/movements">Stock Movement History</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/maintenance/work-orders/part-movements">
                Work Order Part Movements
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/maintenance/reliability/trends">Reliability Trends</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/maintenance/kpis">Maintenance KPIs</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/maintenance/procurement/traceability">
                Maintenance Traceability
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/maintenance/procurement/reorder">
                Run Maintenance Reorder
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/dispatch/board">Dispatch Board</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/dispatch/route-assignments">Route Assignment</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/dispatch/load-matching">Load Matching</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/dispatch/load-matching/new">Assign Load</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/dispatch/load-matching/audit">Load Audit Trail</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/dispatch/check-in">Check-In Operator</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/dispatch/check-out">Check-Out Operator</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/dispatch/live-status">Live Status</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/dispatch/ops-performance">Dispatch Ops Performance</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/dispatch/exception-queue">Dispatch Exception Queue</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/decision-support">Decision Support</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/decision-support/executive-scorecard">
                Executive Scorecard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/decision-support/unit-economics">Unit Economics</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fleet Compliance Alerts (Next 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingComplianceAlerts ? (
              <p className="text-sm text-muted-foreground">Loading alerts...</p>
            ) : (
              <>
                <p className="text-sm">
                  Total: {complianceAlerts?.summary.total ?? 0} | Expired:{' '}
                  {complianceAlerts?.summary.expired ?? 0} | Due soon:{' '}
                  {complianceAlerts?.summary.dueSoon ?? 0}
                </p>
                {(complianceAlerts?.data.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">No compliance alerts.</p>
                ) : (
                  <div className="space-y-1">
                    {complianceAlerts?.data.map((alert) => (
                      <div key={`${alert.source}-${alert.sourceRef}`} className="text-sm">
                        <span className="font-medium">{alert.plateNumber}</span> - {alert.label} (
                        {alert.severity === 'expired'
                          ? 'Expired'
                          : `Due in ${Math.max(alert.daysUntilDue, 0)} day(s)`}
                        )
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Driver Compliance Alerts (Next 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingDriverComplianceAlerts ? (
              <p className="text-sm text-muted-foreground">Loading alerts...</p>
            ) : (
              <>
                <p className="text-sm">
                  Total: {driverComplianceAlerts?.summary.total ?? 0} | Expired:{' '}
                  {driverComplianceAlerts?.summary.expired ?? 0} | Due soon:{' '}
                  {driverComplianceAlerts?.summary.dueSoon ?? 0}
                </p>
                {(driverComplianceAlerts?.data.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">No driver compliance alerts.</p>
                ) : (
                  <div className="space-y-1">
                    {driverComplianceAlerts?.data.map((alert) => (
                      <div key={alert.id} className="text-sm">
                        <span className="font-medium">
                          {alert.employeeNumber} - {alert.employeeName}
                        </span>{' '}
                        - {alert.label} (
                        {alert.severity === 'expired'
                          ? 'Expired'
                          : `Due in ${Math.max(alert.daysUntilDue, 0)} day(s)`}
                        )
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
