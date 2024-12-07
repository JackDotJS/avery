// eslint-disable-next-line @typescript-eslint/quotes
import cfg from '../../config/config.json' assert { type: 'json' };

export interface PermissionGroup {
  name: string,
  roles: string[]
}

export const permissionGroups: PermissionGroup[] = [];

for (const group of cfg.permissionGroups) {
  const finalGroupData = {
    name: group.name,
    roles: [...group.roles]
  };

  if (group.inherits == null) {
    permissionGroups.push(finalGroupData);
  } else {
    const search = async (target: string): Promise<void> => {
      for (const subgroup of cfg.permissionGroups) {
        if (subgroup.name === target) {
          finalGroupData.roles.push(...subgroup.roles);

          if (subgroup.inherits != null) {
            return await search(subgroup.inherits);
          }
        }
      }

      return;
    };

    await search(group.inherits);
  }

  permissionGroups.push(finalGroupData);
}

export function checkRole(role: string, targetGroup: string) {
  for (const group of permissionGroups) {
    if (group.name === targetGroup) {
      return group.roles.includes(role);
    }
  }

  // if we've made it here, then that can only mean the provided target group doesn't exist.
  throw new Error(`invalid group name: ${targetGroup}`);
}