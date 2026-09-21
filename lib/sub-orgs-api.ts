export interface SubOrganization {
  id: number
  name: string
  isDefault: boolean
  location?: string | null
  lat?: number | null
  lng?: number | null
  geoRadiusM?: number | null
  officeStartTime?: string | null
  officeEndTime?: string | null
  graceMinutes?: number | null
  lunchBreakStart?: string | null
  lunchBreakEnd?: string | null
  employeeCount: number
  createdAt: string
  updatedAt?: string | null
}

export interface SubOrganizationCreateInput {
  name: string
  location?: string
  lat?: number
  lng?: number
  geoRadiusM?: number
  officeStartTime?: string
  officeEndTime?: string
  graceMinutes?: number
  lunchBreakStart?: string
  lunchBreakEnd?: string
}

export interface SubOrganizationUpdateInput {
  name?: string
  location?: string
  lat?: number | null
  lng?: number | null
  geoRadiusM?: number | null
  officeStartTime?: string | null
  officeEndTime?: string | null
  graceMinutes?: number | null
  lunchBreakStart?: string | null
  lunchBreakEnd?: string | null
}

export interface ViceManager {
  id: number
  fullName: string
  email: string
  subOrganizationId?: number | null
  subOrganizationName?: string | null
  active: boolean
  lastLoginAt?: string | null
  createdAt: string
}

export interface ViceManagerCreateInput {
  fullName: string
  email: string
  subOrganizationId: number
}

export interface ViceManagerUpdateInput {
  fullName?: string
  subOrganizationId?: number
  active?: boolean
}

// The CMS API uses the plan's field names (latitude, entryTime, name…); the UI uses its own.
// These translate at the Next proxy so components and the API can each keep their names.
type Json = Record<string, unknown>

export function subOrgFromApi(d: Json): SubOrganization {
  return {
    id: d.id as number,
    name: d.name as string,
    isDefault: Boolean(d.isDefault ?? d.default),
    location: (d.addressLabel as string) ?? null,
    lat: (d.latitude as number) ?? null,
    lng: (d.longitude as number) ?? null,
    geoRadiusM: (d.geoRadiusM as number) ?? null,
    officeStartTime: (d.entryTime as string) ?? null,
    officeEndTime: (d.exitTime as string) ?? null,
    graceMinutes: (d.graceMinutes as number) ?? null,
    lunchBreakStart: (d.lunchStartTime as string) ?? null,
    lunchBreakEnd: (d.lunchEndTime as string) ?? null,
    employeeCount: (d.employeeCount as number) ?? 0,
    createdAt: d.createdAt as string,
    updatedAt: (d.updatedAt as string) ?? null,
  }
}

export function subOrgToApi(d: SubOrganizationUpdateInput): Json {
  return {
    name: d.name,
    addressLabel: d.location,
    latitude: d.lat,
    longitude: d.lng,
    geoRadiusM: d.geoRadiusM,
    entryTime: d.officeStartTime,
    exitTime: d.officeEndTime,
    graceMinutes: d.graceMinutes,
    lunchStartTime: d.lunchBreakStart,
    lunchEndTime: d.lunchBreakEnd,
  }
}

export function viceManagerFromApi(d: Json): ViceManager {
  return { ...(d as unknown as ViceManager), fullName: d.name as string }
}

export function viceManagerToApi(d: ViceManagerUpdateInput): Json {
  return { name: d.fullName, subOrganizationId: d.subOrganizationId, active: d.active }
}
