/**
 * Helpers de identidade — evita misturar Patient.public_id com User.public_id.
 *
 * patient_public_id → APIs clínicas e /files/by-patient/
 * uid / user_public_id → identidade de login / GET /patients/{uid} (aceita ambos)
 */

export function resolvePatientPublicId(entity) {
  if (!entity || typeof entity !== 'object') return null;
  return entity.patient_public_id || entity.patient_id || null;
}

export function resolveUserPublicId(entity) {
  if (!entity || typeof entity !== 'object') return null;
  return entity.uid || entity.user_public_id || null;
}

/** ID preferido para rotas /doctor/patients/:id e lookups de ficha. */
export function resolvePatientRouteId(entity) {
  if (!entity || typeof entity !== 'object') return null;
  return (
    resolvePatientPublicId(entity)
    || entity.id
    || resolveUserPublicId(entity)
    || null
  );
}

export function resolveDoctorId(userOrDoctor) {
  if (!userOrDoctor || typeof userOrDoctor !== 'object') return null;
  return userOrDoctor.public_id || userOrDoctor.id || null;
}

export function sameId(a, b) {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

export function findPatientByAnyId(patients, id) {
  if (!id || !Array.isArray(patients)) return null;
  const s = String(id);
  return (
    patients.find(
      (p) =>
        String(p.patient_public_id || '') === s
        || String(p.id || '') === s
        || String(p.uid || '') === s
        || String(p.user_public_id || '') === s
    ) || null
  );
}
