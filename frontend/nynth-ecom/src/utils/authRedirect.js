// Where to send somebody after they sign in.
//
// The bug this exists to stop: a staff member signs in, gets sent to /shop,
// sees the storefront and never finds their dashboard. The founder assigns an
// email, the person logs in, and from their side nothing happened.
//
// Staff go to /admin. A customer goes wherever they were headed, and a
// customer who happened to be trying an /admin URL is not sent there.
export function postAuthTarget({ from, isStaff = false } = {}) {
  const path = typeof from === "string" ? from.trim() : "";
  const isAuthPath = path.startsWith("/login") || path.startsWith("/signup");
  const isAdminPath = path.startsWith("/admin");

  if (path && !isAuthPath) {
    if (!isAdminPath) return path;
    if (isStaff) return path;
  }

  return isStaff ? "/admin" : "/shop";
}
