import { Text } from 'react-native';
import { AppButton, AppCard, AppSelectField } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { useAuth } from '@mobile/providers/auth-provider';
import { PermissionKeys } from '@/shared/permissions/constants';
import { selectBranch } from '@/shared/auth/branch-switch';
import { useBranchSwitch } from '../../hooks/use-branch-switch';

function BranchSwitchFields() {
  const { theme } = useAppearance();
  const { options, selection, branch, canSwitch, loading, saving, error, setChoice, load, submit } =
    useBranchSwitch();

  return (
    <AppCard>
      {options ? (
        <>
          <AppSelectField
            label="Branch"
            value={selection?.branchId ?? ''}
            options={options.branches.map(({ id, name }) => ({ value: id, label: name }))}
            disabled={saving}
            onValueChange={(id) => {
              const next = options.branches.find((candidate) => candidate.id === id);
              if (next) setChoice(selectBranch(next, options.current));
            }}
          />
          {branch?.locations.length ? (
            <AppSelectField
              label="Location"
              value={selection?.locationId ?? ''}
              options={branch.locations.map(({ id, name }) => ({ value: id, label: name }))}
              disabled={saving}
              onValueChange={(locationId) => setChoice({ branchId: branch.id, locationId })}
            />
          ) : null}
          <AppButton
            title="Switch branch"
            loading={saving}
            disabled={saving || !canSwitch}
            onPress={() => void submit()}
          />
        </>
      ) : (
        <AppButton
          title={error ? 'Retry loading branches' : 'Switch branch'}
          variant="secondary"
          loading={loading}
          disabled={loading}
          onPress={() => void load()}
        />
      )}
      {error ? (
        <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>
          {error}
        </Text>
      ) : null}
    </AppCard>
  );
}

export function BranchSwitchCard() {
  const { session } = useAuth();
  return session.user?.permissions?.includes(PermissionKeys.CanSwitchBranch) ? (
    <BranchSwitchFields />
  ) : null;
}
