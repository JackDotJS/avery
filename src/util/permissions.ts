// eslint-disable-next-line @typescript-eslint/quotes
import cfg from '../../config/config.json' with { type: 'json' };

export interface PermissionGroup {
  name: string,
  inherits?: string,
  roles: string[]
}

export const permissionGroups: PermissionGroup[] = [...cfg.permissionGroups];

for (const group of permissionGroups) {
  if (group.inherits != null) {
    const addToNext = (target: string, currentRoles: string[]) => {
      for (const subgroup of permissionGroups) {
        if (subgroup.name === target) {
          subgroup.roles.push(...currentRoles);
          
          if (subgroup.inherits != null) {
            addToNext(subgroup.inherits, subgroup.roles);
          }
        }
      }
    };

    addToNext(group.inherits, group.roles);
  }

  // just in case: ensure there's no duplicates
  group.roles = [...new Set(group.roles)];
}

console.debug(permissionGroups);

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