import { Users } from "lucide-react";
import { getAllProfiles } from "@/modules/platform/repository";
import { updateUserRoleAction } from "@/modules/platform/actions";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  DashboardTable,
  DashboardTableBody,
  DashboardTableCell,
  DashboardTableEmpty,
  DashboardTableHead,
  DashboardTableHeader,
  DashboardTableRow,
  dashboardFilterControlClass,
} from "@/components/dashboard";

async function changeRoleFormAction(formData: FormData) {
  "use server";
  const userId = formData.get("userId") as string;
  const role = formData.get("role") as "customer" | "merchant" | "admin";
  await updateUserRoleAction(userId, role);
}

export default async function AdminUsersPage() {
  const users = await getAllProfiles();

  return (
    <div className="space-y-6">
      <DashboardSection
        as="div"
        level="h1"
        title="Users"
        description={`${users.length} registered users`}
      />

      <DashboardCard flush className="overflow-hidden">
        <DashboardTable caption="Registered platform users" minWidth="52rem">
          <DashboardTableHead>
            <DashboardTableRow>
              <DashboardTableHeader>Name</DashboardTableHeader>
              <DashboardTableHeader hideBelow="md">Email</DashboardTableHeader>
              <DashboardTableHeader>Role</DashboardTableHeader>
              <DashboardTableHeader hideBelow="sm">Profile</DashboardTableHeader>
              <DashboardTableHeader align="right">Actions</DashboardTableHeader>
            </DashboardTableRow>
          </DashboardTableHead>
          <DashboardTableBody>
            {users.length === 0 ? (
              <DashboardTableEmpty colSpan={5}>
                <DashboardEmptyState
                  inset
                  icon={<Users className="h-5 w-5" aria-hidden />}
                  title="No users yet"
                  description="Accounts registered on the platform will be listed here."
                />
              </DashboardTableEmpty>
            ) : (
              users.map((user) => (
                <DashboardTableRow key={user.id} interactive>
                  <DashboardTableCell wrap className="font-medium">
                    {user.full_name ?? "—"}
                  </DashboardTableCell>
                  <DashboardTableCell hideBelow="md" wrap className="text-muted">
                    {user.email}
                  </DashboardTableCell>
                  <DashboardTableCell className="capitalize">{user.role}</DashboardTableCell>
                  <DashboardTableCell hideBelow="sm">
                    {user.profile_completed ? (
                      <span className="text-emerald-400">Complete</span>
                    ) : (
                      <span className="text-amber-400">Incomplete</span>
                    )}
                  </DashboardTableCell>
                  <DashboardTableCell align="right">
                    <form
                      action={changeRoleFormAction}
                      className="flex items-center justify-end gap-2"
                    >
                      <input type="hidden" name="userId" value={user.id} />
                      <label className="sr-only" htmlFor={`role-${user.id}`}>
                        Role for {user.full_name ?? user.email}
                      </label>
                      <select
                        id={`role-${user.id}`}
                        name="role"
                        defaultValue={user.role}
                        className={dashboardFilterControlClass}
                      >
                        <option value="customer">Customer</option>
                        <option value="merchant">Merchant</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        type="submit"
                        className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-medium text-gold transition-colors hover:text-gold-secondary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                      >
                        Update
                      </button>
                    </form>
                  </DashboardTableCell>
                </DashboardTableRow>
              ))
            )}
          </DashboardTableBody>
        </DashboardTable>
      </DashboardCard>
    </div>
  );
}
