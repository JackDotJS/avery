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

export function permissionCheck(roles: string[], targetGroups: string[]): boolean {
  let allowed = false;
  for (const role of roles) {
    for (const group of permissionGroups) {
      if (targetGroups.includes(group.name)) {
        if (group.roles.includes(role)) {
          allowed = true;
          break;
        }
      }
    }
  }

  return allowed;
}