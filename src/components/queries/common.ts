// This query is executed for every page rendering.
// Result is included in props.common

import type {GlobalVariables} from '@enonic/nextjs-adapter';

export const commonQuery = `
query {
  guillotine(siteKey: $siteKey, project: $project, branch: $branch) {
    get(key: $path) {
      displayName
      _id
      type
      dataAsJson
      xAsJson
    }
    getSite {
      displayName
      _path
    }
  }
}`;

export function commonVariables(vars: GlobalVariables) {
    return vars;
}
