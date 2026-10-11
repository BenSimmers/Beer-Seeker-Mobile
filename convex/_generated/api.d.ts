/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as account from "../account.js";
import type * as auth from "../auth.js";
import type * as blocks from "../blocks.js";
import type * as favourites from "../favourites.js";
import type * as groups from "../groups.js";
import type * as http from "../http.js";
import type * as lib_blocks from "../lib/blocks.js";
import type * as lib_favourites from "../lib/favourites.js";
import type * as lib_groups from "../lib/groups.js";
import type * as lib_limits from "../lib/limits.js";
import type * as lib_reports from "../lib/reports.js";
import type * as lib_requests from "../lib/requests.js";
import type * as lib_session from "../lib/session.js";
import type * as lib_sharing from "../lib/sharing.js";
import type * as lib_username from "../lib/username.js";
import type * as location from "../location.js";
import type * as migrations from "../migrations.js";
import type * as profiles from "../profiles.js";
import type * as reports from "../reports.js";
import type * as social from "../social.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  account: typeof account;
  auth: typeof auth;
  blocks: typeof blocks;
  favourites: typeof favourites;
  groups: typeof groups;
  http: typeof http;
  "lib/blocks": typeof lib_blocks;
  "lib/favourites": typeof lib_favourites;
  "lib/groups": typeof lib_groups;
  "lib/limits": typeof lib_limits;
  "lib/reports": typeof lib_reports;
  "lib/requests": typeof lib_requests;
  "lib/session": typeof lib_session;
  "lib/sharing": typeof lib_sharing;
  "lib/username": typeof lib_username;
  location: typeof location;
  migrations: typeof migrations;
  profiles: typeof profiles;
  reports: typeof reports;
  social: typeof social;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
