import { getAllProfiles } from "@/modules/platform/repository";
import { updateUserRoleAction } from "@/modules/platform/actions";

async function changeRoleFormAction(formData: FormData) {
  "use server";
  const userId = formData.get("userId") as string;
  const role = formData.get("role") as "customer" | "merchant" | "admin";
  await updateUserRoleAction(userId, role);
}

export default async function AdminUsersPage() {
  const users = await getAllProfiles();

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Users</h1>
      <p className="mt-2 text-zinc-400">{users.length} registered users</p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900 text-left text-zinc-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Profile</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-white/5">
                <td className="px-4 py-3">{user.full_name ?? "—"}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3 capitalize">{user.role}</td>
                <td className="px-4 py-3">
                  {user.profile_completed ? (
                    <span className="text-emerald-400">Complete</span>
                  ) : (
                    <span className="text-amber-400">Incomplete</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <form action={changeRoleFormAction} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <select
                      name="role"
                      defaultValue={user.role}
                      className="rounded-lg border border-white/10 bg-zinc-950 px-2 py-1 text-xs"
                    >
                      <option value="customer">Customer</option>
                      <option value="merchant">Merchant</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button type="submit" className="text-xs text-yellow-400 hover:underline">
                      Update
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
