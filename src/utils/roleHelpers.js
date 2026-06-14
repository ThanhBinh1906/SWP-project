/** @typedef {'Leader'|'Coordinator'|'Judge'|'Mentor'|'Inactive'|'Pending'} AppRole */

/**
 * @param {{ roles?: string[], systemRole?: string } | null | undefined} user
 * @returns {string[]}
 */
export function getUserRoles(user) {
  if (!user) return [];
  const roles = Array.isArray(user.roles) ? [...user.roles] : [];
  if (user.systemRole && !roles.includes(user.systemRole)) {
    roles.push(user.systemRole);
  }
  return roles;
}

/**
 * @param {{ roles?: string[], systemRole?: string } | null | undefined} user
 * @param {string} required
 */
export function hasRole(user, required) {
  return getUserRoles(user).includes(required);
}

/**
 * @param {{ roles?: string[], systemRole?: string } | null | undefined} user
 * @param {string[]} requiredAny
 */
export function hasAnyRole(user, requiredAny) {
  const roles = getUserRoles(user);
  return requiredAny.some((r) => roles.includes(r));
}

export function canViewScores(user) {
  return hasAnyRole(user, ["Judge", "Coordinator"]);
}

export function canSubmitProject(user) {
  return hasRole(user, "Leader");
}

export function canDisqualifySubmission(user) {
  return hasRole(user, "Coordinator");
}

export function canListRoundSubmissions(user) {
  return hasAnyRole(user, ["Judge", "Coordinator"]);
}
