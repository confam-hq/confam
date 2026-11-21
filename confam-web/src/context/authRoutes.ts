import type { Role } from "../types/deal.types";

export const homeFor = (role: Role) => `/dashboard/${role}`;
