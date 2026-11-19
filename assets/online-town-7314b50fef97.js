const wn = /* @__PURE__ */ Symbol.for("@supabase/supabase-js.traceContextExtractor");
function vn() {
  return globalThis[wn];
}
function Kt(t, e) {
  var r = {};
  for (var s in t) Object.prototype.hasOwnProperty.call(t, s) && e.indexOf(s) < 0 && (r[s] = t[s]);
  if (t != null && typeof Object.getOwnPropertySymbols == "function")
    for (var n = 0, s = Object.getOwnPropertySymbols(t); n < s.length; n++)
      e.indexOf(s[n]) < 0 && Object.prototype.propertyIsEnumerable.call(t, s[n]) && (r[s[n]] = t[s[n]]);
  return r;
}
function kn(t, e, r, s) {
  function n(i) {
    return i instanceof r ? i : new r(function(a) {
      a(i);
    });
  }
  return new (r || (r = Promise))(function(i, a) {
    function l(c) {
      try {
        o(s.next(c));
      } catch (u) {
        a(u);
      }
    }
    function h(c) {
      try {
        o(s.throw(c));
      } catch (u) {
        a(u);
      }
    }
    function o(c) {
      c.done ? i(c.value) : n(c.value).then(l, h);
    }
    o((s = s.apply(t, e || [])).next());
  });
}
const bn = (t) => t ? (...e) => t(...e) : (...e) => fetch(...e);
class xr extends Error {
  constructor(e, r = "FunctionsError", s) {
    super(e), this.name = r, this.context = s;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      context: this.context
    };
  }
}
class xn extends xr {
  constructor(e) {
    super("Failed to send a request to the Edge Function", "FunctionsFetchError", e);
  }
}
class Mr extends xr {
  constructor(e) {
    super("Relay Error invoking the Edge Function", "FunctionsRelayError", e);
  }
}
class Pr extends xr {
  constructor(e) {
    super("Edge Function returned a non-2xx status code", "FunctionsHttpError", e);
  }
}
var hr;
(function(t) {
  t.Any = "any", t.ApNortheast1 = "ap-northeast-1", t.ApNortheast2 = "ap-northeast-2", t.ApSouth1 = "ap-south-1", t.ApSoutheast1 = "ap-southeast-1", t.ApSoutheast2 = "ap-southeast-2", t.CaCentral1 = "ca-central-1", t.EuCentral1 = "eu-central-1", t.EuWest1 = "eu-west-1", t.EuWest2 = "eu-west-2", t.EuWest3 = "eu-west-3", t.SaEast1 = "sa-east-1", t.UsEast1 = "us-east-1", t.UsWest1 = "us-west-1", t.UsWest2 = "us-west-2";
})(hr || (hr = {}));
class Sn {
  /**
   * Creates a new Functions client bound to an Edge Functions URL.
   *
   * @example Using supabase-js (recommended)
   * ```ts
   * import { createClient } from '@supabase/supabase-js'
   *
   * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
   * const { data, error } = await supabase.functions.invoke('hello-world')
   * ```
   *
   * @category Edge Functions
   *
   * @example Standalone import for bundle-sensitive environments
   * ```ts
   * import { FunctionsClient, FunctionRegion } from '@supabase/functions-js'
   *
   * const functions = new FunctionsClient('https://xyzcompany.supabase.co/functions/v1', {
   *   headers: { apikey: 'your-publishable-key' },
   *   region: FunctionRegion.UsEast1,
   * })
   * ```
   */
  constructor(e, { headers: r = {}, customFetch: s, region: n = hr.Any } = {}) {
    this.url = e, this.headers = r, this.region = n, this.fetch = bn(s);
  }
  /**
   * Updates the authorization header
   * @param token - the new jwt token sent in the authorisation header
   *
   * @category Edge Functions
   *
   * @example Setting the authorization header
   * ```ts
   * functions.setAuth(session.access_token)
   * ```
   */
  setAuth(e) {
    this.headers.Authorization = `Bearer ${e}`;
  }
  /**
   * Invokes a function
   * @param functionName - The name of the Function to invoke.
   * @param options - Options for invoking the Function.
   * @example
   * ```ts
   * const { data, error } = await functions.invoke('hello-world', {
   *   body: { name: 'Ada' },
   * })
   * ```
   *
   * @category Edge Functions
   *
   * @remarks
   * - The API key is sent in the `apikey` header. The `Authorization` header is reserved
   *   for the signed-in user's JWT (or a custom auth token) — when there is no session, a
   *   new-format API key (`sb_publishable_…` / `sb_secret_…`) is not sent as a Bearer token.
   * - Invoke params generally match the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) spec.
   * - When you pass in a body to your function, we automatically attach the Content-Type header for `Blob`, `ArrayBuffer`, `File`, `FormData` and `String`. If it doesn't match any of these types we assume the payload is `json`, serialize it and attach the `Content-Type` header as `application/json`. You can override this behavior by passing in a `Content-Type` header of your own.
   * - Responses are automatically parsed as `json`, `blob` and `form-data` depending on the `Content-Type` header sent by your function. Responses are parsed as `text` by default.
   *
   * @example Basic invocation
   * ```js
   * const { data, error } = await supabase.functions.invoke('hello', {
   *   body: { foo: 'bar' }
   * })
   * ```
   *
   * @exampleDescription Error handling
   * A `FunctionsHttpError` error is returned if your function throws an error, `FunctionsRelayError` if the Supabase Relay has an error processing your function and `FunctionsFetchError` if there is a network error in calling your function. Log the full error object so fields like `name`, `context`, and any structured body aren't hidden.
   *
   * @example Error handling
   * ```js
   * import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from "@supabase/supabase-js";
   *
   * const { data, error } = await supabase.functions.invoke('hello', {
   *   headers: {
   *     "my-custom-header": 'my-custom-header-value'
   *   },
   *   body: { foo: 'bar' }
   * })
   *
   * if (error instanceof FunctionsHttpError) {
   *   const errorMessage = await error.context.json()
   *   console.error('Function returned an error', errorMessage)
   * } else if (error instanceof FunctionsRelayError) {
   *   console.error('Relay error:', error)
   * } else if (error instanceof FunctionsFetchError) {
   *   console.error('Fetch error:', error)
   * }
   * ```
   *
   * @exampleDescription Passing custom headers
   * You can pass custom headers to your function. Note: supabase-js automatically passes the `Authorization` header with the signed in user's JWT.
   *
   * @example Passing custom headers
   * ```js
   * const { data, error } = await supabase.functions.invoke('hello', {
   *   headers: {
   *     "my-custom-header": 'my-custom-header-value'
   *   },
   *   body: { foo: 'bar' }
   * })
   * ```
   *
   * @exampleDescription Calling with DELETE HTTP verb
   * You can also set the HTTP verb to `DELETE` when calling your Edge Function.
   *
   * @example Calling with DELETE HTTP verb
   * ```js
   * const { data, error } = await supabase.functions.invoke('hello', {
   *   headers: {
   *     "my-custom-header": 'my-custom-header-value'
   *   },
   *   body: { foo: 'bar' },
   *   method: 'DELETE'
   * })
   * ```
   *
   * @exampleDescription Invoking a Function in the UsEast1 region
   * Here are the available regions:
   * - `FunctionRegion.Any`
   * - `FunctionRegion.ApNortheast1`
   * - `FunctionRegion.ApNortheast2`
   * - `FunctionRegion.ApSouth1`
   * - `FunctionRegion.ApSoutheast1`
   * - `FunctionRegion.ApSoutheast2`
   * - `FunctionRegion.CaCentral1`
   * - `FunctionRegion.EuCentral1`
   * - `FunctionRegion.EuWest1`
   * - `FunctionRegion.EuWest2`
   * - `FunctionRegion.EuWest3`
   * - `FunctionRegion.SaEast1`
   * - `FunctionRegion.UsEast1`
   * - `FunctionRegion.UsWest1`
   * - `FunctionRegion.UsWest2`
   *
   * @example Invoking a Function in the UsEast1 region
   * ```js
   * import { createClient, FunctionRegion } from '@supabase/supabase-js'
   *
   * const { data, error } = await supabase.functions.invoke('hello', {
   *   body: { foo: 'bar' },
   *   region: FunctionRegion.UsEast1
   * })
   * ```
   *
   * @exampleDescription Calling with GET HTTP verb
   * You can also set the HTTP verb to `GET` when calling your Edge Function.
   *
   * @example Calling with GET HTTP verb
   * ```js
   * const { data, error } = await supabase.functions.invoke('hello', {
   *   headers: {
   *     "my-custom-header": 'my-custom-header-value'
   *   },
   *   method: 'GET'
   * })
   * ```
   *
   * @example Standalone client invoke
   * ```ts
   * const { data, error } = await functions.invoke('hello-world', {
   *   body: { name: 'Ada' },
   * })
   * ```
   */
  invoke(e) {
    return kn(this, arguments, void 0, function* (r, s = {}) {
      var n, i;
      let a, l, h;
      try {
        const { headers: o, method: c, body: u, signal: d, timeout: f } = s;
        let g = {}, { region: m } = s;
        m || (m = this.region);
        const p = new URL(`${this.url}/${r}`);
        m && m !== "any" && (g["x-region"] = m, p.searchParams.set("forceFunctionRegion", m));
        let y;
        const _ = !!o && Object.keys(o).some((A) => A.toLowerCase() === "content-type");
        u && !_ ? typeof Blob < "u" && u instanceof Blob || u instanceof ArrayBuffer ? (g["Content-Type"] = u.type || "application/octet-stream", y = u) : typeof u == "string" ? (g["Content-Type"] = "text/plain", y = u) : typeof FormData < "u" && u instanceof FormData ? y = u : (g["Content-Type"] = "application/json", y = JSON.stringify(u)) : u && typeof u != "string" && !(typeof Blob < "u" && u instanceof Blob) && !(u instanceof ArrayBuffer) && !(typeof FormData < "u" && u instanceof FormData) ? y = JSON.stringify(u) : y = u;
        let w = d;
        f && (l = new AbortController(), a = setTimeout(() => l.abort(), f), d ? (w = l.signal, h = () => l.abort(), d.addEventListener("abort", h)) : w = l.signal);
        const v = yield this.fetch(p.toString(), {
          method: c || "POST",
          // headers priority is (high to low):
          // 1. invoke-level headers
          // 2. client-level headers
          // 3. default Content-Type header
          headers: Object.assign(Object.assign(Object.assign({}, g), this.headers), o),
          body: y,
          signal: w
        }).catch((A) => {
          throw new xn(A);
        }), x = v.headers.get("x-relay-error");
        if (x && x === "true")
          throw new Mr(v);
        if (!v.ok)
          throw new Pr(v);
        let b = ((n = v.headers.get("Content-Type")) !== null && n !== void 0 ? n : "text/plain").split(";")[0].trim().toLowerCase(), O;
        return b === "application/json" ? O = yield v.json() : b === "application/octet-stream" || b === "application/pdf" ? O = yield v.blob() : b === "text/event-stream" ? O = v : b === "multipart/form-data" ? O = yield v.formData() : O = yield v.text(), { data: O, error: null, response: v };
      } catch (o) {
        return {
          data: null,
          error: o,
          response: o instanceof Pr || o instanceof Mr ? o.context : void 0
        };
      } finally {
        a && clearTimeout(a), h && ((i = s.signal) === null || i === void 0 || i.removeEventListener("abort", h));
      }
    });
  }
}
var Be = class extends Error {
  /**
  * @example
  * ```ts
  * import PostgrestError from '@supabase/postgrest-js'
  *
  * throw new PostgrestError({
  *   message: 'Row level security prevented the request',
  *   details: 'RLS denied the insert',
  *   hint: 'Check your policies',
  *   code: 'PGRST301',
  * })
  * ```
  */
  constructor(t) {
    super(t.message), this.name = "PostgrestError", this.details = t.details, this.hint = t.hint, this.code = t.code;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      details: this.details,
      hint: this.hint,
      code: this.code
    };
  }
};
const Cs = 3, Cr = (t) => Math.min(1e3 * 2 ** t, 3e4), Tn = [520, 503], Is = [
  "GET",
  "HEAD",
  "OPTIONS"
];
function st(t) {
  "@babel/helpers - typeof";
  return st = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
    return typeof e;
  } : function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, st(t);
}
function En(t, e) {
  if (st(t) != "object" || !t) return t;
  var r = t[Symbol.toPrimitive];
  if (r !== void 0) {
    var s = r.call(t, e);
    if (st(s) != "object") return s;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
function An(t) {
  var e = En(t, "string");
  return st(e) == "symbol" ? e : e + "";
}
function Rn(t, e, r) {
  return (e = An(e)) in t ? Object.defineProperty(t, e, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : t[e] = r, t;
}
function Ir(t, e) {
  var r = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var s = Object.getOwnPropertySymbols(t);
    e && (s = s.filter(function(n) {
      return Object.getOwnPropertyDescriptor(t, n).enumerable;
    })), r.push.apply(r, s);
  }
  return r;
}
function Ae(t) {
  for (var e = 1; e < arguments.length; e++) {
    var r = arguments[e] != null ? arguments[e] : {};
    e % 2 ? Ir(Object(r), !0).forEach(function(s) {
      Rn(t, s, r[s]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(r)) : Ir(Object(r)).forEach(function(s) {
      Object.defineProperty(t, s, Object.getOwnPropertyDescriptor(r, s));
    });
  }
  return t;
}
function $r(t, e) {
  return new Promise((r) => {
    if (e?.aborted) {
      r();
      return;
    }
    const s = setTimeout(() => {
      e?.removeEventListener("abort", n), r();
    }, t);
    function n() {
      clearTimeout(s), r();
    }
    e?.addEventListener("abort", n);
  });
}
function On(t, e, r, s) {
  return !(!s || r >= Cs || !Is.includes(t) || !Tn.includes(e));
}
async function $s(t, e, r, s) {
  let n = 0;
  for (; ; ) {
    const h = Ae({}, r.headers);
    n > 0 && (h["X-Retry-Count"] = String(n));
    let o;
    try {
      o = await t(e, {
        method: r.method,
        headers: h,
        body: r.body,
        signal: r.signal
      });
    } catch (c) {
      var i;
      if (c?.name === "AbortError" || c?.code === "ABORT_ERR" || c?.name === "TimeoutError" && (!((i = r.signal) === null || i === void 0) && i.aborted) || !Is.includes(r.method)) throw c;
      if (s && n < Cs) {
        const u = Cr(n);
        n++, await $r(u, r.signal);
        continue;
      }
      throw c;
    }
    if (On(r.method, o.status, n, s)) {
      var a, l;
      const c = (a = (l = o.headers) === null || l === void 0 ? void 0 : l.get("Retry-After")) !== null && a !== void 0 ? a : null, u = c !== null ? Math.max(0, parseInt(c, 10) || 0) * 1e3 : Cr(n);
      await o.text(), n++, await $r(u, r.signal);
      continue;
    }
    return o;
  }
}
var Mn = class {
  /**
  * Creates a builder configured for a specific PostgREST request.
  *
  * @example Using supabase-js (recommended)
  * ```ts
  * import { createClient } from '@supabase/supabase-js'
  *
  * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
  * const { data, error } = await supabase.from('users').select('*')
  * ```
  *
  * @category Database
  *
  * @example Standalone import for bundle-sensitive environments
  * ```ts
  * import { PostgrestQueryBuilder } from '@supabase/postgrest-js'
  *
  * const builder = new PostgrestQueryBuilder(
  *   new URL('https://xyzcompany.supabase.co/rest/v1/users'),
  *   { headers: new Headers({ apikey: 'your-publishable-key' }) }
  * )
  * ```
  */
  constructor(t) {
    var e, r, s, n, i;
    this.shouldThrowOnError = !1, this.retryEnabled = !0, this.method = t.method, this.url = t.url, this.headers = new Headers(t.headers), this.schema = t.schema, this.body = t.body, this.shouldThrowOnError = (e = t.shouldThrowOnError) !== null && e !== void 0 ? e : !1, this.signal = t.signal, this.isMaybeSingle = (r = t.isMaybeSingle) !== null && r !== void 0 ? r : !1, this.shouldStripNulls = (s = t.shouldStripNulls) !== null && s !== void 0 ? s : !1, this.urlLengthLimit = (n = t.urlLengthLimit) !== null && n !== void 0 ? n : 8e3, this.retryEnabled = (i = t.retry) !== null && i !== void 0 ? i : !0, t.fetch ? this.fetch = t.fetch : this.fetch = fetch;
  }
  /**
  * If there's an error with the query, throwOnError will reject the promise by
  * throwing the error instead of returning it as part of a successful response.
  *
  * {@link https://github.com/supabase/supabase-js/issues/92}
  *
  * @category Database
  * @subcategory Using modifiers
  */
  throwOnError() {
    return this.shouldThrowOnError = !0, this;
  }
  /**
  * Strip null values from the response data. Properties with `null` values
  * will be omitted from the returned JSON objects.
  *
  * Requires PostgREST 11.2.0+.
  *
  * {@link https://docs.postgrest.org/en/stable/references/api/resource_representation.html#stripped-nulls}
  *
  * @category Database
  * @subcategory Using modifiers
  *
  * @example With `select()`
  * ```ts
  * const { data, error } = await supabase
  *   .from('characters')
  *   .select()
  *   .stripNulls()
  * ```
  *
  * @exampleSql With `select()`
  * ```sql
  * create table
  *   characters (id int8 primary key, name text, bio text);
  *
  * insert into
  *   characters (id, name, bio)
  * values
  *   (1, 'Luke', null),
  *   (2, 'Leia', 'Princess of Alderaan');
  * ```
  *
  * @exampleResponse With `select()`
  * ```json
  * {
  *   "data": [
  *     {
  *       "id": 1,
  *       "name": "Luke"
  *     },
  *     {
  *       "id": 2,
  *       "name": "Leia",
  *       "bio": "Princess of Alderaan"
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  */
  stripNulls() {
    if (this.headers.get("Accept") === "text/csv") throw new Error("stripNulls() cannot be used with csv()");
    return this.shouldStripNulls = !0, this;
  }
  /**
  * Set an HTTP header on this single PostgREST request, overriding any header
  * with the same name set on the client.
  *
  * This is an advanced escape hatch for one-off needs (passing a custom
  * `Authorization` for a single query, attaching a tracing header, etc.).
  * Most callers do not need it: configure client-wide headers via the
  * `headers` option when constructing the client, and authentication via
  * Supabase Auth.
  *
  * @param name - HTTP header name
  * @param value - HTTP header value
  *
  * @category Database
  * @subcategory Using modifiers
  */
  setHeader(t, e) {
    return this.headers = new Headers(this.headers), this.headers.set(t, e), this;
  }
  /**
  * @category Database
  * @subcategory Using modifiers
  *
  * Configure retry behavior for this request.
  *
  * By default, retries are enabled for idempotent requests (GET, HEAD, OPTIONS)
  * that fail with network errors or specific HTTP status codes (503, 520).
  * Retries use exponential backoff (1s, 2s, 4s) with a maximum of 3 attempts.
  *
  * @param enabled - Whether to enable retries for this request
  *
  * @example
  * ```ts
  * // Disable retries for a specific query
  * const { data, error } = await supabase
  *   .from('users')
  *   .select()
  *   .retry(false)
  * ```
  */
  retry(t) {
    return this.retryEnabled = t, this;
  }
  then(t, e) {
    var r = this;
    if (this.schema === void 0 || (["GET", "HEAD"].includes(this.method) ? this.headers.set("Accept-Profile", this.schema) : this.headers.set("Content-Profile", this.schema)), this.method !== "GET" && this.method !== "HEAD" && this.headers.set("Content-Type", "application/json"), this.shouldStripNulls) {
      const a = this.headers.get("Accept");
      a === "application/vnd.pgrst.object+json" ? this.headers.set("Accept", "application/vnd.pgrst.object+json;nulls=stripped") : (!a || a === "application/json") && this.headers.set("Accept", "application/vnd.pgrst.array+json;nulls=stripped");
    }
    const s = this.fetch;
    let i = (async () => {
      const a = {};
      r.headers.forEach((h, o) => {
        a[o] = h;
      });
      const l = await $s(s, r.url.toString(), {
        method: r.method,
        headers: a,
        body: JSON.stringify(r.body, (h, o) => typeof o == "bigint" ? o.toString() : o),
        signal: r.signal
      }, r.retryEnabled);
      return await r.processResponse(l);
    })();
    return this.shouldThrowOnError || (i = i.catch((a) => {
      var l;
      let h = "", o = "", c = "";
      const u = a?.cause;
      if (u) {
        var d, f, g, m;
        const _ = (d = u?.message) !== null && d !== void 0 ? d : "", w = (f = u?.code) !== null && f !== void 0 ? f : "";
        h = `${(g = a?.name) !== null && g !== void 0 ? g : "FetchError"}: ${a?.message}`, h += `

Caused by: ${(m = u?.name) !== null && m !== void 0 ? m : "Error"}: ${_}`, w && (h += ` (${w})`), u?.stack && (h += `
${u.stack}`);
      } else {
        var p;
        h = (p = a?.stack) !== null && p !== void 0 ? p : "";
      }
      const y = this.url.toString().length;
      return a?.name === "AbortError" || a?.code === "ABORT_ERR" ? (c = "", o = "Request was aborted (timeout or manual cancellation)", y > this.urlLengthLimit && (o += `. Note: Your request URL is ${y} characters, which may exceed server limits. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [many IDs])), consider using an RPC function to pass values server-side.`)) : (u?.name === "HeadersOverflowError" || u?.code === "UND_ERR_HEADERS_OVERFLOW") && (c = "", o = "HTTP headers exceeded server limits (typically 16KB)", y > this.urlLengthLimit && (o += `. Your request URL is ${y} characters. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [200+ IDs])), consider using an RPC function instead.`)), {
        success: !1,
        error: {
          message: `${(l = a?.name) !== null && l !== void 0 ? l : "FetchError"}: ${a?.message}`,
          details: h,
          hint: o,
          code: c
        },
        data: null,
        count: null,
        status: 0,
        statusText: ""
      };
    })), i.then(t, e);
  }
  /**
  * Process a fetch response and return the standardized postgrest response.
  */
  async processResponse(t) {
    var e = this;
    let r = null, s = null, n = null, i = t.status, a = t.statusText;
    if (t.ok) {
      var l, h;
      if (e.method !== "HEAD") {
        var o;
        const f = await t.text();
        if (f !== "") if (e.headers.get("Accept") === "text/csv") s = f;
        else if (e.headers.get("Accept") && (!((o = e.headers.get("Accept")) === null || o === void 0) && o.includes("application/vnd.pgrst.plan+text"))) s = f;
        else try {
          s = JSON.parse(f);
        } catch {
          if (r = { message: f }, s = null, e.shouldThrowOnError) throw new Be({
            message: f,
            details: "",
            hint: "",
            code: ""
          });
        }
      }
      const u = (l = e.headers.get("Prefer")) === null || l === void 0 ? void 0 : l.match(/count=(exact|planned|estimated)/), d = (h = t.headers.get("content-range")) === null || h === void 0 ? void 0 : h.split("/");
      if (u && d && d.length > 1 && (n = parseInt(d[1])), e.isMaybeSingle && Array.isArray(s)) if (s.length > 1) {
        if (r = {
          code: "PGRST116",
          details: `Results contain ${s.length} rows, application/vnd.pgrst.object+json requires 1 row`,
          hint: null,
          message: "JSON object requested, multiple (or no) rows returned"
        }, s = null, n = null, i = 406, a = "Not Acceptable", e.shouldThrowOnError) {
          var c;
          throw new Be(Ae(Ae({}, r), {}, { hint: (c = r.hint) !== null && c !== void 0 ? c : "" }));
        }
      } else s.length === 1 ? s = s[0] : s = null;
    } else {
      const u = await t.text();
      try {
        r = JSON.parse(u), Array.isArray(r) && t.status === 404 && (s = [], r = null, i = 200, a = "OK");
      } catch {
        t.status === 404 && u === "" ? (i = 204, a = "No Content") : r = { message: u };
      }
      if (r && e.shouldThrowOnError) throw new Be(r);
    }
    return {
      success: r === null,
      error: r,
      data: s,
      count: n,
      status: i,
      statusText: a
    };
  }
  /**
  * Override the type of the returned `data`.
  *
  * @typeParam NewResult - The new result type to override with
  * @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
  *
  * @category Database
  * @subcategory Using modifiers
  */
  returns() {
    return this;
  }
  /**
  * Override the type of the returned `data` field in the response.
  *
  * @typeParam NewResult - The new type to cast the response data to
  * @typeParam Options - Optional type configuration (defaults to { merge: true })
  * @typeParam Options.merge - When true, merges the new type with existing return type. When false, replaces the existing types entirely (defaults to true)
  * @example
  * ```typescript
  * // Merge with existing types (default behavior)
  * const query = supabase
  *   .from('users')
  *   .select()
  *   .overrideTypes<{ custom_field: string }>()
  *
  * // Replace existing types completely
  * const replaceQuery = supabase
  *   .from('users')
  *   .select()
  *   .overrideTypes<{ id: number; name: string }, { merge: false }>()
  * ```
  * @returns A PostgrestBuilder instance with the new type
  *
  * @category Database
  * @subcategory Using modifiers
  *
  * @example Complete Override type of successful response
  * ```ts
  * const { data } = await supabase
  *   .from('countries')
  *   .select()
  *   .overrideTypes<Array<MyType>, { merge: false }>()
  * ```
  *
  * @exampleResponse Complete Override type of successful response
  * ```ts
  * let x: typeof data // MyType[]
  * ```
  *
  * @example Complete Override type of object response
  * ```ts
  * const { data } = await supabase
  *   .from('countries')
  *   .select()
  *   .maybeSingle()
  *   .overrideTypes<MyType, { merge: false }>()
  * ```
  *
  * @exampleResponse Complete Override type of object response
  * ```ts
  * let x: typeof data // MyType | null
  * ```
  *
  * @example Partial Override type of successful response
  * ```ts
  * const { data } = await supabase
  *   .from('countries')
  *   .select()
  *   .overrideTypes<Array<{ status: "A" | "B" }>>()
  * ```
  *
  * @exampleResponse Partial Override type of successful response
  * ```ts
  * let x: typeof data // Array<CountryRowProperties & { status: "A" | "B" }>
  * ```
  *
  * @example Partial Override type of object response
  * ```ts
  * const { data } = await supabase
  *   .from('countries')
  *   .select()
  *   .maybeSingle()
  *   .overrideTypes<{ status: "A" | "B" }>()
  * ```
  *
  * @exampleResponse Partial Override type of object response
  * ```ts
  * let x: typeof data // CountryRowProperties & { status: "A" | "B" } | null
  * ```
  *
  * @example Merge vs replace existing types
  * ```typescript
  * // Merge with existing types (default behavior)
  * const query = supabase
  *   .from('users')
  *   .select()
  *   .overrideTypes<{ custom_field: string }>()
  *
  * // Replace existing types completely
  * const replaceQuery = supabase
  *   .from('users')
  *   .select()
  *   .overrideTypes<{ id: number; name: string }, { merge: false }>()
  * ```
  */
  overrideTypes() {
    return this;
  }
}, Pn = class extends Mn {
  throwOnError() {
    return super.throwOnError();
  }
  /**
  * Perform a SELECT on the query result.
  *
  * By default, `.insert()`, `.update()`, `.upsert()`, and `.delete()` do not
  * return modified rows. By calling this method, modified rows are returned in
  * `data`.
  *
  * @param columns - The columns to retrieve, separated by commas
  *
  * @category Database
  * @subcategory Using modifiers
  *
  * @example With `upsert()`
  * ```ts
  * const { data, error } = await supabase
  *   .from('characters')
  *   .upsert({ id: 1, name: 'Han Solo' })
  *   .select()
  * ```
  *
  * @exampleSql With `upsert()`
  * ```sql
  * create table
  *   characters (id int8 primary key, name text);
  *
  * insert into
  *   characters (id, name)
  * values
  *   (1, 'Han');
  * ```
  *
  * @exampleResponse With `upsert()`
  * ```json
  * {
  *   "data": [
  *     {
  *       "id": 1,
  *       "name": "Han Solo"
  *     }
  *   ],
  *   "status": 201,
  *   "statusText": ""
  * }
  * ```
  */
  select(t) {
    let e = !1;
    const r = (t ?? "*").split("").map((s) => /\s/.test(s) && !e ? "" : (s === '"' && (e = !e), s)).join("");
    return this.url.searchParams.set("select", r), this.headers.append("Prefer", "return=representation"), this;
  }
  /**
  * Order the query result by `column`.
  *
  * You can call this method multiple times to order by multiple columns.
  *
  * You can order referenced tables, but it only affects the ordering of the
  * parent table if you use `!inner` in the query.
  *
  * @param column - The column to order by
  * @param options - Named parameters
  * @param options.ascending - If `true`, the result will be in ascending order
  * @param options.nullsFirst - If `true`, `null`s appear first. If `false`,
  * `null`s appear last.
  * @param options.referencedTable - Set this to order a referenced table by
  * its columns
  * @param options.foreignTable - Deprecated, use `options.referencedTable`
  * instead
  *
  * @category Database
  * @subcategory Using modifiers
  *
  * @example With `select()`
  * ```ts
  * const { data, error } = await supabase
  *   .from('characters')
  *   .select('id, name')
  *   .order('id', { ascending: false })
  * ```
  *
  * @exampleSql With `select()`
  * ```sql
  * create table
  *   characters (id int8 primary key, name text);
  *
  * insert into
  *   characters (id, name)
  * values
  *   (1, 'Luke'),
  *   (2, 'Leia'),
  *   (3, 'Han');
  * ```
  *
  * @exampleResponse With `select()`
  * ```json
  * {
  *   "data": [
  *     {
  *       "id": 3,
  *       "name": "Han"
  *     },
  *     {
  *       "id": 2,
  *       "name": "Leia"
  *     },
  *     {
  *       "id": 1,
  *       "name": "Luke"
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  *
  * @exampleDescription On a referenced table
  * Ordering with `referencedTable` doesn't affect the ordering of the
  * parent table.
  *
  * @example On a referenced table
  * ```ts
  *   const { data, error } = await supabase
  *     .from('orchestral_sections')
  *     .select(`
  *       name,
  *       instruments (
  *         name
  *       )
  *     `)
  *     .order('name', { referencedTable: 'instruments', ascending: false })
  *
  * ```
  *
  * @exampleSql On a referenced table
  * ```sql
  * create table
  *   orchestral_sections (id int8 primary key, name text);
  * create table
  *   instruments (
  *     id int8 primary key,
  *     section_id int8 not null references orchestral_sections,
  *     name text
  *   );
  *
  * insert into
  *   orchestral_sections (id, name)
  * values
  *   (1, 'strings'),
  *   (2, 'woodwinds');
  * insert into
  *   instruments (id, section_id, name)
  * values
  *   (1, 1, 'harp'),
  *   (2, 1, 'violin');
  * ```
  *
  * @exampleResponse On a referenced table
  * ```json
  * {
  *   "data": [
  *     {
  *       "name": "strings",
  *       "instruments": [
  *         {
  *           "name": "violin"
  *         },
  *         {
  *           "name": "harp"
  *         }
  *       ]
  *     },
  *     {
  *       "name": "woodwinds",
  *       "instruments": []
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  *
  * @exampleDescription Order parent table by a referenced table
  * Ordering with `referenced_table(col)` affects the ordering of the
  * parent table.
  *
  * @example Order parent table by a referenced table
  * ```ts
  *   const { data, error } = await supabase
  *     .from('instruments')
  *     .select(`
  *       name,
  *       section:orchestral_sections (
  *         name
  *       )
  *     `)
  *     .order('section(name)', { ascending: true })
  *
  * ```
  *
  * @exampleSql Order parent table by a referenced table
  * ```sql
  * create table
  *   orchestral_sections (id int8 primary key, name text);
  * create table
  *   instruments (
  *     id int8 primary key,
  *     section_id int8 not null references orchestral_sections,
  *     name text
  *   );
  *
  * insert into
  *   orchestral_sections (id, name)
  * values
  *   (1, 'strings'),
  *   (2, 'woodwinds');
  * insert into
  *   instruments (id, section_id, name)
  * values
  *   (1, 2, 'flute'),
  *   (2, 1, 'violin');
  * ```
  *
  * @exampleResponse Order parent table by a referenced table
  * ```json
  * {
  *   "data": [
  *     {
  *       "name": "violin",
  *       "orchestral_sections": {"name": "strings"}
  *     },
  *     {
  *       "name": "flute",
  *       "orchestral_sections": {"name": "woodwinds"}
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  */
  order(t, { ascending: e = !0, nullsFirst: r, foreignTable: s, referencedTable: n = s } = {}) {
    const i = n ? `${n}.order` : "order", a = this.url.searchParams.get(i);
    return this.url.searchParams.set(i, `${a ? `${a},` : ""}${t}.${e ? "asc" : "desc"}${r === void 0 ? "" : r ? ".nullsfirst" : ".nullslast"}`), this;
  }
  /**
  * Limit the query result by `rows`.
  *
  * @param rows - The maximum number of rows to return
  * @param options - Named parameters
  * @param options.referencedTable - Set this to limit rows of referenced
  * tables instead of the parent table
  * @param options.foreignTable - Deprecated, use `options.referencedTable`
  * instead
  *
  * @category Database
  * @subcategory Using modifiers
  *
  * @example With `select()`
  * ```ts
  * const { data, error } = await supabase
  *   .from('characters')
  *   .select('name')
  *   .limit(1)
  * ```
  *
  * @exampleSql With `select()`
  * ```sql
  * create table
  *   characters (id int8 primary key, name text);
  *
  * insert into
  *   characters (id, name)
  * values
  *   (1, 'Luke'),
  *   (2, 'Leia'),
  *   (3, 'Han');
  * ```
  *
  * @exampleResponse With `select()`
  * ```json
  * {
  *   "data": [
  *     {
  *       "name": "Luke"
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  *
  * @example On a referenced table
  * ```ts
  * const { data, error } = await supabase
  *   .from('orchestral_sections')
  *   .select(`
  *     name,
  *     instruments (
  *       name
  *     )
  *   `)
  *   .limit(1, { referencedTable: 'instruments' })
  * ```
  *
  * @exampleSql On a referenced table
  * ```sql
  * create table
  *   orchestral_sections (id int8 primary key, name text);
  * create table
  *   instruments (
  *     id int8 primary key,
  *     section_id int8 not null references orchestral_sections,
  *     name text
  *   );
  *
  * insert into
  *   orchestral_sections (id, name)
  * values
  *   (1, 'strings');
  * insert into
  *   instruments (id, section_id, name)
  * values
  *   (1, 1, 'harp'),
  *   (2, 1, 'violin');
  * ```
  *
  * @exampleResponse On a referenced table
  * ```json
  * {
  *   "data": [
  *     {
  *       "name": "strings",
  *       "instruments": [
  *         {
  *           "name": "violin"
  *         }
  *       ]
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  */
  limit(t, { foreignTable: e, referencedTable: r = e } = {}) {
    const s = typeof r > "u" ? "limit" : `${r}.limit`;
    return this.url.searchParams.set(s, `${t}`), this;
  }
  /**
  * Limit the query result by starting at an offset `from` and ending at the offset `to`.
  * Only records within this range are returned.
  * This respects the query order and if there is no order clause the range could behave unexpectedly.
  * The `from` and `to` values are 0-based and inclusive: `range(1, 3)` will include the second, third
  * and fourth rows of the query.
  *
  * @param from - The starting index from which to limit the result
  * @param to - The last index to which to limit the result
  * @param options - Named parameters
  * @param options.referencedTable - Set this to limit rows of referenced
  * tables instead of the parent table
  * @param options.foreignTable - Deprecated, use `options.referencedTable`
  * instead
  *
  * @category Database
  * @subcategory Using modifiers
  *
  * @example With `select()`
  * ```ts
  * const { data, error } = await supabase
  *   .from('characters')
  *   .select('name')
  *   .range(0, 1)
  * ```
  *
  * @exampleSql With `select()`
  * ```sql
  * create table
  *   characters (id int8 primary key, name text);
  *
  * insert into
  *   characters (id, name)
  * values
  *   (1, 'Luke'),
  *   (2, 'Leia'),
  *   (3, 'Han');
  * ```
  *
  * @exampleResponse With `select()`
  * ```json
  * {
  *   "data": [
  *     {
  *       "name": "Luke"
  *     },
  *     {
  *       "name": "Leia"
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  */
  range(t, e, { foreignTable: r, referencedTable: s = r } = {}) {
    const n = typeof s > "u" ? "offset" : `${s}.offset`, i = typeof s > "u" ? "limit" : `${s}.limit`;
    return this.url.searchParams.set(n, `${t}`), this.url.searchParams.set(i, `${e - t + 1}`), this;
  }
  /**
  * Set the AbortSignal for the fetch request.
  *
  * @param signal - The AbortSignal to use for the fetch request
  *
  * @category Database
  * @subcategory Using modifiers
  *
  * @remarks
  * You can use this to set a timeout for the request.
  *
  * @exampleDescription Aborting requests in-flight
  * You can use an [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) to abort requests.
  * Note that `status` and `statusText` don't mean anything for aborted requests as the request wasn't fulfilled.
  *
  * @example Aborting requests in-flight
  * ```ts
  * const ac = new AbortController()
  *
  * const { data, error } = await supabase
  *   .from('very_big_table')
  *   .select()
  *   .abortSignal(ac.signal)
  *
  * // Abort the request after 100 ms
  * setTimeout(() => ac.abort(), 100)
  * ```
  *
  * @exampleResponse Aborting requests in-flight
  * ```json
  *   {
  *     "error": {
  *       "message": "AbortError: The user aborted a request.",
  *       "details": "",
  *       "hint": "The request was aborted locally via the provided AbortSignal.",
  *       "code": ""
  *     },
  *     "status": 0,
  *     "statusText": ""
  *   }
  *
  * ```
  *
  * @example Set a timeout
  * ```ts
  * const { data, error } = await supabase
  *   .from('very_big_table')
  *   .select()
  *   .abortSignal(AbortSignal.timeout(1000 /* ms *\/))
  * ```
  *
  * @exampleResponse Set a timeout
  * ```json
  *   {
  *     "error": {
  *       "message": "FetchError: The user aborted a request.",
  *       "details": "",
  *       "hint": "",
  *       "code": ""
  *     },
  *     "status": 0,
  *     "statusText": ""
  *   }
  *
  * ```
  */
  abortSignal(t) {
    return this.signal = t, this;
  }
  /**
  * Return `data` as a single object instead of an array of objects.
  *
  * Query result must be one row (e.g. using `.limit(1)`), otherwise this
  * returns an error.
  *
  * @category Database
  * @subcategory Using modifiers
  *
  * @example With `select()`
  * ```ts
  * const { data, error } = await supabase
  *   .from('characters')
  *   .select('name')
  *   .limit(1)
  *   .single()
  * ```
  *
  * @exampleSql With `select()`
  * ```sql
  * create table
  *   characters (id int8 primary key, name text);
  *
  * insert into
  *   characters (id, name)
  * values
  *   (1, 'Luke'),
  *   (2, 'Leia'),
  *   (3, 'Han');
  * ```
  *
  * @exampleResponse With `select()`
  * ```json
  * {
  *   "data": {
  *     "name": "Luke"
  *   },
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  */
  single() {
    return this.headers.set("Accept", "application/vnd.pgrst.object+json"), this;
  }
  /**
  * Return `data` as a single object instead of an array of objects.
  *
  * Query result must be zero or one row (e.g. using `.limit(1)`), otherwise
  * this returns an error.
  *
  * @category Database
  * @subcategory Using modifiers
  *
  * @example With `select()`
  * ```ts
  * const { data, error } = await supabase
  *   .from('characters')
  *   .select()
  *   .eq('name', 'Katniss')
  *   .maybeSingle()
  * ```
  *
  * @exampleSql With `select()`
  * ```sql
  * create table
  *   characters (id int8 primary key, name text);
  *
  * insert into
  *   characters (id, name)
  * values
  *   (1, 'Luke'),
  *   (2, 'Leia'),
  *   (3, 'Han');
  * ```
  *
  * @exampleResponse With `select()`
  * ```json
  * {
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  */
  maybeSingle() {
    return this.isMaybeSingle = !0, this;
  }
  /**
  * Return `data` as a string in CSV format.
  *
  * @category Database
  * @subcategory Using modifiers
  *
  * @exampleDescription Return data as CSV
  * By default, the data is returned in JSON format, but can also be returned as Comma Separated Values.
  *
  * @example Return data as CSV
  * ```ts
  * const { data, error } = await supabase
  *   .from('characters')
  *   .select()
  *   .csv()
  * ```
  *
  * @exampleSql Return data as CSV
  * ```sql
  * create table
  *   characters (id int8 primary key, name text);
  *
  * insert into
  *   characters (id, name)
  * values
  *   (1, 'Luke'),
  *   (2, 'Leia'),
  *   (3, 'Han');
  * ```
  *
  * @exampleResponse Return data as CSV
  * ```json
  * {
  *   "data": "id,name\n1,Luke\n2,Leia\n3,Han",
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  */
  csv() {
    return this.headers.set("Accept", "text/csv"), this;
  }
  /**
  * Return `data` as an object in [GeoJSON](https://geojson.org) format.
  *
  * @category Database
  * @subcategory Using modifiers
  */
  geojson() {
    return this.headers.set("Accept", "application/geo+json"), this;
  }
  /**
  * Return `data` as the EXPLAIN plan for the query.
  *
  * You need to enable the
  * [db_plan_enabled](https://supabase.com/docs/guides/database/debugging-performance#enabling-explain)
  * setting before using this method.
  *
  * @param options - Named parameters
  *
  * @param options.analyze - If `true`, the query will be executed and the
  * actual run time will be returned
  *
  * @param options.verbose - If `true`, the query identifier will be returned
  * and `data` will include the output columns of the query
  *
  * @param options.settings - If `true`, include information on configuration
  * parameters that affect query planning
  *
  * @param options.buffers - If `true`, include information on buffer usage
  *
  * @param options.wal - If `true`, include information on WAL record generation
  *
  * @param options.format - The format of the output, can be `"text"` (default)
  * or `"json"`
  *
  * @category Database
  * @subcategory Using modifiers
  *
  * @exampleDescription Get the execution plan
  * By default, the data is returned in TEXT format, but can also be returned as JSON by using the `format` parameter.
  *
  * @example Get the execution plan
  * ```ts
  * const { data, error } = await supabase
  *   .from('characters')
  *   .select()
  *   .explain()
  * ```
  *
  * @exampleSql Get the execution plan
  * ```sql
  * create table
  *   characters (id int8 primary key, name text);
  *
  * insert into
  *   characters (id, name)
  * values
  *   (1, 'Luke'),
  *   (2, 'Leia'),
  *   (3, 'Han');
  * ```
  *
  * @exampleResponse Get the execution plan
  * ```js
  * Aggregate  (cost=33.34..33.36 rows=1 width=112)
  *   ->  Limit  (cost=0.00..18.33 rows=1000 width=40)
  *         ->  Seq Scan on characters  (cost=0.00..22.00 rows=1200 width=40)
  * ```
  *
  * @exampleDescription Get the execution plan with analyze and verbose
  * By default, the data is returned in TEXT format, but can also be returned as JSON by using the `format` parameter.
  *
  * @example Get the execution plan with analyze and verbose
  * ```ts
  * const { data, error } = await supabase
  *   .from('characters')
  *   .select()
  *   .explain({analyze:true,verbose:true})
  * ```
  *
  * @exampleSql Get the execution plan with analyze and verbose
  * ```sql
  * create table
  *   characters (id int8 primary key, name text);
  *
  * insert into
  *   characters (id, name)
  * values
  *   (1, 'Luke'),
  *   (2, 'Leia'),
  *   (3, 'Han');
  * ```
  *
  * @exampleResponse Get the execution plan with analyze and verbose
  * ```js
  * Aggregate  (cost=33.34..33.36 rows=1 width=112) (actual time=0.041..0.041 rows=1 loops=1)
  *   Output: NULL::bigint, count(ROW(characters.id, characters.name)), COALESCE(json_agg(ROW(characters.id, characters.name)), '[]'::json), NULLIF(current_setting('response.headers'::text, true), ''::text), NULLIF(current_setting('response.status'::text, true), ''::text)
  *   ->  Limit  (cost=0.00..18.33 rows=1000 width=40) (actual time=0.005..0.006 rows=3 loops=1)
  *         Output: characters.id, characters.name
  *         ->  Seq Scan on public.characters  (cost=0.00..22.00 rows=1200 width=40) (actual time=0.004..0.005 rows=3 loops=1)
  *               Output: characters.id, characters.name
  * Query Identifier: -4730654291623321173
  * Planning Time: 0.407 ms
  * Execution Time: 0.119 ms
  * ```
  */
  explain({ analyze: t = !1, verbose: e = !1, settings: r = !1, buffers: s = !1, wal: n = !1, format: i = "text" } = {}) {
    var a;
    const l = [
      t ? "analyze" : null,
      e ? "verbose" : null,
      r ? "settings" : null,
      s ? "buffers" : null,
      n ? "wal" : null
    ].filter(Boolean).join("|"), h = (a = this.headers.get("Accept")) !== null && a !== void 0 ? a : "application/json";
    return this.headers.set("Accept", `application/vnd.pgrst.plan+${i}; for="${h}"; options=${l};`), i === "json" ? this : this;
  }
  /**
  * Dry-run this request: execute the query but discard the changes.
  *
  * Server-side, PostgREST runs the query inside a transaction and rolls it back
  * instead of committing. The response still contains the data that *would* have
  * been returned — `RETURNING` clauses execute and RLS, triggers, and constraints
  * are all evaluated — but no row is actually inserted, updated, or deleted.
  *
  * This affects only the single request it is chained to. The JS caller has no
  * handle on the transaction: supabase-js does not group multiple queries into
  * one transaction. For multi-statement transactional logic, use a database
  * function (`supabase.rpc(...)`).
  *
  * Sets the `Prefer: tx=rollback` header. See PostgREST's docs on transaction
  * preferences for the underlying mechanism.
  *
  * @category Database
  * @subcategory Using modifiers
  *
  * @example Validate an insert without persisting
  * ```ts
  * const { data, error } = await supabase
  *   .from('countries')
  *   .insert({ name: 'France' })
  *   .select()
  *   .rollback()
  * // `data` shows what would have been inserted; nothing is saved.
  * ```
  */
  rollback() {
    return this.headers.append("Prefer", "tx=rollback"), this;
  }
  /**
  * Override the type of the returned `data`.
  *
  * @typeParam NewResult - The new result type to override with
  * @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
  *
  * @category Database
  * @subcategory Using modifiers
  *
  * @remarks
  * - Deprecated: use overrideTypes method instead
  *
  * @example Override type of successful response
  * ```ts
  * const { data } = await supabase
  *   .from('countries')
  *   .select()
  *   .returns<Array<MyType>>()
  * ```
  *
  * @exampleResponse Override type of successful response
  * ```js
  * let x: typeof data // MyType[]
  * ```
  *
  * @example Override type of object response
  * ```ts
  * const { data } = await supabase
  *   .from('countries')
  *   .select()
  *   .maybeSingle()
  *   .returns<MyType>()
  * ```
  *
  * @exampleResponse Override type of object response
  * ```js
  * let x: typeof data // MyType | null
  * ```
  */
  returns() {
    return this;
  }
  /**
  * Set the maximum number of rows that can be affected by the query.
  * Only available in PostgREST v13+ and only works with PATCH and DELETE methods.
  *
  * @param rows - The maximum number of rows that can be affected
  *
  * @category Database
  * @subcategory Using modifiers
  */
  maxAffected(t) {
    return this.headers.append("Prefer", "handling=strict"), this.headers.append("Prefer", `max-affected=${t}`), this;
  }
};
const jr = /* @__PURE__ */ new RegExp("[,()]");
var Ne = class extends Pn {
  throwOnError() {
    return super.throwOnError();
  }
  /**
  * Match only rows where `column` is equal to `value`.
  *
  * To check if the value of `column` is NULL, you should use `.is()` instead.
  *
  * @param column - The column to filter on
  * @param value - The value to filter with
  *
  * @category Database
  * @subcategory Using filters
  *
  * @example With `select()`
  * ```ts
  * const { data, error } = await supabase
  *   .from('characters')
  *   .select()
  *   .eq('name', 'Leia')
  * ```
  *
  * @exampleSql With `select()`
  * ```sql
  * create table
  *   characters (id int8 primary key, name text);
  *
  * insert into
  *   characters (id, name)
  * values
  *   (1, 'Luke'),
  *   (2, 'Leia'),
  *   (3, 'Han');
  * ```
  *
  * @exampleResponse With `select()`
  * ```json
  * {
  *   "data": [
  *     {
  *       "id": 2,
  *       "name": "Leia"
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  */
  eq(t, e) {
    return this.url.searchParams.append(t, `eq.${e}`), this;
  }
  /**
  * Match only rows where `column` is not equal to `value`.
  *
  * This filter does not include rows where `column` is `NULL`. To match null
  * values, use `.is(column, null)` instead.
  *
  * @param column - The column to filter on
  * @param value - The value to filter with
  *
  * @category Database
  * @subcategory Using filters
  *
  * @example With `select()`
  * ```ts
  * const { data, error } = await supabase
  *   .from('characters')
  *   .select()
  *   .neq('name', 'Leia')
  * ```
  *
  * @exampleSql With `select()`
  * ```sql
  * create table
  *   characters (id int8 primary key, name text);
  *
  * insert into
  *   characters (id, name)
  * values
  *   (1, 'Luke'),
  *   (2, 'Leia'),
  *   (3, 'Han');
  * ```
  *
  * @exampleResponse With `select()`
  * ```json
  * {
  *   "data": [
  *     {
  *       "id": 1,
  *       "name": "Luke"
  *     },
  *     {
  *       "id": 3,
  *       "name": "Han"
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  */
  neq(t, e) {
    return this.url.searchParams.append(t, `neq.${e}`), this;
  }
  gt(t, e) {
    return this.url.searchParams.append(t, `gt.${e}`), this;
  }
  gte(t, e) {
    return this.url.searchParams.append(t, `gte.${e}`), this;
  }
  lt(t, e) {
    return this.url.searchParams.append(t, `lt.${e}`), this;
  }
  lte(t, e) {
    return this.url.searchParams.append(t, `lte.${e}`), this;
  }
  like(t, e) {
    return this.url.searchParams.append(t, `like.${e}`), this;
  }
  likeAllOf(t, e) {
    return this.url.searchParams.append(t, `like(all).{${e.join(",")}}`), this;
  }
  likeAnyOf(t, e) {
    return this.url.searchParams.append(t, `like(any).{${e.join(",")}}`), this;
  }
  ilike(t, e) {
    return this.url.searchParams.append(t, `ilike.${e}`), this;
  }
  ilikeAllOf(t, e) {
    return this.url.searchParams.append(t, `ilike(all).{${e.join(",")}}`), this;
  }
  ilikeAnyOf(t, e) {
    return this.url.searchParams.append(t, `ilike(any).{${e.join(",")}}`), this;
  }
  regexMatch(t, e) {
    return this.url.searchParams.append(t, `match.${e}`), this;
  }
  regexIMatch(t, e) {
    return this.url.searchParams.append(t, `imatch.${e}`), this;
  }
  is(t, e) {
    return this.url.searchParams.append(t, `is.${e}`), this;
  }
  /**
  * Match only rows where `column` IS DISTINCT FROM `value`.
  *
  * Unlike `.neq()`, this treats `NULL` as a comparable value. Two `NULL` values
  * are considered equal (not distinct), and comparing `NULL` with any non-NULL
  * value returns true (distinct).
  *
  * @param column - The column to filter on
  * @param value - The value to filter with
  */
  isDistinct(t, e) {
    return this.url.searchParams.append(t, `isdistinct.${e}`), this;
  }
  /**
  * Match only rows where `column` is included in the `values` array.
  *
  * @param column - The column to filter on
  * @param values - The values array to filter with
  *
  * @category Database
  * @subcategory Using filters
  *
  * @example With `select()`
  * ```ts
  * const { data, error } = await supabase
  *   .from('characters')
  *   .select()
  *   .in('name', ['Leia', 'Han'])
  * ```
  *
  * @exampleSql With `select()`
  * ```sql
  * create table
  *   characters (id int8 primary key, name text);
  *
  * insert into
  *   characters (id, name)
  * values
  *   (1, 'Luke'),
  *   (2, 'Leia'),
  *   (3, 'Han');
  * ```
  *
  * @exampleResponse With `select()`
  * ```json
  * {
  *   "data": [
  *     {
  *       "id": 2,
  *       "name": "Leia"
  *     },
  *     {
  *       "id": 3,
  *       "name": "Han"
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  */
  in(t, e) {
    const r = Array.from(new Set(e)).map((s) => typeof s == "string" && jr.test(s) ? `"${s}"` : `${s}`).join(",");
    return this.url.searchParams.append(t, `in.(${r})`), this;
  }
  /**
  * Match only rows where `column` is NOT included in the `values` array.
  *
  * @param column - The column to filter on
  * @param values - The values array to filter with
  */
  notIn(t, e) {
    const r = Array.from(new Set(e)).map((s) => typeof s == "string" && jr.test(s) ? `"${s}"` : `${s}`).join(",");
    return this.url.searchParams.append(t, `not.in.(${r})`), this;
  }
  contains(t, e) {
    return typeof e == "string" ? this.url.searchParams.append(t, `cs.${e}`) : Array.isArray(e) ? this.url.searchParams.append(t, `cs.{${e.join(",")}}`) : this.url.searchParams.append(t, `cs.${JSON.stringify(e)}`), this;
  }
  containedBy(t, e) {
    return typeof e == "string" ? this.url.searchParams.append(t, `cd.${e}`) : Array.isArray(e) ? this.url.searchParams.append(t, `cd.{${e.join(",")}}`) : this.url.searchParams.append(t, `cd.${JSON.stringify(e)}`), this;
  }
  rangeGt(t, e) {
    return this.url.searchParams.append(t, `sr.${e}`), this;
  }
  rangeGte(t, e) {
    return this.url.searchParams.append(t, `nxl.${e}`), this;
  }
  rangeLt(t, e) {
    return this.url.searchParams.append(t, `sl.${e}`), this;
  }
  rangeLte(t, e) {
    return this.url.searchParams.append(t, `nxr.${e}`), this;
  }
  rangeAdjacent(t, e) {
    return this.url.searchParams.append(t, `adj.${e}`), this;
  }
  overlaps(t, e) {
    return typeof e == "string" ? this.url.searchParams.append(t, `ov.${e}`) : this.url.searchParams.append(t, `ov.{${e.join(",")}}`), this;
  }
  textSearch(t, e, { config: r, type: s } = {}) {
    let n = "";
    s === "plain" ? n = "pl" : s === "phrase" ? n = "ph" : s === "websearch" && (n = "w");
    const i = r === void 0 ? "" : `(${r})`;
    return this.url.searchParams.append(t, `${n}fts${i}.${e}`), this;
  }
  match(t) {
    return Object.entries(t).filter(([e, r]) => r !== void 0).forEach(([e, r]) => {
      this.url.searchParams.append(e, `eq.${r}`);
    }), this;
  }
  /**
  * Match only rows which doesn't satisfy the filter.
  *
  * Unlike most filters, `opearator` and `value` are used as-is and need to
  * follow [PostgREST
  * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
  * to make sure they are properly sanitized.
  *
  * @param column - The column to filter on
  * @param operator - The operator to be negated to filter with, following
  * PostgREST syntax
  * @param value - The value to filter with, following PostgREST syntax
  *
  * @category Database
  * @subcategory Using filters
  *
  * @remarks
  * not() expects you to use the raw PostgREST syntax for the filter values.
  *
  * ```ts
  * .not('id', 'in', '(5,6,7)')  // Use `()` for `in` filter
  * .not('arraycol', 'cs', '{"a","b"}')  // Use `cs` for `contains()`, `{}` for array values
  * ```
  *
  * @example With `select()`
  * ```ts
  * const { data, error } = await supabase
  *   .from('countries')
  *   .select()
  *   .not('name', 'is', null)
  * ```
  *
  * @exampleSql With `select()`
  * ```sql
  * create table
  *   countries (id int8 primary key, name text);
  *
  * insert into
  *   countries (id, name)
  * values
  *   (1, 'null'),
  *   (2, null);
  * ```
  *
  * @exampleResponse With `select()`
  * ```json
  *   {
  *     "data": [
  *       {
  *         "id": 1,
  *         "name": "null"
  *       }
  *     ],
  *     "status": 200,
  *     "statusText": "OK"
  *   }
  *
  * ```
  */
  not(t, e, r) {
    return this.url.searchParams.append(t, `not.${e}.${r}`), this;
  }
  /**
  * Match only rows which satisfy at least one of the filters.
  *
  * Unlike most filters, `filters` is used as-is and needs to follow [PostgREST
  * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
  * to make sure it's properly sanitized.
  *
  * It's currently not possible to do an `.or()` filter across multiple tables.
  *
  * @param filters - The filters to use, following PostgREST syntax
  * @param options - Named parameters
  * @param options.referencedTable - Set this to filter on referenced tables
  * instead of the parent table
  * @param options.foreignTable - Deprecated, use `referencedTable` instead
  *
  * @category Database
  * @subcategory Using filters
  *
  * @remarks
  * or() expects you to use the raw PostgREST syntax for the filter names and values.
  *
  * ```ts
  * .or('id.in.(5,6,7), arraycol.cs.{"a","b"}')  // Use `()` for `in` filter, `{}` for array values and `cs` for `contains()`.
  * .or('id.in.(5,6,7), arraycol.cd.{"a","b"}')  // Use `cd` for `containedBy()`
  * ```
  *
  * @example With `select()`
  * ```ts
  * const { data, error } = await supabase
  *   .from('characters')
  *   .select('name')
  *   .or('id.eq.2,name.eq.Han')
  * ```
  *
  * @exampleSql With `select()`
  * ```sql
  * create table
  *   characters (id int8 primary key, name text);
  *
  * insert into
  *   characters (id, name)
  * values
  *   (1, 'Luke'),
  *   (2, 'Leia'),
  *   (3, 'Han');
  * ```
  *
  * @exampleResponse With `select()`
  * ```json
  * {
  *   "data": [
  *     {
  *       "name": "Leia"
  *     },
  *     {
  *       "name": "Han"
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  *
  * @example Use `or` with `and`
  * ```ts
  * const { data, error } = await supabase
  *   .from('characters')
  *   .select('name')
  *   .or('id.gt.3,and(id.eq.1,name.eq.Luke)')
  * ```
  *
  * @exampleSql Use `or` with `and`
  * ```sql
  * create table
  *   characters (id int8 primary key, name text);
  *
  * insert into
  *   characters (id, name)
  * values
  *   (1, 'Luke'),
  *   (2, 'Leia'),
  *   (3, 'Han');
  * ```
  *
  * @exampleResponse Use `or` with `and`
  * ```json
  * {
  *   "data": [
  *     {
  *       "name": "Luke"
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  *
  * @example Use `or` on referenced tables
  * ```ts
  * const { data, error } = await supabase
  *   .from('orchestral_sections')
  *   .select(`
  *     name,
  *     instruments!inner (
  *       name
  *     )
  *   `)
  *   .or('section_id.eq.1,name.eq.guzheng', { referencedTable: 'instruments' })
  * ```
  *
  * @exampleSql Use `or` on referenced tables
  * ```sql
  * create table
  *   orchestral_sections (id int8 primary key, name text);
  * create table
  *   instruments (
  *     id int8 primary key,
  *     section_id int8 not null references orchestral_sections,
  *     name text
  *   );
  *
  * insert into
  *   orchestral_sections (id, name)
  * values
  *   (1, 'strings'),
  *   (2, 'woodwinds');
  * insert into
  *   instruments (id, section_id, name)
  * values
  *   (1, 2, 'flute'),
  *   (2, 1, 'violin');
  * ```
  *
  * @exampleResponse Use `or` on referenced tables
  * ```json
  * {
  *   "data": [
  *     {
  *       "name": "strings",
  *       "instruments": [
  *         {
  *           "name": "violin"
  *         }
  *       ]
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  */
  or(t, { foreignTable: e, referencedTable: r = e } = {}) {
    const s = r ? `${r}.or` : "or";
    return this.url.searchParams.append(s, `(${t})`), this;
  }
  filter(t, e, r) {
    return this.url.searchParams.append(t, `${e}.${r}`), this;
  }
}, Cn = class {
  /**
  * Creates a query builder scoped to a Postgres table or view.
  *
  * @category Database
  *
  * @param url - The URL for the query
  * @param options - Named parameters
  * @param options.headers - Custom headers
  * @param options.schema - Postgres schema to use
  * @param options.fetch - Custom fetch implementation
  * @param options.urlLengthLimit - Maximum URL length before warning
  * @param options.retry - Enable automatic retries for transient errors (default: true)
  *
  * @example Using supabase-js (recommended)
  * ```ts
  * import { createClient } from '@supabase/supabase-js'
  *
  * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
  * const { data, error } = await supabase.from('users').select('*')
  * ```
  *
  * @example Standalone import for bundle-sensitive environments
  * ```ts
  * import { PostgrestQueryBuilder } from '@supabase/postgrest-js'
  *
  * const query = new PostgrestQueryBuilder(
  *   new URL('https://xyzcompany.supabase.co/rest/v1/users'),
  *   { headers: { apikey: 'your-publishable-key' }, retry: true }
  * )
  * ```
  */
  constructor(t, { headers: e = {}, schema: r, fetch: s, urlLengthLimit: n = 8e3, retry: i }) {
    this.url = t, this.headers = new Headers(e), this.schema = r, this.fetch = s, this.urlLengthLimit = n, this.retry = i;
  }
  /**
  * Clone URL and headers to prevent shared state between operations.
  */
  cloneRequestState() {
    return {
      url: new URL(this.url.toString()),
      headers: new Headers(this.headers)
    };
  }
  /**
  * Perform a SELECT query on the table or view.
  *
  * @param columns - The columns to retrieve, separated by commas. Columns can be renamed when returned with `customName:columnName`
  *
  * @param options - Named parameters
  *
  * @param options.head - When set to `true`, `data` will not be returned.
  * Useful if you only need the count.
  *
  * @param options.count - Count algorithm to use to count rows in the table or view.
  *
  * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
  * hood.
  *
  * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
  * statistics under the hood.
  *
  * `"estimated"`: Uses exact count for low numbers and planned count for high
  * numbers.
  *
  * @remarks
  * When using `count` with `.range()` or `.limit()`, the returned `count` is the total number of rows
  * that match your filters, not the number of rows in the current page. Use this to build pagination UI.
  
  * - By default, Supabase projects return a maximum of 1,000 rows. This setting can be changed in your project's [API settings](/dashboard/project/_/settings/api). It's recommended that you keep it low to limit the payload size of accidental or malicious requests. You can use `range()` queries to paginate through your data.
  * - `select()` can be combined with [Filters](/docs/reference/javascript/using-filters)
  * - `select()` can be combined with [Modifiers](/docs/reference/javascript/using-modifiers)
  * - `apikey` is a reserved keyword if you're using the [Supabase Platform](/docs/guides/platform) and [should be avoided as a column name](https://github.com/supabase/supabase/issues/5465). *
  * @category Database
  *
  * @example Getting your data
  * ```js
  * const { data, error } = await supabase
  *   .from('characters')
  *   .select()
  * ```
  *
  * @exampleSql Getting your data
  * ```sql
  * create table
  *   characters (id int8 primary key, name text);
  *
  * insert into
  *   characters (id, name)
  * values
  *   (1, 'Harry'),
  *   (2, 'Frodo'),
  *   (3, 'Katniss');
  * ```
  *
  * @exampleResponse Getting your data
  * ```json
  * {
  *   "data": [
  *     {
  *       "id": 1,
  *       "name": "Harry"
  *     },
  *     {
  *       "id": 2,
  *       "name": "Frodo"
  *     },
  *     {
  *       "id": 3,
  *       "name": "Katniss"
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  *
  * @exampleDescription Handling errors
  * The most useful field on a Postgres error is usually `hint` — when the database knows the fix, it puts the literal SQL there. For example, a permission-denied error (`code: '42501'`) arrives with a `hint` like `"Grant the required privileges to the current role with: GRANT SELECT ON public.characters TO anon;"`. Log the full `error` object so the hint isn't hidden behind `error.message`.
  *
  * @example Handling errors
  * ```js
  * const { data, error } = await supabase.from('characters').select()
  * if (error) {
  *   // Logs the full error: message, code, details, and hint.
  *   console.error(error)
  *   return
  * }
  * ```
  *
  * @exampleResponse Handling errors
  * ```json
  * {
  *   "error": {
  *     "code": "42501",
  *     "details": null,
  *     "hint": "Grant the required privileges to the current role with: GRANT SELECT ON public.characters TO anon;",
  *     "message": "permission denied for table characters"
  *   },
  *   "status": 401,
  *   "statusText": ""
  * }
  * ```
  *
  * @example Selecting specific columns
  * ```js
  * const { data, error } = await supabase
  *   .from('characters')
  *   .select('name')
  * ```
  *
  * @exampleSql Selecting specific columns
  * ```sql
  * create table
  *   characters (id int8 primary key, name text);
  *
  * insert into
  *   characters (id, name)
  * values
  *   (1, 'Frodo'),
  *   (2, 'Harry'),
  *   (3, 'Katniss');
  * ```
  *
  * @exampleResponse Selecting specific columns
  * ```json
  * {
  *   "data": [
  *     {
  *       "name": "Frodo"
  *     },
  *     {
  *       "name": "Harry"
  *     },
  *     {
  *       "name": "Katniss"
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  *
  * @exampleDescription Query referenced tables
  * If your database has foreign key relationships, you can query related tables too.
  *
  * @example Query referenced tables
  * ```js
  * const { data, error } = await supabase
  *   .from('orchestral_sections')
  *   .select(`
  *     name,
  *     instruments (
  *       name
  *     )
  *   `)
  * ```
  *
  * @exampleSql Query referenced tables
  * ```sql
  * create table
  *   orchestral_sections (id int8 primary key, name text);
  * create table
  *   instruments (
  *     id int8 primary key,
  *     section_id int8 not null references orchestral_sections,
  *     name text
  *   );
  *
  * insert into
  *   orchestral_sections (id, name)
  * values
  *   (1, 'strings'),
  *   (2, 'woodwinds');
  * insert into
  *   instruments (id, section_id, name)
  * values
  *   (1, 2, 'flute'),
  *   (2, 1, 'violin');
  * ```
  *
  * @exampleResponse Query referenced tables
  * ```json
  * {
  *   "data": [
  *     {
  *       "name": "strings",
  *       "instruments": [
  *         {
  *           "name": "violin"
  *         }
  *       ]
  *     },
  *     {
  *       "name": "woodwinds",
  *       "instruments": [
  *         {
  *           "name": "flute"
  *         }
  *       ]
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  *
  * @exampleDescription Query referenced tables with spaces in their names
  * If your table name contains spaces, you must use double quotes in the `select` statement to reference the table.
  *
  * @example Query referenced tables with spaces in their names
  * ```js
  * const { data, error } = await supabase
  *   .from('orchestral sections')
  *   .select(`
  *     name,
  *     "musical instruments" (
  *       name
  *     )
  *   `)
  * ```
  *
  * @exampleSql Query referenced tables with spaces in their names
  * ```sql
  * create table
  *   "orchestral sections" (id int8 primary key, name text);
  * create table
  *   "musical instruments" (
  *     id int8 primary key,
  *     section_id int8 not null references "orchestral sections",
  *     name text
  *   );
  *
  * insert into
  *   "orchestral sections" (id, name)
  * values
  *   (1, 'strings'),
  *   (2, 'woodwinds');
  * insert into
  *   "musical instruments" (id, section_id, name)
  * values
  *   (1, 2, 'flute'),
  *   (2, 1, 'violin');
  * ```
  *
  * @exampleResponse Query referenced tables with spaces in their names
  * ```json
  * {
  *   "data": [
  *     {
  *       "name": "strings",
  *       "musical instruments": [
  *         {
  *           "name": "violin"
  *         }
  *       ]
  *     },
  *     {
  *       "name": "woodwinds",
  *       "musical instruments": [
  *         {
  *           "name": "flute"
  *         }
  *       ]
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  *
  * @exampleDescription Query referenced tables through a join table
  * If you're in a situation where your tables are **NOT** directly
  * related, but instead are joined by a _join table_, you can still use
  * the `select()` method to query the related data. The join table needs
  * to have the foreign keys as part of its composite primary key.
  *
  * @example Query referenced tables through a join table
  * ```ts
  * const { data, error } = await supabase
  *   .from('users')
  *   .select(`
  *     name,
  *     teams (
  *       name
  *     )
  *   `)
  *   
  * ```
  *
  * @exampleSql Query referenced tables through a join table
  * ```sql
  * create table
  *   users (
  *     id int8 primary key,
  *     name text
  *   );
  * create table
  *   teams (
  *     id int8 primary key,
  *     name text
  *   );
  * -- join table
  * create table
  *   users_teams (
  *     user_id int8 not null references users,
  *     team_id int8 not null references teams,
  *     -- both foreign keys must be part of a composite primary key
  *     primary key (user_id, team_id)
  *   );
  *
  * insert into
  *   users (id, name)
  * values
  *   (1, 'Kiran'),
  *   (2, 'Evan');
  * insert into
  *   teams (id, name)
  * values
  *   (1, 'Green'),
  *   (2, 'Blue');
  * insert into
  *   users_teams (user_id, team_id)
  * values
  *   (1, 1),
  *   (1, 2),
  *   (2, 2);
  * ```
  *
  * @exampleResponse Query referenced tables through a join table
  * ```json
  *   {
  *     "data": [
  *       {
  *         "name": "Kiran",
  *         "teams": [
  *           {
  *             "name": "Green"
  *           },
  *           {
  *             "name": "Blue"
  *           }
  *         ]
  *       },
  *       {
  *         "name": "Evan",
  *         "teams": [
  *           {
  *             "name": "Blue"
  *           }
  *         ]
  *       }
  *     ],
  *     "status": 200,
  *     "statusText": "OK"
  *   }
  *   
  * ```
  *
  * @exampleDescription Query the same referenced table multiple times
  * If you need to query the same referenced table twice, use the name of the
  * joined column to identify which join to use. You can also give each
  * column an alias.
  *
  * @example Query the same referenced table multiple times
  * ```ts
  * const { data, error } = await supabase
  *   .from('messages')
  *   .select(`
  *     content,
  *     from:sender_id(name),
  *     to:receiver_id(name)
  *   `)
  *
  * // To infer types, use the name of the table (in this case `users`) and
  * // the name of the foreign key constraint.
  * const { data, error } = await supabase
  *   .from('messages')
  *   .select(`
  *     content,
  *     from:users!messages_sender_id_fkey(name),
  *     to:users!messages_receiver_id_fkey(name)
  *   `)
  * ```
  *
  * @exampleSql Query the same referenced table multiple times
  * ```sql
  *  create table
  *  users (id int8 primary key, name text);
  *
  *  create table
  *    messages (
  *      sender_id int8 not null references users,
  *      receiver_id int8 not null references users,
  *      content text
  *    );
  *
  *  insert into
  *    users (id, name)
  *  values
  *    (1, 'Kiran'),
  *    (2, 'Evan');
  *
  *  insert into
  *    messages (sender_id, receiver_id, content)
  *  values
  *    (1, 2, '👋');
  *  ```
  * ```
  *
  * @exampleResponse Query the same referenced table multiple times
  * ```json
  * {
  *   "data": [
  *     {
  *       "content": "👋",
  *       "from": {
  *         "name": "Kiran"
  *       },
  *       "to": {
  *         "name": "Evan"
  *       }
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  *
  * @exampleDescription Query nested foreign tables through a join table
  * You can use the result of a joined table to gather data in
  * another foreign table. With multiple references to the same foreign
  * table you must specify the column on which to conduct the join.
  *
  * @example Query nested foreign tables through a join table
  * ```ts
  *   const { data, error } = await supabase
  *     .from('games')
  *     .select(`
  *       game_id:id,
  *       away_team:teams!games_away_team_fkey (
  *         users (
  *           id,
  *           name
  *         )
  *       )
  *     `)
  *   
  * ```
  *
  * @exampleSql Query nested foreign tables through a join table
  * ```sql
  * ```sql
  * create table
  *   users (
  *     id int8 primary key,
  *     name text
  *   );
  * create table
  *   teams (
  *     id int8 primary key,
  *     name text
  *   );
  * -- join table
  * create table
  *   users_teams (
  *     user_id int8 not null references users,
  *     team_id int8 not null references teams,
  *
  *     primary key (user_id, team_id)
  *   );
  * create table
  *   games (
  *     id int8 primary key,
  *     home_team int8 not null references teams,
  *     away_team int8 not null references teams,
  *     name text
  *   );
  *
  * insert into users (id, name)
  * values
  *   (1, 'Kiran'),
  *   (2, 'Evan');
  * insert into
  *   teams (id, name)
  * values
  *   (1, 'Green'),
  *   (2, 'Blue');
  * insert into
  *   users_teams (user_id, team_id)
  * values
  *   (1, 1),
  *   (1, 2),
  *   (2, 2);
  * insert into
  *   games (id, home_team, away_team, name)
  * values
  *   (1, 1, 2, 'Green vs Blue'),
  *   (2, 2, 1, 'Blue vs Green');
  * ```
  *
  * @exampleResponse Query nested foreign tables through a join table
  * ```json
  *   {
  *     "data": [
  *       {
  *         "game_id": 1,
  *         "away_team": {
  *           "users": [
  *             {
  *               "id": 1,
  *               "name": "Kiran"
  *             },
  *             {
  *               "id": 2,
  *               "name": "Evan"
  *             }
  *           ]
  *         }
  *       },
  *       {
  *         "game_id": 2,
  *         "away_team": {
  *           "users": [
  *             {
  *               "id": 1,
  *               "name": "Kiran"
  *             }
  *           ]
  *         }
  *       }
  *     ],
  *     "status": 200,
  *     "statusText": "OK"
  *   }
  *   
  * ```
  *
  * @exampleDescription Filtering through referenced tables
  * If the filter on a referenced table's column is not satisfied, the referenced
  * table returns `[]` or `null` but the parent table is not filtered out.
  * If you want to filter out the parent table rows, use the `!inner` hint
  *
  * @example Filtering through referenced tables
  * ```ts
  * const { data, error } = await supabase
  *   .from('instruments')
  *   .select('name, orchestral_sections(*)')
  *   .eq('orchestral_sections.name', 'percussion')
  * ```
  *
  * @exampleSql Filtering through referenced tables
  * ```sql
  * create table
  *   orchestral_sections (id int8 primary key, name text);
  * create table
  *   instruments (
  *     id int8 primary key,
  *     section_id int8 not null references orchestral_sections,
  *     name text
  *   );
  *
  * insert into
  *   orchestral_sections (id, name)
  * values
  *   (1, 'strings'),
  *   (2, 'woodwinds');
  * insert into
  *   instruments (id, section_id, name)
  * values
  *   (1, 2, 'flute'),
  *   (2, 1, 'violin');
  * ```
  *
  * @exampleResponse Filtering through referenced tables
  * ```json
  * {
  *   "data": [
  *     {
  *       "name": "flute",
  *       "orchestral_sections": null
  *     },
  *     {
  *       "name": "violin",
  *       "orchestral_sections": null
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  *
  * @exampleDescription Querying referenced table with count
  * You can get the number of rows in a related table by using the
  * **count** property.
  *
  * @example Querying referenced table with count
  * ```ts
  * const { data, error } = await supabase
  *   .from('orchestral_sections')
  *   .select(`*, instruments(count)`)
  * ```
  *
  * @exampleSql Querying referenced table with count
  * ```sql
  * create table orchestral_sections (
  *   "id" "uuid" primary key default "extensions"."uuid_generate_v4"() not null,
  *   "name" text
  * );
  *
  * create table characters (
  *   "id" "uuid" primary key default "extensions"."uuid_generate_v4"() not null,
  *   "name" text,
  *   "section_id" "uuid" references public.orchestral_sections on delete cascade
  * );
  *
  * with section as (
  *   insert into orchestral_sections (name)
  *   values ('strings') returning id
  * )
  * insert into instruments (name, section_id) values
  * ('violin', (select id from section)),
  * ('viola', (select id from section)),
  * ('cello', (select id from section)),
  * ('double bass', (select id from section));
  * ```
  *
  * @exampleResponse Querying referenced table with count
  * ```json
  * [
  *   {
  *     "id": "693694e7-d993-4360-a6d7-6294e325d9b6",
  *     "name": "strings",
  *     "instruments": [
  *       {
  *         "count": 4
  *       }
  *     ]
  *   }
  * ]
  * ```
  *
  * @exampleDescription Querying with count option
  * You can get the number of rows by using the
  * [count](/docs/reference/javascript/select#parameters) option.
  *
  * @example Querying with count option
  * ```ts
  * const { count, error } = await supabase
  *   .from('characters')
  *   .select('*', { count: 'exact', head: true })
  * ```
  *
  * @exampleSql Querying with count option
  * ```sql
  * create table
  *   characters (id int8 primary key, name text);
  *
  * insert into
  *   characters (id, name)
  * values
  *   (1, 'Luke'),
  *   (2, 'Leia'),
  *   (3, 'Han');
  * ```
  *
  * @exampleResponse Querying with count option
  * ```json
  * {
  *   "count": 3,
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  *
  * @exampleDescription Querying JSON data
  * You can select and filter data inside of
  * [JSON](/docs/guides/database/json) columns. Postgres offers some
  * [operators](/docs/guides/database/json#query-the-jsonb-data) for
  * querying JSON data.
  *
  * @example Querying JSON data
  * ```ts
  * const { data, error } = await supabase
  *   .from('users')
  *   .select(`
  *     id, name,
  *     address->city
  *   `)
  * ```
  *
  * @exampleSql Querying JSON data
  * ```sql
  * create table
  *   users (
  *     id int8 primary key,
  *     name text,
  *     address jsonb
  *   );
  *
  * insert into
  *   users (id, name, address)
  * values
  *   (1, 'Frodo', '{"city":"Hobbiton"}');
  * ```
  *
  * @exampleResponse Querying JSON data
  * ```json
  * {
  *   "data": [
  *     {
  *       "id": 1,
  *       "name": "Frodo",
  *       "city": "Hobbiton"
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  *
  * @exampleDescription Querying referenced table with inner join
  * If you don't want to return the referenced table contents, you can leave the parenthesis empty.
  * Like `.select('name, orchestral_sections!inner()')`.
  *
  * @example Querying referenced table with inner join
  * ```ts
  * const { data, error } = await supabase
  *   .from('instruments')
  *   .select('name, orchestral_sections!inner(name)')
  *   .eq('orchestral_sections.name', 'woodwinds')
  *   .limit(1)
  * ```
  *
  * @exampleSql Querying referenced table with inner join
  * ```sql
  * create table orchestral_sections (
  *   "id" "uuid" primary key default "extensions"."uuid_generate_v4"() not null,
  *   "name" text
  * );
  *
  * create table instruments (
  *   "id" "uuid" primary key default "extensions"."uuid_generate_v4"() not null,
  *   "name" text,
  *   "section_id" "uuid" references public.orchestral_sections on delete cascade
  * );
  *
  * with section as (
  *   insert into orchestral_sections (name)
  *   values ('woodwinds') returning id
  * )
  * insert into instruments (name, section_id) values
  * ('flute', (select id from section)),
  * ('clarinet', (select id from section)),
  * ('bassoon', (select id from section)),
  * ('piccolo', (select id from section));
  * ```
  *
  * @exampleResponse Querying referenced table with inner join
  * ```json
  * {
  *   "data": [
  *     {
  *       "name": "flute",
  *       "orchestral_sections": {"name": "woodwinds"}
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  *
  * @exampleDescription Switching schemas per query
  * In addition to setting the schema during initialization, you can also switch schemas on a per-query basis.
  * Make sure you've set up your [database privileges and API settings](/docs/guides/api/using-custom-schemas).
  *
  * @example Switching schemas per query
  * ```ts
  * const { data, error } = await supabase
  *   .schema('myschema')
  *   .from('mytable')
  *   .select()
  * ```
  *
  * @exampleSql Switching schemas per query
  * ```sql
  * create schema myschema;
  *
  * create table myschema.mytable (
  *   id uuid primary key default gen_random_uuid(),
  *   data text
  * );
  *
  * insert into myschema.mytable (data) values ('mydata');
  * ```
  *
  * @exampleResponse Switching schemas per query
  * ```json
  * {
  *   "data": [
  *     {
  *       "id": "4162e008-27b0-4c0f-82dc-ccaeee9a624d",
  *       "data": "mydata"
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  */
  select(t, e) {
    const { head: r = !1, count: s } = e ?? {}, n = r ? "HEAD" : "GET";
    let i = !1;
    const a = (t ?? "*").split("").map((o) => /\s/.test(o) && !i ? "" : (o === '"' && (i = !i), o)).join(""), { url: l, headers: h } = this.cloneRequestState();
    return l.searchParams.set("select", a), s && h.append("Prefer", `count=${s}`), new Ne({
      method: n,
      url: l,
      headers: h,
      schema: this.schema,
      fetch: this.fetch,
      urlLengthLimit: this.urlLengthLimit,
      retry: this.retry
    });
  }
  /**
  * Perform an INSERT into the table or view.
  *
  * By default, inserted rows are not returned. To return it, chain the call
  * with `.select()`.
  *
  * @param values - The values to insert. Pass an object to insert a single row
  * or an array to insert multiple rows.
  *
  * @param options - Named parameters
  *
  * @param options.count - Count algorithm to use to count inserted rows.
  *
  * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
  * hood.
  *
  * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
  * statistics under the hood.
  *
  * `"estimated"`: Uses exact count for low numbers and planned count for high
  * numbers.
  *
  * @param options.defaultToNull - Make missing fields default to `null`.
  * Otherwise, use the default value for the column. Only applies for bulk
  * inserts.
  *
  * @category Database
  *
  * @example Create a record
  * ```ts
  * const { error } = await supabase
  *   .from('countries')
  *   .insert({ id: 1, name: 'Mordor' })
  * ```
  *
  * @exampleSql Create a record
  * ```sql
  * create table
  *   countries (id int8 primary key, name text);
  * ```
  *
  * @exampleResponse Create a record
  * ```json
  * {
  *   "status": 201,
  *   "statusText": ""
  * }
  * ```
  *
  * @exampleDescription Handling errors
  * `error.hint` from Postgres often contains the actionable fix (e.g. `"Grant the required privileges to the current role with: GRANT INSERT ON public.countries TO anon;"` for a `42501` permission-denied error). Log the full `error` object so it isn't hidden behind `error.message`.
  *
  * @example Handling errors
  * ```js
  * const { error } = await supabase.from('countries').insert({ id: 1, name: 'Mordor' })
  * if (error) console.error(error)
  * ```
  *
  * @example Create a record and return it
  * ```ts
  * const { data, error } = await supabase
  *   .from('countries')
  *   .insert({ id: 1, name: 'Mordor' })
  *   .select()
  * ```
  *
  * @exampleSql Create a record and return it
  * ```sql
  * create table
  *   countries (id int8 primary key, name text);
  * ```
  *
  * @exampleResponse Create a record and return it
  * ```json
  * {
  *   "data": [
  *     {
  *       "id": 1,
  *       "name": "Mordor"
  *     }
  *   ],
  *   "status": 201,
  *   "statusText": ""
  * }
  * ```
  *
  * @exampleDescription Bulk create
  * A bulk create operation is handled in a single transaction.
  * If any of the inserts fail, none of the rows are inserted.
  *
  * @example Bulk create
  * ```ts
  * const { error } = await supabase
  *   .from('countries')
  *   .insert([
  *     { id: 1, name: 'Mordor' },
  *     { id: 1, name: 'The Shire' },
  *   ])
  * ```
  *
  * @exampleSql Bulk create
  * ```sql
  * create table
  *   countries (id int8 primary key, name text);
  * ```
  *
  * @exampleResponse Bulk create
  * ```json
  * {
  *   "error": {
  *     "code": "23505",
  *     "details": "Key (id)=(1) already exists.",
  *     "hint": null,
  *     "message": "duplicate key value violates unique constraint \"countries_pkey\""
  *   },
  *   "status": 409,
  *   "statusText": ""
  * }
  * ```
  */
  insert(t, { count: e, defaultToNull: r = !0 } = {}) {
    var s;
    const n = "POST", { url: i, headers: a } = this.cloneRequestState();
    if (e && a.append("Prefer", `count=${e}`), r || a.append("Prefer", "missing=default"), Array.isArray(t)) {
      const l = t.reduce((h, o) => h.concat(Object.keys(o)), []);
      if (l.length > 0) {
        const h = [...new Set(l)].map((o) => `"${o}"`);
        i.searchParams.set("columns", h.join(","));
      }
    }
    return new Ne({
      method: n,
      url: i,
      headers: a,
      schema: this.schema,
      body: t,
      fetch: (s = this.fetch) !== null && s !== void 0 ? s : fetch,
      urlLengthLimit: this.urlLengthLimit,
      retry: this.retry
    });
  }
  /**
  * Perform an UPSERT on the table or view. Depending on the column(s) passed
  * to `onConflict`, `.upsert()` allows you to perform the equivalent of
  * `.insert()` if a row with the corresponding `onConflict` columns doesn't
  * exist, or if it does exist, perform an alternative action depending on
  * `ignoreDuplicates`.
  *
  * By default, upserted rows are not returned. To return it, chain the call
  * with `.select()`.
  *
  * @param values - The values to upsert with. Pass an object to upsert a
  * single row or an array to upsert multiple rows.
  *
  * @param options - Named parameters
  *
  * @param options.onConflict - Comma-separated UNIQUE column(s) to specify how
  * duplicate rows are determined. Two rows are duplicates if all the
  * `onConflict` columns are equal.
  *
  * @param options.ignoreDuplicates - If `true`, duplicate rows are ignored. If
  * `false`, duplicate rows are merged with existing rows.
  *
  * @param options.count - Count algorithm to use to count upserted rows.
  *
  * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
  * hood.
  *
  * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
  * statistics under the hood.
  *
  * `"estimated"`: Uses exact count for low numbers and planned count for high
  * numbers.
  *
  * @param options.defaultToNull - Make missing fields default to `null`.
  * Otherwise, use the default value for the column. This only applies when
  * inserting new rows, not when merging with existing rows under
  * `ignoreDuplicates: false`. This also only applies when doing bulk upserts.
  *
  * @example Upsert a single row using a unique key
  * ```ts
  * // Upserting a single row, overwriting based on the 'username' unique column
  * const { data, error } = await supabase
  *   .from('users')
  *   .upsert({ username: 'supabot' }, { onConflict: 'username' })
  *
  * // Example response:
  * // {
  * //   data: [
  * //     { id: 4, message: 'bar', username: 'supabot' }
  * //   ],
  * //   error: null
  * // }
  * ```
  *
  * @example Upsert with conflict resolution and exact row counting
  * ```ts
  * // Upserting and returning exact count
  * const { data, error, count } = await supabase
  *   .from('users')
  *   .upsert(
  *     {
  *       id: 3,
  *       message: 'foo',
  *       username: 'supabot'
  *     },
  *     {
  *       onConflict: 'username',
  *       count: 'exact'
  *     }
  *   )
  *
  * // Example response:
  * // {
  * //   data: [
  * //     {
  * //       id: 42,
  * //       handle: "saoirse",
  * //       display_name: "Saoirse"
  * //     }
  * //   ],
  * //   count: 1,
  * //   error: null
  * // }
  * ```
  *
  * @category Database
  *
  * @remarks
  * - Primary keys must be included in `values` to use upsert.
  *
  * @example Upsert your data
  * ```ts
  * const { data, error } = await supabase
  *   .from('instruments')
  *   .upsert({ id: 1, name: 'piano' })
  *   .select()
  * ```
  *
  * @exampleSql Upsert your data
  * ```sql
  * create table
  *   instruments (id int8 primary key, name text);
  *
  * insert into
  *   instruments (id, name)
  * values
  *   (1, 'harpsichord');
  * ```
  *
  * @exampleResponse Upsert your data
  * ```json
  * {
  *   "data": [
  *     {
  *       "id": 1,
  *       "name": "piano"
  *     }
  *   ],
  *   "status": 201,
  *   "statusText": ""
  * }
  * ```
  *
  * @exampleDescription Handling errors
  * `error.hint` from Postgres often contains the actionable fix (e.g. `"Grant the required privileges to the current role with: GRANT INSERT, UPDATE ON public.instruments TO anon;"` for a `42501` permission-denied error). Log the full `error` object so it isn't hidden behind `error.message`.
  *
  * @example Handling errors
  * ```js
  * const { data, error } = await supabase.from('instruments').upsert({ id: 1, name: 'piano' }).select()
  * if (error) console.error(error)
  * ```
  *
  * @example Bulk Upsert your data
  * ```ts
  * const { data, error } = await supabase
  *   .from('instruments')
  *   .upsert([
  *     { id: 1, name: 'piano' },
  *     { id: 2, name: 'harp' },
  *   ])
  *   .select()
  * ```
  *
  * @exampleSql Bulk Upsert your data
  * ```sql
  * create table
  *   instruments (id int8 primary key, name text);
  *
  * insert into
  *   instruments (id, name)
  * values
  *   (1, 'harpsichord');
  * ```
  *
  * @exampleResponse Bulk Upsert your data
  * ```json
  * {
  *   "data": [
  *     {
  *       "id": 1,
  *       "name": "piano"
  *     },
  *     {
  *       "id": 2,
  *       "name": "harp"
  *     }
  *   ],
  *   "status": 201,
  *   "statusText": ""
  * }
  * ```
  *
  * @exampleDescription Upserting into tables with constraints
  * In the following query, `upsert()` implicitly uses the `id`
  * (primary key) column to determine conflicts. If there is no existing
  * row with the same `id`, `upsert()` inserts a new row, which
  * will fail in this case as there is already a row with `handle` `"saoirse"`.
  * Using the `onConflict` option, you can instruct `upsert()` to use
  * another column with a unique constraint to determine conflicts.
  *
  * @example Upserting into tables with constraints
  * ```ts
  * const { data, error } = await supabase
  *   .from('users')
  *   .upsert({ id: 42, handle: 'saoirse', display_name: 'Saoirse' })
  *   .select()
  * ```
  *
  * @exampleSql Upserting into tables with constraints
  * ```sql
  * create table
  *   users (
  *     id int8 generated by default as identity primary key,
  *     handle text not null unique,
  *     display_name text
  *   );
  *
  * insert into
  *   users (id, handle, display_name)
  * values
  *   (1, 'saoirse', null);
  * ```
  *
  * @exampleResponse Upserting into tables with constraints
  * ```json
  * {
  *   "error": {
  *     "code": "23505",
  *     "details": "Key (handle)=(saoirse) already exists.",
  *     "hint": null,
  *     "message": "duplicate key value violates unique constraint \"users_handle_key\""
  *   },
  *   "status": 409,
  *   "statusText": ""
  * }
  * ```
  */
  upsert(t, { onConflict: e, ignoreDuplicates: r = !1, count: s, defaultToNull: n = !0 } = {}) {
    var i;
    const a = "POST", { url: l, headers: h } = this.cloneRequestState();
    if (h.append("Prefer", `resolution=${r ? "ignore" : "merge"}-duplicates`), e !== void 0 && l.searchParams.set("on_conflict", e), s && h.append("Prefer", `count=${s}`), n || h.append("Prefer", "missing=default"), Array.isArray(t)) {
      const o = t.reduce((c, u) => c.concat(Object.keys(u)), []);
      if (o.length > 0) {
        const c = [...new Set(o)].map((u) => `"${u}"`);
        l.searchParams.set("columns", c.join(","));
      }
    }
    return new Ne({
      method: a,
      url: l,
      headers: h,
      schema: this.schema,
      body: t,
      fetch: (i = this.fetch) !== null && i !== void 0 ? i : fetch,
      urlLengthLimit: this.urlLengthLimit,
      retry: this.retry
    });
  }
  /**
  * Perform an UPDATE on the table or view.
  *
  * By default, updated rows are not returned. To return it, chain the call
  * with `.select()` after filters.
  *
  * @param values - The values to update with
  *
  * @param options - Named parameters
  *
  * @param options.count - Count algorithm to use to count updated rows.
  *
  * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
  * hood.
  *
  * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
  * statistics under the hood.
  *
  * `"estimated"`: Uses exact count for low numbers and planned count for high
  * numbers.
  *
  * @category Database
  *
  * @remarks
  * - `update()` should always be combined with [Filters](/docs/reference/javascript/using-filters) to target the item(s) you wish to update.
  *
  * @example Updating your data
  * ```ts
  * const { error } = await supabase
  *   .from('instruments')
  *   .update({ name: 'piano' })
  *   .eq('id', 1)
  * ```
  *
  * @exampleSql Updating your data
  * ```sql
  * create table
  *   instruments (id int8 primary key, name text);
  *
  * insert into
  *   instruments (id, name)
  * values
  *   (1, 'harpsichord');
  * ```
  *
  * @exampleResponse Updating your data
  * ```json
  * {
  *   "status": 204,
  *   "statusText": ""
  * }
  * ```
  *
  * @exampleDescription Handling errors
  * `error.hint` from Postgres often contains the actionable fix (e.g. `"Grant the required privileges to the current role with: GRANT UPDATE ON public.instruments TO anon;"` for a `42501` permission-denied error). Log the full `error` object so it isn't hidden behind `error.message`.
  *
  * @example Handling errors
  * ```js
  * const { error } = await supabase.from('instruments').update({ name: 'piano' }).eq('id', 1)
  * if (error) console.error(error)
  * ```
  *
  * @example Update a record and return it
  * ```ts
  * const { data, error } = await supabase
  *   .from('instruments')
  *   .update({ name: 'piano' })
  *   .eq('id', 1)
  *   .select()
  * ```
  *
  * @exampleSql Update a record and return it
  * ```sql
  * create table
  *   instruments (id int8 primary key, name text);
  *
  * insert into
  *   instruments (id, name)
  * values
  *   (1, 'harpsichord');
  * ```
  *
  * @exampleResponse Update a record and return it
  * ```json
  * {
  *   "data": [
  *     {
  *       "id": 1,
  *       "name": "piano"
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  *
  * @exampleDescription Updating JSON data
  * Postgres offers some
  * [operators](/docs/guides/database/json#query-the-jsonb-data) for
  * working with JSON data. Currently, it is only possible to update the entire JSON document.
  *
  * @example Updating JSON data
  * ```ts
  * const { data, error } = await supabase
  *   .from('users')
  *   .update({
  *     address: {
  *       street: 'Melrose Place',
  *       postcode: 90210
  *     }
  *   })
  *   .eq('address->postcode', 90210)
  *   .select()
  * ```
  *
  * @exampleSql Updating JSON data
  * ```sql
  * create table
  *   users (
  *     id int8 primary key,
  *     name text,
  *     address jsonb
  *   );
  *
  * insert into
  *   users (id, name, address)
  * values
  *   (1, 'Michael', '{ "postcode": 90210 }');
  * ```
  *
  * @exampleResponse Updating JSON data
  * ```json
  * {
  *   "data": [
  *     {
  *       "id": 1,
  *       "name": "Michael",
  *       "address": {
  *         "street": "Melrose Place",
  *         "postcode": 90210
  *       }
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  */
  update(t, { count: e } = {}) {
    var r;
    const s = "PATCH", { url: n, headers: i } = this.cloneRequestState();
    return e && i.append("Prefer", `count=${e}`), new Ne({
      method: s,
      url: n,
      headers: i,
      schema: this.schema,
      body: t,
      fetch: (r = this.fetch) !== null && r !== void 0 ? r : fetch,
      urlLengthLimit: this.urlLengthLimit,
      retry: this.retry
    });
  }
  /**
  * Perform a DELETE on the table or view.
  *
  * By default, deleted rows are not returned. To return it, chain the call
  * with `.select()` after filters.
  *
  * @param options - Named parameters
  *
  * @param options.count - Count algorithm to use to count deleted rows.
  *
  * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
  * hood.
  *
  * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
  * statistics under the hood.
  *
  * `"estimated"`: Uses exact count for low numbers and planned count for high
  * numbers.
  *
  * @category Database
  *
  * @remarks
  * - `delete()` should always be combined with [filters](/docs/reference/javascript/using-filters) to target the item(s) you wish to delete.
  * - If you use `delete()` with filters and you have
  *   [RLS](/docs/learn/auth-deep-dive/auth-row-level-security) enabled, only
  *   rows visible through `SELECT` policies are deleted. Note that by default
  *   no rows are visible, so you need at least one `SELECT`/`ALL` policy that
  *   makes the rows visible.
  * - When using `delete().in()`, specify an array of values to target multiple rows with a single query. This is particularly useful for batch deleting entries that share common criteria, such as deleting users by their IDs. Ensure that the array you provide accurately represents all records you intend to delete to avoid unintended data removal.
  *
  * @example Delete a single record
  * ```ts
  * const response = await supabase
  *   .from('countries')
  *   .delete()
  *   .eq('id', 1)
  * ```
  *
  * @exampleSql Delete a single record
  * ```sql
  * create table
  *   countries (id int8 primary key, name text);
  *
  * insert into
  *   countries (id, name)
  * values
  *   (1, 'Mordor');
  * ```
  *
  * @exampleResponse Delete a single record
  * ```json
  * {
  *   "status": 204,
  *   "statusText": ""
  * }
  * ```
  *
  * @exampleDescription Handling errors
  * `error.hint` from Postgres often contains the actionable fix (e.g. `"Grant the required privileges to the current role with: GRANT DELETE ON public.countries TO anon;"` for a `42501` permission-denied error). Log the full `error` object so it isn't hidden behind `error.message`.
  *
  * @example Handling errors
  * ```js
  * const { error } = await supabase.from('countries').delete().eq('id', 1)
  * if (error) console.error(error)
  * ```
  *
  * @example Delete a record and return it
  * ```ts
  * const { data, error } = await supabase
  *   .from('countries')
  *   .delete()
  *   .eq('id', 1)
  *   .select()
  * ```
  *
  * @exampleSql Delete a record and return it
  * ```sql
  * create table
  *   countries (id int8 primary key, name text);
  *
  * insert into
  *   countries (id, name)
  * values
  *   (1, 'Mordor');
  * ```
  *
  * @exampleResponse Delete a record and return it
  * ```json
  * {
  *   "data": [
  *     {
  *       "id": 1,
  *       "name": "Mordor"
  *     }
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  *
  * @example Delete multiple records
  * ```ts
  * const response = await supabase
  *   .from('countries')
  *   .delete()
  *   .in('id', [1, 2, 3])
  * ```
  *
  * @exampleSql Delete multiple records
  * ```sql
  * create table
  *   countries (id int8 primary key, name text);
  *
  * insert into
  *   countries (id, name)
  * values
  *   (1, 'Rohan'), (2, 'The Shire'), (3, 'Mordor');
  * ```
  *
  * @exampleResponse Delete multiple records
  * ```json
  * {
  *   "status": 204,
  *   "statusText": ""
  * }
  * ```
  */
  delete({ count: t } = {}) {
    var e;
    const r = "DELETE", { url: s, headers: n } = this.cloneRequestState();
    return t && n.append("Prefer", `count=${t}`), new Ne({
      method: r,
      url: s,
      headers: n,
      schema: this.schema,
      fetch: (e = this.fetch) !== null && e !== void 0 ? e : fetch,
      urlLengthLimit: this.urlLengthLimit,
      retry: this.retry
    });
  }
};
function In(t, e) {
  try {
    const a = JSON.parse(t);
    if (a && typeof a == "object" && !Array.isArray(a)) {
      var r, s, n, i;
      return new Be({
        message: String((r = a.message) !== null && r !== void 0 ? r : t),
        details: (s = a.details) !== null && s !== void 0 ? s : "",
        hint: (n = a.hint) !== null && n !== void 0 ? n : "",
        code: (i = a.code) !== null && i !== void 0 ? i : ""
      });
    }
  } catch {
  }
  return new Be({
    message: t || e,
    details: "",
    hint: "",
    code: ""
  });
}
function Lr(t, e, r) {
  var s;
  const n = t;
  return {
    success: !1,
    error: new Be({
      message: `${(s = n?.name) !== null && s !== void 0 ? s : "FetchError"}: ${n?.message}`,
      details: "",
      hint: "",
      code: ""
    }),
    data: null,
    count: null,
    status: e,
    statusText: r
  };
}
var $n = class js {
  /**
  * Creates a PostgREST client.
  *
  * @param url - URL of the PostgREST endpoint
  * @param options - Named parameters
  * @param options.headers - Custom headers
  * @param options.schema - Postgres schema to switch to
  * @param options.fetch - Custom fetch
  * @param options.timeout - Optional timeout in milliseconds for all requests. When set, requests will automatically abort after this duration to prevent indefinite hangs.
  * @param options.urlLengthLimit - Maximum URL length in characters before warnings/errors are triggered. Defaults to 8000.
  * @param options.retry - Enable or disable automatic retries for transient errors.
  *   When enabled, idempotent requests (GET, HEAD, OPTIONS) that fail with network
  *   errors or HTTP 503/520 responses will be automatically retried up to 3 times
  *   with exponential backoff (1s, 2s, 4s). Defaults to `true`.
  * @example Using supabase-js (recommended)
  * ```ts
  * import { createClient } from '@supabase/supabase-js'
  *
  * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
  * const { data, error } = await supabase.from('profiles').select('*')
  * ```
  *
  * @category Database
  *
  * @remarks
  * - A `timeout` option (in milliseconds) can be set to automatically abort requests that take too long.
  * - A `urlLengthLimit` option (default: 8000) can be set to control when URL length warnings are included in error messages for aborted requests.
  *
  * @example Standalone import for bundle-sensitive environments
  * ```ts
  * import { PostgrestClient } from '@supabase/postgrest-js'
  *
  * const postgrest = new PostgrestClient('https://xyzcompany.supabase.co/rest/v1', {
  *   headers: { apikey: 'your-publishable-key' },
  *   schema: 'public',
  *   timeout: 30000, // 30 second timeout
  * })
  * ```
  */
  constructor(e, { headers: r = {}, schema: s, fetch: n, timeout: i, urlLengthLimit: a = 8e3, retry: l } = {}) {
    this.url = e, this.headers = new Headers(r), this.schemaName = s, this.urlLengthLimit = a;
    const h = n ?? globalThis.fetch;
    i !== void 0 && i > 0 ? this.fetch = (o, c) => {
      const u = new AbortController(), d = setTimeout(() => u.abort(), i), f = c?.signal;
      if (f) {
        if (f.aborted)
          return clearTimeout(d), h(o, c);
        const g = () => {
          clearTimeout(d), u.abort();
        };
        return f.addEventListener("abort", g, { once: !0 }), h(o, Ae(Ae({}, c), {}, { signal: u.signal })).finally(() => {
          clearTimeout(d), f.removeEventListener("abort", g);
        });
      }
      return h(o, Ae(Ae({}, c), {}, { signal: u.signal })).finally(() => clearTimeout(d));
    } : this.fetch = h, this.retry = l;
  }
  from(e) {
    if (!e || typeof e != "string" || e.trim() === "") throw new Error("Invalid relation name: relation must be a non-empty string.");
    return new Cn(new URL(`${this.url}/${e}`), {
      headers: new Headers(this.headers),
      schema: this.schemaName,
      fetch: this.fetch,
      urlLengthLimit: this.urlLengthLimit,
      retry: this.retry
    });
  }
  /**
  * Select a schema to query or perform an function (rpc) call.
  *
  * The schema needs to be on the list of exposed schemas inside Supabase.
  *
  * @param schema - The schema to query
  *
  * @category Database
  */
  schema(e) {
    return new js(this.url, {
      headers: this.headers,
      schema: e,
      fetch: this.fetch,
      urlLengthLimit: this.urlLengthLimit,
      retry: this.retry
    });
  }
  /**
  * Fetch the OpenAPI description PostgREST publishes for this client's schema.
  *
  * The document lists only the tables, views and functions the caller's role
  * holds privileges on; PostgREST applies that filtering server-side. The
  * schema is the one this client was created with, so call `.schema()` first
  * to describe a different one. Transient failures are retried according to
  * the client's `retry` option, like any other idempotent request.
  *
  * @example
  * ```ts
  * const { data, error } = await supabase.getOpenApiSpec()
  * ```
  *
  * @example Describe a schema other than the client default
  * ```ts
  * const { data, error } = await supabase.schema('billing').getOpenApiSpec()
  * ```
  *
  * @category Database
  */
  async getOpenApiSpec() {
    var e = this, r;
    const s = new Headers(e.headers);
    s.set("Accept", "application/openapi+json"), e.schemaName && s.set("Accept-Profile", e.schemaName);
    const n = {};
    s.forEach((o, c) => {
      n[c] = o;
    });
    const i = (r = e.fetch) !== null && r !== void 0 ? r : globalThis.fetch;
    let a;
    try {
      var l;
      a = await $s(i, `${e.url}/`, {
        method: "GET",
        headers: n
      }, (l = e.retry) !== null && l !== void 0 ? l : !0);
    } catch (o) {
      return Lr(o, 0, "");
    }
    let h;
    try {
      h = await a.text();
    } catch (o) {
      return Lr(o, a.status, a.statusText);
    }
    if (a.ok) try {
      return {
        success: !0,
        error: null,
        data: JSON.parse(h),
        count: null,
        status: a.status,
        statusText: a.statusText
      };
    } catch {
    }
    return {
      success: !1,
      error: In(h, a.statusText),
      data: null,
      count: null,
      status: a.status,
      statusText: a.statusText
    };
  }
  /**
  * Perform a function call.
  *
  * @param fn - The function name to call
  * @param args - The arguments to pass to the function call
  * @param options - Named parameters
  * @param options.head - When set to `true`, `data` will not be returned.
  * Useful if you only need the count.
  * @param options.get - When set to `true`, the function will be called with
  * read-only access mode.
  * @param options.count - Count algorithm to use to count rows returned by the
  * function. Only applicable for [set-returning
  * functions](https://www.postgresql.org/docs/current/functions-srf.html).
  *
  * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
  * hood.
  *
  * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
  * statistics under the hood.
  *
  * `"estimated"`: Uses exact count for low numbers and planned count for high
  * numbers.
  *
  * @example
  * ```ts
  * // For cross-schema functions where type inference fails, use overrideTypes:
  * const { data } = await supabase
  *   .schema('schema_b')
  *   .rpc('function_a', {})
  *   .overrideTypes<{ id: string; user_id: string }[]>()
  * ```
  *
  * @category Database
  *
  * @example Call a Postgres function without arguments
  * ```ts
  * const { data, error } = await supabase.rpc('hello_world')
  * ```
  *
  * @exampleSql Call a Postgres function without arguments
  * ```sql
  * create function hello_world() returns text as $$
  *   select 'Hello world';
  * $$ language sql;
  * ```
  *
  * @exampleResponse Call a Postgres function without arguments
  * ```json
  * {
  *   "data": "Hello world",
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  *
  * @example Call a Postgres function with arguments
  * ```ts
  * const { data, error } = await supabase.rpc('echo', { say: '👋' })
  * ```
  *
  * @exampleSql Call a Postgres function with arguments
  * ```sql
  * create function echo(say text) returns text as $$
  *   select say;
  * $$ language sql;
  * ```
  *
  * @exampleResponse Call a Postgres function with arguments
  * ```json
  *   {
  *     "data": "👋",
  *     "status": 200,
  *     "statusText": "OK"
  *   }
  *
  * ```
  *
  * @exampleDescription Bulk processing
  * You can process large payloads by passing in an array as an argument.
  *
  * @example Bulk processing
  * ```ts
  * const { data, error } = await supabase.rpc('add_one_each', { arr: [1, 2, 3] })
  * ```
  *
  * @exampleSql Bulk processing
  * ```sql
  * create function add_one_each(arr int[]) returns int[] as $$
  *   select array_agg(n + 1) from unnest(arr) as n;
  * $$ language sql;
  * ```
  *
  * @exampleResponse Bulk processing
  * ```json
  * {
  *   "data": [
  *     2,
  *     3,
  *     4
  *   ],
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  *
  * @exampleDescription Call a Postgres function with filters
  * Postgres functions that return tables can also be combined with [Filters](/docs/reference/javascript/using-filters) and [Modifiers](/docs/reference/javascript/using-modifiers).
  *
  * @example Call a Postgres function with filters
  * ```ts
  * const { data, error } = await supabase
  *   .rpc('list_stored_countries')
  *   .eq('id', 1)
  *   .single()
  * ```
  *
  * @exampleSql Call a Postgres function with filters
  * ```sql
  * create table
  *   countries (id int8 primary key, name text);
  *
  * insert into
  *   countries (id, name)
  * values
  *   (1, 'Rohan'),
  *   (2, 'The Shire');
  *
  * create function list_stored_countries() returns setof countries as $$
  *   select * from countries;
  * $$ language sql;
  * ```
  *
  * @exampleResponse Call a Postgres function with filters
  * ```json
  * {
  *   "data": {
  *     "id": 1,
  *     "name": "Rohan"
  *   },
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  *
  * @example Call a read-only Postgres function
  * ```ts
  * const { data, error } = await supabase.rpc('hello_world', undefined, { get: true })
  * ```
  *
  * @exampleSql Call a read-only Postgres function
  * ```sql
  * create function hello_world() returns text as $$
  *   select 'Hello world';
  * $$ language sql;
  * ```
  *
  * @exampleResponse Call a read-only Postgres function
  * ```json
  * {
  *   "data": "Hello world",
  *   "status": 200,
  *   "statusText": "OK"
  * }
  * ```
  */
  rpc(e, r = {}, { head: s = !1, get: n = !1, count: i } = {}) {
    var a;
    let l;
    const h = new URL(`${this.url}/rpc/${e}`);
    let o;
    const c = (f) => f !== null && typeof f == "object" && (!Array.isArray(f) || f.some(c)), u = s && Object.values(r).some(c);
    u ? (l = "POST", o = r) : s || n ? (l = s ? "HEAD" : "GET", Object.entries(r).filter(([f, g]) => g !== void 0).map(([f, g]) => [f, Array.isArray(g) ? `{${g.join(",")}}` : `${g}`]).forEach(([f, g]) => {
      h.searchParams.append(f, g);
    })) : (l = "POST", o = r);
    const d = new Headers(this.headers);
    return u ? d.set("Prefer", i ? `count=${i},return=minimal` : "return=minimal") : i && d.set("Prefer", `count=${i}`), new Ne({
      method: l,
      url: h,
      headers: d,
      schema: this.schemaName,
      body: o,
      fetch: (a = this.fetch) !== null && a !== void 0 ? a : fetch,
      urlLengthLimit: this.urlLengthLimit,
      retry: this.retry
    });
  }
};
class jn {
  /**
   * Static-only utility – prevent instantiation.
   */
  constructor() {
  }
  static detectEnvironment() {
    var e;
    if (typeof WebSocket < "u")
      return { type: "native", wsConstructor: WebSocket };
    const r = globalThis;
    if (typeof globalThis < "u" && typeof r.WebSocket < "u")
      return { type: "native", wsConstructor: r.WebSocket };
    const s = typeof global < "u" ? global : void 0;
    if (s && typeof s.WebSocket < "u")
      return { type: "native", wsConstructor: s.WebSocket };
    if (typeof globalThis < "u" && typeof r.WebSocketPair < "u" && typeof globalThis.WebSocket > "u")
      return {
        type: "cloudflare",
        error: "Cloudflare Workers detected. WebSocket clients are not supported in Cloudflare Workers.",
        workaround: "Use Cloudflare Workers WebSocket API for server-side WebSocket handling, or deploy to a different runtime."
      };
    if (typeof globalThis < "u" && r.EdgeRuntime || typeof navigator < "u" && (!((e = navigator.userAgent) === null || e === void 0) && e.includes("Vercel-Edge")))
      return {
        type: "unsupported",
        error: "Edge runtime detected (Vercel Edge/Netlify Edge). WebSockets are not supported in edge functions.",
        workaround: "Use serverless functions or a different deployment target for WebSocket functionality."
      };
    const n = globalThis.process;
    if (n) {
      const i = n.versions;
      if (i && i.node)
        return {
          type: "unsupported",
          error: "Node.js detected but native WebSocket not found.",
          workaround: "Ensure you are running Node.js 22+ or provide a WebSocket implementation via the transport option."
        };
    }
    return {
      type: "unsupported",
      error: "Unknown JavaScript runtime without WebSocket support.",
      workaround: "Ensure you're running in a supported environment (browser, Node.js, Deno) or provide a custom WebSocket implementation."
    };
  }
  /**
   * Returns the best available WebSocket constructor for the current runtime.
   *
   * @category Realtime
   *
   * @example Example with error handling
   * ```ts
   * try {
   *   const WS = WebSocketFactory.getWebSocketConstructor()
   *   const socket = new WS('wss://example.com/socket')
   * } catch (error) {
   *   console.error('WebSocket not available in this environment.', error)
   * }
   * ```
   */
  static getWebSocketConstructor() {
    const e = this.detectEnvironment();
    if (e.wsConstructor)
      return e.wsConstructor;
    let r = e.error || "WebSocket not supported in this environment.";
    throw e.workaround && (r += `

Suggested solution: ${e.workaround}`), new Error(r);
  }
  /**
   * Detects whether the runtime can establish WebSocket connections.
   *
   * @category Realtime
   *
   * @example Example in a Node.js script
   * ```ts
   * if (!WebSocketFactory.isWebSocketSupported()) {
   *   console.error('WebSockets are required for this script.')
   *   process.exitCode = 1
   * }
   * ```
   */
  static isWebSocketSupported() {
    try {
      return this.detectEnvironment().type === "native";
    } catch {
      return !1;
    }
  }
}
const Ln = "2.117.3", Nn = `realtime-js/${Ln}`, Dn = "1.0.0", Ls = "2.0.0", Fn = Ls, Bn = 1e4, Un = 15e3, Hn = 1e4, qn = 100, we = {
  closed: "closed",
  errored: "errored",
  joined: "joined",
  joining: "joining",
  leaving: "leaving"
}, Ns = {
  close: "phx_close",
  error: "phx_error",
  join: "phx_join",
  leave: "phx_leave",
  access_token: "access_token"
}, ur = {
  connecting: "connecting",
  closing: "closing",
  closed: "closed"
};
class Wn {
  constructor(e) {
    this.HEADER_LENGTH = 1, this.USER_BROADCAST_PUSH_META_LENGTH = 6, this.KINDS = { userBroadcastPush: 3, userBroadcast: 4 }, this.BINARY_ENCODING = 0, this.JSON_ENCODING = 1, this.BROADCAST_EVENT = "broadcast", this.allowedMetadataKeys = [], this.allowedMetadataKeys = e ?? [];
  }
  encode(e, r) {
    if (e.event === this.BROADCAST_EVENT && !(e.payload instanceof ArrayBuffer) && typeof e.payload.event == "string")
      return r(this._binaryEncodeUserBroadcastPush(e));
    let s = [e.join_ref, e.ref, e.topic, e.event, e.payload];
    return r(JSON.stringify(s));
  }
  _binaryEncodeUserBroadcastPush(e) {
    var r;
    return this._isArrayBuffer((r = e.payload) === null || r === void 0 ? void 0 : r.payload) ? this._encodeBinaryUserBroadcastPush(e) : this._encodeJsonUserBroadcastPush(e);
  }
  _encodeBinaryUserBroadcastPush(e) {
    var r, s;
    const n = (s = (r = e.payload) === null || r === void 0 ? void 0 : r.payload) !== null && s !== void 0 ? s : new ArrayBuffer(0);
    return this._encodeUserBroadcastPush(e, this.BINARY_ENCODING, n);
  }
  _encodeJsonUserBroadcastPush(e) {
    var r, s;
    const n = (s = (r = e.payload) === null || r === void 0 ? void 0 : r.payload) !== null && s !== void 0 ? s : {}, a = new TextEncoder().encode(JSON.stringify(n)).buffer;
    return this._encodeUserBroadcastPush(e, this.JSON_ENCODING, a);
  }
  _encodeUserBroadcastPush(e, r, s) {
    var n, i;
    const a = new TextEncoder(), l = a.encode(e.topic), h = a.encode((n = e.ref) !== null && n !== void 0 ? n : ""), o = a.encode((i = e.join_ref) !== null && i !== void 0 ? i : ""), c = a.encode(e.payload.event), u = this.allowedMetadataKeys ? this._pick(e.payload, this.allowedMetadataKeys) : {}, d = a.encode(Object.keys(u).length === 0 ? "" : JSON.stringify(u));
    if (o.length > 255)
      throw new Error(`joinRef length ${o.length} exceeds maximum of 255`);
    if (h.length > 255)
      throw new Error(`ref length ${h.length} exceeds maximum of 255`);
    if (l.length > 255)
      throw new Error(`topic length ${l.length} exceeds maximum of 255`);
    if (c.length > 255)
      throw new Error(`userEvent length ${c.length} exceeds maximum of 255`);
    if (d.length > 255)
      throw new Error(`metadata length ${d.length} exceeds maximum of 255`);
    const f = this.USER_BROADCAST_PUSH_META_LENGTH + o.length + h.length + l.length + c.length + d.length, g = new ArrayBuffer(this.HEADER_LENGTH + f), m = new DataView(g), p = new Uint8Array(g);
    let y = 0;
    m.setUint8(y++, this.KINDS.userBroadcastPush), m.setUint8(y++, o.length), m.setUint8(y++, h.length), m.setUint8(y++, l.length), m.setUint8(y++, c.length), m.setUint8(y++, d.length), m.setUint8(y++, r), p.set(o, y), y += o.length, p.set(h, y), y += h.length, p.set(l, y), y += l.length, p.set(c, y), y += c.length, p.set(d, y), y += d.length;
    var _ = new Uint8Array(g.byteLength + s.byteLength);
    return _.set(new Uint8Array(g), 0), _.set(new Uint8Array(s), g.byteLength), _.buffer;
  }
  decode(e, r) {
    if (this._isArrayBuffer(e)) {
      let s = this._binaryDecode(e);
      return r(s);
    }
    if (typeof e == "string") {
      const s = JSON.parse(e), [n, i, a, l, h] = s;
      return r({ join_ref: n, ref: i, topic: a, event: l, payload: h });
    }
    return r({});
  }
  _binaryDecode(e) {
    const r = new DataView(e), s = r.getUint8(0), n = new TextDecoder();
    if (s === this.KINDS.userBroadcast)
      return this._decodeUserBroadcast(e, r, n);
  }
  _decodeUserBroadcast(e, r, s) {
    const n = r.getUint8(1), i = r.getUint8(2), a = r.getUint8(3), l = r.getUint8(4);
    let h = this.HEADER_LENGTH + 4;
    const o = s.decode(e.slice(h, h + n));
    h = h + n;
    const c = s.decode(e.slice(h, h + i));
    h = h + i;
    const u = s.decode(e.slice(h, h + a));
    h = h + a;
    const d = e.slice(h, e.byteLength), f = l === this.JSON_ENCODING ? JSON.parse(s.decode(d)) : d, g = {
      type: this.BROADCAST_EVENT,
      event: c,
      payload: f
    };
    return a > 0 && (g.meta = JSON.parse(u)), { join_ref: null, ref: null, topic: o, event: this.BROADCAST_EVENT, payload: g };
  }
  _isArrayBuffer(e) {
    var r;
    return e instanceof ArrayBuffer || ((r = e?.constructor) === null || r === void 0 ? void 0 : r.name) === "ArrayBuffer";
  }
  _pick(e, r) {
    return !e || typeof e != "object" ? {} : Object.fromEntries(Object.entries(e).filter(([s]) => r.includes(s)));
  }
}
var F;
(function(t) {
  t.abstime = "abstime", t.bool = "bool", t.date = "date", t.daterange = "daterange", t.float4 = "float4", t.float8 = "float8", t.int2 = "int2", t.int4 = "int4", t.int4range = "int4range", t.int8 = "int8", t.int8range = "int8range", t.json = "json", t.jsonb = "jsonb", t.money = "money", t.numeric = "numeric", t.oid = "oid", t.reltime = "reltime", t.text = "text", t.time = "time", t.timestamp = "timestamp", t.timestamptz = "timestamptz", t.timetz = "timetz", t.tsrange = "tsrange", t.tstzrange = "tstzrange";
})(F || (F = {}));
const Nr = (t, e, r = {}) => {
  var s;
  const n = (s = r.skipTypes) !== null && s !== void 0 ? s : [];
  return e ? Object.keys(e).reduce((i, a) => (i[a] = Kn(a, t, e, n), i), {}) : {};
}, Kn = (t, e, r, s) => {
  const n = e.find((l) => l.name === t), i = n?.type, a = r[t];
  return i && !s.includes(i) ? Ds(i, a) : dr(a);
}, Ds = (t, e) => {
  if (t.charAt(0) === "_") {
    const r = t.slice(1, t.length);
    return Jn(e, r);
  }
  switch (t) {
    case F.bool:
      return Vn(e);
    case F.float4:
    case F.float8:
    case F.int2:
    case F.int4:
    case F.int8:
    case F.numeric:
    case F.oid:
      return zn(e);
    case F.json:
    case F.jsonb:
      return Gn(e);
    case F.timestamp:
      return Yn(e);
    // Format to be consistent with PostgREST
    case F.abstime:
    // To allow users to cast it based on Timezone
    case F.date:
    // To allow users to cast it based on Timezone
    case F.daterange:
    case F.int4range:
    case F.int8range:
    case F.money:
    case F.reltime:
    // To allow users to cast it based on Timezone
    case F.text:
    case F.time:
    // To allow users to cast it based on Timezone
    case F.timestamptz:
    // To allow users to cast it based on Timezone
    case F.timetz:
    // To allow users to cast it based on Timezone
    case F.tsrange:
    case F.tstzrange:
      return dr(e);
    default:
      return dr(e);
  }
}, dr = (t) => t, Vn = (t) => {
  switch (t) {
    case "t":
      return !0;
    case "f":
      return !1;
    default:
      return t;
  }
}, zn = (t) => {
  if (typeof t == "string") {
    const e = parseFloat(t);
    if (!Number.isNaN(e))
      return e;
  }
  return t;
}, Gn = (t) => {
  if (typeof t == "string")
    try {
      return JSON.parse(t);
    } catch {
      return t;
    }
  return t;
}, Jn = (t, e) => {
  if (typeof t != "string")
    return t;
  const r = t.length - 1, s = t[r];
  if (t[0] === "{" && s === "}") {
    let i;
    const a = t.slice(1, r);
    try {
      i = JSON.parse("[" + a + "]");
    } catch {
      i = a ? a.split(",") : [];
    }
    return i.map((l) => Ds(e, l));
  }
  return t;
}, Yn = (t) => typeof t == "string" ? t.replace(" ", "T") : t, Fs = (t) => {
  const e = new URL(t);
  return e.protocol = e.protocol.replace(/^ws/i, "http"), e.pathname = e.pathname.replace(/\/+$/, "").replace(/\/socket\/websocket$/i, "").replace(/\/socket$/i, "").replace(/\/websocket$/i, ""), e.pathname === "" || e.pathname === "/" ? e.pathname = "/api/broadcast" : e.pathname = e.pathname + "/api/broadcast", e.href;
};
var Ue = (t) => typeof t == "function" ? (
  /** @type {() => T} */
  t
) : function() {
  return t;
}, Xn = typeof self < "u" ? self : null, De = typeof window < "u" ? window : null, le = Xn || De || globalThis, Qn = "2.0.0", Zn = 1e4, ei = 1e3, ti = 100, ce = (
  /** @type {const} */
  { connecting: 0, open: 1, closing: 2, closed: 3 }
), Q = (
  /** @type {const} */
  {
    closed: "closed",
    errored: "errored",
    joined: "joined",
    joining: "joining",
    leaving: "leaving"
  }
), fe = (
  /** @type {const} */
  {
    close: "phx_close",
    error: "phx_error",
    join: "phx_join",
    reply: "phx_reply",
    leave: "phx_leave"
  }
), fr = (
  /** @type {const} */
  {
    longpoll: "longpoll",
    websocket: "websocket"
  }
), ri = (
  /** @type {const} */
  {
    complete: 4
  }
), pr = "base64url.bearer.phx.", ut = class {
  /**
   * Initializes the Push
   * @param {Channel} channel - The Channel
   * @param {ChannelEvent} event - The event, for example `"phx_join"`
   * @param {() => Record<string, unknown>} payload - The payload, for example `{user_id: 123}`
   * @param {number} timeout - The push timeout in milliseconds
   */
  constructor(t, e, r, s) {
    this.channel = t, this.event = e, this.payload = r || function() {
      return {};
    }, this.receivedResp = null, this.timeout = s, this.timeoutTimer = null, this.recHooks = [], this.sent = !1, this.ref = void 0;
  }
  /**
   *
   * @param {number} timeout
   */
  resend(t) {
    this.timeout = t, this.reset(), this.send();
  }
  /**
   *
   */
  send() {
    this.hasReceived("timeout") || (this.startTimeout(), this.sent = !0, this.channel.socket.push({
      topic: this.channel.topic,
      event: this.event,
      payload: this.payload(),
      ref: this.ref,
      join_ref: this.channel.joinRef()
    }));
  }
  /**
   *
   * @param {string} status
   * @param {(response: any) => void} callback
   */
  receive(t, e) {
    return this.hasReceived(t) && e(this.receivedResp.response), this.recHooks.push({ status: t, callback: e }), this;
  }
  reset() {
    this.cancelRefEvent(), this.ref = null, this.refEvent = null, this.receivedResp = null, this.sent = !1;
  }
  destroy() {
    this.cancelRefEvent(), this.cancelTimeout();
  }
  /**
   * @private
   */
  matchReceive({ status: t, response: e, _ref: r }) {
    this.recHooks.filter((s) => s.status === t).forEach((s) => s.callback(e));
  }
  /**
   * @private
   */
  cancelRefEvent() {
    this.refEvent && this.channel.off(this.refEvent);
  }
  cancelTimeout() {
    clearTimeout(this.timeoutTimer), this.timeoutTimer = null;
  }
  startTimeout() {
    this.timeoutTimer && this.cancelTimeout(), this.ref = this.channel.socket.makeRef(), this.refEvent = this.channel.replyEventName(this.ref), this.channel.on(this.refEvent, (t) => {
      this.cancelRefEvent(), this.cancelTimeout(), this.receivedResp = t, this.matchReceive(t);
    }), this.timeoutTimer = setTimeout(() => {
      this.trigger("timeout", {});
    }, this.timeout);
  }
  /**
   * @private
   */
  hasReceived(t) {
    return this.receivedResp && this.receivedResp.status === t;
  }
  trigger(t, e) {
    this.channel.trigger(this.refEvent, { status: t, response: e });
  }
}, Bs = class {
  /**
  * @param {() => void} callback
  * @param {(tries: number) => number} timerCalc
  */
  constructor(t, e) {
    this.callback = t, this.timerCalc = e, this.timer = void 0, this.tries = 0;
  }
  reset() {
    this.tries = 0, clearTimeout(this.timer);
  }
  /**
   * Cancels any previous scheduleTimeout and schedules callback
   */
  scheduleTimeout() {
    clearTimeout(this.timer), this.timer = setTimeout(() => {
      this.tries = this.tries + 1, this.callback();
    }, this.timerCalc(this.tries + 1));
  }
}, si = class {
  /**
   * @param {string} topic
   * @param {Params | (() => Params)} params
   * @param {Socket} socket
   */
  constructor(t, e, r) {
    this.state = Q.closed, this.topic = t, this.params = Ue(e || {}), this.socket = r, this.bindings = [], this.bindingRef = 0, this.timeout = this.socket.timeout, this.joinedOnce = !1, this.joinPush = new ut(this, fe.join, this.params, this.timeout), this.pushBuffer = [], this.stateChangeRefs = [], this.rejoinTimer = new Bs(() => {
      this.socket.isConnected() && this.rejoin();
    }, this.socket.rejoinAfterMs), this.stateChangeRefs.push(this.socket.onError(() => this.rejoinTimer.reset())), this.stateChangeRefs.push(
      this.socket.onOpen(() => {
        this.rejoinTimer.reset(), this.isErrored() && this.rejoin();
      })
    ), this.joinPush.receive("ok", () => {
      this.state = Q.joined, this.rejoinTimer.reset(), this.pushBuffer.forEach((s) => s.send()), this.pushBuffer = [];
    }), this.joinPush.receive("error", (s) => {
      this.state = Q.errored, this.socket.hasLogger() && this.socket.log("channel", `error ${this.topic}`, s), this.socket.isConnected() && this.rejoinTimer.scheduleTimeout();
    }), this.onClose(() => {
      this.rejoinTimer.reset(), this.socket.hasLogger() && this.socket.log("channel", `close ${this.topic}`), this.state = Q.closed, this.socket.remove(this);
    }), this.onError((s) => {
      this.socket.hasLogger() && this.socket.log("channel", `error ${this.topic}`, s), this.isJoining() && this.joinPush.reset(), this.state = Q.errored, this.socket.isConnected() && this.rejoinTimer.scheduleTimeout();
    }), this.joinPush.receive("timeout", () => {
      this.socket.hasLogger() && this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout), new ut(this, fe.leave, Ue({}), this.timeout).send(), this.state = Q.errored, this.joinPush.reset(), this.socket.isConnected() && this.rejoinTimer.scheduleTimeout();
    }), this.on(fe.reply, (s, n) => {
      this.trigger(this.replyEventName(n), s);
    });
  }
  /**
   * Join the channel
   * @param {number} timeout
   * @returns {Push}
   */
  join(t = this.timeout) {
    if (this.joinedOnce)
      throw new Error("tried to join multiple times. 'join' can only be called a single time per channel instance");
    return this.timeout = t, this.joinedOnce = !0, this.rejoin(), this.joinPush;
  }
  /**
   * Teardown the channel.
   *
   * Destroys and stops related timers.
   */
  teardown() {
    this.pushBuffer.forEach((t) => t.destroy()), this.pushBuffer = [], this.rejoinTimer.reset(), this.joinPush.destroy(), this.state = Q.closed, this.bindings = [];
  }
  /**
   * Hook into channel close
   * @param {ChannelBindingCallback} callback
   */
  onClose(t) {
    this.on(fe.close, t);
  }
  /**
   * Hook into channel errors
   * @param {ChannelOnErrorCallback} callback
   * @return {number}
   */
  onError(t) {
    return this.on(fe.error, (e) => t(e));
  }
  /**
   * Subscribes on channel events
   *
   * Subscription returns a ref counter, which can be used later to
   * unsubscribe the exact event listener
   *
   * @example
   * const ref1 = channel.on("event", do_stuff)
   * const ref2 = channel.on("event", do_other_stuff)
   * channel.off("event", ref1)
   * // Since unsubscription, do_stuff won't fire,
   * // while do_other_stuff will keep firing on the "event"
   *
   * @param {string} event
   * @param {ChannelBindingCallback} callback
   * @returns {number} ref
   */
  on(t, e) {
    let r = this.bindingRef++;
    return this.bindings.push({ event: t, ref: r, callback: e }), r;
  }
  /**
   * Unsubscribes off of channel events
   *
   * Use the ref returned from a channel.on() to unsubscribe one
   * handler, or pass nothing for the ref to unsubscribe all
   * handlers for the given event.
   *
   * @example
   * // Unsubscribe the do_stuff handler
   * const ref1 = channel.on("event", do_stuff)
   * channel.off("event", ref1)
   *
   * // Unsubscribe all handlers from event
   * channel.off("event")
   *
   * @param {string} event
   * @param {number} [ref]
   */
  off(t, e) {
    this.bindings = this.bindings.filter((r) => !(r.event === t && (typeof e > "u" || e === r.ref)));
  }
  /**
   * @private
   */
  canPush() {
    return this.socket.isConnected() && this.isJoined();
  }
  /**
   * Sends a message `event` to phoenix with the payload `payload`.
   * Phoenix receives this in the `handle_in(event, payload, socket)`
   * function. if phoenix replies or it times out (default 10000ms),
   * then optionally the reply can be received.
   *
   * @example
   * channel.push("event")
   *   .receive("ok", payload => console.log("phoenix replied:", payload))
   *   .receive("error", err => console.log("phoenix errored", err))
   *   .receive("timeout", () => console.log("timed out pushing"))
   * @param {string} event
   * @param {Object} payload
   * @param {number} [timeout]
   * @returns {Push}
   */
  push(t, e, r = this.timeout) {
    if (e = e || {}, !this.joinedOnce)
      throw new Error(`tried to push '${t}' to '${this.topic}' before joining. Use channel.join() before pushing events`);
    let s = new ut(this, t, function() {
      return e;
    }, r);
    return this.canPush() ? s.send() : (s.startTimeout(), this.pushBuffer.push(s)), s;
  }
  /** Leaves the channel
   *
   * Unsubscribes from server events, and
   * instructs channel to terminate on server
   *
   * Triggers onClose() hooks
   *
   * To receive leave acknowledgements, use the `receive`
   * hook to bind to the server ack, ie:
   *
   * @example
   * channel.leave().receive("ok", () => alert("left!") )
   *
   * @param {number} timeout
   * @returns {Push}
   */
  leave(t = this.timeout) {
    this.rejoinTimer.reset(), this.joinPush.cancelTimeout(), this.state = Q.leaving;
    let e = () => {
      this.socket.hasLogger() && this.socket.log("channel", `leave ${this.topic}`), this.trigger(fe.close, "leave");
    }, r = new ut(this, fe.leave, Ue({}), t);
    return r.receive("ok", () => e()).receive("timeout", () => e()), r.send(), this.canPush() || r.trigger("ok", {}), r;
  }
  /**
   * Overridable message hook
   *
   * Receives all events for specialized message handling
   * before dispatching to the channel callbacks.
   *
   * Must return the payload, modified or unmodified
   * @type{ChannelOnMessage}
   */
  onMessage(t, e, r) {
    return e;
  }
  /**
   * Overridable filter hook
   *
   * If this function returns `true`, `binding`'s callback will be called.
   *
   * @type{ChannelFilterBindings}
   */
  filterBindings(t, e, r) {
    return !0;
  }
  isMember(t, e, r, s) {
    return this.topic !== t ? !1 : s && s !== this.joinRef() ? (this.socket.hasLogger() && this.socket.log("channel", "dropping outdated message", { topic: t, event: e, payload: r, joinRef: s }), !1) : !0;
  }
  joinRef() {
    return this.joinPush.ref;
  }
  /**
   * @private
   */
  rejoin(t = this.timeout) {
    this.isLeaving() || (this.socket.leaveOpenTopic(this.topic), this.state = Q.joining, this.joinPush.resend(t));
  }
  /**
   * @param {string} event
   * @param {unknown} [payload]
   * @param {?string} [ref]
   * @param {?string} [joinRef]
   */
  trigger(t, e, r, s) {
    let n = this.onMessage(t, e, r, s);
    if (e && !n)
      throw new Error("channel onMessage callbacks must return the payload, modified or unmodified");
    let i = this.bindings.filter((a) => a.event === t && this.filterBindings(a, e, r));
    for (let a = 0; a < i.length; a++)
      i[a].callback(n, r, s || this.joinRef());
  }
  /**
  * @param {string} ref
  */
  replyEventName(t) {
    return `chan_reply_${t}`;
  }
  isClosed() {
    return this.state === Q.closed;
  }
  isErrored() {
    return this.state === Q.errored;
  }
  isJoined() {
    return this.state === Q.joined;
  }
  isJoining() {
    return this.state === Q.joining;
  }
  isLeaving() {
    return this.state === Q.leaving;
  }
}, Mt = class {
  static request(t, e, r, s, n, i, a) {
    if (le.XDomainRequest) {
      let l = new le.XDomainRequest();
      return this.xdomainRequest(l, t, e, s, n, i, a);
    } else if (le.XMLHttpRequest) {
      let l = new le.XMLHttpRequest();
      return this.xhrRequest(l, t, e, r, s, n, i, a);
    } else {
      if (le.fetch && le.AbortController)
        return this.fetchRequest(t, e, r, s, n, i, a);
      throw new Error("No suitable XMLHttpRequest implementation found");
    }
  }
  static fetchRequest(t, e, r, s, n, i, a) {
    let l = {
      method: t,
      headers: r,
      body: s
    }, h = null;
    return n && (h = new AbortController(), setTimeout(() => h.abort(), n), l.signal = h.signal), le.fetch(e, l).then((o) => o.text()).then((o) => this.parseJSON(o)).then((o) => a && a(o)).catch((o) => {
      o.name === "AbortError" && i ? i() : a && a(null);
    }), h;
  }
  static xdomainRequest(t, e, r, s, n, i, a) {
    return t.timeout = n, t.open(e, r), t.onload = () => {
      let l = this.parseJSON(t.responseText);
      a && a(l);
    }, i && (t.ontimeout = i), t.onprogress = () => {
    }, t.send(s), t;
  }
  static xhrRequest(t, e, r, s, n, i, a, l) {
    t.open(e, r, !0), t.timeout = i;
    for (let [h, o] of Object.entries(s))
      t.setRequestHeader(h, o);
    return t.onerror = () => l && l(null), t.onreadystatechange = () => {
      if (t.readyState === ri.complete && l) {
        let h = this.parseJSON(t.responseText);
        l(h);
      }
    }, a && (t.ontimeout = a), t.send(n), t;
  }
  static parseJSON(t) {
    if (!t || t === "")
      return null;
    try {
      return JSON.parse(t);
    } catch {
      return console && console.log("failed to parse JSON response", t), null;
    }
  }
  static serialize(t, e) {
    let r = [];
    for (var s in t) {
      if (!Object.prototype.hasOwnProperty.call(t, s))
        continue;
      let n = e ? `${e}[${s}]` : s, i = t[s];
      typeof i == "object" ? r.push(this.serialize(i, n)) : r.push(encodeURIComponent(n) + "=" + encodeURIComponent(i));
    }
    return r.join("&");
  }
  static appendParams(t, e) {
    if (Object.keys(e).length === 0)
      return t;
    let r = t.match(/\?/) ? "&" : "?";
    return `${t}${r}${this.serialize(e)}`;
  }
}, ni = (t) => {
  let e = "", r = new Uint8Array(t), s = r.byteLength;
  for (let n = 0; n < s; n++)
    e += String.fromCharCode(r[n]);
  return btoa(e);
}, Ce = class {
  constructor(t, e) {
    e && e.length === 2 && e[1].startsWith(pr) && (this.authToken = atob(e[1].slice(pr.length))), this.endPoint = null, this.token = null, this.skipHeartbeat = !0, this.reqs = /* @__PURE__ */ new Set(), this.awaitingBatchAck = !1, this.currentBatch = null, this.currentBatchTimer = null, this.batchBuffer = [], this.onopen = function() {
    }, this.onerror = function() {
    }, this.onmessage = function() {
    }, this.onclose = function() {
    }, this.pollEndpoint = this.normalizeEndpoint(t), this.readyState = ce.connecting, setTimeout(() => this.poll(), 0);
  }
  normalizeEndpoint(t) {
    return t.replace("ws://", "http://").replace("wss://", "https://").replace(new RegExp("(.*)/" + fr.websocket), "$1/" + fr.longpoll);
  }
  endpointURL() {
    return Mt.appendParams(this.pollEndpoint, { token: this.token });
  }
  closeAndRetry(t, e, r) {
    this.close(t, e, r), this.readyState = ce.connecting;
  }
  ontimeout() {
    this.onerror("timeout"), this.closeAndRetry(1005, "timeout", !1);
  }
  isActive() {
    return this.readyState === ce.open || this.readyState === ce.connecting;
  }
  poll() {
    const t = { Accept: "application/json" };
    this.authToken && (t["X-Phoenix-AuthToken"] = this.authToken), this.ajax("GET", t, null, () => this.ontimeout(), (e) => {
      if (e) {
        var { status: r, token: s, messages: n } = e;
        if (r === 410 && this.token !== null) {
          this.onerror(410), this.closeAndRetry(3410, "session_gone", !1);
          return;
        }
        this.token = s;
      } else
        r = 0;
      switch (r) {
        case 200:
          n.forEach((i) => {
            setTimeout(() => this.onmessage({ data: i }), 0);
          }), this.poll();
          break;
        case 204:
          this.poll();
          break;
        case 410:
          this.readyState = ce.open, this.onopen({}), this.poll();
          break;
        case 403:
          this.onerror(403), this.close(1008, "forbidden", !1);
          break;
        case 0:
        case 500:
          this.onerror(500), this.closeAndRetry(1011, "internal server error", 500);
          break;
        default:
          throw new Error(`unhandled poll status ${r}`);
      }
    });
  }
  // we collect all pushes within the current event loop by
  // setTimeout 0, which optimizes back-to-back procedural
  // pushes against an empty buffer
  send(t) {
    typeof t != "string" && (t = ni(t)), this.currentBatch ? this.currentBatch.push(t) : this.awaitingBatchAck ? this.batchBuffer.push(t) : (this.currentBatch = [t], this.currentBatchTimer = setTimeout(() => {
      this.batchSend(this.currentBatch), this.currentBatch = null;
    }, 0));
  }
  batchSend(t, e = 0) {
    this.awaitingBatchAck = !0;
    const r = e + ti, s = t.slice(e, r);
    this.ajax("POST", { "Content-Type": "application/x-ndjson" }, s.join(`
`), () => this.onerror("timeout"), (n) => {
      !n || n.status !== 200 ? (this.awaitingBatchAck = !1, this.onerror(n && n.status), this.closeAndRetry(1011, "internal server error", !1)) : r < t.length ? this.batchSend(t, r) : this.batchBuffer.length > 0 ? (this.batchSend(this.batchBuffer), this.batchBuffer = []) : this.awaitingBatchAck = !1;
    });
  }
  close(t, e, r) {
    for (let n of this.reqs)
      n.abort();
    this.readyState = ce.closed;
    let s = Object.assign({ code: 1e3, reason: void 0, wasClean: !0 }, { code: t, reason: e, wasClean: r });
    this.batchBuffer = [], clearTimeout(this.currentBatchTimer), this.currentBatchTimer = null, typeof CloseEvent < "u" ? this.onclose(new CloseEvent("close", s)) : this.onclose(s);
  }
  ajax(t, e, r, s, n) {
    let i, a = () => {
      this.reqs.delete(i), s();
    };
    i = Mt.request(t, this.endpointURL(), e, r, this.timeout, a, (l) => {
      this.reqs.delete(i), this.isActive() && n(l);
    }), this.reqs.add(i);
  }
}, ii = class Xe {
  /**
   * Initializes the Presence
   * @param {Channel} channel - The Channel
   * @param {PresenceOptions} [opts] - The options, for example `{events: {state: "state", diff: "diff"}}`
   */
  constructor(e, r = {}) {
    let s = r.events || /** @type {PresenceEvents} */
    { state: "presence_state", diff: "presence_diff" };
    this.state = /* @__PURE__ */ Object.create(null), this.pendingDiffs = [], this.channel = e, this.joinRef = null, this.caller = {
      onJoin: function() {
      },
      onLeave: function() {
      },
      onSync: function() {
      }
    }, this.channel.on(s.state, (n) => {
      let { onJoin: i, onLeave: a, onSync: l } = this.caller;
      this.joinRef = this.channel.joinRef(), this.state = Xe.syncState(this.state, n, i, a), this.pendingDiffs.forEach((h) => {
        this.state = Xe.syncDiff(this.state, h, i, a);
      }), this.pendingDiffs = [], l();
    }), this.channel.on(s.diff, (n) => {
      let { onJoin: i, onLeave: a, onSync: l } = this.caller;
      this.inPendingSyncState() ? this.pendingDiffs.push(n) : (this.state = Xe.syncDiff(this.state, n, i, a), l());
    });
  }
  /**
   * @param {PresenceOnJoin} callback
   */
  onJoin(e) {
    this.caller.onJoin = e;
  }
  /**
   * @param {PresenceOnLeave} callback
   */
  onLeave(e) {
    this.caller.onLeave = e;
  }
  /**
   * @param {PresenceOnSync} callback
   */
  onSync(e) {
    this.caller.onSync = e;
  }
  /**
   * Returns the array of presences, with selected metadata.
   *
   * @template [T=PresenceState]
   * @param {((key: string, obj: PresenceState) => T)} [by]
   *
   * @returns {T[]}
   */
  list(e) {
    return Xe.list(this.state, e);
  }
  inPendingSyncState() {
    return !this.joinRef || this.joinRef !== this.channel.joinRef();
  }
  // lower-level public static API
  /**
   * Used to sync the list of presences on the server
   * with the client's state. An optional `onJoin` and `onLeave` callback can
   * be provided to react to changes in the client's local presences across
   * disconnects and reconnects with the server.
   *
   * @param {Record<string, PresenceState>} currentState
   * @param {Record<string, PresenceState>} newState
   * @param {PresenceOnJoin} onJoin
   * @param {PresenceOnLeave} onLeave
   *
   * @returns {Record<string, PresenceState>}
   */
  static syncState(e, r, s, n) {
    let i = this.toNullProtoObj(this.clone(e));
    r = this.toNullProtoObj(r);
    let a = /* @__PURE__ */ Object.create(null), l = /* @__PURE__ */ Object.create(null);
    return this.map(i, (h, o) => {
      r[h] || (l[h] = o);
    }), this.map(r, (h, o) => {
      let c = i[h];
      if (c) {
        let u = o.metas.map((m) => m.phx_ref), d = c.metas.map((m) => m.phx_ref), f = o.metas.filter((m) => d.indexOf(m.phx_ref) < 0), g = c.metas.filter((m) => u.indexOf(m.phx_ref) < 0);
        f.length > 0 && (a[h] = o, a[h].metas = f), g.length > 0 && (l[h] = this.clone(c), l[h].metas = g);
      } else
        a[h] = o;
    }), this.syncDiff(i, { joins: a, leaves: l }, s, n);
  }
  /**
   *
   * Used to sync a diff of presence join and leave
   * events from the server, as they happen. Like `syncState`, `syncDiff`
   * accepts optional `onJoin` and `onLeave` callbacks to react to a user
   * joining or leaving from a device.
   *
   * @param {Record<string, PresenceState>} state
   * @param {PresenceDiff} diff
   * @param {PresenceOnJoin} onJoin
   * @param {PresenceOnLeave} onLeave
   *
   * @returns {Record<string, PresenceState>}
   */
  static syncDiff(e, r, s, n) {
    e = this.toNullProtoObj(e);
    let { joins: i, leaves: a } = this.clone(r);
    return s || (s = function() {
    }), n || (n = function() {
    }), this.map(i, (l, h) => {
      let o = e[l];
      if (e[l] = this.clone(h), o) {
        let c = e[l].metas.map((d) => d.phx_ref), u = o.metas.filter((d) => c.indexOf(d.phx_ref) < 0);
        e[l].metas.unshift(...u);
      }
      s(l, o, h);
    }), this.map(a, (l, h) => {
      let o = e[l];
      if (!o)
        return;
      let c = h.metas.map((u) => u.phx_ref);
      o.metas = o.metas.filter((u) => c.indexOf(u.phx_ref) < 0), n(l, o, h), o.metas.length === 0 && delete e[l];
    }), e;
  }
  /**
   * Returns the array of presences, with selected metadata.
   *
   * @template [T=PresenceState]
   * @param {Record<string, PresenceState>} presences
   * @param {((key: string, obj: PresenceState) => T)} [chooser]
   *
   * @returns {T[]}
   */
  static list(e, r) {
    return r || (r = function(s, n) {
      return n;
    }), this.map(e, (s, n) => r(s, n));
  }
  // private
  /**
  * @template T
  * @param {Record<string, PresenceState>} obj
  * @param {(key: string, obj: PresenceState) => T} func
  */
  static map(e, r) {
    return Object.getOwnPropertyNames(e).map((s) => r(s, e[s]));
  }
  // Presence keys are chosen on the server and may collide with
  // Object.prototype properties ("__proto__", "constructor", ...), so any
  // object indexed by presence key must not have a prototype chain
  //
  // TODO: replace the null-prototype objects with Maps in Phoenix 2.0
  // (breaking change for the lower-level static API)
  static toNullProtoObj(e) {
    if (Object.getPrototypeOf(e) === null)
      return e;
    let r = /* @__PURE__ */ Object.create(null);
    return Object.getOwnPropertyNames(e).forEach((s) => {
      r[s] = e[s];
    }), r;
  }
  /**
  * @template T
  * @param {T} obj
  * @returns {T}
  */
  static clone(e) {
    return JSON.parse(JSON.stringify(e));
  }
}, dt = {
  HEADER_LENGTH: 1,
  META_LENGTH: 4,
  KINDS: { push: 0, reply: 1, broadcast: 2 },
  /**
  * @template T
  * @param {Message<Record<string, any>>} msg
  * @param {(msg: ArrayBuffer | string) => T} callback
  * @returns {T}
  */
  encode(t, e) {
    if (t.payload.constructor === ArrayBuffer)
      return e(this.binaryEncode(t));
    {
      let r = [t.join_ref, t.ref, t.topic, t.event, t.payload];
      return e(JSON.stringify(r));
    }
  },
  /**
  * @template T
  * @param {ArrayBuffer | string} rawPayload
  * @param {(msg: Message<unknown>) => T} callback
  * @returns {T}
  */
  decode(t, e) {
    if (t.constructor === ArrayBuffer)
      return e(this.binaryDecode(t));
    {
      let [r, s, n, i, a] = JSON.parse(t);
      return e({ join_ref: r, ref: s, topic: n, event: i, payload: a });
    }
  },
  /** @private */
  binaryEncode(t) {
    let { join_ref: e, ref: r, event: s, topic: n, payload: i } = t, a = new TextEncoder(), l = a.encode(e), h = a.encode(r), o = a.encode(n), c = a.encode(s);
    this.assertFieldSize(l.byteLength, "join_ref"), this.assertFieldSize(h.byteLength, "ref"), this.assertFieldSize(o.byteLength, "topic"), this.assertFieldSize(c.byteLength, "event");
    let u = this.META_LENGTH + l.byteLength + h.byteLength + o.byteLength + c.byteLength, d = new ArrayBuffer(this.HEADER_LENGTH + u), f = new Uint8Array(d), g = new DataView(d), m = 0;
    g.setUint8(m++, this.KINDS.push), g.setUint8(m++, l.byteLength), g.setUint8(m++, h.byteLength), g.setUint8(m++, o.byteLength), g.setUint8(m++, c.byteLength), f.set(l, m), m += l.byteLength, f.set(h, m), m += h.byteLength, f.set(o, m), m += o.byteLength, f.set(c, m), m += c.byteLength;
    var p = new Uint8Array(d.byteLength + i.byteLength);
    return p.set(f, 0), p.set(new Uint8Array(i), d.byteLength), p.buffer;
  },
  assertFieldSize(t, e) {
    if (t > 255)
      throw new Error(`unable to convert ${e} to binary: must be less than or equal to 255 bytes, but is ${t} bytes`);
  },
  /**
  * @private
  */
  binaryDecode(t) {
    let e = new DataView(t), r = e.getUint8(0), s = new TextDecoder();
    switch (r) {
      case this.KINDS.push:
        return this.decodePush(t, e, s);
      case this.KINDS.reply:
        return this.decodeReply(t, e, s);
      case this.KINDS.broadcast:
        return this.decodeBroadcast(t, e, s);
    }
  },
  /** @private */
  decodePush(t, e, r) {
    let s = e.getUint8(1), n = e.getUint8(2), i = e.getUint8(3), a = this.HEADER_LENGTH + this.META_LENGTH - 1, l = r.decode(t.slice(a, a + s));
    a = a + s;
    let h = r.decode(t.slice(a, a + n));
    a = a + n;
    let o = r.decode(t.slice(a, a + i));
    a = a + i;
    let c = t.slice(a, t.byteLength);
    return { join_ref: l, ref: null, topic: h, event: o, payload: c };
  },
  /** @private */
  decodeReply(t, e, r) {
    let s = e.getUint8(1), n = e.getUint8(2), i = e.getUint8(3), a = e.getUint8(4), l = this.HEADER_LENGTH + this.META_LENGTH, h = r.decode(t.slice(l, l + s));
    l = l + s;
    let o = r.decode(t.slice(l, l + n));
    l = l + n;
    let c = r.decode(t.slice(l, l + i));
    l = l + i;
    let u = r.decode(t.slice(l, l + a));
    l = l + a;
    let d = t.slice(l, t.byteLength), f = { status: u, response: d };
    return { join_ref: h, ref: o, topic: c, event: fe.reply, payload: f };
  },
  /** @private */
  decodeBroadcast(t, e, r) {
    let s = e.getUint8(1), n = e.getUint8(2), i = this.HEADER_LENGTH + 2, a = r.decode(t.slice(i, i + s));
    i = i + s;
    let l = r.decode(t.slice(i, i + n));
    i = i + n;
    let h = t.slice(i, t.byteLength);
    return { join_ref: null, ref: null, topic: a, event: l, payload: h };
  }
}, ai = class {
  /** Initializes the Socket *
   *
   * For IE8 support use an ES5-shim (https://github.com/es-shims/es5-shim)
   *
   * @constructor
   * @param {string} endPoint - The string WebSocket endpoint, ie, `"ws://example.com/socket"`,
   *                                               `"wss://example.com"`
   *                                               `"/socket"` (inherited host & protocol)
   * @param {SocketOptions} [opts] - Optional configuration
   */
  constructor(t, e = {}) {
    this.stateChangeCallbacks = { open: [], close: [], error: [], message: [] }, this.channels = [], this.sendBuffer = [], this.ref = 0, this.fallbackRef = null, this.timeout = e.timeout || Zn, this.transport = e.transport || le.WebSocket || Ce, this.conn = void 0, this.primaryPassedHealthCheck = !1, this.longPollFallbackMs = e.longPollFallbackMs, this.fallbackTimer = null;
    let r = null;
    try {
      r = le && le.sessionStorage;
    } catch {
    }
    this.sessionStore = e.sessionStorage || r, this.establishedConnections = 0, this.defaultEncoder = dt.encode.bind(dt), this.defaultDecoder = dt.decode.bind(dt), this.closeWasClean = !0, this.disconnecting = !1, this.binaryType = e.binaryType || "arraybuffer", this.connectClock = 1, this.pageHidden = !1, this.encode = void 0, this.decode = void 0, this.transport !== Ce ? (this.encode = e.encode || this.defaultEncoder, this.decode = e.decode || this.defaultDecoder) : (this.encode = this.defaultEncoder, this.decode = this.defaultDecoder);
    let s = null;
    De && De.addEventListener && (De.addEventListener("pagehide", (n) => {
      this.conn && (this.disconnect(), s = this.connectClock);
    }), De.addEventListener("pageshow", (n) => {
      s === this.connectClock && (s = null, this.connect());
    }), De.addEventListener("visibilitychange", () => {
      document.visibilityState === "hidden" ? this.pageHidden = !0 : (this.pageHidden = !1, !this.isConnected() && !this.closeWasClean && this.teardown(() => this.connect()));
    })), this.heartbeatIntervalMs = e.heartbeatIntervalMs || 3e4, this.autoSendHeartbeat = e.autoSendHeartbeat ?? !0, this.heartbeatCallback = e.heartbeatCallback ?? (() => {
    }), this.rejoinAfterMs = (n) => e.rejoinAfterMs ? e.rejoinAfterMs(n) : [1e3, 2e3, 5e3][n - 1] || 1e4, this.reconnectAfterMs = (n) => e.reconnectAfterMs ? e.reconnectAfterMs(n) : [10, 50, 100, 150, 200, 250, 500, 1e3, 2e3][n - 1] || 5e3, this.logger = e.logger || null, !this.logger && e.debug && (this.logger = (n, i, a) => {
      console.log(`${n}: ${i}`, a);
    }), this.longpollerTimeout = e.longpollerTimeout || 2e4, this.params = Ue(e.params || {}), this.endPoint = `${t}/${fr.websocket}`, this.vsn = e.vsn || Qn, this.heartbeatTimeoutTimer = null, this.heartbeatTimer = null, this.heartbeatSentAt = null, this.pendingHeartbeatRef = null, this.reconnectTimer = new Bs(() => {
      if (this.pageHidden) {
        this.log("Not reconnecting as page is hidden!"), this.teardown();
        return;
      }
      this.teardown(async () => {
        e.beforeReconnect && await e.beforeReconnect(), this.connect();
      });
    }, this.reconnectAfterMs), this.authToken = e.authToken && Ue(e.authToken);
  }
  /**
   * Returns the LongPoll transport reference
   */
  getLongPollTransport() {
    return Ce;
  }
  /**
   * Disconnects and replaces the active transport
   *
   * @param {SocketTransport} newTransport - The new transport class to instantiate
   *
   */
  replaceTransport(t) {
    this.connectClock++, this.closeWasClean = !0, clearTimeout(this.fallbackTimer), this.reconnectTimer.reset(), this.conn && (this.conn.close(), this.conn = null), this.transport = t;
  }
  /**
   * Returns the socket protocol
   *
   * @returns {"wss" | "ws"}
   */
  protocol() {
    return location.protocol.match(/^https/) ? "wss" : "ws";
  }
  /**
   * The fully qualified socket url
   *
   * @returns {string}
   */
  endPointURL() {
    let t = Mt.appendParams(
      Mt.appendParams(this.endPoint, this.params()),
      { vsn: this.vsn }
    );
    return t.charAt(0) !== "/" ? t : t.charAt(1) === "/" ? `${this.protocol()}:${t}` : `${this.protocol()}://${location.host}${t}`;
  }
  /**
   * Disconnects the socket
   *
   * See https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes for valid status codes.
   *
   * @param {() => void} [callback] - Optional callback which is called after socket is disconnected.
   * @param {number} [code] - A status code for disconnection (Optional).
   * @param {string} [reason] - A textual description of the reason to disconnect. (Optional)
   */
  disconnect(t, e, r) {
    this.connectClock++, this.disconnecting = !0, this.closeWasClean = !0, clearTimeout(this.fallbackTimer), this.reconnectTimer.reset(), this.teardown(() => {
      this.disconnecting = !1, t && t();
    }, e, r);
  }
  /**
   * @param {Params} [params] - [DEPRECATED] The params to send when connecting, for example `{user_id: userToken}`
   *
   * Passing params to connect is deprecated; pass them in the Socket constructor instead:
   * `new Socket("/socket", {params: {user_id: userToken}})`.
   */
  connect(t) {
    t && (console && console.log("passing params to connect is deprecated. Instead pass :params to the Socket constructor"), this.params = Ue(t)), !(this.conn && !this.disconnecting) && (this.longPollFallbackMs && this.transport !== Ce ? this.connectWithFallback(Ce, this.longPollFallbackMs) : this.transportConnect());
  }
  /**
   * Logs the message. Override `this.logger` for specialized logging. noops by default
   * @param {string} kind
   * @param {string} msg
   * @param {Object} data
   */
  log(t, e, r) {
    this.logger && this.logger(t, e, r);
  }
  /**
   * Returns true if a logger has been set on this socket.
   */
  hasLogger() {
    return this.logger !== null;
  }
  /**
   * Registers callbacks for connection open events
   *
   * @example socket.onOpen(function(){ console.info("the socket was opened") })
   *
   * @param {SocketOnOpen} callback
   */
  onOpen(t) {
    let e = this.makeRef();
    return this.stateChangeCallbacks.open.push([e, t]), e;
  }
  /**
   * Registers callbacks for connection close events
   * @param {SocketOnClose} callback
   * @returns {string}
   */
  onClose(t) {
    let e = this.makeRef();
    return this.stateChangeCallbacks.close.push([e, t]), e;
  }
  /**
   * Registers callbacks for connection error events
   *
   * @example socket.onError(function(error){ alert("An error occurred") })
   *
   * @param {SocketOnError} callback
   * @returns {string}
   */
  onError(t) {
    let e = this.makeRef();
    return this.stateChangeCallbacks.error.push([e, t]), e;
  }
  /**
   * Registers callbacks for connection message events
   * @param {SocketOnMessage} callback
   * @returns {string}
   */
  onMessage(t) {
    let e = this.makeRef();
    return this.stateChangeCallbacks.message.push([e, t]), e;
  }
  /**
   * Sets a callback that receives lifecycle events for internal heartbeat messages.
   * Useful for instrumenting connection health (e.g. sent/ok/timeout/disconnected).
   * @param {HeartbeatCallback} callback
   */
  onHeartbeat(t) {
    this.heartbeatCallback = t;
  }
  /**
   * Pings the server and invokes the callback with the RTT in milliseconds
   * @param {(timeDelta: number) => void} callback
   *
   * Returns true if the ping was pushed or false if unable to be pushed.
   */
  ping(t) {
    if (!this.isConnected())
      return !1;
    let e = this.makeRef(), r = Date.now();
    this.push({ topic: "phoenix", event: "heartbeat", payload: {}, ref: e });
    let s = this.onMessage((n) => {
      n.ref === e && (this.off([s]), t(Date.now() - r));
    });
    return !0;
  }
  /**
   * @private
   *
   * @param {Function}
   */
  transportName(t) {
    return t === Ce ? "LongPoll" : t.name;
  }
  /**
   * @private
   */
  transportConnect() {
    this.connectClock++, this.closeWasClean = !1;
    let t;
    this.authToken && (t = ["phoenix", `${pr}${btoa(this.authToken()).replace(/=/g, "")}`]), this.conn = new this.transport(this.endPointURL(), t), this.conn.binaryType = this.binaryType, this.conn.timeout = this.longpollerTimeout, this.conn.onopen = () => this.onConnOpen(), this.conn.onerror = (e) => this.onConnError(e), this.conn.onmessage = (e) => this.onConnMessage(e), this.conn.onclose = (e) => this.onConnClose(e);
  }
  getSession(t) {
    return this.sessionStore && this.sessionStore.getItem(t);
  }
  storeSession(t, e) {
    this.sessionStore && this.sessionStore.setItem(t, e);
  }
  connectWithFallback(t, e = 2500) {
    clearTimeout(this.fallbackTimer);
    let r = !1, s = !0, n, i, a = this.transportName(t), l = (h) => {
      this.log("transport", `falling back to ${a}...`, h), this.off([n, i]), s = !1, this.replaceTransport(t), this.transportConnect();
    };
    if (this.getSession(`phx:fallback:${a}`))
      return l("memorized");
    this.fallbackTimer = setTimeout(l, e), i = this.onError((h) => {
      this.log("transport", "error", h), s && !r && (clearTimeout(this.fallbackTimer), l(h));
    }), this.fallbackRef && this.off([this.fallbackRef]), this.fallbackRef = this.onOpen(() => {
      if (r = !0, !s) {
        let h = this.transportName(t);
        return this.primaryPassedHealthCheck || this.storeSession(`phx:fallback:${h}`, "true"), this.log("transport", `established ${h} fallback`);
      }
      clearTimeout(this.fallbackTimer), this.fallbackTimer = setTimeout(l, e), this.ping((h) => {
        this.log("transport", "connected to primary after", h), this.primaryPassedHealthCheck = !0, clearTimeout(this.fallbackTimer);
      });
    }), this.transportConnect();
  }
  clearHeartbeats() {
    clearTimeout(this.heartbeatTimer), clearTimeout(this.heartbeatTimeoutTimer);
  }
  onConnOpen() {
    this.hasLogger() && this.log("transport", `connected to ${this.endPointURL()}`), this.closeWasClean = !1, this.disconnecting = !1, this.establishedConnections++, this.flushSendBuffer(), this.reconnectTimer.reset(), this.autoSendHeartbeat && this.resetHeartbeat(), this.triggerStateCallbacks("open");
  }
  /**
   * @private
   */
  heartbeatTimeout() {
    if (this.pendingHeartbeatRef) {
      this.pendingHeartbeatRef = null, this.heartbeatSentAt = null, this.hasLogger() && this.log("transport", "heartbeat timeout. Attempting to re-establish connection");
      try {
        this.heartbeatCallback("timeout");
      } catch (t) {
        this.log("error", "error in heartbeat callback", t);
      }
      this.triggerChanError(new Error("heartbeat timeout")), this.closeWasClean = !1, this.teardown(() => this.reconnectTimer.scheduleTimeout(), ei, "heartbeat timeout");
    }
  }
  resetHeartbeat() {
    this.conn && this.conn.skipHeartbeat || (this.pendingHeartbeatRef = null, this.clearHeartbeats(), this.heartbeatTimer = setTimeout(() => this.sendHeartbeat(), this.heartbeatIntervalMs));
  }
  teardown(t, e, r) {
    if (!this.conn)
      return t && t();
    const s = this.conn;
    this.waitForBufferDone(s, () => {
      e ? s.close(e, r || "") : s.close(), this.waitForSocketClosed(s, () => {
        this.conn === s && (this.conn.onopen = function() {
        }, this.conn.onerror = function() {
        }, this.conn.onmessage = function() {
        }, this.conn.onclose = function() {
        }, this.conn = null), t && t();
      });
    });
  }
  waitForBufferDone(t, e, r = 1) {
    if (r === 5 || !t.bufferedAmount) {
      e();
      return;
    }
    setTimeout(() => {
      this.waitForBufferDone(t, e, r + 1);
    }, 150 * r);
  }
  waitForSocketClosed(t, e, r = 1) {
    if (r === 5 || t.readyState === ce.closed) {
      e();
      return;
    }
    setTimeout(() => {
      this.waitForSocketClosed(t, e, r + 1);
    }, 150 * r);
  }
  /**
  * @param {CloseEvent} event
  */
  onConnClose(t) {
    this.conn && (this.conn.onclose = () => {
    }), this.hasLogger() && this.log("transport", "close", t), this.triggerChanError(t), this.clearHeartbeats(), this.closeWasClean || this.reconnectTimer.scheduleTimeout(), this.triggerStateCallbacks("close", t);
  }
  /**
   * @private
   * @param {Event} error
   */
  onConnError(t) {
    this.hasLogger() && this.log("transport", "error", t);
    let e = this.transport, r = this.establishedConnections;
    this.triggerStateCallbacks("error", t, e, r), (e === this.transport || r > 0) && this.triggerChanError(t);
  }
  /**
   * @private
   * @param {unknown} [reason] underlying close/error event forwarded to channel error listeners
   */
  triggerChanError(t) {
    this.channels.forEach((e) => {
      e.isErrored() || e.isLeaving() || e.isClosed() || e.trigger(fe.error, t);
    });
  }
  /**
   * @returns {string}
   */
  connectionState() {
    switch (this.conn && this.conn.readyState) {
      case ce.connecting:
        return "connecting";
      case ce.open:
        return "open";
      case ce.closing:
        return "closing";
      default:
        return "closed";
    }
  }
  /**
   * @returns {boolean}
   */
  isConnected() {
    return this.connectionState() === "open";
  }
  /**
   *
   * @param {Channel} channel
   */
  remove(t) {
    this.off(t.stateChangeRefs), this.channels = this.channels.filter((e) => e !== t);
  }
  /**
   * Removes `onOpen`, `onClose`, `onError,` and `onMessage` registrations.
   *
   * @param {string[]} refs - list of refs returned by calls to
   *                 `onOpen`, `onClose`, `onError,` and `onMessage`
   */
  off(t) {
    for (let e in this.stateChangeCallbacks)
      this.stateChangeCallbacks[e] = this.stateChangeCallbacks[e].filter(([r]) => t.indexOf(r) === -1);
  }
  /**
   * Initiates a new channel for the given topic
   *
   * @param {string} topic
   * @param {Params | (() => Params)} [chanParams]- Parameters for the channel
   * @returns {Channel}
   */
  channel(t, e = {}) {
    let r = new si(t, e, this);
    return this.channels.push(r), r;
  }
  /**
   * @param {Message<Record<string, any>>} data
   */
  push(t) {
    if (this.hasLogger()) {
      let { topic: e, event: r, payload: s, ref: n, join_ref: i } = t;
      this.log("push", `${e} ${r} (${i}, ${n})`, s);
    }
    this.isConnected() ? this.encode(t, (e) => this.conn.send(e)) : this.sendBuffer.push(() => this.encode(t, (e) => this.conn.send(e)));
  }
  /**
   * Return the next message ref, accounting for overflows
   * @returns {string}
   */
  makeRef() {
    let t = this.ref + 1;
    return t === this.ref ? this.ref = 0 : this.ref = t, this.ref.toString();
  }
  sendHeartbeat() {
    if (!this.isConnected()) {
      try {
        this.heartbeatCallback("disconnected");
      } catch (t) {
        this.log("error", "error in heartbeat callback", t);
      }
      return;
    }
    if (this.pendingHeartbeatRef) {
      this.heartbeatTimeout();
      return;
    }
    this.pendingHeartbeatRef = this.makeRef(), this.heartbeatSentAt = Date.now(), this.push({ topic: "phoenix", event: "heartbeat", payload: {}, ref: this.pendingHeartbeatRef });
    try {
      this.heartbeatCallback("sent");
    } catch (t) {
      this.log("error", "error in heartbeat callback", t);
    }
    this.heartbeatTimeoutTimer = setTimeout(() => this.heartbeatTimeout(), this.heartbeatIntervalMs);
  }
  flushSendBuffer() {
    this.isConnected() && this.sendBuffer.length > 0 && (this.sendBuffer.forEach((t) => t()), this.sendBuffer = []);
  }
  /**
  * @param {MessageEvent<any>} rawMessage
  */
  onConnMessage(t) {
    this.decode(t.data, (e) => {
      let { topic: r, event: s, payload: n, ref: i, join_ref: a } = e;
      if (i && i === this.pendingHeartbeatRef) {
        const l = this.heartbeatSentAt ? Date.now() - this.heartbeatSentAt : void 0;
        this.clearHeartbeats();
        try {
          this.heartbeatCallback(n.status === "ok" ? "ok" : "error", l);
        } catch (h) {
          this.log("error", "error in heartbeat callback", h);
        }
        this.pendingHeartbeatRef = null, this.heartbeatSentAt = null, this.autoSendHeartbeat && (this.heartbeatTimer = setTimeout(() => this.sendHeartbeat(), this.heartbeatIntervalMs));
      }
      this.hasLogger() && this.log("receive", `${n.status || ""} ${r} ${s} ${i && "(" + i + ")" || ""}`.trim(), n);
      for (let l = 0; l < this.channels.length; l++) {
        const h = this.channels[l];
        h.isMember(r, s, n, a) && h.trigger(s, n, i, a);
      }
      this.triggerStateCallbacks("message", e);
    });
  }
  /**
   * @private
   * @template {keyof SocketStateChangeCallbacks} K
   * @param {K} event
   * @param {...Parameters<SocketStateChangeCallbacks[K][number][1]>} args
   * @returns {void}
   */
  triggerStateCallbacks(t, ...e) {
    try {
      this.stateChangeCallbacks[t].forEach(([r, s]) => {
        try {
          s(...e);
        } catch (n) {
          this.log("error", `error in ${t} callback`, n);
        }
      });
    } catch (r) {
      this.log("error", `error triggering ${t} callbacks`, r);
    }
  }
  leaveOpenTopic(t) {
    let e = this.channels.find((r) => r.topic === t && (r.isJoined() || r.isJoining()));
    e && (this.hasLogger() && this.log("transport", `leaving duplicate topic "${t}"`), e.leave());
  }
};
class et {
  constructor(e, r) {
    const s = li(r);
    this.presence = new ii(e.getChannel(), s), this.presence.onJoin((n, i, a) => {
      const l = et.onJoinPayload(n, i, a);
      e.getChannel().trigger("presence", l);
    }), this.presence.onLeave((n, i, a) => {
      const l = et.onLeavePayload(n, i, a);
      e.getChannel().trigger("presence", l);
    }), this.presence.onSync(() => {
      e.getChannel().trigger("presence", { event: "sync" });
    });
  }
  get state() {
    return et.transformState(this.presence.state);
  }
  /**
   * @private
   * Remove 'metas' key
   * Change 'phx_ref' to 'presence_ref'
   * Remove 'phx_ref' and 'phx_ref_prev'
   *
   * @example Transform state
   * // returns {
   *  abc123: [
   *    { presence_ref: '2', user_id: 1 },
   *    { presence_ref: '3', user_id: 2 }
   *  ]
   * }
   * RealtimePresence.transformState({
   *  abc123: {
   *    metas: [
   *      { phx_ref: '2', phx_ref_prev: '1' user_id: 1 },
   *      { phx_ref: '3', user_id: 2 }
   *    ]
   *  }
   * })
   *
   */
  static transformState(e) {
    return e = oi(e), Object.getOwnPropertyNames(e).reduce((r, s) => {
      const n = e[s];
      return r[s] = bt(n), r;
    }, {});
  }
  static onJoinPayload(e, r, s) {
    const n = Dr(r), i = bt(s);
    return {
      event: "join",
      key: e,
      currentPresences: n,
      newPresences: i
    };
  }
  static onLeavePayload(e, r, s) {
    const n = Dr(r), i = bt(s);
    return {
      event: "leave",
      key: e,
      currentPresences: n,
      leftPresences: i
    };
  }
}
function bt(t) {
  return t.metas.map((e) => {
    const r = Object.getOwnPropertyDescriptors(e), s = Object.defineProperties({}, r);
    return s.presence_ref = s.phx_ref, delete s.phx_ref, delete s.phx_ref_prev, s;
  });
}
function oi(t) {
  return JSON.parse(JSON.stringify(t));
}
function li(t) {
  return t?.events && { events: t.events };
}
function Dr(t) {
  return t?.metas ? bt(t) : [];
}
var Fr;
(function(t) {
  t.SYNC = "sync", t.JOIN = "join", t.LEAVE = "leave";
})(Fr || (Fr = {}));
class ci {
  get state() {
    return this.presenceAdapter.state;
  }
  /**
   * Creates a Presence helper that keeps the local presence state in sync with the server.
   *
   * @param channel - The realtime channel to bind to.
   * @param opts - Optional custom event names, e.g. `{ events: { state: 'state', diff: 'diff' } }`.
   *
   * @category Realtime
   *
   * @example Example for a presence channel
   * ```ts
   * const presence = new RealtimePresence(channel)
   *
   * channel.on('presence', ({ event, key }) => {
   *   console.log(`Presence ${event} on ${key}`)
   * })
   * ```
   */
  constructor(e, r) {
    this.channel = e, this.presenceAdapter = new et(this.channel.channelAdapter, r);
  }
}
function hi(t) {
  if (t instanceof Error)
    return t;
  if (typeof t == "string")
    return new Error(t);
  if (t && typeof t == "object") {
    const e = t;
    if (typeof e.code == "number") {
      const r = typeof e.reason == "string" && e.reason ? ` (${e.reason})` : "";
      return new Error(`socket closed: ${e.code}${r}`, { cause: t });
    }
    return new Error("channel error: transport failure", { cause: t });
  }
  return new Error("channel error: connection lost");
}
class ui {
  constructor(e, r, s) {
    const n = di(s);
    this.channel = e.getSocket().channel(r, n), this.socket = e;
  }
  get state() {
    return this.channel.state;
  }
  set state(e) {
    this.channel.state = e;
  }
  get joinedOnce() {
    return this.channel.joinedOnce;
  }
  get joinPush() {
    return this.channel.joinPush;
  }
  get rejoinTimer() {
    return this.channel.rejoinTimer;
  }
  on(e, r) {
    return this.channel.on(e, r);
  }
  off(e, r) {
    this.channel.off(e, r);
  }
  subscribe(e) {
    return this.channel.join(e);
  }
  unsubscribe(e) {
    return this.channel.leave(e);
  }
  teardown() {
    this.channel.teardown();
  }
  onClose(e) {
    this.channel.onClose(e);
  }
  onError(e) {
    return this.channel.onError(e);
  }
  push(e, r, s) {
    let n;
    try {
      n = this.channel.push(e, r, s);
    } catch {
      throw new Error(`tried to push '${e}' to '${this.channel.topic}' before joining. Use channel.subscribe() before pushing events`);
    }
    if (this.channel.pushBuffer.length > qn) {
      const i = this.channel.pushBuffer.shift();
      i.cancelTimeout(), this.socket.log("channel", `discarded push due to buffer overflow: ${i.event}`, i.payload());
    }
    return n;
  }
  updateJoinPayload(e) {
    const r = this.channel.joinPush.payload();
    this.channel.joinPush.payload = () => Object.assign(Object.assign({}, r), e);
  }
  canPush() {
    return this.socket.isConnected() && this.state === we.joined;
  }
  isJoined() {
    return this.state === we.joined;
  }
  isJoining() {
    return this.state === we.joining;
  }
  isClosed() {
    return this.state === we.closed;
  }
  isLeaving() {
    return this.state === we.leaving;
  }
  updateFilterBindings(e) {
    this.channel.filterBindings = e;
  }
  updatePayloadTransform(e) {
    this.channel.onMessage = e;
  }
  /**
   * @internal
   */
  getChannel() {
    return this.channel;
  }
}
function di(t) {
  return {
    config: Object.assign({
      broadcast: { ack: !1, self: !1 },
      presence: { key: "", enabled: !1 },
      private: !1
    }, t.config)
  };
}
const fi = /[,()"\\]/, pi = (t) => fi.test(t) || t !== t.trim(), gi = (t) => `"${t.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`, Br = (t) => {
  const e = t === null ? "null" : String(t);
  return pi(e) ? gi(e) : e;
}, mi = (t) => t === null ? "null" : String(t), yi = (t, e) => {
  if (t === "in") {
    const r = Array.isArray(e) ? e : [e];
    if (r.length === 0)
      throw new Error("Realtime `in` filter requires at least one value.");
    return `in.(${Array.from(new Set(r)).map((n) => Br(n)).join(",")})`;
  }
  return t === "is" ? `is.${mi(e)}` : `${t}.${Br(e)}`;
};
class _i {
  constructor() {
    this.filters = [];
  }
  add(e, r, s, n = !1) {
    const i = n ? "not." : "";
    return this.filters.push(`${e}=${i}${yi(r, s)}`), this;
  }
  /** Match rows where `column` equals `value` (`column=eq.value`). */
  eq(e, r) {
    return this.add(e, "eq", r);
  }
  /** Match rows where `column` does not equal `value` (`column=neq.value`). */
  neq(e, r) {
    return this.add(e, "neq", r);
  }
  /** Match rows where `column` is greater than `value` (`column=gt.value`). */
  gt(e, r) {
    return this.add(e, "gt", r);
  }
  /** Match rows where `column` is greater than or equal to `value` (`column=gte.value`). */
  gte(e, r) {
    return this.add(e, "gte", r);
  }
  /** Match rows where `column` is less than `value` (`column=lt.value`). */
  lt(e, r) {
    return this.add(e, "lt", r);
  }
  /** Match rows where `column` is less than or equal to `value` (`column=lte.value`). */
  lte(e, r) {
    return this.add(e, "lte", r);
  }
  /**
   * Match rows where `column` is one of `values` (`column=in.(a,b,c)`).
   * Requires at least one value; duplicates are removed. An element containing a
   * reserved character is double-quoted (`in.("a,b",c)`), so commas inside an
   * element are preserved. `null` is intentionally not accepted (`IN (null)`
   * never matches in SQL) — use `is`/`not('col','is',null)` for null checks.
   */
  in(e, r) {
    return this.add(e, "in", r);
  }
  /** Match rows where `column` matches the case-sensitive `pattern` (`column=like.pattern`). */
  like(e, r) {
    return this.add(e, "like", r);
  }
  /** Match rows where `column` matches the case-insensitive `pattern` (`column=ilike.pattern`). */
  ilike(e, r) {
    return this.add(e, "ilike", r);
  }
  /** Match rows where `column` matches the POSIX regex `pattern` (`column=match.pattern`). */
  match(e, r) {
    return this.add(e, "match", r);
  }
  /** Match rows where `column` matches the case-insensitive POSIX regex `pattern` (`column=imatch.pattern`). */
  imatch(e, r) {
    return this.add(e, "imatch", r);
  }
  /**
   * Match rows where `column` `IS` the given value (`column=is.null`).
   * Accepts `null`, a boolean, or the keywords `'null' | 'true' | 'false' | 'unknown'`.
   */
  is(e, r) {
    return this.add(e, "is", r);
  }
  /** Match rows where `column` is distinct from `value` (`column=isdistinct.value`). NULL-safe inequality. */
  isDistinct(e, r) {
    return this.add(e, "isdistinct", r);
  }
  not(e, r, s) {
    return this.add(e, r, s, !0);
  }
  /**
   * Serialize all conditions into the comma-separated (AND) filter string.
   *
   * Conditions are joined by commas, which the server applies as `AND`. A scalar
   * value (or single `in` element) that contains a reserved character — `,`,
   * `(`, `)`, `"`, `\` — or surrounding whitespace is double-quoted and escaped
   * the way PostgREST does, so commas inside a value are preserved rather than
   * read as a condition boundary.
   */
  build() {
    return this.filters.join(",");
  }
  /** Alias for {@link build}; lets the builder be used wherever a string is expected. */
  toString() {
    return this.build();
  }
}
var Ur;
(function(t) {
  t.ALL = "*", t.INSERT = "INSERT", t.UPDATE = "UPDATE", t.DELETE = "DELETE";
})(Ur || (Ur = {}));
var Se;
(function(t) {
  t.BROADCAST = "broadcast", t.PRESENCE = "presence", t.POSTGRES_CHANGES = "postgres_changes", t.SYSTEM = "system";
})(Se || (Se = {}));
var pe;
(function(t) {
  t.SUBSCRIBED = "SUBSCRIBED", t.TIMED_OUT = "TIMED_OUT", t.CLOSED = "CLOSED", t.CHANNEL_ERROR = "CHANNEL_ERROR";
})(pe || (pe = {}));
class ge {
  get state() {
    return this.channelAdapter.state;
  }
  set state(e) {
    this.channelAdapter.state = e;
  }
  get joinedOnce() {
    return this.channelAdapter.joinedOnce;
  }
  get timeout() {
    return this.socket.timeout;
  }
  get joinPush() {
    return this.channelAdapter.joinPush;
  }
  get rejoinTimer() {
    return this.channelAdapter.rejoinTimer;
  }
  /**
   * Creates a channel that can broadcast messages, sync presence, and listen to Postgres changes.
   *
   * The topic determines which realtime stream you are subscribing to. Config options let you
   * enable acknowledgement for broadcasts, presence tracking, or private channels.
   *
   * @category Realtime
   *
   * @example Using supabase-js (recommended)
   * ```ts
   * import { createClient } from '@supabase/supabase-js'
   *
   * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
   * const channel = supabase.channel('room1')
   * channel
   *   .on('broadcast', { event: 'cursor-pos' }, (payload) => console.log(payload))
   *   .subscribe()
   * ```
   *
   * @example Standalone import for bundle-sensitive environments
   * ```ts
   * import RealtimeClient from '@supabase/realtime-js'
   *
   * const client = new RealtimeClient('https://xyzcompany.supabase.co/realtime/v1', {
   *   params: { apikey: 'your-publishable-key' },
   * })
   * const channel = new RealtimeChannel('realtime:public:messages', { config: {} }, client)
   * ```
   */
  constructor(e, r = { config: {} }, s) {
    var n, i;
    if (this.topic = e, this.params = r, this.socket = s, this.bindings = {}, this.subTopic = e.replace(/^realtime:/i, ""), this.params.config = Object.assign({
      broadcast: { ack: !1, self: !1 },
      presence: { key: "", enabled: !1 },
      private: !1
    }, r.config), this.channelAdapter = new ui(this.socket.socketAdapter, e, this.params), this.presence = new ci(this), this._onClose(() => {
      this.socket._remove(this);
    }), this._updateFilterTransform(), this.broadcastEndpointURL = Fs(this.socket.socketAdapter.endPointURL()), this.private = this.params.config.private || !1, !this.private && (!((i = (n = this.params.config) === null || n === void 0 ? void 0 : n.broadcast) === null || i === void 0) && i.replay))
      throw new Error(`tried to use replay on public channel '${this.topic}'. It must be a private channel.`);
  }
  /**
   * Subscribe registers your client with the server.
   *
   * The optional `callback` receives a `status` and, on failure, an `err` argument.
   * Log the full `err` so its `cause`, `name`, and any structured fields aren't hidden
   * behind `err.message`.
   *
   * @category Realtime
   *
   * @example Handling errors
   * ```js
   * supabase.channel('room1').subscribe((status, err) => {
   *   if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
   *     // Log the full error: its `cause` often holds the underlying reason.
   *     console.error(status, err)
   *   }
   * })
   * ```
   */
  subscribe(e, r = this.timeout) {
    var s, n, i, a;
    if (this.socket.isConnected() || this.socket.connect(), this.channelAdapter.isClosed()) {
      const { config: { broadcast: l, presence: h, private: o, postgres_changes_options: c } } = this.params, u = (n = (s = this.bindings.postgres_changes) === null || s === void 0 ? void 0 : s.map((p) => p.filter)) !== null && n !== void 0 ? n : [], d = !!this.bindings[Se.PRESENCE] && this.bindings[Se.PRESENCE].length > 0 || ((i = this.params.config.presence) === null || i === void 0 ? void 0 : i.enabled) === !0, f = {}, g = Object.assign({ broadcast: l, presence: Object.assign(Object.assign({}, h), { enabled: d }), postgres_changes: u, private: o }, c ? { postgres_changes_options: c } : {});
      this.socket.accessTokenValue && (f.access_token = this.socket.accessTokenValue), this._onError((p) => {
        e?.(pe.CHANNEL_ERROR, hi(p));
      }), this._onClose(() => e?.(pe.CLOSED)), this.updateJoinPayload(Object.assign({ config: g }, f)), this._updateFilterMessage();
      const m = c?.wait && u.length > 0 ? Math.max(r, ((a = c.timeout) !== null && a !== void 0 ? a : Un) + Hn) : r;
      this.channelAdapter.subscribe(m).receive("ok", async ({ postgres_changes: p }) => {
        if (this.socket._isManualToken() || this.socket.setAuth(), p === void 0) {
          e?.(pe.SUBSCRIBED);
          return;
        }
        this._updatePostgresBindings(p, e);
      }).receive("error", (p) => {
        this.state = we.errored;
        const y = Object.values(p).join(", ") || "error";
        e?.(pe.CHANNEL_ERROR, new Error(y, { cause: p }));
      }).receive("timeout", () => {
        e?.(pe.TIMED_OUT);
      });
    }
    return this;
  }
  _updatePostgresBindings(e, r) {
    var s;
    const n = this.bindings.postgres_changes, i = (s = n?.length) !== null && s !== void 0 ? s : 0, a = [];
    for (let l = 0; l < i; l++) {
      const h = n[l], { filter: { event: o, schema: c, table: u, filter: d } } = h, f = e && e[l];
      if (f && f.event === o && ge.isFilterValueEqual(f.schema, c) && ge.isFilterValueEqual(f.table, u) && ge.isFilterValueEqual(f.filter, d))
        a.push(Object.assign(Object.assign({}, h), { id: f.id }));
      else {
        this.unsubscribe(), this.state = we.errored, r?.(pe.CHANNEL_ERROR, new Error("mismatch between server and client bindings for postgres changes"));
        return;
      }
    }
    this.bindings.postgres_changes = a, this.state != we.errored && r && r(pe.SUBSCRIBED);
  }
  /**
   * Returns the current presence state for this channel.
   *
   * The shape is a map keyed by presence key (for example a user id) where each entry contains the
   * tracked metadata for that user.
   *
   * @category Realtime
   */
  presenceState() {
    return this.presence.state;
  }
  /**
   * Sends the supplied payload to the presence tracker so other subscribers can see that this
   * client is online. Use `untrack` to stop broadcasting presence for the same key.
   *
   * Tracking makes this client visible to other subscribers immediately, regardless of this
   * channel's `config.presence.enabled` setting or whether it has a `presence` listener — that
   * flag only affects whether *this* client receives presence updates from others (and, on
   * RLS-protected channels, whether it's authorized to do so).
   *
   * @category Realtime
   */
  async track(e, r = {}) {
    return await this.send({
      type: "presence",
      event: "track",
      payload: e
    }, r);
  }
  /**
   * Removes the current presence state for this client.
   *
   * @category Realtime
   */
  async untrack(e = {}) {
    return await this.send({
      type: "presence",
      event: "untrack"
    }, e);
  }
  /**
   * Listen to realtime events on this channel.
   * @category Realtime
   *
   * @remarks
   * - By default, Broadcast and Presence are enabled for all projects.
   * - By default, listening to database changes is disabled for new projects due to database performance and security concerns. You can turn it on by managing Realtime's [replication](/docs/guides/api#realtime-api-overview).
   * - You can receive the "previous" data for updates and deletes by setting the table's `REPLICA IDENTITY` to `FULL` (e.g., `ALTER TABLE your_table REPLICA IDENTITY FULL;`).
   * - Row level security is not applied to delete statements. When RLS is enabled and replica identity is set to full, only the primary key is sent to clients.
   *
   * @example Listen to broadcast messages
   * ```js
   * const channel = supabase.channel("room1")
   *
   * channel.on("broadcast", { event: "cursor-pos" }, (payload) => {
   *   console.log("Cursor position received!", payload);
   * }).subscribe((status) => {
   *   if (status === "SUBSCRIBED") {
   *     channel.send({
   *       type: "broadcast",
   *       event: "cursor-pos",
   *       payload: { x: Math.random(), y: Math.random() },
   *     });
   *   }
   * });
   * ```
   *
   * @example Listen to presence sync
   * ```js
   * const channel = supabase.channel('room1')
   * channel
   *   .on('presence', { event: 'sync' }, () => {
   *     console.log('Synced presence state: ', channel.presenceState())
   *   })
   *   .subscribe(async (status) => {
   *     if (status === 'SUBSCRIBED') {
   *       await channel.track({ online_at: new Date().toISOString() })
   *     }
   *   })
   * ```
   *
   * @example Listen to presence join
   * ```js
   * const channel = supabase.channel('room1')
   * channel
   *   .on('presence', { event: 'join' }, ({ newPresences }) => {
   *     console.log('Newly joined presences: ', newPresences)
   *   })
   *   .subscribe(async (status) => {
   *     if (status === 'SUBSCRIBED') {
   *       await channel.track({ online_at: new Date().toISOString() })
   *     }
   *   })
   * ```
   *
   * @example Listen to presence leave
   * ```js
   * const channel = supabase.channel('room1')
   * channel
   *   .on('presence', { event: 'leave' }, ({ leftPresences }) => {
   *     console.log('Newly left presences: ', leftPresences)
   *   })
   *   .subscribe(async (status) => {
   *     if (status === 'SUBSCRIBED') {
   *       await channel.track({ online_at: new Date().toISOString() })
   *       await channel.untrack()
   *     }
   *   })
   * ```
   *
   * Registering the same `postgres_changes` filter more than once on a channel is a no-op: the
   * duplicate is ignored and an error is logged, since the server only ever creates one
   * subscription per distinct filter.
   *
   * @example Listen to all database changes
   * ```js
   * supabase
   *   .channel('room1')
   *   .on('postgres_changes', { event: '*', schema: '*' }, payload => {
   *     console.log('Change received!', payload)
   *   })
   *   .subscribe()
   * ```
   *
   * @example Listen to a specific table
   * ```js
   * supabase
   *   .channel('room1')
   *   .on('postgres_changes', { event: '*', schema: 'public', table: 'countries' }, payload => {
   *     console.log('Change received!', payload)
   *   })
   *   .subscribe()
   * ```
   *
   * @example Listen to inserts
   * ```js
   * supabase
   *   .channel('room1')
   *   .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'countries' }, payload => {
   *     console.log('Change received!', payload)
   *   })
   *   .subscribe()
   * ```
   *
   * @exampleDescription Listen to updates
   * By default, Supabase will send only the updated record. If you want to receive the previous values as well you can
   * enable full replication for the table you are listening to:
   *
   * ```sql
   * alter table "your_table" replica identity full;
   * ```
   *
   * @example Listen to updates
   * ```js
   * supabase
   *   .channel('room1')
   *   .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'countries' }, payload => {
   *     console.log('Change received!', payload)
   *   })
   *   .subscribe()
   * ```
   *
   * @exampleDescription Listen to deletes
   * By default, Supabase does not send deleted records. If you want to receive the deleted record you can
   * enable full replication for the table you are listening to:
   *
   * ```sql
   * alter table "your_table" replica identity full;
   * ```
   *
   * @example Listen to deletes
   * ```js
   * supabase
   *   .channel('room1')
   *   .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'countries' }, payload => {
   *     console.log('Change received!', payload)
   *   })
   *   .subscribe()
   * ```
   *
   * @exampleDescription Listen to multiple events
   * You can chain listeners if you want to listen to multiple events for each table.
   *
   * @example Listen to multiple events
   * ```js
   * supabase
   *   .channel('room1')
   *   .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'countries' }, handleRecordInserted)
   *   .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'countries' }, handleRecordDeleted)
   *   .subscribe()
   * ```
   *
   * @exampleDescription Listen to row level changes
   * You can listen to individual rows using the format `{table}:{col}=eq.{val}` - where `{col}` is the column name, and `{val}` is the value which you want to match.
   *
   * @example Listen to row level changes
   * ```js
   * supabase
   *   .channel('room1')
   *   .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'countries', filter: 'id=eq.200' }, handleRecordUpdated)
   *   .subscribe()
   * ```
   */
  on(e, r, s) {
    const n = this.channelAdapter.isJoined() || this.channelAdapter.isJoining(), i = e === Se.PRESENCE || e === Se.POSTGRES_CHANGES;
    if (n && i)
      throw this.socket.log("channel", `cannot add \`${e}\` callbacks for ${this.topic} after \`subscribe()\`.`), new Error(`cannot add \`${e}\` callbacks for ${this.topic} after \`subscribe()\`.`);
    return this._on(e, r, s);
  }
  /**
   * Sends a broadcast message explicitly via REST API.
   *
   * This method always uses the REST API endpoint regardless of WebSocket connection state.
   * Useful when you want to guarantee REST delivery or when gradually migrating from implicit REST fallback.
   *
   * Payloads that are `ArrayBuffer` or `ArrayBufferView` (e.g. `Uint8Array`) are sent as
   * `application/octet-stream`; all other payloads are JSON-encoded.
   *
   * @param event The name of the broadcast event
   * @param payload Payload to be sent (required)
   * @param opts Options including timeout
   * @returns Promise resolving to object with success status, and error details if failed
   *
   * @category Realtime
   */
  async httpSend(e, r, s = {}) {
    var n;
    if (r == null)
      return Promise.reject(new Error("Payload is required for httpSend()"));
    const i = r instanceof ArrayBuffer || ArrayBuffer.isView(r), a = {
      apikey: this.socket.apiKey ? this.socket.apiKey : "",
      "Content-Type": i ? "application/octet-stream" : "application/json"
    };
    this.socket.accessTokenValue && (a.Authorization = `Bearer ${this.socket.accessTokenValue}`);
    const l = new URL(this.broadcastEndpointURL);
    l.pathname += `/${encodeURIComponent(this.subTopic)}/events/${encodeURIComponent(e)}`, this.private && l.searchParams.set("private", "true");
    const h = {
      method: "POST",
      headers: a,
      body: i ? r : JSON.stringify(r)
    }, o = await this._fetchWithTimeout(l.toString(), h, (n = s.timeout) !== null && n !== void 0 ? n : this.timeout);
    if (o.status === 202)
      return { success: !0 };
    if (o.status === 404)
      return Promise.reject(new Error("httpSend() requires Realtime server v2.97.0 or newer; the endpoint returned 404. Update your Supabase CLI to a recent version, or upgrade the Realtime server in your self-hosted setup. See https://github.com/supabase/supabase-js/blob/master/packages/core/realtime-js/migrations/httpsend-server-version.md"));
    let c = o.statusText;
    try {
      const u = await o.json();
      c = u.error || u.message || c;
    } catch {
    }
    return Promise.reject(new Error(c));
  }
  /**
   * Sends a message into the channel.
   *
   * @param args Arguments to send to channel
   * @param args.type The type of event to send
   * @param args.event The name of the event being sent
   * @param args.payload Payload to be sent
   * @param opts Options to be used during the send process
   *
   * @category Realtime
   *
   * @remarks
   * - When using REST you don't need to subscribe to the channel
   * - REST calls are only available from 2.37.0 onwards
   * - If you create a channel only to send a REST broadcast, remove it from
   *   the client when the send completes
   *
   * @example Send a message via websocket
   * ```js
   * const channel = supabase.channel('room1')
   *
   * channel.subscribe((status) => {
   *   if (status === 'SUBSCRIBED') {
   *     channel.send({
   *       type: 'broadcast',
   *       event: 'cursor-pos',
   *       payload: { x: Math.random(), y: Math.random() },
   *     })
   *   }
   * })
   * ```
   *
   * @exampleResponse Send a message via websocket
   * ```js
   * ok | timed out | error
   * ```
   *
   * @example Send a message via REST
   * ```js
   * const channel = supabase.channel('room1')
   *
   * try {
   *   await channel.httpSend('cursor-pos', { x: Math.random(), y: Math.random() })
   * } finally {
   *   await supabase.removeChannel(channel)
   * }
   * ```
   */
  async send(e, r = {}) {
    var s, n;
    if (!this.channelAdapter.canPush() && e.type === "broadcast") {
      const i = "Realtime send() is automatically falling back to REST API. This behavior will be deprecated in the future. Please use httpSend() explicitly for REST delivery.";
      this.socket.hasLogger() ? this.socket.log("channel", i) : console.warn(i);
      const { event: a, payload: l } = e, h = {
        apikey: this.socket.apiKey ? this.socket.apiKey : "",
        "Content-Type": "application/json"
      };
      this.socket.accessTokenValue && (h.Authorization = `Bearer ${this.socket.accessTokenValue}`);
      const o = {
        method: "POST",
        headers: h,
        body: JSON.stringify({
          messages: [
            {
              topic: this.subTopic,
              event: a,
              payload: l,
              private: this.private
            }
          ]
        })
      };
      try {
        const c = await this._fetchWithTimeout(this.broadcastEndpointURL, o, (s = r.timeout) !== null && s !== void 0 ? s : this.timeout);
        return await ((n = c.body) === null || n === void 0 ? void 0 : n.cancel()), c.ok ? "ok" : "error";
      } catch (c) {
        return c instanceof Error && c.name === "AbortError" ? "timed out" : "error";
      }
    } else
      return new Promise((i) => {
        var a, l, h;
        const o = this.channelAdapter.push(e.type, e, r.timeout || this.timeout);
        e.type === "broadcast" && !(!((h = (l = (a = this.params) === null || a === void 0 ? void 0 : a.config) === null || l === void 0 ? void 0 : l.broadcast) === null || h === void 0) && h.ack) && i("ok"), o.receive("ok", () => i("ok")), o.receive("error", () => i("error")), o.receive("timeout", () => i("timed out"));
      });
  }
  /**
   * Updates the payload that will be sent the next time the channel joins (reconnects).
   * Useful for rotating access tokens or updating config without re-creating the channel.
   *
   * @category Realtime
   */
  updateJoinPayload(e) {
    this.channelAdapter.updateJoinPayload(e);
  }
  /**
   * Leaves the channel.
   *
   * Unsubscribes from server events, and instructs channel to terminate on server.
   * Triggers onClose() hooks.
   *
   * To receive leave acknowledgements, use the a `receive` hook to bind to the server ack, ie:
   * channel.unsubscribe().receive("ok", () => alert("left!") )
   *
   * @category Realtime
   */
  async unsubscribe(e = this.timeout) {
    return new Promise((r) => {
      this.channelAdapter.unsubscribe(e).receive("ok", () => r("ok")).receive("timeout", () => r("timed out")).receive("error", () => r("error"));
    });
  }
  /**
   * Destroys and stops related timers.
   *
   * @category Realtime
   */
  teardown() {
    this.channelAdapter.teardown();
  }
  /** @internal */
  async _fetchWithTimeout(e, r, s) {
    const n = new AbortController(), i = setTimeout(() => n.abort(), s), a = await this.socket.fetch(e, Object.assign(Object.assign({}, r), { signal: n.signal }));
    return clearTimeout(i), a;
  }
  /** @internal */
  _on(e, r, s) {
    var n;
    const i = e.toLocaleLowerCase(), a = r?.filter;
    if ((a instanceof _i || typeof a == "object" && a !== null && typeof a.build == "function") && (r = Object.assign(Object.assign({}, r), { filter: a.build() })), i === Se.POSTGRES_CHANGES && ((n = this.bindings[i]) === null || n === void 0 ? void 0 : n.find((c) => ge.isSamePostgresFilter(c.filter, r))))
      return this.socket.log("error", `duplicate \`postgres_changes\` binding for ${this.topic} ignored`, r), this;
    const l = this.channelAdapter.on(e, s), h = {
      type: i,
      filter: r,
      callback: s,
      ref: l
    };
    return this.bindings[i] ? this.bindings[i].push(h) : this.bindings[i] = [h], this._updateFilterMessage(), this;
  }
  /**
   * Registers a callback that will be executed when the channel closes.
   *
   * @internal
   */
  _onClose(e) {
    this.channelAdapter.onClose(e);
  }
  /**
   * Registers a callback that will be executed when the channel encounteres an error.
   *
   * @internal
   */
  _onError(e) {
    this.channelAdapter.onError(e);
  }
  /** @internal */
  _updateFilterMessage() {
    this.channelAdapter.updateFilterBindings((e, r, s) => {
      var n, i, a, l, h, o, c;
      const u = e.event.toLocaleLowerCase();
      if (this._notThisChannelEvent(u, s))
        return !1;
      const d = (n = this.bindings[u]) === null || n === void 0 ? void 0 : n.find((f) => f.ref === e.ref);
      if (!d)
        return !0;
      if (["broadcast", "presence", "postgres_changes"].includes(u))
        if ("id" in d) {
          const f = d.id, g = (i = d.filter) === null || i === void 0 ? void 0 : i.event;
          return f && ((a = r.ids) === null || a === void 0 ? void 0 : a.includes(f)) && (g === "*" || g?.toLocaleLowerCase() === ((l = r.data) === null || l === void 0 ? void 0 : l.type.toLocaleLowerCase()));
        } else {
          const f = (o = (h = d?.filter) === null || h === void 0 ? void 0 : h.event) === null || o === void 0 ? void 0 : o.toLocaleLowerCase();
          return f === "*" || f === ((c = r?.event) === null || c === void 0 ? void 0 : c.toLocaleLowerCase());
        }
      else
        return d.type.toLocaleLowerCase() === u;
    });
  }
  /** @internal */
  _notThisChannelEvent(e, r) {
    const { close: s, error: n, leave: i, join: a } = Ns;
    return r && [s, n, i, a].includes(e) && r !== this.joinPush.ref;
  }
  /** @internal */
  _updateFilterTransform() {
    this.channelAdapter.updatePayloadTransform((e, r, s) => {
      if (typeof r == "object" && "ids" in r) {
        const n = r.data, { schema: i, table: a, commit_timestamp: l, type: h, errors: o } = n;
        return Object.assign(Object.assign({}, {
          schema: i,
          table: a,
          commit_timestamp: l,
          eventType: h,
          new: {},
          old: {},
          errors: o
        }), this._getPayloadRecords(n));
      }
      return r;
    });
  }
  copyBindings(e) {
    if (this.joinedOnce)
      throw new Error("cannot copy bindings into joined channel");
    for (const r in e.bindings)
      for (const s of e.bindings[r])
        this._on(s.type, s.filter, s.callback);
  }
  /**
   * Compares two optional filter values for equality.
   * Treats undefined, null, and empty string as equivalent empty values.
   * @internal
   */
  static isFilterValueEqual(e, r) {
    return (e ?? void 0) === (r ?? void 0);
  }
  /**
   * Two `postgres_changes` filters are the same when the server would collapse them into a single
   * subscription.
   * @internal
   */
  static isSamePostgresFilter(e, r) {
    var s, n, i, a;
    const l = (n = (s = e?.select) === null || s === void 0 ? void 0 : s.join()) !== null && n !== void 0 ? n : void 0, h = (a = (i = r?.select) === null || i === void 0 ? void 0 : i.join()) !== null && a !== void 0 ? a : void 0;
    return e?.event === r?.event && ge.isFilterValueEqual(e?.schema, r?.schema) && ge.isFilterValueEqual(e?.table, r?.table) && ge.isFilterValueEqual(e?.filter, r?.filter) && l === h;
  }
  /** @internal */
  _getPayloadRecords(e) {
    const r = {
      new: {},
      old: {}
    };
    return (e.type === "INSERT" || e.type === "UPDATE") && (r.new = Nr(e.columns, e.record)), (e.type === "UPDATE" || e.type === "DELETE") && (r.old = Nr(e.columns, e.old_record)), r;
  }
}
class wi {
  constructor(e, r) {
    this.socket = new ai(e, r);
  }
  get timeout() {
    return this.socket.timeout;
  }
  get endPoint() {
    return this.socket.endPoint;
  }
  get transport() {
    return this.socket.transport;
  }
  get heartbeatIntervalMs() {
    return this.socket.heartbeatIntervalMs;
  }
  get heartbeatCallback() {
    return this.socket.heartbeatCallback;
  }
  set heartbeatCallback(e) {
    this.socket.heartbeatCallback = e;
  }
  get heartbeatTimer() {
    return this.socket.heartbeatTimer;
  }
  get pendingHeartbeatRef() {
    return this.socket.pendingHeartbeatRef;
  }
  get reconnectTimer() {
    return this.socket.reconnectTimer;
  }
  get vsn() {
    return this.socket.vsn;
  }
  get encode() {
    return this.socket.encode;
  }
  get decode() {
    return this.socket.decode;
  }
  get reconnectAfterMs() {
    return this.socket.reconnectAfterMs;
  }
  get sendBuffer() {
    return this.socket.sendBuffer;
  }
  get stateChangeCallbacks() {
    return this.socket.stateChangeCallbacks;
  }
  connect() {
    this.socket.connect();
  }
  disconnect(e, r, s, n = 1e4) {
    return new Promise((i) => {
      setTimeout(() => i("timeout"), n), this.socket.disconnect(() => {
        e(), i("ok");
      }, r, s);
    });
  }
  push(e) {
    this.socket.push(e);
  }
  log(e, r, s) {
    this.socket.log(e, r, s);
  }
  hasLogger() {
    return this.socket.hasLogger();
  }
  makeRef() {
    return this.socket.makeRef();
  }
  onOpen(e) {
    this.socket.onOpen(e);
  }
  onClose(e) {
    this.socket.onClose(e);
  }
  onError(e) {
    this.socket.onError(e);
  }
  onMessage(e) {
    this.socket.onMessage(e);
  }
  isConnected() {
    return this.socket.isConnected();
  }
  isConnecting() {
    return this.socket.connectionState() == ur.connecting;
  }
  isDisconnecting() {
    return this.socket.connectionState() == ur.closing;
  }
  connectionState() {
    return this.socket.connectionState();
  }
  endPointURL() {
    return this.socket.endPointURL();
  }
  sendHeartbeat() {
    this.socket.sendHeartbeat();
  }
  /**
   * @internal
   */
  getSocket() {
    return this.socket;
  }
}
const Hr = {
  HEARTBEAT_INTERVAL: 25e3
}, vi = [1e3, 2e3, 5e3, 1e4], ki = 1e4;
function bi() {
  const t = /* @__PURE__ */ new Map();
  return {
    get length() {
      return t.size;
    },
    clear() {
      t.clear();
    },
    getItem(e) {
      return t.has(e) ? t.get(e) : null;
    },
    key(e) {
      var r;
      return (r = Array.from(t.keys())[e]) !== null && r !== void 0 ? r : null;
    },
    removeItem(e) {
      t.delete(e);
    },
    setItem(e, r) {
      t.set(e, String(r));
    }
  };
}
function xi() {
  try {
    if (typeof globalThis < "u" && globalThis.sessionStorage)
      return globalThis.sessionStorage;
  } catch {
  }
  return bi();
}
const Si = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
class Ti {
  get endPoint() {
    return this.socketAdapter.endPoint;
  }
  get timeout() {
    return this.socketAdapter.timeout;
  }
  get transport() {
    return this.socketAdapter.transport;
  }
  get heartbeatCallback() {
    return this.socketAdapter.heartbeatCallback;
  }
  get heartbeatIntervalMs() {
    return this.socketAdapter.heartbeatIntervalMs;
  }
  get heartbeatTimer() {
    return this.worker ? this._workerHeartbeatTimer : this.socketAdapter.heartbeatTimer;
  }
  get pendingHeartbeatRef() {
    return this.worker ? this._pendingWorkerHeartbeatRef : this.socketAdapter.pendingHeartbeatRef;
  }
  get reconnectTimer() {
    return this.socketAdapter.reconnectTimer;
  }
  get vsn() {
    return this.socketAdapter.vsn;
  }
  get encode() {
    return this.socketAdapter.encode;
  }
  get decode() {
    return this.socketAdapter.decode;
  }
  get reconnectAfterMs() {
    return this.socketAdapter.reconnectAfterMs;
  }
  get sendBuffer() {
    return this.socketAdapter.sendBuffer;
  }
  get stateChangeCallbacks() {
    return this.socketAdapter.stateChangeCallbacks;
  }
  /**
   * Initializes the Socket.
   *
   * @param endPoint The string WebSocket endpoint, ie, "ws://example.com/socket", "wss://example.com", "/socket" (inherited host & protocol)
   * @param options.transport The Websocket Transport, for example WebSocket. This can be a custom implementation
   * @param options.timeout The default timeout in milliseconds to trigger push timeouts.
   * @param options.params The optional params to pass when connecting.
   * @param options.headers Deprecated: headers cannot be set on websocket connections and this option will be removed in the future.
   * @param options.heartbeatIntervalMs The millisec interval to send a heartbeat message.
   * @param options.heartbeatCallback The optional function to handle heartbeat status and latency.
   * @param options.logger The optional function for specialized logging, ie: logger: (kind, msg, data) => { console.log(`${kind}: ${msg}`, data) }
   * @param options.logLevel Sets the log level for Realtime
   * @param options.encode The function to encode outgoing messages. Defaults to JSON: (payload, callback) => callback(JSON.stringify(payload))
   * @param options.decode The function to decode incoming messages. Defaults to Serializer's decode.
   * @param options.reconnectAfterMs he optional function that returns the millsec reconnect interval. Defaults to stepped backoff off.
   * @param options.worker Use Web Worker to set a side flow. Defaults to false.
   * @param options.workerUrl The URL of the worker script. Defaults to https://realtime.supabase.com/worker.js that includes a heartbeat event call to keep the connection alive.
   * @param options.vsn The protocol version to use when connecting. Supported versions are "1.0.0" and "2.0.0". Defaults to "2.0.0".
   *
   * @category Realtime
   *
   * @example Using supabase-js (recommended)
   * ```ts
   * import { createClient } from '@supabase/supabase-js'
   *
   * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
   * const channel = supabase.channel('room1')
   * channel
   *   .on('broadcast', { event: 'cursor-pos' }, (payload) => console.log(payload))
   *   .subscribe()
   * ```
   *
   * @example Standalone import for bundle-sensitive environments
   * ```ts
   * import RealtimeClient from '@supabase/realtime-js'
   *
   * const client = new RealtimeClient('https://xyzcompany.supabase.co/realtime/v1', {
   *   params: { apikey: 'your-publishable-key' },
   * })
   * client.connect()
   * ```
   */
  constructor(e, r) {
    var s;
    if (this.channels = new Array(), this.accessTokenValue = null, this.accessToken = null, this.apiKey = null, this.httpEndpoint = "", this.headers = {}, this.params = {}, this.ref = 0, this.serializer = new Wn(), this._manuallySetToken = !1, this._authPromise = null, this._authGeneration = 0, this._workerHeartbeatTimer = void 0, this._pendingWorkerHeartbeatRef = null, this._pendingDisconnectTimer = null, this._disconnectOnEmptyChannelsAfterMs = 0, this._resolveFetch = (i) => i ? (...a) => i(...a) : (...a) => fetch(...a), !(!((s = r?.params) === null || s === void 0) && s.apikey))
      throw new Error("API key is required to connect to Realtime");
    this.apiKey = r.params.apikey;
    const n = this._initializeOptions(r);
    this.socketAdapter = new wi(e, n), this.httpEndpoint = Fs(e), this.fetch = this._resolveFetch(r?.fetch);
  }
  /**
   * Connects the socket, unless already connected.
   *
   * @category Realtime
   */
  connect() {
    if (!(this.isConnecting() || this.isDisconnecting() || this.isConnected())) {
      this.accessToken && !this._authPromise && this._setAuthSafely("connect"), this._setupConnectionHandlers();
      try {
        this.socketAdapter.connect();
      } catch (e) {
        const r = e.message;
        throw new Error(`WebSocket not available: ${r}`);
      }
      this._handleNodeJsRaceCondition();
    }
  }
  /**
   * Returns the URL of the websocket.
   * @returns string The URL of the websocket.
   *
   * @category Realtime
   */
  endpointURL() {
    return this.socketAdapter.endPointURL();
  }
  /**
   * Disconnects the socket.
   *
   * @param code A numeric status code to send on disconnect.
   * @param reason A custom reason for the disconnect.
   *
   * @category Realtime
   */
  async disconnect(e, r) {
    return this._cancelPendingDisconnect(), this.isDisconnecting() ? "ok" : await this.socketAdapter.disconnect(() => {
      clearInterval(this._workerHeartbeatTimer), this._terminateWorker();
    }, e, r);
  }
  /**
   * Returns all created channels
   *
   * @category Realtime
   */
  getChannels() {
    return this.channels;
  }
  /**
   * Unsubscribes, removes and tears down a single channel
   * @param channel A RealtimeChannel instance
   *
   * @category Realtime
   */
  async removeChannel(e) {
    const r = await e.unsubscribe();
    return r === "ok" && e.teardown(), r;
  }
  /**
   * Unsubscribes, removes and tears down all channels
   *
   * @category Realtime
   */
  async removeAllChannels() {
    const e = this.channels.map(async (s) => {
      const n = await s.unsubscribe();
      return s.teardown(), n;
    }), r = await Promise.all(e);
    return await this.disconnect(), r;
  }
  /**
   * Logs the message.
   *
   * For customized logging, `this.logger` can be overridden in Client constructor.
   *
   * @category Realtime
   */
  log(e, r, s) {
    this.socketAdapter.log(e, r, s);
  }
  /**
   * Returns true if a custom `logger` has been configured on this client.
   *
   * @category Realtime
   */
  hasLogger() {
    return this.socketAdapter.hasLogger();
  }
  /**
   * Returns the current state of the socket.
   *
   * @category Realtime
   */
  connectionState() {
    return this.socketAdapter.connectionState() || ur.closed;
  }
  /**
   * Returns `true` is the connection is open.
   *
   * @category Realtime
   */
  isConnected() {
    return this.socketAdapter.isConnected();
  }
  /**
   * Returns `true` if the connection is currently connecting.
   *
   * @category Realtime
   */
  isConnecting() {
    return this.socketAdapter.isConnecting();
  }
  /**
   * Returns `true` if the connection is currently disconnecting.
   *
   * @category Realtime
   */
  isDisconnecting() {
    return this.socketAdapter.isDisconnecting();
  }
  /**
   * Creates (or reuses) a {@link RealtimeChannel} for the provided topic.
   *
   * Topics are automatically prefixed with `realtime:` to match the Realtime service.
   * If a channel with the same topic already exists it will be returned instead of creating
   * a duplicate connection.
   *
   * @category Realtime
   */
  channel(e, r = { config: {} }) {
    const s = `realtime:${e}`, n = this.getChannels().find((i) => i.topic === s);
    if (n)
      return n;
    {
      const i = new ge(`realtime:${e}`, r, this);
      return this._cancelPendingDisconnect(), this.channels.push(i), i;
    }
  }
  /**
   * Push out a message if the socket is connected.
   *
   * If the socket is not connected, the message gets enqueued within a local buffer, and sent out when a connection is next established.
   *
   * @category Realtime
   */
  push(e) {
    this.socketAdapter.push(e);
  }
  /**
   * Sets the JWT access token used for channel subscription authorization and Realtime RLS.
   *
   * If param is null it will use the `accessToken` callback function or the token set on the client.
   *
   * On callback used, it will set the value of the token internal to the client.
   *
   * When a token is explicitly provided AND no `accessToken` callback is configured,
   * it will be preserved across channel operations (including removeChannel and
   * resubscribe) and the client stays in manual-token mode.
   *
   * When an `accessToken` callback IS configured, the callback is the source of truth:
   * the client remains in callback mode and continues to refresh from it on heartbeat,
   * even after a bootstrap/override `setAuth(token)` call.
   *
   * The callback is called on connect and on every heartbeat (`heartbeatIntervalMs`,
   * default 25000ms). Its token must stay valid past the next call, or the server closes
   * the channel at expiry with no automatic resubscribe.
   *
   * @param token A JWT string to override the token set on the client.
   *
   * @example Setting the authorization header
   * // Use a manual token (preserved across resubscribes when no accessToken callback is set)
   * client.realtime.setAuth('my-custom-jwt')
   *
   * // Switch back to using the accessToken callback
   * client.realtime.setAuth()
   *
   * @category Realtime
   */
  async setAuth(e = null) {
    const r = ++this._authGeneration, s = this._performAuth(e, r);
    r === this._authGeneration && (this._authPromise = s);
    try {
      await s;
    } finally {
      this._authPromise === s && (this._authPromise = null);
    }
  }
  /**
   * Returns true if the current access token was explicitly set via setAuth(token),
   * false if it was obtained via the accessToken callback.
   * @internal
   */
  _isManualToken() {
    return this._manuallySetToken;
  }
  /**
   * Sends a heartbeat message if the socket is connected.
   *
   * @category Realtime
   */
  async sendHeartbeat() {
    this.socketAdapter.sendHeartbeat();
  }
  /**
   * Sets a callback that receives lifecycle events for internal heartbeat messages.
   * Useful for instrumenting connection health (e.g. sent/ok/timeout).
   *
   * @category Realtime
   */
  onHeartbeat(e) {
    this.socketAdapter.heartbeatCallback = this._wrapHeartbeatCallback(e);
  }
  /**
   * Return the next message ref, accounting for overflows
   *
   * @internal
   */
  _makeRef() {
    return this.socketAdapter.makeRef();
  }
  /**
   * Removes a channel from RealtimeClient
   *
   * @param channel An open subscription.
   *
   * @internal
   */
  _remove(e) {
    this.channels = this.channels.filter((r) => r.topic !== e.topic), this.channels.length === 0 && (this.log("transport", "no channels remaining, scheduling disconnect"), this._schedulePendingDisconnect());
  }
  /** @internal */
  _schedulePendingDisconnect() {
    if (this._cancelPendingDisconnect(), this._disconnectOnEmptyChannelsAfterMs === 0) {
      this.log("transport", "disconnecting immediately - no channels"), this.disconnect();
      return;
    }
    this._pendingDisconnectTimer = setTimeout(() => {
      this._pendingDisconnectTimer = null, this.channels.length === 0 && (this.log("transport", "deferred disconnect fired - no channels, disconnecting"), this.disconnect());
    }, this._disconnectOnEmptyChannelsAfterMs), this.log("transport", `deferred disconnect scheduled in ${this._disconnectOnEmptyChannelsAfterMs}ms`);
  }
  /** @internal */
  _cancelPendingDisconnect() {
    this._pendingDisconnectTimer !== null && (this.log("transport", "pending disconnect cancelled - channel activity detected"), clearTimeout(this._pendingDisconnectTimer), this._pendingDisconnectTimer = null);
  }
  /**
   * Perform the actual auth operation
   * @internal
   */
  async _performAuth(e, r) {
    let s, n = !1;
    if (e)
      s = e, n = !0;
    else if (this.accessToken)
      try {
        s = await this.accessToken();
      } catch (i) {
        this.log("error", "Error fetching access token from callback", i), s = this.accessTokenValue;
      }
    else
      s = this.accessTokenValue;
    r === this._authGeneration && (this.accessToken ? this._manuallySetToken = !1 : n && (this._manuallySetToken = !0), this.accessTokenValue != s && (this.accessTokenValue = s, this.channels.forEach((i) => {
      const a = {
        access_token: s,
        version: Nn
      };
      i.updateJoinPayload(a), i.joinedOnce && i.channelAdapter.isJoined() && i.channelAdapter.push(Ns.access_token, {
        access_token: s
      });
    })));
  }
  /**
   * Wait for any in-flight auth operations to complete
   * @internal
   */
  async _waitForAuthIfNeeded() {
    this._authPromise && await this._authPromise;
  }
  /**
   * Safely call setAuth with standardized error handling
   * @internal
   */
  _setAuthSafely(e = "general") {
    this._isManualToken() || this.setAuth().catch((r) => {
      this.log("error", `Error setting auth in ${e}`, r);
    });
  }
  /** @internal */
  _setupConnectionHandlers() {
    this.socketAdapter.onOpen(() => {
      (this._authPromise || (this.accessToken && !this.accessTokenValue ? this.setAuth() : Promise.resolve())).catch((r) => {
        this.log("error", "error waiting for auth on connect", r);
      }), this.worker && !this.workerRef && this._startWorkerHeartbeat();
    }), this.socketAdapter.onClose(() => {
      this.worker && this.workerRef && this._terminateWorker();
    }), this.socketAdapter.onMessage((e) => {
      e.ref && e.ref === this._pendingWorkerHeartbeatRef && (this._pendingWorkerHeartbeatRef = null);
    });
  }
  /** @internal */
  _handleNodeJsRaceCondition() {
    this.socketAdapter.isConnected() && this.socketAdapter.getSocket().onConnOpen();
  }
  /** @internal */
  _wrapHeartbeatCallback(e) {
    return (r, s) => {
      r !== "disconnected" && (r == "sent" && this._setAuthSafely(), e && e(r, s));
    };
  }
  /** @internal */
  _startWorkerHeartbeat() {
    this.workerUrl ? this.log("worker", `starting worker for from ${this.workerUrl}`) : this.log("worker", "starting default worker");
    const e = this._workerObjectUrl(this.workerUrl);
    this.workerRef = new Worker(e), this.workerRef.onerror = (r) => {
      this.log("worker", "worker error", r.message), this._terminateWorker(), this.disconnect();
    }, this.workerRef.onmessage = (r) => {
      r.data.event === "keepAlive" && this.sendHeartbeat();
    }, this.workerRef.postMessage({
      event: "start",
      interval: this.heartbeatIntervalMs
    });
  }
  /**
   * Terminate the Web Worker and clear the reference
   * @internal
   */
  _terminateWorker() {
    this.workerRef && (this.log("worker", "terminating worker"), this.workerRef.terminate(), this.workerRef = void 0);
  }
  /** @internal */
  _workerObjectUrl(e) {
    let r;
    if (e)
      r = e;
    else {
      const s = new Blob([Si], { type: "application/javascript" });
      r = URL.createObjectURL(s);
    }
    return r;
  }
  /**
   * Initialize socket options with defaults
   * @internal
   */
  _initializeOptions(e) {
    var r, s, n, i, a, l, h, o, c, u, d, f;
    this.worker = (r = e?.worker) !== null && r !== void 0 ? r : !1, this.accessToken = (s = e?.accessToken) !== null && s !== void 0 ? s : null;
    const g = {};
    g.timeout = (n = e?.timeout) !== null && n !== void 0 ? n : Bn, g.heartbeatIntervalMs = (i = e?.heartbeatIntervalMs) !== null && i !== void 0 ? i : Hr.HEARTBEAT_INTERVAL, this._disconnectOnEmptyChannelsAfterMs = (a = e?.disconnectOnEmptyChannelsAfterMs) !== null && a !== void 0 ? a : 2 * ((l = e?.heartbeatIntervalMs) !== null && l !== void 0 ? l : Hr.HEARTBEAT_INTERVAL), g.transport = (h = e?.transport) !== null && h !== void 0 ? h : jn.getWebSocketConstructor(), g.params = e?.params, g.logger = e?.logger, g.heartbeatCallback = this._wrapHeartbeatCallback(e?.heartbeatCallback), g.sessionStorage = (o = e?.sessionStorage) !== null && o !== void 0 ? o : xi(), g.reconnectAfterMs = (c = e?.reconnectAfterMs) !== null && c !== void 0 ? c : ((_) => vi[_ - 1] || ki);
    let m, p;
    const y = (u = e?.vsn) !== null && u !== void 0 ? u : Fn;
    switch (y) {
      case Dn:
        m = (_, w) => w(JSON.stringify(_)), p = (_, w) => w(JSON.parse(_));
        break;
      case Ls:
        m = this.serializer.encode.bind(this.serializer), p = this.serializer.decode.bind(this.serializer);
        break;
      default:
        throw new Error(`Unsupported serializer version: ${g.vsn}`);
    }
    if (g.vsn = y, g.encode = (d = e?.encode) !== null && d !== void 0 ? d : m, g.decode = (f = e?.decode) !== null && f !== void 0 ? f : p, g.beforeReconnect = this._reconnectAuth.bind(this), (e?.logLevel || e?.log_level) && (this.logLevel = e.logLevel || e.log_level, g.params = Object.assign(Object.assign({}, g.params), { log_level: this.logLevel })), this.worker) {
      if (typeof window < "u" && !window.Worker)
        throw new Error("Web Worker is not supported");
      this.workerUrl = e?.workerUrl, g.autoSendHeartbeat = !this.worker;
    }
    return g;
  }
  /** @internal */
  async _reconnectAuth() {
    await this._waitForAuthIfNeeded(), this.isConnected() || this.connect();
  }
}
var nt = class extends Error {
  constructor(t, e) {
    super(t), this.name = "IcebergError", this.status = e.status, this.icebergType = e.icebergType, this.icebergCode = e.icebergCode, this.details = e.details, this.isCommitStateUnknown = e.icebergType === "CommitStateUnknownException" || [500, 502, 504].includes(e.status) && e.icebergType?.includes("CommitState") === !0;
  }
  /**
   * Returns true if the error is a 404 Not Found error.
   */
  isNotFound() {
    return this.status === 404;
  }
  /**
   * Returns true if the error is a 409 Conflict error.
   */
  isConflict() {
    return this.status === 409;
  }
  /**
   * Returns true if the error is a 419 Authentication Timeout error.
   */
  isAuthenticationTimeout() {
    return this.status === 419;
  }
};
function Ei(t, e, r) {
  const s = new URL(e, t);
  if (r)
    for (const [n, i] of Object.entries(r))
      i !== void 0 && s.searchParams.set(n, i);
  return s.toString();
}
async function Ai(t) {
  return !t || t.type === "none" ? {} : t.type === "bearer" ? { Authorization: `Bearer ${t.token}` } : t.type === "header" ? { [t.name]: t.value } : t.type === "custom" ? await t.getHeaders() : {};
}
function Ri(t) {
  const e = t.fetchImpl ?? globalThis.fetch;
  return {
    async request({
      method: r,
      path: s,
      query: n,
      body: i,
      headers: a
    }) {
      const l = Ei(t.baseUrl, s, n), h = await Ai(t.auth), o = await e(l, {
        method: r,
        headers: {
          ...i ? { "Content-Type": "application/json" } : {},
          ...h,
          ...a
        },
        body: i ? JSON.stringify(i) : void 0
      }), c = await o.text(), u = (o.headers.get("content-type") || "").includes("application/json"), d = u && c ? JSON.parse(c) : c;
      if (!o.ok) {
        const f = u ? d : void 0, g = f?.error;
        throw new nt(
          g?.message ?? `Request failed with status ${o.status}`,
          {
            status: o.status,
            icebergType: g?.type,
            icebergCode: g?.code,
            details: f
          }
        );
      }
      return { status: o.status, headers: o.headers, data: d };
    }
  };
}
function ft(t) {
  return t.join("");
}
var Oi = class {
  constructor(t, e = "") {
    this.client = t, this.prefix = e;
  }
  async listNamespaces(t) {
    const e = t ? { parent: ft(t.namespace) } : void 0;
    return (await this.client.request({
      method: "GET",
      path: `${this.prefix}/namespaces`,
      query: e
    })).data.namespaces.map((s) => ({ namespace: s }));
  }
  async createNamespace(t, e) {
    const r = {
      namespace: t.namespace,
      properties: e?.properties
    };
    return (await this.client.request({
      method: "POST",
      path: `${this.prefix}/namespaces`,
      body: r
    })).data;
  }
  async dropNamespace(t) {
    await this.client.request({
      method: "DELETE",
      path: `${this.prefix}/namespaces/${ft(t.namespace)}`
    });
  }
  async loadNamespaceMetadata(t) {
    return {
      properties: (await this.client.request({
        method: "GET",
        path: `${this.prefix}/namespaces/${ft(t.namespace)}`
      })).data.properties
    };
  }
  async namespaceExists(t) {
    try {
      return await this.client.request({
        method: "HEAD",
        path: `${this.prefix}/namespaces/${ft(t.namespace)}`
      }), !0;
    } catch (e) {
      if (e instanceof nt && e.status === 404)
        return !1;
      throw e;
    }
  }
  async createNamespaceIfNotExists(t, e) {
    try {
      return await this.createNamespace(t, e);
    } catch (r) {
      if (r instanceof nt && r.status === 409)
        return;
      throw r;
    }
  }
};
function Ie(t) {
  return t.join("");
}
var Mi = class {
  constructor(t, e = "", r) {
    this.client = t, this.prefix = e, this.accessDelegation = r;
  }
  async listTables(t) {
    return (await this.client.request({
      method: "GET",
      path: `${this.prefix}/namespaces/${Ie(t.namespace)}/tables`
    })).data.identifiers;
  }
  async createTable(t, e) {
    const r = {};
    return this.accessDelegation && (r["X-Iceberg-Access-Delegation"] = this.accessDelegation), (await this.client.request({
      method: "POST",
      path: `${this.prefix}/namespaces/${Ie(t.namespace)}/tables`,
      body: e,
      headers: r
    })).data.metadata;
  }
  async updateTable(t, e) {
    const r = await this.client.request({
      method: "POST",
      path: `${this.prefix}/namespaces/${Ie(t.namespace)}/tables/${t.name}`,
      body: e
    });
    return {
      "metadata-location": r.data["metadata-location"],
      metadata: r.data.metadata
    };
  }
  async dropTable(t, e) {
    await this.client.request({
      method: "DELETE",
      path: `${this.prefix}/namespaces/${Ie(t.namespace)}/tables/${t.name}`,
      query: { purgeRequested: String(e?.purge ?? !1) }
    });
  }
  async loadTable(t) {
    const e = {};
    return this.accessDelegation && (e["X-Iceberg-Access-Delegation"] = this.accessDelegation), (await this.client.request({
      method: "GET",
      path: `${this.prefix}/namespaces/${Ie(t.namespace)}/tables/${t.name}`,
      headers: e
    })).data.metadata;
  }
  async tableExists(t) {
    const e = {};
    this.accessDelegation && (e["X-Iceberg-Access-Delegation"] = this.accessDelegation);
    try {
      return await this.client.request({
        method: "HEAD",
        path: `${this.prefix}/namespaces/${Ie(t.namespace)}/tables/${t.name}`,
        headers: e
      }), !0;
    } catch (r) {
      if (r instanceof nt && r.status === 404)
        return !1;
      throw r;
    }
  }
  async createTableIfNotExists(t, e) {
    try {
      return await this.createTable(t, e);
    } catch (r) {
      if (r instanceof nt && r.status === 409)
        return await this.loadTable({ namespace: t.namespace, name: e.name });
      throw r;
    }
  }
}, Pi = class {
  /**
   * Creates a new Iceberg REST Catalog client.
   *
   * @param options - Configuration options for the catalog client
   */
  constructor(t) {
    let e = "v1";
    t.catalogName && (e += `/${t.catalogName}`);
    const r = t.baseUrl.endsWith("/") ? t.baseUrl : `${t.baseUrl}/`;
    this.client = Ri({
      baseUrl: r,
      auth: t.auth,
      fetchImpl: t.fetch
    }), this.accessDelegation = t.accessDelegation?.join(","), this.namespaceOps = new Oi(this.client, e), this.tableOps = new Mi(this.client, e, this.accessDelegation);
  }
  /**
   * Lists all namespaces in the catalog.
   *
   * @param parent - Optional parent namespace to list children under
   * @returns Array of namespace identifiers
   *
   * @example
   * ```typescript
   * // List all top-level namespaces
   * const namespaces = await catalog.listNamespaces();
   *
   * // List namespaces under a parent
   * const children = await catalog.listNamespaces({ namespace: ['analytics'] });
   * ```
   */
  async listNamespaces(t) {
    return this.namespaceOps.listNamespaces(t);
  }
  /**
   * Creates a new namespace in the catalog.
   *
   * @param id - Namespace identifier to create
   * @param metadata - Optional metadata properties for the namespace
   * @returns Response containing the created namespace and its properties
   *
   * @example
   * ```typescript
   * const response = await catalog.createNamespace(
   *   { namespace: ['analytics'] },
   *   { properties: { owner: 'data-team' } }
   * );
   * console.log(response.namespace); // ['analytics']
   * console.log(response.properties); // { owner: 'data-team', ... }
   * ```
   */
  async createNamespace(t, e) {
    return this.namespaceOps.createNamespace(t, e);
  }
  /**
   * Drops a namespace from the catalog.
   *
   * The namespace must be empty (contain no tables) before it can be dropped.
   *
   * @param id - Namespace identifier to drop
   *
   * @example
   * ```typescript
   * await catalog.dropNamespace({ namespace: ['analytics'] });
   * ```
   */
  async dropNamespace(t) {
    await this.namespaceOps.dropNamespace(t);
  }
  /**
   * Loads metadata for a namespace.
   *
   * @param id - Namespace identifier to load
   * @returns Namespace metadata including properties
   *
   * @example
   * ```typescript
   * const metadata = await catalog.loadNamespaceMetadata({ namespace: ['analytics'] });
   * console.log(metadata.properties);
   * ```
   */
  async loadNamespaceMetadata(t) {
    return this.namespaceOps.loadNamespaceMetadata(t);
  }
  /**
   * Lists all tables in a namespace.
   *
   * @param namespace - Namespace identifier to list tables from
   * @returns Array of table identifiers
   *
   * @example
   * ```typescript
   * const tables = await catalog.listTables({ namespace: ['analytics'] });
   * console.log(tables); // [{ namespace: ['analytics'], name: 'events' }, ...]
   * ```
   */
  async listTables(t) {
    return this.tableOps.listTables(t);
  }
  /**
   * Creates a new table in the catalog.
   *
   * @param namespace - Namespace to create the table in
   * @param request - Table creation request including name, schema, partition spec, etc.
   * @returns Table metadata for the created table
   *
   * @example
   * ```typescript
   * const metadata = await catalog.createTable(
   *   { namespace: ['analytics'] },
   *   {
   *     name: 'events',
   *     schema: {
   *       type: 'struct',
   *       fields: [
   *         { id: 1, name: 'id', type: 'long', required: true },
   *         { id: 2, name: 'timestamp', type: 'timestamp', required: true }
   *       ],
   *       'schema-id': 0
   *     },
   *     'partition-spec': {
   *       'spec-id': 0,
   *       fields: [
   *         { source_id: 2, field_id: 1000, name: 'ts_day', transform: 'day' }
   *       ]
   *     }
   *   }
   * );
   * ```
   */
  async createTable(t, e) {
    return this.tableOps.createTable(t, e);
  }
  /**
   * Updates an existing table's metadata.
   *
   * Can update the schema, partition spec, or properties of a table.
   *
   * @param id - Table identifier to update
   * @param request - Update request with fields to modify
   * @returns Response containing the metadata location and updated table metadata
   *
   * @example
   * ```typescript
   * const response = await catalog.updateTable(
   *   { namespace: ['analytics'], name: 'events' },
   *   {
   *     properties: { 'read.split.target-size': '134217728' }
   *   }
   * );
   * console.log(response['metadata-location']); // s3://...
   * console.log(response.metadata); // TableMetadata object
   * ```
   */
  async updateTable(t, e) {
    return this.tableOps.updateTable(t, e);
  }
  /**
   * Drops a table from the catalog.
   *
   * @param id - Table identifier to drop
   *
   * @example
   * ```typescript
   * await catalog.dropTable({ namespace: ['analytics'], name: 'events' });
   * ```
   */
  async dropTable(t, e) {
    await this.tableOps.dropTable(t, e);
  }
  /**
   * Loads metadata for a table.
   *
   * @param id - Table identifier to load
   * @returns Table metadata including schema, partition spec, location, etc.
   *
   * @example
   * ```typescript
   * const metadata = await catalog.loadTable({ namespace: ['analytics'], name: 'events' });
   * console.log(metadata.schema);
   * console.log(metadata.location);
   * ```
   */
  async loadTable(t) {
    return this.tableOps.loadTable(t);
  }
  /**
   * Checks if a namespace exists in the catalog.
   *
   * @param id - Namespace identifier to check
   * @returns True if the namespace exists, false otherwise
   *
   * @example
   * ```typescript
   * const exists = await catalog.namespaceExists({ namespace: ['analytics'] });
   * console.log(exists); // true or false
   * ```
   */
  async namespaceExists(t) {
    return this.namespaceOps.namespaceExists(t);
  }
  /**
   * Checks if a table exists in the catalog.
   *
   * @param id - Table identifier to check
   * @returns True if the table exists, false otherwise
   *
   * @example
   * ```typescript
   * const exists = await catalog.tableExists({ namespace: ['analytics'], name: 'events' });
   * console.log(exists); // true or false
   * ```
   */
  async tableExists(t) {
    return this.tableOps.tableExists(t);
  }
  /**
   * Creates a namespace if it does not exist.
   *
   * If the namespace already exists, returns void. If created, returns the response.
   *
   * @param id - Namespace identifier to create
   * @param metadata - Optional metadata properties for the namespace
   * @returns Response containing the created namespace and its properties, or void if it already exists
   *
   * @example
   * ```typescript
   * const response = await catalog.createNamespaceIfNotExists(
   *   { namespace: ['analytics'] },
   *   { properties: { owner: 'data-team' } }
   * );
   * if (response) {
   *   console.log('Created:', response.namespace);
   * } else {
   *   console.log('Already exists');
   * }
   * ```
   */
  async createNamespaceIfNotExists(t, e) {
    return this.namespaceOps.createNamespaceIfNotExists(t, e);
  }
  /**
   * Creates a table if it does not exist.
   *
   * If the table already exists, returns its metadata instead.
   *
   * @param namespace - Namespace to create the table in
   * @param request - Table creation request including name, schema, partition spec, etc.
   * @returns Table metadata for the created or existing table
   *
   * @example
   * ```typescript
   * const metadata = await catalog.createTableIfNotExists(
   *   { namespace: ['analytics'] },
   *   {
   *     name: 'events',
   *     schema: {
   *       type: 'struct',
   *       fields: [
   *         { id: 1, name: 'id', type: 'long', required: true },
   *         { id: 2, name: 'timestamp', type: 'timestamp', required: true }
   *       ],
   *       'schema-id': 0
   *     }
   *   }
   * );
   * ```
   */
  async createTableIfNotExists(t, e) {
    return this.tableOps.createTableIfNotExists(t, e);
  }
};
function it(t) {
  "@babel/helpers - typeof";
  return it = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
    return typeof e;
  } : function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, it(t);
}
function Ci(t, e) {
  if (it(t) != "object" || !t) return t;
  var r = t[Symbol.toPrimitive];
  if (r !== void 0) {
    var s = r.call(t, e);
    if (it(s) != "object") return s;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
function Ii(t) {
  var e = Ci(t, "string");
  return it(e) == "symbol" ? e : e + "";
}
function $i(t, e, r) {
  return (e = Ii(e)) in t ? Object.defineProperty(t, e, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : t[e] = r, t;
}
function qr(t, e) {
  var r = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var s = Object.getOwnPropertySymbols(t);
    e && (s = s.filter(function(n) {
      return Object.getOwnPropertyDescriptor(t, n).enumerable;
    })), r.push.apply(r, s);
  }
  return r;
}
function M(t) {
  for (var e = 1; e < arguments.length; e++) {
    var r = arguments[e] != null ? arguments[e] : {};
    e % 2 ? qr(Object(r), !0).forEach(function(s) {
      $i(t, s, r[s]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(r)) : qr(Object(r)).forEach(function(s) {
      Object.defineProperty(t, s, Object.getOwnPropertyDescriptor(r, s));
    });
  }
  return t;
}
var Vt = class extends Error {
  constructor(t, e = "storage", r, s) {
    super(t), this.__isStorageError = !0, this.namespace = e, this.name = e === "vectors" ? "StorageVectorsError" : "StorageError", this.status = r, this.statusCode = s;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      statusCode: this.statusCode
    };
  }
};
function zt(t) {
  return typeof t == "object" && t !== null && "__isStorageError" in t;
}
var gr = class extends Vt {
  constructor(t, e, r, s = "storage", n) {
    super(t, s, e, r), this.name = s === "vectors" ? "StorageVectorsApiError" : "StorageApiError", this.status = e, this.statusCode = r, this.code = n;
  }
  toJSON() {
    return M(M({}, super.toJSON()), {}, { code: this.code });
  }
}, Us = class extends Vt {
  constructor(t, e, r = "storage") {
    super(t, r), this.name = r === "vectors" ? "StorageVectorsUnknownError" : "StorageUnknownError", this.originalError = e;
  }
};
function Pt(t, e, r) {
  const s = M({}, t), n = e.toLowerCase();
  for (const i of Object.keys(s)) i.toLowerCase() === n && delete s[i];
  return s[n] = r, s;
}
function ji(t) {
  const e = {};
  for (const [r, s] of Object.entries(t)) e[r.toLowerCase()] = s;
  return e;
}
const Li = (t) => t ? (...e) => t(...e) : (...e) => fetch(...e), Ni = (t) => {
  if (typeof t != "object" || t === null) return !1;
  const e = Object.getPrototypeOf(t);
  return (e === null || e === Object.prototype || Object.getPrototypeOf(e) === null) && !(Symbol.toStringTag in t) && !(Symbol.iterator in t);
}, mr = (t) => {
  if (Array.isArray(t)) return t.map((r) => mr(r));
  if (typeof t == "function" || t !== Object(t)) return t;
  const e = {};
  return Object.entries(t).forEach(([r, s]) => {
    const n = r.replace(/([-_][a-z])/gi, (i) => i.toUpperCase().replace(/[-_]/g, ""));
    e[n] = mr(s);
  }), e;
}, Di = (t) => !t || typeof t != "string" || t.length === 0 || t.length > 100 || t.trim() !== t || t.includes("/") || t.includes("\\") ? !1 : /^[\w!.\*'() &$@=;:+,?-]+$/.test(t), yr = (t) => t.split("/").map(encodeURIComponent).join("/"), Wr = (t) => {
  if (typeof t == "object" && t !== null) {
    const e = t;
    if (typeof e.msg == "string") return e.msg;
    if (typeof e.message == "string") return e.message;
    if (typeof e.error_description == "string") return e.error_description;
    if (typeof e.error == "string") return e.error;
    if (typeof e.error == "object" && e.error !== null) {
      const r = e.error;
      if (typeof r.message == "string") return r.message;
    }
  }
  return JSON.stringify(t);
}, Fi = async (t, e, r, s) => {
  if (t !== null && typeof t == "object" && "json" in t && typeof t.json == "function") {
    const n = t;
    let i = parseInt(String(n.status), 10);
    Number.isFinite(i) || (i = 500), n.json().then((a) => {
      const l = a?.statusCode || a?.code || i + "";
      e(new gr(Wr(a), i, l, s, a?.code));
    }).catch(() => {
      const a = i + "";
      e(new gr(n.statusText || `HTTP ${i} error`, i, a, s));
    });
  } else e(new Us(Wr(t), t, s));
}, Bi = (t, e, r, s) => {
  const n = {
    method: t,
    headers: e?.headers || {}
  };
  if (t === "GET" || t === "HEAD" || !s) return M(M({}, n), r);
  if (Ni(s)) {
    var i;
    const a = e?.headers || {};
    let l;
    for (const [h, o] of Object.entries(a)) h.toLowerCase() === "content-type" && (l = o);
    n.headers = Pt(a, "Content-Type", (i = l) !== null && i !== void 0 ? i : "application/json"), n.body = JSON.stringify(s);
  } else n.body = s;
  return e?.duplex && (n.duplex = e.duplex), M(M({}, n), r);
};
async function Ge(t, e, r, s, n, i, a) {
  return new Promise((l, h) => {
    t(r, Bi(e, s, n, i)).then((o) => {
      if (!o.ok) throw o;
      if (s?.noResolveJson) return o;
      if (a === "vectors") {
        const c = o.headers.get("content-type");
        if (o.headers.get("content-length") === "0" || o.status === 204) return {};
        if (!c || !c.includes("application/json")) return {};
      }
      return o.json();
    }).then((o) => l(o)).catch((o) => Fi(o, h, s, a));
  });
}
function Hs(t = "storage") {
  return {
    get: async (e, r, s, n) => Ge(e, "GET", r, s, n, void 0, t),
    post: async (e, r, s, n, i) => Ge(e, "POST", r, n, i, s, t),
    put: async (e, r, s, n, i) => Ge(e, "PUT", r, n, i, s, t),
    head: async (e, r, s, n) => Ge(e, "HEAD", r, M(M({}, s), {}, { noResolveJson: !0 }), n, void 0, t),
    remove: async (e, r, s, n, i) => Ge(e, "DELETE", r, n, i, s, t)
  };
}
const Ui = Hs("storage"), { get: He, post: ae, put: Ct, head: Hi, remove: qe } = Ui, re = Hs("vectors");
var Ve = class {
  /**
  * Creates a new BaseApiClient instance
  * @param url - Base URL for API requests
  * @param headers - Default headers for API requests
  * @param fetch - Optional custom fetch implementation
  * @param namespace - Error namespace ('storage' or 'vectors')
  */
  constructor(t, e = {}, r, s = "storage") {
    this.shouldThrowOnError = !1, this.url = t, this.headers = ji(e), this.fetch = Li(r), this.namespace = s;
  }
  /**
  * Enable throwing errors instead of returning them.
  * When enabled, errors are thrown instead of returned in { data, error } format.
  *
  * @returns this - For method chaining
  */
  throwOnError() {
    return this.shouldThrowOnError = !0, this;
  }
  /**
  * Set an HTTP header for the request.
  * Creates a shallow copy of headers to avoid mutating shared state.
  *
  * @param name - Header name
  * @param value - Header value
  * @returns this - For method chaining
  */
  setHeader(t, e) {
    return this.headers = Pt(this.headers, t, e), this;
  }
  /**
  * Handles API operation with standardized error handling
  * Eliminates repetitive try-catch blocks across all API methods
  *
  * This wrapper:
  * 1. Executes the operation
  * 2. Returns { data, error: null } on success
  * 3. Returns { data: null, error } on failure (if shouldThrowOnError is false)
  * 4. Throws error on failure (if shouldThrowOnError is true)
  *
  * @typeParam T - The expected data type from the operation
  * @param operation - Async function that performs the API call
  * @returns Promise with { data, error } tuple
  *
  * @example Handling an operation
  * ```typescript
  * async listBuckets() {
  *   return this.handleOperation(async () => {
  *     return await get(this.fetch, `${this.url}/bucket`, {
  *       headers: this.headers,
  *     })
  *   })
  * }
  * ```
  */
  async handleOperation(t) {
    var e = this;
    try {
      return {
        data: await t(),
        error: null
      };
    } catch (r) {
      if (e.shouldThrowOnError) throw r;
      if (zt(r)) return {
        data: null,
        error: r
      };
      throw r;
    }
  }
};
let qs;
qs = Symbol.toStringTag;
var qi = class {
  constructor(t, e) {
    this.downloadFn = t, this.shouldThrowOnError = e, this[qs] = "StreamDownloadBuilder", this.promise = null;
  }
  then(t, e) {
    return this.getPromise().then(t, e);
  }
  catch(t) {
    return this.getPromise().catch(t);
  }
  finally(t) {
    return this.getPromise().finally(t);
  }
  getPromise() {
    return this.promise || (this.promise = this.execute()), this.promise;
  }
  async execute() {
    var t = this;
    try {
      return {
        data: (await t.downloadFn()).body,
        error: null
      };
    } catch (e) {
      if (t.shouldThrowOnError) throw e;
      if (zt(e)) return {
        data: null,
        error: e
      };
      throw e;
    }
  }
};
let Ws;
Ws = Symbol.toStringTag;
var Wi = class {
  constructor(t, e) {
    this.downloadFn = t, this.shouldThrowOnError = e, this[Ws] = "BlobDownloadBuilder", this.promise = null;
  }
  asStream() {
    return new qi(this.downloadFn, this.shouldThrowOnError);
  }
  then(t, e) {
    return this.getPromise().then(t, e);
  }
  catch(t) {
    return this.getPromise().catch(t);
  }
  finally(t) {
    return this.getPromise().finally(t);
  }
  getPromise() {
    return this.promise || (this.promise = this.execute()), this.promise;
  }
  async execute() {
    var t = this;
    try {
      return {
        data: await (await t.downloadFn()).blob(),
        error: null
      };
    } catch (e) {
      if (t.shouldThrowOnError) throw e;
      if (zt(e)) return {
        data: null,
        error: e
      };
      throw e;
    }
  }
};
const Yt = {
  limit: 100,
  offset: 0,
  sortBy: {
    column: "name",
    order: "asc"
  }
}, Kr = {
  cacheControl: "3600",
  contentType: "text/plain;charset=UTF-8",
  upsert: !1
};
var Ki = class extends Ve {
  constructor(t, e = {}, r, s) {
    super(t, e, s, "storage"), this.bucketId = r;
  }
  /**
  * Uploads a file to an existing bucket or replaces an existing file at the specified path with a new one.
  *
  * @param method HTTP method.
  * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
  * @param fileBody The body of the file to be stored in the bucket.
  */
  async uploadOrUpdate(t, e, r, s) {
    var n = this;
    return n.handleOperation(async () => {
      let i;
      const a = M(M({}, Kr), s);
      let l = M(M({}, n.headers), t === "POST" && { "x-upsert": String(a.upsert) });
      const h = a.metadata;
      if (typeof Blob < "u" && r instanceof Blob || typeof FormData < "u" && r instanceof FormData ? i = n.prepareUploadFormData(r, a) : (i = r, l["cache-control"] = `max-age=${a.cacheControl}`, l["content-type"] = a.contentType, h && (l["x-metadata"] = n.toBase64(n.encodeMetadata(h))), (typeof ReadableStream < "u" && i instanceof ReadableStream || i && typeof i == "object" && "pipe" in i && typeof i.pipe == "function") && !a.duplex && (a.duplex = "half")), s?.headers) for (const [d, f] of Object.entries(s.headers)) l = Pt(l, d, f);
      const o = n._removeEmptyFolders(e), c = n._getFinalPath(o), u = await (t == "PUT" ? Ct : ae)(n.fetch, `${n.url}/object/${c}`, i, M({ headers: l }, a?.duplex ? { duplex: a.duplex } : {}));
      return {
        path: o,
        id: u.Id,
        fullPath: u.Key
      };
    });
  }
  /**
  * Uploads a file to an existing bucket.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
  * @param fileBody The body of the file to be stored in the bucket.
  * @param fileOptions Optional file upload options including cacheControl, contentType, upsert, and metadata.
  * @returns Promise with response containing file path, id, and fullPath or error
  *
  * @example Upload file
  * ```js
  * const avatarFile = event.target.files[0]
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .upload('public/avatar1.png', avatarFile, {
  *     cacheControl: '3600',
  *     upsert: false
  *   })
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "path": "public/avatar1.png",
  *     "fullPath": "avatars/public/avatar1.png"
  *   },
  *   "error": null
  * }
  * ```
  *
  * @example Upload file using `ArrayBuffer` from base64 file data
  * ```js
  * import { decode } from 'base64-arraybuffer'
  *
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .upload('public/avatar1.png', decode('base64FileData'), {
  *     contentType: 'image/png'
  *   })
  * ```
  *
  * @example Handling errors
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .upload('public/avatar1.png', avatarFile)
  *
  * if (error) {
  *   // Log the full error so fields like `statusCode` and `error` (the
  *   // Storage error name, e.g. "Duplicate") aren't hidden behind `error.message`.
  *   console.error(error)
  *   return
  * }
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: none
  *   - `objects` table permissions: only `insert` when you are uploading new files and `select`, `insert` and `update` when you are upserting files
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  * - For React Native, using either `Blob`, `File` or `FormData` does not work as intended. Upload file using `ArrayBuffer` from base64 file data instead, see example below.
  */
  async upload(t, e, r) {
    return this.uploadOrUpdate("POST", t, e, r);
  }
  /**
  * Upload a file with a token generated from `createSignedUploadUrl`.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
  * @param token The token generated from `createSignedUploadUrl`
  * @param fileBody The body of the file to be stored in the bucket.
  * @param fileOptions HTTP headers (cacheControl, contentType, etc.).
  * **Note:** The `upsert` option has no effect here. To enable upsert behavior,
  * pass `{ upsert: true }` when calling `createSignedUploadUrl()` instead.
  * @returns Promise with response containing file path and fullPath or error
  *
  * @example Upload to a signed URL
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .uploadToSignedUrl('folder/cat.jpg', 'token-from-createSignedUploadUrl', file)
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "path": "folder/cat.jpg",
  *     "fullPath": "avatars/folder/cat.jpg"
  *   },
  *   "error": null
  * }
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: none
  *   - `objects` table permissions: none
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  */
  async uploadToSignedUrl(t, e, r, s) {
    var n = this;
    const i = n._removeEmptyFolders(t), a = n._getFinalPath(i), l = new URL(n.url + `/object/upload/sign/${a}`);
    return l.searchParams.set("token", e), n.handleOperation(async () => {
      let h;
      const o = M(M({}, Kr), s);
      let c = M(M({}, n.headers), { "x-upsert": String(o.upsert) });
      const u = o.metadata;
      if (typeof Blob < "u" && r instanceof Blob || typeof FormData < "u" && r instanceof FormData ? h = n.prepareUploadFormData(r, o) : (h = r, c["cache-control"] = `max-age=${o.cacheControl}`, c["content-type"] = o.contentType, u && (c["x-metadata"] = n.toBase64(n.encodeMetadata(u))), (typeof ReadableStream < "u" && h instanceof ReadableStream || h && typeof h == "object" && "pipe" in h && typeof h.pipe == "function") && !o.duplex && (o.duplex = "half")), s?.headers) for (const [d, f] of Object.entries(s.headers)) c = Pt(c, d, f);
      return {
        path: i,
        fullPath: (await Ct(n.fetch, l.toString(), h, M({ headers: c }, o?.duplex ? { duplex: o.duplex } : {}))).Key
      };
    });
  }
  /**
  * Creates a signed upload URL.
  * Signed upload URLs can be used to upload files to the bucket without further authentication.
  * They are valid for 2 hours.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param path The file path, including the current file name. For example `folder/image.png`.
  * @param options.upsert If set to true, allows the file to be overwritten if it already exists.
  * @returns Promise with response containing signed upload URL, token, and path or error
  *
  * @example Create Signed Upload URL
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .createSignedUploadUrl('folder/cat.jpg')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "signedUrl": "https://example.supabase.co/storage/v1/object/upload/sign/avatars/folder/cat.jpg?token=<TOKEN>",
  *     "path": "folder/cat.jpg",
  *     "token": "<TOKEN>"
  *   },
  *   "error": null
  * }
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: none
  *   - `objects` table permissions: `insert`
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  */
  async createSignedUploadUrl(t, e) {
    var r = this;
    return r.handleOperation(async () => {
      let s = r._getFinalPath(t);
      const n = M({}, r.headers);
      e?.upsert && (n["x-upsert"] = "true");
      const i = await ae(r.fetch, `${r.url}/object/upload/sign/${s}`, {}, { headers: n }), a = new URL(r.url + i.url), l = a.searchParams.get("token");
      if (!l) throw new Vt("No token returned by API");
      return {
        signedUrl: a.toString(),
        path: t,
        token: l
      };
    });
  }
  /**
  * Replaces an existing file at the specified path with a new one.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to update.
  * @param fileBody The body of the file to be stored in the bucket.
  * @param fileOptions Optional file upload options including cacheControl, contentType, and metadata.
  * **Note:** The `upsert` option has no effect here. `update()` always replaces the
  * file at the given path, so the `x-upsert` header is not sent. To control upsert
  * behavior, use `upload()` instead.
  * @returns Promise with response containing file path, id, and fullPath or error
  *
  * @example Update file
  * ```js
  * const avatarFile = event.target.files[0]
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .update('public/avatar1.png', avatarFile, {
  *     cacheControl: '3600'
  *   })
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "path": "public/avatar1.png",
  *     "fullPath": "avatars/public/avatar1.png"
  *   },
  *   "error": null
  * }
  * ```
  *
  * @example Update file using `ArrayBuffer` from base64 file data
  * ```js
  * import {decode} from 'base64-arraybuffer'
  *
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .update('public/avatar1.png', decode('base64FileData'), {
  *     contentType: 'image/png'
  *   })
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: none
  *   - `objects` table permissions: `update` and `select`
  * - `update()` always replaces the file at the given path regardless of the `upsert` option.
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  * - For React Native, using either `Blob`, `File` or `FormData` does not work as intended. Update file using `ArrayBuffer` from base64 file data instead, see example below.
  */
  async update(t, e, r) {
    return this.uploadOrUpdate("PUT", t, e, r);
  }
  /**
  * Moves an existing file to a new path in the same bucket.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
  * @param toPath The new file path, including the new file name. For example `folder/image-new.png`.
  * @param options The destination options.
  * @param options.sourceVersionId The version id of the source object to move.
  * @returns Promise with response containing success message or error
  *
  * @example Move file
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .move('public/avatar1.png', 'private/avatar2.png')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "message": "Successfully moved"
  *   },
  *   "error": null
  * }
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: none
  *   - `objects` table permissions: `update` and `select`
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  */
  async move(t, e, r) {
    var s = this;
    return s.handleOperation(async () => await ae(s.fetch, `${s.url}/object/move`, {
      bucketId: s.bucketId,
      sourceKey: t,
      destinationKey: e,
      destinationBucket: r?.destinationBucket,
      sourceVersionId: r?.sourceVersionId
    }, { headers: s.headers }));
  }
  /**
  * Copies an existing file to a new path in the same bucket.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
  * @param toPath The new file path, including the new file name. For example `folder/image-copy.png`.
  * @param options The destination options.
  * @param options.sourceVersionId The version id of the source object to copy.
  * @returns Promise with response containing copied file path or error
  *
  * @example Copy file
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .copy('public/avatar1.png', 'private/avatar2.png')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "path": "avatars/private/avatar2.png"
  *   },
  *   "error": null
  * }
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: none
  *   - `objects` table permissions: `insert` and `select`
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  */
  async copy(t, e, r) {
    var s = this;
    return s.handleOperation(async () => ({ path: (await ae(s.fetch, `${s.url}/object/copy`, {
      bucketId: s.bucketId,
      sourceKey: t,
      destinationKey: e,
      destinationBucket: r?.destinationBucket,
      sourceVersionId: r?.sourceVersionId
    }, { headers: s.headers })).Key }));
  }
  /**
  * Creates a signed URL. Use a signed URL to share a file for a fixed amount of time.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param path The file path, including the current file name. For example `folder/image.png`.
  * @param expiresIn The number of seconds until the signed URL expires. For example, `60` for a URL which is valid for one minute.
  * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
  * @param options.transform Transform the asset before serving it to the client.
  * @param options.cacheNonce Append a cache nonce parameter to the URL to invalidate the cache.
  * @param options.versionId Create a signed URL for a specific object version rather than the current one.
  * @returns Promise with response containing signed URL or error
  *
  * @example Create Signed URL
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .createSignedUrl('folder/avatar1.png', 60)
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar1.png?token=<TOKEN>"
  *   },
  *   "error": null
  * }
  * ```
  *
  * @example Create a signed URL for an asset with transformations
  * ```js
  * const { data } = await supabase
  *   .storage
  *   .from('avatars')
  *   .createSignedUrl('folder/avatar1.png', 60, {
  *     transform: {
  *       width: 100,
  *       height: 100,
  *     }
  *   })
  * ```
  *
  * @example Create a signed URL which triggers the download of the asset
  * ```js
  * const { data } = await supabase
  *   .storage
  *   .from('avatars')
  *   .createSignedUrl('folder/avatar1.png', 60, {
  *     download: true,
  *   })
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: none
  *   - `objects` table permissions: `select`
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  */
  async createSignedUrl(t, e, r) {
    var s = this;
    return s.handleOperation(async () => {
      let n = s._getFinalPath(t);
      const i = typeof r?.transform == "object" && r.transform !== null && Object.keys(r.transform).length > 0;
      let a = await ae(s.fetch, `${s.url}/object/sign/${n}`, M(M({ expiresIn: e }, i ? { transform: r.transform } : {}), r?.versionId != null ? { versionId: r.versionId } : {}), { headers: s.headers });
      const l = new URLSearchParams();
      r?.download && l.set("download", r.download === !0 ? "" : r.download), r?.cacheNonce != null && l.set("cacheNonce", String(r.cacheNonce));
      const h = l.toString();
      return { signedUrl: encodeURI(`${s.url}${a.signedURL}${h ? `&${h}` : ""}`) };
    });
  }
  /**
  * Creates multiple signed URLs. Use a signed URL to share a file for a fixed amount of time.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param paths The file paths to be downloaded, including the current file names. For example `['folder/image.png', 'folder2/image2.png']`.
  * @param expiresIn The number of seconds until the signed URLs expire. For example, `60` for URLs which are valid for one minute.
  * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
  * @param options.cacheNonce Append a cache nonce parameter to the URL to invalidate the cache.
  * @returns Promise with response containing array of objects with signedUrl, path, and error or error
  *
  * @example Create Signed URLs
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .createSignedUrls(['folder/avatar1.png', 'folder/avatar2.png'], 60)
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": [
  *     {
  *       "error": null,
  *       "path": "folder/avatar1.png",
  *       "signedURL": "/object/sign/avatars/folder/avatar1.png?token=<TOKEN>",
  *       "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar1.png?token=<TOKEN>"
  *     },
  *     {
  *       "error": null,
  *       "path": "folder/avatar2.png",
  *       "signedURL": "/object/sign/avatars/folder/avatar2.png?token=<TOKEN>",
  *       "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar2.png?token=<TOKEN>"
  *     }
  *   ],
  *   "error": null
  * }
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: none
  *   - `objects` table permissions: `select`
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  */
  async createSignedUrls(t, e, r) {
    var s = this;
    return s.handleOperation(async () => {
      const n = await ae(s.fetch, `${s.url}/object/sign/${s.bucketId}`, {
        expiresIn: e,
        paths: t
      }, { headers: s.headers }), i = new URLSearchParams();
      r?.download && i.set("download", r.download === !0 ? "" : r.download), r?.cacheNonce != null && i.set("cacheNonce", String(r.cacheNonce));
      const a = i.toString();
      return n.map((l) => M(M({}, l), {}, { signedUrl: l.signedURL ? encodeURI(`${s.url}${l.signedURL}${a ? `&${a}` : ""}`) : null }));
    });
  }
  /**
  * Downloads a file from a private bucket. For public buckets, make a request to the URL returned from `getPublicUrl` instead.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param path The full path and file name of the file to be downloaded. For example `folder/image.png`.
  * @param options Optional settings: `transform` to transform the asset before serving it to the client, `cacheNonce` to append a cache nonce parameter to the URL to invalidate the cache, and `versionId` to download a specific object version.
  * @param parameters Additional fetch parameters like signal for cancellation. Supports standard fetch options including cache control.
  * @returns BlobDownloadBuilder instance for downloading the file
  *
  * @example Download file
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .download('folder/avatar1.png')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": <BLOB>,
  *   "error": null
  * }
  * ```
  *
  * @example Download file with transformations
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .download('folder/avatar1.png', {
  *     transform: {
  *       width: 100,
  *       height: 100,
  *       quality: 80
  *     }
  *   })
  * ```
  *
  * @example Download with cache control (useful in Edge Functions)
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .download('folder/avatar1.png', {}, { cache: 'no-store' })
  * ```
  *
  * @example Download with abort signal
  * ```js
  * const controller = new AbortController()
  * setTimeout(() => controller.abort(), 5000)
  *
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .download('folder/avatar1.png', {}, { signal: controller.signal })
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: none
  *   - `objects` table permissions: `select`
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  */
  download(t, e, r) {
    const s = typeof e?.transform == "object" && e.transform !== null && Object.keys(e.transform).length > 0 ? "render/image/authenticated" : "object", n = new URLSearchParams();
    e?.transform && this.applyTransformOptsToQuery(n, e.transform), e?.cacheNonce != null && n.set("cacheNonce", String(e.cacheNonce)), e?.versionId != null && n.set("versionId", String(e.versionId));
    const i = n.toString(), a = this._getFinalPath(t), l = () => He(this.fetch, `${this.url}/${s}/${a}${i ? `?${i}` : ""}`, {
      headers: this.headers,
      noResolveJson: !0
    }, r);
    return new Wi(l, this.shouldThrowOnError);
  }
  /**
  * Retrieves the details of an existing file.
  *
  * Returns detailed file metadata including size, content type, and timestamps.
  * Note: The API returns `last_modified` field, not `updated_at`.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param path The file path, including the file name. For example `folder/image.png`.
  * @param options Optional settings, including `versionId` to retrieve a specific object version.
  * @returns Promise with response containing file metadata or error
  *
  * @example Get file info
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .info('folder/avatar1.png')
  *
  * if (data) {
  *   console.log('Last modified:', data.lastModified)
  *   console.log('Size:', data.size)
  * }
  * ```
  */
  async info(t, e) {
    var r = this;
    const s = r._getFinalPath(t), n = new URLSearchParams();
    e?.versionId != null && n.set("versionId", String(e.versionId));
    const i = n.toString();
    return r.handleOperation(async () => mr(await He(r.fetch, `${r.url}/object/info/${s}${i ? `?${i}` : ""}`, { headers: r.headers })));
  }
  /**
  * Checks the existence of a file.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param path The file path, including the file name. For example `folder/image.png`.
  * @returns Promise with response containing boolean indicating file existence or error
  *
  * @example Check file existence
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .exists('folder/avatar1.png')
  * ```
  */
  async exists(t) {
    var e = this;
    const r = e._getFinalPath(t);
    try {
      return await Hi(e.fetch, `${e.url}/object/${r}`, { headers: e.headers }), {
        data: !0,
        error: null
      };
    } catch (n) {
      if (e.shouldThrowOnError) throw n;
      if (zt(n)) {
        var s;
        const i = n instanceof gr ? n.status : n instanceof Us ? (s = n.originalError) === null || s === void 0 ? void 0 : s.status : void 0;
        if (i !== void 0 && [400, 404].includes(i)) return {
          data: !1,
          error: n
        };
      }
      throw n;
    }
  }
  /**
  * A simple convenience function to get the URL for an asset in a public bucket. If you do not want to use this function, you can construct the public URL by concatenating the bucket URL with the path to the asset.
  * This function does not verify if the bucket is public. If a public URL is created for a bucket which is not public, you will not be able to download the asset.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param path The path and name of the file to generate the public URL for. For example `folder/image.png`.
  * @param options.download Triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
  * @param options.transform Transform the asset before serving it to the client.
  * @param options.cacheNonce Append a cache nonce parameter to the URL to invalidate the cache.
  * @param options.versionId Return the URL for a specific object version rather than the current one.
  * @returns Object with public URL
  *
  * @example Returns the URL for an asset in a public bucket
  * ```js
  * const { data } = supabase
  *   .storage
  *   .from('public-bucket')
  *   .getPublicUrl('folder/avatar1.png')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "publicUrl": "https://example.supabase.co/storage/v1/object/public/public-bucket/folder/avatar1.png"
  *   }
  * }
  * ```
  *
  * @example Returns the URL for an asset in a public bucket with transformations
  * ```js
  * const { data } = supabase
  *   .storage
  *   .from('public-bucket')
  *   .getPublicUrl('folder/avatar1.png', {
  *     transform: {
  *       width: 100,
  *       height: 100,
  *     }
  *   })
  * ```
  *
  * @example Returns the URL which triggers the download of an asset in a public bucket
  * ```js
  * const { data } = supabase
  *   .storage
  *   .from('public-bucket')
  *   .getPublicUrl('folder/avatar1.png', {
  *     download: true,
  *   })
  * ```
  *
  * @remarks
  * - The bucket needs to be set to public, either via [updateBucket()](/docs/reference/javascript/storage-updatebucket) or by going to Storage on [supabase.com/dashboard](https://supabase.com/dashboard), clicking the overflow menu on a bucket and choosing "Make public"
  * - RLS policy permissions required:
  *   - `buckets` table permissions: none
  *   - `objects` table permissions: none
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  */
  getPublicUrl(t, e) {
    const r = this._getFinalPath(t), s = new URLSearchParams();
    e?.download && s.set("download", e.download === !0 ? "" : e.download), e?.transform && this.applyTransformOptsToQuery(s, e.transform), e?.cacheNonce != null && s.set("cacheNonce", String(e.cacheNonce)), e?.versionId != null && s.set("versionId", String(e.versionId));
    const n = s.toString(), i = typeof e?.transform == "object" && e.transform !== null && Object.keys(e.transform).length > 0 ? "render/image" : "object";
    return { data: { publicUrl: encodeURI(`${this.url}/${i}/public/${r}`) + (n ? `?${n}` : "") } };
  }
  /**
  * Deletes files within the same bucket
  *
  * Returns an array of FileObject entries for the deleted files. Note that deprecated
  * fields like `bucket_id` may or may not be present in the response - do not rely on them.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param paths An array of files to delete. Each entry is either a path (deletes whichever
  * version is currently at that path, e.g. `'folder/image.png'`), or `{ path, versionId }` to
  * delete an exact version current or archived (e.g. `{ path: 'folder/image.png', versionId: '...' }`).
  * @returns Promise with response containing array of deleted file objects or error
  *
  * @example Delete file
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .remove(['folder/avatar1.png'])
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": [],
  *   "error": null
  * }
  * ```
  *
  * @example Delete a specific object version
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .remove([{ path: 'folder/avatar1.png', versionId: 'noncurrent-version-id' }])
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: none
  *   - `objects` table permissions: `delete` and `select`
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  */
  async remove(t) {
    var e = this;
    return e.handleOperation(async () => await qe(e.fetch, `${e.url}/object/${e.bucketId}`, { prefixes: t }, { headers: e.headers }));
  }
  /**
  * Purges the CDN cache for a single object in this bucket.
  *
  * Maps to `DELETE /cdn/{bucket}/{path}` on the Storage API. The server
  * issues a CDN invalidation for the object and returns `{ message: 'success' }`.
  *
  * **Requires the `service_role` key.** The underlying endpoint enforces
  * `service_role` JWT — calls made with the anon key or a user JWT will be
  * rejected by the server.
  *
  * **Hosted CDN feature.** On self-hosted Supabase, the Storage service must
  * have `CDN_PURGE_ENDPOINT_URL` configured and the `purgeCache` tenant
  * feature enabled, otherwise the server returns an error.
  *
  * Operates on a single object path. There is no wildcard or recursion: pass
  * the exact path of the object you want invalidated.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param path The path (relative to the bucket) of the object to purge, e.g. `folder/avatar.png`.
  * @param options Optional purge cache options.
  * @param options.transformations If true, purges only transformations (resized/formatted variants), leaving the original cached file intact.
  * @param parameters Optional fetch parameters such as an `AbortController` signal.
  * @returns Promise with `{ data: { message }, error: null }` on success or `{ data: null, error }` on failure.
  *
  * @example Purge a single cached object
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .purgeCache('folder/avatar1.png')
  * ```
  *
  * @example Purge only transformations for a single object
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .purgeCache('folder/avatar1.png', { transformations: true })
  * ```
  */
  async purgeCache(t, e, r) {
    var s = this;
    return s.handleOperation(async () => {
      const n = yr(s._getFinalPath(t)), i = new URLSearchParams();
      e?.transformations && i.set("transformations", "true");
      const a = i.toString();
      return await qe(s.fetch, `${s.url}/cdn/${n}${a ? `?${a}` : ""}`, {}, { headers: s.headers }, r);
    });
  }
  /**
  * Get file metadata
  * @param id the file id to retrieve metadata
  */
  /**
  * Update file metadata
  * @param id the file id to update metadata
  * @param meta the new file metadata
  */
  /**
  * Lists all the files and folders within a path of the bucket.
  *
  * **Important:** For folder entries, fields like `id`, `updated_at`, `created_at`,
  * `last_accessed_at`, and `metadata` will be `null`. Only files have these fields populated.
  * Additionally, deprecated fields like `bucket_id`, `owner`, and `buckets` are NOT returned
  * by this method.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param path The folder path.
  * @param options Search options including limit (defaults to 100), offset, sortBy, and search
  * @param parameters Optional fetch parameters including signal for cancellation
  * @returns Promise with response containing array of files/folders or error
  *
  * @example List files in a bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .list('folder', {
  *     limit: 100,
  *     offset: 0,
  *     sortBy: { column: 'name', order: 'asc' },
  *   })
  *
  * // Handle files vs folders
  * data?.forEach(item => {
  *   if (item.id !== null) {
  *     // It's a file
  *     console.log('File:', item.name, 'Size:', item.metadata?.size)
  *   } else {
  *     // It's a folder
  *     console.log('Folder:', item.name)
  *   }
  * })
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": [
  *     {
  *       "name": "avatar1.png",
  *       "id": "e668cf7f-821b-4a2f-9dce-7dfa5dd1cfd2",
  *       "updated_at": "2024-05-22T23:06:05.580Z",
  *       "created_at": "2024-05-22T23:04:34.443Z",
  *       "last_accessed_at": "2024-05-22T23:04:34.443Z",
  *       "metadata": {
  *         "eTag": "\"c5e8c553235d9af30ef4f6e280790b92\"",
  *         "size": 32175,
  *         "mimetype": "image/png",
  *         "cacheControl": "max-age=3600",
  *         "lastModified": "2024-05-22T23:06:05.574Z",
  *         "contentLength": 32175,
  *         "httpStatusCode": 200
  *       }
  *     }
  *   ],
  *   "error": null
  * }
  * ```
  *
  * @example Search files in a bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .list('folder', {
  *     limit: 100,
  *     offset: 0,
  *     sortBy: { column: 'name', order: 'asc' },
  *     search: 'jon'
  *   })
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: none
  *   - `objects` table permissions: `select`
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  */
  async list(t, e, r) {
    var s = this;
    return s.handleOperation(async () => {
      const n = e?.sortBy ? M(M({}, Yt.sortBy), e.sortBy) : Yt.sortBy, i = M(M(M({}, Yt), e), {}, {
        sortBy: n,
        prefix: t || ""
      });
      return await ae(s.fetch, `${s.url}/object/list/${s.bucketId}`, i, { headers: s.headers }, r);
    });
  }
  /**
  * Lists all the files and folders within a bucket using the V2 API with pagination support.
  *
  * **Important:** Folder entries in the `folders` array only contain `name` and optionally `key` —
  * they have no `id`, timestamps, or `metadata` fields. Full file metadata is only available
  * on entries in the `objects` array.
  *
  * @experimental this method signature might change in the future
  *
  * @category Storage
  * @subcategory File Buckets
  * @param options Search options including prefix, cursor for pagination, limit, with_delimiter
  * @param parameters Optional fetch parameters including signal for cancellation
  * @returns Promise with response containing folders/objects arrays with pagination info or error
  *
  * @example List files with pagination
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .from('avatars')
  *   .listV2({
  *     prefix: 'folder/',
  *     limit: 100,
  *   })
  *
  * // Handle pagination
  * if (data?.hasNext) {
  *   const nextPage = await supabase
  *     .storage
  *     .from('avatars')
  *     .listV2({
  *       prefix: 'folder/',
  *       cursor: data.nextCursor,
  *     })
  * }
  *
  * // Handle files vs folders
  * data?.objects.forEach(file => {
  *   if (file.id !== null) {
  *     console.log('File:', file.name, 'Size:', file.metadata?.size)
  *   }
  * })
  * data?.folders.forEach(folder => {
  *   console.log('Folder:', folder.name)
  * })
  * ```
  */
  async listV2(t, e) {
    var r = this;
    return r.handleOperation(async () => {
      const s = M({}, t);
      return await ae(r.fetch, `${r.url}/object/list-v2/${r.bucketId}`, s, { headers: r.headers }, e);
    });
  }
  prepareUploadFormData(t, e) {
    const r = new FormData(), s = [];
    t instanceof FormData ? t.forEach((n, i) => {
      typeof n == "string" ? r.append(i, n) : s.push([i, n]);
    }) : s.push(["", t]), r.has("cacheControl") || r.append("cacheControl", e.cacheControl), e.metadata && !r.has("metadata") && r.append("metadata", this.encodeMetadata(e.metadata));
    for (const [n, i] of s) r.append(n, i);
    return r;
  }
  encodeMetadata(t) {
    return JSON.stringify(t);
  }
  toBase64(t) {
    return typeof Buffer < "u" ? Buffer.from(t).toString("base64") : btoa(t);
  }
  _getFinalPath(t) {
    return `${this.bucketId}/${t.replace(/^\/+/, "")}`;
  }
  _removeEmptyFolders(t) {
    return t.replace(/^\/|\/$/g, "").replace(/\/+/g, "/");
  }
  /** Modifies the `query`, appending values the from `transform` */
  applyTransformOptsToQuery(t, e) {
    return e.width && t.set("width", e.width.toString()), e.height && t.set("height", e.height.toString()), e.resize && t.set("resize", e.resize), e.format && t.set("format", e.format), e.quality && t.set("quality", e.quality.toString()), t;
  }
};
const Vi = "2.117.3", ht = { "X-Client-Info": `storage-js/${Vi}` };
var zi = class extends Ve {
  constructor(t, e = {}, r, s) {
    const n = new URL(t);
    s?.useNewHostname && /supabase\.(co|in|red)$/.test(n.hostname) && !n.hostname.includes("storage.supabase.") && (n.hostname = n.hostname.replace("supabase.", "storage.supabase."));
    const i = n.href.replace(/\/$/, ""), a = M(M({}, ht), e);
    super(i, a, r, "storage");
  }
  /**
  * Retrieves the details of all Storage buckets within an existing project.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param options Query parameters for listing buckets
  * @param options.limit Maximum number of buckets to return
  * @param options.offset Number of buckets to skip
  * @param options.sortColumn Column to sort by ('id', 'name', 'created_at', 'updated_at')
  * @param options.sortOrder Sort order ('asc' or 'desc')
  * @param options.search Search term to filter bucket names
  * @returns Promise with response containing array of buckets or error
  *
  * @example List buckets
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .listBuckets()
  * ```
  *
  * @example List buckets with options
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .listBuckets({
  *     limit: 10,
  *     offset: 0,
  *     sortColumn: 'created_at',
  *     sortOrder: 'desc',
  *     search: 'prod'
  *   })
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: `select`
  *   - `objects` table permissions: none
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  */
  async listBuckets(t) {
    var e = this;
    return e.handleOperation(async () => {
      const r = e.listBucketOptionsToQueryString(t);
      return await He(e.fetch, `${e.url}/bucket${r}`, { headers: e.headers });
    });
  }
  /**
  * Retrieves the details of an existing Storage bucket.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param id The unique identifier of the bucket you would like to retrieve.
  * @returns Promise with response containing bucket details or error
  *
  * @example Get bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .getBucket('avatars')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "id": "avatars",
  *     "name": "avatars",
  *     "owner": "",
  *     "public": false,
  *     "file_size_limit": 1024,
  *     "allowed_mime_types": [
  *       "image/png"
  *     ],
  *     "created_at": "2024-05-22T22:26:05.100Z",
  *     "updated_at": "2024-05-22T22:26:05.100Z"
  *   },
  *   "error": null
  * }
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: `select`
  *   - `objects` table permissions: none
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  */
  async getBucket(t) {
    var e = this;
    return e.handleOperation(async () => await He(e.fetch, `${e.url}/bucket/${t}`, { headers: e.headers }));
  }
  /**
  * Creates a new Storage bucket
  *
  * @category Storage
  * @subcategory File Buckets
  * @param id A unique identifier for the bucket you are creating.
  * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations. By default, buckets are private.
  * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
  * The global file size limit takes precedence over this value.
  * The default value is null, which doesn't set a per bucket file size limit.
  * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
  * The default value is null, which allows files with all mime types to be uploaded.
  * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
  * @param options.type (private-beta) specifies the bucket type. see `BucketType` for more details.
  *   - default bucket type is `STANDARD`
  * @param options.versioningStatus the bucket's initial object versioning status.
  * The default value is `DISABLED`
  * @returns Promise with response containing newly created bucket name or error
  *
  * @example Create bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .createBucket('avatars', {
  *     public: false,
  *     allowedMimeTypes: ['image/png'],
  *     fileSizeLimit: 1024
  *   })
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "name": "avatars"
  *   },
  *   "error": null
  * }
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: `insert`
  *   - `objects` table permissions: none
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  */
  async createBucket(t, e = { public: !1 }) {
    var r = this;
    return r.handleOperation(async () => await ae(r.fetch, `${r.url}/bucket`, {
      id: t,
      name: t,
      type: e.type,
      public: e.public,
      file_size_limit: e.fileSizeLimit,
      allowed_mime_types: e.allowedMimeTypes,
      versioning_status: e.versioningStatus
    }, { headers: r.headers }));
  }
  /**
  * Updates a Storage bucket
  *
  * @category Storage
  * @subcategory File Buckets
  * @param id A unique identifier for the bucket you are updating.
  * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations.
  * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
  * The global file size limit takes precedence over this value.
  * The default value is null, which doesn't set a per bucket file size limit.
  * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
  * The default value is null, which allows files with all mime types to be uploaded.
  * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
  * @param options.versioningStatus the bucket's new object versioning status. `DISABLED` is not
  * valid here, there's no transition back to it once versioning has been touched.
  * @returns Promise with response containing success message or error
  *
  * @example Update bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .updateBucket('avatars', {
  *     public: false,
  *     allowedMimeTypes: ['image/png'],
  *     fileSizeLimit: 1024
  *   })
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "message": "Successfully updated"
  *   },
  *   "error": null
  * }
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: `select` and `update`
  *   - `objects` table permissions: none
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  */
  async updateBucket(t, e) {
    var r = this;
    return r.handleOperation(async () => await Ct(r.fetch, `${r.url}/bucket/${t}`, {
      id: t,
      name: t,
      public: e.public,
      file_size_limit: e.fileSizeLimit,
      allowed_mime_types: e.allowedMimeTypes,
      versioning_status: e.versioningStatus
    }, { headers: r.headers }));
  }
  /**
  * Removes all objects inside a single bucket.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param id The unique identifier of the bucket you would like to empty.
  * @returns Promise with success message or error
  *
  * @example Empty bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .emptyBucket('avatars')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "message": "Successfully emptied"
  *   },
  *   "error": null
  * }
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: `select`
  *   - `objects` table permissions: `select` and `delete`
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  */
  async emptyBucket(t) {
    var e = this;
    return e.handleOperation(async () => await ae(e.fetch, `${e.url}/bucket/${t}/empty`, {}, { headers: e.headers }));
  }
  /**
  * Deletes an existing bucket. A bucket can't be deleted with existing objects inside it.
  * You must first `empty()` the bucket.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param id The unique identifier of the bucket you would like to delete.
  * @returns Promise with success message or error
  *
  * @example Delete bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .deleteBucket('avatars')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "message": "Successfully deleted"
  *   },
  *   "error": null
  * }
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: `select` and `delete`
  *   - `objects` table permissions: none
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  */
  async deleteBucket(t) {
    var e = this;
    return e.handleOperation(async () => await qe(e.fetch, `${e.url}/bucket/${t}`, {}, { headers: e.headers }));
  }
  /**
  * Returns the lifecycle policy stored on a bucket.
  *
  * Fails with `NoSuchLifecycleConfiguration` when the bucket has no policy.
  *
  * These rules expire previous versions of objects, not the current one.
  * Turn versioning on or there is nothing for the policy to act on.
  * Standard buckets only. Returns `FeatureNotEnabled` if lifecycle is off
  * for the project.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param id The unique identifier of the bucket.
  * @returns Promise with the lifecycle configuration or error
  *
  * @example Get lifecycle configuration
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .getBucketLifecycle('avatars')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "rules": [
  *       {
  *         "id": "expire-history",
  *         "status": "Enabled",
  *         "filter": {},
  *         "noncurrentVersionExpiration": {
  *           "noncurrentDays": 30,
  *           "newerNoncurrentVersions": 2
  *         }
  *       }
  *     ]
  *   },
  *   "error": null
  * }
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: `select`
  *   - `objects` table permissions: none
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  */
  async getBucketLifecycle(t) {
    var e = this;
    return e.handleOperation(async () => await He(e.fetch, e.bucketLifecycleUrl(t), { headers: e.headers }));
  }
  /**
  * Replaces the lifecycle policy on a bucket.
  *
  * The `rules` array you send is the whole policy. Anything previously stored
  * is overwritten. Send at least one rule. Call {@link deleteBucketLifecycle}
  * to remove the policy.
  *
  * Each rule currently supports only `noncurrentVersionExpiration`. `filter`
  * is required and must be `{}`. Prefix filters, tag filters, and current-object
  * expiration are rejected. Rule IDs must be unique. Omit `id` and the
  * server generates one.
  *
  * Standard buckets only. Returns `FeatureNotEnabled` if lifecycle is off
  * for the project.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param id The unique identifier of the bucket.
  * @param configuration The full lifecycle configuration to store.
  * @returns Promise with the stored configuration or error
  *
  * @example Replace lifecycle configuration
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .updateBucketLifecycle('avatars', {
  *     rules: [
  *       {
  *         id: 'expire-history',
  *         status: 'Enabled',
  *         filter: {},
  *         noncurrentVersionExpiration: {
  *           noncurrentDays: 30,
  *           newerNoncurrentVersions: 2,
  *         },
  *       },
  *     ],
  *   })
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: `select` and `update`
  *   - `objects` table permissions: none
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  */
  async updateBucketLifecycle(t, e) {
    var r = this;
    return r.handleOperation(async () => await Ct(r.fetch, r.bucketLifecycleUrl(t), e, { headers: r.headers }));
  }
  /**
  * Removes the lifecycle policy from a bucket.
  *
  * Safe to call when no policy is stored. The response is still success.
  * Standard buckets only. Returns `FeatureNotEnabled` if lifecycle is off
  * for the project.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param id The unique identifier of the bucket.
  * @returns Promise with success message or error
  *
  * @example Delete lifecycle configuration
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .deleteBucketLifecycle('avatars')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "message": "Successfully deleted"
  *   },
  *   "error": null
  * }
  * ```
  *
  * @remarks
  * - RLS policy permissions required:
  *   - `buckets` table permissions: `select` and `update`
  *   - `objects` table permissions: none
  * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
  */
  async deleteBucketLifecycle(t) {
    var e = this;
    return e.handleOperation(async () => await qe(e.fetch, e.bucketLifecycleUrl(t), {}, { headers: e.headers }));
  }
  /**
  * Purges the CDN cache for an entire bucket.
  *
  * Maps to `DELETE /cdn/{bucket}` on the Storage API. The server
  * issues a CDN invalidation for the bucket and returns `{ message: 'success' }`.
  *
  * **Requires the `service_role` key.** The underlying endpoint enforces
  * `service_role` JWT — calls made with the anon key or a user JWT will be
  * rejected by the server.
  *
  * **Hosted CDN feature.** On self-hosted Supabase, the Storage service must
  * have `CDN_PURGE_ENDPOINT_URL` configured and the `purgeCache` tenant
  * feature enabled, otherwise the server returns an error.
  *
  * @category Storage
  * @subcategory File Buckets
  * @param id The unique identifier of the bucket you would like to purge from cache.
  * @param options Optional purge cache options.
  * @param options.transformations If true, purges only transformations (resized/formatted variants), leaving original cached files intact.
  * @param parameters Optional fetch parameters such as an `AbortController` signal.
  * @returns Promise with `{ data: { message }, error: null }` on success or `{ data: null, error }` on failure.
  *
  * @example Purge cache for an entire bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .purgeBucketCache('avatars')
  * ```
  *
  * @example Purge only transformations for an entire bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .purgeBucketCache('avatars', { transformations: true })
  * ```
  */
  async purgeBucketCache(t, e, r) {
    var s = this;
    return s.handleOperation(async () => {
      const n = new URLSearchParams();
      e?.transformations && n.set("transformations", "true");
      const i = n.toString();
      return await qe(s.fetch, `${s.url}/cdn/${yr(t)}${i ? `?${i}` : ""}`, {}, { headers: s.headers }, r);
    });
  }
  bucketLifecycleUrl(t) {
    return `${this.url}/bucket/${yr(t)}/lifecycle`;
  }
  listBucketOptionsToQueryString(t) {
    const e = {};
    return t && ("limit" in t && (e.limit = String(t.limit)), "offset" in t && (e.offset = String(t.offset)), t.search && (e.search = t.search), t.sortColumn && (e.sortColumn = t.sortColumn), t.sortOrder && (e.sortOrder = t.sortOrder)), Object.keys(e).length > 0 ? "?" + new URLSearchParams(e).toString() : "";
  }
}, Gi = class extends Ve {
  /**
  * @alpha
  *
  * Creates a new StorageAnalyticsClient instance
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Analytics Buckets
  * @param url - The base URL for the storage API
  * @param headers - HTTP headers to include in requests
  * @param fetch - Optional custom fetch implementation
  *
  * @example Using supabase-js (recommended)
  * ```typescript
  * import { createClient } from '@supabase/supabase-js'
  *
  * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
  * const { data, error } = await supabase.storage.analytics.listBuckets()
  * ```
  *
  * @example Standalone import for bundle-sensitive environments
  * ```typescript
  * import { StorageAnalyticsClient } from '@supabase/storage-js'
  *
  * const client = new StorageAnalyticsClient(url, headers)
  * ```
  */
  constructor(t, e = {}, r) {
    const s = t.replace(/\/$/, ""), n = M(M({}, ht), e);
    super(s, n, r, "storage");
  }
  /**
  * @alpha
  *
  * Creates a new analytics bucket using Iceberg tables
  * Analytics buckets are optimized for analytical queries and data processing
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Analytics Buckets
  * @param name A unique name for the bucket you are creating
  * @returns Promise with response containing newly created analytics bucket or error
  *
  * @example Create analytics bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .analytics
  *   .createBucket('analytics-data')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "name": "analytics-data",
  *     "type": "ANALYTICS",
  *     "format": "iceberg",
  *     "created_at": "2024-05-22T22:26:05.100Z",
  *     "updated_at": "2024-05-22T22:26:05.100Z"
  *   },
  *   "error": null
  * }
  * ```
  *
  * @remarks
  * - Creates a new analytics bucket using Iceberg tables
  * - Analytics buckets are optimized for analytical queries and data processing
  */
  async createBucket(t) {
    var e = this;
    return e.handleOperation(async () => await ae(e.fetch, `${e.url}/bucket`, { name: t }, { headers: e.headers }));
  }
  /**
  * @alpha
  *
  * Retrieves the details of all Analytics Storage buckets within an existing project
  * Only returns buckets of type 'ANALYTICS'
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Analytics Buckets
  * @param options Query parameters for listing buckets
  * @param options.limit Maximum number of buckets to return
  * @param options.offset Number of buckets to skip
  * @param options.sortColumn Column to sort by ('name', 'created_at', 'updated_at')
  * @param options.sortOrder Sort order ('asc' or 'desc')
  * @param options.search Search term to filter bucket names
  * @returns Promise with response containing array of analytics buckets or error
  *
  * @example List analytics buckets
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .analytics
  *   .listBuckets({
  *     limit: 10,
  *     offset: 0,
  *     sortColumn: 'created_at',
  *     sortOrder: 'desc'
  *   })
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": [
  *     {
  *       "name": "analytics-data",
  *       "type": "ANALYTICS",
  *       "format": "iceberg",
  *       "created_at": "2024-05-22T22:26:05.100Z",
  *       "updated_at": "2024-05-22T22:26:05.100Z"
  *     }
  *   ],
  *   "error": null
  * }
  * ```
  *
  * @remarks
  * - Retrieves the details of all Analytics Storage buckets within an existing project
  * - Only returns buckets of type 'ANALYTICS'
  */
  async listBuckets(t) {
    var e = this;
    return e.handleOperation(async () => {
      const r = new URLSearchParams();
      t?.limit !== void 0 && r.set("limit", t.limit.toString()), t?.offset !== void 0 && r.set("offset", t.offset.toString()), t?.sortColumn && r.set("sortColumn", t.sortColumn), t?.sortOrder && r.set("sortOrder", t.sortOrder), t?.search && r.set("search", t.search);
      const s = r.toString(), n = s ? `${e.url}/bucket?${s}` : `${e.url}/bucket`;
      return await He(e.fetch, n, { headers: e.headers });
    });
  }
  /**
  * @alpha
  *
  * Deletes an existing analytics bucket
  * A bucket can't be deleted with existing objects inside it
  * You must first empty the bucket before deletion
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Analytics Buckets
  * @param bucketName The unique identifier of the bucket you would like to delete
  * @returns Promise with response containing success message or error
  *
  * @example Delete analytics bucket
  * ```js
  * const { data, error } = await supabase
  *   .storage
  *   .analytics
  *   .deleteBucket('analytics-data')
  * ```
  *
  * Response:
  * ```json
  * {
  *   "data": {
  *     "message": "Successfully deleted"
  *   },
  *   "error": null
  * }
  * ```
  *
  * @remarks
  * - Deletes an analytics bucket
  */
  async deleteBucket(t) {
    var e = this;
    return e.handleOperation(async () => await qe(e.fetch, `${e.url}/bucket/${t}`, {}, { headers: e.headers }));
  }
  /**
  * @alpha
  *
  * Get an Iceberg REST Catalog client configured for a specific analytics bucket
  * Use this to perform advanced table and namespace operations within the bucket
  * The returned client provides full access to the Apache Iceberg REST Catalog API
  * with the Supabase `{ data, error }` pattern for consistent error handling on all operations.
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Analytics Buckets
  * @param bucketName - The name of the analytics bucket (warehouse) to connect to
  * @returns The wrapped Iceberg catalog client
  * @throws {StorageError} If the bucket name is invalid
  *
  * @example Get catalog and create table
  * ```js
  * // First, create an analytics bucket
  * const { data: bucket, error: bucketError } = await supabase
  *   .storage
  *   .analytics
  *   .createBucket('analytics-data')
  *
  * // Get the Iceberg catalog for that bucket
  * const catalog = supabase.storage.analytics.from('analytics-data')
  *
  * // Create a namespace
  * const { error: nsError } = await catalog.createNamespace({ namespace: ['default'] })
  *
  * // Create a table with schema
  * const { data: tableMetadata, error: tableError } = await catalog.createTable(
  *   { namespace: ['default'] },
  *   {
  *     name: 'events',
  *     schema: {
  *       type: 'struct',
  *       fields: [
  *         { id: 1, name: 'id', type: 'long', required: true },
  *         { id: 2, name: 'timestamp', type: 'timestamp', required: true },
  *         { id: 3, name: 'user_id', type: 'string', required: false }
  *       ],
  *       'schema-id': 0,
  *       'identifier-field-ids': [1]
  *     },
  *     'partition-spec': {
  *       'spec-id': 0,
  *       fields: []
  *     },
  *     'write-order': {
  *       'order-id': 0,
  *       fields: []
  *     },
  *     properties: {
  *       'write.format.default': 'parquet'
  *     }
  *   }
  * )
  * ```
  *
  * @example List tables in namespace
  * ```js
  * const catalog = supabase.storage.analytics.from('analytics-data')
  *
  * // List all tables in the default namespace
  * const { data: tables, error: listError } = await catalog.listTables({ namespace: ['default'] })
  * if (listError) {
  *   if (listError.isNotFound()) {
  *     console.log('Namespace not found')
  *   }
  *   return
  * }
  * console.log(tables) // [{ namespace: ['default'], name: 'events' }]
  * ```
  *
  * @example Working with namespaces
  * ```js
  * const catalog = supabase.storage.analytics.from('analytics-data')
  *
  * // List all namespaces
  * const { data: namespaces } = await catalog.listNamespaces()
  *
  * // Create namespace with properties
  * await catalog.createNamespace(
  *   { namespace: ['production'] },
  *   { properties: { owner: 'data-team', env: 'prod' } }
  * )
  * ```
  *
  * @example Cleanup operations
  * ```js
  * const catalog = supabase.storage.analytics.from('analytics-data')
  *
  * // Drop table with purge option (removes all data)
  * const { error: dropError } = await catalog.dropTable(
  *   { namespace: ['default'], name: 'events' },
  *   { purge: true }
  * )
  *
  * if (dropError?.isNotFound()) {
  *   console.log('Table does not exist')
  * }
  *
  * // Drop namespace (must be empty)
  * await catalog.dropNamespace({ namespace: ['default'] })
  * ```
  *
  * @remarks
  * This method provides a bridge between Supabase's bucket management and the standard
  * Apache Iceberg REST Catalog API. The bucket name maps to the Iceberg warehouse parameter.
  * All authentication and configuration is handled automatically using your Supabase credentials.
  *
  * **Error Handling**: Invalid bucket names throw immediately. All catalog
  * operations return `{ data, error }` where errors are `IcebergError` instances from iceberg-js.
  * Use helper methods like `error.isNotFound()` or check `error.status` for specific error handling.
  * Use `.throwOnError()` on the analytics client if you prefer exceptions for catalog operations.
  *
  * **Cleanup Operations**: When using `dropTable`, the `purge: true` option permanently
  * deletes all table data. Without it, the table is marked as deleted but data remains.
  *
  * **Library Dependency**: The returned catalog wraps `IcebergRestCatalog` from iceberg-js.
  * For complete API documentation and advanced usage, refer to the
  * [iceberg-js documentation](https://supabase.github.io/iceberg-js/).
  */
  from(t) {
    var e = this;
    if (!Di(t)) throw new Vt("Invalid bucket name: File, folder, and bucket names must follow AWS object key naming guidelines and should avoid the use of any other characters.");
    const r = new Pi({
      baseUrl: this.url,
      catalogName: t,
      auth: {
        type: "custom",
        getHeaders: async () => e.headers
      },
      fetch: this.fetch
    }), s = this.shouldThrowOnError;
    return new Proxy(r, { get(n, i) {
      const a = n[i];
      return typeof a != "function" ? a : async (...l) => {
        try {
          return {
            data: await a.apply(n, l),
            error: null
          };
        } catch (h) {
          if (s) throw h;
          return {
            data: null,
            error: h
          };
        }
      };
    } });
  }
}, Ji = class extends Ve {
  /** Creates a new VectorIndexApi instance */
  constructor(t, e = {}, r) {
    const s = t.replace(/\/$/, ""), n = M(M({}, ht), {}, { "Content-Type": "application/json" }, e);
    super(s, n, r, "vectors");
  }
  /** Creates a new vector index within a bucket */
  async createIndex(t) {
    var e = this;
    return e.handleOperation(async () => await re.post(e.fetch, `${e.url}/CreateIndex`, t, { headers: e.headers }) || {});
  }
  /** Retrieves metadata for a specific vector index */
  async getIndex(t, e) {
    var r = this;
    return r.handleOperation(async () => await re.post(r.fetch, `${r.url}/GetIndex`, {
      vectorBucketName: t,
      indexName: e
    }, { headers: r.headers }));
  }
  /** Lists vector indexes within a bucket with optional filtering and pagination */
  async listIndexes(t) {
    var e = this;
    return e.handleOperation(async () => await re.post(e.fetch, `${e.url}/ListIndexes`, t, { headers: e.headers }));
  }
  /** Deletes a vector index and all its data */
  async deleteIndex(t, e) {
    var r = this;
    return r.handleOperation(async () => await re.post(r.fetch, `${r.url}/DeleteIndex`, {
      vectorBucketName: t,
      indexName: e
    }, { headers: r.headers }) || {});
  }
}, Yi = class extends Ve {
  /** Creates a new VectorDataApi instance */
  constructor(t, e = {}, r) {
    const s = t.replace(/\/$/, ""), n = M(M({}, ht), {}, { "Content-Type": "application/json" }, e);
    super(s, n, r, "vectors");
  }
  /** Inserts or updates vectors in batch (1-500 per request) */
  async putVectors(t) {
    var e = this;
    if (t.vectors.length < 1 || t.vectors.length > 500) throw new Error("Vector batch size must be between 1 and 500 items");
    return e.handleOperation(async () => await re.post(e.fetch, `${e.url}/PutVectors`, t, { headers: e.headers }) || {});
  }
  /** Retrieves vectors by their keys in batch */
  async getVectors(t) {
    var e = this;
    return e.handleOperation(async () => await re.post(e.fetch, `${e.url}/GetVectors`, t, { headers: e.headers }));
  }
  /** Lists vectors in an index with pagination */
  async listVectors(t) {
    var e = this;
    if (t.segmentCount !== void 0) {
      if (t.segmentCount < 1 || t.segmentCount > 16) throw new Error("segmentCount must be between 1 and 16");
      if (t.segmentIndex !== void 0 && (t.segmentIndex < 0 || t.segmentIndex >= t.segmentCount))
        throw new Error(`segmentIndex must be between 0 and ${t.segmentCount - 1}`);
    }
    return e.handleOperation(async () => await re.post(e.fetch, `${e.url}/ListVectors`, t, { headers: e.headers }));
  }
  /** Queries for similar vectors using approximate nearest neighbor search */
  async queryVectors(t) {
    var e = this;
    return e.handleOperation(async () => await re.post(e.fetch, `${e.url}/QueryVectors`, t, { headers: e.headers }));
  }
  /** Deletes vectors by their keys in batch (1-500 per request) */
  async deleteVectors(t) {
    var e = this;
    if (t.keys.length < 1 || t.keys.length > 500) throw new Error("Keys batch size must be between 1 and 500 items");
    return e.handleOperation(async () => await re.post(e.fetch, `${e.url}/DeleteVectors`, t, { headers: e.headers }) || {});
  }
}, Xi = class extends Ve {
  /** Creates a new VectorBucketApi instance */
  constructor(t, e = {}, r) {
    const s = t.replace(/\/$/, ""), n = M(M({}, ht), {}, { "Content-Type": "application/json" }, e);
    super(s, n, r, "vectors");
  }
  /** Creates a new vector bucket */
  async createBucket(t) {
    var e = this;
    return e.handleOperation(async () => await re.post(e.fetch, `${e.url}/CreateVectorBucket`, { vectorBucketName: t }, { headers: e.headers }) || {});
  }
  /** Retrieves metadata for a specific vector bucket */
  async getBucket(t) {
    var e = this;
    return e.handleOperation(async () => await re.post(e.fetch, `${e.url}/GetVectorBucket`, { vectorBucketName: t }, { headers: e.headers }));
  }
  /** Lists vector buckets with optional filtering and pagination */
  async listBuckets(t = {}) {
    var e = this;
    return e.handleOperation(async () => await re.post(e.fetch, `${e.url}/ListVectorBuckets`, t, { headers: e.headers }));
  }
  /** Deletes a vector bucket (must be empty first) */
  async deleteBucket(t) {
    var e = this;
    return e.handleOperation(async () => await re.post(e.fetch, `${e.url}/DeleteVectorBucket`, { vectorBucketName: t }, { headers: e.headers }) || {});
  }
}, Qi = class extends Xi {
  /**
  * @alpha
  *
  * Creates a StorageVectorsClient that can manage buckets, indexes, and vectors.
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Vector Buckets
  * @param url - Base URL of the Storage Vectors REST API.
  * @param options.headers - Optional headers (for example `Authorization`) applied to every request.
  * @param options.fetch - Optional custom `fetch` implementation for non-browser runtimes.
  *
  * @example Using supabase-js (recommended)
  * ```typescript
  * import { createClient } from '@supabase/supabase-js'
  *
  * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
  * const bucket = supabase.storage.vectors.from('embeddings-prod')
  * ```
  *
  * @example Standalone import for bundle-sensitive environments
  * ```typescript
  * import { StorageVectorsClient } from '@supabase/storage-js'
  *
  * const client = new StorageVectorsClient(url, options)
  * ```
  */
  constructor(t, e = {}) {
    super(t, e.headers || {}, e.fetch);
  }
  /**
  *
  * @alpha
  *
  * Access operations for a specific vector bucket
  * Returns a scoped client for index and vector operations within the bucket
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Vector Buckets
  * @param vectorBucketName - Name of the vector bucket
  * @returns Bucket-scoped client with index and vector operations
  *
  * @example Accessing a vector bucket
  * ```typescript
  * const bucket = supabase.storage.vectors.from('embeddings-prod')
  * ```
  */
  from(t) {
    return new Zi(this.url, this.headers, t, this.fetch);
  }
  /**
  *
  * @alpha
  *
  * Creates a new vector bucket
  * Vector buckets are containers for vector indexes and their data
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Vector Buckets
  * @param vectorBucketName - Unique name for the vector bucket
  * @returns Promise with empty response on success or error
  *
  * @example Creating a vector bucket
  * ```typescript
  * const { data, error } = await supabase
  *   .storage
  *   .vectors
  *   .createBucket('embeddings-prod')
  * ```
  */
  async createBucket(t) {
    var e = () => super.createBucket, r = this;
    return e().call(r, t);
  }
  /**
  *
  * @alpha
  *
  * Retrieves metadata for a specific vector bucket
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Vector Buckets
  * @param vectorBucketName - Name of the vector bucket
  * @returns Promise with bucket metadata or error
  *
  * @example Get bucket metadata
  * ```typescript
  * const { data, error } = await supabase
  *   .storage
  *   .vectors
  *   .getBucket('embeddings-prod')
  *
  * console.log('Bucket created:', data?.vectorBucket.creationTime)
  * ```
  */
  async getBucket(t) {
    var e = () => super.getBucket, r = this;
    return e().call(r, t);
  }
  /**
  *
  * @alpha
  *
  * Lists all vector buckets with optional filtering and pagination
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Vector Buckets
  * @param options - Optional filters (prefix, maxResults, nextToken)
  * @returns Promise with list of buckets or error
  *
  * @example List vector buckets
  * ```typescript
  * const { data, error } = await supabase
  *   .storage
  *   .vectors
  *   .listBuckets({ prefix: 'embeddings-' })
  *
  * data?.vectorBuckets.forEach(bucket => {
  *   console.log(bucket.vectorBucketName)
  * })
  * ```
  */
  async listBuckets(t = {}) {
    var e = () => super.listBuckets, r = this;
    return e().call(r, t);
  }
  /**
  *
  * @alpha
  *
  * Deletes a vector bucket (bucket must be empty)
  * All indexes must be deleted before deleting the bucket
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Vector Buckets
  * @param vectorBucketName - Name of the vector bucket to delete
  * @returns Promise with empty response on success or error
  *
  * @example Delete a vector bucket
  * ```typescript
  * const { data, error } = await supabase
  *   .storage
  *   .vectors
  *   .deleteBucket('embeddings-old')
  * ```
  */
  async deleteBucket(t) {
    var e = () => super.deleteBucket, r = this;
    return e().call(r, t);
  }
}, Zi = class extends Ji {
  /**
  * @alpha
  *
  * Creates a helper that automatically scopes all index operations to the provided bucket.
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Vector Buckets
  * @example Creating a vector bucket scope
  * ```typescript
  * const bucket = supabase.storage.vectors.from('embeddings-prod')
  * ```
  */
  constructor(t, e, r, s) {
    super(t, e, s), this.vectorBucketName = r;
  }
  /**
  *
  * @alpha
  *
  * Creates a new vector index in this bucket
  * Convenience method that automatically includes the bucket name
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Vector Buckets
  * @param options - Index configuration (vectorBucketName is automatically set)
  * @returns Promise with empty response on success or error
  *
  * @example Creating a vector index
  * ```typescript
  * const bucket = supabase.storage.vectors.from('embeddings-prod')
  * await bucket.createIndex({
  *   indexName: 'documents-openai',
  *   dataType: 'float32',
  *   dimension: 1536,
  *   distanceMetric: 'cosine',
  *   metadataConfiguration: {
  *     nonFilterableMetadataKeys: ['raw_text']
  *   }
  * })
  * ```
  */
  async createIndex(t) {
    var e = () => super.createIndex, r = this;
    return e().call(r, M(M({}, t), {}, { vectorBucketName: r.vectorBucketName }));
  }
  /**
  *
  * @alpha
  *
  * Lists indexes in this bucket
  * Convenience method that automatically includes the bucket name
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Vector Buckets
  * @param options - Listing options (vectorBucketName is automatically set)
  * @returns Promise with response containing indexes array and pagination token or error
  *
  * @example List indexes
  * ```typescript
  * const bucket = supabase.storage.vectors.from('embeddings-prod')
  * const { data } = await bucket.listIndexes({ prefix: 'documents-' })
  * ```
  */
  async listIndexes(t = {}) {
    var e = () => super.listIndexes, r = this;
    return e().call(r, M(M({}, t), {}, { vectorBucketName: r.vectorBucketName }));
  }
  /**
  *
  * @alpha
  *
  * Retrieves metadata for a specific index in this bucket
  * Convenience method that automatically includes the bucket name
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Vector Buckets
  * @param indexName - Name of the index to retrieve
  * @returns Promise with index metadata or error
  *
  * @example Get index metadata
  * ```typescript
  * const bucket = supabase.storage.vectors.from('embeddings-prod')
  * const { data } = await bucket.getIndex('documents-openai')
  * console.log('Dimension:', data?.index.dimension)
  * ```
  */
  async getIndex(t) {
    var e = () => super.getIndex, r = this;
    return e().call(r, r.vectorBucketName, t);
  }
  /**
  *
  * @alpha
  *
  * Deletes an index from this bucket
  * Convenience method that automatically includes the bucket name
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Vector Buckets
  * @param indexName - Name of the index to delete
  * @returns Promise with empty response on success or error
  *
  * @example Delete an index
  * ```typescript
  * const bucket = supabase.storage.vectors.from('embeddings-prod')
  * await bucket.deleteIndex('old-index')
  * ```
  */
  async deleteIndex(t) {
    var e = () => super.deleteIndex, r = this;
    return e().call(r, r.vectorBucketName, t);
  }
  /**
  *
  * @alpha
  *
  * Access operations for a specific index within this bucket
  * Returns a scoped client for vector data operations
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Vector Buckets
  * @param indexName - Name of the index
  * @returns Index-scoped client with vector data operations
  *
  * @example Accessing an index
  * ```typescript
  * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
  *
  * // Insert vectors
  * await index.putVectors({
  *   vectors: [
  *     { key: 'doc-1', data: { float32: [...] }, metadata: { title: 'Intro' } }
  *   ]
  * })
  *
  * // Query similar vectors
  * const { data } = await index.queryVectors({
  *   queryVector: { float32: [...] },
  *   topK: 5
  * })
  * ```
  */
  index(t) {
    return new ea(this.url, this.headers, this.vectorBucketName, t, this.fetch);
  }
}, ea = class extends Yi {
  /**
  *
  * @alpha
  *
  * Creates a helper that automatically scopes all vector operations to the provided bucket/index names.
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Vector Buckets
  * @example Creating a vector index scope
  * ```typescript
  * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
  * ```
  */
  constructor(t, e, r, s, n) {
    super(t, e, n), this.vectorBucketName = r, this.indexName = s;
  }
  /**
  *
  * @alpha
  *
  * Inserts or updates vectors in this index
  * Convenience method that automatically includes bucket and index names
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Vector Buckets
  * @param options - Vector insertion options (bucket and index names automatically set)
  * @returns Promise with empty response on success or error
  *
  * @example Insert vectors into an index
  * ```typescript
  * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
  * await index.putVectors({
  *   vectors: [
  *     {
  *       key: 'doc-1',
  *       data: { float32: [0.1, 0.2, ...] },
  *       metadata: { title: 'Introduction', page: 1 }
  *     }
  *   ]
  * })
  * ```
  */
  async putVectors(t) {
    var e = () => super.putVectors, r = this;
    return e().call(r, M(M({}, t), {}, {
      vectorBucketName: r.vectorBucketName,
      indexName: r.indexName
    }));
  }
  /**
  *
  * @alpha
  *
  * Retrieves vectors by keys from this index
  * Convenience method that automatically includes bucket and index names
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Vector Buckets
  * @param options - Vector retrieval options (bucket and index names automatically set)
  * @returns Promise with response containing vectors array or error
  *
  * @example Get vectors by keys
  * ```typescript
  * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
  * const { data } = await index.getVectors({
  *   keys: ['doc-1', 'doc-2'],
  *   returnMetadata: true
  * })
  * ```
  */
  async getVectors(t) {
    var e = () => super.getVectors, r = this;
    return e().call(r, M(M({}, t), {}, {
      vectorBucketName: r.vectorBucketName,
      indexName: r.indexName
    }));
  }
  /**
  *
  * @alpha
  *
  * Lists vectors in this index with pagination
  * Convenience method that automatically includes bucket and index names
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Vector Buckets
  * @param options - Listing options (bucket and index names automatically set)
  * @returns Promise with response containing vectors array and pagination token or error
  *
  * @example List vectors with pagination
  * ```typescript
  * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
  * const { data } = await index.listVectors({
  *   maxResults: 500,
  *   returnMetadata: true
  * })
  * ```
  */
  async listVectors(t = {}) {
    var e = () => super.listVectors, r = this;
    return e().call(r, M(M({}, t), {}, {
      vectorBucketName: r.vectorBucketName,
      indexName: r.indexName
    }));
  }
  /**
  *
  * @alpha
  *
  * Queries for similar vectors in this index
  * Convenience method that automatically includes bucket and index names
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Vector Buckets
  * @param options - Query options (bucket and index names automatically set)
  * @returns Promise with response containing vectors ordered by distance, an optional pagination token, or an error
  *
  * @example Query similar vectors
  * ```typescript
  * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
  * const { data } = await index.queryVectors({
  *   queryVector: { float32: [0.1, 0.2, ...] },
  *   topK: 5,
  *   filter: { category: 'technical' },
  *   returnDistance: true,
  *   returnMetadata: true
  * })
  * ```
  */
  async queryVectors(t) {
    var e = () => super.queryVectors, r = this;
    return e().call(r, M(M({}, t), {}, {
      vectorBucketName: r.vectorBucketName,
      indexName: r.indexName
    }));
  }
  /**
  *
  * @alpha
  *
  * Deletes vectors by keys from this index
  * Convenience method that automatically includes bucket and index names
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Vector Buckets
  * @param options - Deletion options (bucket and index names automatically set)
  * @returns Promise with empty response on success or error
  *
  * @example Delete vectors by keys
  * ```typescript
  * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
  * await index.deleteVectors({
  *   keys: ['doc-1', 'doc-2', 'doc-3']
  * })
  * ```
  */
  async deleteVectors(t) {
    var e = () => super.deleteVectors, r = this;
    return e().call(r, M(M({}, t), {}, {
      vectorBucketName: r.vectorBucketName,
      indexName: r.indexName
    }));
  }
}, ta = class extends zi {
  /**
  * Creates a client for Storage buckets, files, analytics, and vectors.
  *
  * @category Storage
  * @subcategory File Buckets
  *
  * @example Using supabase-js (recommended)
  * ```ts
  * import { createClient } from '@supabase/supabase-js'
  *
  * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
  * const avatars = supabase.storage.from('avatars')
  * ```
  *
  * @example Standalone import for bundle-sensitive environments
  * ```ts
  * import { StorageClient } from '@supabase/storage-js'
  *
  * const storage = new StorageClient('https://xyzcompany.supabase.co/storage/v1', {
  *   apikey: 'your-publishable-key',
  * })
  * const avatars = storage.from('avatars')
  * ```
  */
  constructor(t, e = {}, r, s) {
    super(t, e, r, s);
  }
  /**
  * Perform file operation in a bucket.
  *
  * @category Storage
  * @subcategory File Buckets
  *
  * @param id The bucket id to operate on.
  *
  * @example Accessing a bucket
  * ```typescript
  * const avatars = supabase.storage.from('avatars')
  * ```
  */
  from(t) {
    return new Ki(this.url, this.headers, t, this.fetch);
  }
  /**
  *
  * @alpha
  *
  * Access vector storage operations.
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Vector Buckets
  *
  * @returns A StorageVectorsClient instance configured with the current storage settings.
  */
  get vectors() {
    return new Qi(this.url + "/vector", {
      headers: this.headers,
      fetch: this.fetch
    });
  }
  /**
  *
  * @alpha
  *
  * Access analytics storage operations using Iceberg tables.
  *
  * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
  *
  * @category Storage
  * @subcategory Analytics Buckets
  *
  * @returns A StorageAnalyticsClient instance configured with the current storage settings.
  */
  get analytics() {
    return new Gi(this.url + "/iceberg", this.headers, this.fetch);
  }
};
const Ks = "2.117.3", me = 30 * 1e3, Qe = 3, Xt = Qe * me, ra = 2 * me, sa = "http://localhost:9999", na = "supabase.auth.token", ia = { "X-Client-Info": `gotrue-js/${Ks}` }, _r = "X-Supabase-Api-Version", Vs = {
  "2024-01-01": {
    timestamp: Date.parse("2024-01-01T00:00:00.0Z"),
    name: "2024-01-01"
  }
}, aa = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i, Re = "sb_flow_id", oa = 5, la = 600 * 1e3;
class at extends Error {
  constructor(e, r, s) {
    super(e), this.__isAuthError = !0, this.name = "AuthError", this.status = r, this.code = s;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code
    };
  }
}
function k(t) {
  return typeof t == "object" && t !== null && "__isAuthError" in t;
}
class ca extends at {
  constructor(e, r, s) {
    super(e, r, s), this.name = "AuthApiError", this.status = r, this.code = s;
  }
}
function Vr(t) {
  return k(t) && t.name === "AuthApiError";
}
class oe extends at {
  constructor(e, r) {
    super(e), this.name = "AuthUnknownError", this.originalError = r;
  }
}
class ue extends at {
  constructor(e, r, s, n) {
    super(e, s, n), this.name = r, this.status = s;
  }
}
class z extends ue {
  constructor() {
    super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
  }
}
function pt(t) {
  return k(t) && t.name === "AuthSessionMissingError";
}
class $e extends ue {
  constructor() {
    super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
  }
}
class gt extends ue {
  constructor(e) {
    super(e, "AuthInvalidCredentialsError", 400, void 0);
  }
}
class mt extends ue {
  constructor(e, r = null) {
    super(e, "AuthImplicitGrantRedirectError", 500, void 0), this.details = null, this.details = r;
  }
  toJSON() {
    return Object.assign(Object.assign({}, super.toJSON()), { details: this.details });
  }
}
function ha(t) {
  return k(t) && t.name === "AuthImplicitGrantRedirectError";
}
class zr extends ue {
  constructor(e, r = null) {
    super(e, "AuthPKCEGrantCodeExchangeError", 500, void 0), this.details = null, this.details = r;
  }
  toJSON() {
    return Object.assign(Object.assign({}, super.toJSON()), { details: this.details });
  }
}
class ua extends ue {
  constructor() {
    super("PKCE code verifier not found in storage. This can happen if the auth flow was initiated in a different browser or device, or if the storage was cleared. For SSR frameworks (Next.js, SvelteKit, etc.), use @supabase/ssr on both the server and client to store the code verifier in cookies.", "AuthPKCECodeVerifierMissingError", 400, "pkce_code_verifier_not_found");
  }
}
class xt extends ue {
  constructor(e, r) {
    super(e, "AuthRetryableFetchError", r, void 0);
  }
}
function yt(t) {
  return k(t) && t.name === "AuthRetryableFetchError";
}
class Gr extends ue {
  constructor(e = "Refresh result discarded: session state changed mid-flight (e.g., concurrent signOut)") {
    super(e, "AuthRefreshDiscardedError", 409, void 0);
  }
}
function Jr(t) {
  return k(t) && t.name === "AuthRefreshDiscardedError";
}
class Yr extends ue {
  constructor(e, r, s) {
    super(e, "AuthWeakPasswordError", r, "weak_password"), this.reasons = s;
  }
  toJSON() {
    return Object.assign(Object.assign({}, super.toJSON()), { reasons: this.reasons });
  }
}
class It extends ue {
  constructor(e) {
    super(e, "AuthInvalidJwtError", 400, "invalid_jwt");
  }
}
const $t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""), Xr = ` 	
\r=`.split(""), da = (() => {
  const t = new Array(128);
  for (let e = 0; e < t.length; e += 1)
    t[e] = -1;
  for (let e = 0; e < Xr.length; e += 1)
    t[Xr[e].charCodeAt(0)] = -2;
  for (let e = 0; e < $t.length; e += 1)
    t[$t[e].charCodeAt(0)] = e;
  return t;
})();
function Qr(t, e, r) {
  if (t !== null)
    for (e.queue = e.queue << 8 | t, e.queuedBits += 8; e.queuedBits >= 6; ) {
      const s = e.queue >> e.queuedBits - 6 & 63;
      r($t[s]), e.queuedBits -= 6;
    }
  else if (e.queuedBits > 0)
    for (e.queue = e.queue << 6 - e.queuedBits, e.queuedBits = 6; e.queuedBits >= 6; ) {
      const s = e.queue >> e.queuedBits - 6 & 63;
      r($t[s]), e.queuedBits -= 6;
    }
}
function zs(t, e, r) {
  const s = da[t];
  if (s > -1)
    for (e.queue = e.queue << 6 | s, e.queuedBits += 6; e.queuedBits >= 8; )
      r(e.queue >> e.queuedBits - 8 & 255), e.queuedBits -= 8;
  else {
    if (s === -2)
      return;
    throw new Error(`Invalid Base64-URL character "${String.fromCharCode(t)}"`);
  }
}
function Zr(t) {
  const e = [], r = (a) => {
    e.push(String.fromCodePoint(a));
  }, s = {
    utf8seq: 0,
    codepoint: 0
  }, n = { queue: 0, queuedBits: 0 }, i = (a) => {
    ga(a, s, r);
  };
  for (let a = 0; a < t.length; a += 1)
    zs(t.charCodeAt(a), n, i);
  return e.join("");
}
function fa(t, e) {
  if (t <= 127) {
    e(t);
    return;
  } else if (t <= 2047) {
    e(192 | t >> 6), e(128 | t & 63);
    return;
  } else if (t <= 65535) {
    e(224 | t >> 12), e(128 | t >> 6 & 63), e(128 | t & 63);
    return;
  } else if (t <= 1114111) {
    e(240 | t >> 18), e(128 | t >> 12 & 63), e(128 | t >> 6 & 63), e(128 | t & 63);
    return;
  }
  throw new Error(`Unrecognized Unicode codepoint: ${t.toString(16)}`);
}
function pa(t, e) {
  for (let r = 0; r < t.length; r += 1) {
    let s = t.charCodeAt(r);
    if (s > 55295 && s <= 56319) {
      const n = (s - 55296) * 1024 & 65535;
      s = (t.charCodeAt(r + 1) - 56320 & 65535 | n) + 65536, r += 1;
    }
    fa(s, e);
  }
}
function ga(t, e, r) {
  if (e.utf8seq === 0) {
    if (t <= 127) {
      r(t);
      return;
    }
    for (let s = 1; s < 6; s += 1)
      if ((t >> 7 - s & 1) === 0) {
        e.utf8seq = s;
        break;
      }
    if (e.utf8seq === 2)
      e.codepoint = t & 31;
    else if (e.utf8seq === 3)
      e.codepoint = t & 15;
    else if (e.utf8seq === 4)
      e.codepoint = t & 7;
    else
      throw new Error("Invalid UTF-8 sequence");
    e.utf8seq -= 1;
  } else if (e.utf8seq > 0) {
    if (t <= 127)
      throw new Error("Invalid UTF-8 sequence");
    e.codepoint = e.codepoint << 6 | t & 63, e.utf8seq -= 1, e.utf8seq === 0 && r(e.codepoint);
  }
}
function We(t) {
  const e = [], r = { queue: 0, queuedBits: 0 }, s = (n) => {
    e.push(n);
  };
  for (let n = 0; n < t.length; n += 1)
    zs(t.charCodeAt(n), r, s);
  return new Uint8Array(e);
}
function ma(t) {
  const e = [];
  return pa(t, (r) => e.push(r)), new Uint8Array(e);
}
function Oe(t) {
  const e = [], r = { queue: 0, queuedBits: 0 }, s = (n) => {
    e.push(n);
  };
  return t.forEach((n) => Qr(n, r, s)), Qr(null, r, s), e.join("");
}
function Gs(t) {
  return Math.round(Date.now() / 1e3) + t;
}
function ya() {
  return /* @__PURE__ */ Symbol("auth-callback");
}
const G = () => typeof window < "u" && typeof document < "u", ke = {
  tested: !1,
  writable: !1
}, Js = () => {
  if (!G())
    return !1;
  try {
    if (typeof globalThis.localStorage != "object")
      return !1;
  } catch {
    return !1;
  }
  if (ke.tested)
    return ke.writable;
  const t = `lswt-${Math.random()}${Math.random()}`;
  try {
    globalThis.localStorage.setItem(t, t), globalThis.localStorage.removeItem(t), ke.tested = !0, ke.writable = !0;
  } catch {
    ke.tested = !0, ke.writable = !1;
  }
  return ke.writable;
};
function es(t) {
  const e = {}, r = new URL(t);
  if (r.hash && r.hash[0] === "#")
    try {
      new URLSearchParams(r.hash.substring(1)).forEach((n, i) => {
        e[i] = n;
      });
    } catch {
    }
  return r.searchParams.forEach((s, n) => {
    e[n] = s;
  }), e;
}
const Ys = (t) => t ? (...e) => t(...e) : (...e) => fetch(...e), _a = (t) => typeof t == "object" && t !== null && "status" in t && "ok" in t && "json" in t && typeof t.json == "function", ye = async (t, e, r) => {
  await t.setItem(e, JSON.stringify(r));
}, Y = async (t, e) => {
  const r = await t.getItem(e);
  if (!r)
    return null;
  try {
    return JSON.parse(r);
  } catch {
    return null;
  }
}, Z = async (t, e) => {
  await t.removeItem(e);
};
class Gt {
  constructor() {
    this.promise = new Gt.promiseConstructor((e, r) => {
      this.resolve = e, this.reject = r;
    });
  }
}
Gt.promiseConstructor = Promise;
function _t(t) {
  const e = t.split(".");
  if (e.length !== 3)
    throw new It("Invalid JWT structure");
  for (let s = 0; s < e.length; s++)
    if (!aa.test(e[s]))
      throw new It("JWT not in base64url format");
  return {
    // using base64url lib
    header: JSON.parse(Zr(e[0])),
    payload: JSON.parse(Zr(e[1])),
    signature: We(e[2]),
    raw: {
      header: e[0],
      payload: e[1]
    }
  };
}
async function wa(t) {
  return await new Promise((e) => {
    setTimeout(() => e(null), t);
  });
}
function va(t, e) {
  return new Promise((s, n) => {
    (async () => {
      for (let i = 0; i < 1 / 0; i++)
        try {
          const a = await t(i);
          if (!e(i, null, a)) {
            s(a);
            return;
          }
        } catch (a) {
          if (!e(i, a)) {
            n(a);
            return;
          }
        }
    })();
  });
}
function Xs(t) {
  return ("0" + t.toString(16)).substr(-2);
}
function ka() {
  const e = new Uint32Array(56);
  if (typeof crypto > "u") {
    const r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~", s = r.length;
    let n = "";
    for (let i = 0; i < 56; i++)
      n += r.charAt(Math.floor(Math.random() * s));
    return n;
  }
  return crypto.getRandomValues(e), Array.from(e, Xs).join("");
}
async function ba(t) {
  const r = new TextEncoder().encode(t), s = await crypto.subtle.digest("SHA-256", r), n = new Uint8Array(s);
  return Array.from(n).map((i) => String.fromCharCode(i)).join("");
}
async function xa(t) {
  if (!(typeof crypto < "u" && typeof crypto.subtle < "u" && typeof TextEncoder < "u"))
    return console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."), t;
  const r = await ba(t);
  return btoa(r).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
const Sa = /^[a-zA-Z0-9_-]{8,64}$/;
function St(t) {
  return typeof t == "string" && Sa.test(t) ? t : null;
}
function Ta() {
  if (typeof crypto < "u" && typeof crypto.getRandomValues == "function") {
    const e = new Uint8Array(16);
    return crypto.getRandomValues(e), Array.from(e, Xs).join("");
  }
  let t = "";
  for (let e = 0; e < 32; e++)
    t += Math.floor(Math.random() * 16).toString(16);
  return t;
}
const Ke = (t, e) => `${t}-flow-${e}-code-verifier`, ot = (t) => `${t}-flows-code-verifier`;
async function Sr(t, e) {
  const r = await Y(t, ot(e));
  return Array.isArray(r) ? r.filter((s) => St(s) !== null) : [];
}
async function Ea(t, e, r, s, n) {
  await ye(t, Ke(e, r), s);
  const i = (await Sr(t, e)).filter((a) => a !== r);
  for (i.push(r); i.length > oa; ) {
    const a = i.shift();
    await Z(t, Ke(e, a)), n?.(a);
  }
  await ye(t, ot(e), i), await ye(t, `${e}-code-verifier`, s);
}
async function Aa(t, e, r) {
  if (r) {
    const n = await Y(t, Ke(e, r));
    return { verifier: typeof n == "string" ? n : null, flowId: r };
  }
  const s = await Y(t, `${e}-code-verifier`);
  return { verifier: typeof s == "string" ? s : null, flowId: null };
}
async function ne(t, e, r) {
  const s = `${e}-code-verifier`;
  if (!r) {
    await Z(t, s);
    return;
  }
  const n = Ke(e, r), i = await Y(t, n);
  await Z(t, n);
  const a = await Sr(t, e), l = a.filter((h) => h !== r);
  l.length !== a.length && (l.length > 0 ? await ye(t, ot(e), l) : await Z(t, ot(e))), i != null && i === await Y(t, s) && await Z(t, s);
}
async function Ra(t, e) {
  const r = await Sr(t, e);
  for (const s of r)
    await Z(t, Ke(e, s));
  await Z(t, ot(e)), await Z(t, `${e}-code-verifier`);
}
function Oa(t, e) {
  const r = t.indexOf("#");
  let s = r === -1 ? t : t.slice(0, r);
  const n = r === -1 ? "" : t.slice(r), i = s.indexOf("?");
  if (i !== -1) {
    const l = s.slice(0, i), h = s.slice(i + 1).split("&").filter((o) => o !== "" && o !== Re && !o.startsWith(`${Re}=`));
    s = h.length > 0 ? `${l}?${h.join("&")}` : l;
  }
  const a = s.includes("?") ? "&" : "?";
  return `${s}${a}${Re}=${encodeURIComponent(e)}${n}`;
}
async function Ma(t, e, r = !1, s) {
  const n = ka();
  let i = n;
  r && (i += "/recovery");
  const a = Ta();
  await Ea(t, e, a, i, s);
  const l = await xa(n);
  return [l, n === l ? "plain" : "s256", a];
}
const Pa = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;
function Ca(t) {
  const e = t.headers.get(_r);
  if (!e || !e.match(Pa))
    return null;
  try {
    return /* @__PURE__ */ new Date(`${e}T00:00:00.0Z`);
  } catch {
    return null;
  }
}
function Ia(t) {
  if (!t)
    throw new Error("Missing exp claim");
  const e = Math.floor(Date.now() / 1e3);
  if (t <= e)
    throw new Error("JWT has expired");
}
function $a(t) {
  switch (t) {
    case "RS256":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: { name: "SHA-256" }
      };
    case "ES256":
      return {
        name: "ECDSA",
        namedCurve: "P-256",
        hash: { name: "SHA-256" }
      };
    default:
      throw new Error("Invalid alg claim");
  }
}
const ja = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function de(t) {
  if (!ja.test(t))
    throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not");
}
function Je(t) {
  if (!t.recoveryCodes)
    throw new Error("@supabase/auth-js: the MFA recovery codes API is experimental and disabled by default. Enable it by passing `auth: { experimental: { recoveryCodes: true } }` to createClient (or to the GoTrueClient constructor).");
}
function Qt() {
  const t = {};
  return new Proxy(t, {
    get: (e, r) => {
      if (r === "__isUserNotAvailableProxy")
        return !0;
      if (typeof r == "symbol") {
        const s = r.toString();
        if (s === "Symbol(Symbol.toPrimitive)" || s === "Symbol(Symbol.toStringTag)" || s === "Symbol(util.inspect.custom)")
          return;
      }
      throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Accessing the "${r}" property of the session object is not supported. Please use getUser() instead.`);
    },
    set: (e, r) => {
      throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Setting the "${r}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
    },
    deleteProperty: (e, r) => {
      throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Deleting the "${r}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
    }
  });
}
function La(t, e) {
  return new Proxy(t, {
    get: (r, s, n) => {
      if (s === "__isInsecureUserWarningProxy")
        return !0;
      if (typeof s == "symbol") {
        const i = s.toString();
        if (i === "Symbol(Symbol.toPrimitive)" || i === "Symbol(Symbol.toStringTag)" || i === "Symbol(util.inspect.custom)" || i === "Symbol(nodejs.util.inspect.custom)")
          return Reflect.get(r, s, n);
      }
      return !e.value && typeof s == "string" && (console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server."), e.value = !0), Reflect.get(r, s, n);
    }
  });
}
function ts(t) {
  return JSON.parse(JSON.stringify(t));
}
const xe = (t) => {
  if (typeof t == "object" && t !== null) {
    const e = t;
    if (typeof e.msg == "string")
      return e.msg;
    if (typeof e.message == "string")
      return e.message;
    if (typeof e.error_description == "string")
      return e.error_description;
    if (typeof e.error == "string")
      return e.error;
  }
  return JSON.stringify(t);
}, rs = [
  500,
  501,
  502,
  503,
  504,
  520,
  521,
  522,
  523,
  524,
  525,
  526,
  527,
  528,
  529,
  530
];
async function ss(t) {
  var e;
  if (!_a(t))
    throw new xt(xe(t), 0);
  let r;
  try {
    r = await t.json();
  } catch (i) {
    throw rs.includes(t.status) ? new xt(t.statusText || `HTTP ${t.status}`, t.status) : new oe(xe(i), i);
  }
  if (rs.includes(t.status))
    throw new xt(xe(r), t.status);
  let s;
  const n = Ca(t);
  if (n && n.getTime() >= Vs["2024-01-01"].timestamp && typeof r == "object" && r && typeof r.code == "string" ? s = r.code : typeof r == "object" && r && typeof r.error_code == "string" && (s = r.error_code), s) {
    if (s === "weak_password")
      throw new Yr(xe(r), t.status, ((e = r.weak_password) === null || e === void 0 ? void 0 : e.reasons) || []);
    if (s === "session_not_found")
      throw new z();
  } else if (typeof r == "object" && r && typeof r.weak_password == "object" && r.weak_password && Array.isArray(r.weak_password.reasons) && r.weak_password.reasons.length && r.weak_password.reasons.reduce((i, a) => i && typeof a == "string", !0))
    throw new Yr(xe(r), t.status, r.weak_password.reasons);
  throw new ca(xe(r), t.status || 500, s);
}
const Na = (t, e, r, s) => {
  const n = { method: t, headers: e?.headers || {} };
  return t === "GET" ? n : (n.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, e?.headers), n.body = JSON.stringify(s), Object.assign(Object.assign({}, n), r));
};
async function E(t, e, r, s) {
  var n;
  const i = Object.assign({}, s?.headers);
  i[_r] || (i[_r] = Vs["2024-01-01"].name), s?.jwt && (i.Authorization = `Bearer ${s.jwt}`);
  const a = (n = s?.query) !== null && n !== void 0 ? n : {};
  s?.redirectTo && (a.redirect_to = s.redirectTo);
  const l = Object.keys(a).length ? "?" + new URLSearchParams(a).toString() : "", h = await Da(t, e, r + l, {
    headers: i,
    noResolveJson: s?.noResolveJson
  }, {}, s?.body);
  return s?.xform ? s?.xform(h) : { data: Object.assign({}, h), error: null };
}
async function Da(t, e, r, s, n, i) {
  const a = Na(e, s, n, i);
  let l;
  try {
    l = await t(r, Object.assign({}, a));
  } catch (h) {
    throw new xt(xe(h), 0);
  }
  if (l.ok || await ss(l), s?.noResolveJson)
    return l;
  try {
    return await l.json();
  } catch (h) {
    await ss(h);
  }
}
function se(t) {
  var e;
  let r = null;
  Ua(t) && (r = Object.assign({}, t), t.expires_at || (r.expires_at = Gs(t.expires_in)));
  const s = (e = t.user) !== null && e !== void 0 ? e : typeof t?.id == "string" ? t : null;
  return { data: { session: r, user: s }, error: null };
}
function ns(t) {
  const e = se(t);
  return !e.error && t.weak_password && typeof t.weak_password == "object" && Array.isArray(t.weak_password.reasons) && t.weak_password.reasons.length && t.weak_password.message && typeof t.weak_password.message == "string" && t.weak_password.reasons.reduce((r, s) => r && typeof s == "string", !0) && (e.data.weak_password = t.weak_password), e;
}
function ve(t) {
  var e;
  return { data: { user: (e = t.user) !== null && e !== void 0 ? e : t }, error: null };
}
function Fa(t) {
  return { data: t, error: null };
}
function Ba(t) {
  const { action_link: e, email_otp: r, hashed_token: s, redirect_to: n, verification_type: i } = t, a = Kt(t, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"]), l = {
    action_link: e,
    email_otp: r,
    hashed_token: s,
    redirect_to: n,
    verification_type: i
  }, h = Object.assign({}, a);
  return {
    data: {
      properties: l,
      user: h
    },
    error: null
  };
}
function is(t) {
  return t;
}
function Ua(t) {
  return !!t.access_token && !!t.refresh_token && !!t.expires_in;
}
const Zt = ["global", "local", "others"];
class Ha {
  /**
   * Creates an admin API client that can be used to manage users and OAuth clients.
   *
   * @example Using supabase-js (recommended)
   * ```ts
   * import { createClient } from '@supabase/supabase-js'
   *
   * const supabase = createClient('https://xyzcompany.supabase.co', 'your-secret-key')
   * const { data, error } = await supabase.auth.admin.listUsers()
   * ```
   *
   * @example Standalone import for bundle-sensitive environments
   * ```ts
   * import { GoTrueAdminApi } from '@supabase/auth-js'
   *
   * const admin = new GoTrueAdminApi({
   *   url: 'https://xyzcompany.supabase.co/auth/v1',
   *   headers: { Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}` },
   * })
   * ```
   */
  constructor({ url: e = "", headers: r = {}, fetch: s, experimental: n }) {
    this.url = e, this.headers = r, this.fetch = Ys(s), this.experimental = n ?? {}, this.mfa = {
      listFactors: this._listFactors.bind(this),
      deleteFactor: this._deleteFactor.bind(this)
    }, this.oauth = {
      listClients: this._listOAuthClients.bind(this),
      createClient: this._createOAuthClient.bind(this),
      getClient: this._getOAuthClient.bind(this),
      updateClient: this._updateOAuthClient.bind(this),
      deleteClient: this._deleteOAuthClient.bind(this),
      regenerateClientSecret: this._regenerateOAuthClientSecret.bind(this)
    }, this.customProviders = {
      listProviders: this._listCustomProviders.bind(this),
      createProvider: this._createCustomProvider.bind(this),
      getProvider: this._getCustomProvider.bind(this),
      updateProvider: this._updateCustomProvider.bind(this),
      deleteProvider: this._deleteCustomProvider.bind(this)
    }, this.passkey = {
      listPasskeys: this._adminListPasskeys.bind(this),
      deletePasskey: this._adminDeletePasskey.bind(this)
    };
  }
  /**
   * Removes a logged-in session.
   * @param jwt A valid, logged-in JWT.
   * @param scope The logout sope.
   *
   * @category Auth
   * @subcategory Auth Admin
   */
  async signOut(e, r = Zt[0]) {
    if (Zt.indexOf(r) < 0)
      throw new Error(`@supabase/auth-js: Parameter scope must be one of ${Zt.join(", ")}`);
    try {
      return await E(this.fetch, "POST", `${this.url}/logout?scope=${r}`, {
        headers: this.headers,
        jwt: e,
        noResolveJson: !0
      }), { data: null, error: null };
    } catch (s) {
      if (k(s))
        return { data: null, error: s };
      throw s;
    }
  }
  /**
   * Sends an invite link to an email address.
   * @param email The email address of the user.
   * @param options Additional options to be included when inviting.
   *
   * @category Auth
   * @subcategory Auth Admin
   *
   * @remarks
   * - Sends an invite link to the user's email address.
   * - The `inviteUserByEmail()` method is typically used by administrators to invite users to join the application.
   * - Note that PKCE is not supported when using `inviteUserByEmail`. This is because the browser initiating the invite is often different from the browser accepting the invite which makes it difficult to provide the security guarantees required of the PKCE flow.
   *
   * @example Invite a user
   * ```js
   * const { data, error } = await supabase.auth.admin.inviteUserByEmail('email@example.com')
   * ```
   *
   * @exampleResponse Invite a user
   * ```json
   * {
   *   "data": {
   *     "user": {
   *       "id": "11111111-1111-1111-1111-111111111111",
   *       "aud": "authenticated",
   *       "role": "authenticated",
   *       "email": "example@email.com",
   *       "invited_at": "2024-01-01T00:00:00Z",
   *       "phone": "",
   *       "confirmation_sent_at": "2024-01-01T00:00:00Z",
   *       "app_metadata": {
   *         "provider": "email",
   *         "providers": [
   *           "email"
   *         ]
   *       },
   *       "user_metadata": {},
   *       "identities": [
   *         {
   *           "identity_id": "22222222-2222-2222-2222-222222222222",
   *           "id": "11111111-1111-1111-1111-111111111111",
   *           "user_id": "11111111-1111-1111-1111-111111111111",
   *           "identity_data": {
   *             "email": "example@email.com",
   *             "email_verified": false,
   *             "phone_verified": false,
   *             "sub": "11111111-1111-1111-1111-111111111111"
   *           },
   *           "provider": "email",
   *           "last_sign_in_at": "2024-01-01T00:00:00Z",
   *           "created_at": "2024-01-01T00:00:00Z",
   *           "updated_at": "2024-01-01T00:00:00Z",
   *           "email": "example@email.com"
   *         }
   *       ],
   *       "created_at": "2024-01-01T00:00:00Z",
   *       "updated_at": "2024-01-01T00:00:00Z",
   *       "is_anonymous": false
   *     }
   *   },
   *   "error": null
   * }
   * ```
   */
  async inviteUserByEmail(e, r = {}) {
    try {
      return await E(this.fetch, "POST", `${this.url}/invite`, {
        body: { email: e, data: r.data },
        headers: this.headers,
        redirectTo: r.redirectTo,
        xform: ve
      });
    } catch (s) {
      if (k(s))
        return { data: { user: null }, error: s };
      throw s;
    }
  }
  /**
   * Generates email links and OTPs to be sent via a custom email provider.
   * @param params The parameters for generating the link, including the link `type`, the user's `email`, and type-specific options such as `password`, `data`, and `redirectTo`.
   *
   * @category Auth
   * @subcategory Auth Admin
   *
   * @remarks
   * - The following types can be passed into `generateLink()`: `signup`, `magiclink`, `invite`, `recovery`, `email_change_current`, `email_change_new`, `phone_change`.
   * - `generateLink()` only generates the email link for `email_change_email` if the **Secure email change** is enabled in your project's [email auth provider settings](/dashboard/project/_/auth/providers).
   * - `generateLink()` handles the creation of the user for `signup`, `invite` and `magiclink`.
   *
   * @example Generate a signup link
   * ```js
   * const { data, error } = await supabase.auth.admin.generateLink({
   *   type: 'signup',
   *   email: 'email@example.com',
   *   password: 'secret'
   * })
   * ```
   *
   * @exampleResponse Generate a signup link
   * ```json
   * {
   *   "data": {
   *     "properties": {
   *       "action_link": "<LINK_TO_SEND_TO_USER>",
   *       "email_otp": "999999",
   *       "hashed_token": "<HASHED_TOKEN",
   *       "redirect_to": "<REDIRECT_URL>",
   *       "verification_type": "signup"
   *     },
   *     "user": {
   *       "id": "11111111-1111-1111-1111-111111111111",
   *       "aud": "authenticated",
   *       "role": "authenticated",
   *       "email": "email@example.com",
   *       "phone": "",
   *       "confirmation_sent_at": "2024-01-01T00:00:00Z",
   *       "app_metadata": {
   *         "provider": "email",
   *         "providers": [
   *           "email"
   *         ]
   *       },
   *       "user_metadata": {},
   *       "identities": [
   *         {
   *           "identity_id": "22222222-2222-2222-2222-222222222222",
   *           "id": "11111111-1111-1111-1111-111111111111",
   *           "user_id": "11111111-1111-1111-1111-111111111111",
   *           "identity_data": {
   *             "email": "email@example.com",
   *             "email_verified": false,
   *             "phone_verified": false,
   *             "sub": "11111111-1111-1111-1111-111111111111"
   *           },
   *           "provider": "email",
   *           "last_sign_in_at": "2024-01-01T00:00:00Z",
   *           "created_at": "2024-01-01T00:00:00Z",
   *           "updated_at": "2024-01-01T00:00:00Z",
   *           "email": "email@example.com"
   *         }
   *       ],
   *       "created_at": "2024-01-01T00:00:00Z",
   *       "updated_at": "2024-01-01T00:00:00Z",
   *       "is_anonymous": false
   *     }
   *   },
   *   "error": null
   * }
   * ```
   *
   * @example Generate an invite link
   * ```js
   * const { data, error } = await supabase.auth.admin.generateLink({
   *   type: 'invite',
   *   email: 'email@example.com'
   * })
   * ```
   *
   * @example Generate a magic link
   * ```js
   * const { data, error } = await supabase.auth.admin.generateLink({
   *   type: 'magiclink',
   *   email: 'email@example.com'
   * })
   * ```
   *
   * @example Generate a recovery link
   * ```js
   * const { data, error } = await supabase.auth.admin.generateLink({
   *   type: 'recovery',
   *   email: 'email@example.com'
   * })
   * ```
   *
   * @example Generate links to change current email address
   * ```js
   * // generate an email change link to be sent to the current email address
   * const { data, error } = await supabase.auth.admin.generateLink({
   *   type: 'email_change_current',
   *   email: 'current.email@example.com',
   *   newEmail: 'new.email@example.com'
   * })
   *
   * // generate an email change link to be sent to the new email address
   * const { data, error } = await supabase.auth.admin.generateLink({
   *   type: 'email_change_new',
   *   email: 'current.email@example.com',
   *   newEmail: 'new.email@example.com'
   * })
   * ```
   */
  async generateLink(e) {
    try {
      const { options: r } = e, s = Kt(e, ["options"]), n = Object.assign(Object.assign({}, s), r);
      return "newEmail" in s && (n.new_email = s?.newEmail, delete n.newEmail), await E(this.fetch, "POST", `${this.url}/admin/generate_link`, {
        body: n,
        headers: this.headers,
        xform: Ba,
        redirectTo: r?.redirectTo
      });
    } catch (r) {
      if (k(r))
        return {
          data: {
            properties: null,
            user: null
          },
          error: r
        };
      throw r;
    }
  }
  // User Admin API
  /**
   * Creates a new user.
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   *
   * @category Auth
   * @subcategory Auth Admin
   *
   * @remarks
   * - To confirm the user's email address or phone number, set `email_confirm` or `phone_confirm` to true. Both arguments default to false.
   * - `createUser()` will not send a confirmation email to the user. You can use [`inviteUserByEmail()`](/docs/reference/javascript/auth-admin-inviteuserbyemail) if you want to send them an email invite instead.
   * - If you are sure that the created user's email or phone number is legitimate and verified, you can set the `email_confirm` or `phone_confirm` param to `true`.
   *
   * @example With custom user metadata
   * ```js
   * const { data, error } = await supabase.auth.admin.createUser({
   *   email: 'user@email.com',
   *   password: 'password',
   *   user_metadata: { name: 'Yoda' }
   * })
   * ```
   *
   * @exampleResponse With custom user metadata
   * ```json
   * {
   *   data: {
   *     user: {
   *       id: '1',
   *       aud: 'authenticated',
   *       role: 'authenticated',
   *       email: 'example@email.com',
   *       email_confirmed_at: '2024-01-01T00:00:00Z',
   *       phone: '',
   *       confirmation_sent_at: '2024-01-01T00:00:00Z',
   *       confirmed_at: '2024-01-01T00:00:00Z',
   *       last_sign_in_at: '2024-01-01T00:00:00Z',
   *       app_metadata: {},
   *       user_metadata: {},
   *       identities: [
   *         {
   *           "identity_id": "22222222-2222-2222-2222-222222222222",
   *           "id": "1",
   *           "user_id": "1",
   *           "identity_data": {
   *             "email": "example@email.com",
   *             "email_verified": true,
   *             "phone_verified": false,
   *             "sub": "1"
   *           },
   *           "provider": "email",
   *           "last_sign_in_at": "2024-01-01T00:00:00Z",
   *           "created_at": "2024-01-01T00:00:00Z",
   *           "updated_at": "2024-01-01T00:00:00Z",
   *           "email": "email@example.com"
   *         },
   *       ],
   *       created_at: '2024-01-01T00:00:00Z',
   *       updated_at: '2024-01-01T00:00:00Z',
   *       is_anonymous: false,
   *     }
   *   }
   *   error: null
   * }
   * ```
   *
   * @example Auto-confirm the user's email
   * ```js
   * const { data, error } = await supabase.auth.admin.createUser({
   *   email: 'user@email.com',
   *   email_confirm: true
   * })
   * ```
   *
   * @example Auto-confirm the user's phone number
   * ```js
   * const { data, error } = await supabase.auth.admin.createUser({
   *   phone: '1234567890',
   *   phone_confirm: true
   * })
   * ```
   */
  async createUser(e) {
    try {
      return await E(this.fetch, "POST", `${this.url}/admin/users`, {
        body: e,
        headers: this.headers,
        xform: ve
      });
    } catch (r) {
      if (k(r))
        return { data: { user: null }, error: r };
      throw r;
    }
  }
  /**
   * Get a list of users.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   * @param params An object which supports `page` and `perPage` as numbers, to alter the paginated results.
   *
   * @category Auth
   * @subcategory Auth Admin
   *
   * @remarks
   * - Defaults to return 50 users per page.
   *
   * @example Get a page of users
   * ```js
   * const { data: { users }, error } = await supabase.auth.admin.listUsers()
   * ```
   *
   * @example Paginated list of users
   * ```js
   * const { data: { users }, error } = await supabase.auth.admin.listUsers({
   *   page: 1,
   *   perPage: 1000
   * })
   * ```
   */
  async listUsers(e) {
    var r, s, n, i, a, l, h;
    try {
      const o = { nextPage: null, lastPage: 0, total: 0 }, c = await E(this.fetch, "GET", `${this.url}/admin/users`, {
        headers: this.headers,
        noResolveJson: !0,
        query: {
          page: (s = (r = e?.page) === null || r === void 0 ? void 0 : r.toString()) !== null && s !== void 0 ? s : "",
          per_page: (i = (n = e?.perPage) === null || n === void 0 ? void 0 : n.toString()) !== null && i !== void 0 ? i : ""
        },
        xform: is
      });
      if (c.error)
        throw c.error;
      const u = await c.json(), d = (a = c.headers.get("x-total-count")) !== null && a !== void 0 ? a : 0, f = (h = (l = c.headers.get("link")) === null || l === void 0 ? void 0 : l.split(",")) !== null && h !== void 0 ? h : [];
      return f.length > 0 && (f.forEach((g) => {
        const m = parseInt(g.split(";")[0].split("=")[1].substring(0, 1)), p = JSON.parse(g.split(";")[1].split("=")[1]);
        o[`${p}Page`] = m;
      }), o.total = parseInt(d)), { data: Object.assign(Object.assign({}, u), o), error: null };
    } catch (o) {
      if (k(o))
        return { data: { users: [] }, error: o };
      throw o;
    }
  }
  /**
   * Get user by id.
   *
   * @param uid The user's unique identifier
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   *
   * @category Auth
   * @subcategory Auth Admin
   *
   * @remarks
   * - Fetches the user object from the database based on the user's id.
   * - The `getUserById()` method requires the user's id which maps to the `auth.users.id` column.
   *
   * @example Fetch the user object using the access_token jwt
   * ```js
   * const { data, error } = await supabase.auth.admin.getUserById(1)
   * ```
   *
   * @exampleResponse Fetch the user object using the access_token jwt
   * ```json
   * {
   *   data: {
   *     user: {
   *       id: '1',
   *       aud: 'authenticated',
   *       role: 'authenticated',
   *       email: 'example@email.com',
   *       email_confirmed_at: '2024-01-01T00:00:00Z',
   *       phone: '',
   *       confirmation_sent_at: '2024-01-01T00:00:00Z',
   *       confirmed_at: '2024-01-01T00:00:00Z',
   *       last_sign_in_at: '2024-01-01T00:00:00Z',
   *       app_metadata: {},
   *       user_metadata: {},
   *       identities: [
   *         {
   *           "identity_id": "22222222-2222-2222-2222-222222222222",
   *           "id": "1",
   *           "user_id": "1",
   *           "identity_data": {
   *             "email": "example@email.com",
   *             "email_verified": true,
   *             "phone_verified": false,
   *             "sub": "1"
   *           },
   *           "provider": "email",
   *           "last_sign_in_at": "2024-01-01T00:00:00Z",
   *           "created_at": "2024-01-01T00:00:00Z",
   *           "updated_at": "2024-01-01T00:00:00Z",
   *           "email": "email@example.com"
   *         },
   *       ],
   *       created_at: '2024-01-01T00:00:00Z',
   *       updated_at: '2024-01-01T00:00:00Z',
   *       is_anonymous: false,
   *     }
   *   }
   *   error: null
   * }
   * ```
   */
  async getUserById(e) {
    de(e);
    try {
      return await E(this.fetch, "GET", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        xform: ve
      });
    } catch (r) {
      if (k(r))
        return { data: { user: null }, error: r };
      throw r;
    }
  }
  /**
   * Updates the user data. Changes are applied directly without confirmation flows.
   *
   * @param uid The user's unique identifier
   * @param attributes The data you want to update.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   *
   * @remarks
   * **Important:** This is a server-side operation and does **not** trigger client-side
   * `onAuthStateChange` listeners. The admin API has no connection to client state.
   *
   * To sync changes to the client after calling this method:
   * 1. On the client, call `supabase.auth.refreshSession()` to fetch the updated user data
   * 2. This will trigger the `TOKEN_REFRESHED` event and notify all listeners
   *
   * @example
   * ```typescript
   * // Server-side (Edge Function)
   * const { data, error } = await supabase.auth.admin.updateUserById(
   *   userId,
   *   { user_metadata: { preferences: { theme: 'dark' } } }
   * )
   *
   * // Client-side (to sync the changes)
   * const { data, error } = await supabase.auth.refreshSession()
   * // onAuthStateChange listeners will now be notified with updated user
   * ```
   *
   * @see {@link GoTrueClient.refreshSession} for syncing admin changes to the client
   * @see {@link GoTrueClient.updateUser} for client-side user updates (triggers listeners automatically)
   *
   * @category Auth
   * @subcategory Auth Admin
   *
   * @example Updates a user's email
   * ```js
   * const { data: user, error } = await supabase.auth.admin.updateUserById(
   *   '11111111-1111-1111-1111-111111111111',
   *   { email: 'new@email.com' }
   * )
   * ```
   *
   * @exampleResponse Updates a user's email
   * ```json
   * {
   *   "data": {
   *     "user": {
   *       "id": "11111111-1111-1111-1111-111111111111",
   *       "aud": "authenticated",
   *       "role": "authenticated",
   *       "email": "new@email.com",
   *       "email_confirmed_at": "2024-01-01T00:00:00Z",
   *       "phone": "",
   *       "confirmed_at": "2024-01-01T00:00:00Z",
   *       "recovery_sent_at": "2024-01-01T00:00:00Z",
   *       "last_sign_in_at": "2024-01-01T00:00:00Z",
   *       "app_metadata": {
   *         "provider": "email",
   *         "providers": [
   *           "email"
   *         ]
   *       },
   *       "user_metadata": {
   *         "email": "example@email.com",
   *         "email_verified": false,
   *         "phone_verified": false,
   *         "sub": "11111111-1111-1111-1111-111111111111"
   *       },
   *       "identities": [
   *         {
   *           "identity_id": "22222222-2222-2222-2222-222222222222",
   *           "id": "11111111-1111-1111-1111-111111111111",
   *           "user_id": "11111111-1111-1111-1111-111111111111",
   *           "identity_data": {
   *             "email": "example@email.com",
   *             "email_verified": false,
   *             "phone_verified": false,
   *             "sub": "11111111-1111-1111-1111-111111111111"
   *           },
   *           "provider": "email",
   *           "last_sign_in_at": "2024-01-01T00:00:00Z",
   *           "created_at": "2024-01-01T00:00:00Z",
   *           "updated_at": "2024-01-01T00:00:00Z",
   *           "email": "example@email.com"
   *         }
   *       ],
   *       "created_at": "2024-01-01T00:00:00Z",
   *       "updated_at": "2024-01-01T00:00:00Z",
   *       "is_anonymous": false
   *     }
   *   },
   *   "error": null
   * }
   * ```
   *
   * @example Updates a user's password
   * ```js
   * const { data: user, error } = await supabase.auth.admin.updateUserById(
   *   '6aa5d0d4-2a9f-4483-b6c8-0cf4c6c98ac4',
   *   { password: 'new_password' }
   * )
   * ```
   *
   * @example Updates a user's metadata
   * ```js
   * const { data: user, error } = await supabase.auth.admin.updateUserById(
   *   '6aa5d0d4-2a9f-4483-b6c8-0cf4c6c98ac4',
   *   { user_metadata: { hello: 'world' } }
   * )
   * ```
   *
   * @example Updates a user's app_metadata
   * ```js
   * const { data: user, error } = await supabase.auth.admin.updateUserById(
   *   '6aa5d0d4-2a9f-4483-b6c8-0cf4c6c98ac4',
   *   { app_metadata: { plan: 'trial' } }
   * )
   * ```
   *
   * @example Confirms a user's email address
   * ```js
   * const { data: user, error } = await supabase.auth.admin.updateUserById(
   *   '6aa5d0d4-2a9f-4483-b6c8-0cf4c6c98ac4',
   *   { email_confirm: true }
   * )
   * ```
   *
   * @example Confirms a user's phone number
   * ```js
   * const { data: user, error } = await supabase.auth.admin.updateUserById(
   *   '6aa5d0d4-2a9f-4483-b6c8-0cf4c6c98ac4',
   *   { phone_confirm: true }
   * )
   * ```
   *
   * @example Ban a user for 100 years
   * ```js
   * const { data: user, error } = await supabase.auth.admin.updateUserById(
   *   '6aa5d0d4-2a9f-4483-b6c8-0cf4c6c98ac4',
   *   { ban_duration: '876000h' }
   * )
   * ```
   */
  async updateUserById(e, r) {
    de(e);
    try {
      return await E(this.fetch, "PUT", `${this.url}/admin/users/${e}`, {
        body: r,
        headers: this.headers,
        xform: ve
      });
    } catch (s) {
      if (k(s))
        return { data: { user: null }, error: s };
      throw s;
    }
  }
  /**
   * Delete a user. Requires a `service_role` key.
   *
   * @param id The user id you want to remove.
   * @param shouldSoftDelete If true, then the user will be soft-deleted from the auth schema. Soft deletion allows user identification from the hashed user ID but is not reversible.
   * Defaults to false for backward compatibility.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   *
   * @category Auth
   * @subcategory Auth Admin
   *
   * @remarks
   * - The `deleteUser()` method requires the user's ID, which maps to the `auth.users.id` column.
   *
   * @example Removes a user
   * ```js
   * const { data, error } = await supabase.auth.admin.deleteUser(
   *   '715ed5db-f090-4b8c-a067-640ecee36aa0'
   * )
   * ```
   *
   * @exampleResponse Removes a user
   * ```json
   * {
   *   "data": {
   *     "user": {}
   *   },
   *   "error": null
   * }
   * ```
   */
  async deleteUser(e, r = !1) {
    de(e);
    try {
      return await E(this.fetch, "DELETE", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        body: {
          should_soft_delete: r
        },
        xform: ve
      });
    } catch (s) {
      if (k(s))
        return { data: { user: null }, error: s };
      throw s;
    }
  }
  async _listFactors(e) {
    de(e.userId);
    try {
      const { data: r, error: s } = await E(this.fetch, "GET", `${this.url}/admin/users/${e.userId}/factors`, {
        headers: this.headers,
        xform: (n) => ({ data: { factors: n }, error: null })
      });
      return { data: r, error: s };
    } catch (r) {
      if (k(r))
        return { data: null, error: r };
      throw r;
    }
  }
  async _deleteFactor(e) {
    de(e.userId), de(e.id);
    try {
      return { data: await E(this.fetch, "DELETE", `${this.url}/admin/users/${e.userId}/factors/${e.id}`, {
        headers: this.headers
      }), error: null };
    } catch (r) {
      if (k(r))
        return { data: null, error: r };
      throw r;
    }
  }
  /**
   * Lists all OAuth clients with optional pagination.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async _listOAuthClients(e) {
    var r, s, n, i, a, l, h;
    try {
      const o = { nextPage: null, lastPage: 0, total: 0 }, c = await E(this.fetch, "GET", `${this.url}/admin/oauth/clients`, {
        headers: this.headers,
        noResolveJson: !0,
        query: {
          page: (s = (r = e?.page) === null || r === void 0 ? void 0 : r.toString()) !== null && s !== void 0 ? s : "",
          per_page: (i = (n = e?.perPage) === null || n === void 0 ? void 0 : n.toString()) !== null && i !== void 0 ? i : ""
        },
        xform: is
      });
      if (c.error)
        throw c.error;
      const u = await c.json(), d = (a = c.headers.get("x-total-count")) !== null && a !== void 0 ? a : 0, f = (h = (l = c.headers.get("link")) === null || l === void 0 ? void 0 : l.split(",")) !== null && h !== void 0 ? h : [];
      return f.length > 0 && (f.forEach((g) => {
        const m = parseInt(g.split(";")[0].split("=")[1].substring(0, 1)), p = JSON.parse(g.split(";")[1].split("=")[1]);
        o[`${p}Page`] = m;
      }), o.total = parseInt(d)), { data: Object.assign(Object.assign({}, u), o), error: null };
    } catch (o) {
      if (k(o))
        return { data: { clients: [] }, error: o };
      throw o;
    }
  }
  /**
   * Creates a new OAuth client.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async _createOAuthClient(e) {
    try {
      return await E(this.fetch, "POST", `${this.url}/admin/oauth/clients`, {
        body: e,
        headers: this.headers,
        xform: (r) => ({ data: r, error: null })
      });
    } catch (r) {
      if (k(r))
        return { data: null, error: r };
      throw r;
    }
  }
  /**
   * Gets details of a specific OAuth client.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async _getOAuthClient(e) {
    try {
      return await E(this.fetch, "GET", `${this.url}/admin/oauth/clients/${e}`, {
        headers: this.headers,
        xform: (r) => ({ data: r, error: null })
      });
    } catch (r) {
      if (k(r))
        return { data: null, error: r };
      throw r;
    }
  }
  /**
   * Updates an existing OAuth client.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async _updateOAuthClient(e, r) {
    try {
      return await E(this.fetch, "PUT", `${this.url}/admin/oauth/clients/${e}`, {
        body: r,
        headers: this.headers,
        xform: (s) => ({ data: s, error: null })
      });
    } catch (s) {
      if (k(s))
        return { data: null, error: s };
      throw s;
    }
  }
  /**
   * Deletes an OAuth client.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async _deleteOAuthClient(e) {
    try {
      return await E(this.fetch, "DELETE", `${this.url}/admin/oauth/clients/${e}`, {
        headers: this.headers,
        noResolveJson: !0
      }), { data: null, error: null };
    } catch (r) {
      if (k(r))
        return { data: null, error: r };
      throw r;
    }
  }
  /**
   * Regenerates the secret for an OAuth client.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async _regenerateOAuthClientSecret(e) {
    try {
      return await E(this.fetch, "POST", `${this.url}/admin/oauth/clients/${e}/regenerate_secret`, {
        headers: this.headers,
        xform: (r) => ({ data: r, error: null })
      });
    } catch (r) {
      if (k(r))
        return { data: null, error: r };
      throw r;
    }
  }
  /**
   * Lists all custom providers with optional type filter.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async _listCustomProviders(e) {
    try {
      const r = {};
      return e?.type && (r.type = e.type), await E(this.fetch, "GET", `${this.url}/admin/custom-providers`, {
        headers: this.headers,
        query: r,
        xform: (s) => {
          var n;
          return { data: { providers: (n = s?.providers) !== null && n !== void 0 ? n : [] }, error: null };
        }
      });
    } catch (r) {
      if (k(r))
        return { data: { providers: [] }, error: r };
      throw r;
    }
  }
  /**
   * Creates a new custom OIDC/OAuth provider.
   *
   * For OIDC providers, the server fetches and validates the OpenID Connect discovery document
   * from the issuer's well-known endpoint (or the provided `discovery_url`) at creation time.
   * This may return a validation error (`error_code: "validation_failed"`) if the discovery
   * document is unreachable, not valid JSON, missing required fields, or if the issuer
   * in the document does not match the expected issuer.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async _createCustomProvider(e) {
    try {
      return await E(this.fetch, "POST", `${this.url}/admin/custom-providers`, {
        body: e,
        headers: this.headers,
        xform: (r) => ({ data: r, error: null })
      });
    } catch (r) {
      if (k(r))
        return { data: null, error: r };
      throw r;
    }
  }
  /**
   * Gets details of a specific custom provider by identifier.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async _getCustomProvider(e) {
    try {
      return await E(this.fetch, "GET", `${this.url}/admin/custom-providers/${e}`, {
        headers: this.headers,
        xform: (r) => ({ data: r, error: null })
      });
    } catch (r) {
      if (k(r))
        return { data: null, error: r };
      throw r;
    }
  }
  /**
   * Updates an existing custom provider.
   *
   * When `issuer` or `discovery_url` is changed on an OIDC provider, the server re-fetches and
   * validates the discovery document before persisting. This may return a validation error
   * (`error_code: "validation_failed"`) if the discovery document is unreachable, invalid, or
   * the issuer does not match.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async _updateCustomProvider(e, r) {
    try {
      return await E(this.fetch, "PUT", `${this.url}/admin/custom-providers/${e}`, {
        body: r,
        headers: this.headers,
        xform: (s) => ({ data: s, error: null })
      });
    } catch (s) {
      if (k(s))
        return { data: null, error: s };
      throw s;
    }
  }
  /**
   * Deletes a custom provider.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async _deleteCustomProvider(e) {
    try {
      return await E(this.fetch, "DELETE", `${this.url}/admin/custom-providers/${e}`, {
        headers: this.headers,
        noResolveJson: !0
      }), { data: null, error: null };
    } catch (r) {
      if (k(r))
        return { data: null, error: r };
      throw r;
    }
  }
  /**
   * Lists all passkeys for a user.
   *
   * This function should only be called on a server. Never expose your secret key in the browser.
   */
  async _adminListPasskeys(e) {
    de(e.userId);
    try {
      return await E(this.fetch, "GET", `${this.url}/admin/users/${e.userId}/passkeys`, { headers: this.headers, xform: (r) => ({ data: r, error: null }) });
    } catch (r) {
      if (k(r))
        return { data: null, error: r };
      throw r;
    }
  }
  /**
   * Deletes a user's passkey.
   *
   * This function should only be called on a server. Never expose your secret key in the browser.
   */
  async _adminDeletePasskey(e) {
    de(e.userId), de(e.passkeyId);
    try {
      return await E(this.fetch, "DELETE", `${this.url}/admin/users/${e.userId}/passkeys/${e.passkeyId}`, { headers: this.headers, noResolveJson: !0 }), { data: null, error: null };
    } catch (r) {
      if (k(r))
        return { data: null, error: r };
      throw r;
    }
  }
}
function as(t = {}) {
  return {
    getItem: (e) => t[e] || null,
    setItem: (e, r) => {
      t[e] = r;
    },
    removeItem: (e) => {
      delete t[e];
    }
  };
}
globalThis && Js() && globalThis.localStorage && globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug");
class qa extends Error {
  constructor(e) {
    super(e), this.isAcquireTimeout = !0;
  }
}
function Wa() {
  if (typeof globalThis != "object")
    try {
      Object.defineProperty(Object.prototype, "__magic__", {
        get: function() {
          return this;
        },
        configurable: !0
      }), __magic__.globalThis = __magic__, delete Object.prototype.__magic__;
    } catch {
      typeof self < "u" && (self.globalThis = self);
    }
}
function Qs(t) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(t))
    throw new Error(`@supabase/auth-js: Address "${t}" is invalid.`);
  return t.toLowerCase();
}
function Ka(t) {
  return parseInt(t, 16);
}
function Va(t) {
  const e = new TextEncoder().encode(t);
  return "0x" + Array.from(e, (s) => s.toString(16).padStart(2, "0")).join("");
}
function za(t) {
  var e;
  const { chainId: r, domain: s, expirationTime: n, issuedAt: i = /* @__PURE__ */ new Date(), nonce: a, notBefore: l, requestId: h, resources: o, scheme: c, uri: u, version: d } = t;
  {
    if (!Number.isInteger(r))
      throw new Error(`@supabase/auth-js: Invalid SIWE message field "chainId". Chain ID must be a EIP-155 chain ID. Provided value: ${r}`);
    if (!s)
      throw new Error('@supabase/auth-js: Invalid SIWE message field "domain". Domain must be provided.');
    if (a && a.length < 8)
      throw new Error(`@supabase/auth-js: Invalid SIWE message field "nonce". Nonce must be at least 8 characters. Provided value: ${a}`);
    if (!u)
      throw new Error('@supabase/auth-js: Invalid SIWE message field "uri". URI must be provided.');
    if (d !== "1")
      throw new Error(`@supabase/auth-js: Invalid SIWE message field "version". Version must be '1'. Provided value: ${d}`);
    if (!((e = t.statement) === null || e === void 0) && e.includes(`
`))
      throw new Error(`@supabase/auth-js: Invalid SIWE message field "statement". Statement must not include '\\n'. Provided value: ${t.statement}`);
  }
  const f = Qs(t.address), g = c ? `${c}://${s}` : s, m = t.statement ? `${t.statement}
` : "", p = `${g} wants you to sign in with your Ethereum account:
${f}

${m}`;
  let y = `URI: ${u}
Version: ${d}
Chain ID: ${r}${a ? `
Nonce: ${a}` : ""}
Issued At: ${i.toISOString()}`;
  if (n && (y += `
Expiration Time: ${n.toISOString()}`), l && (y += `
Not Before: ${l.toISOString()}`), h && (y += `
Request ID: ${h}`), o) {
    let _ = `
Resources:`;
    for (const w of o) {
      if (!w || typeof w != "string")
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "resources". Every resource must be a valid string. Provided value: ${w}`);
      _ += `
- ${w}`;
    }
    y += _;
  }
  return `${p}
${y}`;
}
class V extends Error {
  constructor({ message: e, code: r, cause: s, name: n }) {
    var i;
    super(e, { cause: s }), this.__isWebAuthnError = !0, this.name = (i = n ?? (s instanceof Error ? s.name : void 0)) !== null && i !== void 0 ? i : "Unknown Error", this.code = r;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code
    };
  }
}
class jt extends V {
  constructor(e, r) {
    super({
      code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
      cause: r,
      message: e
    }), this.name = "WebAuthnUnknownError", this.originalError = r;
  }
}
function Ga({ error: t, options: e }) {
  var r, s, n;
  const { publicKey: i } = e;
  if (!i)
    throw Error("options was missing required publicKey property");
  if (t.name === "AbortError") {
    if (e.signal instanceof AbortSignal)
      return new V({
        message: "Registration ceremony was sent an abort signal",
        code: "ERROR_CEREMONY_ABORTED",
        cause: t
      });
  } else if (t.name === "ConstraintError") {
    if (((r = i.authenticatorSelection) === null || r === void 0 ? void 0 : r.requireResidentKey) === !0)
      return new V({
        message: "Discoverable credentials were required but no available authenticator supported it",
        code: "ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT",
        cause: t
      });
    if (
      // @ts-ignore: `mediation` doesn't yet exist on CredentialCreationOptions but it's possible as of Sept 2024
      e.mediation === "conditional" && ((s = i.authenticatorSelection) === null || s === void 0 ? void 0 : s.userVerification) === "required"
    )
      return new V({
        message: "User verification was required during automatic registration but it could not be performed",
        code: "ERROR_AUTO_REGISTER_USER_VERIFICATION_FAILURE",
        cause: t
      });
    if (((n = i.authenticatorSelection) === null || n === void 0 ? void 0 : n.userVerification) === "required")
      return new V({
        message: "User verification was required but no available authenticator supported it",
        code: "ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT",
        cause: t
      });
  } else {
    if (t.name === "InvalidStateError")
      return new V({
        message: "The authenticator was previously registered",
        code: "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED",
        cause: t
      });
    if (t.name === "NotAllowedError")
      return new V({
        message: t.message,
        code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
        cause: t
      });
    if (t.name === "NotSupportedError")
      return i.pubKeyCredParams.filter((l) => l.type === "public-key").length === 0 ? new V({
        message: 'No entry in pubKeyCredParams was of type "public-key"',
        code: "ERROR_MALFORMED_PUBKEYCREDPARAMS",
        cause: t
      }) : new V({
        message: "No available authenticator supported any of the specified pubKeyCredParams algorithms",
        code: "ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG",
        cause: t
      });
    if (t.name === "SecurityError") {
      const a = window.location.hostname;
      if (Zs(a)) {
        if (i.rp.id !== a)
          return new V({
            message: `The RP ID "${i.rp.id}" is invalid for this domain`,
            code: "ERROR_INVALID_RP_ID",
            cause: t
          });
      } else return new V({
        message: `${window.location.hostname} is an invalid domain`,
        code: "ERROR_INVALID_DOMAIN",
        cause: t
      });
    } else if (t.name === "TypeError") {
      if (i.user.id.byteLength < 1 || i.user.id.byteLength > 64)
        return new V({
          message: "User ID was not between 1 and 64 characters",
          code: "ERROR_INVALID_USER_ID_LENGTH",
          cause: t
        });
    } else if (t.name === "UnknownError")
      return new V({
        message: "The authenticator was unable to process the specified options, or could not create a new credential",
        code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
        cause: t
      });
  }
  return new V({
    message: "a Non-Webauthn related error has occurred",
    code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
    cause: t
  });
}
function Ja({ error: t, options: e }) {
  const { publicKey: r } = e;
  if (!r)
    throw Error("options was missing required publicKey property");
  if (t.name === "AbortError") {
    if (e.signal instanceof AbortSignal)
      return new V({
        message: "Authentication ceremony was sent an abort signal",
        code: "ERROR_CEREMONY_ABORTED",
        cause: t
      });
  } else {
    if (t.name === "NotAllowedError")
      return new V({
        message: t.message,
        code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
        cause: t
      });
    if (t.name === "SecurityError") {
      const s = window.location.hostname;
      if (Zs(s)) {
        if (r.rpId !== s)
          return new V({
            message: `The RP ID "${r.rpId}" is invalid for this domain`,
            code: "ERROR_INVALID_RP_ID",
            cause: t
          });
      } else return new V({
        message: `${window.location.hostname} is an invalid domain`,
        code: "ERROR_INVALID_DOMAIN",
        cause: t
      });
    } else if (t.name === "UnknownError")
      return new V({
        message: "The authenticator was unable to process the specified options, or could not create a new assertion signature",
        code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
        cause: t
      });
  }
  return new V({
    message: "a Non-Webauthn related error has occurred",
    code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
    cause: t
  });
}
class Ya {
  /**
   * Create an abort signal for a new WebAuthn operation.
   * Automatically cancels any existing operation.
   *
   * @returns {AbortSignal} Signal to pass to navigator.credentials.create() or .get()
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal MDN - AbortSignal}
   */
  createNewAbortSignal() {
    if (this.controller) {
      const r = new Error("Cancelling existing WebAuthn API call for new one");
      r.name = "AbortError", this.controller.abort(r);
    }
    const e = new AbortController();
    return this.controller = e, e.signal;
  }
  /**
   * Manually cancel the current WebAuthn operation.
   * Useful for cleaning up when user cancels or navigates away.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort MDN - AbortController.abort}
   */
  cancelCeremony() {
    if (this.controller) {
      const e = new Error("Manually cancelling existing WebAuthn API call");
      e.name = "AbortError", this.controller.abort(e), this.controller = void 0;
    }
  }
}
const wr = new Ya();
function os(t) {
  if (!t)
    throw new Error("Credential creation options are required");
  if (typeof PublicKeyCredential < "u" && "parseCreationOptionsFromJSON" in PublicKeyCredential && typeof PublicKeyCredential.parseCreationOptionsFromJSON == "function")
    return PublicKeyCredential.parseCreationOptionsFromJSON(
      /** we assert the options here as typescript still doesn't know about future webauthn types */
      t
    );
  const { challenge: e, user: r, excludeCredentials: s } = t, n = Kt(
    t,
    ["challenge", "user", "excludeCredentials"]
  ), i = We(e).buffer, a = Object.assign(Object.assign({}, r), { id: We(r.id).buffer }), l = Object.assign(Object.assign({}, n), {
    challenge: i,
    user: a
  });
  if (s && s.length > 0) {
    l.excludeCredentials = new Array(s.length);
    for (let h = 0; h < s.length; h++) {
      const o = s[h];
      l.excludeCredentials[h] = Object.assign(Object.assign({}, o), {
        id: We(o.id).buffer,
        type: o.type || "public-key",
        // Cast transports to handle future transport types like "cable"
        transports: o.transports
      });
    }
  }
  return l;
}
function ls(t) {
  if (!t)
    throw new Error("Credential request options are required");
  if (typeof PublicKeyCredential < "u" && "parseRequestOptionsFromJSON" in PublicKeyCredential && typeof PublicKeyCredential.parseRequestOptionsFromJSON == "function")
    return PublicKeyCredential.parseRequestOptionsFromJSON(t);
  const { challenge: e, allowCredentials: r } = t, s = Kt(
    t,
    ["challenge", "allowCredentials"]
  ), n = We(e).buffer, i = Object.assign(Object.assign({}, s), { challenge: n });
  if (r && r.length > 0) {
    i.allowCredentials = new Array(r.length);
    for (let a = 0; a < r.length; a++) {
      const l = r[a];
      i.allowCredentials[a] = Object.assign(Object.assign({}, l), {
        id: We(l.id).buffer,
        type: l.type || "public-key",
        // Cast transports to handle future transport types like "cable"
        transports: l.transports
      });
    }
  }
  return i;
}
function cs(t) {
  var e;
  if ("toJSON" in t && typeof t.toJSON == "function")
    return t.toJSON();
  const r = t;
  return {
    id: t.id,
    rawId: t.id,
    response: {
      attestationObject: Oe(new Uint8Array(t.response.attestationObject)),
      clientDataJSON: Oe(new Uint8Array(t.response.clientDataJSON))
    },
    type: "public-key",
    clientExtensionResults: t.getClientExtensionResults(),
    // Convert null to undefined and cast to AuthenticatorAttachment type
    authenticatorAttachment: (e = r.authenticatorAttachment) !== null && e !== void 0 ? e : void 0
  };
}
function hs(t) {
  var e;
  if ("toJSON" in t && typeof t.toJSON == "function")
    return t.toJSON();
  const r = t, s = t.getClientExtensionResults(), n = t.response;
  return {
    id: t.id,
    rawId: t.id,
    // W3C spec expects rawId to match id for JSON format
    response: {
      authenticatorData: Oe(new Uint8Array(n.authenticatorData)),
      clientDataJSON: Oe(new Uint8Array(n.clientDataJSON)),
      signature: Oe(new Uint8Array(n.signature)),
      userHandle: n.userHandle ? Oe(new Uint8Array(n.userHandle)) : void 0
    },
    type: "public-key",
    clientExtensionResults: s,
    // Convert null to undefined and cast to AuthenticatorAttachment type
    authenticatorAttachment: (e = r.authenticatorAttachment) !== null && e !== void 0 ? e : void 0
  };
}
function Zs(t) {
  return (
    // Consider localhost valid as well since it's okay wrt Secure Contexts
    t === "localhost" || /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(t)
  );
}
function Lt() {
  var t, e;
  return !!(G() && "PublicKeyCredential" in window && window.PublicKeyCredential && "credentials" in navigator && typeof ((t = navigator?.credentials) === null || t === void 0 ? void 0 : t.create) == "function" && typeof ((e = navigator?.credentials) === null || e === void 0 ? void 0 : e.get) == "function");
}
async function en(t) {
  try {
    const e = await navigator.credentials.create(
      /** we assert the type here until typescript types are updated */
      t
    );
    return e ? e instanceof PublicKeyCredential ? { data: e, error: null } : {
      data: null,
      error: new jt("Browser returned unexpected credential type", e)
    } : {
      data: null,
      error: new jt("Empty credential response", e)
    };
  } catch (e) {
    return {
      data: null,
      error: Ga({
        error: e,
        options: t
      })
    };
  }
}
async function tn(t) {
  try {
    const e = await navigator.credentials.get(
      /** we assert the type here until typescript types are updated */
      t
    );
    return e ? e instanceof PublicKeyCredential ? { data: e, error: null } : {
      data: null,
      error: new jt("Browser returned unexpected credential type", e)
    } : {
      data: null,
      error: new jt("Empty credential response", e)
    };
  } catch (e) {
    return {
      data: null,
      error: Ja({
        error: e,
        options: t
      })
    };
  }
}
const Xa = {
  hints: ["security-key"],
  authenticatorSelection: {
    authenticatorAttachment: "cross-platform",
    requireResidentKey: !1,
    /** set to preferred because older yubikeys don't have PIN/Biometric */
    userVerification: "preferred",
    residentKey: "discouraged"
  },
  attestation: "direct"
}, Qa = {
  /** set to preferred because older yubikeys don't have PIN/Biometric */
  userVerification: "preferred",
  hints: ["security-key"],
  attestation: "direct"
};
function Nt(...t) {
  const e = (n) => n !== null && typeof n == "object" && !Array.isArray(n), r = (n) => n instanceof ArrayBuffer || ArrayBuffer.isView(n), s = {};
  for (const n of t)
    if (n)
      for (const i in n) {
        const a = n[i];
        if (a !== void 0)
          if (Array.isArray(a))
            s[i] = a;
          else if (r(a))
            s[i] = a;
          else if (e(a)) {
            const l = s[i];
            e(l) ? s[i] = Nt(l, a) : s[i] = Nt(a);
          } else
            s[i] = a;
      }
  return s;
}
function Za(t, e) {
  return Nt(Xa, t, e || {});
}
function eo(t, e) {
  return Nt(Qa, t, e || {});
}
class to {
  constructor(e) {
    this.client = e, this.enroll = this._enroll.bind(this), this.challenge = this._challenge.bind(this), this.verify = this._verify.bind(this), this.authenticate = this._authenticate.bind(this), this.register = this._register.bind(this);
  }
  /**
   * Enroll a new WebAuthn factor.
   * Creates an unverified WebAuthn factor that must be verified with a credential.
   *
   * @experimental This method is experimental and may change in future releases
   * @param {Omit<MFAEnrollWebauthnParams, 'factorType'>} params - Enrollment parameters (friendlyName required)
   * @returns {Promise<AuthMFAEnrollWebauthnResponse>} Enrolled factor details or error
   * @see {@link https://w3c.github.io/webauthn/#sctn-registering-a-new-credential W3C WebAuthn Spec - Registering a New Credential}
   */
  async _enroll(e) {
    return this.client.mfa.enroll(Object.assign(Object.assign({}, e), { factorType: "webauthn" }));
  }
  /**
   * Challenge for WebAuthn credential creation or authentication.
   * Combines server challenge with browser credential operations.
   * Handles both registration (create) and authentication (request) flows.
   *
   * @experimental This method is experimental and may change in future releases
   * @param {MFAChallengeWebauthnParams & { friendlyName?: string; signal?: AbortSignal }} params - Challenge parameters including factorId
   * @param {Object} overrides - Allows you to override the parameters passed to navigator.credentials
   * @param {PublicKeyCredentialCreationOptionsFuture} overrides.create - Override options for credential creation
   * @param {PublicKeyCredentialRequestOptionsFuture} overrides.request - Override options for credential request
   * @returns {Promise<RequestResult>} Challenge response with credential or error
   * @see {@link https://w3c.github.io/webauthn/#sctn-credential-creation W3C WebAuthn Spec - Credential Creation}
   * @see {@link https://w3c.github.io/webauthn/#sctn-verifying-assertion W3C WebAuthn Spec - Verifying Assertion}
   */
  async _challenge({ factorId: e, webauthn: r, friendlyName: s, signal: n }, i) {
    var a;
    try {
      const { data: l, error: h } = await this.client.mfa.challenge({
        factorId: e,
        webauthn: r
      });
      if (!l)
        return { data: null, error: h };
      const o = n ?? wr.createNewAbortSignal();
      if (l.webauthn.type === "create") {
        const { user: c } = l.webauthn.credential_options.publicKey;
        if (!c.name) {
          const u = s;
          if (u)
            c.name = `${c.id}:${u}`;
          else {
            const f = (await this.client.getUser()).data.user, g = ((a = f?.user_metadata) === null || a === void 0 ? void 0 : a.name) || f?.email || f?.id || "User";
            c.name = `${c.id}:${g}`;
          }
        }
        c.displayName || (c.displayName = c.name);
      }
      switch (l.webauthn.type) {
        case "create": {
          const c = Za(l.webauthn.credential_options.publicKey, i?.create), { data: u, error: d } = await en({
            publicKey: c,
            signal: o
          });
          return u ? {
            data: {
              factorId: e,
              challengeId: l.id,
              webauthn: {
                type: l.webauthn.type,
                credential_response: u
              }
            },
            error: null
          } : { data: null, error: d };
        }
        case "request": {
          const c = eo(l.webauthn.credential_options.publicKey, i?.request), { data: u, error: d } = await tn(Object.assign(Object.assign({}, l.webauthn.credential_options), { publicKey: c, signal: o }));
          return u ? {
            data: {
              factorId: e,
              challengeId: l.id,
              webauthn: {
                type: l.webauthn.type,
                credential_response: u
              }
            },
            error: null
          } : { data: null, error: d };
        }
      }
    } catch (l) {
      return k(l) ? { data: null, error: l } : {
        data: null,
        error: new oe("Unexpected error in challenge", l)
      };
    }
  }
  /**
   * Verify a WebAuthn credential with the server.
   * Completes the WebAuthn ceremony by sending the credential to the server for verification.
   *
   * @experimental This method is experimental and may change in future releases
   * @param {Object} params - Verification parameters
   * @param {string} params.challengeId - ID of the challenge being verified
   * @param {string} params.factorId - ID of the WebAuthn factor
   * @param {MFAVerifyWebauthnParams<T>['webauthn']} params.webauthn - WebAuthn credential response
   * @returns {Promise<AuthMFAVerifyResponse>} Verification result with session or error
   * @see {@link https://w3c.github.io/webauthn/#sctn-verifying-assertion W3C WebAuthn Spec - Verifying an Authentication Assertion}
   * */
  async _verify({ challengeId: e, factorId: r, webauthn: s }) {
    return this.client.mfa.verify({
      factorId: r,
      challengeId: e,
      webauthn: s
    });
  }
  /**
   * Complete WebAuthn authentication flow.
   * Performs challenge and verification in a single operation for existing credentials.
   *
   * @experimental This method is experimental and may change in future releases
   * @param {Object} params - Authentication parameters
   * @param {string} params.factorId - ID of the WebAuthn factor to authenticate with
   * @param {Object} params.webauthn - WebAuthn configuration
   * @param {string} params.webauthn.rpId - Relying Party ID (defaults to current hostname)
   * @param {string[]} params.webauthn.rpOrigins - Allowed origins (defaults to current origin)
   * @param {AbortSignal} params.webauthn.signal - Optional abort signal
   * @param {PublicKeyCredentialRequestOptionsFuture} overrides - Override options for navigator.credentials.get
   * @returns {Promise<RequestResult<AuthMFAVerifyResponseData, WebAuthnError | AuthError>>} Authentication result
   * @see {@link https://w3c.github.io/webauthn/#sctn-authentication W3C WebAuthn Spec - Authentication Ceremony}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions MDN - PublicKeyCredentialRequestOptions}
   */
  async _authenticate({ factorId: e, webauthn: { rpId: r = typeof window < "u" ? window.location.hostname : void 0, rpOrigins: s = typeof window < "u" ? [window.location.origin] : void 0, signal: n } = {} }, i) {
    if (!r)
      return {
        data: null,
        error: new at("rpId is required for WebAuthn authentication")
      };
    try {
      if (!Lt())
        return {
          data: null,
          error: new oe("Browser does not support WebAuthn", null)
        };
      const { data: a, error: l } = await this.challenge({
        factorId: e,
        webauthn: { rpId: r, rpOrigins: s },
        signal: n
      }, { request: i });
      if (!a)
        return { data: null, error: l };
      const { webauthn: h } = a;
      return this._verify({
        factorId: e,
        challengeId: a.challengeId,
        webauthn: {
          type: h.type,
          rpId: r,
          rpOrigins: s,
          credential_response: h.credential_response
        }
      });
    } catch (a) {
      return k(a) ? { data: null, error: a } : {
        data: null,
        error: new oe("Unexpected error in authenticate", a)
      };
    }
  }
  /**
   * Complete WebAuthn registration flow.
   * Performs enrollment, challenge, and verification in a single operation for new credentials.
   *
   * @experimental This method is experimental and may change in future releases
   * @param {Object} params - Registration parameters
   * @param {string} params.friendlyName - User-friendly name for the credential
   * @param {string} params.rpId - Relying Party ID (defaults to current hostname)
   * @param {string[]} params.rpOrigins - Allowed origins (defaults to current origin)
   * @param {AbortSignal} params.signal - Optional abort signal
   * @param {PublicKeyCredentialCreationOptionsFuture} overrides - Override options for navigator.credentials.create
   * @returns {Promise<RequestResult<AuthMFAVerifyResponseData, WebAuthnError | AuthError>>} Registration result
   * @see {@link https://w3c.github.io/webauthn/#sctn-registering-a-new-credential W3C WebAuthn Spec - Registration Ceremony}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions MDN - PublicKeyCredentialCreationOptions}
   */
  async _register({ friendlyName: e, webauthn: { rpId: r = typeof window < "u" ? window.location.hostname : void 0, rpOrigins: s = typeof window < "u" ? [window.location.origin] : void 0, signal: n } = {} }, i) {
    if (!r)
      return {
        data: null,
        error: new at("rpId is required for WebAuthn registration")
      };
    try {
      if (!Lt())
        return {
          data: null,
          error: new oe("Browser does not support WebAuthn", null)
        };
      const { data: a, error: l } = await this._enroll({
        friendlyName: e
      });
      if (!a)
        return await this.client.mfa.listFactors().then((c) => {
          var u;
          return (u = c.data) === null || u === void 0 ? void 0 : u.all.find((d) => d.factor_type === "webauthn" && d.friendly_name === e && d.status === "unverified");
        }).then((c) => c ? this.client.mfa.unenroll({ factorId: c?.id }) : void 0), { data: null, error: l };
      const { data: h, error: o } = await this._challenge({
        factorId: a.id,
        friendlyName: a.friendly_name,
        webauthn: { rpId: r, rpOrigins: s },
        signal: n
      }, {
        create: i
      });
      return h ? this._verify({
        factorId: a.id,
        challengeId: h.challengeId,
        webauthn: {
          rpId: r,
          rpOrigins: s,
          type: h.webauthn.type,
          credential_response: h.webauthn.credential_response
        }
      }) : { data: null, error: o };
    } catch (a) {
      return k(a) ? { data: null, error: a } : {
        data: null,
        error: new oe("Unexpected error in register", a)
      };
    }
  }
}
Wa();
const ro = {
  url: sa,
  storageKey: na,
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  headers: ia,
  flowType: "implicit",
  debug: !1,
  hasCustomAuthorizationHeader: !1,
  throwOnError: !1,
  lockAcquireTimeout: 5e3,
  // 5 seconds. Only used when a custom `lock` is supplied. TODO(v3): remove.
  skipAutoInitialize: !1,
  experimental: {}
}, je = {};
let us = !1;
class lt {
  /**
   * The JWKS used for verifying asymmetric JWTs
   */
  get jwks() {
    var e, r;
    return (r = (e = je[this.storageKey]) === null || e === void 0 ? void 0 : e.jwks) !== null && r !== void 0 ? r : { keys: [] };
  }
  set jwks(e) {
    je[this.storageKey] = Object.assign(Object.assign({}, je[this.storageKey]), { jwks: e });
  }
  get jwks_cached_at() {
    var e, r;
    return (r = (e = je[this.storageKey]) === null || e === void 0 ? void 0 : e.cachedAt) !== null && r !== void 0 ? r : Number.MIN_SAFE_INTEGER;
  }
  set jwks_cached_at(e) {
    je[this.storageKey] = Object.assign(Object.assign({}, je[this.storageKey]), { cachedAt: e });
  }
  /**
   * Create a new client for use in the browser.
   *
   * @example Using supabase-js (recommended)
   * ```ts
   * import { createClient } from '@supabase/supabase-js'
   *
   * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
   * const { data, error } = await supabase.auth.getUser()
   * ```
   *
   * @example Standalone import for bundle-sensitive environments
   * ```ts
   * import { GoTrueClient } from '@supabase/auth-js'
   *
   * const auth = new GoTrueClient({
   *   url: 'https://xyzcompany.supabase.co/auth/v1',
   *   headers: { apikey: 'your-publishable-key' },
   *   storageKey: 'supabase-auth',
   * })
   * ```
   */
  constructor(e) {
    var r, s, n;
    this.userStorage = null, this.memoryStorage = null, this.stateChangeEmitters = /* @__PURE__ */ new Map(), this.autoRefreshTicker = null, this.autoRefreshTickTimeout = null, this.visibilityChangedCallback = null, this.refreshingDeferred = null, this.lastRefreshFailure = null, this._sessionRemovalEpoch = 0, this.initializePromise = null, this._pendingInitNotifications = null, this.detectSessionInUrl = !0, this.hasCustomAuthorizationHeader = !1, this.suppressGetSessionWarning = !1, this.lock = null, this.lockAcquired = !1, this.pendingInLock = [], this.broadcastChannel = null, this.logger = console.log;
    const i = Object.assign(Object.assign({}, ro), e);
    if (this.storageKey = i.storageKey, this.instanceID = (r = lt.nextInstanceID[this.storageKey]) !== null && r !== void 0 ? r : 0, lt.nextInstanceID[this.storageKey] = this.instanceID + 1, this.logDebugMessages = !!i.debug, typeof i.debug == "function" && (this.logger = i.debug), this.instanceID > 0 && G()) {
      const a = `${this._logPrefix()} Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.`;
      console.warn(a), this.logDebugMessages && console.trace(a);
    }
    if (this.persistSession = i.persistSession, this.autoRefreshToken = i.autoRefreshToken, this.experimental = (s = i.experimental) !== null && s !== void 0 ? s : {}, this.admin = new Ha({
      url: i.url,
      headers: i.headers,
      fetch: i.fetch,
      experimental: this.experimental
    }), this.url = i.url, this.headers = i.headers, this.fetch = Ys(i.fetch), this.detectSessionInUrl = i.detectSessionInUrl, this.flowType = i.flowType, this.hasCustomAuthorizationHeader = i.hasCustomAuthorizationHeader, this.throwOnError = i.throwOnError, this.lockAcquireTimeout = i.lockAcquireTimeout, i.lock != null && (this.lock = i.lock, us || (us = !0, console.warn(`${this._logPrefix()} The "lock" option is deprecated and will be removed in v3. The client now coordinates session refreshes without a lock, so most apps can drop the option. See https://github.com/supabase/supabase-js/blob/master/packages/core/auth-js/migrations/lockless-coordination.md`))), this.jwks || (this.jwks = { keys: [] }, this.jwks_cached_at = Number.MIN_SAFE_INTEGER), this.mfa = {
      verify: this._verify.bind(this),
      enroll: this._enroll.bind(this),
      unenroll: this._unenroll.bind(this),
      challenge: this._challenge.bind(this),
      listFactors: this._listFactors.bind(this),
      challengeAndVerify: this._challengeAndVerify.bind(this),
      getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this),
      webauthn: new to(this),
      recoveryCodes: {
        getStatus: this._getRecoveryCodesStatus.bind(this),
        generate: this._generateRecoveryCodes.bind(this),
        verify: this._verifyRecoveryCode.bind(this),
        regenerate: this._regenerateRecoveryCodes.bind(this),
        unenroll: this._unenrollRecoveryCodes.bind(this)
      }
    }, this.oauth = {
      getAuthorizationDetails: this._getAuthorizationDetails.bind(this),
      approveAuthorization: this._approveAuthorization.bind(this),
      denyAuthorization: this._denyAuthorization.bind(this),
      listGrants: this._listOAuthGrants.bind(this),
      revokeGrant: this._revokeOAuthGrant.bind(this)
    }, this.passkey = {
      startRegistration: this._startPasskeyRegistration.bind(this),
      verifyRegistration: this._verifyPasskeyRegistration.bind(this),
      startAuthentication: this._startPasskeyAuthentication.bind(this),
      verifyAuthentication: this._verifyPasskeyAuthentication.bind(this),
      list: this._listPasskeys.bind(this),
      update: this._updatePasskey.bind(this),
      delete: this._deletePasskey.bind(this)
    }, this.persistSession ? (i.storage ? this.storage = i.storage : Js() ? this.storage = globalThis.localStorage : (this.memoryStorage = {}, this.storage = as(this.memoryStorage)), i.userStorage && (this.userStorage = i.userStorage)) : (this.memoryStorage = {}, this.storage = as(this.memoryStorage)), G() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
      try {
        this.broadcastChannel = new globalThis.BroadcastChannel(this.storageKey);
      } catch (a) {
        console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available", a);
      }
      (n = this.broadcastChannel) === null || n === void 0 || n.addEventListener("message", async (a) => {
        this._debug("received broadcast notification from other tab or client", a), (a.data.event === "TOKEN_REFRESHED" || a.data.event === "SIGNED_IN") && (this.lastRefreshFailure = null);
        try {
          await this._notifyAllSubscribers(a.data.event, a.data.session, !1);
        } catch (l) {
          this._debug("#broadcastChannel", "error", l);
        }
      });
    }
    i.skipAutoInitialize || this.initialize().catch((a) => {
      this._debug("#initialize()", "error", a);
    });
  }
  /**
   * Returns whether error throwing mode is enabled for this client.
   */
  isThrowOnErrorEnabled() {
    return this.throwOnError;
  }
  /**
   * Centralizes return handling with optional error throwing. When `throwOnError` is enabled
   * and the provided result contains a non-nullish error, the error is thrown instead of
   * being returned. This ensures consistent behavior across all public API methods.
   */
  _returnResult(e) {
    if (this.throwOnError && e && e.error)
      throw e.error;
    return e;
  }
  _logPrefix() {
    return `GoTrueClient@${this.storageKey}:${this.instanceID} (${Ks}) ${(/* @__PURE__ */ new Date()).toISOString()}`;
  }
  _debug(...e) {
    return this.logDebugMessages && this.logger(this._logPrefix(), ...e), this;
  }
  /**
   * Initialize the auth client by loading the session from storage or
   * detecting it from the URL after an OAuth, magic-link, or password-recovery
   * redirect.
   *
   * **Most callers do not need to invoke this directly.** The client calls it
   * automatically during construction, and to react to sign-in events (including
   * post-redirect events) you should subscribe to `onAuthStateChange` rather
   * than awaiting `initialize()`.
   *
   * You only need to call it manually when you have opted out of the automatic
   * call by passing `skipAutoInitialize: true` — for example, in an SSR context
   * where you need to control initialization timing. In that case, awaiting
   * `initialize()` returns the resolved session result (or any error encountered
   * while detecting it from the URL).
   *
   * @category Auth
   */
  async initialize() {
    var e;
    if (this.initializePromise)
      return await this.initializePromise;
    this._pendingInitNotifications = [], this.initializePromise = (async () => this.lock != null ? await this._acquireLock(this.lockAcquireTimeout, async () => await this._initialize()) : await this._initialize())();
    const r = await this.initializePromise, s = (e = this._pendingInitNotifications) !== null && e !== void 0 ? e : [];
    this._pendingInitNotifications = null;
    for (const n of s)
      await this._notifyAllSubscribers(n.event, n.session, n.broadcast);
    return r;
  }
  /**
   * IMPORTANT:
   * 1. Never throw in this method, as it is called from the constructor
   * 2. Never return a session from this method as it would be cached over
   *    the whole lifetime of the client
   */
  async _initialize() {
    var e;
    try {
      let r = {}, s = "none";
      if (G() && (r = es(window.location.href), this._isImplicitGrantCallback(r) ? s = "implicit" : await this._isPKCECallback(r) && (s = "pkce")), G() && this.detectSessionInUrl && s !== "none") {
        const { data: n, error: i } = await this._getSessionFromURL(r, s);
        if (i) {
          if (this._debug("#_initialize()", "error detecting session from URL", i), ha(i)) {
            const h = (e = i.details) === null || e === void 0 ? void 0 : e.code;
            if (h === "identity_already_exists" || h === "identity_not_found" || h === "single_identity_not_deletable")
              return { error: i };
          }
          return { error: i };
        }
        const { session: a, redirectType: l } = n;
        return this._debug("#_initialize()", "detected session in URL", a, "redirect type", l), await this._saveSession(a), setTimeout(async () => {
          l === "recovery" ? await this._notifyAllSubscribers("PASSWORD_RECOVERY", a) : await this._notifyAllSubscribers("SIGNED_IN", a);
        }, 0), { error: null };
      }
      return await this._recoverAndRefresh(), { error: null };
    } catch (r) {
      return k(r) ? this._returnResult({ error: r }) : this._returnResult({
        error: new oe("Unexpected error during initialization", r)
      });
    } finally {
      await this._handleVisibilityChange(), this._debug("#_initialize()", "end");
    }
  }
  /**
   * Creates a new anonymous user.
   *
   * @returns A session where the is_anonymous claim in the access token JWT set to true
   *
   * @category Auth
   *
   * @remarks
   * - Returns an anonymous user
   * - It is recommended to set up captcha for anonymous sign-ins to prevent abuse. You can pass in the captcha token in the `options` param.
   *
   * @example Create an anonymous user
   * ```js
   * const { data, error } = await supabase.auth.signInAnonymously({
   *   options: {
   *     captchaToken
   *   }
   * });
   * ```
   *
   * @exampleResponse Create an anonymous user
   * ```json
   * {
   *   "data": {
   *     "user": {
   *       "id": "11111111-1111-1111-1111-111111111111",
   *       "aud": "authenticated",
   *       "role": "authenticated",
   *       "email": "",
   *       "phone": "",
   *       "last_sign_in_at": "2024-01-01T00:00:00Z",
   *       "app_metadata": {},
   *       "user_metadata": {},
   *       "identities": [],
   *       "created_at": "2024-01-01T00:00:00Z",
   *       "updated_at": "2024-01-01T00:00:00Z",
   *       "is_anonymous": true
   *     },
   *     "session": {
   *       "access_token": "<ACCESS_TOKEN>",
   *       "token_type": "bearer",
   *       "expires_in": 3600,
   *       "expires_at": 1700000000,
   *       "refresh_token": "<REFRESH_TOKEN>",
   *       "user": {
   *         "id": "11111111-1111-1111-1111-111111111111",
   *         "aud": "authenticated",
   *         "role": "authenticated",
   *         "email": "",
   *         "phone": "",
   *         "last_sign_in_at": "2024-01-01T00:00:00Z",
   *         "app_metadata": {},
   *         "user_metadata": {},
   *         "identities": [],
   *         "created_at": "2024-01-01T00:00:00Z",
   *         "updated_at": "2024-01-01T00:00:00Z",
   *         "is_anonymous": true
   *       }
   *     }
   *   },
   *   "error": null
   * }
   * ```
   *
   * @example Create an anonymous user with custom user metadata
   * ```js
   * const { data, error } = await supabase.auth.signInAnonymously({
   *   options: {
   *     data
   *   }
   * })
   * ```
   */
  async signInAnonymously(e) {
    var r, s, n;
    try {
      const i = await E(this.fetch, "POST", `${this.url}/signup`, {
        headers: this.headers,
        body: {
          data: (s = (r = e?.options) === null || r === void 0 ? void 0 : r.data) !== null && s !== void 0 ? s : {},
          gotrue_meta_security: { captcha_token: (n = e?.options) === null || n === void 0 ? void 0 : n.captchaToken }
        },
        xform: se
      }), { data: a, error: l } = i;
      if (l || !a)
        return this._returnResult({ data: { user: null, session: null }, error: l });
      const h = a.session, o = a.user;
      return a.session && (await this._saveSession(a.session), await this._notifyAllSubscribers("SIGNED_IN", h)), this._returnResult({ data: { user: o, session: h }, error: null });
    } catch (i) {
      if (k(i))
        return this._returnResult({ data: { user: null, session: null }, error: i });
      throw i;
    }
  }
  /**
   * Creates a new user.
   *
   * Be aware that if a user account exists in the system you may get back an
   * error message that attempts to hide this information from the user.
   * This method has support for PKCE via email signups. The PKCE flow cannot be used when autoconfirm is enabled.
   *
   * @returns A logged-in session if the server has "autoconfirm" ON
   * @returns A user if the server has "autoconfirm" OFF
   *
   * @category Auth
   *
   * @remarks
   * - By default, the user needs to verify their email address before logging in. To turn this off, disable **Confirm email** in [your project](/dashboard/project/_/auth/providers).
   * - **Confirm email** determines if users need to confirm their email address after signing up.
   *   - If **Confirm email** is enabled, a `user` is returned but `session` is null.
   *   - If **Confirm email** is disabled, both a `user` and a `session` are returned.
   * - When the user confirms their email address, they are redirected to the [`SITE_URL`](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls) by default. You can modify your `SITE_URL` or add additional redirect URLs in [your project](/dashboard/project/_/auth/url-configuration).
   * - If signUp() is called for an existing confirmed user:
   *   - When both **Confirm email** and **Confirm phone** (even when phone provider is disabled) are enabled in [your project](/dashboard/project/_/auth/providers), an obfuscated/fake user object is returned.
   *   - When either **Confirm email** or **Confirm phone** (even when phone provider is disabled) is disabled, the error message, `User already registered` is returned.
   * - To fetch the currently logged-in user, refer to [`getUser()`](/docs/reference/javascript/auth-getuser).
   *
   * @example Sign up with an email and password
   * ```js
   * const { data, error } = await supabase.auth.signUp({
   *   email: 'example@email.com',
   *   password: 'example-password',
   * })
   * ```
   *
   * @exampleResponse Sign up with an email and password
   * ```json
   * // Some fields may be null if "confirm email" is enabled.
   * {
   *   "data": {
   *     "user": {
   *       "id": "11111111-1111-1111-1111-111111111111",
   *       "aud": "authenticated",
   *       "role": "authenticated",
   *       "email": "example@email.com",
   *       "email_confirmed_at": "2024-01-01T00:00:00Z",
   *       "phone": "",
   *       "last_sign_in_at": "2024-01-01T00:00:00Z",
   *       "app_metadata": {
   *         "provider": "email",
   *         "providers": [
   *           "email"
   *         ]
   *       },
   *       "user_metadata": {},
   *       "identities": [
   *         {
   *           "identity_id": "22222222-2222-2222-2222-222222222222",
   *           "id": "11111111-1111-1111-1111-111111111111",
   *           "user_id": "11111111-1111-1111-1111-111111111111",
   *           "identity_data": {
   *             "email": "example@email.com",
   *             "email_verified": false,
   *             "phone_verified": false,
   *             "sub": "11111111-1111-1111-1111-111111111111"
   *           },
   *           "provider": "email",
   *           "last_sign_in_at": "2024-01-01T00:00:00Z",
   *           "created_at": "2024-01-01T00:00:00Z",
   *           "updated_at": "2024-01-01T00:00:00Z",
   *           "email": "example@email.com"
   *         }
   *       ],
   *       "created_at": "2024-01-01T00:00:00Z",
   *       "updated_at": "2024-01-01T00:00:00Z"
   *     },
   *     "session": {
   *       "access_token": "<ACCESS_TOKEN>",
   *       "token_type": "bearer",
   *       "expires_in": 3600,
   *       "expires_at": 1700000000,
   *       "refresh_token": "<REFRESH_TOKEN>",
   *       "user": {
   *         "id": "11111111-1111-1111-1111-111111111111",
   *         "aud": "authenticated",
   *         "role": "authenticated",
   *         "email": "example@email.com",
   *         "email_confirmed_at": "2024-01-01T00:00:00Z",
   *         "phone": "",
   *         "last_sign_in_at": "2024-01-01T00:00:00Z",
   *         "app_metadata": {
   *           "provider": "email",
   *           "providers": [
   *             "email"
   *           ]
   *         },
   *         "user_metadata": {},
   *         "identities": [
   *           {
   *             "identity_id": "22222222-2222-2222-2222-222222222222",
   *             "id": "11111111-1111-1111-1111-111111111111",
   *             "user_id": "11111111-1111-1111-1111-111111111111",
   *             "identity_data": {
   *               "email": "example@email.com",
   *               "email_verified": false,
   *               "phone_verified": false,
   *               "sub": "11111111-1111-1111-1111-111111111111"
   *             },
   *             "provider": "email",
   *             "last_sign_in_at": "2024-01-01T00:00:00Z",
   *             "created_at": "2024-01-01T00:00:00Z",
   *             "updated_at": "2024-01-01T00:00:00Z",
   *             "email": "example@email.com"
   *           }
   *         ],
   *         "created_at": "2024-01-01T00:00:00Z",
   *         "updated_at": "2024-01-01T00:00:00Z"
   *       }
   *     }
   *   },
   *   "error": null
   * }
   * ```
   *
   * @example Sign up with a phone number and password (SMS)
   * ```js
   * const { data, error } = await supabase.auth.signUp({
   *   phone: '123456789',
   *   password: 'example-password',
   *   options: {
   *     channel: 'sms'
   *   }
   * })
   * ```
   *
   * @exampleDescription Sign up with a phone number and password (whatsapp)
   * The user will be sent a WhatsApp message which contains a OTP. By default, a given user can only request a OTP once every 60 seconds. Note that a user will need to have a valid WhatsApp account that is linked to Twilio in order to use this feature.
   *
   * @example Sign up with a phone number and password (whatsapp)
   * ```js
   * const { data, error } = await supabase.auth.signUp({
   *   phone: '123456789',
   *   password: 'example-password',
   *   options: {
   *     channel: 'whatsapp'
   *   }
   * })
   * ```
   *
   * @example Sign up with additional user metadata
   * ```js
   * const { data, error } = await supabase.auth.signUp(
   *   {
   *     email: 'example@email.com',
   *     password: 'example-password',
   *     options: {
   *       data: {
   *         first_name: 'John',
   *         age: 27,
   *       }
   *     }
   *   }
   * )
   * ```
   *
   * @exampleDescription Sign up with a redirect URL
   * - See [redirect URLs and wildcards](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls) to add additional redirect URLs to your project.
   *
   * @example Sign up with a redirect URL
   * ```js
   * const { data, error } = await supabase.auth.signUp(
   *   {
   *     email: 'example@email.com',
   *     password: 'example-password',
   *     options: {
   *       emailRedirectTo: 'https://example.com/welcome'
   *     }
   *   }
   * )
   * ```
   */
  async signUp(e) {
    var r, s, n;
    let i = null;
    try {
      let a;
      if ("email" in e) {
        const { email: u, password: d, options: f } = e;
        let g = null, m = null;
        this.flowType === "pkce" && ([g, m, i] = await this._getCodeChallengeAndMethod()), a = await E(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          redirectTo: this._maybeAppendFlowIdToRedirect(f?.emailRedirectTo, i),
          body: {
            email: u,
            password: d,
            data: (r = f?.data) !== null && r !== void 0 ? r : {},
            gotrue_meta_security: { captcha_token: f?.captchaToken },
            code_challenge: g,
            code_challenge_method: m
          },
          xform: se
        });
      } else if ("phone" in e) {
        const { phone: u, password: d, options: f } = e;
        a = await E(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          body: {
            phone: u,
            password: d,
            data: (s = f?.data) !== null && s !== void 0 ? s : {},
            channel: (n = f?.channel) !== null && n !== void 0 ? n : "sms",
            gotrue_meta_security: { captcha_token: f?.captchaToken }
          },
          xform: se
        });
      } else
        throw new gt("You must provide either an email or phone number and a password");
      const { data: l, error: h } = a;
      if (h || !l)
        return await ne(this.storage, this.storageKey, i), this._returnResult({ data: { user: null, session: null }, error: h });
      const o = l.session, c = l.user;
      return l.session && (await this._saveSession(l.session), await this._notifyAllSubscribers("SIGNED_IN", o)), this._returnResult({ data: { user: c, session: o }, error: null });
    } catch (a) {
      if (await ne(this.storage, this.storageKey, i), k(a))
        return this._returnResult({ data: { user: null, session: null }, error: a });
      throw a;
    }
  }
  /**
   * Log in an existing user with an email and password or phone and password.
   *
   * Be aware that you may get back an error message that will not distinguish
   * between the cases where the account does not exist or that the
   * email/phone and password combination is wrong or that the account can only
   * be accessed via social login.
   *
   * @category Auth
   *
   * @remarks
   * - Requires either an email and password or a phone number and password.
   *
   * @example Sign in with email and password
   * ```js
   * const { data, error } = await supabase.auth.signInWithPassword({
   *   email: 'example@email.com',
   *   password: 'example-password',
   * })
   * ```
   *
   * @exampleResponse Sign in with email and password
   * ```json
   * {
   *   "data": {
   *     "user": {
   *       "id": "11111111-1111-1111-1111-111111111111",
   *       "aud": "authenticated",
   *       "role": "authenticated",
   *       "email": "example@email.com",
   *       "email_confirmed_at": "2024-01-01T00:00:00Z",
   *       "phone": "",
   *       "last_sign_in_at": "2024-01-01T00:00:00Z",
   *       "app_metadata": {
   *         "provider": "email",
   *         "providers": [
   *           "email"
   *         ]
   *       },
   *       "user_metadata": {},
   *       "identities": [
   *         {
   *           "identity_id": "22222222-2222-2222-2222-222222222222",
   *           "id": "11111111-1111-1111-1111-111111111111",
   *           "user_id": "11111111-1111-1111-1111-111111111111",
   *           "identity_data": {
   *             "email": "example@email.com",
   *             "email_verified": false,
   *             "phone_verified": false,
   *             "sub": "11111111-1111-1111-1111-111111111111"
   *           },
   *           "provider": "email",
   *           "last_sign_in_at": "2024-01-01T00:00:00Z",
   *           "created_at": "2024-01-01T00:00:00Z",
   *           "updated_at": "2024-01-01T00:00:00Z",
   *           "email": "example@email.com"
   *         }
   *       ],
   *       "created_at": "2024-01-01T00:00:00Z",
   *       "updated_at": "2024-01-01T00:00:00Z"
   *     },
   *     "session": {
   *       "access_token": "<ACCESS_TOKEN>",
   *       "token_type": "bearer",
   *       "expires_in": 3600,
   *       "expires_at": 1700000000,
   *       "refresh_token": "<REFRESH_TOKEN>",
   *       "user": {
   *         "id": "11111111-1111-1111-1111-111111111111",
   *         "aud": "authenticated",
   *         "role": "authenticated",
   *         "email": "example@email.com",
   *         "email_confirmed_at": "2024-01-01T00:00:00Z",
   *         "phone": "",
   *         "last_sign_in_at": "2024-01-01T00:00:00Z",
   *         "app_metadata": {
   *           "provider": "email",
   *           "providers": [
   *             "email"
   *           ]
   *         },
   *         "user_metadata": {},
   *         "identities": [
   *           {
   *             "identity_id": "22222222-2222-2222-2222-222222222222",
   *             "id": "11111111-1111-1111-1111-111111111111",
   *             "user_id": "11111111-1111-1111-1111-111111111111",
   *             "identity_data": {
   *               "email": "example@email.com",
   *               "email_verified": false,
   *               "phone_verified": false,
   *               "sub": "11111111-1111-1111-1111-111111111111"
   *             },
   *             "provider": "email",
   *             "last_sign_in_at": "2024-01-01T00:00:00Z",
   *             "created_at": "2024-01-01T00:00:00Z",
   *             "updated_at": "2024-01-01T00:00:00Z",
   *             "email": "example@email.com"
   *           }
   *         ],
   *         "created_at": "2024-01-01T00:00:00Z",
   *         "updated_at": "2024-01-01T00:00:00Z"
   *       }
   *     }
   *   },
   *   "error": null
   * }
   * ```
   *
   * @example Sign in with phone and password
   * ```js
   * const { data, error } = await supabase.auth.signInWithPassword({
   *   phone: '+13334445555',
   *   password: 'some-password',
   * })
   * ```
   *
   * @exampleDescription Handling errors
   * Log the full `error` object so fields like `code`, `status`, and `name` aren't hidden. The `error.code` (e.g. `'invalid_credentials'`, `'email_not_confirmed'`) is often more useful for branching than `error.message`, and the full object surfaces both.
   *
   * @example Handling errors
   * ```js
   * const { data, error } = await supabase.auth.signInWithPassword({
   *   email: 'example@email.com',
   *   password: 'example-password',
   * })
   * if (error) {
   *   console.error(error)
   *   return
   * }
   * ```
   */
  async signInWithPassword(e) {
    try {
      let r;
      if ("email" in e) {
        const { email: i, password: a, options: l } = e;
        r = await E(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
          headers: this.headers,
          body: {
            email: i,
            password: a,
            gotrue_meta_security: { captcha_token: l?.captchaToken }
          },
          xform: ns
        });
      } else if ("phone" in e) {
        const { phone: i, password: a, options: l } = e;
        r = await E(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
          headers: this.headers,
          body: {
            phone: i,
            password: a,
            gotrue_meta_security: { captcha_token: l?.captchaToken }
          },
          xform: ns
        });
      } else
        throw new gt("You must provide either an email or phone number and a password");
      const { data: s, error: n } = r;
      if (n)
        return this._returnResult({ data: { user: null, session: null }, error: n });
      if (!s || !s.session || !s.user) {
        const i = new $e();
        return this._returnResult({ data: { user: null, session: null }, error: i });
      }
      return s.session && (await this._saveSession(s.session), await this._notifyAllSubscribers("SIGNED_IN", s.session)), this._returnResult({
        data: Object.assign({ user: s.user, session: s.session }, s.weak_password ? { weakPassword: s.weak_password } : null),
        error: n
      });
    } catch (r) {
      if (k(r))
        return this._returnResult({ data: { user: null, session: null }, error: r });
      throw r;
    }
  }
  /**
   * Log in an existing user via a third-party provider.
   * This method supports the PKCE flow.
   *
   * @category Auth
   *
   * @remarks
   * - This method is used for signing in using [Social Login (OAuth) providers](/docs/guides/auth#configure-third-party-providers).
   * - It works by redirecting your application to the provider's authorization screen, before bringing back the user to your app.
   *
   * @example Sign in using a third-party provider
   * ```js
   * const { data, error } = await supabase.auth.signInWithOAuth({
   *   provider: 'github'
   * })
   * ```
   *
   * @exampleResponse Sign in using a third-party provider
   * ```json
   * {
   *   data: {
   *     provider: 'github',
   *     url: <PROVIDER_URL_TO_REDIRECT_TO>,
   *     flowId: <PKCE_FLOW_ID_OR_NULL>
   *   },
   *   error: null
   * }
   * ```
   *
   * @exampleDescription Sign in using a third-party provider with redirect
   * - When the OAuth provider successfully authenticates the user, they are redirected to the URL specified in the `redirectTo` parameter. This parameter defaults to the [`SITE_URL`](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls). It does not redirect the user immediately after invoking this method.
   * - See [redirect URLs and wildcards](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls) to add additional redirect URLs to your project.
   *
   * @example Sign in using a third-party provider with redirect
   * ```js
   * const { data, error } = await supabase.auth.signInWithOAuth({
   *   provider: 'github',
   *   options: {
   *     redirectTo: 'https://example.com/welcome'
   *   }
   * })
   * ```
   *
   * @exampleDescription Sign in with scopes and access provider tokens
   * If you need additional access from an OAuth provider, in order to access provider specific APIs in the name of the user, you can do this by passing in the scopes the user should authorize for your application. Note that the `scopes` option takes in **a space-separated list** of scopes.
   *
   * Because OAuth sign-in often includes redirects, you should register an `onAuthStateChange` callback immediately after you create the Supabase client. This callback will listen for the presence of `provider_token` and `provider_refresh_token` properties on the `session` object and store them in local storage. The client library will emit these values **only once** immediately after the user signs in. You can then access them by looking them up in local storage, or send them to your backend servers for further processing.
   *
   * Finally, make sure you remove them from local storage on the `SIGNED_OUT` event. If the OAuth provider supports token revocation, make sure you call those APIs either from the frontend or schedule them to be called on the backend.
   *
   * @example Sign in with scopes and access provider tokens
   * ```js
   * // Register this immediately after calling createClient!
   * // Because signInWithOAuth causes a redirect, you need to fetch the
   * // provider tokens from the callback.
   * supabase.auth.onAuthStateChange((event, session) => {
   *   if (session && session.provider_token) {
   *     window.localStorage.setItem('oauth_provider_token', session.provider_token)
   *   }
   *
   *   if (session && session.provider_refresh_token) {
   *     window.localStorage.setItem('oauth_provider_refresh_token', session.provider_refresh_token)
   *   }
   *
   *   if (event === 'SIGNED_OUT') {
   *     window.localStorage.removeItem('oauth_provider_token')
   *     window.localStorage.removeItem('oauth_provider_refresh_token')
   *   }
   * })
   *
   * // Call this on your Sign in with GitHub button to initiate OAuth
   * // with GitHub with the requested elevated scopes.
   * await supabase.auth.signInWithOAuth({
   *   provider: 'github',
   *   options: {
   *     scopes: 'repo gist notifications'
   *   }
   * })
   * ```
   */
  async signInWithOAuth(e) {
    var r, s, n, i;
    return await this._handleProviderSignIn(e.provider, {
      redirectTo: (r = e.options) === null || r === void 0 ? void 0 : r.redirectTo,
      scopes: (s = e.options) === null || s === void 0 ? void 0 : s.scopes,
      queryParams: (n = e.options) === null || n === void 0 ? void 0 : n.queryParams,
      skipBrowserRedirect: (i = e.options) === null || i === void 0 ? void 0 : i.skipBrowserRedirect
    });
  }
  /**
   * Log in an existing user by exchanging an Auth Code issued during the PKCE flow.
   *
   * @category Auth
   *
   * @remarks
   * - Used when `flowType` is set to `pkce` in client options.
   * - When several PKCE flows are in flight at once, pass `options.flowId` so
   *   the code is exchanged with the verifier created by that specific flow.
   *   The flow id is returned by `signInWithOAuth`, and with
   *   `experimental.appendPkceFlowIdToRedirects` enabled it also arrives on
   *   your callback URL as the reserved `sb_flow_id` query parameter (read
   *   automatically in a browser).
   * - When a flow id is present but its stored verifier is gone (evicted,
   *   already used, or from another device), the call fails with a verifier
   *   missing error instead of trying another flow's verifier — a mismatched
   *   verifier would consume the single-use code. Without any flow id the
   *   most recently stored verifier is used, as before.
   *
   * @example Exchange Auth Code
   * ```js
   * supabase.auth.exchangeCodeForSession('34e770dd-9ff9-416c-87fa-43b31d7ef225')
   * ```
   *
   * @example Exchange Auth Code for a specific flow (e.g. in a server-side callback handler)
   * ```js
   * const flowId = requestUrl.searchParams.get('sb_flow_id')
   * supabase.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined)
   * ```
   *
   * @exampleResponse Exchange Auth Code
   * ```json
   * {
   *   "data": {
   *     session: {
   *       access_token: '<ACCESS_TOKEN>',
   *       token_type: 'bearer',
   *       expires_in: 3600,
   *       expires_at: 1700000000,
   *       refresh_token: '<REFRESH_TOKEN>',
   *       user: {
   *         id: '11111111-1111-1111-1111-111111111111',
   *         aud: 'authenticated',
   *         role: 'authenticated',
   *         email: 'example@email.com'
   *         email_confirmed_at: '2024-01-01T00:00:00Z',
   *         phone: '',
   *         confirmation_sent_at: '2024-01-01T00:00:00Z',
   *         confirmed_at: '2024-01-01T00:00:00Z',
   *         last_sign_in_at: '2024-01-01T00:00:00Z',
   *         app_metadata: {
   *           "provider": "email",
   *           "providers": [
   *             "email",
   *             "<OTHER_PROVIDER>"
   *           ]
   *         },
   *         user_metadata: {
   *           email: 'email@email.com',
   *           email_verified: true,
   *           full_name: 'User Name',
   *           iss: '<ISS>',
   *           name: 'User Name',
   *           phone_verified: false,
   *           provider_id: '<PROVIDER_ID>',
   *           sub: '<SUB>'
   *         },
   *         identities: [
   *           {
   *             "identity_id": "22222222-2222-2222-2222-222222222222",
   *             "id": "11111111-1111-1111-1111-111111111111",
   *             "user_id": "11111111-1111-1111-1111-111111111111",
   *             "identity_data": {
   *               "email": "example@email.com",
   *               "email_verified": false,
   *               "phone_verified": false,
   *               "sub": "11111111-1111-1111-1111-111111111111"
   *             },
   *             "provider": "email",
   *             "last_sign_in_at": "2024-01-01T00:00:00Z",
   *             "created_at": "2024-01-01T00:00:00Z",
   *             "updated_at": "2024-01-01T00:00:00Z",
   *             "email": "email@example.com"
   *           },
   *           {
   *             "identity_id": "33333333-3333-3333-3333-333333333333",
   *             "id": "<ID>",
   *             "user_id": "<USER_ID>",
   *             "identity_data": {
   *               "email": "example@email.com",
   *               "email_verified": true,
   *               "full_name": "User Name",
   *               "iss": "<ISS>",
   *               "name": "User Name",
   *               "phone_verified": false,
   *               "provider_id": "<PROVIDER_ID>",
   *               "sub": "<SUB>"
   *             },
   *             "provider": "<PROVIDER>",
   *             "last_sign_in_at": "2024-01-01T00:00:00Z",
   *             "created_at": "2024-01-01T00:00:00Z",
   *             "updated_at": "2024-01-01T00:00:00Z",
   *             "email": "example@email.com"
   *           }
   *         ],
   *         created_at: '2024-01-01T00:00:00Z',
   *         updated_at: '2024-01-01T00:00:00Z',
   *         is_anonymous: false
   *       },
   *       provider_token: '<PROVIDER_TOKEN>',
   *       provider_refresh_token: '<PROVIDER_REFRESH_TOKEN>'
   *     },
   *     user: {
   *       id: '11111111-1111-1111-1111-111111111111',
   *       aud: 'authenticated',
   *       role: 'authenticated',
   *       email: 'example@email.com',
   *       email_confirmed_at: '2024-01-01T00:00:00Z',
   *       phone: '',
   *       confirmation_sent_at: '2024-01-01T00:00:00Z',
   *       confirmed_at: '2024-01-01T00:00:00Z',
   *       last_sign_in_at: '2024-01-01T00:00:00Z',
   *       app_metadata: {
   *         provider: 'email',
   *         providers: [
   *           "email",
   *           "<OTHER_PROVIDER>"
   *         ]
   *       },
   *       user_metadata: {
   *         email: 'email@email.com',
   *         email_verified: true,
   *         full_name: 'User Name',
   *         iss: '<ISS>',
   *         name: 'User Name',
   *         phone_verified: false,
   *         provider_id: '<PROVIDER_ID>',
   *         sub: '<SUB>'
   *       },
   *       identities: [
   *         {
   *           "identity_id": "22222222-2222-2222-2222-222222222222",
   *           "id": "11111111-1111-1111-1111-111111111111",
   *           "user_id": "11111111-1111-1111-1111-111111111111",
   *           "identity_data": {
   *             "email": "example@email.com",
   *             "email_verified": false,
   *             "phone_verified": false,
   *             "sub": "11111111-1111-1111-1111-111111111111"
   *           },
   *           "provider": "email",
   *           "last_sign_in_at": "2024-01-01T00:00:00Z",
   *           "created_at": "2024-01-01T00:00:00Z",
   *           "updated_at": "2024-01-01T00:00:00Z",
   *           "email": "email@example.com"
   *         },
   *         {
   *           "identity_id": "33333333-3333-3333-3333-333333333333",
   *           "id": "<ID>",
   *           "user_id": "<USER_ID>",
   *           "identity_data": {
   *             "email": "example@email.com",
   *             "email_verified": true,
   *             "full_name": "User Name",
   *             "iss": "<ISS>",
   *             "name": "User Name",
   *             "phone_verified": false,
   *             "provider_id": "<PROVIDER_ID>",
   *             "sub": "<SUB>"
   *           },
   *           "provider": "<PROVIDER>",
   *           "last_sign_in_at": "2024-01-01T00:00:00Z",
   *           "created_at": "2024-01-01T00:00:00Z",
   *           "updated_at": "2024-01-01T00:00:00Z",
   *           "email": "example@email.com"
   *         }
   *       ],
   *       created_at: '2024-01-01T00:00:00Z',
   *       updated_at: '2024-01-01T00:00:00Z',
   *       is_anonymous: false
   *     },
   *     redirectType: null
   *   },
   *   "error": null
   * }
   * ```
   */
  async exchangeCodeForSession(e, r) {
    return await this.initializePromise, this.lock != null ? this._acquireLock(this.lockAcquireTimeout, async () => this._exchangeCodeForSession(e, r)) : this._exchangeCodeForSession(e, r);
  }
  /**
   * Signs in a user by verifying a message signed by the user's private key.
   * Supports Ethereum (via Sign-In-With-Ethereum) & Solana (Sign-In-With-Solana) standards,
   * both of which derive from the EIP-4361 standard
   * With slight variation on Solana's side.
   * @reference https://eips.ethereum.org/EIPS/eip-4361
   *
   * @category Auth
   *
   * @remarks
   * - Uses a Web3 (Ethereum, Solana) wallet to sign a user in.
   * - Read up on the [potential for abuse](/docs/guides/auth/auth-web3#potential-for-abuse) before using it.
   *
   * @example Sign in with Solana or Ethereum (Window API)
   * ```js
   *   // uses window.ethereum for the wallet
   *   const { data, error } = await supabase.auth.signInWithWeb3({
   *     chain: 'ethereum',
   *     statement: 'I accept the Terms of Service at https://example.com/tos'
   *   })
   *
   *   // uses window.solana for the wallet
   *   const { data, error } = await supabase.auth.signInWithWeb3({
   *     chain: 'solana',
   *     statement: 'I accept the Terms of Service at https://example.com/tos'
   *   })
   * ```
   *
   * @example Sign in with Ethereum (Message and Signature)
   * ```js
   *   const { data, error } = await supabase.auth.signInWithWeb3({
   *     chain: 'ethereum',
   *     message: '<sign in with ethereum message>',
   *     signature: '<hex of the ethereum signature over the message>',
   *   })
   * ```
   *
   * @example Sign in with Solana (Brave)
   * ```js
   *   const { data, error } = await supabase.auth.signInWithWeb3({
   *     chain: 'solana',
   *     statement: 'I accept the Terms of Service at https://example.com/tos',
   *     wallet: window.braveSolana
   *   })
   * ```
   *
   * @example Sign in with Solana (Wallet Adapter)
   * ```jsx
   *   function SignInButton() {
   *   const wallet = useWallet()
   *
   *   return (
   *     <>
   *       {wallet.connected ? (
   *         <button
   *           onClick={() => {
   *             supabase.auth.signInWithWeb3({
   *               chain: 'solana',
   *               statement: 'I accept the Terms of Service at https://example.com/tos',
   *               wallet,
   *             })
   *           }}
   *         >
   *           Sign in with Solana
   *         </button>
   *       ) : (
   *         <WalletMultiButton />
   *       )}
   *     </>
   *   )
   * }
   *
   * function App() {
   *   const endpoint = clusterApiUrl('devnet')
   *   const wallets = useMemo(() => [], [])
   *
   *   return (
   *     <ConnectionProvider endpoint={endpoint}>
   *       <WalletProvider wallets={wallets}>
   *         <WalletModalProvider>
   *           <SignInButton />
   *         </WalletModalProvider>
   *       </WalletProvider>
   *     </ConnectionProvider>
   *   )
   * }
   * ```
   */
  async signInWithWeb3(e) {
    const { chain: r } = e;
    switch (r) {
      case "ethereum":
        return await this.signInWithEthereum(e);
      case "solana":
        return await this.signInWithSolana(e);
      default:
        throw new Error(`@supabase/auth-js: Unsupported chain "${r}"`);
    }
  }
  async signInWithEthereum(e) {
    var r, s, n, i, a, l, h, o, c, u, d;
    let f, g;
    if ("message" in e)
      f = e.message, g = e.signature;
    else {
      const { chain: m, wallet: p, statement: y, options: _ } = e;
      let w;
      if (G())
        if (typeof p == "object")
          w = p;
        else {
          const R = window;
          if ("ethereum" in R && typeof R.ethereum == "object" && "request" in R.ethereum && typeof R.ethereum.request == "function")
            w = R.ethereum;
          else
            throw new Error("@supabase/auth-js: No compatible Ethereum wallet interface on the window object (window.ethereum) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'ethereum', wallet: resolvedUserWallet }) instead.");
        }
      else {
        if (typeof p != "object" || !_?.url)
          throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
        w = p;
      }
      const v = new URL((r = _?.url) !== null && r !== void 0 ? r : window.location.href), x = await w.request({
        method: "eth_requestAccounts"
      }).then((R) => R).catch(() => {
        throw new Error("@supabase/auth-js: Wallet method eth_requestAccounts is missing or invalid");
      });
      if (!x || x.length === 0)
        throw new Error("@supabase/auth-js: No accounts available. Please ensure the wallet is connected.");
      const b = Qs(x[0]);
      let O = (s = _?.signInWithEthereum) === null || s === void 0 ? void 0 : s.chainId;
      if (!O) {
        const R = await w.request({
          method: "eth_chainId"
        });
        O = Ka(R);
      }
      const A = {
        domain: v.host,
        address: b,
        statement: y,
        uri: v.href,
        version: "1",
        chainId: O,
        nonce: (n = _?.signInWithEthereum) === null || n === void 0 ? void 0 : n.nonce,
        issuedAt: (a = (i = _?.signInWithEthereum) === null || i === void 0 ? void 0 : i.issuedAt) !== null && a !== void 0 ? a : /* @__PURE__ */ new Date(),
        expirationTime: (l = _?.signInWithEthereum) === null || l === void 0 ? void 0 : l.expirationTime,
        notBefore: (h = _?.signInWithEthereum) === null || h === void 0 ? void 0 : h.notBefore,
        requestId: (o = _?.signInWithEthereum) === null || o === void 0 ? void 0 : o.requestId,
        resources: (c = _?.signInWithEthereum) === null || c === void 0 ? void 0 : c.resources
      };
      f = za(A), g = await w.request({
        method: "personal_sign",
        params: [Va(f), b]
      });
    }
    try {
      const { data: m, error: p } = await E(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
        headers: this.headers,
        body: Object.assign({
          chain: "ethereum",
          message: f,
          signature: g
        }, !((u = e.options) === null || u === void 0) && u.captchaToken ? { gotrue_meta_security: { captcha_token: (d = e.options) === null || d === void 0 ? void 0 : d.captchaToken } } : null),
        xform: se
      });
      if (p)
        throw p;
      if (!m || !m.session || !m.user) {
        const y = new $e();
        return this._returnResult({ data: { user: null, session: null }, error: y });
      }
      return m.session && (await this._saveSession(m.session), await this._notifyAllSubscribers("SIGNED_IN", m.session)), this._returnResult({ data: Object.assign({}, m), error: p });
    } catch (m) {
      if (k(m))
        return this._returnResult({ data: { user: null, session: null }, error: m });
      throw m;
    }
  }
  async signInWithSolana(e) {
    var r, s, n, i, a, l, h, o, c, u, d, f;
    let g, m;
    if ("message" in e)
      g = e.message, m = e.signature;
    else {
      const { chain: p, wallet: y, statement: _, options: w } = e;
      let v;
      if (G())
        if (typeof y == "object")
          v = y;
        else {
          const b = window;
          if ("solana" in b && typeof b.solana == "object" && ("signIn" in b.solana && typeof b.solana.signIn == "function" || "signMessage" in b.solana && typeof b.solana.signMessage == "function"))
            v = b.solana;
          else
            throw new Error("@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.");
        }
      else {
        if (typeof y != "object" || !w?.url)
          throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
        v = y;
      }
      const x = new URL((r = w?.url) !== null && r !== void 0 ? r : window.location.href);
      if ("signIn" in v && v.signIn) {
        const b = await v.signIn(Object.assign(Object.assign(Object.assign({ issuedAt: (/* @__PURE__ */ new Date()).toISOString() }, w?.signInWithSolana), {
          // non-overridable properties
          version: "1",
          domain: x.host,
          uri: x.href
        }), _ ? { statement: _ } : null));
        let O;
        if (Array.isArray(b) && b[0] && typeof b[0] == "object")
          O = b[0];
        else if (b && typeof b == "object" && "signedMessage" in b && "signature" in b)
          O = b;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
        if ("signedMessage" in O && "signature" in O && (typeof O.signedMessage == "string" || O.signedMessage instanceof Uint8Array) && O.signature instanceof Uint8Array)
          g = typeof O.signedMessage == "string" ? O.signedMessage : new TextDecoder().decode(O.signedMessage), m = O.signature;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
      } else {
        if (!("signMessage" in v) || typeof v.signMessage != "function" || !("publicKey" in v) || typeof v != "object" || !v.publicKey || !("toBase58" in v.publicKey) || typeof v.publicKey.toBase58 != "function")
          throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
        g = [
          `${x.host} wants you to sign in with your Solana account:`,
          v.publicKey.toBase58(),
          ..._ ? ["", _, ""] : [""],
          "Version: 1",
          `URI: ${x.href}`,
          `Issued At: ${(n = (s = w?.signInWithSolana) === null || s === void 0 ? void 0 : s.issuedAt) !== null && n !== void 0 ? n : (/* @__PURE__ */ new Date()).toISOString()}`,
          ...!((i = w?.signInWithSolana) === null || i === void 0) && i.notBefore ? [`Not Before: ${w.signInWithSolana.notBefore}`] : [],
          ...!((a = w?.signInWithSolana) === null || a === void 0) && a.expirationTime ? [`Expiration Time: ${w.signInWithSolana.expirationTime}`] : [],
          ...!((l = w?.signInWithSolana) === null || l === void 0) && l.chainId ? [`Chain ID: ${w.signInWithSolana.chainId}`] : [],
          ...!((h = w?.signInWithSolana) === null || h === void 0) && h.nonce ? [`Nonce: ${w.signInWithSolana.nonce}`] : [],
          ...!((o = w?.signInWithSolana) === null || o === void 0) && o.requestId ? [`Request ID: ${w.signInWithSolana.requestId}`] : [],
          ...!((u = (c = w?.signInWithSolana) === null || c === void 0 ? void 0 : c.resources) === null || u === void 0) && u.length ? [
            "Resources",
            ...w.signInWithSolana.resources.map((O) => `- ${O}`)
          ] : []
        ].join(`
`);
        const b = await v.signMessage(new TextEncoder().encode(g), "utf8");
        if (!b || !(b instanceof Uint8Array))
          throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
        m = b;
      }
    }
    try {
      const { data: p, error: y } = await E(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
        headers: this.headers,
        body: Object.assign({ chain: "solana", message: g, signature: Oe(m) }, !((d = e.options) === null || d === void 0) && d.captchaToken ? { gotrue_meta_security: { captcha_token: (f = e.options) === null || f === void 0 ? void 0 : f.captchaToken } } : null),
        xform: se
      });
      if (y)
        throw y;
      if (!p || !p.session || !p.user) {
        const _ = new $e();
        return this._returnResult({ data: { user: null, session: null }, error: _ });
      }
      return p.session && (await this._saveSession(p.session), await this._notifyAllSubscribers("SIGNED_IN", p.session)), this._returnResult({ data: Object.assign({}, p), error: y });
    } catch (p) {
      if (k(p))
        return this._returnResult({ data: { user: null, session: null }, error: p });
      throw p;
    }
  }
  async _exchangeCodeForSession(e, r) {
    const s = r?.flowId != null, n = s ? St(r?.flowId) : G() ? St(es(window.location.href)[Re]) : null;
    s && !n && this._debug("#_exchangeCodeForSession()", "provided flowId is not a valid flow id", r?.flowId);
    const { verifier: i, flowId: a } = s && !n ? { verifier: null, flowId: null } : await Aa(this.storage, this.storageKey, n), [l, h] = (i ?? "").split("/");
    try {
      if (!l && this.flowType === "pkce")
        throw new ua();
      const { data: o, error: c } = await E(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, {
        headers: this.headers,
        body: {
          auth_code: e,
          code_verifier: l
        },
        xform: se
      });
      if (await ne(this.storage, this.storageKey, a), c)
        throw c;
      if (!o || !o.session || !o.user) {
        const u = new $e();
        return this._returnResult({
          data: { user: null, session: null, redirectType: null },
          error: u
        });
      }
      return o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers(h === "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", o.session)), this._returnResult({ data: Object.assign(Object.assign({}, o), { redirectType: h ?? null }), error: c });
    } catch (o) {
      if (await ne(this.storage, this.storageKey, a), k(o))
        return this._returnResult({
          data: { user: null, session: null, redirectType: null },
          error: o
        });
      throw o;
    }
  }
  /**
   * Allows signing in with an OIDC ID token. The authentication provider used
   * should be enabled and configured.
   *
   * @category Auth
   *
   * @remarks
   * - Use an ID token to sign in.
   * - Especially useful when implementing sign in using native platform dialogs in mobile or desktop apps using Sign in with Apple or Sign in with Google on iOS and Android.
   * - You can also use Google's [One Tap](https://developers.google.com/identity/gsi/web/guides/display-google-one-tap) and [Automatic sign-in](https://developers.google.com/identity/gsi/web/guides/automatic-sign-in-sign-out) via this API.
   *
   * @example Sign In using ID Token
   * ```js
   * const { data, error } = await supabase.auth.signInWithIdToken({
   *   provider: 'google',
   *   token: 'your-id-token'
   * })
   * ```
   *
   * @exampleResponse Sign In using ID Token
   * ```json
   * {
   *   "data": {
   *     "user": {
   *       "id": "11111111-1111-1111-1111-111111111111",
   *       "aud": "authenticated",
   *       "role": "authenticated",
   *       "last_sign_in_at": "2024-01-01T00:00:00Z",
   *       "app_metadata": {
   *         ...
   *       },
   *       "user_metadata": {
   *         ...
   *       },
   *       "identities": [
   *         {
   *           "identity_id": "22222222-2222-2222-2222-222222222222",
   *           "provider": "google",
   *         }
   *       ],
   *       "created_at": "2024-01-01T00:00:00Z",
   *       "updated_at": "2024-01-01T00:00:00Z",
   *     },
   *     "session": {
   *       "access_token": "<ACCESS_TOKEN>",
   *       "token_type": "bearer",
   *       "expires_in": 3600,
   *       "expires_at": 1700000000,
   *       "refresh_token": "<REFRESH_TOKEN>",
   *       "user": {
   *         "id": "11111111-1111-1111-1111-111111111111",
   *         "aud": "authenticated",
   *         "role": "authenticated",
   *         "last_sign_in_at": "2024-01-01T00:00:00Z",
   *         "app_metadata": {
   *           ...
   *         },
   *         "user_metadata": {
   *           ...
   *         },
   *         "identities": [
   *           {
   *             "identity_id": "22222222-2222-2222-2222-222222222222",
   *             "provider": "google",
   *           }
   *         ],
   *         "created_at": "2024-01-01T00:00:00Z",
   *         "updated_at": "2024-01-01T00:00:00Z",
   *       }
   *     }
   *   },
   *   "error": null
   * }
   * ```
   */
  async signInWithIdToken(e) {
    try {
      const { options: r, provider: s, token: n, access_token: i, nonce: a } = e, l = await E(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
        headers: this.headers,
        body: {
          provider: s,
          id_token: n,
          access_token: i,
          nonce: a,
          gotrue_meta_security: { captcha_token: r?.captchaToken }
        },
        xform: se
      }), { data: h, error: o } = l;
      if (o)
        return this._returnResult({ data: { user: null, session: null }, error: o });
      if (!h || !h.session || !h.user) {
        const c = new $e();
        return this._returnResult({ data: { user: null, session: null }, error: c });
      }
      return h.session && (await this._saveSession(h.session), await this._notifyAllSubscribers("SIGNED_IN", h.session)), this._returnResult({ data: h, error: o });
    } catch (r) {
      if (k(r))
        return this._returnResult({ data: { user: null, session: null }, error: r });
      throw r;
    }
  }
  /**
   * Log in a user using magiclink or a one-time password (OTP).
   *
   * If the `{{ .ConfirmationURL }}` variable is specified in the email template, a magiclink will be sent.
   * If the `{{ .Token }}` variable is specified in the email template, an OTP will be sent.
   * If you're using phone sign-ins, only an OTP will be sent. You won't be able to send a magiclink for phone sign-ins.
   *
   * Be aware that you may get back an error message that will not distinguish
   * between the cases where the account does not exist or, that the account
   * can only be accessed via social login.
   *
   * Do note that you will need to configure a Whatsapp sender on Twilio
   * if you are using phone sign in with the 'whatsapp' channel. The whatsapp
   * channel is not supported on other providers
   * at this time.
   * This method supports PKCE when an email is passed.
   *
   * @category Auth
   *
   * @remarks
   * - Requires either an email or phone number.
   * - This method is used for passwordless sign-ins where a OTP is sent to the user's email or phone number.
   * - If the user doesn't exist, `signInWithOtp()` will signup the user instead. To restrict this behavior, you can set `shouldCreateUser` in `SignInWithPasswordlessCredentials.options` to `false`.
   * - If you're using an email, you can configure whether you want the user to receive a magiclink or a OTP.
   * - If you're using phone, you can configure whether you want the user to receive a OTP.
   * - The magic link's destination URL is determined by the [`SITE_URL`](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls).
   * - See [redirect URLs and wildcards](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls) to add additional redirect URLs to your project.
   * - Magic links and OTPs share the same implementation. To send users a one-time code instead of a magic link, [modify the magic link email template](/dashboard/project/_/auth/templates) to include `{{ .Token }}` instead of `{{ .ConfirmationURL }}`.
   * - See our [Twilio Phone Auth Guide](/docs/guides/auth/phone-login?showSMSProvider=Twilio) for details about configuring WhatsApp sign in.
   *
   * @exampleDescription Sign in with email
   * The user will be sent an email which contains either a magiclink or a OTP or both. By default, a given user can only request a OTP once every 60 seconds.
   *
   * @example Sign in with email
   * ```js
   * const { data, error } = await supabase.auth.signInWithOtp({
   *   email: 'example@email.com',
   *   options: {
   *     emailRedirectTo: 'https://example.com/welcome'
   *   }
   * })
   * ```
   *
   * @exampleResponse Sign in with email
   * ```json
   * {
   *   "data": {
   *     "user": null,
   *     "session": null
   *   },
   *   "error": null
   * }
   * ```
   *
   * @exampleDescription Sign in with SMS OTP
   * The user will be sent a SMS which contains a OTP. By default, a given user can only request a OTP once every 60 seconds.
   *
   * @example Sign in with SMS OTP
   * ```js
   * const { data, error } = await supabase.auth.signInWithOtp({
   *   phone: '+13334445555',
   * })
   * ```
   *
   * @exampleDescription Sign in with WhatsApp OTP
   * The user will be sent a WhatsApp message which contains a OTP. By default, a given user can only request a OTP once every 60 seconds. Note that a user will need to have a valid WhatsApp account that is linked to Twilio in order to use this feature.
   *
   * @example Sign in with WhatsApp OTP
   * ```js
   * const { data, error } = await supabase.auth.signInWithOtp({
   *   phone: '+13334445555',
   *   options: {
   *     channel:'whatsapp',
   *   }
   * })
   * ```
   */
  async signInWithOtp(e) {
    var r, s, n, i, a;
    let l = null;
    try {
      if ("email" in e) {
        const { email: h, options: o } = e;
        let c = null, u = null;
        this.flowType === "pkce" && ([c, u, l] = await this._getCodeChallengeAndMethod());
        const { error: d } = await E(this.fetch, "POST", `${this.url}/otp`, {
          headers: this.headers,
          body: {
            email: h,
            data: (r = o?.data) !== null && r !== void 0 ? r : {},
            create_user: (s = o?.shouldCreateUser) !== null && s !== void 0 ? s : !0,
            gotrue_meta_security: { captcha_token: o?.captchaToken },
            code_challenge: c,
            code_challenge_method: u
          },
          redirectTo: this._maybeAppendFlowIdToRedirect(o?.emailRedirectTo, l)
        });
        return this._returnResult({ data: { user: null, session: null }, error: d });
      }
      if ("phone" in e) {
        const { phone: h, options: o } = e, { data: c, error: u } = await E(this.fetch, "POST", `${this.url}/otp`, {
          headers: this.headers,
          body: {
            phone: h,
            data: (n = o?.data) !== null && n !== void 0 ? n : {},
            create_user: (i = o?.shouldCreateUser) !== null && i !== void 0 ? i : !0,
            gotrue_meta_security: { captcha_token: o?.captchaToken },
            channel: (a = o?.channel) !== null && a !== void 0 ? a : "sms"
          }
        });
        return this._returnResult({
          data: { user: null, session: null, messageId: c?.message_id },
          error: u
        });
      }
      throw new gt("You must provide either an email or phone number.");
    } catch (h) {
      if (await ne(this.storage, this.storageKey, l), k(h))
        return this._returnResult({ data: { user: null, session: null }, error: h });
      throw h;
    }
  }
  /**
   * Log in a user given a User supplied OTP or TokenHash received through mobile or email.
   *
   * @category Auth
   *
   * @remarks
   * - The `verifyOtp` method takes in different verification types.
   * - If a phone number is used, the type can either be:
   *   1. `sms` – Used when verifying a one-time password (OTP) sent via SMS during sign-up or sign-in.
   *   2. `phone_change` – Used when verifying an OTP sent to a new phone number during a phone number update process.
   * - If an email address is used, the type can be one of the following (note: `signup` and `magiclink` types are deprecated):
   *   1. `email` – Used when verifying an OTP sent to the user's email during sign-up or sign-in.
   *   2. `recovery` – Used when verifying an OTP sent for account recovery, typically after a password reset request.
   *   3. `invite` – Used when verifying an OTP sent as part of an invitation to join a project or organization.
   *   4. `email_change` – Used when verifying an OTP sent to a new email address during an email update process.
   * - The verification type used should be determined based on the corresponding auth method called before `verifyOtp` to sign up / sign-in a user.
   * - The `TokenHash` is contained in the [email templates](/docs/guides/auth/auth-email-templates) and can be used to sign in.  You may wish to use the hash for the PKCE flow for Server Side Auth. Read [the Password-based Auth guide](/docs/guides/auth/passwords) for more details.
   *
   * @example Verify Signup One-Time Password (OTP)
   * ```js
   * const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email'})
   * ```
   *
   * @exampleResponse Verify Signup One-Time Password (OTP)
   * ```json
   * {
   *   "data": {
   *     "user": {
   *       "id": "11111111-1111-1111-1111-111111111111",
   *       "aud": "authenticated",
   *       "role": "authenticated",
   *       "email": "example@email.com",
   *       "email_confirmed_at": "2024-01-01T00:00:00Z",
   *       "phone": "",
   *       "confirmed_at": "2024-01-01T00:00:00Z",
   *       "recovery_sent_at": "2024-01-01T00:00:00Z",
   *       "last_sign_in_at": "2024-01-01T00:00:00Z",
   *       "app_metadata": {
   *         "provider": "email",
   *         "providers": [
   *           "email"
   *         ]
   *       },
   *       "user_metadata": {
   *         "email": "example@email.com",
   *         "email_verified": false,
   *         "phone_verified": false,
   *         "sub": "11111111-1111-1111-1111-111111111111"
   *       },
   *       "identities": [
   *         {
   *           "identity_id": "22222222-2222-2222-2222-222222222222",
   *           "id": "11111111-1111-1111-1111-111111111111",
   *           "user_id": "11111111-1111-1111-1111-111111111111",
   *           "identity_data": {
   *             "email": "example@email.com",
   *             "email_verified": false,
   *             "phone_verified": false,
   *             "sub": "11111111-1111-1111-1111-111111111111"
   *           },
   *           "provider": "email",
   *           "last_sign_in_at": "2024-01-01T00:00:00Z",
   *           "created_at": "2024-01-01T00:00:00Z",
   *           "updated_at": "2024-01-01T00:00:00Z",
   *           "email": "example@email.com"
   *         }
   *       ],
   *       "created_at": "2024-01-01T00:00:00Z",
   *       "updated_at": "2024-01-01T00:00:00Z",
   *       "is_anonymous": false
   *     },
   *     "session": {
   *       "access_token": "<ACCESS_TOKEN>",
   *       "token_type": "bearer",
   *       "expires_in": 3600,
   *       "expires_at": 1700000000,
   *       "refresh_token": "<REFRESH_TOKEN>",
   *       "user": {
   *         "id": "11111111-1111-1111-1111-111111111111",
   *         "aud": "authenticated",
   *         "role": "authenticated",
   *         "email": "example@email.com",
   *         "email_confirmed_at": "2024-01-01T00:00:00Z",
   *         "phone": "",
   *         "confirmed_at": "2024-01-01T00:00:00Z",
   *         "recovery_sent_at": "2024-01-01T00:00:00Z",
   *         "last_sign_in_at": "2024-01-01T00:00:00Z",
   *         "app_metadata": {
   *           "provider": "email",
   *           "providers": [
   *             "email"
   *           ]
   *         },
   *         "user_metadata": {
   *           "email": "example@email.com",
   *           "email_verified": false,
   *           "phone_verified": false,
   *           "sub": "11111111-1111-1111-1111-111111111111"
   *         },
   *         "identities": [
   *           {
   *             "identity_id": "22222222-2222-2222-2222-222222222222",
   *             "id": "11111111-1111-1111-1111-111111111111",
   *             "user_id": "11111111-1111-1111-1111-111111111111",
   *             "identity_data": {
   *               "email": "example@email.com",
   *               "email_verified": false,
   *               "phone_verified": false,
   *               "sub": "11111111-1111-1111-1111-111111111111"
   *             },
   *             "provider": "email",
   *             "last_sign_in_at": "2024-01-01T00:00:00Z",
   *             "created_at": "2024-01-01T00:00:00Z",
   *             "updated_at": "2024-01-01T00:00:00Z",
   *             "email": "example@email.com"
   *           }
   *         ],
   *         "created_at": "2024-01-01T00:00:00Z",
   *         "updated_at": "2024-01-01T00:00:00Z",
   *         "is_anonymous": false
   *       }
   *     }
   *   },
   *   "error": null
   * }
   * ```
   *
   * @example Verify SMS One-Time Password (OTP)
   * ```js
   * const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms'})
   * ```
   *
   * @example Verify Email Auth (Token Hash)
   * ```js
   * const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email'})
   * ```
   */
  async verifyOtp(e) {
    var r, s;
    try {
      let n, i;
      "options" in e && (n = (r = e.options) === null || r === void 0 ? void 0 : r.redirectTo, i = (s = e.options) === null || s === void 0 ? void 0 : s.captchaToken);
      const { data: a, error: l } = await E(this.fetch, "POST", `${this.url}/verify`, {
        headers: this.headers,
        body: Object.assign(Object.assign({}, e), { gotrue_meta_security: { captcha_token: i } }),
        redirectTo: n,
        xform: se
      });
      if (l)
        throw l;
      if (!a)
        throw new Error("An error occurred on token verification.");
      const h = a.session, o = a.user;
      return h?.access_token && (await this._saveSession(h), await this._notifyAllSubscribers(e.type == "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", h)), this._returnResult({ data: { user: o, session: h }, error: null });
    } catch (n) {
      if (k(n))
        return this._returnResult({ data: { user: null, session: null }, error: n });
      throw n;
    }
  }
  /**
   * Attempts a single-sign on using an enterprise Identity Provider. A
   * successful SSO attempt will redirect the current page to the identity
   * provider authorization page. The redirect URL is implementation and SSO
   * protocol specific.
   *
   * You can use it by providing a SSO domain. Typically you can extract this
   * domain by asking users for their email address. If this domain is
   * registered on the Auth instance the redirect will use that organization's
   * currently active SSO Identity Provider for the login.
   *
   * If you have built an organization-specific login page, you can use the
   * organization's SSO Identity Provider UUID directly instead.
   *
   * @category Auth
   *
   * @remarks
   * - Before you can call this method you need to [establish a connection](/docs/guides/auth/sso/auth-sso-saml#managing-saml-20-connections) to an identity provider. Use the [CLI commands](/docs/reference/cli/supabase-sso) to do this.
   * - If you've associated an email domain to the identity provider, you can use the `domain` property to start a sign-in flow.
   * - In case you need to use a different way to start the authentication flow with an identity provider, you can use the `providerId` property. For example:
   *     - Mapping specific user email addresses with an identity provider.
   *     - Using different hints to identity the identity provider to be used by the user, like a company-specific page, IP address or other tracking information.
   *
   * @example Sign in with email domain
   * ```js
   *   // You can extract the user's email domain and use it to trigger the
   *   // authentication flow with the correct identity provider.
   *
   *   const { data, error } = await supabase.auth.signInWithSSO({
   *     domain: 'company.com'
   *   })
   *
   *   if (data?.url) {
   *     // redirect the user to the identity provider's authentication flow
   *     window.location.href = data.url
   *   }
   * ```
   *
   * @example Sign in with provider UUID
   * ```js
   *   // Useful when you need to map a user's sign in request according
   *   // to different rules that can't use email domains.
   *
   *   const { data, error } = await supabase.auth.signInWithSSO({
   *     providerId: '21648a9d-8d5a-4555-a9d1-d6375dc14e92'
   *   })
   *
   *   if (data?.url) {
   *     // redirect the user to the identity provider's authentication flow
   *     window.location.href = data.url
   *   }
   * ```
   */
  async signInWithSSO(e) {
    var r, s, n, i;
    let a = null;
    try {
      let l = null, h = null;
      this.flowType === "pkce" && ([l, h, a] = await this._getCodeChallengeAndMethod());
      const o = await E(this.fetch, "POST", `${this.url}/sso`, {
        body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in e ? { provider_id: e.providerId } : null), "domain" in e ? { domain: e.domain } : null), { redirect_to: this._maybeAppendFlowIdToRedirect((r = e.options) === null || r === void 0 ? void 0 : r.redirectTo, a) }), !((s = e?.options) === null || s === void 0) && s.captchaToken ? { gotrue_meta_security: { captcha_token: e.options.captchaToken } } : null), { skip_http_redirect: !0, code_challenge: l, code_challenge_method: h }),
        headers: this.headers,
        xform: Fa
      });
      return !((n = o.data) === null || n === void 0) && n.url && G() && !(!((i = e.options) === null || i === void 0) && i.skipBrowserRedirect) && window.location.assign(o.data.url), this._returnResult(o);
    } catch (l) {
      if (await ne(this.storage, this.storageKey, a), k(l))
        return this._returnResult({ data: null, error: l });
      throw l;
    }
  }
  /**
   * Sends a reauthentication OTP to the user's email or phone number.
   * Requires the user to be signed-in.
   *
   * @category Auth
   *
   * @remarks
   * - This method is used together with `updateUser()` when a user's password needs to be updated.
   * - If you require your user to reauthenticate before updating their password, you need to enable the **Secure password change** option in your [project's email provider settings](/dashboard/project/_/auth/providers).
   * - A user is only require to reauthenticate before updating their password if **Secure password change** is enabled and the user **hasn't recently signed in**. A user is deemed recently signed in if the session was created in the last 24 hours.
   * - This method will send a nonce to the user's email. If the user doesn't have a confirmed email address, the method will send the nonce to the user's confirmed phone number instead.
   * - After receiving the OTP, include it as the `nonce` in your `updateUser()` call to finalize the password change.
   *
   * @exampleDescription Send reauthentication nonce
   * Sends a reauthentication nonce to the user's email or phone number.
   *
   * @example Send reauthentication nonce
   * ```js
   * const { error } = await supabase.auth.reauthenticate()
   * ```
   */
  async reauthenticate() {
    return await this.initializePromise, this.lock != null ? await this._acquireLock(this.lockAcquireTimeout, async () => await this._reauthenticate()) : await this._reauthenticate();
  }
  async _reauthenticate() {
    try {
      return await this._useSession(async (e) => {
        const { data: { session: r }, error: s } = e;
        if (s)
          throw s;
        if (!r)
          throw new z();
        const { error: n } = await E(this.fetch, "GET", `${this.url}/reauthenticate`, {
          headers: this.headers,
          jwt: r.access_token
        });
        return this._returnResult({ data: { user: null, session: null }, error: n });
      });
    } catch (e) {
      if (k(e))
        return this._returnResult({ data: { user: null, session: null }, error: e });
      throw e;
    }
  }
  /**
   * Resends an existing signup confirmation email, email change email, SMS OTP or phone change OTP.
   *
   * @category Auth
   *
   * @remarks
   * - Resends a signup confirmation, email change or phone change email to the user.
   * - Passwordless sign-ins can be resent by calling the `signInWithOtp()` method again.
   * - Password recovery emails can be resent by calling the `resetPasswordForEmail()` method again.
   * - This method will only resend an email or phone OTP to the user if there was an initial signup, email change or phone change request being made(note: For existing users signing in with OTP, you should use `signInWithOtp()` again to resend the OTP).
   * - You can specify a redirect url when you resend an email link using the `emailRedirectTo` option.
   *
   * @exampleDescription Resend an email signup confirmation
   * Resends the email signup confirmation to the user
   *
   * @example Resend an email signup confirmation
   * ```js
   * const { error } = await supabase.auth.resend({
   *   type: 'signup',
   *   email: 'email@example.com',
   *   options: {
   *     emailRedirectTo: 'https://example.com/welcome'
   *   }
   * })
   * ```
   *
   * @exampleDescription Resend a phone signup confirmation
   * Resends the phone signup confirmation email to the user
   *
   * @example Resend a phone signup confirmation
   * ```js
   * const { error } = await supabase.auth.resend({
   *   type: 'sms',
   *   phone: '1234567890'
   * })
   * ```
   *
   * @exampleDescription Resend email change email
   * Resends the email change email to the user
   *
   * @example Resend email change email
   * ```js
   * const { error } = await supabase.auth.resend({
   *   type: 'email_change',
   *   email: 'email@example.com'
   * })
   * ```
   *
   * @exampleDescription Resend phone change OTP
   * Resends the phone change OTP to the user
   *
   * @example Resend phone change OTP
   * ```js
   * const { error } = await supabase.auth.resend({
   *   type: 'phone_change',
   *   phone: '1234567890'
   * })
   * ```
   */
  async resend(e) {
    let r = null;
    try {
      const s = `${this.url}/resend`;
      if ("email" in e) {
        const { email: n, type: i, options: a } = e;
        let l = null, h = null;
        this.flowType === "pkce" && ([l, h, r] = await this._getCodeChallengeAndMethod());
        const { error: o } = await E(this.fetch, "POST", s, {
          headers: this.headers,
          body: {
            email: n,
            type: i,
            gotrue_meta_security: { captcha_token: a?.captchaToken },
            code_challenge: l,
            code_challenge_method: h
          },
          redirectTo: this._maybeAppendFlowIdToRedirect(a?.emailRedirectTo, r)
        });
        return o && await ne(this.storage, this.storageKey, r), this._returnResult({ data: { user: null, session: null }, error: o });
      } else if ("phone" in e) {
        const { phone: n, type: i, options: a } = e, { data: l, error: h } = await E(this.fetch, "POST", s, {
          headers: this.headers,
          body: {
            phone: n,
            type: i,
            gotrue_meta_security: { captcha_token: a?.captchaToken }
          }
        });
        return this._returnResult({
          data: { user: null, session: null, messageId: l?.message_id },
          error: h
        });
      }
      throw new gt("You must provide either an email or phone number and a type");
    } catch (s) {
      if (await ne(this.storage, this.storageKey, r), k(s))
        return this._returnResult({ data: { user: null, session: null }, error: s });
      throw s;
    }
  }
  /**
   * Returns the session, refreshing it if necessary.
   *
   * The session returned can be null if the session is not detected which can happen in the event a user is not signed-in or has logged out.
   *
   * **IMPORTANT:** This method loads values directly from the storage attached
   * to the client. If that storage is based on request cookies for example,
   * the values in it may not be authentic and therefore it's strongly advised
   * against using this method and its results in such circumstances. A warning
   * will be emitted if this is detected. Use {@link GoTrueClient.getUser} instead.
   *
   * @category Auth
   *
   * @remarks
   * - Since the introduction of [asymmetric JWT signing keys](/docs/guides/auth/signing-keys), this method is considered low-level and we encourage you to use `getClaims()` or `getUser()` instead.
   * - Retrieves the current [user session](/docs/guides/auth/sessions) from the storage medium (local storage, cookies).
   * - The session contains an access token (signed JWT), a refresh token and the user object.
   * - If the session's access token is expired or is about to expire, this method will use the refresh token to refresh the session.
   * - When using in a browser, or you've called `startAutoRefresh()` in your environment (React Native, etc.) this function always returns a valid access token without refreshing the session itself, as this is done in the background. This function returns very fast.
   * - **IMPORTANT SECURITY NOTICE:** If using an insecure storage medium, such as cookies or request headers, the user object returned by this function **must not be trusted**. Always verify the JWT using `getClaims()` or your own JWT verification library to securely establish the user's identity and access. You can also use `getUser()` to fetch the user object directly from the Auth server for this purpose.
   * - Cross-tab refresh races are handled by the GoTrue server (the rotated token from the first tab is returned to subsequent tabs via the parent-of-active mechanism), so no client-side serialization is needed.
   *
   * @example Get the session data
   * ```js
   * const { data, error } = await supabase.auth.getSession()
   * ```
   *
   * @exampleResponse Get the session data
   * ```json
   * {
   *   "data": {
   *     "session": {
   *       "access_token": "<ACCESS_TOKEN>",
   *       "token_type": "bearer",
   *       "expires_in": 3600,
   *       "expires_at": 1700000000,
   *       "refresh_token": "<REFRESH_TOKEN>",
   *       "user": {
   *         "id": "11111111-1111-1111-1111-111111111111",
   *         "aud": "authenticated",
   *         "role": "authenticated",
   *         "email": "example@email.com",
   *         "email_confirmed_at": "2024-01-01T00:00:00Z",
   *         "phone": "",
   *         "last_sign_in_at": "2024-01-01T00:00:00Z",
   *         "app_metadata": {
   *           "provider": "email",
   *           "providers": [
   *             "email"
   *           ]
   *         },
   *         "user_metadata": {
   *           "email": "example@email.com",
   *           "email_verified": false,
   *           "phone_verified": false,
   *           "sub": "11111111-1111-1111-1111-111111111111"
   *         },
   *         "identities": [
   *           {
   *             "identity_id": "22222222-2222-2222-2222-222222222222",
   *             "id": "11111111-1111-1111-1111-111111111111",
   *             "user_id": "11111111-1111-1111-1111-111111111111",
   *             "identity_data": {
   *               "email": "example@email.com",
   *               "email_verified": false,
   *               "phone_verified": false,
   *               "sub": "11111111-1111-1111-1111-111111111111"
   *             },
   *             "provider": "email",
   *             "last_sign_in_at": "2024-01-01T00:00:00Z",
   *             "created_at": "2024-01-01T00:00:00Z",
   *             "updated_at": "2024-01-01T00:00:00Z",
   *             "email": "example@email.com"
   *           }
   *         ],
   *         "created_at": "2024-01-01T00:00:00Z",
   *         "updated_at": "2024-01-01T00:00:00Z",
   *         "is_anonymous": false
   *       }
   *     }
   *   },
   *   "error": null
   * }
   * ```
   */
  async getSession() {
    return await this.initializePromise, this.lock != null ? await this._acquireLock(this.lockAcquireTimeout, async () => this._useSession(async (e) => e)) : await this._useSession(async (e) => e);
  }
  /**
   * Acquires a global lock based on the storage key.
   *
   * TODO(v3): remove along with the legacy lock path. Only called when
   * `this.lock` is non-null (custom lock supplied via constructor). The
   * default lockless path bypasses this entirely.
   */
  async _acquireLock(e, r) {
    this._debug("#_acquireLock", "begin", e);
    try {
      if (this.lockAcquired) {
        const s = this.pendingInLock.length ? this.pendingInLock[this.pendingInLock.length - 1] : Promise.resolve(), n = (async () => (await s, await r()))();
        return this.pendingInLock.push((async () => {
          try {
            await n;
          } catch {
          }
        })()), n;
      }
      return await this.lock(`lock:${this.storageKey}`, e, async () => {
        this._debug("#_acquireLock", "lock acquired for storage key", this.storageKey);
        try {
          this.lockAcquired = !0;
          const s = r();
          for (this.pendingInLock.push((async () => {
            try {
              await s;
            } catch {
            }
          })()), await s; this.pendingInLock.length; ) {
            const n = [...this.pendingInLock];
            await Promise.all(n), this.pendingInLock.splice(0, n.length);
          }
          return await s;
        } finally {
          this._debug("#_acquireLock", "lock released for storage key", this.storageKey), this.lockAcquired = !1;
        }
      });
    } finally {
      this._debug("#_acquireLock", "end");
    }
  }
  /**
   * Use instead of {@link GoTrueClient.getSession} inside the library. Loads the session
   * via `__loadSession` (which may trigger a refresh if the access token is
   * within the expiry margin) and runs `fn` with the result.
   */
  async _useSession(e) {
    this._debug("#_useSession", "begin");
    try {
      const r = await this.__loadSession();
      return await e(r);
    } finally {
      this._debug("#_useSession", "end");
    }
  }
  /**
   * NEVER USE DIRECTLY!
   *
   * Always use `_useSession`.
   */
  async __loadSession() {
    this._debug("#__loadSession()", "begin"), this.lock != null && !this.lockAcquired && this._debug("#__loadSession()", "used outside of an acquired lock!", new Error().stack);
    try {
      let e = null;
      const r = await Y(this.storage, this.storageKey);
      if (this._debug("#getSession()", "session from storage", r), r !== null && (this._isValidSession(r) ? e = r : (this._debug("#getSession()", "session from storage is not valid"), await this._removeSession())), !e)
        return { data: { session: null }, error: null };
      const s = e.expires_at ? e.expires_at * 1e3 - Date.now() < Xt : !1;
      if (this._debug("#__loadSession()", `session has${s ? "" : " not"} expired`, "expires_at", e.expires_at), !s)
        return { data: { session: await this._hydrateSessionUser(e) }, error: null };
      const { data: n, error: i } = await this._callRefreshToken(e.refresh_token);
      if (i) {
        const a = await Y(this.storage, this.storageKey);
        return a && this._isValidSession(a) && a.expires_at && a.expires_at * 1e3 > Date.now() ? this._returnResult({
          data: { session: await this._hydrateSessionUser(a) },
          error: null
        }) : this._returnResult({ data: { session: null }, error: i });
      }
      return this._returnResult({ data: { session: n }, error: null });
    } finally {
      this._debug("#__loadSession()", "end");
    }
  }
  /**
   * Completes a session read back from storage so it matches what callers of
   * `getSession()` expect: fills in `session.user` from `userStorage` when the
   * client keeps the user in split storage, and wraps the user in the
   * insecure-access warning proxy on the server.
   */
  async _hydrateSessionUser(e) {
    if (this.userStorage) {
      const r = await Y(this.userStorage, this.storageKey + "-user");
      e.user = r?.user ? r.user : Qt();
    }
    if (this.storage.isServer && e.user && !e.user.__isUserNotAvailableProxy) {
      const r = { value: this.suppressGetSessionWarning };
      e.user = La(e.user, r), r.value && (this.suppressGetSessionWarning = !0);
    }
    return e;
  }
  /**
   * Gets the current user details if there is an existing session. This method
   * performs a network request to the Supabase Auth server, so the returned
   * value is authentic and can be used to base authorization rules on.
   *
   * @param jwt Takes in an optional access token JWT. If no JWT is provided, the JWT from the current session is used.
   *
   * @category Auth
   *
   * @remarks
   * - This method fetches the user object from the database instead of local session.
   * - This method is useful for checking if the user is authorized because it validates the user's access token JWT on the server.
   * - Should always be used when checking for user authorization on the server. On the client, you can instead use `getSession().session.user` for faster results. `getSession` is insecure on the server.
   *
   * @example Get the logged in user with the current existing session
   * ```js
   * const { data: { user } } = await supabase.auth.getUser()
   * ```
   *
   * @exampleResponse Get the logged in user with the current existing session
   * ```json
   * {
   *   "data": {
   *     "user": {
   *       "id": "11111111-1111-1111-1111-111111111111",
   *       "aud": "authenticated",
   *       "role": "authenticated",
   *       "email": "example@email.com",
   *       "email_confirmed_at": "2024-01-01T00:00:00Z",
   *       "phone": "",
   *       "confirmed_at": "2024-01-01T00:00:00Z",
   *       "last_sign_in_at": "2024-01-01T00:00:00Z",
   *       "app_metadata": {
   *         "provider": "email",
   *         "providers": [
   *           "email"
   *         ]
   *       },
   *       "user_metadata": {
   *         "email": "example@email.com",
   *         "email_verified": false,
   *         "phone_verified": false,
   *         "sub": "11111111-1111-1111-1111-111111111111"
   *       },
   *       "identities": [
   *         {
   *           "identity_id": "22222222-2222-2222-2222-222222222222",
   *           "id": "11111111-1111-1111-1111-111111111111",
   *           "user_id": "11111111-1111-1111-1111-111111111111",
   *           "identity_data": {
   *             "email": "example@email.com",
   *             "email_verified": false,
   *             "phone_verified": false,
   *             "sub": "11111111-1111-1111-1111-111111111111"
   *           },
   *           "provider": "email",
   *           "last_sign_in_at": "2024-01-01T00:00:00Z",
   *           "created_at": "2024-01-01T00:00:00Z",
   *           "updated_at": "2024-01-01T00:00:00Z",
   *           "email": "example@email.com"
   *         }
   *       ],
   *       "created_at": "2024-01-01T00:00:00Z",
   *       "updated_at": "2024-01-01T00:00:00Z",
   *       "is_anonymous": false
   *     }
   *   },
   *   "error": null
   * }
   * ```
   *
   * @example Get the logged in user with a custom access token jwt
   * ```js
   * const { data: { user } } = await supabase.auth.getUser(jwt)
   * ```
   */
  async getUser(e) {
    if (e)
      return await this._getUser(e);
    await this.initializePromise;
    let r;
    return this.lock != null ? r = await this._acquireLock(this.lockAcquireTimeout, async () => await this._getUser()) : r = await this._getUser(), r.data.user && (this.suppressGetSessionWarning = !0), r;
  }
  async _getUser(e) {
    try {
      return e ? await E(this.fetch, "GET", `${this.url}/user`, {
        headers: this.headers,
        jwt: e,
        xform: ve
      }) : await this._useSession(async (r) => {
        var s, n, i;
        const { data: a, error: l } = r;
        if (l)
          throw l;
        return !(!((s = a.session) === null || s === void 0) && s.access_token) && !this.hasCustomAuthorizationHeader ? { data: { user: null }, error: new z() } : await E(this.fetch, "GET", `${this.url}/user`, {
          headers: this.headers,
          jwt: (i = (n = a.session) === null || n === void 0 ? void 0 : n.access_token) !== null && i !== void 0 ? i : void 0,
          xform: ve
        });
      });
    } catch (r) {
      if (k(r))
        return pt(r) && await this._removeSession(), this._returnResult({ data: { user: null }, error: r });
      throw r;
    }
  }
  /**
   * Updates user data for a logged in user.
   *
   * @category Auth
   *
   * @remarks
   * - In order to use the `updateUser()` method, the user needs to be signed in first.
   * - By default, email updates sends a confirmation link to both the user's current and new email.
   * To only send a confirmation link to the user's new email, disable **Secure email change** in your project's [email auth provider settings](/dashboard/project/_/auth/providers).
   *
   * @exampleDescription Update the email for an authenticated user
   * Sends a "Confirm Email Change" email to the new address. If **Secure Email Change** is enabled (default), confirmation is also required from the **old email** before the change is applied. To skip dual confirmation and apply the change after only the new email is verified, disable **Secure Email Change** in the [Email Auth Provider settings](/dashboard/project/_/auth/providers?provider=Email).
   *
   * @example Update the email for an authenticated user
   * ```js
   * const { data, error } = await supabase.auth.updateUser({
   *   email: 'new@email.com'
   * })
   * ```
   *
   * @exampleResponse Update the email for an authenticated user
   * ```json
   * {
   *   "data": {
   *     "user": {
   *       "id": "11111111-1111-1111-1111-111111111111",
   *       "aud": "authenticated",
   *       "role": "authenticated",
   *       "email": "example@email.com",
   *       "email_confirmed_at": "2024-01-01T00:00:00Z",
   *       "phone": "",
   *       "confirmed_at": "2024-01-01T00:00:00Z",
   *       "new_email": "new@email.com",
   *       "email_change_sent_at": "2024-01-01T00:00:00Z",
   *       "last_sign_in_at": "2024-01-01T00:00:00Z",
   *       "app_metadata": {
   *         "provider": "email",
   *         "providers": [
   *           "email"
   *         ]
   *       },
   *       "user_metadata": {
   *         "email": "example@email.com",
   *         "email_verified": false,
   *         "phone_verified": false,
   *         "sub": "11111111-1111-1111-1111-111111111111"
   *       },
   *       "identities": [
   *         {
   *           "identity_id": "22222222-2222-2222-2222-222222222222",
   *           "id": "11111111-1111-1111-1111-111111111111",
   *           "user_id": "11111111-1111-1111-1111-111111111111",
   *           "identity_data": {
   *             "email": "example@email.com",
   *             "email_verified": false,
   *             "phone_verified": false,
   *             "sub": "11111111-1111-1111-1111-111111111111"
   *           },
   *           "provider": "email",
   *           "last_sign_in_at": "2024-01-01T00:00:00Z",
   *           "created_at": "2024-01-01T00:00:00Z",
   *           "updated_at": "2024-01-01T00:00:00Z",
   *           "email": "example@email.com"
   *         }
   *       ],
   *       "created_at": "2024-01-01T00:00:00Z",
   *       "updated_at": "2024-01-01T00:00:00Z",
   *       "is_anonymous": false
   *     }
   *   },
   *   "error": null
   * }
   * ```
   *
   * @exampleDescription Update the phone number for an authenticated user
   * Sends a one-time password (OTP) to the new phone number.
   *
   * @example Update the phone number for an authenticated user
   * ```js
   * const { data, error } = await supabase.auth.updateUser({
   *   phone: '123456789'
   * })
   * ```
   *
   * @example Update the password for an authenticated user
   * ```js
   * const { data, error } = await supabase.auth.updateUser({
   *   password: 'new password'
   * })
   * ```
   *
   * @exampleDescription Update the user's metadata
   * Updates the user's custom metadata.
   *
   * **Note**: The `data` field maps to the `auth.users.raw_user_meta_data` column in your Supabase database. When calling `getUser()`, the data will be available as `user.user_metadata`.
   *
   * @example Update the user's metadata
   * ```js
   * const { data, error } = await supabase.auth.updateUser({
   *   data: { hello: 'world' }
   * })
   * ```
   *
   * @exampleDescription Update the user's password with a nonce
   * If **Secure password change** is enabled in your [project's email provider settings](/dashboard/project/_/auth/providers), updating the user's password would require a nonce if the user **hasn't recently signed in**. The nonce is sent to the user's email or phone number. A user is deemed recently signed in if the session was created in the last 24 hours.
   *
   * @example Update the user's password with a nonce
   * ```js
   * const { data, error } = await supabase.auth.updateUser({
   *   password: 'new password',
   *   nonce: '123456'
   * })
   * ```
   */
  async updateUser(e, r = {}) {
    return await this.initializePromise, this.lock != null ? await this._acquireLock(this.lockAcquireTimeout, async () => await this._updateUser(e, r)) : await this._updateUser(e, r);
  }
  async _updateUser(e, r = {}) {
    let s = null;
    try {
      return await this._useSession(async (n) => {
        const { data: i, error: a } = n;
        if (a)
          throw a;
        if (!i.session)
          throw new z();
        const l = i.session;
        let h = null, o = null;
        this.flowType === "pkce" && e.email != null && ([h, o, s] = await this._getCodeChallengeAndMethod());
        const { data: c, error: u } = await E(this.fetch, "PUT", `${this.url}/user`, {
          headers: this.headers,
          redirectTo: this._maybeAppendFlowIdToRedirect(r?.emailRedirectTo, s),
          body: Object.assign(Object.assign({}, e), { code_challenge: h, code_challenge_method: o }),
          jwt: l.access_token,
          xform: ve
        });
        if (u)
          throw u;
        return l.user = c.user, await this._saveSession(l), await this._notifyAllSubscribers("USER_UPDATED", l), this._returnResult({ data: { user: l.user }, error: null });
      });
    } catch (n) {
      if (await ne(this.storage, this.storageKey, s), k(n))
        return this._returnResult({ data: { user: null }, error: n });
      throw n;
    }
  }
  /**
   * Sets the session data from the current session. If the current session is expired, setSession will take care of refreshing it to obtain a new session.
   * If the refresh token or access token in the current session is invalid, an error will be thrown.
   * @param currentSession The current session that minimally contains an access token and refresh token.
   *
   * @category Auth
   *
   * @remarks
   * - This method sets the session using an `access_token` and `refresh_token`.
   * - If successful, a `SIGNED_IN` event is emitted.
   *
   * @exampleDescription Set the session
   * Sets the session data from an access_token and refresh_token, then returns an auth response or error.
   *
   * @example Set the session
   * ```js
   *   const { data, error } = await supabase.auth.setSession({
   *     access_token,
   *     refresh_token
   *   })
   * ```
   *
   * @exampleResponse Set the session
   * ```json
   * {
   *   "data": {
   *     "user": {
   *       "id": "11111111-1111-1111-1111-111111111111",
   *       "aud": "authenticated",
   *       "role": "authenticated",
   *       "email": "example@email.com",
   *       "email_confirmed_at": "2024-01-01T00:00:00Z",
   *       "phone": "",
   *       "confirmed_at": "2024-01-01T00:00:00Z",
   *       "last_sign_in_at": "2024-01-01T00:00:00Z",
   *       "app_metadata": {
   *         "provider": "email",
   *         "providers": [
   *           "email"
   *         ]
   *       },
   *       "user_metadata": {
   *         "email": "example@email.com",
   *         "email_verified": false,
   *         "phone_verified": false,
   *         "sub": "11111111-1111-1111-1111-111111111111"
   *       },
   *       "identities": [
   *         {
   *           "identity_id": "22222222-2222-2222-2222-222222222222",
   *           "id": "11111111-1111-1111-1111-111111111111",
   *           "user_id": "11111111-1111-1111-1111-111111111111",
   *           "identity_data": {
   *             "email": "example@email.com",
   *             "email_verified": false,
   *             "phone_verified": false,
   *             "sub": "11111111-1111-1111-1111-111111111111"
   *           },
   *           "provider": "email",
   *           "last_sign_in_at": "2024-01-01T00:00:00Z",
   *           "created_at": "2024-01-01T00:00:00Z",
   *           "updated_at": "2024-01-01T00:00:00Z",
   *           "email": "example@email.com"
   *         }
   *       ],
   *       "created_at": "2024-01-01T00:00:00Z",
   *       "updated_at": "2024-01-01T00:00:00Z",
   *       "is_anonymous": false
   *     },
   *     "session": {
   *       "access_token": "<ACCESS_TOKEN>",
   *       "refresh_token": "<REFRESH_TOKEN>",
   *       "user": {
   *         "id": "11111111-1111-1111-1111-111111111111",
   *         "aud": "authenticated",
   *         "role": "authenticated",
   *         "email": "example@email.com",
   *         "email_confirmed_at": "2024-01-01T00:00:00Z",
   *         "phone": "",
   *         "confirmed_at": "2024-01-01T00:00:00Z",
   *         "last_sign_in_at": "11111111-1111-1111-1111-111111111111",
   *         "app_metadata": {
   *           "provider": "email",
   *           "providers": [
   *             "email"
   *           ]
   *         },
   *         "user_metadata": {
   *           "email": "example@email.com",
   *           "email_verified": false,
   *           "phone_verified": false,
   *           "sub": "11111111-1111-1111-1111-111111111111"
   *         },
   *         "identities": [
   *           {
   *             "identity_id": "2024-01-01T00:00:00Z",
   *             "id": "11111111-1111-1111-1111-111111111111",
   *             "user_id": "11111111-1111-1111-1111-111111111111",
   *             "identity_data": {
   *               "email": "example@email.com",
   *               "email_verified": false,
   *               "phone_verified": false,
   *               "sub": "11111111-1111-1111-1111-111111111111"
   *             },
   *             "provider": "email",
   *             "last_sign_in_at": "2024-01-01T00:00:00Z",
   *             "created_at": "2024-01-01T00:00:00Z",
   *             "updated_at": "2024-01-01T00:00:00Z",
   *             "email": "example@email.com"
   *           }
   *         ],
   *         "created_at": "2024-01-01T00:00:00Z",
   *         "updated_at": "2024-01-01T00:00:00Z",
   *         "is_anonymous": false
   *       },
   *       "token_type": "bearer",
   *       "expires_in": 3500,
   *       "expires_at": 1700000000
   *     }
   *   },
   *   "error": null
   * }
   * ```
   */
  async setSession(e) {
    return await this.initializePromise, this.lock != null ? await this._acquireLock(this.lockAcquireTimeout, async () => await this._setSession(e)) : await this._setSession(e);
  }
  async _setSession(e) {
    try {
      if (!e.access_token || !e.refresh_token)
        throw new z();
      const r = Date.now() / 1e3;
      let s = r, n = !0, i = null;
      const { payload: a } = _t(e.access_token);
      if (a.exp && (s = a.exp, n = s <= r), n) {
        const { data: l, error: h } = await this._callRefreshToken(e.refresh_token);
        if (h)
          return this._returnResult({ data: { user: null, session: null }, error: h });
        if (!l)
          return { data: { user: null, session: null }, error: null };
        i = l;
      } else {
        const { data: l, error: h } = await this._getUser(e.access_token);
        if (h)
          return this._returnResult({ data: { user: null, session: null }, error: h });
        i = {
          access_token: e.access_token,
          refresh_token: e.refresh_token,
          user: l.user,
          token_type: "bearer",
          expires_in: s - r,
          expires_at: s
        }, await this._saveSession(i), await this._notifyAllSubscribers("SIGNED_IN", i);
      }
      return this._returnResult({ data: { user: i.user, session: i }, error: null });
    } catch (r) {
      if (k(r))
        return this._returnResult({ data: { session: null, user: null }, error: r });
      throw r;
    }
  }
  /**
   * Returns a new session, regardless of expiry status.
   * Takes in an optional current session. If not passed in, then refreshSession() will attempt to retrieve it from getSession().
   * If the current session's refresh token is invalid, an error will be thrown.
   * @param currentSession The current session. If passed in, it must contain a refresh token.
   *
   * @category Auth
   *
   * @remarks
   * - This method will refresh and return a new session whether the current one is expired or not.
   *
   * @example Refresh session using the current session
   * ```js
   * const { data, error } = await supabase.auth.refreshSession()
   * const { session, user } = data
   * ```
   *
   * @exampleResponse Refresh session using the current session
   * ```json
   * {
   *   "data": {
   *     "user": {
   *       "id": "11111111-1111-1111-1111-111111111111",
   *       "aud": "authenticated",
   *       "role": "authenticated",
   *       "email": "example@email.com",
   *       "email_confirmed_at": "2024-01-01T00:00:00Z",
   *       "phone": "",
   *       "confirmed_at": "2024-01-01T00:00:00Z",
   *       "last_sign_in_at": "2024-01-01T00:00:00Z",
   *       "app_metadata": {
   *         "provider": "email",
   *         "providers": [
   *           "email"
   *         ]
   *       },
   *       "user_metadata": {
   *         "email": "example@email.com",
   *         "email_verified": false,
   *         "phone_verified": false,
   *         "sub": "11111111-1111-1111-1111-111111111111"
   *       },
   *       "identities": [
   *         {
   *           "identity_id": "22222222-2222-2222-2222-222222222222",
   *           "id": "11111111-1111-1111-1111-111111111111",
   *           "user_id": "11111111-1111-1111-1111-111111111111",
   *           "identity_data": {
   *             "email": "example@email.com",
   *             "email_verified": false,
   *             "phone_verified": false,
   *             "sub": "11111111-1111-1111-1111-111111111111"
   *           },
   *           "provider": "email",
   *           "last_sign_in_at": "2024-01-01T00:00:00Z",
   *           "created_at": "2024-01-01T00:00:00Z",
   *           "updated_at": "2024-01-01T00:00:00Z",
   *           "email": "example@email.com"
   *         }
   *       ],
   *       "created_at": "2024-01-01T00:00:00Z",
   *       "updated_at": "2024-01-01T00:00:00Z",
   *       "is_anonymous": false
   *     },
   *     "session": {
   *       "access_token": "<ACCESS_TOKEN>",
   *       "token_type": "bearer",
   *       "expires_in": 3600,
   *       "expires_at": 1700000000,
   *       "refresh_token": "<REFRESH_TOKEN>",
   *       "user": {
   *         "id": "11111111-1111-1111-1111-111111111111",
   *         "aud": "authenticated",
   *         "role": "authenticated",
   *         "email": "example@email.com",
   *         "email_confirmed_at": "2024-01-01T00:00:00Z",
   *         "phone": "",
   *         "confirmed_at": "2024-01-01T00:00:00Z",
   *         "last_sign_in_at": "2024-01-01T00:00:00Z",
   *         "app_metadata": {
   *           "provider": "email",
   *           "providers": [
   *             "email"
   *           ]
   *         },
   *         "user_metadata": {
   *           "email": "example@email.com",
   *           "email_verified": false,
   *           "phone_verified": false,
   *           "sub": "11111111-1111-1111-1111-111111111111"
   *         },
   *         "identities": [
   *           {
   *             "identity_id": "22222222-2222-2222-2222-222222222222",
   *             "id": "11111111-1111-1111-1111-111111111111",
   *             "user_id": "11111111-1111-1111-1111-111111111111",
   *             "identity_data": {
   *               "email": "example@email.com",
   *               "email_verified": false,
   *               "phone_verified": false,
   *               "sub": "11111111-1111-1111-1111-111111111111"
   *             },
   *             "provider": "email",
   *             "last_sign_in_at": "2024-01-01T00:00:00Z",
   *             "created_at": "2024-01-01T00:00:00Z",
   *             "updated_at": "2024-01-01T00:00:00Z",
   *             "email": "example@email.com"
   *           }
   *         ],
   *         "created_at": "2024-01-01T00:00:00Z",
   *         "updated_at": "2024-01-01T00:00:00Z",
   *         "is_anonymous": false
   *       }
   *     }
   *   },
   *   "error": null
   * }
   * ```
   *
   * @example Refresh session using a refresh token
   * ```js
   * const { data, error } = await supabase.auth.refreshSession({ refresh_token })
   * const { session, user } = data
   * ```
   */
  async refreshSession(e) {
    return await this.initializePromise, this.lock != null ? await this._acquireLock(this.lockAcquireTimeout, async () => await this._refreshSession(e)) : await this._refreshSession(e);
  }
  async _refreshSession(e) {
    try {
      return await this._useSession(async (r) => {
        var s;
        if (!e) {
          const { data: a, error: l } = r;
          if (l)
            throw l;
          e = (s = a.session) !== null && s !== void 0 ? s : void 0;
        }
        if (!e?.refresh_token)
          throw new z();
        const { data: n, error: i } = await this._callRefreshToken(e.refresh_token);
        return i ? this._returnResult({ data: { user: null, session: null }, error: i }) : n ? this._returnResult({ data: { user: n.user, session: n }, error: null }) : this._returnResult({ data: { user: null, session: null }, error: null });
      });
    } catch (r) {
      if (k(r))
        return this._returnResult({ data: { user: null, session: null }, error: r });
      throw r;
    }
  }
  /**
   * Gets the session data from a URL string
   */
  async _getSessionFromURL(e, r) {
    var s;
    try {
      if (!G())
        throw new mt("No browser detected.");
      if (e.error || e.error_description || e.error_code)
        throw new mt(e.error_description || "Error in URL with unspecified error_description", {
          error: e.error || "unspecified_error",
          code: e.error_code || "unspecified_code"
        });
      switch (r) {
        case "implicit":
          if (this.flowType === "pkce")
            throw new zr("Not a valid PKCE flow url.");
          break;
        case "pkce":
          if (this.flowType === "implicit")
            throw new mt("Not a valid implicit grant flow url.");
          break;
        default:
      }
      if (r === "pkce") {
        if (this._debug("#_initialize()", "begin", "is PKCE flow", !0), !e.code)
          throw new zr("No code detected.");
        const { data: w, error: v } = await this._exchangeCodeForSession(e.code, {
          flowId: e[Re]
        });
        if (v)
          throw v;
        const x = new URL(window.location.href);
        return x.searchParams.delete("code"), x.searchParams.delete(Re), window.history.replaceState(window.history.state, "", x.toString()), {
          data: { session: w.session, redirectType: (s = w.redirectType) !== null && s !== void 0 ? s : null },
          error: null
        };
      }
      const { provider_token: n, provider_refresh_token: i, access_token: a, refresh_token: l, expires_in: h, expires_at: o, token_type: c } = e;
      if (!a || !h || !l || !c)
        throw new mt("No session defined in URL");
      const u = Math.round(Date.now() / 1e3), d = parseInt(h);
      let f = u + d;
      o && (f = parseInt(o));
      const g = f - u;
      g * 1e3 <= me && console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${g}s, should have been closer to ${d}s`);
      const m = f - d;
      u - m >= 120 ? console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", m, f, u) : u - m < 0 && console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", m, f, u);
      const { data: p, error: y } = await this._getUser(a);
      if (y)
        throw y;
      const _ = {
        provider_token: n,
        provider_refresh_token: i,
        access_token: a,
        expires_in: d,
        expires_at: f,
        refresh_token: l,
        token_type: c,
        user: p.user
      };
      return window.location.hash = "", this._debug("#_getSessionFromURL()", "clearing window.location.hash"), this._returnResult({ data: { session: _, redirectType: e.type }, error: null });
    } catch (n) {
      if (k(n))
        return this._returnResult({ data: { session: null, redirectType: null }, error: n });
      throw n;
    }
  }
  /**
   * Checks if the current URL contains parameters given by an implicit oauth grant flow (https://www.rfc-editor.org/rfc/rfc6749.html#section-4.2)
   *
   * If `detectSessionInUrl` is a function, it will be called with the URL and params to determine
   * if the URL should be processed as a Supabase auth callback. This allows users to exclude
   * URLs from other OAuth providers (e.g., Facebook Login) that also return access_token in the fragment.
   */
  _isImplicitGrantCallback(e) {
    return typeof this.detectSessionInUrl == "function" ? this.detectSessionInUrl(new URL(window.location.href), e) : !!(e.access_token || e.error || e.error_description || e.error_code);
  }
  /**
   * Checks if the current URL and backing storage contain parameters given by a PKCE flow
   */
  async _isPKCECallback(e) {
    if (!e.code)
      return !1;
    const r = St(e[Re]);
    return r && await Y(this.storage, Ke(this.storageKey, r)) ? !0 : !!await Y(this.storage, `${this.storageKey}-code-verifier`);
  }
  /**
   * Inside a browser context, `signOut()` will remove the logged in user from the browser session and log them out - removing all items from localstorage and then trigger a `"SIGNED_OUT"` event.
   *
   * For server-side management, you can revoke all refresh tokens for a user by passing a user's JWT through to `auth.api.signOut(JWT: string)`.
   * There is no way to revoke a user's access token jwt until it expires. It is recommended to set a shorter expiry on the jwt for this reason.
   *
   * If using `others` scope, no `SIGNED_OUT` event is fired!
   *
   * **Warning:** the default `scope` is `'global'`. This signs the user out of
   * **every device they are currently signed in on**, not just the current
   * tab/session. If you only want to sign the user out of the current session
   * (the behavior most other auth libraries default to), pass
   * `{ scope: 'local' }` explicitly.
   *
   * @category Auth
   *
   * @remarks
   * - In order to use the `signOut()` method, the user needs to be signed in first.
   * - By default, `signOut()` uses the **global** scope, which signs out the user
   *   on every device they are signed in on (not just the current one). Pass
   *   `{ scope: 'local' }` to only sign out the current session. This is
   *   usually what apps want on a "Sign out" button, especially when users
   *   sign in from multiple devices and do not expect signing out of one to
   *   terminate the others.
   * - Since Supabase Auth uses JWTs for authentication, the access token JWT will be valid until it's expired. When the user signs out, Supabase revokes the refresh token and deletes the JWT from the client-side. This does not revoke the JWT and it will still be valid until it expires.
   *
   * @example Sign out of every device (global – default)
   * ```js
   * const { error } = await supabase.auth.signOut()
   * ```
   *
   * @example Sign out only the current session (recommended for most apps)
   * ```js
   * const { error } = await supabase.auth.signOut({ scope: 'local' })
   * ```
   *
   * @example Sign out of all other sessions, keep the current one
   * ```js
   * const { error } = await supabase.auth.signOut({ scope: 'others' })
   * ```
   */
  async signOut(e = { scope: "global" }) {
    return await this.initializePromise, this.lock != null ? await this._acquireLock(this.lockAcquireTimeout, async () => await this._signOut(e)) : await this._signOut(e);
  }
  async _signOut({ scope: e } = { scope: "global" }) {
    return await this._useSession(async (r) => {
      var s;
      const n = async () => {
        await this._removeSession();
      }, { data: i, error: a } = r;
      if (a && !pt(a))
        return this._returnResult({ error: a });
      const l = (s = i.session) === null || s === void 0 ? void 0 : s.access_token;
      if (l) {
        const { error: h } = await this.admin.signOut(l, e);
        if (h && !(Vr(h) && (h.status === 404 || h.status === 401 || h.status === 403) || pt(h)))
          return e !== "others" && await n(), this._returnResult({ error: h });
      }
      return e !== "others" && await n(), this._returnResult({ error: null });
    });
  }
  /**  *
   * @category Auth
   *
   * @remarks
   * - Subscribes to important events occurring on the user's session.
   * - Use on the frontend/client. It is less useful on the server.
   * - Events are emitted across tabs to keep your application's UI up-to-date. Some events can fire very frequently, based on the number of tabs open. Use a quick and efficient callback function, and defer or debounce as many operations as you can to be performed outside of the callback.
   * - Callbacks can be `async` and can safely call other Supabase auth methods (`getUser`, `setSession`, etc.) from inside the callback.
   * - Keep callbacks quick. Events are awaited in order, so a slow callback delays subsequent events to subscribers in this tab.
   * - Emitted events:
   *   - `INITIAL_SESSION`
   *     - Emitted right after the Supabase client is constructed and the initial session from storage is loaded.
   *   - `SIGNED_IN`
   *     - Emitted each time a user session is confirmed or re-established, including on user sign in and when refocusing a tab.
   *     - Avoid making assumptions as to when this event is fired, this may occur even when the user is already signed in. Instead, check the user object attached to the event to see if a new user has signed in and update your application's UI.
   *     - This event can fire very frequently depending on the number of tabs open in your application.
   *   - `SIGNED_OUT`
   *     - Emitted when the user signs out. This can be after:
   *       - A call to `supabase.auth.signOut()`.
   *       - After the user's session has expired for any reason:
   *         - User has signed out on another device.
   *         - The session has reached its timebox limit or inactivity timeout.
   *         - User has signed in on another device with single session per user enabled.
   *         - Check the [User Sessions](/docs/guides/auth/sessions) docs for more information.
   *     - Use this to clean up any local storage your application has associated with the user.
   *   - `TOKEN_REFRESHED`
   *     - Emitted each time a new access and refresh token are fetched for the signed in user.
   *     - It's best practice and highly recommended to extract the access token (JWT) and store it in memory for further use in your application.
   *       - Avoid frequent calls to `supabase.auth.getSession()` for the same purpose.
   *     - There is a background process that keeps track of when the session should be refreshed so you will always receive valid tokens by listening to this event.
   *     - The frequency of this event is related to the JWT expiry limit configured on your project.
   *   - `USER_UPDATED`
   *     - Emitted each time the `supabase.auth.updateUser()` method finishes successfully. Listen to it to update your application's UI based on new profile information.
   *   - `PASSWORD_RECOVERY`
   *     - Emitted instead of the `SIGNED_IN` event when the user lands on a page that includes a password recovery link in the URL.
   *     - Use it to show a UI to the user where they can [reset their password](/docs/guides/auth/passwords#resetting-a-users-password-forgot-password).
   *
   * @example Listen to auth changes
   * ```js
   * const { data } = supabase.auth.onAuthStateChange((event, session) => {
   *   console.log(event, session)
   *
   *   if (event === 'INITIAL_SESSION') {
   *     // handle initial session
   *   } else if (event === 'SIGNED_IN') {
   *     // handle sign in event
   *   } else if (event === 'SIGNED_OUT') {
   *     // handle sign out event
   *   } else if (event === 'PASSWORD_RECOVERY') {
   *     // handle password recovery event
   *   } else if (event === 'TOKEN_REFRESHED') {
   *     // handle token refreshed event
   *   } else if (event === 'USER_UPDATED') {
   *     // handle user updated event
   *   }
   * })
   *
   * // call unsubscribe to remove the callback
   * data.subscription.unsubscribe()
   * ```
   *
   * @exampleDescription Listen to sign out
   * Make sure you clear out any local data, such as local and session storage, after the client library has detected the user's sign out.
   *
   * @example Listen to sign out
   * ```js
   * supabase.auth.onAuthStateChange((event, session) => {
   *   if (event === 'SIGNED_OUT') {
   *     console.log('SIGNED_OUT', session)
   *
   *     // clear local and session storage
   *     [
   *       window.localStorage,
   *       window.sessionStorage,
   *     ].forEach((storage) => {
   *       Object.entries(storage)
   *         .forEach(([key]) => {
   *           storage.removeItem(key)
   *         })
   *     })
   *   }
   * })
   * ```
   *
   * @exampleDescription Store OAuth provider tokens on sign in
   * When using [OAuth (Social Login)](/docs/guides/auth/social-login) you sometimes wish to get access to the provider's access token and refresh token, in order to call provider APIs in the name of the user.
   *
   * For example, if you are using [Sign in with Google](/docs/guides/auth/social-login/auth-google) you may want to use the provider token to call Google APIs on behalf of the user. Supabase Auth does not keep track of the provider access and refresh token, but does return them for you once, immediately after sign in. You can use the `onAuthStateChange` method to listen for the presence of the provider tokens and store them in local storage. You can further send them to your server's APIs for use on the backend.
   *
   * Finally, make sure you remove them from local storage on the `SIGNED_OUT` event. If the OAuth provider supports token revocation, make sure you call those APIs either from the frontend or schedule them to be called on the backend.
   *
   * @example Store OAuth provider tokens on sign in
   * ```js
   * // Register this immediately after calling createClient!
   * // Because signInWithOAuth causes a redirect, you need to fetch the
   * // provider tokens from the callback.
   * supabase.auth.onAuthStateChange((event, session) => {
   *   if (session && session.provider_token) {
   *     window.localStorage.setItem('oauth_provider_token', session.provider_token)
   *   }
   *
   *   if (session && session.provider_refresh_token) {
   *     window.localStorage.setItem('oauth_provider_refresh_token', session.provider_refresh_token)
   *   }
   *
   *   if (event === 'SIGNED_OUT') {
   *     window.localStorage.removeItem('oauth_provider_token')
   *     window.localStorage.removeItem('oauth_provider_refresh_token')
   *   }
   * })
   * ```
   *
   * @exampleDescription Use React Context for the User's session
   * Instead of relying on `supabase.auth.getSession()` within your React components, you can use a [React Context](https://react.dev/reference/react/createContext) to store the latest session information from the `onAuthStateChange` callback and access it that way.
   *
   * @example Use React Context for the User's session
   * ```js
   * const SessionContext = React.createContext(null)
   *
   * function main() {
   *   const [session, setSession] = React.useState(null)
   *
   *   React.useEffect(() => {
   *     const {data: { subscription }} = supabase.auth.onAuthStateChange(
   *       (event, session) => {
   *         if (event === 'SIGNED_OUT') {
   *           setSession(null)
   *         } else if (session) {
   *           setSession(session)
   *         }
   *       })
   *
   *     return () => {
   *       subscription.unsubscribe()
   *     }
   *   }, [])
   *
   *   return (
   *     <SessionContext.Provider value={session}>
   *       <App />
   *     </SessionContext.Provider>
   *   )
   * }
   * ```
   *
   * @example Listen to password recovery events
   * ```js
   * supabase.auth.onAuthStateChange((event, session) => {
   *   if (event === 'PASSWORD_RECOVERY') {
   *     console.log('PASSWORD_RECOVERY', session)
   *     // show screen to update user's password
   *     showPasswordResetScreen(true)
   *   }
   * })
   * ```
   *
   * @example Listen to sign in
   * ```js
   * supabase.auth.onAuthStateChange((event, session) => {
   *   if (event === 'SIGNED_IN') console.log('SIGNED_IN', session)
   * })
   * ```
   *
   * @example Listen to token refresh
   * ```js
   * supabase.auth.onAuthStateChange((event, session) => {
   *   if (event === 'TOKEN_REFRESHED') console.log('TOKEN_REFRESHED', session)
   * })
   * ```
   *
   * @example Listen to user updates
   * ```js
   * supabase.auth.onAuthStateChange((event, session) => {
   *   if (event === 'USER_UPDATED') console.log('USER_UPDATED', session)
   * })
   * ```
   */
  onAuthStateChange(e) {
    const r = ya(), s = {
      id: r,
      callback: e,
      unsubscribe: () => {
        this._debug("#unsubscribe()", "state change callback with id removed", r), this.stateChangeEmitters.delete(r);
      }
    };
    return this._debug("#onAuthStateChange()", "registered callback with id", r), this.stateChangeEmitters.set(r, s), (async () => (await this.initializePromise, this.lock != null ? await this._acquireLock(this.lockAcquireTimeout, async () => {
      this._emitInitialSession(r);
    }) : await this._emitInitialSession(r)))(), { data: { subscription: s } };
  }
  async _emitInitialSession(e) {
    return await this._useSession(async (r) => {
      var s, n;
      try {
        const { data: { session: i }, error: a } = r;
        if (a)
          throw a;
        await ((s = this.stateChangeEmitters.get(e)) === null || s === void 0 ? void 0 : s.callback("INITIAL_SESSION", i)), this._debug("INITIAL_SESSION", "callback id", e, "session", i);
      } catch (i) {
        if (await ((n = this.stateChangeEmitters.get(e)) === null || n === void 0 ? void 0 : n.callback("INITIAL_SESSION", null)), this._debug("INITIAL_SESSION", "callback id", e, "error", i), Jr(i))
          return;
        pt(i) || yt(i) || Vr(i) && (i.code === "refresh_token_not_found" || i.code === "refresh_token_already_used" || i.code === "session_expired") ? console.warn(i) : console.error(i);
      }
    });
  }
  /**
   * Sends a password reset request to an email address. This method supports the PKCE flow.
   *
   * @param email The email address of the user.
   * @param options.redirectTo The URL to send the user to after they click the password reset link.
   * @param options.captchaToken Verification token received when the user completes the captcha on the site.
   *
   * @category Auth
   *
   * @remarks
   * - The password reset flow consist of 2 broad steps: (i) Allow the user to login via the password reset link; (ii) Update the user's password.
   * - The `resetPasswordForEmail()` only sends a password reset link to the user's email.
   * To update the user's password, see [`updateUser()`](/docs/reference/javascript/auth-updateuser).
   * - A `PASSWORD_RECOVERY` event will be emitted when the password recovery link is clicked.
   * You can use [`onAuthStateChange()`](/docs/reference/javascript/auth-onauthstatechange) to listen and invoke a callback function on these events.
   * - When the user clicks the reset link in the email they are redirected back to your application.
   * You can configure the URL that the user is redirected to with the `redirectTo` parameter.
   * See [redirect URLs and wildcards](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls) to add additional redirect URLs to your project.
   * - After the user has been redirected successfully, prompt them for a new password and call `updateUser()`:
   * ```js
   * const { data, error } = await supabase.auth.updateUser({
   *   password: new_password
   * })
   * ```
   *
   * @example Reset password
   * ```js
   * const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
   *   redirectTo: 'https://example.com/update-password',
   * })
   * ```
   *
   * @exampleResponse Reset password
   * ```json
   * {
   *   data: {}
   *   error: null
   * }
   * ```
   *
   * @example Reset password (React)
   * ```js
   * /**
   *  * Step 1: Send the user an email to get a password reset token.
   *  * This email contains a link which sends the user back to your application.
   *  *\/
   * const { data, error } = await supabase.auth
   *   .resetPasswordForEmail('user@email.com')
   *
   * /**
   *  * Step 2: Once the user is redirected back to your application,
   *  * ask the user to reset their password.
   *  *\/
   *  useEffect(() => {
   *    supabase.auth.onAuthStateChange(async (event, session) => {
   *      if (event == "PASSWORD_RECOVERY") {
   *        const newPassword = prompt("What would you like your new password to be?");
   *        const { data, error } = await supabase.auth
   *          .updateUser({ password: newPassword })
   *
   *        if (data) alert("Password updated successfully!")
   *        if (error) alert("There was an error updating your password.")
   *      }
   *    })
   *  }, [])
   * ```
   */
  async resetPasswordForEmail(e, r = {}) {
    let s = null, n = null, i = null;
    this.flowType === "pkce" && ([s, n, i] = await this._getCodeChallengeAndMethod(
      !0
      // isPasswordRecovery
    ));
    try {
      return await E(this.fetch, "POST", `${this.url}/recover`, {
        body: {
          email: e,
          code_challenge: s,
          code_challenge_method: n,
          gotrue_meta_security: { captcha_token: r.captchaToken }
        },
        headers: this.headers,
        redirectTo: this._maybeAppendFlowIdToRedirect(r.redirectTo, i)
      });
    } catch (a) {
      if (await ne(this.storage, this.storageKey, i), k(a))
        return this._returnResult({ data: null, error: a });
      throw a;
    }
  }
  /**
   * Gets all the identities linked to a user.
   *
   * @category Auth
   *
   * @remarks
   * - The user needs to be signed in to call `getUserIdentities()`.
   *
   * @example Returns a list of identities linked to the user
   * ```js
   * const { data, error } = await supabase.auth.getUserIdentities()
   * ```
   *
   * @exampleResponse Returns a list of identities linked to the user
   * ```json
   * {
   *   "data": {
   *     "identities": [
   *       {
   *         "identity_id": "22222222-2222-2222-2222-222222222222",
   *         "id": "2024-01-01T00:00:00Z",
   *         "user_id": "2024-01-01T00:00:00Z",
   *         "identity_data": {
   *           "email": "example@email.com",
   *           "email_verified": false,
   *           "phone_verified": false,
   *           "sub": "11111111-1111-1111-1111-111111111111"
   *         },
   *         "provider": "email",
   *         "last_sign_in_at": "2024-01-01T00:00:00Z",
   *         "created_at": "2024-01-01T00:00:00Z",
   *         "updated_at": "2024-01-01T00:00:00Z",
   *         "email": "example@email.com"
   *       }
   *     ]
   *   },
   *   "error": null
   * }
   * ```
   */
  async getUserIdentities() {
    var e;
    try {
      const { data: r, error: s } = await this.getUser();
      if (s)
        throw s;
      return this._returnResult({ data: { identities: (e = r.user.identities) !== null && e !== void 0 ? e : [] }, error: null });
    } catch (r) {
      if (k(r))
        return this._returnResult({ data: null, error: r });
      throw r;
    }
  }
  /**  *
   * @category Auth
   *
   * @remarks
   * - The **Enable Manual Linking** option must be enabled from your [project's authentication settings](/dashboard/project/_/auth/providers).
   * - The user needs to be signed in to call `linkIdentity()`.
   * - If the candidate identity is already linked to the existing user or another user, `linkIdentity()` will fail.
   * - If `linkIdentity` is run in the browser, the user is automatically redirected to the returned URL. On the server, you should handle the redirect.
   *
   * @example Link an identity to a user
   * ```js
   * const { data, error } = await supabase.auth.linkIdentity({
   *   provider: 'github'
   * })
   * ```
   *
   * @exampleResponse Link an identity to a user
   * ```json
   * {
   *   data: {
   *     provider: 'github',
   *     url: <PROVIDER_URL_TO_REDIRECT_TO>,
   *     flowId: <PKCE_FLOW_ID_OR_NULL>
   *   },
   *   error: null
   * }
   * ```
   */
  async linkIdentity(e) {
    return "token" in e ? this.linkIdentityIdToken(e) : this.linkIdentityOAuth(e);
  }
  async linkIdentityOAuth(e) {
    var r;
    let s = null;
    try {
      const { data: n, error: i } = await this._useSession(async (a) => {
        var l, h, o, c, u;
        const { data: d, error: f } = a;
        if (f)
          throw f;
        const { url: g, flowId: m } = await this._getUrlForProvider(`${this.url}/user/identities/authorize`, e.provider, {
          redirectTo: (l = e.options) === null || l === void 0 ? void 0 : l.redirectTo,
          scopes: (h = e.options) === null || h === void 0 ? void 0 : h.scopes,
          queryParams: (o = e.options) === null || o === void 0 ? void 0 : o.queryParams,
          skipBrowserRedirect: !0
        });
        return s = m, await E(this.fetch, "GET", g, {
          headers: this.headers,
          jwt: (u = (c = d.session) === null || c === void 0 ? void 0 : c.access_token) !== null && u !== void 0 ? u : void 0
        });
      });
      if (i)
        throw i;
      return G() && !(!((r = e.options) === null || r === void 0) && r.skipBrowserRedirect) && window.location.assign(n?.url), this._returnResult({
        data: { provider: e.provider, url: n?.url, flowId: s },
        error: null
      });
    } catch (n) {
      if (k(n))
        return this._returnResult({
          data: { provider: e.provider, url: null, flowId: s },
          error: n
        });
      throw n;
    }
  }
  async linkIdentityIdToken(e) {
    return await this._useSession(async (r) => {
      var s;
      try {
        const { error: n, data: { session: i } } = r;
        if (n)
          throw n;
        const { options: a, provider: l, token: h, access_token: o, nonce: c } = e, u = await E(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
          headers: this.headers,
          jwt: (s = i?.access_token) !== null && s !== void 0 ? s : void 0,
          body: {
            provider: l,
            id_token: h,
            access_token: o,
            nonce: c,
            link_identity: !0,
            gotrue_meta_security: { captcha_token: a?.captchaToken }
          },
          xform: se
        }), { data: d, error: f } = u;
        return f ? this._returnResult({ data: { user: null, session: null }, error: f }) : !d || !d.session || !d.user ? this._returnResult({
          data: { user: null, session: null },
          error: new $e()
        }) : (d.session && (await this._saveSession(d.session), await this._notifyAllSubscribers("USER_UPDATED", d.session)), this._returnResult({ data: d, error: f }));
      } catch (n) {
        if (await ne(this.storage, this.storageKey, null), k(n))
          return this._returnResult({ data: { user: null, session: null }, error: n });
        throw n;
      }
    });
  }
  /**
   * Unlinks an identity from a user by deleting it. The user will no longer be able to sign in with that identity once it's unlinked.
   *
   * @category Auth
   *
   * @remarks
   * - The **Enable Manual Linking** option must be enabled from your [project's authentication settings](/dashboard/project/_/auth/providers).
   * - The user needs to be signed in to call `unlinkIdentity()`.
   * - The user must have at least 2 identities in order to unlink an identity.
   * - The identity to be unlinked must belong to the user.
   *
   * @example Unlink an identity
   * ```js
   * // retrieve all identities linked to a user
   * const identities = await supabase.auth.getUserIdentities()
   *
   * // find the google identity
   * const googleIdentity = identities.find(
   *   identity => identity.provider === 'google'
   * )
   *
   * // unlink the google identity
   * const { error } = await supabase.auth.unlinkIdentity(googleIdentity)
   * ```
   */
  async unlinkIdentity(e) {
    try {
      return await this._useSession(async (r) => {
        var s, n;
        const { data: i, error: a } = r;
        if (a)
          throw a;
        return await E(this.fetch, "DELETE", `${this.url}/user/identities/${e.identity_id}`, {
          headers: this.headers,
          jwt: (n = (s = i.session) === null || s === void 0 ? void 0 : s.access_token) !== null && n !== void 0 ? n : void 0
        });
      });
    } catch (r) {
      if (k(r))
        return this._returnResult({ data: null, error: r });
      throw r;
    }
  }
  /**
   * Generates a new JWT.
   * @param refreshToken A valid refresh token that was returned on login.
   */
  async _refreshAccessToken(e) {
    const r = "#_refreshAccessToken()";
    this._debug(r, "begin");
    try {
      const s = Date.now();
      return await va(async (n) => (n > 0 && await wa(200 * Math.pow(2, n - 1)), this._debug(r, "refreshing attempt", n), await E(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, {
        body: { refresh_token: e },
        headers: this.headers,
        xform: se
      })), (n, i) => {
        const a = 200 * Math.pow(2, n);
        return i && yt(i) && // retryable only if the request can be sent before the backoff overflows the tick duration
        Date.now() + a - s < me;
      });
    } catch (s) {
      if (this._debug(r, "error", s), k(s))
        return this._returnResult({ data: { session: null, user: null }, error: s });
      throw s;
    } finally {
      this._debug(r, "end");
    }
  }
  _isValidSession(e) {
    return typeof e == "object" && e !== null && "access_token" in e && "refresh_token" in e && "expires_at" in e;
  }
  async _handleProviderSignIn(e, r) {
    const { url: s, flowId: n } = await this._getUrlForProvider(`${this.url}/authorize`, e, {
      redirectTo: r.redirectTo,
      scopes: r.scopes,
      queryParams: r.queryParams
    });
    return this._debug("#_handleProviderSignIn()", "provider", e, "options", r, "url", s), G() && !r.skipBrowserRedirect && window.location.assign(s), { data: { provider: e, url: s, flowId: n }, error: null };
  }
  /**
   * Recovers the session from LocalStorage and refreshes the token
   * Note: this method is async to accommodate for AsyncStorage e.g. in React native.
   */
  async _recoverAndRefresh() {
    var e, r;
    const s = "#_recoverAndRefresh()";
    this._debug(s, "begin");
    try {
      const n = await Y(this.storage, this.storageKey);
      if (n && this.userStorage) {
        let a = await Y(this.userStorage, this.storageKey + "-user");
        !this.storage.isServer && Object.is(this.storage, this.userStorage) && !a && (a = { user: n.user }, await ye(this.userStorage, this.storageKey + "-user", a)), n.user = (e = a?.user) !== null && e !== void 0 ? e : Qt();
      } else if (n && !n.user && !n.user) {
        const a = await Y(this.storage, this.storageKey + "-user");
        a && a?.user ? (n.user = a.user, await Z(this.storage, this.storageKey + "-user"), await ye(this.storage, this.storageKey, n)) : n.user = Qt();
      }
      if (this._debug(s, "session from storage", n), !this._isValidSession(n)) {
        this._debug(s, "session is not valid"), n !== null && await this._removeSession();
        return;
      }
      const i = ((r = n.expires_at) !== null && r !== void 0 ? r : 1 / 0) * 1e3 - Date.now() < Xt;
      if (this._debug(s, `session has${i ? "" : " not"} expired with margin of ${Xt}s`), i) {
        if (this.autoRefreshToken && n.refresh_token) {
          const { error: a } = await this._callRefreshToken(n.refresh_token);
          a && (Jr(a) ? this._debug(s, "refresh discarded by commit guard", a) : this._debug(s, "refresh failed", a));
        }
      } else if (n.user && n.user.__isUserNotAvailableProxy === !0)
        try {
          const { data: a, error: l } = await this._getUser(n.access_token);
          !l && a?.user ? (n.user = a.user, await this._saveSession(n), await this._notifyAllSubscribers("SIGNED_IN", n)) : this._debug(s, "could not get user data, skipping SIGNED_IN notification");
        } catch (a) {
          console.error("Error getting user data:", a), this._debug(s, "error getting user data, skipping SIGNED_IN notification", a);
        }
      else
        await this._notifyAllSubscribers("SIGNED_IN", n);
    } catch (n) {
      this._debug(s, "error", n), yt(n) ? console.warn(n) : console.error(n);
      return;
    } finally {
      this._debug(s, "end");
    }
  }
  async _callRefreshToken(e) {
    var r, s;
    if (!e)
      throw new z();
    if (this.refreshingDeferred)
      return this.refreshingDeferred.promise;
    if (this.lastRefreshFailure && this.lastRefreshFailure.refreshToken === e && Date.now() < this.lastRefreshFailure.expiresAt)
      return this._debug("#_callRefreshToken()", "returning cached failure (cooldown active)"), this.lastRefreshFailure.result;
    const n = "#_callRefreshToken()";
    this._debug(n, "begin");
    try {
      this.refreshingDeferred = new Gt(), this.refreshingDeferred.promise.then(void 0, () => {
      });
      const i = await Y(this.storage, this.storageKey), { data: a, error: l } = await this._refreshAccessToken(e);
      if (l)
        throw l;
      if (!a.session)
        throw new z();
      const h = await Y(this.storage, this.storageKey);
      if (i !== null && (h === null || h.refresh_token !== i.refresh_token)) {
        this._debug(n, "commit guard: storage changed since refresh started, discarding rotated tokens", {
          // Presence indicators only — never log refresh token fragments,
          // even partial. Logs may be forwarded to third-party services.
          startedWith: "present",
          nowHolds: h ? "replaced" : "cleared"
        });
        const d = {
          data: null,
          error: new Gr()
        };
        return this.refreshingDeferred.resolve(d), d;
      }
      const c = this._sessionRemovalEpoch;
      if (await this._saveSession(a.session), this._sessionRemovalEpoch !== c) {
        this._debug(n, "commit guard (post-save): _removeSession ran during _saveSession, undoing write"), await Z(this.storage, this.storageKey), this.userStorage && await Z(this.userStorage, this.storageKey + "-user");
        const d = {
          data: null,
          error: new Gr()
        };
        return this.refreshingDeferred.resolve(d), d;
      }
      await this._notifyAllSubscribers("TOKEN_REFRESHED", a.session);
      const u = { data: a.session, error: null };
      return this.lastRefreshFailure = null, this.refreshingDeferred.resolve(u), u;
    } catch (i) {
      if (this._debug(n, "error", i), k(i)) {
        const a = { data: null, error: i };
        if (!yt(i)) {
          const l = await Y(this.storage, this.storageKey);
          !!(l?.expires_at && l.expires_at * 1e3 > Date.now()) ? this._debug(n, "proactive refresh failed, access token still valid — preserving session") : await this._removeSession();
        }
        return this.lastRefreshFailure = {
          refreshToken: e,
          result: a,
          expiresAt: Date.now() + ra
        }, (r = this.refreshingDeferred) === null || r === void 0 || r.resolve(a), a;
      }
      throw (s = this.refreshingDeferred) === null || s === void 0 || s.reject(i), i;
    } finally {
      this.refreshingDeferred = null, this._debug(n, "end");
    }
  }
  async _notifyAllSubscribers(e, r, s = !0) {
    if (this._pendingInitNotifications !== null && s) {
      this._pendingInitNotifications.push({ event: e, session: r, broadcast: s });
      return;
    }
    const n = `#_notifyAllSubscribers(${e})`;
    this._debug(n, "begin", r, `broadcast = ${s}`);
    try {
      this.broadcastChannel && s && this.broadcastChannel.postMessage({ event: e, session: r });
      const i = [], a = Array.from(this.stateChangeEmitters.values()).map(async (l) => {
        try {
          await l.callback(e, r);
        } catch (h) {
          i.push(h);
        }
      });
      if (await Promise.all(a), i.length > 0) {
        for (let l = 0; l < i.length; l += 1)
          console.error(i[l]);
        throw i[0];
      }
    } finally {
      this._debug(n, "end");
    }
  }
  /**
   * set currentSession and currentUser
   * process to _startAutoRefreshToken if possible
   */
  async _saveSession(e) {
    this._debug("#_saveSession()", e), this.suppressGetSessionWarning = !0;
    const r = Object.assign({}, e), s = r.user && r.user.__isUserNotAvailableProxy === !0;
    if (this.userStorage) {
      !s && r.user && await ye(this.userStorage, this.storageKey + "-user", {
        user: r.user
      });
      const n = Object.assign({}, r);
      delete n.user;
      const i = ts(n);
      await ye(this.storage, this.storageKey, i);
    } else {
      const n = ts(r);
      await ye(this.storage, this.storageKey, n);
    }
  }
  async _removeSession() {
    this._sessionRemovalEpoch += 1, this._debug("#_removeSession()"), this.lastRefreshFailure = null, this.suppressGetSessionWarning = !1, await Z(this.storage, this.storageKey), await Ra(this.storage, this.storageKey), await Z(this.storage, this.storageKey + "-user"), this.userStorage && await Z(this.userStorage, this.storageKey + "-user"), await this._notifyAllSubscribers("SIGNED_OUT", null);
  }
  /**
   * Removes any registered visibilitychange callback.
   *
   * {@link GoTrueClient.startAutoRefresh}
   * {@link GoTrueClient.stopAutoRefresh}
   */
  _removeVisibilityChangedCallback() {
    this._debug("#_removeVisibilityChangedCallback()");
    const e = this.visibilityChangedCallback;
    this.visibilityChangedCallback = null;
    try {
      e && G() && window?.removeEventListener && window.removeEventListener("visibilitychange", e);
    } catch (r) {
      console.error("removing visibilitychange callback failed", r);
    }
  }
  /**
   * This is the private implementation of {@link GoTrueClient.startAutoRefresh}. Use this
   * within the library.
   */
  async _startAutoRefresh() {
    await this._stopAutoRefresh(), this._debug("#_startAutoRefresh()");
    const e = setInterval(() => this._autoRefreshTokenTick(), me);
    this.autoRefreshTicker = e, e && typeof e == "object" && typeof e.unref == "function" ? e.unref() : typeof Deno < "u" && typeof Deno.unrefTimer == "function" && Deno.unrefTimer(e);
    const r = setTimeout(async () => {
      await this.initializePromise, await this._autoRefreshTokenTick();
    }, 0);
    this.autoRefreshTickTimeout = r, r && typeof r == "object" && typeof r.unref == "function" ? r.unref() : typeof Deno < "u" && typeof Deno.unrefTimer == "function" && Deno.unrefTimer(r);
  }
  /**
   * This is the private implementation of {@link GoTrueClient.stopAutoRefresh}. Use this
   * within the library.
   */
  async _stopAutoRefresh() {
    this._debug("#_stopAutoRefresh()");
    const e = this.autoRefreshTicker;
    this.autoRefreshTicker = null, e && clearInterval(e);
    const r = this.autoRefreshTickTimeout;
    this.autoRefreshTickTimeout = null, r && clearTimeout(r);
  }
  /**
   * Starts an auto-refresh process in the background. The session is checked
   * every few seconds. Close to the time of expiration a process is started to
   * refresh the session. If refreshing fails it will be retried for as long as
   * necessary.
   *
   * If you set the {@link GoTrueClientOptions#autoRefreshToken} you don't need
   * to call this function, it will be called for you.
   *
   * On browsers the refresh process works only when the tab/window is in the
   * foreground to conserve resources as well as prevent race conditions and
   * flooding auth with requests. If you call this method any managed
   * visibility change callback will be removed and you must manage visibility
   * changes on your own.
   *
   * On non-browser platforms the refresh process works *continuously* in the
   * background, which may not be desirable. You should hook into your
   * platform's foreground indication mechanism and call these methods
   * appropriately to conserve resources.
   *
   * {@link GoTrueClient.stopAutoRefresh}
   *
   * @category Auth
   *
   * @remarks
   * - Only useful in non-browser environments such as React Native or Electron.
   * - The Supabase Auth library automatically starts and stops proactively refreshing the session when a tab is focused or not.
   * - On non-browser platforms, such as mobile or desktop apps built with web technologies, the library is not able to effectively determine whether the application is _focused_ or not.
   * - To give this hint to the application, you should be calling this method when the app is in focus and calling `supabase.auth.stopAutoRefresh()` when it's out of focus.
   *
   * @example Start and stop auto refresh in React Native
   * ```js
   * import { AppState } from 'react-native'
   *
   * // make sure you register this only once!
   * AppState.addEventListener('change', (state) => {
   *   if (state === 'active') {
   *     supabase.auth.startAutoRefresh()
   *   } else {
   *     supabase.auth.stopAutoRefresh()
   *   }
   * })
   * ```
   */
  async startAutoRefresh() {
    this._removeVisibilityChangedCallback(), await this._startAutoRefresh();
  }
  /**
   * Stops an active auto refresh process running in the background (if any).
   *
   * If you call this method any managed visibility change callback will be
   * removed and you must manage visibility changes on your own.
   *
   * See {@link GoTrueClient.startAutoRefresh} for more details.
   *
   * @category Auth
   *
   * @remarks
   * - Only useful in non-browser environments such as React Native or Electron.
   * - The Supabase Auth library automatically starts and stops proactively refreshing the session when a tab is focused or not.
   * - On non-browser platforms, such as mobile or desktop apps built with web technologies, the library is not able to effectively determine whether the application is _focused_ or not.
   * - When your application goes in the background or out of focus, call this method to stop the proactive refreshing of the session.
   *
   * @example Start and stop auto refresh in React Native
   * ```js
   * import { AppState } from 'react-native'
   *
   * // make sure you register this only once!
   * AppState.addEventListener('change', (state) => {
   *   if (state === 'active') {
   *     supabase.auth.startAutoRefresh()
   *   } else {
   *     supabase.auth.stopAutoRefresh()
   *   }
   * })
   * ```
   */
  async stopAutoRefresh() {
    this._removeVisibilityChangedCallback(), await this._stopAutoRefresh();
  }
  /**
   * Tears down the client's background work: stops the auto-refresh interval,
   * removes the `visibilitychange` listener, closes the cross-tab
   * `BroadcastChannel`, and clears registered `onAuthStateChange` subscribers.
   *
   * Call this from cleanup hooks when the client is being replaced before
   * its JS realm is destroyed. React Strict Mode and HMR are the common
   * cases. Any in-flight `fetch` calls continue to completion and may still
   * write to storage; dispose doesn't abort them or erase storage.
   *
   * Lifecycle caveat: because in-flight refreshes are not aborted, a
   * disposed instance can still persist a rotated session to storage after
   * `dispose()` returns. A subsequent `createClient` against the same
   * `storageKey` will pick up that session on its next read. If you need
   * strict isolation between client lifecycles, await any pending auth
   * operation before calling `dispose()` (or change the `storageKey` for
   * the replacement client).
   *
   * Safe to call repeatedly.
   *
   * @category Auth
   *
   * @example Cleanup on React unmount
   * ```ts
   * useEffect(() => {
   *   const client = createClient(...)
   *   return () => { client.auth.dispose() }
   * }, [])
   * ```
   */
  async dispose() {
    var e;
    this._removeVisibilityChangedCallback(), await this._stopAutoRefresh(), (e = this.broadcastChannel) === null || e === void 0 || e.close(), this.broadcastChannel = null, this.stateChangeEmitters.clear();
  }
  /**
   * Runs the auto refresh token tick.
   */
  async _autoRefreshTokenTick() {
    if (this._debug("#_autoRefreshTokenTick()", "begin"), this.lock != null) {
      try {
        await this._acquireLock(0, async () => {
          try {
            const e = Date.now();
            try {
              return await this._useSession(async (r) => {
                const { data: { session: s } } = r;
                if (!s || !s.refresh_token || !s.expires_at) {
                  this._debug("#_autoRefreshTokenTick()", "no session");
                  return;
                }
                const n = Math.floor((s.expires_at * 1e3 - e) / me);
                this._debug("#_autoRefreshTokenTick()", `access token expires in ${n} ticks, a tick lasts ${me}ms, refresh threshold is ${Qe} ticks`), n <= Qe && await this._callRefreshToken(s.refresh_token);
              });
            } catch (r) {
              console.error("Auto refresh tick failed with error. This is likely a transient error.", r);
            }
          } finally {
            this._debug("#_autoRefreshTokenTick()", "end");
          }
        });
      } catch (e) {
        if (e instanceof qa)
          this._debug("auto refresh token tick lock not available");
        else
          throw e;
      }
      return;
    }
    if (this.refreshingDeferred !== null) {
      this._debug("#_autoRefreshTokenTick()", "refresh already in flight, skipping");
      return;
    }
    try {
      const e = Date.now();
      try {
        await this._useSession(async (r) => {
          const { data: { session: s } } = r;
          if (!s || !s.refresh_token || !s.expires_at) {
            this._debug("#_autoRefreshTokenTick()", "no session");
            return;
          }
          const n = Math.floor((s.expires_at * 1e3 - e) / me);
          this._debug("#_autoRefreshTokenTick()", `access token expires in ${n} ticks, a tick lasts ${me}ms, refresh threshold is ${Qe} ticks`), n <= Qe && await this._callRefreshToken(s.refresh_token);
        });
      } catch (r) {
        console.error("Auto refresh tick failed with error. This is likely a transient error.", r);
      }
    } finally {
      this._debug("#_autoRefreshTokenTick()", "end");
    }
  }
  /**
   * Registers callbacks on the browser / platform, which in-turn run
   * algorithms when the browser window/tab are in foreground. On non-browser
   * platforms it assumes always foreground.
   */
  async _handleVisibilityChange() {
    if (this._debug("#_handleVisibilityChange()"), !G() || !window?.addEventListener)
      return this.autoRefreshToken && this.startAutoRefresh(), !1;
    try {
      this.visibilityChangedCallback = async () => {
        try {
          await this._onVisibilityChanged(!1);
        } catch (e) {
          this._debug("#visibilityChangedCallback", "error", e);
        }
      }, window?.addEventListener("visibilitychange", this.visibilityChangedCallback), await this._onVisibilityChanged(!0);
    } catch (e) {
      console.error("_handleVisibilityChange", e);
    }
  }
  /**
   * Callback registered with `window.addEventListener('visibilitychange')`.
   */
  async _onVisibilityChanged(e) {
    const r = `#_onVisibilityChanged(${e})`;
    if (this._debug(r, "visibilityState", document.visibilityState), document.visibilityState === "visible") {
      if (this.autoRefreshToken && this._startAutoRefresh(), !e)
        if (await this.initializePromise, this.lock != null)
          await this._acquireLock(this.lockAcquireTimeout, async () => {
            if (document.visibilityState !== "visible") {
              this._debug(r, "acquired the lock to recover the session, but the browser visibilityState is no longer visible, aborting");
              return;
            }
            await this._recoverAndRefresh();
          });
        else {
          if (document.visibilityState !== "visible") {
            this._debug(r, "visibilityState is no longer visible, skipping recovery");
            return;
          }
          await this._recoverAndRefresh();
        }
    } else document.visibilityState === "hidden" && this.autoRefreshToken && this._stopAutoRefresh();
  }
  /**
   * Generates the relevant login URL for a third-party provider.
   * @param options.redirectTo A URL or mobile address to send the user to after they are confirmed.
   * @param options.scopes A space-separated list of scopes granted to the OAuth application.
   * @param options.queryParams An object of key-value pairs containing query parameters granted to the OAuth application.
   */
  async _getUrlForProvider(e, r, s) {
    let n = s?.redirectTo, i = null, a = null, l = null;
    this.flowType === "pkce" && ([i, a, l] = await this._getCodeChallengeAndMethod(), n = this._maybeAppendFlowIdToRedirect(n, l));
    const h = [`provider=${encodeURIComponent(r)}`];
    if (n && h.push(`redirect_to=${encodeURIComponent(n)}`), s?.scopes && h.push(`scopes=${encodeURIComponent(s.scopes)}`), i != null && a != null) {
      const o = new URLSearchParams({
        code_challenge: `${encodeURIComponent(i)}`,
        code_challenge_method: `${encodeURIComponent(a)}`
      });
      h.push(o.toString());
    }
    if (s?.queryParams) {
      const o = new URLSearchParams(s.queryParams);
      h.push(o.toString());
    }
    return s?.skipBrowserRedirect && h.push(`skip_http_redirect=${s.skipBrowserRedirect}`), { url: `${e}?${h.join("&")}`, flowId: l };
  }
  /**
   * Appends the reserved flow id parameter to a redirect URL so the callback
   * can be matched to the verifier stored for its flow. Opt-in via
   * `experimental.appendPkceFlowIdToRedirects`: redirect URLs are validated
   * against the project's allow list including the query string, so an extra
   * parameter can stop exact (non-wildcard) entries from matching.
   */
  _maybeAppendFlowIdToRedirect(e, r) {
    return !e || !r || !this.experimental.appendPkceFlowIdToRedirects ? e ?? void 0 : Oa(e, r);
  }
  /**
   * Generates and stores a PKCE challenge/verifier pair for a new flow,
   * logging any pending verifier the bounded slot ring evicts.
   */
  async _getCodeChallengeAndMethod(e = !1) {
    return Ma(this.storage, this.storageKey, e, (r) => this._debug("#_getCodeChallengeAndMethod()", "evicted oldest pending PKCE verifier slot", r));
  }
  async _unenroll(e) {
    try {
      return await this._useSession(async (r) => {
        var s;
        const { data: n, error: i } = r;
        return i ? this._returnResult({ data: null, error: i }) : await E(this.fetch, "DELETE", `${this.url}/factors/${e.factorId}`, {
          headers: this.headers,
          jwt: (s = n?.session) === null || s === void 0 ? void 0 : s.access_token
        });
      });
    } catch (r) {
      if (k(r))
        return this._returnResult({ data: null, error: r });
      throw r;
    }
  }
  async _enroll(e) {
    try {
      return await this._useSession(async (r) => {
        var s, n;
        const { data: i, error: a } = r;
        if (a)
          return this._returnResult({ data: null, error: a });
        const l = Object.assign({ friendly_name: e.friendlyName, factor_type: e.factorType }, e.factorType === "phone" ? { phone: e.phone } : e.factorType === "totp" ? { issuer: e.issuer } : {}), { data: h, error: o } = await E(this.fetch, "POST", `${this.url}/factors`, {
          body: l,
          headers: this.headers,
          jwt: (s = i?.session) === null || s === void 0 ? void 0 : s.access_token
        });
        return o ? this._returnResult({ data: null, error: o }) : (e.factorType === "totp" && h.type === "totp" && (!((n = h?.totp) === null || n === void 0) && n.qr_code) && (h.totp.qr_code = `data:image/svg+xml;utf-8,${h.totp.qr_code}`), this._returnResult({ data: h, error: null }));
      });
    } catch (r) {
      if (k(r))
        return this._returnResult({ data: null, error: r });
      throw r;
    }
  }
  async _verify(e) {
    const r = async () => {
      try {
        return await this._useSession(async (s) => {
          var n;
          const { data: i, error: a } = s;
          if (a)
            return this._returnResult({ data: null, error: a });
          const l = Object.assign({ challenge_id: e.challengeId }, "webauthn" in e ? {
            webauthn: Object.assign(Object.assign({}, e.webauthn), { credential_response: e.webauthn.type === "create" ? cs(e.webauthn.credential_response) : hs(e.webauthn.credential_response) })
          } : { code: e.code }), { data: h, error: o } = await E(this.fetch, "POST", `${this.url}/factors/${e.factorId}/verify`, {
            body: l,
            headers: this.headers,
            jwt: (n = i?.session) === null || n === void 0 ? void 0 : n.access_token
          });
          return o ? this._returnResult({ data: null, error: o }) : (await this._saveSession(Object.assign({ expires_at: Math.round(Date.now() / 1e3) + h.expires_in }, h)), await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", h), this._returnResult({ data: h, error: o }));
        });
      } catch (s) {
        if (k(s))
          return this._returnResult({ data: null, error: s });
        throw s;
      }
    };
    return this.lock != null ? this._acquireLock(this.lockAcquireTimeout, r) : r();
  }
  async _challenge(e) {
    const r = async () => {
      try {
        return await this._useSession(async (s) => {
          var n;
          const { data: i, error: a } = s;
          if (a)
            return this._returnResult({ data: null, error: a });
          const l = await E(this.fetch, "POST", `${this.url}/factors/${e.factorId}/challenge`, {
            body: e,
            headers: this.headers,
            jwt: (n = i?.session) === null || n === void 0 ? void 0 : n.access_token
          });
          if (l.error)
            return l;
          const { data: h } = l;
          if (h.type !== "webauthn")
            return { data: h, error: null };
          switch (h.webauthn.type) {
            case "create":
              return {
                data: Object.assign(Object.assign({}, h), { webauthn: Object.assign(Object.assign({}, h.webauthn), { credential_options: Object.assign(Object.assign({}, h.webauthn.credential_options), { publicKey: os(h.webauthn.credential_options.publicKey) }) }) }),
                error: null
              };
            case "request":
              return {
                data: Object.assign(Object.assign({}, h), { webauthn: Object.assign(Object.assign({}, h.webauthn), { credential_options: Object.assign(Object.assign({}, h.webauthn.credential_options), { publicKey: ls(h.webauthn.credential_options.publicKey) }) }) }),
                error: null
              };
          }
        });
      } catch (s) {
        if (k(s))
          return this._returnResult({ data: null, error: s });
        throw s;
      }
    };
    return this.lock != null ? this._acquireLock(this.lockAcquireTimeout, r) : r();
  }
  /**
   * {@link GoTrueMFAApi#challengeAndVerify}
   */
  async _challengeAndVerify(e) {
    const { data: r, error: s } = await this._challenge({
      factorId: e.factorId
    });
    return s ? this._returnResult({ data: null, error: s }) : await this._verify({
      factorId: e.factorId,
      challengeId: r.id,
      code: e.code
    });
  }
  /**
   * {@link GoTrueMFAApi#listFactors}
   */
  async _listFactors() {
    var e;
    const { data: { user: r }, error: s } = await this.getUser();
    if (s)
      return { data: null, error: s };
    const n = {
      all: [],
      phone: [],
      totp: [],
      webauthn: [],
      recovery_code: []
    };
    for (const i of (e = r?.factors) !== null && e !== void 0 ? e : [])
      n.all.push(i), i.status === "verified" && i.factor_type in n && Array.isArray(n[i.factor_type]) && n[i.factor_type].push(i);
    return {
      data: n,
      error: null
    };
  }
  /**
   * {@link GoTrueMFAApi#getAuthenticatorAssuranceLevel}
   */
  async _getAuthenticatorAssuranceLevel(e) {
    var r, s, n, i;
    if (e)
      try {
        const { payload: f } = _t(e);
        let g = null;
        f.aal && (g = f.aal);
        let m = g;
        const { data: { user: p }, error: y } = await this.getUser(e);
        if (y)
          return this._returnResult({ data: null, error: y });
        ((s = (r = p?.factors) === null || r === void 0 ? void 0 : r.filter((v) => v.status === "verified")) !== null && s !== void 0 ? s : []).length > 0 && (m = "aal2");
        const w = f.amr || [];
        return { data: { currentLevel: g, nextLevel: m, currentAuthenticationMethods: w }, error: null };
      } catch (f) {
        if (k(f))
          return this._returnResult({ data: null, error: f });
        throw f;
      }
    const { data: { session: a }, error: l } = await this.getSession();
    if (l)
      return this._returnResult({ data: null, error: l });
    if (!a)
      return {
        data: { currentLevel: null, nextLevel: null, currentAuthenticationMethods: [] },
        error: null
      };
    const { payload: h } = _t(a.access_token);
    let o = null;
    h.aal && (o = h.aal);
    let c = o;
    ((i = (n = a.user.factors) === null || n === void 0 ? void 0 : n.filter((f) => f.status === "verified")) !== null && i !== void 0 ? i : []).length > 0 && (c = "aal2");
    const d = h.amr || [];
    return { data: { currentLevel: o, nextLevel: c, currentAuthenticationMethods: d }, error: null };
  }
  /**
   * {@link AuthMFARecoveryCodesApi#getStatus}
   */
  async _getRecoveryCodesStatus() {
    Je(this.experimental);
    try {
      return await this._useSession(async (e) => {
        var r;
        const { data: s, error: n } = e;
        if (n)
          return this._returnResult({ data: null, error: n });
        const { data: i, error: a } = await E(this.fetch, "GET", `${this.url}/factors/recovery-codes`, {
          headers: this.headers,
          jwt: (r = s?.session) === null || r === void 0 ? void 0 : r.access_token
        });
        return a ? this._returnResult({ data: null, error: a }) : this._returnResult({ data: i, error: null });
      });
    } catch (e) {
      if (k(e))
        return this._returnResult({ data: null, error: e });
      throw e;
    }
  }
  /**
   * {@link AuthMFARecoveryCodesApi#generate}
   */
  async _generateRecoveryCodes(e) {
    Je(this.experimental);
    try {
      return await this._useSession(async (r) => {
        var s;
        const { data: n, error: i } = r;
        if (i)
          return this._returnResult({ data: null, error: i });
        const { data: a, error: l } = await E(this.fetch, "POST", `${this.url}/factors/recovery-codes`, {
          // The body is optional server-side; only send one when a name was given.
          body: e?.friendlyName ? { friendly_name: e.friendlyName } : void 0,
          headers: this.headers,
          jwt: (s = n?.session) === null || s === void 0 ? void 0 : s.access_token
        });
        return l ? this._returnResult({ data: null, error: l }) : this._returnResult({ data: a, error: null });
      });
    } catch (r) {
      if (k(r))
        return this._returnResult({ data: null, error: r });
      throw r;
    }
  }
  /**
   * {@link AuthMFARecoveryCodesApi#verify}
   */
  async _verifyRecoveryCode(e) {
    Je(this.experimental);
    const r = async () => {
      try {
        return await this._useSession(async (s) => {
          var n;
          const { data: i, error: a } = s;
          if (a)
            return this._returnResult({ data: null, error: a });
          const { data: l, error: h } = await E(this.fetch, "POST", `${this.url}/factors/recovery-codes/verify`, {
            body: { code: e.code },
            headers: this.headers,
            jwt: (n = i?.session) === null || n === void 0 ? void 0 : n.access_token
          });
          if (h)
            return this._returnResult({ data: null, error: h });
          const o = Object.assign({ expires_at: Gs(l.expires_in) }, l);
          return await this._saveSession(o), await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", o), this._returnResult({ data: l, error: null });
        });
      } catch (s) {
        if (k(s))
          return this._returnResult({ data: null, error: s });
        throw s;
      }
    };
    return this.lock != null ? this._acquireLock(this.lockAcquireTimeout, r) : r();
  }
  /**
   * {@link AuthMFARecoveryCodesApi#regenerate}
   */
  async _regenerateRecoveryCodes() {
    Je(this.experimental);
    try {
      return await this._useSession(async (e) => {
        var r;
        const { data: s, error: n } = e;
        if (n)
          return this._returnResult({ data: null, error: n });
        const { data: i, error: a } = await E(this.fetch, "POST", `${this.url}/factors/recovery-codes/regenerate`, {
          headers: this.headers,
          jwt: (r = s?.session) === null || r === void 0 ? void 0 : r.access_token
        });
        return a ? this._returnResult({ data: null, error: a }) : this._returnResult({ data: i, error: null });
      });
    } catch (e) {
      if (k(e))
        return this._returnResult({ data: null, error: e });
      throw e;
    }
  }
  /**
   * {@link AuthMFARecoveryCodesApi#unenroll}
   */
  async _unenrollRecoveryCodes() {
    Je(this.experimental);
    try {
      return await this._useSession(async (e) => {
        var r;
        const { data: s, error: n } = e;
        if (n)
          return this._returnResult({ data: null, error: n });
        const { data: i, error: a } = await E(this.fetch, "DELETE", `${this.url}/factors/recovery-codes`, {
          headers: this.headers,
          jwt: (r = s?.session) === null || r === void 0 ? void 0 : r.access_token
        });
        return a ? this._returnResult({ data: null, error: a }) : this._returnResult({ data: i, error: null });
      });
    } catch (e) {
      if (k(e))
        return this._returnResult({ data: null, error: e });
      throw e;
    }
  }
  /**
   * Retrieves details about an OAuth authorization request.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   *
   * Returns authorization details including client info, scopes, and user information.
   * If the response includes only a redirect_url field, it means consent was already given - the caller
   * should handle the redirect manually if needed.
   */
  async _getAuthorizationDetails(e) {
    try {
      return await this._useSession(async (r) => {
        const { data: { session: s }, error: n } = r;
        return n ? this._returnResult({ data: null, error: n }) : s ? await E(this.fetch, "GET", `${this.url}/oauth/authorizations/${e}`, {
          headers: this.headers,
          jwt: s.access_token,
          xform: (i) => ({ data: i, error: null })
        }) : this._returnResult({ data: null, error: new z() });
      });
    } catch (r) {
      if (k(r))
        return this._returnResult({ data: null, error: r });
      throw r;
    }
  }
  /**
   * Approves an OAuth authorization request.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   */
  async _approveAuthorization(e, r) {
    try {
      return await this._useSession(async (s) => {
        const { data: { session: n }, error: i } = s;
        if (i)
          return this._returnResult({ data: null, error: i });
        if (!n)
          return this._returnResult({ data: null, error: new z() });
        const a = await E(this.fetch, "POST", `${this.url}/oauth/authorizations/${e}/consent`, {
          headers: this.headers,
          jwt: n.access_token,
          body: { action: "approve" },
          xform: (l) => ({ data: l, error: null })
        });
        return a.data && a.data.redirect_url && G() && !r?.skipBrowserRedirect && window.location.assign(a.data.redirect_url), a;
      });
    } catch (s) {
      if (k(s))
        return this._returnResult({ data: null, error: s });
      throw s;
    }
  }
  /**
   * Denies an OAuth authorization request.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   */
  async _denyAuthorization(e, r) {
    try {
      return await this._useSession(async (s) => {
        const { data: { session: n }, error: i } = s;
        if (i)
          return this._returnResult({ data: null, error: i });
        if (!n)
          return this._returnResult({ data: null, error: new z() });
        const a = await E(this.fetch, "POST", `${this.url}/oauth/authorizations/${e}/consent`, {
          headers: this.headers,
          jwt: n.access_token,
          body: { action: "deny" },
          xform: (l) => ({ data: l, error: null })
        });
        return a.data && a.data.redirect_url && G() && !r?.skipBrowserRedirect && window.location.assign(a.data.redirect_url), a;
      });
    } catch (s) {
      if (k(s))
        return this._returnResult({ data: null, error: s });
      throw s;
    }
  }
  /**
   * Lists all OAuth grants that the authenticated user has authorized.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   */
  async _listOAuthGrants() {
    try {
      return await this._useSession(async (e) => {
        const { data: { session: r }, error: s } = e;
        return s ? this._returnResult({ data: null, error: s }) : r ? await E(this.fetch, "GET", `${this.url}/user/oauth/grants`, {
          headers: this.headers,
          jwt: r.access_token,
          xform: (n) => ({ data: n, error: null })
        }) : this._returnResult({ data: null, error: new z() });
      });
    } catch (e) {
      if (k(e))
        return this._returnResult({ data: null, error: e });
      throw e;
    }
  }
  /**
   * Revokes a user's OAuth grant for a specific client.
   * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
   */
  async _revokeOAuthGrant(e) {
    try {
      return await this._useSession(async (r) => {
        const { data: { session: s }, error: n } = r;
        return n ? this._returnResult({ data: null, error: n }) : s ? (await E(this.fetch, "DELETE", `${this.url}/user/oauth/grants`, {
          headers: this.headers,
          jwt: s.access_token,
          query: { client_id: e.clientId },
          noResolveJson: !0
        }), { data: {}, error: null }) : this._returnResult({ data: null, error: new z() });
      });
    } catch (r) {
      if (k(r))
        return this._returnResult({ data: null, error: r });
      throw r;
    }
  }
  async fetchJwk(e, r = { keys: [] }) {
    let s = r.keys.find((l) => l.kid === e);
    if (s)
      return s;
    const n = Date.now();
    if (s = this.jwks.keys.find((l) => l.kid === e), s && this.jwks_cached_at + la > n)
      return s;
    const { data: i, error: a } = await E(this.fetch, "GET", `${this.url}/.well-known/jwks.json`, {
      headers: this.headers
    });
    if (a)
      throw a;
    return !i.keys || i.keys.length === 0 || (this.jwks = i, this.jwks_cached_at = n, s = i.keys.find((l) => l.kid === e), !s) ? null : s;
  }
  /**
   * Extracts the JWT claims present in the access token by first verifying the
   * JWT against the server's JSON Web Key Set endpoint
   * `/.well-known/jwks.json` which is often cached, resulting in significantly
   * faster responses. Prefer this method over {@link GoTrueClient.getUser} which always
   * sends a request to the Auth server for each JWT.
   *
   * If the project is not using an asymmetric JWT signing key (like ECC or
   * RSA) it always sends a request to the Auth server (similar to
   * {@link GoTrueClient.getUser}) to verify the JWT.
   *
   * @param jwt An optional specific JWT you wish to verify, not the one you
   *            can obtain from {@link GoTrueClient.getSession}.
   * @param options Various additional options that allow you to customize the
   *                behavior of this method.
   *
   * @category Auth
   *
   * @remarks
   * - Parses the user's [access token](/docs/guides/auth/sessions#access-token-jwt-claims) as a [JSON Web Token (JWT)](/docs/guides/auth/jwts) and returns its components if valid and not expired.
   * - If your project is using asymmetric JWT signing keys, then the verification is done locally usually without a network request using the [WebCrypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API).
   * - A network request is sent to your project's JWT signing key discovery endpoint `https://project-id.supabase.co/auth/v1/.well-known/jwks.json`, which is cached locally. If your environment is ephemeral, such as a Lambda function that is destroyed after every request, a network request will be sent for each new invocation. Supabase provides a network-edge cache providing fast responses for these situations.
   * - If the user's access token is about to expire when calling this function, the user's session will first be refreshed before validating the JWT.
   * - If your project is using a symmetric secret to sign the JWT, it always sends a request similar to `getUser()` to validate the JWT at the server before returning the decoded token. This is also used if the WebCrypto API is not available in the environment. Make sure you polyfill it in such situations.
   * - The returned claims can be customized per project using the [Custom Access Token Hook](/docs/guides/auth/auth-hooks/custom-access-token-hook).
   *
   * @example Get JWT claims, header and signature
   * ```js
   * const { data, error } = await supabase.auth.getClaims()
   * ```
   *
   * @exampleResponse Get JWT claims, header and signature
   * ```json
   * {
   *   "data": {
   *     "claims": {
   *       "aal": "aal1",
   *       "amr": [{
   *         "method": "email",
   *         "timestamp": 1715766000
   *       }],
   *       "app_metadata": {},
   *       "aud": "authenticated",
   *       "email": "example@email.com",
   *       "exp": 1715769600,
   *       "iat": 1715766000,
   *       "is_anonymous": false,
   *       "iss": "https://project-id.supabase.co/auth/v1",
   *       "phone": "+13334445555",
   *       "role": "authenticated",
   *       "session_id": "11111111-1111-1111-1111-111111111111",
   *       "sub": "11111111-1111-1111-1111-111111111111",
   *       "user_metadata": {}
   *     },
   *     "header": {
   *       "alg": "RS256",
   *       "typ": "JWT",
   *       "kid": "11111111-1111-1111-1111-111111111111"
   *     },
   *     "signature": [/** Uint8Array *\/],
   *   },
   *   "error": null
   * }
   * ```
   */
  async getClaims(e, r = {}) {
    try {
      let s = e;
      if (!s) {
        const { data: f, error: g } = await this.getSession();
        if (g || !f.session)
          return this._returnResult({ data: null, error: g });
        s = f.session.access_token;
      }
      const { header: n, payload: i, signature: a, raw: { header: l, payload: h } } = _t(s);
      if (!r?.allowExpired)
        try {
          Ia(i.exp);
        } catch (f) {
          throw new It(f instanceof Error ? f.message : "JWT validation failed");
        }
      const o = !n.alg || n.alg.startsWith("HS") || !n.kid || !("crypto" in globalThis && "subtle" in globalThis.crypto) ? null : await this.fetchJwk(n.kid, r?.keys ? { keys: r.keys } : r?.jwks);
      if (!o) {
        const { error: f } = await this.getUser(s);
        if (f)
          throw f;
        return {
          data: {
            claims: i,
            header: n,
            signature: a
          },
          error: null
        };
      }
      const c = $a(n.alg), u = await crypto.subtle.importKey("jwk", o, c, !0, [
        "verify"
      ]);
      if (!await crypto.subtle.verify(c, u, a, ma(`${l}.${h}`)))
        throw new It("Invalid JWT signature");
      return {
        data: {
          claims: i,
          header: n,
          signature: a
        },
        error: null
      };
    } catch (s) {
      if (k(s))
        return this._returnResult({ data: null, error: s });
      throw s;
    }
  }
  // --- Passkey Methods ---
  /**
   * Sign in with a passkey. Handles the full WebAuthn ceremony:
   * 1. Fetches authentication challenge from server
   * 2. Prompts user via navigator.credentials.get()
   * 3. Verifies credential with server and creates session
   *
   * Pass `options.mediation: 'conditional'` to use WebAuthn Conditional UI
   * (passkey autofill) instead of the modal picker; the value is forwarded to
   * `navigator.credentials.get()` unchanged.
   *
   * The challenge fetched in step 1 expires after the server's
   * GOTRUE_WEBAUTHN_CHALLENGE_EXPIRY_DURATION (5 minutes by default). With
   * `mediation: 'conditional'` the autofill prompt can stay pending for longer
   * than that: the browser ceremony then still succeeds, but verification fails
   * with `error_code: "webauthn_challenge_expired"`. Recover by calling
   * `signInWithPasskey()` again. It fetches a fresh challenge and, unless you
   * passed your own `options.signal`, cancels the pending ceremony first, so
   * the browser never sees two concurrent WebAuthn requests; the earlier call
   * resolves with a `WebAuthnError` whose code is `ERROR_CEREMONY_ABORTED`. If
   * you pass your own `signal`, abort it before retrying.
   *
   * @category Auth
   *
   * @example Sign in with Conditional UI (passkey autofill)
   * ```js
   * // <input autocomplete="username webauthn" /> somewhere on the page
   * const { data, error } = await supabase.auth.signInWithPasskey({
   *   options: {
   *     mediation: 'conditional'
   *   }
   * });
   * ```
   */
  async signInWithPasskey(e) {
    var r, s, n, i;
    try {
      if (!Lt())
        return this._returnResult({
          data: null,
          error: new oe("Browser does not support WebAuthn", null)
        });
      const { data: a, error: l } = await this._startPasskeyAuthentication({
        options: { captchaToken: (r = e?.options) === null || r === void 0 ? void 0 : r.captchaToken }
      });
      if (l || !a)
        return this._returnResult({ data: null, error: l });
      const h = ls(a.options), o = (n = (s = e?.options) === null || s === void 0 ? void 0 : s.signal) !== null && n !== void 0 ? n : wr.createNewAbortSignal(), { data: c, error: u } = await tn({
        publicKey: h,
        signal: o,
        mediation: (i = e?.options) === null || i === void 0 ? void 0 : i.mediation
      });
      if (u || !c)
        return this._returnResult({
          data: null,
          error: u ?? new oe("WebAuthn ceremony failed", null)
        });
      const d = hs(c);
      return this._verifyPasskeyAuthentication({
        challengeId: a.challenge_id,
        credential: d
      });
    } catch (a) {
      if (k(a))
        return this._returnResult({ data: null, error: a });
      throw a;
    }
  }
  /**
   * Register a passkey for the current authenticated user. Handles the full WebAuthn ceremony:
   * 1. Fetches registration challenge from server
   * 2. Prompts user via navigator.credentials.create()
   * 3. Verifies credential with server
   *
   * Requires an active session.
   *
   * @category Auth
   */
  async registerPasskey(e) {
    var r, s;
    try {
      if (!Lt())
        return this._returnResult({
          data: null,
          error: new oe("Browser does not support WebAuthn", null)
        });
      const { data: n, error: i } = await this._startPasskeyRegistration();
      if (i || !n)
        return this._returnResult({ data: null, error: i });
      const a = os(n.options), l = (s = (r = e?.options) === null || r === void 0 ? void 0 : r.signal) !== null && s !== void 0 ? s : wr.createNewAbortSignal(), { data: h, error: o } = await en({
        publicKey: a,
        signal: l
      });
      if (o || !h)
        return this._returnResult({
          data: null,
          error: o ?? new oe("WebAuthn ceremony failed", null)
        });
      const c = cs(h);
      return this._verifyPasskeyRegistration({
        challengeId: n.challenge_id,
        credential: c
      });
    } catch (n) {
      if (k(n))
        return this._returnResult({ data: null, error: n });
      throw n;
    }
  }
  /**
   * Start passkey registration for the current authenticated user.
   * Returns WebAuthn credential creation options to pass to navigator.credentials.create().
   */
  async _startPasskeyRegistration() {
    try {
      return await this._useSession(async (e) => {
        const { data: { session: r }, error: s } = e;
        if (s)
          return this._returnResult({ data: null, error: s });
        if (!r)
          return this._returnResult({ data: null, error: new z() });
        const { data: n, error: i } = await E(this.fetch, "POST", `${this.url}/passkeys/registration/options`, {
          headers: this.headers,
          jwt: r.access_token,
          body: {}
        });
        return i ? this._returnResult({ data: null, error: i }) : this._returnResult({ data: n, error: null });
      });
    } catch (e) {
      if (k(e))
        return this._returnResult({ data: null, error: e });
      throw e;
    }
  }
  /**
   * Verify passkey registration with the credential response.
   * The credentialResponse should be the serialized output of navigator.credentials.create().
   */
  async _verifyPasskeyRegistration(e) {
    try {
      return await this._useSession(async (r) => {
        const { data: { session: s }, error: n } = r;
        if (n)
          return this._returnResult({ data: null, error: n });
        if (!s)
          return this._returnResult({ data: null, error: new z() });
        const { data: i, error: a } = await E(this.fetch, "POST", `${this.url}/passkeys/registration/verify`, {
          headers: this.headers,
          jwt: s.access_token,
          body: {
            challenge_id: e.challengeId,
            credential: e.credential
          }
        });
        return a ? this._returnResult({ data: null, error: a }) : this._returnResult({ data: i, error: null });
      });
    } catch (r) {
      if (k(r))
        return this._returnResult({ data: null, error: r });
      throw r;
    }
  }
  /**
   * Start passkey authentication.
   * Returns WebAuthn credential request options to pass to navigator.credentials.get().
   */
  async _startPasskeyAuthentication(e) {
    var r;
    try {
      const { data: s, error: n } = await E(this.fetch, "POST", `${this.url}/passkeys/authentication/options`, {
        headers: this.headers,
        body: {
          gotrue_meta_security: { captcha_token: (r = e?.options) === null || r === void 0 ? void 0 : r.captchaToken }
        }
      });
      return n ? this._returnResult({ data: null, error: n }) : this._returnResult({ data: s, error: null });
    } catch (s) {
      if (k(s))
        return this._returnResult({ data: null, error: s });
      throw s;
    }
  }
  /**
   * Verify passkey authentication and create a session.
   * The credential should be the serialized output of navigator.credentials.get().
   */
  async _verifyPasskeyAuthentication(e) {
    try {
      const { data: r, error: s } = await E(this.fetch, "POST", `${this.url}/passkeys/authentication/verify`, {
        headers: this.headers,
        body: {
          challenge_id: e.challengeId,
          credential: e.credential
        },
        xform: se
      });
      return s ? this._returnResult({ data: null, error: s }) : (r.session && (await this._saveSession(r.session), await this._notifyAllSubscribers("SIGNED_IN", r.session)), this._returnResult({ data: r, error: null }));
    } catch (r) {
      if (k(r))
        return this._returnResult({ data: null, error: r });
      throw r;
    }
  }
  /**
   * List all passkeys for the current user.
   */
  async _listPasskeys() {
    try {
      return await this._useSession(async (e) => {
        const { data: { session: r }, error: s } = e;
        if (s)
          return this._returnResult({ data: null, error: s });
        if (!r)
          return this._returnResult({ data: null, error: new z() });
        const { data: n, error: i } = await E(this.fetch, "GET", `${this.url}/passkeys`, {
          headers: this.headers,
          jwt: r.access_token,
          xform: (a) => ({ data: a, error: null })
        });
        return i ? this._returnResult({ data: null, error: i }) : this._returnResult({ data: n, error: null });
      });
    } catch (e) {
      if (k(e))
        return this._returnResult({ data: null, error: e });
      throw e;
    }
  }
  /**
   * Update a passkey.
   */
  async _updatePasskey(e) {
    try {
      return await this._useSession(async (r) => {
        const { data: { session: s }, error: n } = r;
        if (n)
          return this._returnResult({ data: null, error: n });
        if (!s)
          return this._returnResult({ data: null, error: new z() });
        const { data: i, error: a } = await E(this.fetch, "PATCH", `${this.url}/passkeys/${e.passkeyId}`, {
          headers: this.headers,
          jwt: s.access_token,
          body: { friendly_name: e.friendlyName }
        });
        return a ? this._returnResult({ data: null, error: a }) : this._returnResult({ data: i, error: null });
      });
    } catch (r) {
      if (k(r))
        return this._returnResult({ data: null, error: r });
      throw r;
    }
  }
  /**
   * Delete a passkey.
   */
  async _deletePasskey(e) {
    try {
      return await this._useSession(async (r) => {
        const { data: { session: s }, error: n } = r;
        if (n)
          return this._returnResult({ data: null, error: n });
        if (!s)
          return this._returnResult({ data: null, error: new z() });
        const { error: i } = await E(this.fetch, "DELETE", `${this.url}/passkeys/${e.passkeyId}`, {
          headers: this.headers,
          jwt: s.access_token,
          noResolveJson: !0
        });
        return i ? this._returnResult({ data: null, error: i }) : this._returnResult({ data: null, error: null });
      });
    } catch (r) {
      if (k(r))
        return this._returnResult({ data: null, error: r });
      throw r;
    }
  }
}
lt.nextInstanceID = {};
const so = lt, no = "2.117.3";
let Ze = "", Dt;
if (typeof Deno < "u") {
  var er;
  Ze = "deno", Dt = (er = Deno.version) === null || er === void 0 ? void 0 : er.deno;
} else if (typeof document < "u") Ze = "web";
else if (typeof navigator < "u" && navigator.product === "ReactNative") Ze = "react-native";
else {
  var tr;
  Ze = "node";
  const t = globalThis.process;
  Dt = t == null || (tr = t.version) === null || tr === void 0 ? void 0 : tr.replace(/^v/, "");
}
const rn = [`runtime=${Ze}`];
Dt && rn.push(`runtime-version=${Dt}`);
const io = { "X-Client-Info": `supabase-js/${no}; ${rn.join("; ")}` }, ao = { headers: io }, oo = { schema: "public" }, lo = {
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  flowType: "implicit"
}, co = {}, ho = {
  enabled: !1,
  respectSamplingDecision: !0
};
function uo(t) {
  if (!t || typeof t != "string") return null;
  const e = t.split("-");
  if (e.length !== 4) return null;
  const [r, s, n, i] = e;
  if (r.length !== 2 || s.length !== 32 || n.length !== 16 || i.length !== 2) return null;
  const a = /^[0-9a-f]+$/i;
  return !a.test(r) || !a.test(s) || !a.test(n) || !a.test(i) || s === "00000000000000000000000000000000" || n === "0000000000000000" ? null : {
    version: r,
    traceId: s,
    parentId: n,
    traceFlags: i,
    isSampled: (parseInt(i, 16) & 1) === 1
  };
}
function fo(t, e) {
  if (!t || !e || e.length === 0) return !1;
  let r;
  if (t instanceof URL) r = t;
  else try {
    r = new URL(t);
  } catch {
    return !1;
  }
  for (const s of e) try {
    if (typeof s == "string") {
      if (po(r.hostname, s)) return !0;
    } else if (s instanceof RegExp) {
      if (s.test(r.hostname)) return !0;
    } else if (typeof s == "function" && s(r))
      return !0;
  } catch {
    continue;
  }
  return !1;
}
function po(t, e) {
  if (e === t) return !0;
  if (e.startsWith("*.")) {
    const r = e.slice(2);
    if (t.endsWith(r) && (t === r || t.endsWith("." + r)))
      return !0;
  }
  return !1;
}
function go(t) {
  const e = [];
  try {
    const r = new URL(t);
    e.push(r.hostname);
  } catch {
  }
  return e.push("*.supabase.co", "*.supabase.in"), e.push("localhost", "127.0.0.1", "[::1]"), e;
}
function ct(t) {
  "@babel/helpers - typeof";
  return ct = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
    return typeof e;
  } : function(e) {
    return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, ct(t);
}
function mo(t, e) {
  if (ct(t) != "object" || !t) return t;
  var r = t[Symbol.toPrimitive];
  if (r !== void 0) {
    var s = r.call(t, e);
    if (ct(s) != "object") return s;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
function yo(t) {
  var e = mo(t, "string");
  return ct(e) == "symbol" ? e : e + "";
}
function _o(t, e, r) {
  return (e = yo(e)) in t ? Object.defineProperty(t, e, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : t[e] = r, t;
}
function ds(t, e) {
  var r = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var s = Object.getOwnPropertySymbols(t);
    e && (s = s.filter(function(n) {
      return Object.getOwnPropertyDescriptor(t, n).enumerable;
    })), r.push.apply(r, s);
  }
  return r;
}
function K(t) {
  for (var e = 1; e < arguments.length; e++) {
    var r = arguments[e] != null ? arguments[e] : {};
    e % 2 ? ds(Object(r), !0).forEach(function(s) {
      _o(t, s, r[s]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(r)) : ds(Object(r)).forEach(function(s) {
      Object.defineProperty(t, s, Object.getOwnPropertyDescriptor(r, s));
    });
  }
  return t;
}
const wo = (t) => t ? (...e) => t(...e) : (...e) => fetch(...e), vo = () => Headers, sn = (t) => t.startsWith("sb_publishable_") || t.startsWith("sb_secret_"), ko = "sb_temp_", fs = /* @__PURE__ */ new Set(), bo = (t) => {
  var e, r;
  if (!t.startsWith("sb_") || sn(t) || t.startsWith(ko)) return;
  const s = (e = (r = t.match(/^sb_[a-zA-Z0-9]+_/)) === null || r === void 0 ? void 0 : r[0]) !== null && e !== void 0 ? e : "unknown";
  fs.has(s) || (fs.add(s), console.warn("@supabase/supabase-js: Unrecognized Supabase API key format. The client will proceed and send this key as-is; if you see authentication errors you may need to upgrade @supabase/supabase-js to a version that recognizes this key type."));
}, ps = (t, e, r, s, n, i) => {
  const a = wo(s), l = vo(), h = n?.enabled === !0, o = n?.respectSamplingDecision !== !1, c = h ? go(e) : null, u = !(i?.omitApiKeyAsBearer && sn(t));
  return async (d, f) => {
    const g = await r();
    let m = new l(f?.headers);
    if (m.has("apikey") || m.set("apikey", t), !m.has("Authorization")) {
      const p = g ?? (u ? t : null);
      p && m.set("Authorization", `Bearer ${p}`);
    }
    if (c) {
      const p = xo(d, c, o);
      p && (p.traceparent && !m.has("traceparent") && m.set("traceparent", p.traceparent), p.tracestate && !m.has("tracestate") && m.set("tracestate", p.tracestate), p.baggage && !m.has("baggage") && m.set("baggage", p.baggage));
    }
    return a(d, K(K({}, f), {}, { headers: m }));
  };
};
let gs = !1, ms = !1;
function xo(t, e, r) {
  const s = vn();
  if (!s)
    return gs || (gs = !0, console.warn("@supabase/supabase-js: tracePropagation is enabled but the tracing runtime is not loaded, so trace headers will not be attached. Add `import '@supabase/supabase-js/tracing'` at your application entry point (requires the OpenTelemetry API package to be installed). The CDN/UMD build does not support trace propagation.")), null;
  if (!fo(typeof t == "string" || t instanceof URL ? t : t.url, e)) return null;
  const n = s();
  if (!n || !n.traceparent) {
    var i;
    if (!(n == null || (i = n.carrierKeys) === null || i === void 0) && i.length && !ms) {
      ms = !0;
      const a = n.carrierKeys.includes("sentry-trace") ? " Sentry detected: set `propagateTraceparent: true` in Sentry.init() to emit it." : " Configure your tracing SDK to emit W3C trace context on outgoing requests.";
      console.warn(`@supabase/supabase-js: tracePropagation is enabled and a tracing SDK is active, but its propagator wrote [${n.carrierKeys.join(", ")}] and no W3C traceparent header, so trace headers will not be attached.` + a);
    }
    return null;
  }
  if (r) {
    const a = uo(n.traceparent);
    if (a && !a.isSampled) return { traceparent: n.traceparent };
  }
  return n;
}
function ys(t) {
  return typeof t == "boolean" ? { enabled: t } : t;
}
function So(t) {
  return t.endsWith("/") ? t : t + "/";
}
let _s = !1;
function To(t) {
  _s || typeof t != "object" || t === null || !("schema" in t) || t.schema === void 0 || (_s = !0, console.warn(`@supabase/supabase-js: The "schema" option must be nested under "db", e.g. createClient(url, key, { db: { schema: 'myschema' } }). A top-level "schema" is ignored and queries go to the default schema.`));
}
function Eo(t, e) {
  var r, s, n, i, a, l;
  const { db: h, auth: o, realtime: c, global: u } = t, { db: d, auth: f, realtime: g, global: m } = e, p = ys(t.tracePropagation), y = ys(e.tracePropagation), _ = {
    db: K(K({}, d), h),
    auth: K(K({}, f), o),
    realtime: K(K({}, g), c),
    storage: {},
    global: K(K(K({}, m), u), {}, { headers: K(K({}, (r = m?.headers) !== null && r !== void 0 ? r : {}), (s = u?.headers) !== null && s !== void 0 ? s : {}) }),
    tracePropagation: {
      enabled: (n = (i = p?.enabled) !== null && i !== void 0 ? i : y?.enabled) !== null && n !== void 0 ? n : !1,
      respectSamplingDecision: (a = (l = p?.respectSamplingDecision) !== null && l !== void 0 ? l : y?.respectSamplingDecision) !== null && a !== void 0 ? a : !0
    },
    accessToken: async () => ""
  };
  return t.accessToken ? _.accessToken = t.accessToken : delete _.accessToken, _;
}
function Ao(t) {
  const e = t?.trim();
  if (!e) throw new Error("supabaseUrl is required.");
  if (!e.match(/^https?:\/\//i)) throw new Error("Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.");
  try {
    return new URL(So(e));
  } catch {
    throw Error("Invalid supabaseUrl: Provided URL is malformed.");
  }
}
var Ro = class extends so {
  constructor(t) {
    super(t);
  }
}, Oo = class {
  /**
  * Create a new client for use in the browser.
  *
  * @category Initializing
  *
  * @param supabaseUrl The unique Supabase URL which is supplied when you create a new project in your project dashboard.
  * @param supabaseKey The unique Supabase Key which is supplied when you create a new project in your project dashboard.
  * @param options Optional configuration for the client:
  * - `db.schema` — You can switch in between schemas. The schema needs to be on the list of exposed schemas inside Supabase.
  * - `auth.autoRefreshToken` — Set to `true` if you want to automatically refresh the token before expiring.
  * - `auth.persistSession` — Set to `true` if you want to automatically save the user session into local storage.
  * - `auth.detectSessionInUrl` — Set to `true` if you want to automatically detect OAuth grants in the URL and sign in the user.
  * - `realtime` — Options passed along to the realtime-js constructor.
  * - `storage` — Options passed along to the storage-js constructor.
  * - `global.fetch` — A custom fetch implementation.
  * - `global.headers` — Any additional headers to send with each network request.
  *
  * @example Creating a client
  * ```js
  * import { createClient } from '@supabase/supabase-js'
  *
  * // Create a single supabase client for interacting with your database
  * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
  * ```
  *
  * @example With a custom domain
  * ```js
  * import { createClient } from '@supabase/supabase-js'
  *
  * // Use a custom domain as the supabase URL
  * const supabase = createClient('https://my-custom-domain.com', 'your-publishable-key')
  * ```
  *
  * @example With additional parameters
  * ```js
  * import { createClient } from '@supabase/supabase-js'
  *
  * const options = {
  *   db: {
  *     schema: 'public',
  *   },
  *   auth: {
  *     autoRefreshToken: true,
  *     persistSession: true,
  *     detectSessionInUrl: true
  *   },
  *   global: {
  *     headers: { 'x-my-custom-header': 'my-app-name' },
  *   },
  * }
  * const supabase = createClient("https://xyzcompany.supabase.co", "your-publishable-key", options)
  * ```
  *
  * @exampleDescription With custom schemas
  * By default the API server points to the `public` schema. You can enable other database schemas within the Dashboard.
  * Go to [Settings > API > Exposed schemas](/dashboard/project/_/settings/api) and add the schema which you want to expose to the API.
  *
  * Note: each client connection can only access a single schema, so the code above can access the `other_schema` schema but cannot access the `public` schema.
  *
  * @example With custom schemas
  * ```js
  * import { createClient } from '@supabase/supabase-js'
  *
  * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key', {
  *   // Provide a custom schema. Defaults to "public".
  *   db: { schema: 'other_schema' }
  * })
  * ```
  *
  * @exampleDescription Custom fetch implementation
  * `supabase-js` uses the runtime's global `fetch` to make HTTP requests,
  * but an alternative `fetch` implementation can be provided as an option.
  * This is useful in environments where the global `fetch` is unavailable or where you want to customize request behavior.
  *
  * @example Custom fetch implementation
  * ```js
  * import { createClient } from '@supabase/supabase-js'
  *
  * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key', {
  *   global: { fetch: fetch.bind(globalThis) }
  * })
  * ```
  *
  * @exampleDescription React Native options with AsyncStorage
  * For React Native we recommend using `AsyncStorage` as the storage implementation for Supabase Auth.
  *
  * @example React Native options with AsyncStorage
  * ```js
  * import 'react-native-url-polyfill/auto'
  * import { createClient } from '@supabase/supabase-js'
  * import AsyncStorage from "@react-native-async-storage/async-storage";
  *
  * const supabase = createClient("https://xyzcompany.supabase.co", "your-publishable-key", {
  *   auth: {
  *     storage: AsyncStorage,
  *     autoRefreshToken: true,
  *     persistSession: true,
  *     detectSessionInUrl: false,
  *   },
  * });
  * ```
  *
  * @exampleDescription React Native options with Expo SecureStore
  * If you wish to encrypt the user's session information, you can use `aes-js` and store the encryption key in Expo SecureStore.
  * The `aes-js` library, a reputable JavaScript-only implementation of the AES encryption algorithm in CTR mode.
  * A new 256-bit encryption key is generated using the `react-native-get-random-values` library.
  * This key is stored inside Expo's SecureStore, while the value is encrypted and placed inside AsyncStorage.
  *
  * Please make sure that:
  * - You keep the `expo-secure-store`, `aes-js` and `react-native-get-random-values` libraries up-to-date.
  * - Choose the correct [`SecureStoreOptions`](https://docs.expo.dev/versions/latest/sdk/securestore/#securestoreoptions) for your app's needs.
  *   E.g. [`SecureStore.WHEN_UNLOCKED`](https://docs.expo.dev/versions/latest/sdk/securestore/#securestorewhen_unlocked) regulates when the data can be accessed.
  * - Carefully consider optimizations or other modifications to the above example, as those can lead to introducing subtle security vulnerabilities.
  *
  * @example React Native options with Expo SecureStore
  * ```ts
  * import 'react-native-url-polyfill/auto'
  * import { createClient } from '@supabase/supabase-js'
  * import AsyncStorage from '@react-native-async-storage/async-storage';
  * import * as SecureStore from 'expo-secure-store';
  * import * as aesjs from 'aes-js';
  * import 'react-native-get-random-values';
  *
  * // As Expo's SecureStore does not support values larger than 2048
  * // bytes, an AES-256 key is generated and stored in SecureStore, while
  * // it is used to encrypt/decrypt values stored in AsyncStorage.
  * class LargeSecureStore {
  *   private async _encrypt(key: string, value: string) {
  *     const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));
  *
  *     const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
  *     const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
  *
  *     await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));
  *
  *     return aesjs.utils.hex.fromBytes(encryptedBytes);
  *   }
  *
  *   private async _decrypt(key: string, value: string) {
  *     const encryptionKeyHex = await SecureStore.getItemAsync(key);
  *     if (!encryptionKeyHex) {
  *       return encryptionKeyHex;
  *     }
  *
  *     const cipher = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(encryptionKeyHex), new aesjs.Counter(1));
  *     const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));
  *
  *     return aesjs.utils.utf8.fromBytes(decryptedBytes);
  *   }
  *
  *   async getItem(key: string) {
  *     const encrypted = await AsyncStorage.getItem(key);
  *     if (!encrypted) { return encrypted; }
  *
  *     return await this._decrypt(key, encrypted);
  *   }
  *
  *   async removeItem(key: string) {
  *     await AsyncStorage.removeItem(key);
  *     await SecureStore.deleteItemAsync(key);
  *   }
  *
  *   async setItem(key: string, value: string) {
  *     const encrypted = await this._encrypt(key, value);
  *
  *     await AsyncStorage.setItem(key, encrypted);
  *   }
  * }
  *
  * const supabase = createClient("https://xyzcompany.supabase.co", "your-publishable-key", {
  *   auth: {
  *     storage: new LargeSecureStore(),
  *     autoRefreshToken: true,
  *     persistSession: true,
  *     detectSessionInUrl: false,
  *   },
  * });
  * ```
  *
  * @example With a database query
  * ```ts
  * import { createClient } from '@supabase/supabase-js'
  *
  * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
  *
  * const { data } = await supabase.from('profiles').select('*')
  * ```
  *
  * @exampleDescription With OpenTelemetry tracing
  * Opt in to W3C trace context propagation so the `trace_id` from your
  * client-side spans is attached to Supabase requests and appears in API
  * Gateway and Edge Function logs. Requires `@opentelemetry/api` to be
  * installed in your application and the tracing runtime to be loaded via
  * `import '@supabase/supabase-js/tracing'`. See [Tracing with the JS SDK](https://supabase.com/docs/guides/telemetry/client-side-tracing).
  *
  * @example With OpenTelemetry tracing
  * ```ts
  * import '@supabase/supabase-js/tracing'
  * import { createClient } from '@supabase/supabase-js'
  * import { trace } from '@opentelemetry/api'
  *
  * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key', {
  *   tracePropagation: true,
  * })
  *
  * const tracer = trace.getTracer('my-app')
  *
  * await tracer.startActiveSpan('fetch-users', async (span) => {
  *   // Outgoing request carries the active trace context.
  *   const { data, error } = await supabase.from('users').select('*')
  *   span.end()
  * })
  * ```
  */
  constructor(t, e, r) {
    var s, n;
    this.supabaseUrl = t, this.supabaseKey = e;
    const i = Ao(t);
    if (!e) throw new Error("supabaseKey is required.");
    bo(e), To(r), this.realtimeUrl = new URL("realtime/v1", i), this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws"), this.authUrl = new URL("auth/v1", i), this.storageUrl = new URL("storage/v1", i), this.functionsUrl = new URL("functions/v1", i);
    const a = `sb-${i.hostname.split(".")[0]}-auth-token`, l = {
      db: oo,
      realtime: co,
      auth: K(K({}, lo), {}, { storageKey: a }),
      global: ao,
      tracePropagation: ho
    }, h = Eo(r ?? {}, l);
    if (this.settings = h, this.storageKey = (s = h.auth.storageKey) !== null && s !== void 0 ? s : "", this.headers = (n = h.global.headers) !== null && n !== void 0 ? n : {}, h.accessToken)
      this.accessToken = h.accessToken, this.auth = new Proxy({}, { get: (c, u) => {
        throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(u)} is not possible`);
      } });
    else {
      var o;
      this.auth = this._initSupabaseAuthClient((o = h.auth) !== null && o !== void 0 ? o : {}, this.headers, h.global.fetch);
    }
    this.fetch = ps(e, t, this._getSessionToken.bind(this), h.global.fetch, h.tracePropagation), this.functionsFetch = ps(e, t, this._getSessionToken.bind(this), h.global.fetch, h.tracePropagation, { omitApiKeyAsBearer: !0 }), this.realtime = this._initRealtimeClient(K({
      headers: this.headers,
      accessToken: this._getAccessToken.bind(this),
      fetch: this.fetch
    }, h.realtime)), this.accessToken && Promise.resolve(this.accessToken()).then((c) => this.realtime.setAuth(c)).catch((c) => console.warn("Failed to set initial Realtime auth token:", c)), this.rest = new $n(new URL("rest/v1", i).href, {
      headers: this.headers,
      schema: h.db.schema,
      fetch: this.fetch,
      timeout: h.db.timeout,
      urlLengthLimit: h.db.urlLengthLimit,
      retry: h.db.retry
    }), this.storage = new ta(this.storageUrl.href, this.headers, this.fetch, r?.storage), h.accessToken || this._listenForAuthEvents();
  }
  /**
  * Supabase Functions allows you to deploy and invoke edge functions.
  */
  get functions() {
    return new Sn(this.functionsUrl.href, {
      headers: this.headers,
      customFetch: this.functionsFetch
    });
  }
  /**
  * Perform a query on a table or a view.
  *
  * @param relation - The table or view name to query
  */
  from(t) {
    return this.rest.from(t);
  }
  /**
  * Select a schema to query or perform an function (rpc) call.
  *
  * The schema needs to be on the list of exposed schemas inside Supabase.
  *
  * @param schema - The schema to query
  */
  schema(t) {
    return this.rest.schema(t);
  }
  /**
  * Fetch the OpenAPI description PostgREST publishes for this client's schema.
  *
  * The document lists only the tables, views and functions the caller's role
  * holds privileges on. The request carries the same `apikey` and
  * `Authorization` headers as every other query, so the description is scoped
  * to the signed-in user. Call `.schema()` first to describe a schema other
  * than the client default.
  *
  * @example
  * ```ts
  * const { data, error } = await supabase.getOpenApiSpec()
  * ```
  */
  getOpenApiSpec() {
    return this.rest.getOpenApiSpec();
  }
  /**
  * Perform a function call.
  *
  * @param fn - The function name to call
  * @param args - The arguments to pass to the function call
  * @param options - Named parameters
  * @param options.head - When set to `true`, `data` will not be returned.
  * Useful if you only need the count.
  * @param options.get - When set to `true`, the function will be called with
  * read-only access mode.
  * @param options.count - Count algorithm to use to count rows returned by the
  * function. Only applicable for [set-returning
  * functions](https://www.postgresql.org/docs/current/functions-srf.html).
  *
  * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
  * hood.
  *
  * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
  * statistics under the hood.
  *
  * `"estimated"`: Uses exact count for low numbers and planned count for high
  * numbers.
  */
  rpc(t, e = {}, r = {
    head: !1,
    get: !1,
    count: void 0
  }) {
    return this.rest.rpc(t, e, r);
  }
  /**
  * Creates a Realtime channel with Broadcast, Presence, and Postgres Changes.
  *
  * @param {string} name - The name of the Realtime channel.
  * @param {Object} opts - The options to pass to the Realtime channel.
  *
  * @category Realtime
  */
  channel(t, e = { config: {} }) {
    return this.realtime.channel(t, e);
  }
  /**
  * Returns all Realtime channels.
  *
  * @category Realtime
  *
  * @example Get all channels
  * ```js
  * const channels = supabase.getChannels()
  * ```
  */
  getChannels() {
    return this.realtime.getChannels();
  }
  /**
  * Unsubscribes and removes Realtime channel from Realtime client.
  *
  * @param {RealtimeChannel} channel - The name of the Realtime channel.
  *
  *
  * @category Realtime
  *
  * @remarks
  * - Removing a channel is a great way to maintain the performance of your project's Realtime service as well as your database if you're listening to Postgres changes. Supabase will automatically handle cleanup 30 seconds after a client is disconnected, but unused channels may cause degradation as more clients are simultaneously subscribed.
  *
  * @example Removes a channel
  * ```js
  * supabase.removeChannel(myChannel)
  * ```
  */
  removeChannel(t) {
    return this.realtime.removeChannel(t);
  }
  /**
  * Unsubscribes and removes all Realtime channels from Realtime client.
  *
  * @category Realtime
  *
  * @remarks
  * - Removing channels is a great way to maintain the performance of your project's Realtime service as well as your database if you're listening to Postgres changes. Supabase will automatically handle cleanup 30 seconds after a client is disconnected, but unused channels may cause degradation as more clients are simultaneously subscribed.
  *
  * @example Remove all channels
  * ```js
  * supabase.removeAllChannels()
  * ```
  */
  removeAllChannels() {
    return this.realtime.removeAllChannels();
  }
  /**
  * The raw session token — the custom `accessToken` result or the signed-in user's JWT —
  * or `null` when there is no session. Unlike {@link _getAccessToken} it does not fall back
  * to `supabaseKey`, so callers can distinguish "no session" from "has session".
  */
  async _getSessionToken() {
    var t = this, e, r;
    if (t.accessToken) return await t.accessToken();
    const { data: s } = await t.auth.getSession();
    return (e = (r = s.session) === null || r === void 0 ? void 0 : r.access_token) !== null && e !== void 0 ? e : null;
  }
  async _getAccessToken() {
    var t = this, e;
    return (e = await t._getSessionToken()) !== null && e !== void 0 ? e : t.supabaseKey;
  }
  _initSupabaseAuthClient({ autoRefreshToken: t, persistSession: e, detectSessionInUrl: r, storage: s, userStorage: n, storageKey: i, flowType: a, lock: l, debug: h, throwOnError: o, experimental: c, lockAcquireTimeout: u, skipAutoInitialize: d }, f, g) {
    const m = {
      Authorization: `Bearer ${this.supabaseKey}`,
      apikey: `${this.supabaseKey}`
    };
    return new Ro({
      url: this.authUrl.href,
      headers: K(K({}, m), f),
      storageKey: i,
      autoRefreshToken: t,
      persistSession: e,
      detectSessionInUrl: r,
      storage: s,
      userStorage: n,
      flowType: a,
      lock: l,
      debug: h,
      throwOnError: o,
      experimental: c,
      fetch: g,
      lockAcquireTimeout: u,
      skipAutoInitialize: d,
      hasCustomAuthorizationHeader: Object.keys(this.headers).some((p) => p.toLowerCase() === "authorization")
    });
  }
  _initRealtimeClient(t) {
    return new Ti(this.realtimeUrl.href, K(K({}, t), {}, { params: K(K({}, { apikey: this.supabaseKey }), t?.params) }));
  }
  _listenForAuthEvents() {
    return this.auth.onAuthStateChange((t, e) => {
      this._handleTokenChanged(t, "CLIENT", e?.access_token);
    });
  }
  _handleTokenChanged(t, e, r) {
    (t === "TOKEN_REFRESHED" || t === "SIGNED_IN" || t === "INITIAL_SESSION") && this.changedAccessToken !== r ? (this.changedAccessToken = r, this.realtime.setAuth(r)) : t === "SIGNED_OUT" && (this.realtime.setAuth(), e == "STORAGE" && this.auth.signOut(), this.changedAccessToken = void 0);
  }
};
const Mo = (t, e, r) => new Oo(t, e, r);
function Po() {
  if (typeof window < "u" || globalThis.Deno !== void 0) return !1;
  const t = globalThis.process;
  if (!t) return !1;
  const e = t.version;
  if (e == null) return !1;
  const r = e.match(/^v(\d+)\./);
  return r ? parseInt(r[1], 10) <= 20 : !1;
}
Po() && console.warn("⚠️  Node.js 20 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 22 or later. For more information, visit: https://github.com/orgs/supabase/discussions/45715");
const Co = { VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_MfmKfF6QvbmoGWE_32HLHg_JY6DwAu8", VITE_SUPABASE_URL: "https://vpuppuqqvdmjlayhcywu.supabase.co" }, ws = Co, _e = Mo(ws.VITE_SUPABASE_URL, ws.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: { storageKey: "chari-dungeon.online.auth.v1", detectSessionInUrl: !1 }
}), vr = "0x4AAAAAAFTzKy97Tu0Hgs-N";
let vs;
function Io() {
  const t = window.turnstile;
  return t ? Promise.resolve(t) : vs ??= new Promise((e, r) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit", s.async = !0, s.onload = () => e(window.turnstile), s.onerror = () => {
      vs = void 0, s.remove(), r(new Error("本人確認を読み込めませんでした。接続を確認して開き直してください。"));
    }, document.head.append(s);
  });
}
async function $o(t, e) {
  const r = await Io();
  if (!t.isConnected) return { destroy: () => {
  }, reset: () => {
  } };
  const s = r.render(t, {
    sitekey: vr,
    theme: "dark",
    size: "flexible",
    callback: (n) => e(n),
    "expired-callback": () => e(),
    "error-callback": () => e()
  });
  return { destroy: () => r.remove(s), reset: () => {
    e(), r.reset(s);
  } };
}
const jo = ["ja", "en", "ko", "zh-CN"];
function nn(t = document.documentElement.lang) {
  return jo.includes(t) ? t : "ja";
}
const Lo = {
  ja: ["メールアドレスの確認", "ボタンを押して茶利ダンジョンのアカウントを認証してください。", "メールアドレスを確認する", "認証できました。ゲームに戻り「オンライン」を選んでください。", "ゲームへ戻る", "リンクが無効、または期限切れです。ゲームで確認メールを再送してください。"],
  en: ["Confirm your email", "Confirm your Chari Dungeon account using the button below.", "Confirm email address", "Email confirmed. Return to the game and choose Online.", "Return to game", "This link is invalid or expired. Request a new confirmation email in the game."],
  ko: ["이메일 주소 확인", "아래 버튼을 눌러 Chari Dungeon 계정을 인증해 주세요.", "이메일 주소 확인하기", "인증되었습니다. 게임으로 돌아가 온라인을 선택해 주세요.", "게임으로 돌아가기", "링크가 유효하지 않거나 만료되었습니다. 게임에서 확인 메일을 다시 보내 주세요."],
  "zh-CN": ["验证邮箱", "请点击下方按钮验证 Chari Dungeon 账号。", "验证邮箱地址", "验证成功。请返回游戏并选择在线模式。", "返回游戏", "链接无效或已过期。请在游戏中重新发送验证邮件。"]
};
let No = !1;
const Do = () => No;
function Fo() {
  return Math.random();
}
const an = [
  { key: "w_hw_candy", name: "パンプキン卿のキャンディ剣", weaponType: "longsword", atkMin: 8, atkMax: 17, durMax: 220, grade: "C", minFloor: 1, rarity: 1, exclusiveLoot: !0, passive: { key: "sturdy", name: "甘い守り", description: "受けるダメージ-5%" } },
  { key: "w_hw_lantern", name: "墓守の鬼火槍", weaponType: "lance", atkMin: 10, atkMax: 21, durMax: 210, grade: "B", element: "ice", minFloor: 1, rarity: 1, exclusiveLoot: !0 },
  { key: "w_hw_bat", name: "魔女のコウモリ弓", weaponType: "bow", atkMin: 12, atkMax: 24, durMax: 200, grade: "A", minFloor: 1, rarity: 1, exclusiveLoot: !0 },
  { key: "w_hw_coffin", name: "首なし騎士の焔大剣", weaponType: "greatsword", atkMin: 14, atkMax: 28, durMax: 240, grade: "A", element: "fire", minFloor: 1, rarity: 1, exclusiveLoot: !0 },
  { key: "w_hw_harvest", name: "収穫王の茨剣", weaponType: "longsword", atkMin: 16, atkMax: 30, durMax: 260, grade: "S", element: "fire", minFloor: 1, rarity: 1, exclusiveLoot: !0 },
  { key: "w_hw_emedral", name: "エメドラル", weaponType: "bow", atkMin: 16, atkMax: 30, durMax: 300, grade: "SSS", initialPlus: 10, element: "ice", minFloor: 1, rarity: 1, exclusiveLoot: !0, passive: { key: "emedral", name: "氷翠の封縛", description: "2回に1回の命中で1ターンスタン＋5ターン攻撃力30%低下。同じ敵には一度だけ" } }
], Tr = [
  { key: "s_hw_pumpkin", name: "パンプキン卿の笑顔盾", defBonus: 4, durMax: 180, grade: "C", minFloor: 1, rarity: 1, exclusiveLoot: !0, passive: { key: "brace", name: "カボチャの守り", description: "10以上の攻撃ダメージを20%軽減" } },
  { key: "s_hw_grave", name: "墓守の石碑盾", defBonus: 5, durMax: 200, grade: "B", element: "ice", minFloor: 1, rarity: 1, exclusiveLoot: !0, passive: { key: "element_guard", name: "冷たい霧", description: "同属性の攻撃を軽減" } },
  { key: "s_hw_moon", name: "魔女の三日月盾", defBonus: 6, durMax: 210, grade: "A", minFloor: 1, rarity: 1, exclusiveLoot: !0, passive: { key: "mirror", name: "月の鏡", description: "15%の確率で攻撃を完全に無効化" } },
  { key: "s_hw_coffin", name: "首なし騎士の黒棺盾", defBonus: 8, durMax: 230, grade: "A", minFloor: 1, rarity: 1, exclusiveLoot: !0, passive: { key: "thorns", name: "棺の棘", description: "攻撃ダメージの25%を反射" } },
  { key: "s_hw_harvest", name: "収穫王の紋章盾", defBonus: 10, durMax: 260, grade: "S", element: "fire", minFloor: 1, rarity: 1, exclusiveLoot: !0, passive: { key: "recovery", name: "収穫の恵み", description: "4回攻撃を受けるごとにHPを6回復" } }
], Bo = { key: "s_hw_emerald", name: "氷翠の王盾", defBonus: 16, durMax: 300, grade: "SSS", initialPlus: 10, element: "ice", minFloor: 1, rarity: 1, exclusiveLoot: !0, passive: { key: "emerald_guard", name: "氷翠の王域", description: "被ダメージの20%を反射。HP20%以下で3ターン無敵。発動後100ターンは再発動不可。HP20%超への回復も必要" } };
Tr.push(Bo);
const ee = { minFloor: 31, maxFloor: 35, color: 16754253, behavior: "chase", element: null }, Er = [
  { ...ee, key: "m_hw_pumpkin_lord", name: "パンプキン卿", description: "爆弾カボチャ3個を2ターン後に爆発させる。HP半分で横・縦の連続斬り。爆弾を壊して逃げ道を作ろう。", hp: 150, atkMin: 9, atkMax: 16, def: 3, exp: 35, gold: 25 },
  { ...ee, key: "m_hw_gravekeeper", name: "霧灯の墓守", description: "鬼火ランタン2個が被ダメージを50%軽減。冷気の予告帯を避けてランタンを壊すと、2ターン動けなくなる。", hp: 200, atkMin: 11, atkMax: 19, def: 4, exp: 45, gold: 35, element: "ice" },
  { ...ee, key: "m_hw_witch", name: "月夜のカボチャ魔女", description: "分身2体と毒の魔法陣を操る。緑の魔力をまとう本物を狙い、詠唱中に最大HP8%分のダメージかスタンで中断しよう。", hp: 245, atkMin: 13, atkMax: 22, def: 5, exp: 60, gold: 45 },
  { ...ee, key: "m_hw_headless", name: "首なし騎士グリム", description: "正面からの攻撃を50%軽減。突進・振り返り斬り・薙ぎ払いの順に予告が来る。大技後2ターンは被ダメージ1.5倍。", hp: 310, atkMin: 16, atkMax: 26, def: 7, exp: 80, gold: 60, element: "fire" },
  { ...ee, key: "m_hw_king", name: "収穫王ジャック", description: "茨の心臓が4ターンごとに回復させる。心臓を壊して回復を止めよう。HP半分で覚醒し、鬼火と切り払える茨を広げる。", hp: 450, atkMin: 19, atkMax: 31, def: 8, exp: 120, gold: 100, element: "fire" }
];
Er.forEach((t) => {
  t.hp *= 2;
});
const Uo = [
  { ...ee, key: "m_hw_pumpkin", name: "跳ねカボチャ", hp: 26, atkMin: 5, atkMax: 9, def: 1, exp: 8, gold: 3, gimmick: "lantern", description: "蔓の足で跳ねるカボチャ。倒すとランタンの光が広がる。" },
  { ...ee, key: "m_hw_bat", name: "キャンディコウモリ", hp: 20, atkMin: 4, atkMax: 8, def: 0, exp: 7, gold: 3, behavior: "random", description: "紫の羽で飛び回る、お菓子好きな使い魔。" },
  { ...ee, key: "m_hw_ghost", name: "灯りおばけ", hp: 30, atkMin: 5, atkMax: 10, def: 1, exp: 9, gold: 4, behavior: "loop", wallPass: !0, gimmick: "phase", description: "青い灯りを運ぶ幽霊。壁をすり抜けて近づく。" },
  { ...ee, key: "m_hw_slime", name: "魔女のカボチャゼリー", hp: 38, atkMin: 6, atkMax: 11, def: 2, exp: 10, gold: 5, behavior: "slow", gimmick: "mud_bind", description: "魔女の釜から生まれたゼリー。足元を絡め取る。" }
], Ho = [
  { ...ee, key: "m_hw_squire", name: "キャンディ近衛騎士", hp: 42, atkMin: 6, atkMax: 10, def: 2, exp: 12, gold: 5, isHalloweenRetainer: !0 },
  { ...ee, key: "m_hw_sentinel", name: "鬼火の墓地番兵", hp: 52, atkMin: 7, atkMax: 12, def: 2, exp: 15, gold: 6, element: "ice", isHalloweenRetainer: !0 },
  { ...ee, key: "m_hw_familiar", name: "月夜のカボチャ使い魔", hp: 62, atkMin: 8, atkMax: 14, def: 3, exp: 18, gold: 7, isHalloweenRetainer: !0 },
  { ...ee, key: "m_hw_soldier", name: "首なし騎士の黒鉄兵", hp: 75, atkMin: 10, atkMax: 16, def: 4, exp: 22, gold: 8, element: "fire", isHalloweenRetainer: !0 },
  { ...ee, key: "m_hw_royal_guard", name: "収穫王の茨近衛兵", hp: 90, atkMin: 11, atkMax: 18, def: 5, exp: 26, gold: 10, isHalloweenRetainer: !0 }
], qo = { ...Er[4], key: "m_hw_golden_king", name: "金の収穫王", hp: 1200, exp: 180, gold: 300, description: "最終階に1%で登場。黄金の収穫祭は3ターン後に大爆発。近衛兵を倒した跡へ避難しよう。爆発後2ターンは被ダメージ1.5倍。伝説の弓と盾を各10%で落とす。" }, Wo = [...Er, ...Uo, ...Ho, qo], Ko = ["stairs", "wall", "gate", "pumpkins", "grave", "lantern", "cauldron", "books", "armor", "coffin", "throne", "tree", "chest", "chest_open", "candy", "barrel"];
Object.fromEntries([
  ...["aura_a", "aura_b", "freeze", "barrier"].map((t) => [`fx_hw_${t}`, `assets/halloween-fx-v1/${t}.png`]),
  ["i_candykey", "assets/halloween-loot-v1/candykey.png"],
  ...Wo.map((t) => [t.key, `assets/${t.isHalloweenRetainer ? "halloween-retainers-v1" : "halloween-v1"}/${t.key}.png`]),
  ...[...an, ...Tr].map((t) => [t.key, `assets/halloween-v1/${t.key}.png`]),
  ...Ko.map((t) => [`hw_${t}`, `assets/${t === "wall" ? "halloween-wall-v3" : "halloween-props-v2"}/${t}.png`]),
  ...[1, 2, 3, 4, 5].flatMap((t) => [[`hw_floor_${t}`, `assets/halloween-v1/floor-${t}.png`], [`hw_backdrop_${t}`, `assets/halloween-v1/backdrop-${t}.webp`]])
]);
const Jt = [
  // 盾と併用できる刀。全グレードと4属性。
  { key: "w_katana_iron", name: "黒鉄の刀", atkMin: 7, atkMax: 15, durMax: 180, minFloor: 1, rarity: 12, grade: "D", weaponType: "katana" },
  { key: "w_katana_mist", name: "霞斬り", atkMin: 9, atkMax: 18, durMax: 195, minFloor: 3, rarity: 9, grade: "C", weaponType: "katana" },
  { key: "w_katana_moon", name: "月影の刀", atkMin: 11, atkMax: 22, durMax: 210, minFloor: 8, rarity: 6, grade: "B", weaponType: "katana" },
  { key: "w_katana_sun", name: "日輪刀アカツキ", atkMin: 13, atkMax: 26, durMax: 225, minFloor: 13, rarity: 3, grade: "A", weaponType: "katana" },
  { key: "w_katana_dragon", name: "龍牙刀ムラクモ", atkMin: 15, atkMax: 30, durMax: 240, minFloor: 21, rarity: 1, grade: "S", weaponType: "katana" },
  { key: "w_katana_sky", name: "天翔刀アマツカゼ", atkMin: 17, atkMax: 33, durMax: 255, minFloor: 25, rarity: 1, grade: "SS", weaponType: "katana" },
  { key: "w_katana_divine", name: "神刀タツマキ", atkMin: 19, atkMax: 36, durMax: 285, minFloor: 30, rarity: 1, grade: "SSS", weaponType: "katana", exclusiveLoot: !0 },
  { key: "w_katana_fire", name: "焔刀カエン", atkMin: 9, atkMax: 18, durMax: 195, minFloor: 4, rarity: 9, grade: "C", weaponType: "katana", element: "fire" },
  { key: "w_katana_water", name: "水刀シズク", atkMin: 9, atkMax: 18, durMax: 195, minFloor: 4, rarity: 9, grade: "C", weaponType: "katana", element: "water" },
  { key: "w_katana_thunder", name: "雷刀イカヅチ", atkMin: 11, atkMax: 22, durMax: 210, minFloor: 8, rarity: 6, grade: "B", weaponType: "katana", element: "thunder" },
  { key: "w_katana_ice", name: "氷刀シラユキ", atkMin: 11, atkMax: 22, durMax: 210, minFloor: 8, rarity: 6, grade: "B", weaponType: "katana", element: "ice" },
  {
    key: "w_secret_ember",
    name: "焔凰剣フェニクシア",
    atkMin: 12,
    atkMax: 22,
    durMax: 190,
    minFloor: 1,
    rarity: 1,
    grade: "S",
    weaponType: "longsword",
    element: "fire",
    initialPlus: 3,
    exclusiveLoot: !0,
    passive: { key: "sturdy", name: "不滅の刃", description: "被ダメージを5%軽減する" }
  },
  {
    key: "w_secret_tide",
    name: "海嘯弓ネレイア",
    atkMin: 10,
    atkMax: 20,
    durMax: 170,
    minFloor: 1,
    rarity: 1,
    grade: "S",
    weaponType: "bow",
    element: "water",
    initialPlus: 3,
    exclusiveLoot: !0,
    passive: { key: "eagle_eye", name: "深海の照準", description: "会心率+4%" }
  },
  {
    key: "w_secret_storm",
    name: "霆天槍ヴォルトレア",
    atkMin: 12,
    atkMax: 24,
    durMax: 180,
    minFloor: 1,
    rarity: 1,
    grade: "S",
    weaponType: "lance",
    element: "thunder",
    initialPlus: 3,
    exclusiveLoot: !0,
    passive: { key: "pierce", name: "雷霆の穿孔", description: "敵の防御を8%無視する" }
  },
  {
    key: "w_secret_frost",
    name: "氷鴉刃ノクティス",
    atkMin: 10,
    atkMax: 18,
    durMax: 160,
    minFloor: 1,
    rarity: 1,
    grade: "S",
    weaponType: "dagger",
    element: "ice",
    initialPlus: 3,
    exclusiveLoot: !0,
    passive: { key: "backstab", name: "凍夜の暗殺", description: "背後からの一撃を強化する" }
  },
  {
    key: "w_secret_solar",
    name: "赫日銃レオニス",
    atkMin: 11,
    atkMax: 21,
    durMax: 170,
    minFloor: 1,
    rarity: 1,
    grade: "S",
    weaponType: "handgun",
    element: "fire",
    initialPlus: 3,
    exclusiveLoot: !0,
    passive: { key: "quickdraw", name: "暁の早撃ち", description: "2マス先へ射撃・会心率+8%" }
  },
  {
    key: "w_hero_sword",
    name: "覇天剣アルカディア",
    atkMin: 16,
    atkMax: 30,
    durMax: 300,
    minFloor: 21,
    rarity: 1,
    grade: "SSS",
    weaponType: "greatsword",
    initialPlus: 10,
    exclusiveLoot: !0,
    passive: { key: "hero_heal", name: "英雄の祝福", description: "敵に攻撃を当てるとHPが10回復" }
  },
  // 属性は後付け抽選せず、武器の種類・名前・専用アートに固定する。
  { key: "w_dagger_fire", name: "焔牙カグツチ", atkMin: 6, atkMax: 14, durMax: 120, minFloor: 1, rarity: 10, grade: "D", weaponType: "dagger", element: "fire" },
  { key: "w_dagger_water", name: "潮刃ミナヅキ", atkMin: 6, atkMax: 14, durMax: 120, minFloor: 1, rarity: 10, grade: "D", weaponType: "dagger", element: "water" },
  { key: "w_dagger_thunder", name: "雷針イカヅチ", atkMin: 7, atkMax: 15, durMax: 114, minFloor: 1, rarity: 9, grade: "D", weaponType: "dagger", element: "thunder" },
  { key: "w_dagger_ice", name: "氷晶シラユキ", atkMin: 6, atkMax: 14, durMax: 126, minFloor: 1, rarity: 9, grade: "D", weaponType: "dagger", element: "ice" },
  { key: "w_longsword_fire", name: "獄炎剣ヴォルガ", atkMin: 9, atkMax: 19, durMax: 180, minFloor: 3, rarity: 8, grade: "C", weaponType: "longsword", element: "fire" },
  { key: "w_longsword_water", name: "海淵剣ネレイス", atkMin: 9, atkMax: 18, durMax: 192, minFloor: 3, rarity: 8, grade: "C", weaponType: "longsword", element: "water" },
  { key: "w_longsword_thunder", name: "迅雷剣ヴァジュラ", atkMin: 11, atkMax: 22, durMax: 168, minFloor: 8, rarity: 6, grade: "B", weaponType: "longsword", element: "thunder" },
  { key: "w_longsword_ice", name: "凍界剣グレイシア", atkMin: 10, atkMax: 21, durMax: 186, minFloor: 8, rarity: 6, grade: "B", weaponType: "longsword", element: "ice" },
  { key: "w_bow_fire", name: "炎翼弓フェニクス", atkMin: 11, atkMax: 23, durMax: 126, minFloor: 13, rarity: 4, grade: "A", weaponType: "bow", element: "fire" },
  { key: "w_bow_water", name: "蒼流弓アクエリア", atkMin: 10, atkMax: 22, durMax: 138, minFloor: 13, rarity: 4, grade: "A", weaponType: "bow", element: "water" },
  { key: "w_bow_thunder", name: "雷鳴弓テンペスト", atkMin: 12, atkMax: 24, durMax: 120, minFloor: 13, rarity: 3, grade: "A", weaponType: "bow", element: "thunder" },
  { key: "w_bow_ice", name: "氷月弓ルナフロスト", atkMin: 11, atkMax: 23, durMax: 132, minFloor: 13, rarity: 3, grade: "A", weaponType: "bow", element: "ice" },
  { key: "w_dual_sword_fire", name: "双炎刃イグニス", atkMin: 8, atkMax: 16, durMax: 144, minFloor: 21, rarity: 2, grade: "S", weaponType: "dual_sword", element: "fire", dual: !0, ss: !0 },
  { key: "w_dual_sword_water", name: "双潮刃リヴァイア", atkMin: 8, atkMax: 15, durMax: 156, minFloor: 21, rarity: 2, grade: "S", weaponType: "dual_sword", element: "water", dual: !0, ss: !0 },
  { key: "w_dual_sword_thunder", name: "双雷刃ライキリ", atkMin: 9, atkMax: 17, durMax: 138, minFloor: 21, rarity: 1, grade: "S", weaponType: "dual_sword", element: "thunder", dual: !0, ss: !0 },
  { key: "w_dual_sword_ice", name: "双氷刃フロストバイト", atkMin: 8, atkMax: 16, durMax: 150, minFloor: 21, rarity: 1, grade: "S", weaponType: "dual_sword", element: "ice", dual: !0, ss: !0 },
  // ハンドガンは2マス先を狙える中距離武器。全系統に固有効果「早撃ち」を持たせる。
  {
    key: "w_handgun_fire",
    name: "焔銃イグナイト",
    atkMin: 9,
    atkMax: 19,
    durMax: 108,
    minFloor: 4,
    rarity: 7,
    grade: "C",
    weaponType: "handgun",
    element: "fire",
    passive: { key: "quickdraw", name: "早撃ち", description: "2マス先へ射撃・会心率+8%" }
  },
  {
    key: "w_handgun_water",
    name: "蒼銃アクアリウム",
    atkMin: 8,
    atkMax: 19,
    durMax: 114,
    minFloor: 4,
    rarity: 7,
    grade: "C",
    weaponType: "handgun",
    element: "water",
    passive: { key: "quickdraw", name: "早撃ち", description: "2マス先へ射撃・会心率+8%" }
  },
  {
    key: "w_handgun_thunder",
    name: "雷銃ヴォルト",
    atkMin: 11,
    atkMax: 22,
    durMax: 102,
    minFloor: 8,
    rarity: 5,
    grade: "B",
    weaponType: "handgun",
    element: "thunder",
    passive: { key: "quickdraw", name: "早撃ち", description: "2マス先へ射撃・会心率+8%" }
  },
  {
    key: "w_handgun_ice",
    name: "氷銃フロストロック",
    atkMin: 10,
    atkMax: 21,
    durMax: 111,
    minFloor: 8,
    rarity: 5,
    grade: "B",
    weaponType: "handgun",
    element: "ice",
    passive: { key: "quickdraw", name: "早撃ち", description: "2マス先へ射撃・会心率+8%" }
  },
  // 無属性武器。属性相性に左右されず、各ランクで安定して扱える。
  { key: "w_iron_dagger", name: "黒鉄の短剣", atkMin: 5, atkMax: 12, durMax: 150, minFloor: 1, rarity: 14, grade: "D", weaponType: "dagger" },
  { key: "w_shadow_stiletto", name: "影縫いのスティレット", atkMin: 7, atkMax: 15, durMax: 132, minFloor: 3, rarity: 10, grade: "C", weaponType: "dagger" },
  { key: "w_sawtooth_dirk", name: "鋸刃のダーク", atkMin: 9, atkMax: 18, durMax: 138, minFloor: 8, rarity: 6, grade: "B", weaponType: "dagger" },
  { key: "w_moon_fang", name: "月牙の短剣", atkMin: 11, atkMax: 22, durMax: 144, minFloor: 13, rarity: 3, grade: "A", weaponType: "dagger" },
  { key: "w_assassin_requiem", name: "暗殺刃レクイエム", atkMin: 13, atkMax: 25, durMax: 156, minFloor: 21, rarity: 1, grade: "S", weaponType: "dagger" },
  { key: "w_soldier_blade", name: "兵士の直剣", atkMin: 6, atkMax: 14, durMax: 180, minFloor: 1, rarity: 14, grade: "D", weaponType: "longsword" },
  { key: "w_knight_sword", name: "騎士剣アルディオン", atkMin: 8, atkMax: 17, durMax: 210, minFloor: 3, rarity: 11, grade: "C", weaponType: "longsword" },
  { key: "w_rune_saber", name: "ルーン鋼剣", atkMin: 10, atkMax: 21, durMax: 198, minFloor: 8, rarity: 6, grade: "B", weaponType: "longsword" },
  { key: "w_paladin_edge", name: "聖騎士剣ルミナス", atkMin: 12, atkMax: 25, durMax: 216, minFloor: 13, rarity: 3, grade: "A", weaponType: "longsword" },
  { key: "w_black_oath", name: "黒誓剣モルドレッド", atkMin: 15, atkMax: 29, durMax: 228, minFloor: 21, rarity: 1, grade: "S", weaponType: "longsword" },
  { key: "w_iron_pike", name: "鉄兵のパイク", atkMin: 6, atkMax: 15, durMax: 160, minFloor: 1, rarity: 13, grade: "D", weaponType: "lance" },
  { key: "w_royal_spear", name: "王衛槍レオニス", atkMin: 8, atkMax: 18, durMax: 174, minFloor: 3, rarity: 9, grade: "C", weaponType: "lance" },
  { key: "w_bone_lance", name: "白骨槍グレイヴ", atkMin: 10, atkMax: 20, durMax: 174, minFloor: 8, rarity: 7, grade: "B", weaponType: "lance" },
  { key: "w_drill_lance", name: "穿城槍ドリルギア", atkMin: 12, atkMax: 26, durMax: 186, minFloor: 13, rarity: 3, grade: "A", weaponType: "lance" },
  { key: "w_dragon_lance", name: "竜穿槍バハムート", atkMin: 15, atkMax: 30, durMax: 204, minFloor: 21, rarity: 1, grade: "S", weaponType: "lance" },
  { key: "w_hunter_bow", name: "狩人の長弓", atkMin: 5, atkMax: 13, durMax: 126, minFloor: 1, rarity: 13, grade: "D", weaponType: "bow" },
  { key: "w_composite_bow", name: "複合弓ファルコン", atkMin: 8, atkMax: 17, durMax: 138, minFloor: 3, rarity: 9, grade: "C", weaponType: "bow" },
  { key: "w_blackwood_bow", name: "黒檀弓ナイトレイ", atkMin: 10, atkMax: 21, durMax: 144, minFloor: 8, rarity: 6, grade: "B", weaponType: "bow" },
  { key: "w_royal_bow", name: "王弓レガリア", atkMin: 11, atkMax: 24, durMax: 150, minFloor: 13, rarity: 4, grade: "A", weaponType: "bow" },
  { key: "w_siege_arbalest", name: "攻城弩バリスタ", atkMin: 14, atkMax: 29, durMax: 168, minFloor: 21, rarity: 1, grade: "S", weaponType: "bow" },
  {
    key: "w_blackpowder_handgun",
    name: "黒鉄のハンドガン",
    atkMin: 7,
    atkMax: 16,
    durMax: 126,
    minFloor: 1,
    rarity: 12,
    grade: "D",
    weaponType: "handgun",
    passive: { key: "quickdraw", name: "早撃ち", description: "2マス先へ射撃・会心率+8%" }
  },
  { key: "w_rusted_greatsword", name: "錆びた大剣", atkMin: 7, atkMax: 16, durMax: 195, minFloor: 1, rarity: 12, grade: "D", weaponType: "greatsword" },
  { key: "w_executioner_blade", name: "断罪の処刑剣", atkMin: 10, atkMax: 21, durMax: 210, minFloor: 3, rarity: 8, grade: "C", weaponType: "greatsword" },
  { key: "w_titan_cleaver", name: "巨人断ちタイタンクリーバー", atkMin: 12, atkMax: 25, durMax: 225, minFloor: 8, rarity: 5, grade: "B", weaponType: "greatsword" },
  { key: "w_holy_greatsword", name: "聖堂大剣カテドラル", atkMin: 14, atkMax: 28, durMax: 240, minFloor: 13, rarity: 2, grade: "A", weaponType: "greatsword" },
  {
    key: "w_grand_breaker",
    name: "破城大剣グランバスター",
    atkMin: 14,
    atkMax: 29,
    durMax: 225,
    minFloor: 21,
    rarity: 1,
    grade: "S",
    weaponType: "greatsword",
    passive: { key: "knockback", name: "三撃破砕", description: "3回目の攻撃ごとに敵を1マス押し戻す" }
  },
  ...an
], Vo = {
  fire: { name: "火", color: 16734774, weakTo: "water" },
  thunder: { name: "雷", color: 16769864, weakTo: "ice" },
  water: { name: "水", color: 4172287, weakTo: "thunder" },
  ice: { name: "氷", color: 8579583, weakTo: "fire" },
  dark: { name: "闇", color: 9988059 }
}, Ar = [
  // 通常盾は無属性15種（各グレード3種）＋属性8種（各属性2種）。
  {
    key: "s_iron_round",
    name: "黒鉄の円盾",
    defBonus: 2,
    durMax: 65,
    minFloor: 1,
    rarity: 14,
    grade: "D",
    passive: { key: "brace", name: "踏ん張り", description: "10以上の攻撃ダメージを20%軽減" }
  },
  {
    key: "s_mirror_silver",
    name: "鏡銀の盾",
    defBonus: 3,
    durMax: 55,
    minFloor: 3,
    rarity: 10,
    grade: "C",
    passive: { key: "mirror", name: "鏡避け", description: "15%の確率で攻撃を完全に無効化" }
  },
  {
    key: "s_thorn_guard",
    name: "反撃盾ヴァイン",
    defBonus: 4,
    durMax: 70,
    minFloor: 8,
    rarity: 6,
    grade: "B",
    passive: { key: "thorns", name: "反射棘", description: "受けた攻撃ダメージの10%を敵へ返す" }
  },
  {
    key: "s_chrono_guard",
    name: "時守りの盾クロノス",
    defBonus: 5,
    durMax: 75,
    minFloor: 14,
    rarity: 3,
    grade: "A",
    passive: { key: "perfect_guard", name: "時止め防御", description: "5回に1回、敵の攻撃を完全に無効化" }
  },
  {
    key: "s_seraph_guard",
    name: "聖域盾セラフィム",
    defBonus: 6,
    durMax: 90,
    minFloor: 21,
    rarity: 1,
    grade: "S",
    passive: { key: "recovery", name: "聖域再生", description: "4回攻撃を受けるごとにHPを6回復" }
  },
  // 属性盾4種：色替えではなく、属性ごとに専用の形・名前・原画を持つ。
  {
    key: "s_flame_aegis",
    name: "炎獄盾イグナード",
    defBonus: 3,
    durMax: 60,
    minFloor: 4,
    rarity: 8,
    grade: "C",
    element: "fire",
    passive: { key: "element_guard", name: "火炎障壁", description: "火属性の攻撃に強い" }
  },
  {
    key: "s_tidal_aegis",
    name: "海淵盾ネレイア",
    defBonus: 3,
    durMax: 64,
    minFloor: 4,
    rarity: 8,
    grade: "C",
    element: "water",
    passive: { key: "element_guard", name: "水流障壁", description: "水属性の攻撃に強い" }
  },
  {
    key: "s_storm_aegis",
    name: "雷皇盾ヴォルテクス",
    defBonus: 4,
    durMax: 62,
    minFloor: 8,
    rarity: 6,
    grade: "B",
    element: "thunder",
    passive: { key: "element_guard", name: "雷電障壁", description: "雷属性の攻撃に強い" }
  },
  {
    key: "s_frost_aegis",
    name: "氷城盾グレイシア",
    defBonus: 4,
    durMax: 70,
    minFloor: 8,
    rarity: 6,
    grade: "B",
    element: "ice",
    passive: { key: "element_guard", name: "氷雪障壁", description: "氷属性の攻撃に強い" }
  },
  {
    key: "s_oak_guard",
    name: "樫の護盾",
    defBonus: 2,
    durMax: 85,
    minFloor: 1,
    rarity: 14,
    grade: "D",
    passive: { key: "oak_guard", name: "小傷払い", description: "8以下の攻撃ダメージを2軽減（最低1）" }
  },
  {
    key: "s_scout_guard",
    name: "斥候の軽盾",
    defBonus: 2,
    durMax: 55,
    minFloor: 1,
    rarity: 14,
    grade: "D",
    passive: { key: "scout_guard", name: "身かわしの拍子", description: "4回目ごとの攻撃ダメージを50%軽減" }
  },
  {
    key: "s_steel_bastion",
    name: "鋼壁盾バスティオン",
    defBonus: 4,
    durMax: 95,
    minFloor: 3,
    rarity: 10,
    grade: "C",
    passive: { key: "flat_guard", name: "鋼板装甲", description: "攻撃ダメージを常に2軽減（最低1）" }
  },
  {
    key: "s_pilgrim_guard",
    name: "巡礼盾グレイス",
    defBonus: 4,
    durMax: 70,
    minFloor: 3,
    rarity: 10,
    grade: "C",
    passive: { key: "pilgrim_heal", name: "巡礼の祈り", description: "4回攻撃を受けるごとにHPを3回復" }
  },
  {
    key: "s_duelist_guard",
    name: "決闘盾リポスト",
    defBonus: 6,
    durMax: 85,
    minFloor: 8,
    rarity: 6,
    grade: "B",
    passive: { key: "duelist_parry", name: "受け流し", description: "3回目ごとの攻撃ダメージを50%軽減" }
  },
  {
    key: "s_watchman_guard",
    name: "番人盾ウォーデン",
    defBonus: 6,
    durMax: 100,
    minFloor: 8,
    rarity: 6,
    grade: "B",
    passive: { key: "neutral_guard", name: "無色の守り", description: "無属性の敵からの攻撃ダメージを20%軽減" }
  },
  {
    key: "s_sun_guard",
    name: "陽光盾ソレイユ",
    defBonus: 8,
    durMax: 110,
    minFloor: 14,
    rarity: 3,
    grade: "A",
    passive: { key: "sun_guard", name: "健勝の障壁", description: "HPが70%以上のとき攻撃ダメージを25%軽減" }
  },
  {
    key: "s_moon_guard",
    name: "月影盾ルナヴェール",
    defBonus: 8,
    durMax: 100,
    minFloor: 14,
    rarity: 3,
    grade: "A",
    passive: { key: "moon_guard", name: "窮地の月光", description: "HPが40%以下のとき攻撃ダメージを35%軽減" }
  },
  {
    key: "s_requiem_guard",
    name: "鎮魂盾レクイエム",
    defBonus: 10,
    durMax: 125,
    minFloor: 21,
    rarity: 1,
    grade: "S",
    passive: { key: "requiem_guard", name: "魂の応報", description: "攻撃ダメージを15%軽減し、軽減後の10%を反射" }
  },
  {
    key: "s_prism_guard",
    name: "万華盾プリズマ",
    defBonus: 10,
    durMax: 130,
    minFloor: 21,
    rarity: 1,
    grade: "S",
    passive: { key: "prism_guard", name: "万色の結界", description: "属性を持つ敵からの攻撃ダメージを25%軽減" }
  },
  {
    key: "s_ember_guard",
    name: "鳳炎盾フェニクス",
    defBonus: 8,
    durMax: 110,
    minFloor: 14,
    rarity: 3,
    grade: "A",
    element: "fire",
    passive: { key: "ember_retort", name: "鳳凰の返火", description: "火属性に強い。受けた攻撃ダメージの15%を反射" }
  },
  {
    key: "s_pearl_guard",
    name: "真珠盾マリステラ",
    defBonus: 8,
    durMax: 115,
    minFloor: 14,
    rarity: 3,
    grade: "A",
    element: "water",
    passive: { key: "pearl_mend", name: "癒やしの潮", description: "水属性に強い。3回攻撃を受けるごとにHPを4回復" }
  },
  {
    key: "s_thunder_crown",
    name: "雷冠盾インドラ",
    defBonus: 10,
    durMax: 125,
    minFloor: 21,
    rarity: 1,
    grade: "S",
    element: "thunder",
    passive: { key: "thunder_parry", name: "雷閃防御", description: "雷属性に強い。4回目ごとの攻撃を完全に無効化" }
  },
  {
    key: "s_glacier_guard",
    name: "氷皇盾アイスベルク",
    defBonus: 10,
    durMax: 145,
    minFloor: 21,
    rarity: 1,
    grade: "S",
    element: "ice",
    passive: { key: "glacier_guard", name: "氷壁の重層", description: "氷属性に強い。12以上の攻撃ダメージを20%軽減" }
  },
  {
    key: "s_arcadia_guard",
    name: "漆黒の盾ルファルゼント",
    defBonus: 16,
    durMax: 300,
    minFloor: 1,
    rarity: 1,
    grade: "SSS",
    initialPlus: 10,
    exclusiveLoot: !0,
    passive: { key: "arcadia_guard", name: "堕天の裁き", description: "受けた攻撃ダメージの20%を反射。3回目ごとの攻撃を完全に無効化" }
  },
  ...Tr
], on = {
  skill_drink: { name: "スキルドリンク", desc: "スキルを即時チャージし、待ち歩数を0にする。通常MOBから3%でドロップ。", textureKey: "i_skill_drink" },
  potion: { name: "回復ポーション", desc: "HPを40回復する", textureKey: "i_potion" },
  torch: { name: "松明", desc: "10ターンの間、壁の向こうまで明るくする", textureKey: "i_torch" },
  mystery_bread: { name: "ふしぎパン", desc: "HP全回復。装備中の武器・盾を全修復し+1強化。さらに予備からランダムで武器最大2本・盾最大2個を全修復し、それぞれ+1強化（重複なし）。", textureKey: "i_mystery_bread" },
  dynamite: { name: "ダイナマイト", desc: "周囲の通常敵を爆風で一撃撃破。ボスには残りHPの10%の固定ダメージ。自分は無傷。", textureKey: "i_dynamite" },
  warp: { name: "リコールベル", desc: "今いる階のスタート位置へ戻る", textureKey: "i_warp" },
  revive: { name: "復活のタネ", desc: "倒れた時に一度だけ復活", textureKey: "i_revive" },
  candykey: { name: "お菓子のカギ", desc: "収穫城の金扉を開ける。敵から1%で入手。1回で1個消費", textureKey: "i_candykey" },
  floorkey: { name: "フロアキー", desc: "豪華な宝物庫の金扉を開ける。1回で1個消費", textureKey: "i_floorkey" },
  seal: { name: "封印の魔導書", desc: "周囲の敵を数ターン止める", textureKey: "i_seal" },
  stone: { name: "武器強化スクロール", desc: "武器を最大+15まで強化。成功率90%から2ポイントずつ低下（最低60%）。失敗しても装備・強化値は残り、巻物だけ消費", textureKey: "i_stone" },
  shieldstone: { name: "防具強化スクロール", desc: "盾を最大+15まで強化。成功率90%から2ポイントずつ低下（最低60%）。失敗しても装備・強化値は残り、巻物だけ消費", textureKey: "i_shieldstone" },
  slime_scroll: { name: "スライム変身スクロール", desc: "30ターンの間スライムへ変身。装備効果を引き継ぎ、攻撃力+5%・防御力+1", textureKey: "i_slime_scroll" },
  boss5_scroll: { name: "封印王アウレリウス変身スクロール", desc: "30ターンの間「封印王アウレリウス」へ変身。装備効果を引き継ぎ、攻撃力+10%・防御力+3", textureKey: "i_boss5_scroll" },
  invis: { name: "透明ポーション", desc: "20ターンの間、敵から完全に見えなくなる", textureKey: "i_invis" },
  repair: { name: "装備修復石", desc: "選んだ武器か盾1つの耐久を50回復（最大耐久まで）", textureKey: "i_repair" }
};
function Tt(t) {
  return { kind: t, ...on[t] };
}
const zo = {
  m_mush: "fire",
  m_mole: "thunder",
  m_jelly: "water",
  m_ghost: "ice",
  m_gear: "thunder",
  m_vine: "water",
  m_mud: "water",
  m_moss: "water",
  m_bat: "ice",
  m_imp: "thunder",
  m_snake: "water",
  m_skel: "ice",
  m_archer: "thunder",
  m_ember_drake: "fire",
  m_frost_wyrm: "ice",
  m_storm_wyvern: "thunder",
  m_brass_dragon: "fire",
  m_void_drake: "thunder",
  m_bone_dragon: "ice",
  m_horn_demon: "fire",
  m_chain_demon: "thunder",
  m_flame_gargoyle: "fire",
  m_abyss_hound: "ice",
  m_mask_fiend: "thunder",
  m_archdemon: "fire",
  m_bone_hound: "thunder",
  m_skeleton_mage: "ice",
  m_death_knight: "thunder",
  m_lich: "ice",
  m_bone_colossus: "fire",
  m_grave_crawler: "water",
  m_cerberus: "fire",
  m_hydra: "water",
  m_crystal_crab: "ice",
  m_blood_moth: "fire",
  m_clockwork_chimera: "thunder",
  m_slime: "thunder",
  m_beetle: "thunder",
  m_wisp: "fire",
  m_spider: "water",
  m_golem: "thunder",
  m_eye: "thunder",
  m_wraith: "ice",
  m_reaper: "fire",
  m_dark_ninja: "thunder",
  m_obsidian_shogun: "fire",
  m_storm_minotaur: "thunder",
  m_star_griffin: "ice",
  m_lucky_rabbit: "fire",
  m_guard: "ice",
  m_watcher: "thunder"
}, wt = {
  m_mush: { kind: "lantern", text: "撃破すると5ターンの間、壁の向こうまで明るくなる。" },
  m_mole: { kind: "burrow", text: "3回目の行動で地中へ潜り、次の行動で近くへ奇襲する。" },
  m_jelly: { kind: "split", text: "最初の撃破時に小型ゼリー2体へ分裂する。" },
  m_ghost: { kind: "phase", text: "普段は被ダメージを軽減し、攻撃直後だけ実体化する。" },
  m_gear: { kind: "shell_guard", text: "正面からのダメージを半減し、攻撃後だけ甲羅が開く。" },
  m_vine: { kind: "vine_trail", text: "3歩ごとに踏むと足止めされるツタを残す。" },
  m_mud: { kind: "mud_bind", text: "攻撃を受けると足を取られ、次の移動が止まる。" },
  m_moss: { kind: "regen", text: "ダメージを受けていない間、3ターンごとにHPを回復する。" },
  m_bat: { kind: "shatter", text: "撃破時に隣接していると氷片のダメージを受ける。" },
  m_imp: { kind: "stance", text: "攻撃重視と防御重視の姿勢を毎ターン切り替える。" },
  m_snake: { kind: "key_drop", text: "他の通常MOBと同じく、撃破時に0.5%でフロアキーを落とす。" },
  m_skel: { kind: "freeze_shot", text: "氷弾が低確率で足止めを与える。" },
  m_archer: { kind: "sidestep", text: "射撃後に横へ移動して射線を変える。" },
  m_ember_drake: { kind: "fire_breath", text: "3回に1回、通常攻撃が強い火炎ブレスになる。" },
  m_frost_wyrm: { kind: "ice_trail", text: "3歩ごとに滑る氷床を残す。" },
  m_storm_wyvern: { kind: "storm_trail", text: "3歩ごとに雷床を残し、踏んだ相手へダメージを与える。" },
  m_brass_dragon: { kind: "heat", text: "行動するたび加熱し、3回目の攻撃が強化される。" },
  m_void_drake: { kind: "warp", text: "4ターンごとにプレイヤーの近くへ転移する。" },
  m_bone_dragon: { kind: "revive", text: "一度だけHP25%で復活するが、防御が大きく低下する。" },
  m_giant_bull: { kind: "enrage", text: "HP半分以下で攻撃力が上昇する。" },
  m_horn_demon: { kind: "enrage", text: "HP半分以下で攻撃力が上昇する。" },
  m_chain_demon: { kind: "pull", text: "同じ縦横の近距離にいる相手を1マス引き寄せる。" },
  m_flame_gargoyle: { kind: "statue", text: "離れている間は石像化して被ダメージを軽減する。" },
  m_abyss_hound: { kind: "rush", text: "直線上の相手へ2マス突進する。" },
  m_mask_fiend: { kind: "item_seal", text: "攻撃時にアイテムを2ターン封印することがある。" },
  m_archdemon: { kind: "summon", text: "HP半分で双角デーモンを1体召喚する。" },
  m_bone_hound: { kind: "shell_guard", text: "正面攻撃を軽減し、直進中はさらに硬くなる。" },
  m_skeleton_mage: { kind: "root", text: "近距離の相手へ根を伸ばし、移動を封じる。" },
  m_death_knight: { kind: "knight_guard", text: "正面攻撃を半減し、攻撃後だけ隙ができる。" },
  m_lich: { kind: "necromancy", text: "HP半分で墓這いを最大2体召喚する。" },
  m_bone_colossus: { kind: "heat_aura", text: "隣接している相手へ毎ターン熱ダメージを与える。" },
  m_grave_crawler: { kind: "ambush", text: "普段は地中に隠れ、接近すると姿を現す。" },
  m_cerberus: { kind: "multi_bite", text: "3回に1回、三つ首による強力な連続攻撃を行う。" },
  m_hydra: { kind: "hydra_regen", text: "毎ターンHPを回復する。火属性で攻撃されると3ターン停止する。" },
  m_crystal_crab: { kind: "rear_weak", text: "正面は硬いが、背後から受けるダメージが増える。" },
  m_blood_moth: { kind: "vampire", text: "与えたダメージの一部を吸収して回復する。" },
  m_clockwork_chimera: { kind: "element_cycle", text: "攻撃属性を火・氷・雷の順に切り替える。" },
  m_slime: { kind: "mimic", text: "宝箱に擬態し、近づくまで動かず姿も暗い。" },
  m_beetle: { kind: "charge", text: "1ターン溜めてから直線を最大3マス突進する。" },
  m_wisp: { kind: "death_burst", text: "撃破時に隣接していると炎の爆発ダメージを受ける。" },
  m_spider: { kind: "web_trail", text: "3歩ごとに踏むと足止めされる糸を設置する。" },
  m_golem: { kind: "golem_guard", text: "正面攻撃を半減し、攻撃後は一時的に防御が崩れる。" },
  m_eye: { kind: "laser_lock", text: "照準を表示してから次のターンに直線レーザーを放つ。" },
  m_wraith: { kind: "wraith_phase", text: "普段は攻撃をほぼ無効化し、攻撃直後だけ実体化する。" },
  m_reaper: { kind: "execute", text: "相手のHPが30%以下になると攻撃力が上昇する。" },
  m_dark_ninja: { kind: "stealth", text: "ほぼ透明で3歩ごとに姿を見せ、露出中は受けるダメージが増える。" },
  m_obsidian_shogun: { kind: "parry", text: "3回に1回、正面攻撃を受け流して反撃する。" },
  m_storm_minotaur: { kind: "bull_charge", text: "直線上の相手へ突進し、壁際で止まると隙ができる。" },
  m_star_griffin: { kind: "starfall", text: "3回に1回、凍てつく星弾を降らせる。" },
  m_lucky_rabbit: { kind: "treasure_flee", text: "攻撃せず逃走し、撃破で1000Gと属性付きSS武器を落とす。" },
  m_guard: { kind: "guardian", text: "正面攻撃を半減し、通路を塞いで追跡する。" },
  m_watcher: { kind: "core_laser", text: "照準後に四方向へ回転レーザーを放つ。" }
}, Go = [
  {
    key: "m_giant_bull",
    name: "巨角の猛牛",
    description: "黒い毛並みと巨大な角を持つ遺跡の猛牛。一直線の突進を横へ避け、壁に激突した隙に反撃しよう。",
    hp: 25,
    atkMin: 5,
    atkMax: 11,
    def: 3,
    exp: 6,
    gold: 7,
    minFloor: 10,
    maxFloor: 10,
    behavior: "chase",
    isBoss: !0,
    color: 13208402
  },
  {
    key: "m_mush",
    name: "ランタンマッシュ",
    hp: 18,
    atkMin: 3,
    atkMax: 7,
    def: 1,
    exp: 4,
    gold: 3,
    minFloor: 1,
    maxFloor: 10,
    behavior: "chase",
    color: 9071615
  },
  {
    key: "m_mole",
    name: "時計モグラ",
    hp: 26,
    atkMin: 5,
    atkMax: 10,
    def: 6,
    exp: 6,
    gold: 5,
    minFloor: 2,
    maxFloor: 14,
    behavior: "slow",
    color: 10254922
  },
  {
    key: "m_jelly",
    name: "ゼリークラウン",
    hp: 22,
    atkMin: 4,
    atkMax: 8,
    def: 2,
    exp: 5,
    gold: 20,
    minFloor: 1,
    maxFloor: 12,
    behavior: "chase",
    color: 5230816
  },
  {
    key: "m_ghost",
    name: "ループゴースト",
    hp: 20,
    atkMin: 5,
    atkMax: 9,
    def: 3,
    exp: 6,
    gold: 6,
    minFloor: 3,
    maxFloor: 16,
    behavior: "loop",
    wallPass: !0,
    color: 7031434
  },
  {
    key: "m_gear",
    name: "歯車ガメ",
    hp: 34,
    atkMin: 6,
    atkMax: 11,
    def: 9,
    exp: 8,
    gold: 8,
    minFloor: 4,
    maxFloor: 20,
    behavior: "slow",
    color: 6978138
  },
  {
    key: "m_vine",
    name: "ツタホイール",
    hp: 28,
    atkMin: 6,
    atkMax: 12,
    def: 4,
    exp: 7,
    gold: 6,
    minFloor: 5,
    maxFloor: 20,
    behavior: "line",
    color: 5933642
  },
  {
    key: "m_mud",
    name: "ドロぐち",
    hp: 30,
    atkMin: 7,
    atkMax: 13,
    def: 3,
    exp: 8,
    gold: 10,
    minFloor: 6,
    maxFloor: 22,
    behavior: "chase",
    color: 8018490
  },
  {
    key: "m_moss",
    name: "モスナイト",
    hp: 40,
    atkMin: 8,
    atkMax: 14,
    def: 10,
    exp: 10,
    gold: 12,
    minFloor: 8,
    maxFloor: 24,
    behavior: "chase",
    color: 4880970
  },
  {
    key: "m_bat",
    name: "クリスタルコウモリ",
    hp: 24,
    atkMin: 6,
    atkMax: 12,
    def: 3,
    exp: 8,
    gold: 8,
    minFloor: 10,
    maxFloor: 26,
    behavior: "random",
    ranged: !0,
    color: 5222655
  },
  {
    key: "m_imp",
    name: "スイッチインプ",
    hp: 26,
    atkMin: 6,
    atkMax: 11,
    def: 4,
    exp: 8,
    gold: 9,
    minFloor: 11,
    maxFloor: 26,
    behavior: "chase",
    color: 5917322
  },
  {
    key: "m_snake",
    name: "カギヘビ",
    hp: 30,
    atkMin: 7,
    atkMax: 13,
    def: 5,
    exp: 9,
    gold: 14,
    minFloor: 9,
    maxFloor: 24,
    behavior: "chase",
    color: 3840618
  },
  {
    key: "m_skel",
    name: "蒼灯フクロウ",
    description: "青い灯火を吊るし、上空から氷弾を放つ機械フクロウ。",
    hp: 32,
    atkMin: 8,
    atkMax: 15,
    def: 5,
    exp: 10,
    gold: 10,
    minFloor: 12,
    maxFloor: 28,
    behavior: "ranged",
    ranged: !0,
    wallPass: !0,
    color: 5230847
  },
  {
    key: "m_archer",
    name: "ギアホーネット",
    description: "小型の弩を抱え、雷を帯びた針で遠距離を射抜く機巧蜂。",
    hp: 26,
    atkMin: 7,
    atkMax: 14,
    def: 4,
    exp: 9,
    gold: 10,
    minFloor: 5,
    maxFloor: 26,
    behavior: "ranged",
    ranged: !0,
    wallPass: !0,
    color: 13672765
  },
  // ===== 深層獣群アップデート（新規23種） =====
  {
    key: "m_ember_drake",
    name: "火鱗の幼竜",
    hp: 28,
    atkMin: 5,
    atkMax: 10,
    def: 4,
    exp: 7,
    gold: 8,
    minFloor: 4,
    maxFloor: 13,
    behavior: "chase",
    isDragonType: !0,
    color: 14174762
  },
  {
    key: "m_frost_wyrm",
    name: "氷晶ワーム",
    hp: 34,
    atkMin: 7,
    atkMax: 13,
    def: 5,
    exp: 9,
    gold: 10,
    minFloor: 8,
    maxFloor: 18,
    behavior: "loop",
    ranged: !0,
    isDragonType: !0,
    color: 6473983
  },
  {
    key: "m_storm_wyvern",
    name: "雷翼ワイバーン",
    hp: 40,
    atkMin: 9,
    atkMax: 16,
    def: 6,
    exp: 12,
    gold: 13,
    minFloor: 12,
    maxFloor: 23,
    behavior: "line",
    ranged: !0,
    isDragonType: !0,
    color: 3640831
  },
  {
    key: "m_brass_dragon",
    name: "真鍮竜ギアドラス",
    hp: 58,
    atkMin: 11,
    atkMax: 19,
    def: 13,
    exp: 17,
    gold: 20,
    minFloor: 15,
    maxFloor: 26,
    behavior: "slow",
    isDragonType: !0,
    color: 13077042
  },
  {
    key: "m_void_drake",
    name: "虚空ドレイク",
    hp: 60,
    atkMin: 14,
    atkMax: 23,
    def: 9,
    exp: 20,
    gold: 24,
    minFloor: 20,
    maxFloor: 29,
    behavior: "loop",
    ranged: !0,
    wallPass: !0,
    isDragonType: !0,
    color: 8010705
  },
  {
    key: "m_bone_dragon",
    name: "骨竜スカルヴァーン",
    hp: 74,
    atkMin: 16,
    atkMax: 26,
    def: 12,
    exp: 25,
    gold: 28,
    minFloor: 23,
    maxFloor: 29,
    behavior: "chase",
    isElite: !0,
    isDragonType: !0,
    color: 14206883
  },
  {
    key: "m_horn_demon",
    name: "双角デーモン",
    hp: 25,
    atkMin: 5,
    atkMax: 11,
    def: 3,
    exp: 6,
    gold: 7,
    minFloor: 3,
    maxFloor: 13,
    behavior: "chase",
    color: 12990520
  },
  {
    key: "m_chain_demon",
    name: "鎖獄の悪魔",
    hp: 36,
    atkMin: 7,
    atkMax: 14,
    def: 6,
    exp: 10,
    gold: 11,
    minFloor: 7,
    maxFloor: 19,
    behavior: "line",
    color: 8205391
  },
  {
    key: "m_flame_gargoyle",
    name: "焔ガーゴイル",
    hp: 46,
    atkMin: 9,
    atkMax: 17,
    def: 12,
    exp: 13,
    gold: 14,
    minFloor: 11,
    maxFloor: 22,
    behavior: "slow",
    color: 6117976
  },
  {
    key: "m_abyss_hound",
    name: "奈落の魔犬",
    hp: 35,
    atkMin: 10,
    atkMax: 18,
    def: 5,
    exp: 13,
    gold: 15,
    minFloor: 14,
    maxFloor: 25,
    behavior: "chase",
    color: 3224942
  },
  {
    key: "m_mask_fiend",
    name: "仮面の魔人",
    hp: 42,
    atkMin: 12,
    atkMax: 20,
    def: 6,
    exp: 16,
    gold: 18,
    minFloor: 17,
    maxFloor: 28,
    behavior: "ranged",
    ranged: !0,
    wallPass: !0,
    color: 7488936
  },
  {
    key: "m_archdemon",
    name: "大悪魔アスモル",
    hp: 82,
    atkMin: 17,
    atkMax: 28,
    def: 14,
    exp: 29,
    gold: 34,
    minFloor: 24,
    maxFloor: 29,
    behavior: "chase",
    isElite: !0,
    color: 11938093
  },
  {
    key: "m_bone_hound",
    name: "鉄殻アルマジロ",
    description: "分厚い鉄殻を丸め、雷をまとって一直線に突進する装甲獣。",
    hp: 34,
    atkMin: 7,
    atkMax: 13,
    def: 9,
    exp: 9,
    gold: 9,
    minFloor: 5,
    maxFloor: 15,
    behavior: "line",
    color: 5203568
  },
  {
    key: "m_skeleton_mage",
    name: "ルーンマンドラゴラ",
    description: "浮遊するルーン石を操り、根を張ったまま氷の術を放つ魔草。",
    hp: 30,
    atkMin: 7,
    atkMax: 15,
    def: 4,
    exp: 10,
    gold: 12,
    minFloor: 9,
    maxFloor: 20,
    behavior: "ranged",
    ranged: !0,
    color: 9066685
  },
  {
    key: "m_death_knight",
    name: "死霊騎士",
    hp: 52,
    atkMin: 12,
    atkMax: 21,
    def: 13,
    exp: 18,
    gold: 20,
    minFloor: 15,
    maxFloor: 26,
    behavior: "chase",
    color: 3422540
  },
  {
    key: "m_lich",
    name: "リッチロード",
    hp: 66,
    atkMin: 15,
    atkMax: 25,
    def: 10,
    exp: 24,
    gold: 30,
    minFloor: 22,
    maxFloor: 29,
    behavior: "ranged",
    ranged: !0,
    wallPass: !0,
    isElite: !0,
    color: 6504094
  },
  {
    key: "m_bone_colossus",
    name: "溶鉱炉タイタン",
    description: "炉心の炎で巨体を動かし、灼熱の鉄拳を振り下ろす機械巨人。",
    hp: 86,
    atkMin: 15,
    atkMax: 25,
    def: 17,
    exp: 27,
    gold: 30,
    minFloor: 20,
    maxFloor: 29,
    behavior: "slow",
    isElite: !0,
    color: 13200178
  },
  {
    key: "m_grave_crawler",
    name: "墓這い",
    hp: 16,
    atkMin: 4,
    atkMax: 9,
    def: 1,
    exp: 4,
    gold: 4,
    minFloor: 2,
    maxFloor: 12,
    behavior: "line",
    color: 9142383
  },
  {
    key: "m_cerberus",
    name: "三首獄犬",
    hp: 68,
    atkMin: 14,
    atkMax: 24,
    def: 10,
    exp: 22,
    gold: 25,
    minFloor: 18,
    maxFloor: 29,
    behavior: "chase",
    isElite: !0,
    color: 10366760
  },
  {
    key: "m_hydra",
    name: "深淵ヒュドラ",
    hp: 76,
    atkMin: 15,
    atkMax: 26,
    def: 13,
    exp: 25,
    gold: 28,
    minFloor: 21,
    maxFloor: 29,
    behavior: "ranged",
    ranged: !0,
    isDragonType: !0,
    color: 3555229
  },
  {
    key: "m_crystal_crab",
    name: "晶甲クラブ",
    hp: 44,
    atkMin: 6,
    atkMax: 12,
    def: 15,
    exp: 11,
    gold: 16,
    minFloor: 7,
    maxFloor: 18,
    behavior: "slow",
    color: 2320296
  },
  {
    key: "m_blood_moth",
    name: "血月モス",
    hp: 28,
    atkMin: 8,
    atkMax: 15,
    def: 4,
    exp: 11,
    gold: 13,
    minFloor: 10,
    maxFloor: 23,
    behavior: "random",
    ranged: !0,
    wallPass: !0,
    color: 10104654
  },
  {
    key: "m_clockwork_chimera",
    name: "機巧キマイラ",
    hp: 78,
    atkMin: 16,
    atkMax: 27,
    def: 15,
    exp: 27,
    gold: 32,
    minFloor: 23,
    maxFloor: 29,
    behavior: "line",
    isElite: !0,
    color: 11565872
  },
  // ===== 追加モンスター（種類を増やす）=====
  {
    key: "m_slime",
    name: "ミミックチェスト",
    description: "宝箱に擬態し、近づいた冒険者へ雷を帯びた長い舌で襲いかかる。",
    hp: 20,
    atkMin: 4,
    atkMax: 9,
    def: 3,
    exp: 5,
    gold: 10,
    minFloor: 1,
    maxFloor: 8,
    behavior: "chase",
    color: 8079928
  },
  {
    key: "m_beetle",
    name: "ゼンマイ甲虫",
    hp: 24,
    atkMin: 5,
    atkMax: 9,
    def: 7,
    exp: 6,
    gold: 6,
    minFloor: 3,
    maxFloor: 16,
    behavior: "line",
    color: 12618298
  },
  {
    key: "m_wisp",
    name: "迷い火ウィスプ",
    hp: 16,
    atkMin: 5,
    atkMax: 10,
    def: 2,
    exp: 7,
    gold: 7,
    minFloor: 4,
    maxFloor: 18,
    behavior: "loop",
    wallPass: !0,
    color: 16752448
  },
  {
    key: "m_spider",
    name: "カラクリ蜘蛛",
    hp: 30,
    atkMin: 7,
    atkMax: 12,
    def: 5,
    exp: 9,
    gold: 9,
    minFloor: 7,
    maxFloor: 22,
    behavior: "chase",
    color: 9067130
  },
  {
    key: "m_golem",
    name: "鉄塊ゴーレム",
    hp: 55,
    atkMin: 10,
    atkMax: 18,
    def: 13,
    exp: 14,
    gold: 16,
    minFloor: 12,
    maxFloor: 26,
    behavior: "slow",
    color: 8026762
  },
  {
    key: "m_eye",
    name: "監視の眼",
    hp: 30,
    atkMin: 9,
    atkMax: 16,
    def: 4,
    exp: 11,
    gold: 12,
    minFloor: 13,
    maxFloor: 28,
    behavior: "ranged",
    ranged: !0,
    color: 13651872
  },
  {
    key: "m_wraith",
    name: "虚無のレイス",
    hp: 38,
    atkMin: 11,
    atkMax: 19,
    def: 6,
    exp: 14,
    gold: 14,
    minFloor: 18,
    maxFloor: 29,
    behavior: "loop",
    wallPass: !0,
    color: 7033040
  },
  {
    key: "m_reaper",
    name: "深淵の刈手",
    hp: 52,
    atkMin: 14,
    atkMax: 24,
    def: 10,
    exp: 20,
    gold: 22,
    minFloor: 22,
    maxFloor: 29,
    behavior: "chase",
    isDragonType: !0,
    color: 12595296
  },
  {
    key: "m_dark_ninja",
    name: "闇忍者",
    description: "紫の闇へ溶け込み、3歩ごとに一瞬だけ姿を現す双刃の忍者。",
    hp: 44,
    atkMin: 13,
    atkMax: 22,
    def: 8,
    exp: 18,
    gold: 20,
    minFloor: 16,
    maxFloor: 29,
    behavior: "chase",
    isDarkNinja: !0,
    color: 7612600
  },
  {
    key: "m_obsidian_shogun",
    name: "黒曜武者",
    description: "溶岩の亀裂が走る黒曜鎧と大太刀をまとう深層の剣豪。",
    hp: 82,
    atkMin: 17,
    atkMax: 29,
    def: 15,
    exp: 30,
    gold: 36,
    minFloor: 22,
    maxFloor: 29,
    behavior: "chase",
    isElite: !0,
    isDragonType: !0,
    color: 11874340
  },
  {
    key: "m_storm_minotaur",
    name: "紫電ミノタウロス",
    description: "雷を巻いた巨角と戦槌で一直線に押し潰す怪力の魔獣。",
    hp: 76,
    atkMin: 16,
    atkMax: 27,
    def: 13,
    exp: 27,
    gold: 32,
    minFloor: 18,
    maxFloor: 29,
    behavior: "line",
    isElite: !0,
    isDragonType: !0,
    color: 4288232
  },
  {
    key: "m_star_griffin",
    name: "星喰らいグリフォン",
    description: "星光を宿す翼で宙を舞い、凍てつく光弾を降らせる天獣。",
    hp: 64,
    atkMin: 15,
    atkMax: 26,
    def: 10,
    exp: 25,
    gold: 30,
    minFloor: 20,
    maxFloor: 29,
    behavior: "ranged",
    ranged: !0,
    wallPass: !0,
    isElite: !0,
    isDragonType: !0,
    color: 3305192
  },
  {
    key: "m_lucky_rabbit",
    name: "福袋うさぎ",
    description: "宝を満載した光る袋を背負い、戦わず逃げ回る幻の福兎。",
    hp: 36,
    atkMin: 0,
    atkMax: 0,
    def: 3,
    exp: 100,
    gold: 1e3,
    minFloor: 3,
    maxFloor: 29,
    behavior: "random",
    isTreasureRabbit: !0,
    color: 16767053
  },
  {
    key: "m_guard",
    name: "深層の守衛",
    hp: 60,
    atkMin: 12,
    atkMax: 22,
    def: 14,
    exp: 20,
    gold: 25,
    minFloor: 21,
    maxFloor: 30,
    behavior: "chase",
    isElite: !0,
    isDragonType: !0,
    color: 3816026
  },
  {
    key: "m_watcher",
    name: "コアウォッチャー",
    hp: 160,
    atkMin: 18,
    atkMax: 30,
    def: 16,
    exp: 80,
    gold: 100,
    minFloor: 30,
    maxFloor: 30,
    behavior: "ranged",
    ranged: !0,
    isBoss: !0,
    isDragonType: !0,
    color: 2763338
  },
  {
    key: "m_giant_bull",
    name: "巨角の猛牛",
    description: "黒い毛並みと巨大な角を持つ遺跡の猛牛。一直線の突進を横へ避け、壁に激突した隙に反撃しよう。",
    hp: 25,
    atkMin: 5,
    atkMax: 11,
    def: 3,
    exp: 6,
    gold: 7,
    minFloor: 10,
    maxFloor: 10,
    behavior: "chase",
    isBoss: !0,
    color: 13208402
  }
];
Go.map((t) => ({
  ...t,
  element: zo[t.key],
  gimmick: wt[t.key]?.kind,
  gimmickText: wt[t.key]?.text,
  description: [t.description, wt[t.key]?.text ? `【特性】${wt[t.key].text}` : ""].filter(Boolean).join(" ")
}));
const Jo = (t) => `star_${t}`, ln = { D: 1, C: 2, B: 3, A: 4, S: 5, SS: 6, SSS: 7 };
function Yo(t = Fo) {
  const e = t();
  return e < 0.01 ? "rare_drop" : ["hp", "defense", "charge", "potion"][Math.min(3, Math.floor((e - 0.01) / 0.99 * 4))];
}
function rr(t, e) {
  return t?.trait === e ? ln[t.grade] : 0;
}
function Xo(t) {
  const e = ln[t.grade];
  return { hp: `最大HP +${e}`, defense: `追加防御力 +${e}`, charge: `スキルに必要な歩数 -${e}`, potion: `ポーション回復量 +${e}`, rare_drop: `特殊アイテムのドロップ率 ${(1 + e * 0.1).toFixed(1)}倍` }[t.trait];
}
const Qo = ["male", "female"], Rr = ["leather", "chain", "plate", "arcane", "dragon", "dawn", "aqua", "crimson", "pumpkin_male", "pumpkin_female"], ks = [
  "idle",
  "idle2",
  "walk1",
  "walk2",
  "walk3",
  "walk4",
  "walk5",
  "walk6",
  "atkWindup",
  "atkWindup2",
  "atk",
  "atk2",
  "atkFollow",
  "atkRecover",
  "hurt",
  "down"
], bs = 96, cn = "leather", Ft = {
  dawn: { key: "dawn", name: "暁白の聖装", grade: "SS", defBonus: 12, minFloor: 25, exclusiveLoot: !0 },
  crimson: { key: "crimson", name: "紅黒の天聖鎧", grade: "SSS", defBonus: 16, minFloor: 30, exclusiveLoot: !0 },
  aqua: { key: "aqua", name: "蒼白の天聖鎧", grade: "SSS", defBonus: 16, minFloor: 30, exclusiveLoot: !0 },
  leather: { key: "leather", name: "旅人の革装", grade: "D", defBonus: 1, minFloor: 1 },
  chain: { key: "chain", name: "鎖帷子", grade: "C", defBonus: 3, minFloor: 5 },
  plate: { key: "plate", name: "騎士の板金鎧", grade: "B", defBonus: 5, minFloor: 10 },
  arcane: { key: "arcane", name: "秘術装甲", grade: "A", defBonus: 8, minFloor: 17 },
  pumpkin_male: { key: "pumpkin_male", name: "かぼちゃの騎士服（男）", grade: "A", defBonus: 8, minFloor: 1, exclusiveLoot: !0, gender: "male" },
  pumpkin_female: { key: "pumpkin_female", name: "かぼちゃの魔女服（女）", grade: "A", defBonus: 8, minFloor: 1, exclusiveLoot: !0, gender: "female" },
  dragon: { key: "dragon", name: "竜鱗神鎧", grade: "S", defBonus: 12, minFloor: 24 }
}, Zo = { down: 0, left: 1, right: 2, up: 3 };
Qo.flatMap(
  (t) => Rr.filter((e) => !Ft[e].gender || Ft[e].gender === t).map((e) => ({
    gender: t,
    armor: e,
    key: Bt(t, e),
    path: un(t, e)
  }))
);
function Et(t) {
  return typeof t == "string" && Rr.includes(t);
}
function el(t) {
  return `armor_${t}`;
}
function hn(t) {
  const e = Ft[t];
  return {
    key: e.key,
    name: e.name,
    grade: e.grade,
    defBonus: e.defBonus,
    plus: 0,
    trait: Yo()
  };
}
function Bt(t, e = cn) {
  const r = e.startsWith("pumpkin_") ? `pumpkin_${t}` : e;
  return `player_${t}_${r}`;
}
function tt(t, e) {
  return Zo[t] * ks.length + ks.indexOf(e);
}
function un(t, e = "leather") {
  const r = e.startsWith("pumpkin_") ? `pumpkin_${t}` : e;
  return Ut(r.startsWith("pumpkin_") ? `assets/characters/halloween-v1/${t}-${r}.png` : `assets/characters/player-painted-v1/${t}-${r}.png`);
}
function Ut(t) {
  return t.replace(/^assets\/characters\/player-painted-v1\/(male-(?:crimson|aqua)\.png)$/, "assets/characters/hooded-back-v2/$1");
}
const tl = "w_iron_dagger";
class xs {
  name = "チャリ";
  level = 1;
  exp = 0;
  expNext = 20;
  baseHpMax = 100;
  get hpMax() {
    return this.baseHpMax + (this.weapon?.starred ? 50 : 0) + rr(this.armor, "hp");
  }
  set hpMax(e) {
    this.baseHpMax = e - (this.weapon?.starred ? 50 : 0) - rr(this.armor, "hp");
  }
  hp = 100;
  baseAtkMin = 5;
  baseAtkMax = 12;
  baseDef = 3;
  transformationAttackRate = 1;
  transformationDefBonus = 0;
  fountainBlessingFloor = null;
  fountainBlessingPower = 1.1;
  get fountainBlessingRate() {
    return this.fountainBlessingFloor === null ? 1 : this.fountainBlessingPower;
  }
  gold = 0;
  x = 0;
  y = 0;
  dir = "down";
  weapon = null;
  shield = null;
  armor = null;
  inventory = [];
  weapons = [];
  // 所持武器
  shields = [];
  // 所持盾
  armors = [];
  // 所持服・鎧
  poisonTurns = 0;
  reviveReady = !1;
  // 復活のタネ所持で有効化されるフラグ（アイテム所持で判定）
  constructor() {
    this.inventory.push(Tt("potion")), this.inventory.push(Tt("potion")), this.inventory.push(Tt("potion"));
    const e = rt(tl, []);
    this.weapons.push(e), this.weapon = e;
    const r = hn(cn);
    this.armors.push(r), this.armor = r;
  }
  get atkMin() {
    let e = this.baseAtkMin + Math.floor(this.level * 0.6);
    if (this.weapon) {
      e += this.weapon.atkMin, e += (this.weapon.plus ?? 0) * 2;
      for (const r of this.weapon.magics)
        r.code === "A" && (e += r.level);
    }
    return Math.max(1, Math.floor(e * this.transformationAttackRate * this.fountainBlessingRate));
  }
  get atkMax() {
    let e = this.baseAtkMax + this.level;
    if (this.weapon) {
      e += this.weapon.atkMax, e += (this.weapon.plus ?? 0) * 4;
      for (const r of this.weapon.magics)
        r.code === "A" && (e += r.level), r.code === "B" && (e += r.level);
    }
    return Math.max(1, Math.floor(e * this.transformationAttackRate * this.fountainBlessingRate));
  }
  get def() {
    let e = this.baseDef + Math.floor(this.level * 0.4);
    return this.armor && (e += this.armor.defBonus + (this.armor.plus ?? 0) + rr(this.armor, "defense")), this.shield && this.shield.dur > 0 && (e += this.shield.defBonus + (this.shield.plus ?? 0)), Math.floor((e + this.transformationDefBonus) * this.fountainBlessingRate);
  }
  hasMagic(e) {
    return this.weapon?.magics.find((r) => r.code === e);
  }
  addExp(e) {
    this.exp += e;
    let r = !1;
    for (; this.exp >= this.expNext; )
      this.exp -= this.expNext, this.level++, this.hpMax += 12, this.hp = this.hpMax, this.expNext = Math.floor(this.expNext * 1.35 + 8), r = !0;
    return r;
  }
  heal(e) {
    this.hp = Math.min(this.hpMax, this.hp + e);
  }
}
function rt(t, e) {
  e = e.filter((a) => a.code !== "K");
  const r = Jt.find((a) => a.key === t);
  let s = r.durMax, n = r.atkMin, i = r.atkMax;
  for (const a of e)
    a.code === "H" && (s += a.level * 15);
  return {
    key: r.key,
    name: r.name,
    atkMin: n,
    atkMax: i,
    durMax: s,
    dur: s,
    magics: e,
    grade: r.grade,
    plus: r.initialPlus ?? 0,
    dual: r.dual,
    weaponType: r.weaponType,
    element: r.element,
    ss: r.ss,
    passive: r.passive ? { ...r.passive } : void 0,
    specialCounter: 0
  };
}
function Ht(t, e) {
  const r = Ar.find((l) => l.key === t), s = r.grade, n = { D: 0, C: 1, B: 2, A: 3, S: 4, SS: 5, SSS: 4 }[s], i = Math.max(r.defBonus, 2 + n * 2), a = Math.max(r.durMax, 40 + n * 15);
  return {
    key: r.key,
    name: r.name,
    defBonus: i,
    durMax: a,
    dur: a,
    grade: s,
    plus: r.initialPlus ?? 0,
    element: r.element,
    passive: { ...r.passive },
    guardCounter: 0
  };
}
function rl(t) {
  return t.grade === "SSS" ? "SSS" : t.ss ? "SS" : t.grade;
}
const sr = ["walk1", "walk2", "walk3", "walk4", "walk5", "walk6"], sl = ["atk", "atk2", "atkFollow", "atkRecover"];
function qt(t) {
  return t.startsWith("walk") ? "walk" : t.startsWith("atkWindup") ? "windup" : t.startsWith("atk") ? "attack" : t === "idle2" ? "idle" : t;
}
class nl {
  action = "idle";
  since = 0;
  walkFrameMs = 48;
  attackFrameMs = 26;
  windupFrameMs = 29;
  walkPhase = 0;
  stoppedWalkingAt = -1 / 0;
  play(e, r) {
    const s = qt(e);
    s === this.action && s !== "windup" && s !== "attack" && s !== "hurt" || (this.action === "walk" && (this.walkPhase = (this.walkPhase + Math.max(0, r - this.since) / this.walkFrameMs) % sr.length, this.stoppedWalkingAt = r), s === "walk" && r - this.stoppedWalkingAt > 200 && (this.walkPhase = 0), this.action = s, this.since = r);
  }
  sample(e) {
    const r = Math.max(0, e - this.since);
    switch (this.action) {
      case "walk":
        return sr[Math.floor(this.walkPhase + r / this.walkFrameMs) % sr.length];
      case "windup":
        return r < this.windupFrameMs ? "atkWindup" : "atkWindup2";
      case "attack":
        return sl[Math.min(3, Math.floor(r / this.attackFrameMs))];
      case "idle":
        return r % 1800 < 1100 ? "idle" : "idle2";
      default:
        return this.action;
    }
  }
}
const Le = 150, il = ["walk1", "walk2", "walk3", "walk4", "walk5", "walk6"], Ss = 96;
function al(t, e, r) {
  const s = Math.max(0, Math.min(1, e)), n = t / Ss * Math.PI * 2, i = Math.sin(n);
  return {
    frame: il[(Math.floor(t / Ss * 6) % 6 + 6) % 6],
    bob: -2.6 * (1 - Math.abs(i)) * s,
    sway: 0.8 * i * s,
    angle: ((r === "left" ? -2.2 : r === "right" ? 2.2 : 0) + i * 1.5) * s,
    leftFoot: 0.17 + 0.17 * Math.max(0, i) * s,
    rightFoot: 0.17 + 0.17 * Math.max(0, -i) * s,
    footOffset: 2 * i * s
  };
}
const ol = {
  katana: { name: "風牙", description: "前方3マスに竜巻を送り、敵を空いているマスへ1マス押し戻す。成功した敵1体につき次のチャージを5歩短縮", color: 10284784, chargeSteps: 100, range: 3, multiplier: 1.35, sound: "skillLance" },
  dagger: { name: "零刻領域", description: "5ターン時間停止。終了時に正面を攻撃。背後なら先に敵最大HPの5%固定ダメージ、その後に通常攻撃2倍", color: 12094719, chargeSteps: 100, range: 3, multiplier: 0, sound: "clockTick" },
  longsword: { name: "扇斬り", description: "正面・斜め前の3マスを斬り、HPを70回復", color: 7317759, chargeSteps: 100, range: 1, multiplier: 1.3, sound: "skillLongsword" },
  lance: { name: "貫通突き", description: "東西南北各2マスを攻撃・攻撃力20%低下を3ターン", color: 15779678, chargeSteps: 100, range: 2, multiplier: 1.35, sound: "skillLance" },
  bow: { name: "穿ち矢", description: "前方7マス以内の敵1体を攻撃し、2ターンスタン", color: 7657610, chargeSteps: 100, range: 7, multiplier: 1.8, sound: "skillBow" },
  handgun: { name: "五連射", description: "前方3マス以内の敵1体へ5発・生存時に防御10%低下を3ターン", color: 16755808, chargeSteps: 100, range: 3, multiplier: 0.65, sound: "skillHandgun" },
  greatsword: { name: "旋風斬り", description: "周囲8マスを斬り、敵を1マス押し戻す。命中したモンスター1体につきHP10回復", color: 16740978, chargeSteps: 100, range: 1, multiplier: 1.45, sound: "skillGreatsword" },
  dual_sword: { name: "十字絶閃", description: "前方5マスを貫通する斬撃を3連発・各発は通常攻撃の1.5倍", color: 16753135, chargeSteps: 100, range: 5, multiplier: 1.5, sound: "skillDual" }
};
function Fe(t) {
  return t ? ol[t === "twin_daggers" ? "dual_sword" : t] : null;
}
function Wt(t) {
  return t === "up" ? { x: 0, y: -1 } : t === "down" ? { x: 0, y: 1 } : t === "left" ? { x: -1, y: 0 } : { x: 1, y: 0 };
}
function nr(t, e, r, s) {
  const n = Fe(t), i = Wt(r), a = [], l = [], h = (o, c) => {
    if (s.blocked(o, c)) return !1;
    a.push({ x: o, y: c });
    const u = s.enemyAt(o, c);
    return u && s.canHit(u) && !l.includes(u) && l.push(u), !!u;
  };
  if (t === "lance")
    for (const o of ["up", "down", "left", "right"]) {
      const c = Wt(o);
      for (let u = 1; u <= n.range; u++) {
        const d = e.x + c.x * u, f = e.y + c.y * u;
        if (s.blocked(d, f)) break;
        h(d, f);
      }
    }
  else if (t === "greatsword")
    for (let o = -1; o <= 1; o++) for (let c = -1; c <= 1; c++)
      !c && !o || c && o && s.blocked(e.x + c, e.y) && s.blocked(e.x, e.y + o) || h(e.x + c, e.y + o);
  else if (t === "longsword") {
    const o = { x: e.x + i.x, y: e.y + i.y };
    h(o.x, o.y);
    for (const c of [-1, 1])
      s.blocked(o.x, o.y) && s.blocked(e.x - i.y * c, e.y + i.x * c) || h(o.x - i.y * c, o.y + i.x * c);
  } else {
    const o = t === "dagger" || t === "bow" || t === "handgun";
    for (let c = 1; c <= n.range; c++) {
      const u = e.x + i.x * c, d = e.y + i.y * c;
      if (s.blocked(u, d) || h(u, d) && o) break;
    }
  }
  return { tiles: a, targets: l };
}
const ll = {
  iron: [11911884, 15324341],
  mist: [10407935, 16751684],
  moon: [12158448, 14280852],
  sun: [16749374, 7592175],
  dragon: [6672020, 15555941],
  sky: [8441855, 16751430],
  divine: [16768907, 13072621],
  fire: [16741433, 7720959],
  water: [7980543, 16753510],
  thunder: [16768101, 11768575],
  ice: [11857407, 16754778]
};
function dn(t) {
  return (ll[t.key.replace("w_katana_", "")] ?? [12904431, 16760199])[t.starred ? 1 : 0];
}
const Ts = (t) => t === "katana" ? 640 : t === "bow" ? 450 : t === "handgun" ? 100 : t === "greatsword" ? 270 : t === "dagger" ? 90 : 150;
function vt(t, e, r, s, n, i = n, a = !0) {
  const l = t.add.image(r, s, e).setDisplaySize(n, i).setDepth(24).setName("painted-skill-fx");
  return a && l.setBlendMode(1), l;
}
function be(t, e, r, s = 0) {
  t.tweens.add({ targets: e, alpha: 0, duration: r, delay: s, onComplete: () => e.destroy() });
}
function cl(t, e, r, s, n, i, a, l = 32) {
  const h = l, o = (y) => ({ x: (y.x + 0.5) * h, y: (y.y + 0.5) * h }), c = o(r), u = Wt(s), d = Math.atan2(u.y, u.x), f = o(n[n.length - 1] ?? r), g = Math.hypot(f.x - c.x, f.y - c.y), m = (y, _, w, v, x = v) => vt(t, y, _, w, v, x), p = (y, _, w, v, x, b, O = 0) => {
    const A = m("fx_crescent", y, _, w).setRotation(v).setAlpha(0);
    e === "katana" && A.setTint(dn({ key: i.replace(/^star_/, ""), starred: i.startsWith("star_") })), e === "dagger" && A.setTint(13936639), e === "greatsword" && A.setTint(16761992), e === "longsword" && A.setTint(10602495), t.tweens.add({ targets: A, alpha: 0.9, duration: 55, delay: O }), t.tweens.add({ targets: A, rotation: v + x, duration: b, delay: O, ease: "Cubic.out" }), be(t, A, b - 60, O + 60);
  };
  if (e === "katana") {
    t.anims.exists("katana-tornado-v2") || t.anims.create({ key: "katana-tornado-v2", frames: t.anims.generateFrameNumbers("fx_katana_tornado_v2", { start: 0, end: 7 }), frameRate: 18, repeat: -1 });
    const y = t.add.sprite(c.x, c.y + h * 0.3, "fx_katana_tornado_v2").setOrigin(0.5, 0.88).setDisplaySize(h * 2.3, h * 3.1).setDepth(24).setName("painted-skill-fx").setAlpha(0.86).play("katana-tornado-v2");
    p(c.x + u.x * h * 0.35, c.y + u.y * h * 0.35, h * 2.1, d - 0.8, 1.7, 210), t.tweens.add({ targets: y, x: f.x, y: f.y + h * 0.3, duration: 640, ease: "Linear", onComplete: () => be(t, y, 180) });
  } else if (e === "greatsword")
    p(c.x, c.y, h * 3.2, d, Math.PI * 2.1, 430), p(c.x, c.y, h * 2.7, d + Math.PI, Math.PI * 2.1, 430, 55), t.cameras.main.shake(130, 15e-4);
  else if (e === "longsword")
    p(c.x + u.x * h * 0.35, c.y + u.y * h * 0.35, h * 2.8, d + 0.7, 2.8, 340);
  else if (e === "dagger") {
    const y = vt(t, "fx_skill_dagger_v3", c.x, c.y, h * 1.7, h * 1.1, !1).setAlpha(0.65);
    be(t, y, 300);
    const _ = n[n.length - 1], w = _ ? o(_) : { x: c.x + u.x * h, y: c.y + u.y * h };
    p(w.x, w.y, h * 1.7, d - 0.5, 3, 250);
  } else if (e === "bow") {
    const y = vt(t, i, c.x + u.x * 8, c.y + u.y * 8, h * 1.6, h * 2.1, !1).setRotation(d + Math.PI / 2);
    t.tweens.add({ targets: y, x: y.x - u.x * 4, y: y.y - u.y * 4, duration: 130, yoyo: !0 }), be(t, y, 100, 170);
    const _ = m("fx_impact", c.x + u.x * 13, c.y + u.y * 13, h * 2.2).setAlpha(0.75);
    be(t, _, 160), g > 0 && t.time.delayedCall(150, () => {
      const w = `arrow_${i.replace(/^star_/, "")}`, v = vt(t, w, c.x, c.y, h * 1.6, h * 1.6, !1).setRotation(d + Math.PI / 4);
      t.tweens.add({ targets: v, x: f.x, y: f.y, duration: 300, ease: "Linear", onComplete: () => v.destroy() });
    });
  } else if (e === "handgun")
    for (let y = 0; y < 5; y++) t.time.delayedCall(y * 110, () => {
      const _ = m("fx_impact", c.x + u.x * 13, c.y + u.y * 13, 25).setTint(16763776);
      if (be(t, _, 95), !g) return;
      const w = m("fx_bolt", c.x + u.x * 10, c.y + u.y * 10, h * 0.85, h * 0.4).setOrigin(1, 0.5).setRotation(d);
      t.tweens.add({ targets: w, x: f.x, y: f.y, duration: 100, onComplete: () => w.destroy() });
    });
  else if (e === "lance") {
    const y = ["up", "down", "left", "right"];
    for (const _ of y) {
      const w = Wt(_), v = n.filter((R) => w.x ? R.y === r.y && Math.sign(R.x - r.x) === w.x : R.x === r.x && Math.sign(R.y - r.y) === w.y), x = v[v.length - 1];
      if (!x) continue;
      const b = o(x), O = Math.hypot(b.x - c.x, b.y - c.y), A = m("fx_beam", c.x, c.y, 1, h * 0.7).setOrigin(0, 0.5).setRotation(Math.atan2(w.y, w.x)).setTint(11661823);
      t.tweens.add({ targets: A, displayWidth: O, duration: 150, ease: "Cubic.out" }), be(t, A, 220, 150);
    }
  } else {
    if (!g) return;
    for (let y = 0; y < 3; y++) t.time.delayedCall(y * 160, () => {
      const _ = m("fx_skill_cross_v3", c.x, c.y, h).setRotation(d);
      t.tweens.add({
        targets: _,
        x: f.x,
        y: f.y,
        duration: 150,
        ease: "Linear",
        onComplete: () => {
          t.tweens.add({
            targets: _,
            displayWidth: h,
            displayHeight: h,
            alpha: 0,
            duration: 180,
            onComplete: () => _.destroy()
          });
        }
      });
    });
    t.cameras.main.shake(140, 1e-3);
  }
}
function hl(t, e = 32) {
  const r = Array.from(t.replace(/\s+/g, " ").trim());
  return r.length > e ? r.slice(0, e).join("") + "…" : r.join("");
}
function fn(t) {
  return !!t && (!!t.dual || ["bow", "greatsword"].includes(t.weaponType) || t.weaponType === "katana" && Do());
}
const Es = "19960711", ul = {
  dagger: "短剣",
  longsword: "片手剣",
  lance: "槍",
  bow: "弓",
  handgun: "銃",
  greatsword: "大剣",
  katana: "刀",
  dual_sword: "双剣",
  twin_daggers: "双短剣"
}, As = (t) => t ? `${Vo[t].name}属性` : "無属性", Ye = [
  ...Jt.map((t) => ({
    key: t.key,
    category: "weapon",
    name: t.name,
    textureKey: t.key,
    grade: t.grade,
    element: t.element,
    summary: `${rl(t)} / ${ul[t.weaponType]} / ${As(t.element)}`,
    description: [
      `攻撃力 ${t.atkMin}〜${t.atkMax}　耐久 ${t.durMax}`,
      t.dual ? "二刀流：1ターンに2回攻撃。盾は装備できません。" : fn(t) ? "両手持ち。盾は装備できません。" : "",
      t.weaponType === "katana" ? "スキル：前方3マスに竜巻を送り、敵を空いているマスへ押し戻す。成功した敵1体につき次のチャージを5歩短縮。" : "",
      t.passive ? `${t.passive.name}：${t.passive.description}` : ""
    ].filter(Boolean).join(`
`)
  })),
  ...Ar.map((t) => {
    const e = Ht(t.key);
    return {
      key: e.key,
      category: "shield",
      name: e.name,
      textureKey: e.key,
      grade: e.grade,
      element: e.element,
      summary: `${e.grade} / 盾 / ${As(e.element)}`,
      description: `防御力 +${e.defBonus + e.plus}　耐久 ${e.durMax}${e.plus ? `（初期強化 +${e.plus}）` : ""}
${t.passive.name}：${t.passive.description}`
    };
  }),
  ...Rr.map((t) => {
    const e = Ft[t];
    return {
      key: `armor_${t}`,
      category: "armor",
      name: e.name,
      textureKey: el(t),
      grade: e.grade,
      summary: `${e.grade} / 服`,
      description: `防御力 +${e.defBonus}
入手時に追加効果を1つ抽選（HP・防御・スキル歩数・ポーション回復・特殊アイテムのドロップ率）
${Xo({ ...e, trait: "rare_drop" })}（付与率1%）`
    };
  }),
  ...Object.entries(on).map(([t, e]) => ({
    key: t,
    category: "item",
    name: e.name,
    textureKey: e.textureKey,
    summary: "道具",
    description: e.desc
  }))
], dl = /* @__PURE__ */ new Set(["fx_hw_freeze", "fx_hw_aura_a", "fx_hw_aura_b", "fx_hw_barrier"]);
function fl(t) {
  for (const e of dl) {
    if (t.textures.exists(e)) continue;
    const r = t.add.graphics();
    if (e === "fx_hw_freeze")
      for (const [s, n, i] of [[32, 78, 48], [55, 76, 67], [79, 84, 57], [96, 90, 35]])
        r.fillStyle(7921663, 0.42).fillTriangle(s - 12, n + 28, s, n - i, s + 14, n + 28), r.lineStyle(2, 14285567, 0.85).strokeTriangle(s - 12, n + 28, s, n - i, s + 14, n + 28), r.lineStyle(1, 16777215, 0.7).lineBetween(s, n - i, s + 3, n + 23);
    else if (e === "fx_hw_barrier")
      r.fillStyle(7060735, 0.16).fillEllipse(64, 64, 105, 115), r.lineStyle(3, 13823743, 0.9).strokeEllipse(64, 64, 105, 115), r.lineStyle(1, 8839167, 0.65).strokeEllipse(64, 64, 92, 101);
    else
      for (let s = 53; s > 4; s -= 7)
        r.fillStyle(e === "fx_hw_aura_a" ? 16767097 : 10154495, 0.055).fillCircle(64, 64, s);
    r.generateTexture(e, 128, 128), r.destroy();
  }
}
const kr = "legendary_shield_mist_v2";
function pl(t) {
  if (t.textures.exists(kr)) return;
  const e = t.textures.createCanvas(kr, 128, 128);
  if (!e) return;
  const r = e.context, s = r.createRadialGradient(64, 64, 3, 64, 64, 62);
  s.addColorStop(0, "rgba(40,20,55,.55)"), s.addColorStop(0.38, "rgba(17,10,28,.48)"), s.addColorStop(0.72, "rgba(9,5,18,.18)"), s.addColorStop(1, "rgba(9,5,18,0)"), r.clearRect(0, 0, 128, 128), r.fillStyle = s, r.fillRect(0, 0, 128, 128), e.refresh();
}
function ir(t, e, r) {
  const s = t * Math.PI * 5.2 - e * 52e-4 + r * Math.PI;
  return { x: Math.sin(s), front: Math.cos(s) >= 0 };
}
class kt {
  constructor(e, r, s) {
    this.scene = e, this.target = r, this.kind = s, fl(e), this.back = e.add.graphics(), this.front = e.add.graphics(), s === "shield" && (pl(e), this.smoke = Array.from({ length: 3 }, () => e.add.image(0, 0, kr))), this.painted = Array.from({ length: 3 }, (i, a) => e.add.image(0, 0, a % 2 ? "fx_hw_aura_b" : "fx_hw_aura_a").setVisible(!1));
    const n = r.parentContainer;
    n && (n.addAt([this.back, ...this.smoke, ...this.painted], n.getIndex(r)), n.addAt(this.front, n.getIndex(r) + 1)), e.events.on("postupdate", this.draw, this), e.events.once("shutdown", this.destroy, this), r.once("destroy", this.destroy, this);
  }
  scene;
  target;
  kind;
  back;
  front;
  smoke = [];
  painted = [];
  disposed = !1;
  enabled = !0;
  emerald = !1;
  alternate = !1;
  artRotation = 0;
  draw() {
    if (this.disposed) return;
    const e = this.target, r = this.enabled && e.active && e.visible && e.alpha > 0;
    this.back.clear().setVisible(r), this.front.clear().setVisible(r);
    for (const c of this.smoke) c.setVisible(r && this.kind === "shield");
    for (const c of this.painted) c.setVisible(r && this.emerald);
    if (!r) return;
    const s = e.texture.key === "w_katana_divine" || e.texture.key === "star_w_katana_divine", n = e.texture.key === "star_w_katana_divine", i = e.texture.key === "icon_w_hero_sword" || s, a = this.scene.time.now, l = e.displayWidth, h = e.displayHeight, o = e.rotation + (i ? 0 : this.artRotation);
    for (const [c, u] of [[this.back, -1e-3], [this.front, 1e-3]])
      c.setPosition(e.x, e.y).setRotation(o).setDepth(e.depth + u).setAlpha(e.alpha);
    if (this.emerald) {
      this.smoke.forEach((d) => d.setVisible(!1));
      const c = (0.5 - e.originX) * l, u = (0.5 - e.originY) * h;
      this.painted.forEach((d, f) => {
        const g = (a / 2600 + f / 3) % 1, m = this.kind === "sword", p = g * h * (m ? 0.045 : 0.15), y = c + Math.sin(a / 950 + f * 2) * l * 0.035, _ = u - p;
        d.setPosition(e.x + y * Math.cos(o) - _ * Math.sin(o), e.y + y * Math.sin(o) + _ * Math.cos(o)).setDisplaySize(l * (m ? 0.5 + g * 0.06 : 1.03 + g * 0.25), h * (m ? 0.85 + g * 0.06 : 1.03 + g * 0.2)).setRotation(o + Math.sin(a / 1800 + f) * 0.09).setFlipX(f === 1).setAlpha(Math.sin(g * Math.PI) * 0.6 * e.alpha).setDepth(e.depth - 2e-3 - f * 1e-3);
      });
    } else if (this.kind === "scabbard")
      for (let c = 0; c < 2; c++) for (let u = 1; u <= 48; u++) {
        const d = (p) => {
          const y = ir(p, a, c), _ = (0.74 - e.originX - p * 0.65) * l;
          return { x: e.flipX ? -_ : _, y: (0.5 - e.originY) * h + y.x * h * 0.45, front: y.front };
        }, f = d((u - 1) / 48), g = d(u / 48);
        (g.front ? this.front : this.back).lineStyle(Math.max(0.6, Math.min(l, h) * 0.06), c ? 13236735 : this.alternate ? 13933055 : 16770976, g.front ? 0.85 : 0.38).lineBetween(f.x, f.y, g.x, g.y);
      }
    else if (this.kind === "sword")
      for (let c = 0; c < 2; c++)
        for (let u = 1; u <= 64; u++) {
          const d = ir((u - 1) / 64, a, c), f = ir(u / 64, a, c), g = f.front ? this.front : this.back, m = (0.5 - e.originX) * l, p = l * 0.095, y = (_) => (0.7 - e.originY - _ * 0.65) * h;
          if (i) {
            const _ = (s ? n ? -0.42 : 0.45 : 0.48) * l, w = (s ? -0.51 : -0.525) * h, v = Math.hypot(_, w), x = (A, R) => ({
              x: ((s ? n ? 0.49 : 0.51 : 0.44) - e.originX) * l + _ * A + (s ? (n ? -0.025 : 0.035) * Math.sin(A * Math.PI) * l : 0) - w / v * R * l * (s ? 0.035 : 0.065) * (1 - 0.7 * A),
              y: ((s ? 0.54 : 0.59) - e.originY) * h + w * A + _ / v * R * l * (s ? 0.035 : 0.065) * (1 - 0.7 * A)
            }), b = x((u - 1) / 64, d.x), O = x(u / 64, f.x);
            g.lineStyle(Math.max(0.65, l * 0.017), c ? 13236735 : n ? 13933055 : 16770976, f.front ? 0.85 : 0.38).lineBetween(b.x, b.y, O.x, O.y);
            continue;
          }
          g.lineStyle(Math.max(0.65, l * 0.017), c ? 13236735 : n ? 13933055 : 16770976, f.front ? 0.85 : 0.38).lineBetween(m + d.x * p, y((u - 1) / 64), m + f.x * p, y(u / 64));
        }
    else
      this.smoke.forEach((c, u) => {
        const d = (a / 2400 + u / 3) % 1, f = Math.max(l, h) * (e.parentContainer ? 1 + d * 0.65 : 1.3 + d * 1.1), g = (0.5 - e.originX) * l + Math.sin(a / 650 + u * 2) * l * 0.08, m = (0.5 - e.originY) * h - d * h * (e.parentContainer ? 0.1 : 0.28);
        c.setPosition(e.x + g * Math.cos(e.rotation) - m * Math.sin(e.rotation), e.y + g * Math.sin(e.rotation) + m * Math.cos(e.rotation)).setDisplaySize(f, f).setRotation(a * 15e-5 * (u % 2 ? -1 : 1) + u * 2).setAlpha(Math.sin(d * Math.PI) * 0.48 * e.alpha).setDepth(e.depth - 2e-3);
      });
  }
  destroy() {
    this.disposed || (this.disposed = !0, this.scene.events.off("postupdate", this.draw, this), this.scene.events.off("shutdown", this.destroy, this), this.target.off("destroy", this.destroy, this), this.back.destroy(), this.front.destroy(), this.smoke.forEach((e) => e.destroy()), this.painted.forEach((e) => e.destroy()));
  }
}
const ar = { player_male_leather: [[14.21, 24.33, 27.11, 25.85], [15.05, 24.83, 27.31, 26.13], [14.86, 24.33, 25.63, 25.85], [14.62, 22.37, 26.68, 25.41], [15.28, 24.11, 27.05, 25.63], [14.85, 24.11, 26.9, 25.42], [14.84, 23.01, 27.08, 26.06], [15.71, 22.07, 26.68, 25.13], [15.72, 17.58, 29.72, 24.75], [19.55, 6.94, 30.95, 21.93], [30.72, 19.07, 20.54, 24.51], [33.86, 19.18, 20.08, 24.37], [32.02, 17.86, 20.6, 21.98], [16.33, 25.46, 29.07, 26.54], [18.08, 23.04, 28.27, 27.59], [16.49, 34.09, 27.84, 34.09], [14.61, 23.13, 21.35, 28.13], [13.35, 22.2, 21.98, 27.44], [13.54, 22.92, 22.71, 28.54], [13.35, 20.94, 22.61, 27.65], [13.96, 23.54, 22.5, 29.38], [13.99, 23.75, 23.25, 28.96], [14.2, 21.88, 22.83, 27.5], [14.62, 21.98, 23.25, 27.65], [7.92, 17.58, 20.83, 26.18], [9.79, 10.63, 20.63, 24.79], [9.39, 17.92, 20.11, 25.63], [14.66, 22.08, 23.05, 25.63], [9.58, 15.9, 22.5, 24.71], [12.73, 18.13, 25.97, 25.21], [14.58, 20, 25.42, 26.04], [13.75, 32.5, 23.96, 33.33], [21.04, 28.91, 25.42, 22.41], [25.21, 22.5, 20.21, 28.13], [24.38, 23.75, 23.13, 27.5], [25.18, 22.41, 21.6, 29.12], [23.7, 25.42, 22.01, 27.29], [24.58, 22.71, 20.83, 28.33], [25.81, 22.29, 21.81, 29.17], [26.22, 22.71, 22.43, 29.38], [30.82, 16.33, 21.99, 27.44], [29.79, 12.54, 16.25, 24.71], [31.85, 16.88, 17.99, 27.92], [30.83, 20.31, 18.75, 27.65], [30.81, 16.53, 18.42, 26.6], [29.38, 18.21, 18.96, 28.07], [27.92, 18.42, 16.67, 27.65], [29.17, 33.13, 20.75, 33.33], [29.44, 25.32, 15.29, 25.79], [29.62, 25.03, 14.67, 25.49], [29.43, 26.68, 14.66, 27.15], [29.86, 25.26, 15.05, 25.73], [29.9, 25.26, 14.94, 25.73], [30.02, 25.32, 15, 25.79], [30.13, 25.56, 15.15, 26.02], [30.27, 24.66, 15.36, 25.12], [27.78, 22.97, 15.05, 23.68], [30.16, 8.17, 15.16, 20.95], [14.31, 16.33, 29.44, 22.68], [12.51, 14.14, 29.5, 22.77], [14.45, 14.51, 30.02, 20.6], [30.43, 22.93, 16.4, 23.4], [30.14, 24.22, 16.94, 25.38], [29.26, 35.13, 17.02, 33.96]], player_male_chain: [[15.87, 24.27, 28.63, 25.77], [16.71, 24.27, 28.81, 25.56], [16.72, 23.98, 27.35, 25.49], [16.07, 22.04, 27.98, 25.06], [16.71, 23.98, 28.19, 25.49], [16.72, 23.98, 28.62, 25.27], [16.49, 22.65, 28.42, 25.62], [17.35, 22.04, 28.19, 25.06], [17.37, 17.96, 31.19, 24.98], [21.02, 7.54, 32.42, 22.22], [32.24, 19.44, 22.25, 24.76], [35.13, 19.09, 21.59, 24.24], [33.68, 18.13, 22.26, 22.19], [17.8, 25.53, 30.53, 26.61], [19.69, 23.15, 29.73, 27.66], [18.25, 34.11, 29.33, 34.11], [14.58, 23.33, 21.25, 28.33], [13.15, 22.5, 21.77, 27.71], [13.57, 22.62, 22.83, 28.28], [13.13, 21.04, 22.29, 27.71], [13.75, 23.33, 22.29, 29.17], [13.75, 23.46, 22.92, 28.7], [14.17, 21.78, 22.71, 27.44], [14.62, 22.19, 23.25, 27.86], [7.92, 17.37, 20.83, 25.97], [9.81, 10.42, 20.74, 24.58], [9.38, 17.71, 20, 25.42], [14.66, 21.98, 23.05, 25.55], [9.6, 16.04, 22.62, 24.79], [12.71, 18, 25.83, 25.13], [14.58, 19.88, 25.42, 25.97], [13.79, 32.71, 24.1, 33.54], [21.25, 28.75, 25.63, 22.29], [25.63, 22.29, 20.63, 27.92], [24.75, 23.67, 23.49, 27.44], [25.38, 22.2, 21.8, 28.91], [23.75, 25.21, 22.08, 27.08], [25, 22.5, 21.25, 28.13], [26.04, 22.08, 22.08, 28.96], [26.43, 22.5, 22.64, 29.17], [31.04, 16.33, 22.29, 27.44], [30.4, 12.12, 16.74, 24.29], [32.08, 16.67, 18.33, 27.71], [31.22, 20.1, 19.05, 27.44], [31.22, 16.46, 18.84, 26.46], [29.58, 18.21, 19.17, 28.07], [28.31, 18.42, 16.97, 27.65], [29.37, 33.1, 20.96, 33.31], [29.4, 25.25, 15.28, 25.71], [29.65, 25.25, 15.03, 25.71], [29.42, 26.14, 15.02, 26.6], [29.84, 25.54, 15.22, 26], [30.1, 25.54, 15.35, 26], [29.57, 25.54, 14.95, 26], [30.1, 25.54, 15.31, 26], [29.84, 24.8, 15.25, 25.26], [28.01, 23, 15.44, 23.69], [30, 8.14, 15.19, 20.83], [14.57, 16.39, 29.54, 22.64], [12.74, 13.87, 29.66, 22.43], [14.49, 14.77, 30, 20.79], [30.29, 23.1, 16.6, 23.56], [30.51, 24.08, 17.38, 25.23], [28.86, 35.14, 16.91, 33.99]], player_male_plate: [[16.48, 24.01, 29.11, 25.49], [17.32, 24.51, 29.32, 25.76], [17.34, 24.01, 27.98, 25.49], [16.91, 22.11, 28.83, 25.06], [17.34, 24.01, 28.84, 25.49], [17.34, 23.93, 29.26, 25.2], [17.31, 22.11, 29.11, 25.06], [17.94, 22.11, 28.68, 25.06], [18.15, 17.88, 31.65, 24.85], [21.73, 7.72, 32.89, 22.2], [32.68, 19.56, 22.8, 24.84], [35.4, 19.34, 22.17, 24.42], [34.13, 18.41, 22.91, 22.4], [18.36, 25.47, 30.8, 26.53], [20.27, 22.71, 30.18, 27.16], [18.87, 33.7, 29.95, 33.7], [15.21, 23.21, 21.88, 28.18], [13.75, 22.59, 22.29, 27.76], [14.17, 22.8, 23.33, 28.38], [13.73, 20.83, 22.8, 27.5], [14.17, 23.42, 22.71, 29.21], [14.14, 23.42, 23.21, 28.59], [14.76, 21.77, 23.21, 27.35], [15, 21.88, 23.54, 27.5], [8.11, 17.29, 20.93, 25.83], [9.98, 10.8, 20.72, 24.87], [9.99, 17.71, 20.52, 25.42], [15.13, 21.88, 23.41, 25.42], [9.99, 15.98, 22.79, 24.66], [13.13, 18.04, 26.25, 25.07], [14.76, 19.79, 25.49, 25.83], [14.34, 32.54, 24.45, 33.36], [21.25, 28.8, 25.63, 22.38], [25.63, 22.59, 20.63, 28.18], [24.58, 23.96, 23.33, 27.71], [25.03, 22.39, 21.53, 29.01], [23.6, 25.21, 21.95, 27.08], [24.83, 22.5, 21.12, 28.13], [26.04, 22.08, 22.08, 28.96], [26.25, 22.8, 22.5, 29.42], [30.85, 16.31, 22.18, 27.2], [30, 12.46, 16.46, 24.46], [31.9, 16.67, 18.26, 27.71], [30.87, 20.32, 18.87, 27.56], [30.86, 16.59, 18.66, 26.52], [29.6, 18.25, 19.27, 27.97], [27.73, 18.33, 16.58, 27.5], [28.96, 32.74, 20.71, 32.95], [29.63, 24.95, 15.82, 25.4], [29.63, 24.51, 15.16, 24.96], [29.65, 26.12, 15.28, 26.57], [30.08, 24.95, 15.59, 25.4], [29.9, 24.66, 15.49, 25.11], [29.85, 24.95, 15.33, 25.4], [30.11, 24.95, 15.45, 25.4], [30.28, 24.21, 15.83, 24.67], [28.2, 23.09, 15.63, 23.77], [29.9, 8.92, 15.38, 21.36], [14.76, 17.13, 29.47, 23.22], [13.34, 14.39, 30.01, 22.83], [14.69, 15.75, 29.82, 21.61], [30.33, 23.15, 16.8, 23.61], [30.53, 24.12, 17.52, 25.24], [28.94, 34.7, 17.25, 33.57]], player_male_arcane: [[15.69, 24.41, 28.72, 25.91], [16.52, 24.83, 28.78, 26.13], [16.56, 24.41, 27.44, 25.91], [16.29, 22.47, 28.34, 25.48], [16.96, 24.41, 28.71, 25.91], [16.73, 24.11, 28.78, 25.42], [16.72, 23.19, 28.93, 26.19], [17.41, 22.16, 28.48, 25.2], [17.58, 17.71, 31.4, 24.83], [21.29, 7.14, 32.8, 22.03], [32.39, 19.2, 22.22, 24.6], [35.35, 19.31, 21.79, 24.46], [33.88, 18.08, 22.36, 22.19], [17.99, 25.46, 30.74, 26.54], [19.69, 23.15, 29.74, 27.66], [18.1, 34.09, 29.29, 34.09], [14.58, 23.33, 21.25, 28.33], [13.36, 22.5, 21.98, 27.71], [13.75, 22.83, 22.92, 28.49], [13.15, 20.94, 22.4, 27.65], [13.78, 23.33, 22.4, 29.17], [13.75, 23.75, 22.92, 28.96], [14.2, 21.99, 22.83, 27.65], [14.62, 22.29, 23.25, 27.92], [7.92, 17.71, 20.83, 26.25], [9.58, 10.45, 20.42, 24.71], [9.58, 17.79, 20.21, 25.55], [14.87, 22.29, 23.26, 25.83], [9.38, 16.11, 22.29, 24.92], [12.92, 18, 26.04, 25.13], [14.61, 19.88, 25.55, 25.97], [13.99, 32.5, 24.3, 33.33], [21.25, 28.96, 25.63, 22.5], [25.59, 22.5, 20.54, 28.13], [24.75, 23.75, 23.49, 27.5], [25.38, 22.41, 21.8, 29.12], [23.75, 25.42, 22.08, 27.29], [25, 22.71, 21.25, 28.33], [26.04, 22.29, 22.08, 29.17], [26.04, 22.71, 22.29, 29.38], [31.04, 16.46, 22.29, 27.5], [30.4, 12.33, 16.74, 24.5], [31.88, 16.88, 18.13, 27.92], [31.04, 20.42, 18.96, 27.71], [31.23, 16.67, 18.84, 26.67], [29.98, 18.33, 19.48, 28.13], [27.92, 18.42, 16.67, 27.65], [28.96, 33.1, 20.63, 33.31], [29.38, 25.4, 15.14, 25.86], [29.8, 25.4, 14.89, 25.86], [29.61, 26.75, 14.89, 27.21], [30.04, 25.69, 15.13, 26.16], [29.68, 25.4, 14.9, 25.86], [30.21, 25.69, 15.23, 26.16], [30.08, 25.85, 15.14, 26.31], [30.04, 24.66, 15.13, 25.12], [27.94, 23.07, 15.13, 23.76], [29.8, 8.17, 14.96, 20.95], [14.35, 16.82, 29.34, 23.08], [12.72, 13.95, 29.56, 22.56], [14.26, 14.77, 29.8, 20.79], [30.24, 23.1, 16.39, 23.56], [30.5, 24.08, 17.17, 25.23], [28.99, 35.14, 16.82, 33.99]], player_male_dragon: [[15.67, 24.41, 28.57, 25.91], [16.52, 25.05, 28.78, 26.34], [16.56, 24.41, 27.44, 25.91], [16.1, 22.47, 28.27, 25.48], [16.96, 24.41, 28.7, 25.91], [16.73, 24.41, 28.75, 25.7], [16.53, 23.11, 28.74, 26.13], [17.19, 22.16, 28.27, 25.2], [17.35, 17.71, 31.01, 24.83], [21.07, 7.14, 32.59, 22.03], [32.38, 19.32, 22.2, 24.68], [35.35, 18.97, 21.8, 24.16], [33.88, 18, 22.37, 22.08], [17.76, 25.53, 30.36, 26.61], [19.69, 22.83, 29.74, 27.38], [18.16, 33.87, 29.49, 33.87], [14.58, 23.21, 21.25, 28.18], [13.33, 22.38, 21.88, 27.56], [13.51, 22.71, 22.59, 28.33], [13.33, 21.04, 22.5, 27.71], [13.75, 23.33, 22.29, 29.17], [13.72, 23.63, 22.8, 28.8], [14.17, 21.97, 22.71, 27.56], [14.55, 22.08, 23, 27.71], [7.69, 17.63, 20.51, 26.11], [9.57, 10.63, 20.31, 24.79], [9.58, 17.71, 20.21, 25.42], [14.58, 22.18, 22.92, 25.7], [9.36, 16.18, 22.17, 24.87], [12.9, 17.92, 25.91, 25], [14.58, 20.12, 25.42, 26.11], [13.71, 32.71, 23.82, 33.54], [21.04, 28.96, 25.42, 22.5], [25.59, 22.41, 20.54, 28.07], [24.58, 23.96, 23.33, 27.71], [25.38, 22.5, 21.8, 29.17], [23.96, 25.34, 22.29, 27.23], [24.79, 22.62, 21.04, 28.28], [26.04, 22.08, 22.08, 28.96], [26.43, 22.62, 22.64, 29.33], [30.83, 16.46, 22.08, 27.5], [30.4, 12.12, 16.74, 24.29], [32.06, 16.88, 18.2, 27.92], [31, 20.21, 18.83, 27.5], [31.04, 16.32, 18.75, 26.39], [29.58, 18, 19.17, 27.86], [28.1, 18.33, 16.76, 27.5], [29.17, 32.89, 20.83, 33.1], [29.61, 25.4, 15.33, 25.86], [29.85, 25.4, 14.86, 25.86], [29.62, 26.75, 14.93, 27.21], [30.04, 25.4, 15.13, 25.86], [30.09, 25.4, 15.28, 25.86], [30.21, 25.69, 15.23, 26.16], [29.91, 25.69, 15.13, 26.16], [30.46, 24.66, 15.58, 25.12], [28.2, 23.07, 15.5, 23.76], [29.8, 7.98, 14.96, 20.74], [14.55, 16.48, 29.67, 22.77], [12.95, 13.95, 29.76, 22.56], [14.26, 14.65, 29.8, 20.7], [30.24, 23.03, 16.39, 23.49], [30.51, 24.01, 17.35, 25.17], [28.86, 35.14, 16.91, 33.97]], player_female_leather: [[16.12, 24.41, 29.15, 25.91], [16.93, 25.12, 29.18, 26.4], [16.97, 24.41, 27.84, 25.91], [16.5, 22.47, 28.67, 25.48], [17.34, 24.41, 29.08, 25.91], [17.17, 24.41, 29.31, 25.7], [16.91, 23.32, 28.97, 26.34], [17.59, 22.55, 28.68, 25.55], [17.79, 17.92, 31.61, 25.04], [21.7, 7.33, 33.21, 22.12], [32.6, 19.21, 22.43, 24.6], [35.55, 19.11, 22, 24.25], [33.91, 17.88, 22.57, 21.99], [18.41, 25.47, 31.16, 26.55], [19.89, 22.85, 29.94, 27.39], [18.54, 33.88, 29.85, 33.88], [14.93, 23.5, 21.46, 28.43], [13.31, 22.68, 21.77, 27.82], [13.91, 22.8, 22.89, 28.38], [13.5, 20.94, 22.48, 27.56], [14.14, 23.5, 22.6, 29.26], [14.14, 23.63, 23.21, 28.8], [14.56, 21.97, 23.01, 27.56], [14.76, 22.28, 23.21, 27.82], [7.9, 17.63, 20.72, 26.11], [9.96, 10.8, 20.61, 24.87], [9.55, 17.97, 20, 25.57], [14.72, 21.97, 22.99, 25.49], [9.55, 16.12, 22.25, 24.74], [13.1, 18.25, 26.11, 25.28], [14.56, 20.23, 25.29, 26.19], [13.9, 32.57, 23.91, 33.39], [21.33, 28.64, 25.66, 22.27], [25.87, 22.27, 20.92, 27.82], [24.67, 23.5, 23.44, 27.2], [25.28, 22.48, 21.81, 29.05], [23.86, 25.15, 22.23, 27], [25.25, 22.59, 21.54, 28.18], [25.9, 22.18, 22.02, 29.01], [26.28, 22.89, 22.57, 29.47], [30.86, 16.17, 22.26, 27.14], [30.04, 12.42, 16.72, 24.33], [31.92, 16.73, 18.38, 27.62], [30.89, 20.11, 18.99, 27.35], [31.28, 16.39, 19.08, 26.32], [29.62, 18.04, 19.37, 27.76], [28.15, 18.25, 17, 27.35], [29.17, 32.36, 21, 32.57], [29.41, 25.1, 15.35, 25.56], [29.59, 25.1, 14.84, 25.56], [29.45, 26.43, 14.94, 26.89], [29.88, 25.1, 15.22, 25.56], [29.91, 25.1, 15.17, 25.56], [29.84, 25.1, 15.18, 25.56], [30.06, 25.39, 15.41, 25.85], [30.24, 24.36, 15.49, 24.82], [27.98, 23, 15.3, 23.69], [29.67, 8.53, 15.15, 21.04], [14.32, 16.9, 29.09, 23.06], [13.13, 14.26, 29.87, 22.75], [14.67, 15.06, 30.09, 20.99], [30.14, 23.3, 16.58, 23.76], [29.89, 24.11, 17.02, 25.26], [28.86, 34.68, 17.02, 33.53]], player_female_chain: [[16.08, 24.48, 28.85, 25.98], [16.93, 25.12, 29.18, 26.4], [17.16, 24.56, 27.92, 26.05], [16.48, 22.65, 28.4, 25.62], [17.31, 24.56, 28.81, 26.05], [17.13, 24.56, 29.03, 25.84], [16.9, 23.19, 28.82, 26.19], [17.78, 22.55, 28.75, 25.55], [17.98, 17.96, 31.63, 24.98], [21.58, 7.33, 32.85, 22.12], [32.66, 19.44, 22.67, 24.76], [35.55, 19.11, 22, 24.25], [33.91, 18.15, 22.57, 22.19], [18.41, 25.61, 31.16, 26.68], [20.16, 23.04, 30.32, 27.52], [18.7, 33.92, 29.89, 33.92], [14.93, 23.38, 21.46, 28.28], [13.5, 22.56, 21.87, 27.67], [13.91, 22.98, 22.89, 28.49], [13.5, 21.15, 22.48, 27.67], [13.91, 23.5, 22.28, 29.26], [13.91, 23.8, 22.89, 28.9], [14.56, 22.17, 23.01, 27.67], [14.97, 22.28, 23.42, 27.82], [8.28, 17.89, 20.9, 26.25], [9.96, 11.16, 20.61, 25.03], [9.96, 17.97, 20.31, 25.57], [15.06, 22.17, 23.28, 25.64], [9.97, 16.12, 22.67, 24.74], [13.08, 18.37, 25.98, 25.36], [14.73, 20.14, 25.36, 26.05], [14.08, 32.57, 23.99, 33.39], [21.33, 28.64, 25.66, 22.27], [25.87, 22.27, 20.92, 27.82], [24.67, 23.5, 23.44, 27.2], [25.45, 22.18, 21.95, 28.8], [24.22, 24.87, 22.57, 26.73], [25.25, 22.59, 21.54, 28.18], [25.9, 22.18, 22.02, 29.01], [26.32, 22.89, 22.64, 29.47], [31.05, 16.17, 22.38, 27.14], [30.04, 12.42, 16.72, 24.33], [31.92, 16.59, 18.38, 27.56], [30.89, 20.11, 18.99, 27.35], [31.28, 16.39, 19.08, 26.32], [29.62, 18.04, 19.37, 27.76], [28.36, 18.25, 17.2, 27.35], [29.17, 32.36, 21, 32.57], [29.44, 24.95, 15.65, 25.4], [29.63, 24.95, 15.16, 25.4], [29.06, 26.56, 14.86, 27.02], [29.88, 25.24, 15.22, 25.69], [29.51, 24.95, 15.08, 25.4], [29.86, 25.24, 15.36, 25.69], [29.66, 25.39, 15.17, 25.85], [29.86, 24.51, 15.39, 24.96], [28.21, 23.17, 15.66, 23.85], [29.73, 8.53, 15.36, 21.04], [14.54, 16.9, 29.29, 23.06], [13.09, 14.55, 29.55, 22.93], [14.65, 15.32, 29.81, 21.18], [30.14, 23.17, 16.58, 23.62], [30.31, 24.27, 17.43, 25.4], [28.9, 34.7, 17.19, 33.57]], player_female_plate: [[16.06, 24.35, 28.69, 25.84], [17.13, 24.77, 29.25, 26.05], [16.9, 24.43, 27.43, 25.91], [16.48, 22.53, 28.4, 25.48], [17.3, 24.56, 28.67, 26.05], [16.93, 24.43, 28.96, 25.69], [16.89, 23.07, 28.68, 26.05], [17.55, 22.85, 28.4, 25.83], [17.95, 17.96, 31.44, 24.98], [21.52, 7.32, 32.68, 22], [32.83, 19.44, 22.75, 24.76], [35.78, 19.22, 22.34, 24.33], [34.32, 18.28, 22.99, 22.29], [18.38, 25.61, 30.98, 26.68], [20.11, 23.04, 30.15, 27.52], [18.59, 33.92, 29.55, 33.92], [14.72, 23.5, 21.25, 28.43], [13.5, 22.56, 21.87, 27.67], [13.7, 22.8, 22.69, 28.38], [13.31, 20.94, 22.39, 27.56], [14.14, 23.5, 22.6, 29.26], [13.91, 23.5, 22.89, 28.64], [14.35, 21.97, 22.8, 27.56], [14.97, 22.28, 23.42, 27.82], [8.11, 17.55, 20.93, 25.97], [9.98, 10.77, 20.72, 24.74], [9.57, 17.63, 20.1, 25.28], [14.65, 22.28, 22.86, 25.77], [9.56, 15.98, 22.25, 24.66], [13.08, 18.25, 25.98, 25.28], [14.73, 19.91, 25.36, 25.91], [14.14, 32.57, 24.25, 33.39], [21.62, 28.69, 25.9, 22.36], [25.52, 22.36, 20.66, 27.87], [24.67, 23.58, 23.44, 27.26], [25.87, 22.57, 22.37, 29.1], [24.22, 24.94, 22.57, 26.79], [24.92, 22.76, 21.28, 28.28], [26.32, 22.27, 22.44, 29.05], [26.49, 22.98, 22.78, 29.51], [31.28, 16.1, 22.68, 26.99], [30.46, 12.42, 17.14, 24.33], [32.33, 16.86, 18.8, 27.67], [31.31, 20.33, 19.41, 27.47], [30.91, 16.66, 18.91, 26.45], [30.03, 18.28, 19.78, 27.87], [27.99, 18.49, 17.02, 27.47], [29.17, 32.36, 21, 32.57], [29.24, 25.03, 15.59, 25.48], [29.63, 25.24, 15.16, 25.69], [29.06, 26.56, 14.86, 27.02], [29.66, 25.24, 15.17, 25.69], [29.33, 25.24, 15.04, 25.69], [29.86, 25.24, 15.36, 25.69], [29.66, 25.53, 15.17, 25.98], [29.68, 24.81, 15.34, 25.26], [27.86, 23.18, 15.56, 23.86], [29.68, 8.72, 15.18, 21.15], [14.51, 17.17, 29.02, 23.24], [12.85, 14.35, 29.18, 22.71], [14.65, 15.46, 29.66, 21.28], [30.14, 23.26, 16.58, 23.71], [29.91, 24.36, 17.19, 25.48], [28.74, 34.7, 17.15, 33.57]], player_female_arcane: [[16.29, 24.48, 29.05, 25.98], [16.95, 25.12, 29.19, 26.4], [17.14, 24.56, 27.78, 26.05], [16.71, 22.34, 28.74, 25.34], [17.34, 24.27, 28.94, 25.77], [16.94, 24.56, 28.96, 25.84], [17.12, 23.19, 29.18, 26.19], [17.78, 22.65, 28.75, 25.62], [17.98, 18.05, 31.63, 25.12], [21.43, 7.33, 32.82, 22.12], [32.66, 19.33, 22.68, 24.69], [35.55, 19.11, 22, 24.25], [33.91, 18.15, 22.57, 22.19], [18.21, 25.4, 30.94, 26.47], [20.16, 22.83, 30.32, 27.31], [18.7, 33.9, 29.89, 33.9], [14.72, 23.38, 21.25, 28.28], [13.47, 22.68, 21.76, 27.82], [13.91, 22.98, 22.89, 28.49], [13.5, 21.15, 22.48, 27.67], [13.91, 23.5, 22.28, 29.26], [13.93, 23.5, 23.01, 28.64], [14.32, 22.17, 22.69, 27.67], [14.97, 22.28, 23.42, 27.82], [7.88, 17.68, 20.6, 26.04], [9.95, 10.77, 20.5, 24.74], [9.54, 17.89, 19.89, 25.43], [14.65, 22.17, 22.86, 25.64], [9.55, 16.12, 22.25, 24.74], [13.07, 18.37, 25.85, 25.36], [14.7, 20.23, 25.23, 26.19], [14.08, 32.57, 23.99, 33.39], [21.2, 28.64, 25.48, 22.27], [25.87, 22.27, 20.92, 27.82], [24.83, 23.5, 23.6, 27.2], [25.45, 22.48, 21.95, 29.05], [24.01, 24.87, 22.36, 26.73], [24.88, 22.59, 21.2, 28.18], [25.9, 22.18, 22.02, 29.01], [26.28, 22.89, 22.57, 29.47], [31.07, 16.17, 22.47, 27.14], [30.04, 12.25, 16.72, 24.25], [31.92, 16.59, 18.38, 27.56], [30.89, 20.11, 18.99, 27.35], [31.28, 16.39, 19.08, 26.32], [29.62, 17.95, 19.37, 27.61], [28.18, 18.16, 17.11, 27.2], [29.17, 32.12, 20.92, 32.33], [29.2, 25.1, 15.29, 25.56], [29.59, 25.1, 14.84, 25.56], [29.45, 26.43, 14.94, 26.89], [29.88, 25.39, 15.22, 25.85], [29.91, 25.03, 15.2, 25.49], [29.86, 25.1, 15.36, 25.56], [30.06, 25.39, 15.41, 25.85], [29.84, 24.36, 15.25, 24.82], [27.79, 23.09, 15.25, 23.77], [30.03, 8.53, 15.39, 21.04], [14.54, 16.79, 29.29, 22.98], [13.11, 14.42, 29.7, 22.85], [14.66, 14.94, 29.94, 20.91], [30.14, 23.09, 16.58, 23.55], [30.07, 23.9, 17.06, 25.05], [28.86, 34.47, 17.05, 33.33]], player_female_dragon: [[16.08, 24.35, 28.85, 25.84], [16.91, 25.2, 29.04, 26.47], [16.72, 24.43, 27.36, 25.91], [16.47, 22.65, 28.26, 25.62], [17.11, 24.56, 28.6, 26.05], [16.71, 24.43, 28.61, 25.69], [17.1, 23.37, 28.89, 26.32], [17.73, 22.73, 28.47, 25.69], [17.95, 18.08, 31.44, 25.06], [21.58, 7.73, 32.85, 22.31], [32.24, 19.44, 22.25, 24.76], [35.17, 19.34, 21.83, 24.42], [33.71, 18.15, 22.48, 22.19], [18.36, 25.48, 30.8, 26.53], [20.05, 23.14, 29.97, 27.58], [18.18, 33.92, 29.13, 33.92], [14.93, 23.38, 21.46, 28.28], [13.47, 22.56, 21.76, 27.67], [13.68, 22.98, 22.57, 28.49], [13.5, 21.15, 22.48, 27.67], [13.91, 23.5, 22.28, 29.26], [13.91, 23.5, 22.89, 28.64], [14.56, 21.86, 23.01, 27.41], [14.93, 22.28, 23.3, 27.82], [8.28, 17.89, 20.9, 26.25], [9.96, 10.77, 20.61, 24.74], [9.96, 17.97, 20.31, 25.57], [15.06, 22.28, 23.28, 25.77], [9.96, 16.12, 22.54, 24.74], [12.87, 18.37, 25.77, 25.36], [14.73, 20.23, 25.36, 26.19], [14.08, 32.74, 23.99, 33.57], [21.2, 28.64, 25.48, 22.27], [25.87, 22.27, 20.92, 27.82], [24.83, 23.5, 23.6, 27.2], [25.45, 22.48, 21.95, 29.05], [24.22, 25.15, 22.57, 27], [25.25, 22.59, 21.54, 28.18], [25.9, 22.18, 22.02, 29.01], [26.32, 22.89, 22.64, 29.47], [31.07, 16.17, 22.47, 27.14], [30.44, 12.42, 17.01, 24.33], [31.92, 16.59, 18.38, 27.56], [30.89, 20.11, 18.99, 27.35], [31.28, 16.39, 19.08, 26.32], [29.62, 18.04, 19.37, 27.76], [28.18, 18.25, 17.11, 27.35], [29.17, 32.36, 21, 32.57], [29.43, 25.1, 15.51, 25.56], [29.59, 24.8, 14.84, 25.26], [29.45, 26.72, 14.94, 27.17], [29.47, 25.39, 14.98, 25.85], [29.92, 25.1, 15.35, 25.56], [29.86, 25.1, 15.36, 25.56], [30.06, 25.1, 15.41, 25.56], [29.84, 24.36, 15.25, 24.82], [27.98, 23, 15.3, 23.69], [30.03, 8.53, 15.39, 21.04], [14.54, 16.79, 29.29, 22.98], [13.12, 14.19, 29.84, 22.62], [14.67, 14.94, 30.09, 20.91], [30.14, 23, 16.58, 23.46], [30.47, 24.2, 17.34, 25.34], [28.64, 34.68, 16.82, 33.53]] }, gl = { down: 0, left: 1, right: 2, up: 3 }, ml = /* @__PURE__ */ new Set([
  "s_iron_round",
  "s_mirror_silver",
  "s_thorn_guard",
  "s_chrono_guard",
  "s_seraph_guard",
  "s_flame_aegis",
  "s_tidal_aegis",
  "s_storm_aegis",
  "s_frost_aegis"
]), yl = [...Jt, ...Ar].filter((t) => !t.key.startsWith("w_katana_") && t.key !== "w_hero_sword" && !t.key.startsWith("w_hw_") && !t.key.startsWith("w_secret_") && ("weaponType" in t || ml.has(t.key))).map((t) => ({
  itemKey: t.key,
  textureKey: `held_${t.key}`,
  path: `assets/equipment/directional/${t.key}.png`
})), _l = /* @__PURE__ */ new Set([...yl.map((t) => t.itemKey), "w_hero_sword", ...Jt.filter((t) => t.key.startsWith("w_secret_") || t.key.startsWith("w_katana_")).map((t) => t.key)]);
function wl(t) {
  return { dagger: 16, longsword: 23, lance: 32, bow: 25, handgun: 18, greatsword: 29, katana: 27, dual_sword: 20, twin_daggers: 18, shield: 13 }[t];
}
function vl(t, e) {
  return t === "shield" || t === "bow" ? [0.5, 0.5] : t === "handgun" ? [e === "left" ? 0.68 : e === "right" ? 0.32 : 0.5, 0.78] : [0.5, t === "lance" ? 0.64 : 0.82];
}
function kl(t, e, r, s, n, i, a) {
  const l = ar[a ?? ""] ?? (a?.includes("pumpkin_") ? ar[`player_${r}_arcane`] : void 0) ?? ar[`player_${r}_leather`], [h, o, c, u] = l[tt(t, e)], d = qt(e), f = d === "attack" || d === "windup", g = s ? c : h, m = s ? u : o, p = t === "up" || (s ? t === "right" : t === "left" && !f), y = i === "bow" || i === "handgun";
  let _ = i === "shield" || y ? 0 : t === "left" ? -0.3 : t === "right" ? 0.3 : s ? 0.2 : -0.2;
  if (f && i !== "shield") {
    const w = y ? 0 : { down: Math.PI * 0.8, left: -Math.PI / 2, right: Math.PI / 2, up: 0 }[t], v = y ? 0 : t === "left" ? 0.7 : -0.7, x = Math.min(1, Math.max(0, n / (d === "windup" ? i === "katana" ? 120 : 58 : i === "katana" ? 170 : 85))), b = x * x * (3 - 2 * x);
    _ = d === "windup" ? _ + (v - _) * b : v + (w - v) * b;
  }
  return { x: g, y: m, angle: _, depth: p ? -0.12 : s ? 0.22 : 0.18 };
}
class pn {
  constructor(e) {
    this.scene = e, this.weapon = e.add.image(0, 0, "w_soldier_blade").setVisible(!1), this.waistFitting = e.add.image(0, 0, "katana_waist_fitting_v3").setVisible(!1), this.scabbard = e.add.image(0, 0, "katana_scabbard_v2").setVisible(!1), this.offhand = e.add.image(0, 0, "s_iron_round").setVisible(!1), this.swordAura = new kt(e, this.weapon, "sword"), this.shieldAura = new kt(e, this.offhand, "shield"), this.scabbardAura = new kt(e, this.scabbard, "scabbard"), this.fittingAura = new kt(e, this.waistFitting, "scabbard");
  }
  scene;
  weapon;
  offhand;
  scabbard;
  waistFitting;
  heroGlow;
  swordAura;
  shieldAura;
  scabbardAura;
  fittingAura;
  update(e, r, s, n, i, a, l = 0, h = !0) {
    this.scabbardAura.enabled = this.fittingAura.enabled = h && r?.key === "w_katana_divine", this.scabbardAura.alternate = this.fittingAura.alternate = !!r?.starred;
    const o = r?.dual ? r : fn(r) ? null : s;
    this.swordAura.enabled = h && (r?.key === "w_katana_divine" || !r?.starred && (r?.key === "w_hero_sword" || r?.key === "w_hw_emedral")), this.shieldAura.enabled = h && (o?.key === "s_arcadia_guard" || o?.key === "s_hw_emerald"), this.swordAura.emerald = r?.key === "w_hw_emedral", this.shieldAura.emerald = o?.key === "s_hw_emerald";
    const c = h && !r?.starred && r?.key === "w_hero_sword";
    c && !this.heroGlow ? this.heroGlow = this.weapon.postFX?.addGlow(16765786, 4, 1, !1, 0.1, 12) : !c && this.heroGlow && (this.weapon.postFX.remove(this.heroGlow), this.heroGlow = void 0);
    const u = h && e.visible && e.active && i !== "down", d = u && r?.weaponType === "katana", f = qt(i), g = Math.abs(e.scaleY) * (e.frame.realWidth || bs) / 40;
    if (this.scabbard.setVisible(!!d && n !== "down"), this.waistFitting.setVisible(!!d && n === "down"), d) {
      const m = `sheath_${r?.starred ? "star_" : ""}${r.key}`;
      this.scene.textures.exists(m) && this.scabbard.setTexture(m), this.scabbard.setOrigin(0.78, 0.5).setDisplaySize(g * 25, g * 5).setPosition(e.x + g * (n === "left" ? 5 : -2), e.y + g * 5).setRotation(e.rotation + (n === "left" ? -0.16 : 0.16)).setFlipX(n === "left").setDepth(e.depth + (n === "up" ? -0.15 : 0.16)).setAlpha(e.alpha), this.scabbard.clearTint(), n === "down" ? this.waistFitting.setDisplaySize(g * 3.8, g * 3.3).setOrigin(0.5).setPosition(e.x + g * 6, e.y + g * 4.5).setRotation(e.rotation - 0.15).setDepth(e.depth + 0.18).setAlpha(e.alpha).setTint(dn(r)) : n === "up" && this.scabbard.setOrigin(0.78, 0.5).setDisplaySize(g * 10, g * 2.6).setPosition(e.x - g * 5.5, e.y + g * 3).setRotation(e.rotation - Math.PI / 2 - 0.12).setFlipX(!1).setDepth(e.depth + 0.12);
    }
    for (const [m, p, y] of [[this.weapon, r, !1], [this.offhand, o, !0]]) {
      if (!u || !p || y && r?.starred && r.dual || "weaponType" in p && !_l.has(p.key) && !p.key.startsWith("w_hw_")) {
        m.setVisible(!1);
        continue;
      }
      const _ = "weaponType" in p ? p.weaponType : "shield";
      if (_ === "katana" && f !== "attack") {
        m.setVisible(!1);
        continue;
      }
      const w = `held_${p.key}`, v = "starred" in p && p.starred, x = !v && this.scene.textures.exists(w), b = v ? Jo(p.key) : x ? w : p.key, O = x ? gl[n] : void 0;
      (m.texture.key !== b || x && String(m.frame.name) !== String(O)) && m.setTexture(b, O);
      const A = kl(n, i, a, y, l, _, e.texture.key), R = p.key.startsWith("w_secret_") || p.key.startsWith("w_hw_");
      if (p.key === "w_hw_coffin" && !v && (A.angle += Math.PI), R && _ === "bow" && (A.angle = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[n]), R && _ === "handgun" && (A.angle = { up: -Math.PI / 2, right: 0, down: Math.PI / 2, left: 0 }[n]), p.key === "w_hero_sword") {
        n === "right" ? (A.x -= 7, A.y -= 5) : n === "down" && (A.x -= 3, A.y -= 3);
        const $ = qt(i), W = { down: -0.15, left: 0.5, right: -0.5, up: 0.2 }[n], q = { down: 2.45, left: -1.65, right: 1.65, up: -0.7 }[n];
        if ($ === "windup") {
          const X = Math.min(1, l / 180), J = 1 - Math.pow(1 - X, 3);
          A.angle = (n === "left" ? -0.3 : n === "right" ? 0.3 : -0.2) * (1 - J) + W * J, A.depth = 0.18;
        } else if ($ === "attack") {
          const X = Math.min(1, l / 140), J = X * X;
          if (A.angle = W + (q - W) * J, l > 170) {
            const te = Math.min(1, (l - 170) / 90);
            A.angle += ((n === "left" ? -0.3 : n === "right" ? 0.3 : -0.2) - q) * te;
          }
          A.depth = n === "up" ? -0.12 : 0.18;
        }
      }
      if (_ === "katana" && (A.x = 20), _ === "greatsword" && (A.x = 16), _ === "katana") {
        const $ = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[n], W = Math.min(1, l / 130), q = Math.max(0, Math.min(1, (l - 145) / 65)), X = Math.sin(W * Math.PI / 2) * (1 - q);
        if (A.x = 20 + Math.cos($) * 9 * X, A.y = 25 + Math.sin($) * 7 * X, A.angle = $ - 0.85 + W * 1.7 - Math.PI / 4, A.depth = 0.22, q >= 1) {
          m.setVisible(!1);
          continue;
        }
      }
      v && "dual" in p && p.dual && (A.x = 20), v && (A.angle += _ === "katana" ? Math.PI / 2 : _ === "handgun" ? Math.PI * 3 / 4 : Math.PI / 4);
      const C = (e.frame.realWidth || bs) / 40, I = (A.x - e.originX * 40) * e.scaleX * C, N = (A.y - e.originY * 40) * e.scaleY * C, U = Math.cos(e.rotation), H = Math.sin(e.rotation), [B, S] = v ? _ === "bow" || _ === "handgun" ? [0.5, 0.5] : "dual" in p && p.dual ? [0.5, 0.8] : [0.8, 0.8] : _ === "katana" ? [0.2, 0.8] : p.key === "w_hw_coffin" ? [0.5, 0.16] : p.key === "w_hero_sword" ? [0.5, 0.823] : x || R ? vl(_, n) : [0.5, 0.65], P = wl(_) * (p.key === "s_hw_emerald" ? 1.2 : p.key === "w_hero_sword" ? 1.35 : 1) * Math.abs(e.scaleY) * C / 0.85;
      m.setVisible(!0).setOrigin(B, S).setPosition(e.x + I * U - N * H, e.y + I * H + N * U).setDisplaySize(P, P).setRotation(e.rotation + A.angle).setFlipX(R && _ === "handgun" ? n === "left" : !!r?.dual && y && (n === "down" || n === "up")).setDepth(e.depth + A.depth).setAlpha(e.alpha).clearTint();
    }
  }
}
const or = 25, lr = 19, T = 48, gn = [[3, 9], [21, 9], [4, 15], [20, 15], [3, 16], [21, 16], [1, 3], [23, 3], [1, 14], [23, 14], [8, 2], [16, 2]], mn = [[9, 6], [15, 6], [9, 12], [15, 12]], D = { x: 12, y: 5 };
function ie(t, e) {
  return t < 1 || e < 1 || t > 23 || e > 17 || t >= 3 && t <= 7 && e >= 2 && e <= 5 || t >= 18 && t <= 22 && e >= 2 && e <= 5 || t >= 11 && t <= 13 && e >= 8 && e <= 10 || t === 16 && e === 11 || t === D.x && e === D.y || e === 12 && t >= 6 && t <= 8 || e === 12 && t >= 17 && t <= 19 || [...gn, ...mn].some(([r, s]) => r === t && s === e);
}
function Rs(t, e, r, s) {
  const n = Math.sin(r * 42e-4 + s);
  return { x: (t + 0.5) * T, y: (e + 0.5) * T - 2 + n * 2.2, angle: Math.sin(r * 2e-3 + s) * 2.5, pulse: n };
}
function bl(t, e, r) {
  for (const s of r) {
    const n = t.find((i) => i.id === s);
    (!n || n.x !== e.x || n.y !== e.y) && r.delete(s);
  }
  return t.find((s) => s.x === e.x && s.y === e.y && !r.has(s.id));
}
function Os(t, e, r = []) {
  if (t.x === e.x && t.y === e.y) return [];
  const s = (l) => `${l.x},${l.y}`, n = new Set(r.map(s));
  if (ie(e.x, e.y) || n.has(s(e))) return [];
  const i = [t], a = /* @__PURE__ */ new Map([[s(t), null]]);
  for (let l = 0; l < i.length; l++) {
    const h = i[l];
    if (h.x === e.x && h.y === e.y) {
      const o = [];
      let c = h;
      for (; c && (c.x !== t.x || c.y !== t.y); )
        o.push(c), c = a.get(s(c)) ?? null;
      return o.reverse();
    }
    for (const [o, c] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) {
      const u = { x: h.x + o, y: h.y + c }, d = s(u);
      !ie(u.x, u.y) && !n.has(d) && !a.has(d) && (a.set(d, h), i.push(u));
    }
  }
  return [];
}
const Ms = new URLSearchParams(location.search).get("mobile"), xl = "ontouchstart" in window || navigator.maxTouchPoints > 0, Sl = Math.min(window.innerWidth, window.innerHeight) <= 700, he = Ms === "1" ? !0 : Ms === "0" ? !1 : window.innerWidth <= 520 || xl && Sl, At = he ? 390 : 1280, br = he ? 844 : 760, Te = he ? 8 : 176, Ee = he ? 116 : 48, Rt = he ? 374 : 740, Ot = he ? 374 : 520;
async function Me(t, e = {}) {
  if (!_e) throw Error("オンラインに接続できません。");
  const { data: r, error: s } = await _e.rpc("online_world", { action: t, payload: e });
  if (s) throw Error(s.message);
  return r;
}
function Tl(t, e, r, s) {
  return !t?.seOn || e || r ? 0 : Math.max(0, Math.min(1, t.seVolume)) * (s === "hit" ? 0.5 : 0.12);
}
function cr(t, e) {
  const r = Tl(
    t.registry.get("onlineAudio"),
    t.sound.mute,
    t.game.config.audio.noAudio || new URLSearchParams(location.search).get("mute") === "1",
    e
  ), s = `online_charia_${e}`;
  r > 0 && t.cache.audio.exists(s) && t.sound.play(s, { volume: r, rate: e === "step" ? 0.96 + Math.random() * 0.08 : 1 });
}
function El(t) {
  return Math.max(0, ...t.map((e) => Number(e.id)));
}
function Al(t, e) {
  return t.filter((r) => Number(r.id) > e);
}
function yn(t, e) {
  if (!t.canvas) {
    t.events.once("ready", () => yn(t, e));
    return;
  }
  if (e && t.registry.set("onlineAudio", e), t.registry.get("gamePresentationInstalled")) return;
  t.registry.set("gamePresentationInstalled", !0);
  const r = t.canvas, s = r.ownerDocument.createElement("link");
  s.rel = "preload", s.as = "image", s.href = new URL("assets/ui/title-lake-v2/background.webp", r.ownerDocument.baseURI).href, r.ownerDocument.head.append(s), r.classList.add("chari-game-cursor");
  const n = () => {
    let i = "arrow";
    const a = t.scene.keys.OnlineTownScene, l = t.scene.keys.GameScene, h = a?.sys.isActive() ? a : l?.sys.isActive() ? l : void 0;
    if (h) {
      const o = h.input.activePointer, c = h === a ? h.hud : t.scene.keys.UIScene;
      if (c?.overlayMode === "none" && o.x >= Te && o.x < Te + Rt && o.y >= Ee && o.y < Ee + Ot && !c?.isSkillPointer?.(o.x, o.y)) {
        const u = h.cameras.main.getWorldPoint(o.x, o.y), d = h === a ? T : 32, f = Math.floor(u.x / d), g = Math.floor(u.y / d);
        h === a && h.skillArmed ? i = "skill" : (h === a ? f === D.x && g === D.y : h.enemyAt?.(f, g)) && (i = "attack");
      }
    }
    r.dataset.gameCursor !== i && (r.dataset.gameCursor = i);
  };
  t.events.on("poststep", n), t.events.once("destroy", () => t.events.off("poststep", n)), n();
}
function _n(t) {
  const e = document.createElement("section");
  e.className = "town-entry-loading", e.setAttribute("aria-label", "町を読み込み中"), e.setAttribute("aria-busy", "true");
  const r = document.createElement("img");
  r.src = new URL("assets/ui/title-lake-v2/background.webp", t.game.canvas.ownerDocument.baseURI).href, r.alt = "", r.className = "town-entry-painting", e.append(r);
  const s = document.createElement("div");
  s.className = "town-entry-caption";
  const n = document.createElement("p");
  n.textContent = "ONLINE · サーバー1", n.className = "town-entry-eyebrow";
  const i = document.createElement("h2");
  i.textContent = "はじまりの町へ";
  const a = document.createElement("p");
  a.setAttribute("role", "status"), a.textContent = "町への道を準備しています…";
  const l = document.createElement("div");
  l.className = "town-entry-progress", l.setAttribute("role", "progressbar"), l.setAttribute("aria-label", "町の読み込み状況"), l.setAttribute("aria-valuemin", "0"), l.setAttribute("aria-valuemax", "100");
  const h = document.createElement("div");
  l.append(h);
  const o = document.createElement("span");
  o.className = "town-entry-percent", s.append(n, i, a, l, o), e.append(s), document.body.append(e);
  let c = !1, u;
  const d = () => {
    const p = t.game.canvas.getBoundingClientRect();
    Object.assign(e.style, { left: `${p.left}px`, top: `${p.top}px`, width: `${p.width}px`, height: `${p.height}px` });
  }, f = new ResizeObserver(d);
  f.observe(t.game.canvas), window.addEventListener("resize", d), window.addEventListener("scroll", d);
  const g = () => {
    c || (c = !0, clearTimeout(u), f.disconnect(), window.removeEventListener("resize", d), window.removeEventListener("scroll", d), e.remove());
  }, m = (p, y = "町の画像と冒険者を読み込み中…") => {
    if (c) return;
    const _ = Math.round(Math.max(0, Math.min(1, p)) * 100);
    h.style.width = `${_}%`, l.setAttribute("aria-valuenow", String(_)), o.textContent = `${_}%`, a.textContent = y;
  };
  return d(), m(0.03, "サーバーに接続中…"), { root: e, update: m, destroy: g, finish(p) {
    m(1, "準備ができました"), e.setAttribute("aria-busy", "false"), e.classList.add("ready"), u = setTimeout(() => {
      g(), p();
    }, 220);
  } };
}
function Rl(t, e) {
  const r = document.createElement("section");
  r.className = "town-chat", r.setAttribute("aria-label", "ログと町のチャット");
  const s = document.createElement("nav");
  s.className = "town-chat-tabs", s.setAttribute("aria-label", "ログとチャットの切り替え"), r.append(s);
  const n = document.createElement("button"), i = document.createElement("button"), a = document.createElement("button");
  n.textContent = "ログ", i.textContent = "チャット", a.textContent = "開閉", a.setAttribute("aria-label", "ログとチャットを開閉");
  for (const S of [n, i, a])
    S.type = "button", s.append(S);
  const l = document.createElement("div");
  l.className = "town-chat-log", l.setAttribute("role", "log");
  const h = document.createElement("div");
  h.className = "town-chat-viewport", h.append(l), r.append(h);
  const o = document.createElement("div"), c = document.createElement("button"), u = document.createElement("div"), d = document.createElement("div"), f = document.createElement("button");
  o.className = "town-chat-scroll", c.textContent = "▲", f.textContent = "▼", c.type = f.type = "button", c.setAttribute("aria-label", "過去の発言へ"), f.setAttribute("aria-label", "新しい発言へ"), u.className = "town-chat-track", d.className = "town-chat-thumb", d.setAttribute("role", "scrollbar"), d.setAttribute("aria-label", "履歴のスクロール位置"), d.tabIndex = 0, u.append(d), o.append(c, u, f), h.append(o);
  const g = document.createElement("div");
  g.className = "town-chat-status", g.setAttribute("role", "status"), r.append(g);
  const m = document.createElement("form"), p = document.createElement("input"), y = document.createElement("button");
  p.maxLength = 200, m.noValidate = !0, p.setAttribute("aria-label", "町にメッセージ"), p.placeholder = "町のみんなに話す（200文字まで）", y.textContent = "送信", y.type = "submit", m.append(p, y), r.append(m), document.body.append(r);
  let _ = !he, w = !0, v = "", x = !1, b = "chat";
  const O = /* @__PURE__ */ new Map();
  let A = [];
  const R = [], j = { log: 0, chat: 0 }, C = () => {
    const S = Math.max(0, l.scrollHeight - l.clientHeight), P = u.clientHeight, $ = S ? Math.max(18, P * l.clientHeight / l.scrollHeight) : P;
    d.style.height = `${$}px`, d.style.top = `${S ? (P - $) * l.scrollTop / S : 0}px`, d.setAttribute("aria-valuemin", "0"), d.setAttribute("aria-valuemax", String(S)), d.setAttribute("aria-valuenow", String(Math.round(l.scrollTop))), o.classList.toggle("disabled", S === 0);
  }, I = (S) => {
    l.scrollTop += S, j[b] = l.scrollTop, C();
  };
  l.addEventListener("scroll", C), h.addEventListener("wheel", (S) => {
    S.preventDefault(), I(S.deltaY);
  }, { passive: !1 }), c.onclick = () => I(-42), f.onclick = () => I(42), u.onpointerdown = (S) => {
    S.target !== d && I((S.clientY < d.getBoundingClientRect().top ? -1 : 1) * l.clientHeight * 0.8);
  }, d.onpointerdown = (S) => {
    S.preventDefault(), d.setPointerCapture(S.pointerId);
    const P = S.clientY, $ = l.scrollTop, W = (X) => {
      const J = u.getBoundingClientRect().height / u.clientHeight;
      l.scrollTop = $ + (X.clientY - P) / J * (l.scrollHeight - l.clientHeight) / Math.max(1, u.clientHeight - d.offsetHeight), C();
    }, q = () => {
      d.removeEventListener("pointermove", W), d.removeEventListener("pointerup", q);
    };
    d.addEventListener("pointermove", W), d.addEventListener("pointerup", q);
  }, d.onkeydown = (S) => {
    ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(S.key) && (S.preventDefault(), I(S.key === "Home" ? -l.scrollHeight : S.key === "End" ? l.scrollHeight : (S.key.includes("Up") ? -1 : 1) * (S.key.startsWith("Page") ? l.clientHeight : 42)));
  };
  const N = () => {
    const S = b === "chat" ? A.map((P) => `${P.name}：${P.message}`) : R;
    l.replaceChildren(...S.map((P) => {
      const $ = document.createElement("p");
      return $.textContent = P, $;
    })), l.setAttribute("aria-label", b === "chat" ? "町の発言" : "町の行動ログ"), m.hidden = b !== "chat", n.setAttribute("aria-pressed", String(b === "log")), i.setAttribute("aria-pressed", String(b === "chat"));
  }, U = (S) => {
    j[b] = l.scrollTop, b = S, _ = !0, g.textContent = "", N(), H(), l.scrollTop = j[b], C();
  };
  n.onclick = () => U("log"), i.onclick = () => U("chat"), a.onclick = () => {
    _ = !_, H();
  };
  const H = () => {
    const S = t.game.canvas.getBoundingClientRect(), P = S.width / At, $ = 8, W = he ? _ ? 510 : 766 : 568, q = he ? 374 : 700, X = he ? _ ? 280 : 30 : 184;
    r.style.cssText = `left:${S.left + $ * P}px;top:${S.top + W * P}px;width:${q}px;height:${X}px;transform:scale(${P},${S.height / br});`, r.classList.toggle("compact", !_), a.setAttribute("aria-expanded", String(_)), C();
  }, B = new ResizeObserver(H);
  return B.observe(t.game.canvas), window.addEventListener("resize", H), window.addEventListener("scroll", H), N(), H(), r.addEventListener("keydown", (S) => S.stopPropagation()), m.onsubmit = async (S) => {
    if (S.preventDefault(), !(x || !p.value.trim())) {
      x = !0, y.disabled = !0;
      try {
        await e(p.value.trim()), p.value = "", g.textContent = "";
      } catch (P) {
        g.textContent = P.message;
      } finally {
        x = !1, y.disabled = !1;
      }
    }
  }, { root: r, input: p, update(S) {
    const P = JSON.stringify(S);
    if (P === v) return;
    v = P;
    for (const q of S) O.set(Number(q.id), q);
    A = [...O.values()].sort((q, X) => Number(q.id) - Number(X.id)).slice(-100), O.clear();
    for (const q of A) O.set(Number(q.id), q);
    if (b !== "chat") return;
    const $ = l.scrollHeight - l.scrollTop - l.clientHeight < 32, W = l.scrollTop;
    N(), l.scrollTop = $ ? l.scrollHeight : W, C();
  }, notice(S) {
    if (R.push(S), R.length > 100 && R.shift(), b === "log") {
      const P = l.scrollHeight - l.scrollTop - l.clientHeight < 32, $ = l.scrollTop;
      N(), l.scrollTop = P ? l.scrollHeight : $, C();
    } else g.textContent = S;
  }, destroy() {
    w && (w = !1, B.disconnect(), window.removeEventListener("resize", H), window.removeEventListener("scroll", H), r.remove());
  } };
}
function Ol(t, e) {
  if (t.scene.manager.keys.OnlineTownScene) return;
  const r = Object.getPrototypeOf(Object.getPrototypeOf(t)).constructor, s = t.scene.get("UIScene").constructor;
  class n extends r {
    constructor() {
      super("OnlineLobbyScene");
    }
    create() {
      const o = this.add.image(At / 2, br / 2, "title_citadel_v1");
      o.setScale(Math.max(At / o.width, br / o.height)), e(this);
    }
  }
  class i extends r {
    packet;
    preview = !1;
    player = new xs();
    playerGender = "male";
    difficulty = "normal";
    eventMode = !1;
    floor = 1;
    turn = 0;
    dungeon = {};
    discovered = /* @__PURE__ */ new Set();
    discoveredEquipment = /* @__PURE__ */ new Set(["w_iron_dagger", "armor_leather"]);
    secretQuests = { fragments: 0, kills: {}, claimed: [], announced: [] };
    logHistory = [];
    damageHistory = [];
    adventureHistory = [];
    busy = !1;
    gameEnded = !1;
    reviving = !1;
    inBossRoom = !1;
    floorBossDefeated = !0;
    bossRewardClaimed = !1;
    pendingEquipment = null;
    secretDualUnlocked = !1;
    transformation = null;
    timeStopTurns = 0;
    lanceSkillTurns = 0;
    skillStepsRemaining = 0;
    skillChargeRequired = 100;
    skillArmed = !1;
    skillPreview;
    holdBoostTier = 0;
    holdStartedAt = 0;
    heldDir = null;
    touchDir = null;
    shopRemaining = {};
    weaponWonThisFloor = !1;
    actors = /* @__PURE__ */ new Map();
    bubbles = /* @__PURE__ */ new Map();
    lastBubbleId;
    lastHitId;
    trainingBarrel;
    attackTarget = !1;
    lastAttackAttempt = -1e3;
    spaceKey;
    cursorTile;
    groundSprites = [];
    groundMotions = [];
    autoPickupIgnored = /* @__PURE__ */ new Set();
    groundSignature = "";
    pickupTarget;
    dropArtPending = /* @__PURE__ */ new Set();
    entryLoading;
    chatAfterId = 0;
    chat;
    pollTimer;
    requestBusy = !1;
    pollBusy = !1;
    requestRevision = 0;
    generation = 0;
    lastMove = 0;
    destination;
    hud;
    cursors;
    get playerArmor() {
      return this.player.armor?.key ?? "leather";
    }
    constructor() {
      super("OnlineTownScene");
    }
    init(o) {
      this.entryLoading = o.entryLoading ?? _n(this), this.chatAfterId = El(o.state.messages), this.preview = !!o.preview && !1, this.packet = o.state, this.generation++, this.gameEnded = !1, this.requestBusy = !1, this.pollBusy = !1, this.actors = /* @__PURE__ */ new Map(), this.destination = void 0, this.lastMove = 0, this.logHistory = [], this.adventureHistory = [], this.lastBubbleId = void 0, this.lastHitId = void 0, this.bubbles.clear(), this.autoPickupIgnored = /* @__PURE__ */ new Set(), this.attackTarget = !1, this.lastAttackAttempt = -1e3, this.skillArmed = !1, this.player = new xs(), this.player.weapons = [rt("w_iron_dagger", [])], this.player.armors[0].trait = void 0, this.syncPlayer();
    }
    preload() {
      this.load.on("progress", (u) => this.entryLoading?.update(0.12 + u * 0.84));
      for (const u of ["hit", "step"]) this.cache.audio.exists(`online_charia_${u}`) || this.load.audio(`online_charia_${u}`, `assets/online/charia-${u}-v1.wav`);
      const o = this.registry.get("assetManifest") ?? [], c = new Set(Ye.filter((u) => this.packet.superAccount || this.packet.active?.inventory[u.key] || this.packet.active?.equipment?.weapon.some((d) => d.replace(/^star_/, "") === u.key) || this.packet.active?.equipment?.shield.includes(u.key)).flatMap((u) => [u.textureKey, `star_${u.textureKey}`, `icon_${u.textureKey}`, `arrow_${u.key}`, `held_${u.key}`, `sheath_${u.key}`]));
      for (const u of o.filter((d) => c.has(d.key) || /^(ui_|armor_|player_|held_|arrow_|sheath_|katana_|fx_hw_|fx_bolt$|fx_|skill_|w_soldier_blade$|s_iron_round$|w_iron_dagger$|terrain_healing_fountain$|gacha_ritual_v2$|coin$|i_potion$|potion$|held_w_iron_dagger$)/.test(d.key))) {
        const d = this.textures.exists(u.key) ? this.textures.get(u.key).getSourceImage() : null;
        d?.tagName === "IMG" && !d.src.startsWith("data:") || (this.textures.exists(u.key) && this.textures.remove(u.key), u.kind === "spritesheet" ? this.load.spritesheet(u.key, Ut(u.path), u.config) : this.load.image(u.key, Ut(u.path)));
      }
      for (const u of Ye.filter((d) => d.category === "weapon")) {
        const d = `star_${u.key}`;
        if ((this.textures.exists(d) ? this.textures.get(d).getSourceImage() : null)?.tagName !== "IMG" && (this.textures.exists(d) && this.textures.remove(d), this.load.image(d, `assets/star-weapons-v1/${d}.webp`)), u.key.startsWith("w_katana_")) {
          const g = `sheath_${d}`;
          this.textures.exists(g) || this.load.image(g, `assets/katana-sheaths-v1/${g}.webp`);
        }
      }
      this.load.spritesheet("online_town_props", "assets/online/town-props-v2.png", { frameWidth: 512, frameHeight: 512 }), this.load.spritesheet("online_town_floor", "assets/terrain/ruins-floor-v1/1.png", { frameWidth: 64, frameHeight: 64 }), this.load.spritesheet("online_town_grass", "assets/online/town-grass-v1.png", { frameWidth: 128, frameHeight: 128 }), this.load.image("online_training_barrel", "assets/online/training-barrel-v1.png"), this.load.image("online_town_fountain", "assets/terrain/objects/healing-fountain-pixel.png");
    }
    create() {
      this.busy = !0, this.entryLoading?.update(0.98, "町と冒険者を準備中…");
      const o = this.game.canvas.ownerDocument.getElementById("loading-screen");
      o && (o.style.display = "none"), this.cameras.main.setViewport(Te, Ee, Rt, Ot).setBounds(0, 0, or * T, lr * T).setBackgroundColor("#253c33");
      for (let p = 0; p < lr; p++) for (let y = 0; y < or; y++)
        !ie(y, p) ? this.add.image(y * T + T / 2, p * T + T / 2, "online_town_floor", (y * 7 + p * 3) % 6).setDisplaySize(T, T).setTint(14340536) : this.add.image(y * T + T / 2, p * T + T / 2, "online_town_grass", (y * 7 + p * 3) % 64).setDisplaySize(T + 1, T + 1);
      const c = this.add.graphics();
      for (let p = 1; p < 18; p++) for (let y = 1; y < 24; y++) ie(y, p) || c.lineStyle(1, 1580056, 0.5).strokeRect(y * T, p * T, T, T);
      const u = (p, y, _, w, v) => this.add.image((y + 0.5) * T, (_ + 1) * T, "online_town_props", p).setOrigin(0.5, 1).setDisplaySize(w, v).setDepth(_ + 1);
      u(0, 5, 5, 300, 280), u(1, 20, 5, 300, 280), this.groundSprites = [], this.groundMotions = [], this.groundSignature = "", this.pickupTarget = void 0, this.dropArtPending.clear();
      for (const [p, y] of gn) u(2, p, y, 150, 160);
      for (const [p, y] of mn) u(3, p, y, 100, 140);
      u(4, 7, 12, 180, 115), u(4, 18, 12, 180, 115);
      const d = this.add.image(12.5 * T, 9.5 * T, "online_town_fountain").setDisplaySize(144, 144).setDepth(10.7);
      this.tweens.add({ targets: d, alpha: 0.88, duration: 1600, yoyo: !0, repeat: -1 }), u(5, 16, 11, 64, 64).setInteractive({ useHandCursor: !0 }).on("pointerdown", (p) => {
        p.rightButtonDown() || (this.stopClickPath(), this.log("案内人リーフ「ようこそ、はじまりの町へ。ここで冒険仲間を待っていてね。迷宮への道は準備中だよ。」"));
      });
      for (const [p, y, _] of [[5, 5, "冒険者の宿"], [20, 5, "倉庫（準備中）"], [16, 11, "案内人リーフ"]]) this.add.text((p + 0.5) * T, (y + 1) * T + 5, _, { fontFamily: "Meiryo", fontSize: "13px", color: "#ffe4ae", backgroundColor: "#10231bba", padding: { x: 5, y: 3 } }).setOrigin(0.5, 0).setDepth(90);
      this.cursorTile = this.add.rectangle(0, 0, T, T, 16777215, 0.12).setStrokeStyle(1, 16777215, 0.3).setDepth(34).setName("cursor-tile").setVisible(!1), this.trainingBarrel = this.add.image((D.x + 0.5) * T, (D.y + 1) * T, "online_training_barrel").setOrigin(0.5, 1).setDisplaySize(80, 80).setDepth(D.y + 0.8).setInteractive({ useHandCursor: !0 }), this.trainingBarrel.on("pointerdown", (p, y, _, w) => {
        p.rightButtonDown() || (w?.stopPropagation(), this.queueTraining());
      }), this.add.text((D.x + 0.5) * T, (D.y + 1) * T - 82, "練習樽 · 壊れません", { fontFamily: "Meiryo", fontSize: "12px", color: "#ffe3a4", backgroundColor: "#10231bbb", padding: { x: 4, y: 3 } }).setOrigin(0.5, 1).setDepth(90), this.skillPreview = this.add.graphics().setDepth(33), this.input.mouse?.disableContextMenu(), this.input.keyboard?.on("keydown-Q", (p) => {
        !p.repeat && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName ?? "") && this.useWeaponSkill();
      }), this.cursors = this.input.keyboard?.createCursorKeys(), this.spaceKey = this.input.keyboard?.addKey("SPACE"), this.input.on("pointerdown", (p) => {
        if (this.busy || this.hud?.overlayMode !== "none" || p.x < Te || p.y < Ee || p.x > Te + Rt || p.y > Ee + Ot || this.hud?.isSkillPointer(p.x, p.y)) return;
        const y = this.cameras.main.getWorldPoint(p.x, p.y), _ = Math.floor(y.x / T), w = Math.floor(y.y / T);
        if (p.rightButtonDown()) {
          this.stopClickPath();
          const v = _ - this.player.x, x = w - this.player.y, b = Math.abs(v) > Math.abs(x) ? v > 0 ? "right" : "left" : x ? x > 0 ? "down" : "up" : this.player.dir;
          this.performAttack(b);
          return;
        }
        if (_ === this.player.x && w === this.player.y) {
          this.stopClickPath(), this.requestBusy || this.action("wait").catch((v) => this.log(v.message));
          return;
        }
        (_ !== D.x || w !== D.y) && (this.attackTarget = !1), !ie(_, w) && !this.occupiedByOther(_, w) ? this.destination = { x: _, y: w } : this.occupiedByOther(_, w) && this.log("そこにはほかの冒険者がいます。");
      }), this.scene.launch("OnlineUIScene"), this.hud = this.scene.get("OnlineUIScene"), this.chat = Rl(this, async (p) => {
        await this.action("chat", { message: p });
      }), this.log("はじまりの町に入場しました。落ちたアイテムはそのマスに乗ると拾えます。"), this.drawPlayers();
      const g = this.entryLoading;
      this.events.once("shutdown", () => g?.destroy()), this.game.events.once("postrender", () => {
        this.scene.isActive() && (g?.finish(() => {
          this.busy = !1;
        }), g || (this.busy = !1));
      });
      const m = this.generation;
      this.pollTimer = setInterval(() => {
        if (this.preview || this.requestBusy || this.pollBusy || !this.scene.isActive()) return;
        this.pollBusy = !0;
        const p = this.requestRevision;
        Me("poll").then((y) => {
          m === this.generation && p === this.requestRevision && !this.requestBusy && (this.packet = y, this.syncPlayer(), this.drawPlayers());
        }).catch((y) => this.log(y.message)).finally(() => {
          this.pollBusy = !1;
        });
      }, 400), this.events.once("shutdown", () => {
        this.generation++, clearInterval(this.pollTimer), this.chat?.destroy(), this.chat = void 0, this.scene.stop("OnlineUIScene"), this.preview || Me("leave").catch(() => {
        });
      });
    }
    syncPlayer() {
      const o = this.packet.active;
      if (!o) return;
      this.player.name = o.name, this.playerGender = o.gender, this.player.hp = o.hp, this.skillStepsRemaining = o.skillStepsRemaining ?? 0, this.timeStopTurns = o.timeStopTurns ?? 0;
      const c = o.equipment ?? { weapon: ["w_iron_dagger"], armor: ["leather"], shield: [] };
      this.player.weapons = c.weapon.map((f) => {
        const g = rt(f.replace(/^star_/, ""), []);
        return g.variantRolled = !0, f.startsWith("star_") && (g.starred = !0, g.name += "★"), g;
      }), this.player.armors = c.armor.filter(Et).map((f) => {
        const g = hn(f);
        return g.trait = void 0, g;
      }), this.player.shields = c.shield.map((f) => Ht(f));
      const u = o.gear.weapon_key ?? "w_iron_dagger", d = o.gear.armor_key ?? "leather";
      this.player.weapon = o.gear.weapon ? this.player.weapons.find((f) => (f.starred ? "star_" : "") + f.key === u) ?? null : null, this.player.armor = o.gear.armor ? this.player.armors.find((f) => f.key === d) ?? null : null, this.player.shield = o.gear.shield ? this.player.shields.find((f) => f.key === o.gear.shield_key) ?? null : null, this.discoveredEquipment = /* @__PURE__ */ new Set([...c.weapon.map((f) => f.replace(/^star_/, "")), ...c.armor.map((f) => "armor_" + f), ...c.shield]), this.player.inventory = [];
      for (const [f, g] of Object.entries(o.inventory)) if (Ye.some((m) => m.category === "item" && m.key === f)) for (let m = 0; m < g; m++) this.player.inventory.push(Tt(f));
      this.events.emit("refresh");
    }
    drawPlayers() {
      const o = new Set(this.packet.players.map((c) => c.character_id));
      for (const [c, u] of this.actors) o.has(c) || (u.renderer.weapon.destroy(), u.renderer.offhand.destroy(), u.renderer.scabbard.destroy(), u.renderer.waistFitting.destroy(), this.bubbles.get(c)?.root.destroy(), this.bubbles.delete(c), u.body.destroy(), u.anchor.destroy(), u.shadow.destroy(), u.leftFoot.destroy(), u.rightFoot.destroy(), u.label.destroy(), this.actors.delete(c));
      for (const c of this.packet.players) {
        let u = this.actors.get(c.character_id);
        const d = (c.x + 0.5) * T, f = (c.y + 0.45) * T;
        if (!u) {
          const m = new pn(this), p = this.add.zone(d, f, 1, 1), y = this.add.ellipse(d, f + 27, 25, 7, 0, 0.22), _ = this.add.ellipse(d - 7, f + 28, 12, 4, 0, 0.17), w = this.add.ellipse(d + 7, f + 28, 12, 4, 0, 0.17), v = this.add.image(d, f, Bt(c.gender, Et(c.armor) ? c.armor : "leather"), tt(c.dir, "idle")).setDisplaySize(64, 64), x = this.add.text(d, f + 30, c.name, { fontFamily: "Meiryo", fontSize: "12px", color: "#fff0c6", stroke: "#07130b", strokeThickness: 3 }).setOrigin(0.5).setDepth(95);
          u = { renderer: m, body: v, anchor: p, shadow: y, leftFoot: _, rightFoot: w, label: x, x: c.x, y: c.y, dir: c.dir, movingUntil: 0, animation: new nl(), lastSnapshotAt: this.time.now, distance: 0, weight: 0, lastPoseTime: this.time.now, previousX: d, previousY: f, attackUntil: 0, attackStarted: 0, attackWindup: 58, projectileLaunched: !1, weapon: null, shield: null, queue: [], stepping: !1, lastFacing: c.dir }, this.actors.set(c.character_id, u);
        }
        (u.x !== c.x || u.y !== c.y) && this.moveActor(u, c, Le), u.weapon = c.character_id === this.packet.active?.id ? this.player.weapon : this.visualWeapon(c.weapon === void 0 ? "w_iron_dagger" : c.weapon), u.shield = c.character_id === this.packet.active?.id ? this.player.shield : c.shield ? Ht(c.shield) : null;
        const g = Bt(c.gender, Et(c.armor) ? c.armor : "leather");
        u.body.texture.key !== g && u.body.setTexture(g, tt(c.dir, u.animation.sample(this.time.now))), u.body.setDepth(c.y + 0.8), u.stepping || (u.dir = c.dir), u.lastFacing = c.dir, u.x = c.x, u.y = c.y, u.lastSnapshotAt = this.time.now, c.character_id === this.packet.active?.id && (this.player.x = c.x, this.player.y = c.y, this.player.dir = c.dir, this.cameras.main.startFollow(u.anchor, !0, 0.18, 0.18));
      }
      this.chat?.update(Al(this.packet.messages, this.chatAfterId)), this.drawDrops(), this.renderTownEvents();
    }
    renderTownEvents() {
      const o = Math.max(0, ...this.packet.messages.map((d) => Number(d.id)));
      if (this.lastBubbleId !== void 0)
        for (const d of this.packet.messages) Number(d.id) > this.lastBubbleId && Number(d.id) > this.chatAfterId && d.character_id && this.actors.has(d.character_id) && this.showBubble(d.character_id, d.message);
      this.lastBubbleId = o;
      const c = this.packet.trainingHits ?? [], u = Math.max(0, ...c.map((d) => Number(d.id)));
      if (this.lastHitId !== void 0)
        for (const d of c) Number(d.id) > this.lastHitId && this.showTrainingHit(d);
      this.lastHitId = u;
    }
    showBubble(o, c) {
      this.bubbles.get(o)?.root.destroy();
      const u = this.add.text(0, 0, hl(c), { fontFamily: "Meiryo", fontSize: "12px", color: "#17241f", wordWrap: { width: 164, useAdvancedWrap: !0 }, lineSpacing: 3 }).setOrigin(0.5, 1), d = Math.max(36, u.width + 18), f = u.height + 14, g = this.add.graphics();
      g.fillStyle(16775656, 0.97).fillRoundedRect(-d / 2, -f, d, f, 8), g.lineStyle(1, 10455392, 0.95).strokeRoundedRect(-d / 2, -f, d, f, 8), g.fillStyle(16775656, 0.97).fillTriangle(-5, 0, 5, 0, 0, 7), u.setY(-7);
      const m = this.add.container(0, 0, [g, u]).setDepth(120);
      this.bubbles.set(o, { root: m, until: this.time.now + 6e3 });
    }
    queueTraining() {
      this.attackTarget = !0, this.destination = void 0, this.pickupTarget = void 0;
    }
    tryTraining() {
      const o = D.x - this.player.x, c = D.y - this.player.y, u = this.player.weapon?.weaponType, d = u === "bow" || u === "handgun" ? 3 : u === "lance" ? 2 : 1;
      if ((o === 0 || c === 0) && Math.abs(o) + Math.abs(c) <= d) {
        if (this.time.now - this.lastAttackAttempt < 340) return;
        this.attackTarget = !1, this.destination = void 0, this.lastAttackAttempt = this.time.now, this.action("train").catch((f) => this.log(f.message));
        return;
      }
      if (!this.destination) {
        const f = [[0, 1], [-1, 0], [1, 0], [0, -1]].map(([g, m]) => ({ x: D.x + g, y: D.y + m })).filter((g) => !ie(g.x, g.y) && !this.occupiedByOther(g.x, g.y));
        f.sort((g, m) => Math.abs(g.x - this.player.x) + Math.abs(g.y - this.player.y) - Math.abs(m.x - this.player.x) - Math.abs(m.y - this.player.y)), this.destination = f[0], this.destination || (this.attackTarget = !1, this.log("樽の周りが埋まっています。"));
      }
    }
    async performAttack(o) {
      if (this.busy || this.requestBusy || this.hud?.overlayMode !== "none") return;
      const c = this.skillArmed;
      try {
        await this.action(c ? "skill" : "attack", { dir: o }), c && (this.skillArmed = !1);
      } catch (u) {
        this.log(u.message);
      }
    }
    showTrainingHit(o) {
      const c = this.actors.get(o.character_id);
      if (o.action_kind === "wait") {
        c && (c.movingUntil = this.time.now + Le), o.character_id === this.packet.active?.id && this.time.delayedCall(Le / 2, () => cr(this, "step"));
        return;
      }
      if (c) {
        c.dir = o.dir;
        const d = o.origin_x ?? Math.round(c.anchor.x / T - 0.5), f = o.origin_y ?? Math.round(c.anchor.y / T - 0.45);
        c.attackPoint = { x: d, y: f };
        for (let p = 1; p <= 3; p++) {
          const y = { x: d + (o.dir === "left" ? -p : o.dir === "right" ? p : 0), y: f + (o.dir === "up" ? -p : o.dir === "down" ? p : 0) };
          if (ie(y.x, y.y) && !(y.x === 12 && y.y === 5) || (c.attackPoint = y, y.x === 12 && y.y === 5)) break;
        }
        o.weapon_key !== void 0 && (c.weapon = this.visualWeapon(o.weapon_key));
        const g = c.weapon?.weaponType, m = c.weapon?.key === "w_hero_sword";
        if (c.attackWindup = m ? 200 : 58, c.animation.attackFrameMs = m ? 65 : g === "katana" ? 52 : 26, c.animation.windupFrameMs = m ? 90 : g === "katana" ? 70 : 29, c.attackStarted = this.time.now, c.attackUntil = this.time.now + c.attackWindup + Math.max(210, c.animation.attackFrameMs * 4), c.projectileLaunched = o.action_kind === "skill", c.animation.play("atkWindup", this.time.now), o.action_kind === "skill" && c.weapon) {
          const p = c.weapon, y = p.weaponType, _ = { x: o.origin_x ?? Math.round(c.anchor.x / T - 0.5), y: o.origin_y ?? Math.round(c.anchor.y / T - 0.45) }, w = Fe(y), v = nr(y, _, o.dir, { blocked: (x, b) => ie(x, b) && !(x === 12 && b === 5), enemyAt: (x, b) => x === 12 && b === 5 ? !0 : null, canHit: () => !0 });
          c.attackWindup = y === "katana" ? 170 : c.weapon.key === "w_hero_sword" ? 200 : 0, c.attackUntil = this.time.now + c.attackWindup + Math.max(350, Ts(y)), this.time.delayedCall(c.attackWindup, () => cl(this, y, _, o.dir, o.skill_type === "dagger_finish" ? v.tiles.slice(0, 1) : v.tiles, (p.starred ? "star_" : "") + p.key, w.color, T)), o.character_id === this.packet.active?.id && this.log((o.skill_type === "dagger_finish" ? "零刻領域の追撃" : w.name) + "！" + (y === "dagger" && o.skill_type !== "dagger_finish" ? " 5回の移動・足踏み後に正面へ追撃します。" : ""));
        }
      }
      if (o.hit_target === !1 || o.damage === 0) return;
      const u = c ? c.attackWindup + (o.action_kind === "skill" && c.weapon ? Ts(c.weapon.weaponType) : c.weapon?.weaponType === "bow" || c.weapon?.weaponType === "handgun" ? 180 : 45) : 0;
      this.time.delayedCall(u, () => {
        o.character_id === this.packet.active?.id && cr(this, "hit");
        const d = (D.x + 0.5) * T, f = (D.y + 0.3) * T, g = this.add.text(d + (Math.random() - 0.5) * 18, f, `${o.damage}`, { fontFamily: "Meiryo", fontSize: "22px", fontStyle: "bold", color: "#ffe297", stroke: "#361f12", strokeThickness: 4 }).setOrigin(0.5).setDepth(125);
        this.tweens.add({ targets: g, y: f - 38, alpha: 0, duration: 850, onComplete: () => g.destroy() }), this.trainingBarrel && (this.tweens.killTweensOf(this.trainingBarrel), this.trainingBarrel.setAngle(-3).setTint(16765845), this.tweens.add({ targets: this.trainingBarrel, angle: 3, duration: 55, yoyo: !0, repeat: 1, onComplete: () => {
          this.trainingBarrel.setAngle(0).clearTint();
        } })), o.character_id === this.packet.active?.id && this.log(`練習樽に${o.damage}ダメージ。樽は壊れません。`);
      });
    }
    visualWeapon(o) {
      if (!o) return null;
      const c = rt(o.replace(/^star_/, ""), []);
      return c.starred = o.startsWith("star_"), c;
    }
    occupiedByOther(o, c) {
      return this.packet.players.some((u) => u.character_id !== this.packet.active?.id && u.x === o && u.y === c);
    }
    moveActor(o, c, u) {
      const d = o.stepTarget ?? { x: Math.round(o.anchor.x / T - 0.5), y: Math.round(o.anchor.y / T - 0.45) };
      o.queue = Os(d, c, this.packet.players.filter((f) => this.actors.get(f.character_id) !== o)), o.x = c.x, o.y = c.y, o.lastFacing = c.dir, this.advanceActor(o);
    }
    advanceActor(o) {
      if (o.stepping || !o.queue.length) return;
      const c = o.queue.shift();
      o.stepTarget = c, o.stepping = !0;
      const u = (c.x + 0.5) * T - o.anchor.x, d = (c.y + 0.45) * T - o.anchor.y;
      o.dir = Math.abs(u) > 0.1 ? u > 0 ? "right" : "left" : d > 0 ? "down" : "up", o.animation.play("walk1", this.time.now), this.tweens.add({ targets: o.anchor, x: (c.x + 0.5) * T, y: (c.y + 0.45) * T, duration: Le, ease: "Sine.easeInOut", onComplete: () => {
        o.stepping = !1, o.stepTarget = void 0, this.actors.get(this.packet.active?.id ?? "") === o && cr(this, "step"), o.queue.length ? this.advanceActor(o) : o.dir = o.lastFacing;
      } });
    }
    groundItemInfo(o) {
      const c = o.kind.replace(/^star_/, ""), u = Ye.find((d) => d.key === c);
      return { name: (u?.name ?? o.kind) + (o.kind.startsWith("star_") ? "★" : ""), texture: u?.textureKey ?? "ui_nav_inventory" };
    }
    ensureDropArt(o) {
      const c = this.textures.exists(o), u = c ? this.textures.get(o).getSourceImage() : null, d = (this.registry.get("assetManifest") ?? []).find((f) => f.key === o && f.kind !== "spritesheet");
      u?.tagName === "IMG" || !d || this.dropArtPending.has(o) || (this.dropArtPending.add(o), c && this.textures.remove(o), this.load.once(`filecomplete-image-${o}`, () => {
        this.dropArtPending.delete(o), this.groundSignature = "", this.scene.isActive() && this.drawDrops();
      }), this.load.image(o, d.path), this.load.start());
    }
    drawDrops() {
      const o = JSON.stringify(this.packet.drops ?? []);
      if (o !== this.groundSignature) {
        this.groundSignature = o;
        for (const c of this.groundSprites) c.destroy();
        this.groundSprites = [], this.groundMotions = [];
        for (const c of this.packet.drops ?? []) {
          const u = [...c.id].reduce((p, y) => p * 31 + y.charCodeAt(0) >>> 0, 0) % 6283 / 1e3, d = Rs(c.x, c.y, this.time.now, u), f = this.groundItemInfo(c);
          this.ensureDropArt(f.texture);
          const g = this.add.ellipse(d.x, (c.y + 0.5) * T + 4, 30, 9, 10346944, 0.16).setDepth(c.y + 0.4), m = this.add.image(d.x, d.y, this.textures.exists(f.texture) ? f.texture : "ui_nav_inventory").setDisplaySize(30, 30).setDepth(c.y + 0.5).setName("online-ground-drop").setData("dropId", c.id).setInteractive({ useHandCursor: !0 });
          m.on("pointerdown", (p) => {
            p.rightButtonDown() || this.hud?.overlayMode !== "none" || (this.autoPickupIgnored.delete(c.id), this.pickupTarget = c.id, this.destination = { x: c.x, y: c.y });
          }), this.groundSprites.push(g, m), this.groundMotions.push({ sprite: m, glow: g, x: c.x, y: c.y, phase: u });
        }
      }
    }
    ignoreOwnDrops(o) {
      for (const c of this.packet.drops ?? []) !o.has(c.id) && c.x === this.player.x && c.y === this.player.y && this.autoPickupIgnored.add(c.id);
    }
    dropWeapon(o) {
      this.dropEquipment("weapon", o);
    }
    dropArmor(o) {
      this.dropEquipment("armor", o);
    }
    dropShield(o) {
      this.dropEquipment("shield", o);
    }
    dropEquipment(o, c) {
      const u = o === "weapon" ? this.player.weapons[c] : o === "armor" ? this.player.armors[c] : this.player.shields[c];
      if (!u) return;
      const d = o === "weapon" && "starred" in u && u.starred ? "star_" + u.key : u.key, f = new Set((this.packet.drops ?? []).map((g) => g.id));
      this.action("drop_equipment", { slot: o, index: c, key: d }).then(() => {
        this.ignoreOwnDrops(f), this.log(`${u.name}を落としました。`), this.hud?.overlayMode === "inv" && this.hud.setOverlay("inv");
      }).catch((g) => {
        this.log(g.message), this.hud?.setOverlay("none");
      });
    }
    async dropItem(o) {
      const c = new Set((this.packet.drops ?? []).map((u) => u.id));
      await this.action("drop_item", { kind: o }), this.ignoreOwnDrops(c), this.log("回復ポーションを1個落としました。ほかのプレイヤーも拾えます。");
    }
    async action(o, c = {}) {
      if (this.requestBusy) throw Error("処理中です。少し待ってからお試しください。");
      this.requestBusy = !0, this.requestRevision++;
      const u = this.generation;
      try {
        if (this.preview) {
          const f = this.packet.active, g = this.packet.players.find((m) => m.character_id === f.id);
          if (o === "wait")
            f.skillStepsRemaining = Math.max(0, (f.skillStepsRemaining ?? 0) - 1), f.timeStopTurns = Math.max(0, (f.timeStopTurns ?? 0) - 1), this.packet.trainingHits ??= [], this.packet.trainingHits.push({ id: Math.max(0, ...this.packet.trainingHits.map((m) => m.id)) + 1, character_id: f.id, damage: 0, dir: g.dir, action_kind: "wait", hit_target: !1 });
          else if (o === "move") {
            f.skillStepsRemaining = Math.max(0, (f.skillStepsRemaining ?? 0) - 1), f.timeStopTurns = Math.max(0, (f.timeStopTurns ?? 0) - 1);
            const m = Number(c.x), p = Number(c.y);
            g.dir = m > g.x ? "right" : m < g.x ? "left" : p > g.y ? "down" : "up", g.x = m, g.y = p;
          } else if (o === "chat")
            this.packet.messages.push({ id: Math.max(0, ...this.packet.messages.map((m) => Number(m.id))) + 1, name: f.name, message: String(c.message), character_id: f.id }), this.packet.messages = this.packet.messages.slice(-50);
          else if (o === "attack" || o === "skill") {
            const m = this.player.weapon, p = m?.weaponType, y = Fe(p);
            if (o === "skill" && (!y || this.skillStepsRemaining > 0)) throw Error("スキルのチャージが必要です。");
            g.dir = c.dir, o === "skill" && (f.skillStepsRemaining = 100, p === "dagger" && (f.timeStopTurns = 5));
            const _ = p ? nr(p, g, g.dir, { blocked: (w, v) => ie(w, v) && !(w === 12 && v === 5), enemyAt: (w, v) => w === 12 && v === 5 ? !0 : null, canHit: () => !0 }) : { targets: [] };
            this.packet.trainingHits ??= [], this.packet.trainingHits.push({ id: Math.max(0, ...this.packet.trainingHits.map((w) => w.id)) + 1, character_id: f.id, damage: _.targets.length ? 18 : 0, dir: g.dir, weapon_key: m?.key ?? null, action_kind: o === "skill" ? "skill" : "attack", skill_type: o === "skill" ? p : null, origin_x: g.x, origin_y: g.y, hit_target: !!_.targets.length });
          } else if (o === "train") {
            if (Math.abs(g.x - D.x) + Math.abs(g.y - D.y) > 3) throw Error("練習樽の近くまで移動してください。");
            this.packet.trainingHits ??= [], this.packet.trainingHits.push({ id: Math.max(0, ...this.packet.trainingHits.map((m) => m.id)) + 1, character_id: f.id, weapon_key: this.player.weapon ? (this.player.weapon.starred ? "star_" : "") + this.player.weapon.key : null, damage: Math.round((this.player.atkMin + this.player.atkMax) / 2), dir: g.x < D.x ? "right" : g.x > D.x ? "left" : g.y < D.y ? "down" : "up" });
          } else if (o === "drop_equipment" || o === "drop_weapon") {
            const m = Number(c.index), p = String(c.key);
            f.equipment ??= { weapon: ["w_iron_dagger"], armor: ["leather"], shield: [] };
            const y = c.slot ?? "weapon";
            if (f.equipment[y][m] !== p) throw Error("その武器は持っていません。");
            f.equipment[y].splice(m, 1), (f.gear[`${y}_key`] ?? (y === "weapon" ? "w_iron_dagger" : y === "armor" ? "leather" : null)) === p && (f.gear[y] = !1, y === "weapon" && (f.hp = Math.min(f.hp, 100))), this.packet.drops ??= [], this.packet.drops.push({ id: crypto.randomUUID(), kind: y === "armor" ? "armor_" + p : p, category: y, x: g.x, y: g.y });
          } else if (o === "drop_item") {
            if (!f.inventory.potion) throw Error("落とせるアイテムがありません。");
            f.inventory.potion--, this.packet.drops ??= [], this.packet.drops.push({ id: crypto.randomUUID(), kind: "potion", x: g.x, y: g.y });
          } else if (o === "pickup_item") {
            const m = this.packet.drops?.find((p) => p.id === c.drop_id);
            if (!m || Math.abs(m.x - g.x) + Math.abs(m.y - g.y) > 1) throw Error("アイテムの近くまで移動してください。");
            this.packet.drops = this.packet.drops.filter((p) => p.id !== m.id), m.category && m.category !== "item" ? (f.equipment ??= { weapon: ["w_iron_dagger"], armor: ["leather"], shield: [] }, f.equipment[m.category].push(m.category === "armor" ? m.kind.slice(6) : m.kind)) : f.inventory.potion++;
          }
          this.syncPlayer(), this.drawPlayers();
          return;
        }
        const d = await Me(o, c);
        u === this.generation && (this.packet = d, this.syncPlayer(), this.drawPlayers());
      } catch (d) {
        throw u === this.generation && this.drawPlayers(), d;
      } finally {
        this.requestBusy = !1;
      }
    }
    updateCursorTile() {
      const o = this.input.activePointer;
      if (!(this.input.isOver && !o.wasTouch && this.hud?.overlayMode === "none" && o.x >= Te && o.x < Te + Rt && o.y >= Ee && o.y < Ee + Ot)) {
        this.cursorTile?.setVisible(!1);
        return;
      }
      const u = this.cameras.main.getWorldPoint(o.x, o.y), d = Math.floor(u.x / T), f = Math.floor(u.y / T);
      this.cursorTile?.setPosition((d + 0.5) * T, (f + 0.5) * T).setVisible(d >= 0 && f >= 0 && d < or && f < lr);
    }
    update(o) {
      this.updateCursorTile();
      for (const m of this.groundMotions) {
        const p = Rs(m.x, m.y, o, m.phase);
        m.sprite.setPosition(p.x, p.y).setAngle(p.angle), m.glow.setAlpha(0.16 + p.pulse * 0.06).setScale(0.9 + p.pulse * 0.08);
      }
      this.chat && (this.chat.root.style.visibility = this.hud?.overlayMode === "none" ? "visible" : "hidden"), this.hud?.topText && this.hud.topText.setText("はじまりの町 · サーバー1"), this.showSkillRangePreview(this.skillArmed || !!this.hud?.skillHovered);
      for (const [m, p] of this.actors) {
        const y = p.anchor.x - p.previousX, _ = p.anchor.y - p.previousY, w = Math.hypot(y, _), v = Math.max(0, Math.min(100, o - p.lastPoseTime));
        p.previousX = p.anchor.x, p.previousY = p.anchor.y, p.lastPoseTime = o, p.distance += w;
        const x = o < p.movingUntil;
        x && (p.distance += v * T / Le);
        const b = w > 0.02 || x;
        p.weight += (Number(b) - p.weight) * Math.min(1, v / 65);
        const O = o < p.attackUntil;
        O ? o - p.attackStarted >= p.attackWindup && p.animation.action !== "attack" && p.animation.play("atk", o) : p.animation.play(b ? "walk1" : "idle", o);
        const A = al(p.distance, p.weight, p.dir), R = O ? p.animation.sample(o) : b ? A.frame : p.animation.sample(o), j = o - p.attackStarted - p.attackWindup, C = p.weapon?.weaponType === "bow" || p.weapon?.weaponType === "handgun", I = p.weapon?.key === "w_hero_sword" ? 130 : 116 * 0.45, N = O && !C && j >= 0 && j < I * 2 ? 15 * (1 - Math.pow(1 - Math.min(j, 2 * I - j) / I, 2)) : 0;
        p.body.setPosition(p.anchor.x + (O ? p.dir === "left" ? -N : p.dir === "right" ? N : 0 : A.sway), p.anchor.y + (O ? p.dir === "up" ? -N : p.dir === "down" ? N : 0 : A.bob)).setAngle(O ? 0 : A.angle).setFrame(tt(p.dir, R)), p.label.setPosition(p.anchor.x, p.anchor.y + 30);
        const U = p.anchor.y / T + 0.2;
        p.shadow.setPosition(p.anchor.x, p.anchor.y + 27).setDepth(U - 0.03), p.leftFoot.setPosition(p.anchor.x - 7, p.anchor.y + 28 + A.footOffset).setAlpha(A.leftFoot).setDepth(U - 0.02), p.rightFoot.setPosition(p.anchor.x + 7, p.anchor.y + 28 - A.footOffset).setAlpha(A.rightFoot).setDepth(U - 0.02), p.body.setDepth(U);
        const H = this.packet.players.find((S) => S.character_id === m)?.gender ?? "male";
        if (p.renderer.update(p.body, p.weapon, p.shield, p.dir, R, H, O ? Math.max(0, o - p.animation.since) : 0, !0), O && !p.projectileLaunched && o - p.attackStarted >= p.attackWindup && (p.weapon?.weaponType === "bow" || p.weapon?.weaponType === "handgun")) {
          p.projectileLaunched = !0;
          const S = p.weapon.weaponType === "bow" ? `arrow_${p.weapon.key}` : "fx_bolt";
          if (this.textures.exists(S)) {
            const P = this.add.image(p.anchor.x, p.anchor.y, S).setDisplaySize(24, 24).setDepth(100).setRotation(Math.atan2(((p.attackPoint?.y ?? D.y) + 0.5) * T - p.anchor.y, ((p.attackPoint?.x ?? D.x) + 0.5) * T - p.anchor.x) + (p.weapon.weaponType === "bow" ? Math.PI / 4 : 0));
            this.tweens.add({ targets: P, x: ((p.attackPoint?.x ?? D.x) + 0.5) * T, y: ((p.attackPoint?.y ?? D.y) + 0.5) * T, duration: 180, ease: "Quad.easeIn", onComplete: () => P.destroy() });
          }
        }
        const B = this.bubbles.get(m);
        B && (o > B.until ? (B.root.destroy(), this.bubbles.delete(m)) : B.root.setPosition(p.anchor.x, p.anchor.y - 48));
      }
      if (this.requestBusy || o - this.lastMove < Le || this.hud?.overlayMode !== "none" || this.busy || ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName ?? "")) return;
      const c = this.actors.get(this.packet.active?.id ?? "");
      if (c?.stepping || c?.queue.length || (this.spaceKey?.isDown && this.queueTraining(), this.attackTarget && this.tryTraining(), this.requestBusy || this.attackTarget && !this.destination || o < (this.actors.get(this.packet.active?.id ?? "")?.attackUntil ?? 0))) return;
      this.pickupTarget && !this.packet.drops?.some((m) => m.id === this.pickupTarget) && (this.pickupTarget = void 0, this.destination = void 0);
      const u = bl(this.packet.drops ?? [], this.player, this.autoPickupIgnored);
      if (u) {
        this.pickupTarget = void 0, this.action("pickup_item", { drop_id: u.id }).then(() => this.log(this.groundItemInfo(u).name + "を拾いました。")).catch((m) => {
          this.autoPickupIgnored.add(u.id), this.log(m.message);
        });
        return;
      }
      let d = this.touchDir ?? (this.cursors?.left.isDown ? "left" : this.cursors?.right.isDown ? "right" : this.cursors?.up.isDown ? "up" : this.cursors?.down.isDown ? "down" : null);
      if (d)
        this.destination = void 0, this.pickupTarget = void 0, this.attackTarget = !1;
      else if (this.destination) {
        const m = this.destination.x - this.player.x, p = this.destination.y - this.player.y;
        !m && !p ? this.destination = void 0 : d = this.pathStep(this.destination.x, this.destination.y);
      }
      if (!d) return;
      const f = this.player.x + (d === "left" ? -1 : d === "right" ? 1 : 0), g = this.player.y + (d === "up" ? -1 : d === "down" ? 1 : 0);
      if (this.lastMove = o, f === D.x && g === D.y) {
        this.queueTraining(), this.tryTraining();
        return;
      }
      ie(f, g) || this.occupiedByOther(f, g) || this.action("move", { x: f, y: g }).catch((m) => {
        this.destination = void 0, this.log(m.message);
      });
    }
    pathStep(o, c) {
      const u = this.packet.players.filter((g) => g.character_id !== this.packet.active?.id), f = Os(this.player, { x: o, y: c }, u)[0];
      return f ? f.x > this.player.x ? "right" : f.x < this.player.x ? "left" : f.y > this.player.y ? "down" : "up" : (this.destination = void 0, null);
    }
    log(o, c = "sys") {
      this.logHistory.push({ msg: o, type: c }), this.logHistory.length > 100 && this.logHistory.shift(), this.adventureHistory.push({ msg: o, type: c, floor: 0, turn: 0 }), this.adventureHistory.length > 100 && this.adventureHistory.shift(), this.chat?.notice(o), this.events.emit("log", { msg: o, type: c });
    }
    floorHasGate() {
      return !1;
    }
    clearMoveInput() {
      this.touchDir = null, this.heldDir = null;
    }
    stopClickPath() {
      this.destination = void 0, this.attackTarget = !1;
    }
    setBoostTier() {
    }
    showDynamiteRangePreview() {
    }
    showSkillRangePreview(o = !1) {
      this.skillPreview?.clear();
      const c = this.player.weapon?.weaponType;
      if (!(o || this.skillArmed) || !c || this.hud?.overlayMode !== "none") return;
      const u = this.input.activePointer, d = this.cameras.main.getWorldPoint(u.x, u.y), f = Math.floor(d.x / T) - this.player.x, g = Math.floor(d.y / T) - this.player.y, m = Math.abs(f) > Math.abs(g) ? f > 0 ? "right" : "left" : g ? g > 0 ? "down" : "up" : this.player.dir, p = nr(c, this.player, m, { blocked: (y, _) => ie(y, _) && !(y === 12 && _ === 5), enemyAt: (y, _) => y === 12 && _ === 5 ? !0 : null, canHit: () => !0 });
      for (const y of p.tiles) this.skillPreview.fillStyle(Fe(c).color, 0.18).fillRect(y.x * T, y.y * T, T, T).lineStyle(1, Fe(c).color, 0.75).strokeRect(y.x * T, y.y * T, T, T);
    }
    useWeaponSkill() {
      if (!(this.busy || this.hud?.overlayMode !== "none" || !this.player.weapon)) {
        if (this.skillStepsRemaining > 0) {
          this.log(`スキルはあと${this.skillStepsRemaining}歩で使えます。`);
          return;
        }
        this.skillArmed = !this.skillArmed, this.log(this.skillArmed ? `${Fe(this.player.weapon.weaponType).name}を選択。右クリックで発動します。` : "スキル選択を解除しました。");
      }
    }
    saveRun() {
      return !0;
    }
    equipWeapon(o) {
      const c = this.player.weapons[o];
      c && this.action("equip", { slot: "weapon", equipped: !0, key: (c.starred ? "star_" : "") + c.key }).catch((u) => this.log(u.message));
    }
    equipArmor(o) {
      const c = this.player.armors[o];
      c && this.action("equip", { slot: "armor", equipped: !0, key: c.key }).catch((u) => this.log(u.message));
    }
    equipShield(o) {
      const c = this.player.shields[o];
      c && this.action("equip", { slot: "shield", equipped: !0, key: c.key }).catch((u) => this.log(u.message));
    }
    unequipEquipment(o) {
      this.action("equip", { slot: o, equipped: !1 }).catch((c) => this.log(c.message));
    }
    useItem(o) {
      const c = this.player.inventory[o];
      c && this.action("use_item", { kind: c.kind }).catch((u) => this.log(u.message));
    }
    ownsArmor(o) {
      return this.player.armors.some((c) => c.key === o);
    }
    weaponSellPrice() {
      return 0;
    }
    armorSellPrice() {
      return 0;
    }
    shieldSellPrice() {
      return 0;
    }
    itemSellPrice() {
      return 0;
    }
    sellWeapon(o) {
      typeof o == "number" ? this.dropWeapon(o) : this.log("町のお店は準備中です。");
    }
    sellArmor(o) {
      typeof o == "number" ? this.dropArmor(o) : this.sellWeapon();
    }
    sellShield(o) {
      typeof o == "number" ? this.dropShield(o) : this.sellWeapon();
    }
    sellItem(o) {
      if (o !== "potion") {
        this.log("この道具のドロップは準備中です。");
        return;
      }
      this.dropItem(o).then(() => this.hud?.setOverlay("inv")).catch((c) => {
        this.log(c.message), this.hud?.setOverlay("none");
      });
    }
    buyItem() {
      this.sellWeapon();
    }
    repairEquipment() {
      return !1;
    }
    async redeemOnlineCode(o) {
      await this.action("redeem_code", { code: o }), this.log(o === Es ? "スーパーアカウント：全アイテム一覧を開きました。" : "体力を全回復しました。");
    }
    async claimOnlineItem(o, c) {
      await this.action("claim_item", { key: o, starred: c }), this.log("アイテム一覧から装備・道具を取得しました。");
    }
    redeemCode() {
      return !1;
    }
    unlockDualWieldSecret() {
      return !1;
    }
    claimCatalogItem() {
      return { status: "rejected", message: "オンラインの通常アカウントでは使えません。" };
    }
  }
  class a extends s {
    create() {
      super.create();
    }
    buildTopBar() {
      super.buildTopBar();
      for (const o of this.children.list) typeof o.text == "string" && o.text.startsWith("ちゃりだんじょん  /") && o.setText("ちゃりだんじょん  /  オンライン" + (this.gs.packet.superAccount ? " [SUPER]" : ""));
    }
    update() {
      super.update(), this.skillCounter && this.skillCounter.setText(this.gs.timeStopTurns > 0 ? `時停止 ${this.gs.timeStopTurns}` : this.gs.skillStepsRemaining > 0 ? String(this.gs.skillStepsRemaining) : this.gs.skillArmed ? "選択中" : ""), this.skillButton && this.skillButton.setAlpha(this.gs.skillArmed ? 1 : 0.85);
    }
    buildLeftMenu() {
      this.panel(8, 48, 160, 512, "メニュー"), this.buildGachaCard();
      let o = 184;
      for (const [c, u, d] of [["ui_nav_explore", "探索", () => this.setOverlay("none")], ["ui_nav_inventory", "持ち物・装備", () => this.openInventory()], ["ui_nav_shop", "ショップ", () => this.setOverlay("shop")], ["ui_nav_codex", "冒険図鑑", () => this.setOverlay("codex")], ["ui_nav_damage_log", "詳細ログ", () => this.setOverlay("details")], ["ui_nav_settings", "設定", () => this.showSettings()]])
        this.menuButton(16, o, 144, 40, c, u, d), o += 43;
      this.add.text(16, o + 6, `矢印・クリック：移動
右クリック：攻撃  Q：スキル`, { fontFamily: "Meiryo", fontSize: "10px", color: "#789093", lineSpacing: 5 });
    }
    buildMobileNav() {
      this.panel(8, 800, 374, 36);
      const o = [["ui_nav_shop", "店", () => this.setOverlay("shop")], ["ui_nav_gacha", "ガチャ", () => this.setOverlay("gacha")], ["ui_nav_codex", "図鑑", () => this.setOverlay("codex")], ["ui_nav_damage_log", "ログ", () => this.setOverlay("details")], ["ui_nav_settings", "設定", () => this.showSettings()]];
      o.forEach(([c, u, d], f) => {
        const g = 12 + f * 366 / o.length, m = 366 / o.length - 4;
        this.add.rectangle(g + m / 2, 818, m, 30, 2429470).setStrokeStyle(1, this.theme.color).setInteractive({ useHandCursor: !0 }).on("pointerdown", d), this.add.image(g + 14, 818, c).setDisplaySize(20, 20), this.add.text(g + 28, 818, u, { fontFamily: "Meiryo", fontSize: "10px", color: "#ffe6b8" }).setOrigin(0, 0.5);
      });
    }
    showControlsGuide() {
      this.gs.log("矢印キー・地面クリックで移動。左下のチャットで会話できます。");
    }
    buildBottom() {
      this.panel(8, 568, 700, 184), this.logTexts = [], this.panel(716, 568, At - 724, 184, "クイックアイテム（クリックで使用）"), this.itemContainer = this.add.container(0, 0);
    }
    submitCode() {
      if (this.gs.requestBusy) return;
      const o = this.codeDigits;
      this.codeMessage = "確認中…", this.rebuildOverlay(), this.gs.redeemOnlineCode(o).then(() => {
        this.codeDigits = "", this.codeMessage = "", o === Es ? (this.catalogCategory = "all", this.catalogPageIndex = 0, this.catalogDetail = null, this.setOverlay("itemcatalog")) : (this.codeMessage = "体力を全回復しました", this.rebuildOverlay());
      }).catch((c) => {
        this.codeMessage = c.message, this.rebuildOverlay();
      });
    }
    selectCatalogItem(o) {
      if (this.overlayMode === "equipmentcatalog") {
        super.selectCatalogItem(o);
        return;
      }
      this.gs.requestBusy || (this.catalogClaimMessage = "取得中…", this.rebuildOverlay(), this.gs.claimOnlineItem(o.key, o.textureKey.startsWith("star_")).then(() => {
        this.catalogClaimMessage = "1個取得しました。所持品に保存しました。", this.catalogDetail = Ye.find((c) => c.key === o.key) ?? o, this.rebuildOverlay();
      }).catch((c) => {
        this.catalogClaimMessage = c.message, this.rebuildOverlay();
      }));
    }
    rebuildOverlay() {
      if (super.rebuildOverlay(), this.overlayMode === "equip")
        for (const o of this.overlay?.list ?? []) o.text === "装備・売却" && o.setText("装備・ドロップ");
    }
    rowButton(o, c, u, d, f, g, m = !0, p) {
      return u === 112 && d.startsWith("売却 ") && (d = "1個落とす"), (u === 94 || u === 72) && /^(売却 \d+G|装備中)$/.test(d) && (d = "落とす", m = !this.gs.requestBusy), super.rowButton(o, c, u, d, f, g, m, p);
    }
    setOverlay(o) {
      if (["shop", "gacha", "quests"].includes(o)) {
        this.gs.log("町のこの機能は準備中です。");
        return;
      }
      if (o === "itemcatalog" && (!this.gs.packet.superAccount || !this.gs.packet.active?.catalogUnlocked)) {
        this.gs.log("スーパーアカウントでコードを入力してください。");
        return;
      }
      super.setOverlay(o);
    }
    buildSettingsOverlay(o, c, u, d) {
      super.buildSettingsOverlay(o, c, u, d), this.gs.packet.superAccount && this.overlay.add(this.add.text(o + 20, c + d - 95, "SUPER：19960711 アイテム一覧 ／ 11111111 全回復", { fontFamily: "Meiryo", fontSize: "12px", color: "#ffe09a", wordWrap: { width: u - 40 } }));
      const f = this.overlay.getByName("settings-return-title");
      if (f) {
        const g = f.getByName("row-hit");
        g?.removeAllListeners("pointerdown"), g?.on("pointerdown", () => {
          this.gs.scene.stop("OnlineUIScene"), this.gs.scene.start("TitleScene");
        });
      }
    }
  }
  t.scene.add("OnlineLobbyScene", new n()), t.scene.add("OnlineTownScene", new i());
  const l = new a();
  l.sys.settings.key = "OnlineUIScene", t.scene.add("OnlineUIScene", l);
}
const Ps = /* @__PURE__ */ new WeakMap();
function Ml(t) {
  const e = t.gear.armor && Et(t.gear.armor_key) ? t.gear.armor_key : "leather", r = t.gear.weapon ? t.gear.weapon_key ?? "w_iron_dagger" : null, s = t.gear.shield ? t.gear.shield_key ?? null : null;
  return { armor: e, weapon: r, shield: s, sheet: Bt(t.gender, e), path: un(t.gender, e) };
}
async function Pl(t, e) {
  const r = Ml(e), s = /* @__PURE__ */ new Set([r.sheet, "w_soldier_blade", "s_iron_round", "katana_waist_fitting_v3", "katana_scabbard_v2", "fx_hw_aura_a", "fx_hw_aura_b"]);
  for (const a of [r.weapon, r.shield]) if (a) {
    const l = a.replace(/^star_/, "");
    for (const h of [a, l, `held_${l}`, `sheath_${a}`]) s.add(h);
  }
  const n = t.registry.get("assetManifest") ?? [];
  let i = 0;
  for (const a of n.filter((l) => s.has(l.key))) {
    const l = t.textures.exists(a.key) ? t.textures.get(a.key).getSourceImage() : void 0;
    if (l?.tagName === "IMG" && !l.src.startsWith("data:")) continue;
    t.textures.exists(a.key) && t.textures.remove(a.key);
    const h = Ut(a.path);
    a.kind === "spritesheet" ? t.load.spritesheet(a.key, h, a.config) : t.load.image(a.key, h), i++;
  }
  if (r.weapon?.startsWith("star_") && !(t.textures.exists(r.weapon) && t.textures.get(r.weapon).getSourceImage().src?.includes("/star-weapons-v1/")) && (t.textures.exists(r.weapon) && t.textures.remove(r.weapon), t.load.image(r.weapon, `assets/star-weapons-v1/${r.weapon}.webp`), i++), r.weapon?.startsWith("star_w_katana_")) {
    const a = `sheath_${r.weapon}`;
    t.textures.exists(a) || (t.load.image(a, `assets/katana-sheaths-v1/${a}.webp`), i++);
  }
  return i && await new Promise((a) => {
    const l = () => {
      t.load.off("complete", l), t.events.off("shutdown", l), a();
    };
    t.load.once("complete", l), t.events.once("shutdown", l), t.load.start();
  }), r;
}
function Cl(t, e) {
  const r = document.createElement("div");
  r.className = "online-character-preview", r.setAttribute("role", "img"), r.setAttribute("aria-label", `${e.name}の装備中の見た目`), r.dataset.previewState = "loading";
  const s = document.createElement("span");
  s.textContent = "装備を読み込み中…", r.append(s);
  const i = (Ps.get(t) ?? Promise.resolve()).catch(() => {
  }).then(async () => {
    if (!r.isConnected || !t.sys.isActive()) return;
    const a = await Pl(t, e);
    if (!r.isConnected || !t.sys.isActive()) return;
    const l = new Set(t.children.list), h = -2e3, o = t.add.image(h, h, a.sheet, tt("down", "idle")).setDisplaySize(128, 128).setDepth(10), c = new pn(t), u = a.weapon ? rt(a.weapon.replace(/^star_/, ""), []) : null;
    u && (u.starred = a.weapon.startsWith("star_")), c.update(o, u, a.shield ? Ht(a.shield) : null, "down", "idle", e.gender);
    const d = t.children.list.filter((p) => !l.has(p)), f = t.add.renderTexture(h, h, 176, 176).setVisible(!1);
    let g = !1;
    const m = () => {
      if (!g) {
        g = !0, f.destroy();
        for (const p of d) p.active && p.destroy();
        t.events.off("shutdown", m);
      }
    };
    t.events.once("shutdown", m), t.events.once("postupdate", () => {
      if (!t.sys.isActive() || !r.isConnected) {
        m();
        return;
      }
      const p = [o, c.weapon, c.offhand, c.scabbard, c.waistFitting].filter((x) => x.visible).map((x) => x.getBounds()), y = Math.min(...p.map((x) => x.left)), _ = Math.max(...p.map((x) => x.right)), w = Math.min(...p.map((x) => x.top)), v = Math.max(...p.map((x) => x.bottom));
      f.texture.camera.setZoom(Math.min(1, 160 / (_ - y), 160 / (v - w))).centerOn((y + _) / 2, (w + v) / 2), f.draw(d.filter((x) => x.visible).sort((x, b) => (x.depth ?? 0) - (b.depth ?? 0))), f.snapshot((x) => {
        if (r.isConnected && "naturalWidth" in x && x.naturalWidth > 0) {
          const b = document.createElement("canvas");
          b.width = b.height = 176, b.getContext("2d").drawImage(x, 0, 0), r.replaceChildren(b), r.dataset.previewState = "ready", r.dataset.armor = a.armor, r.dataset.weapon = a.weapon ?? "", r.dataset.shield = a.shield ?? "";
        }
        m();
      });
    });
  }).catch(() => {
    r.isConnected && (s.textContent = "見た目を読み込めませんでした", r.dataset.previewState = "error");
  });
  return Ps.set(t, i), r;
}
const L = (t, e = "") => {
  const r = document.createElement(t);
  return r.textContent = e, r;
};
function $l(t, e) {
  yn(t.game, e), Ol(t, Il), t.scene.start("OnlineLobbyScene");
}
function Il(t) {
  const e = L("section");
  e.className = "online-screen", e.setAttribute("aria-label", "オンラインモード"), document.body.append(e);
  const r = () => {
    const R = t.game.canvas.getBoundingClientRect();
    e.style.left = `${R.left}px`, e.style.top = `${R.top}px`, e.style.width = `${R.width}px`, e.style.height = `${R.height}px`;
  }, s = new ResizeObserver(r);
  s.observe(t.game.canvas), window.addEventListener("resize", r), window.addEventListener("scroll", r), r();
  const n = t.input.enabled;
  t.input.enabled = !1, e.addEventListener("keydown", (R) => R.stopPropagation());
  const i = t.input.keyboard, a = i?.enabled;
  i && (i.enabled = !1);
  let l = !1, h = !1, o, c = "", u, d;
  const f = () => {
    u?.destroy(), u = void 0, d = void 0;
  }, g = () => {
    l || (l = !0, clearInterval(o), f(), s.disconnect(), window.removeEventListener("resize", r), window.removeEventListener("scroll", r), e.remove(), t.input.enabled = n, i && (i.enabled = a ?? !0), t.events.off("shutdown", g));
  };
  t.events.once("shutdown", g);
  const m = (R, j) => {
    const C = L("button", R);
    return C.type = "button", C.onclick = j, C;
  }, p = (R) => {
    f(), e.replaceChildren();
    const j = L("header"), C = L("img");
    C.src = "assets/ui/brand-v1/chari-desktop-logo.png", C.alt = "Chari Dungeon", j.append(C), j.append(L("h2", R), m("タイトルへ", () => {
      g(), t.scene.start("TitleScene");
    })), e.append(j);
  }, y = L("p");
  y.setAttribute("role", "status");
  const _ = (R) => {
    y.textContent = R instanceof Error ? R.message : "接続できませんでした。";
  }, w = async (R) => {
    const j = _n(t);
    try {
      const C = await Me("join", { character_id: R });
      if (l) {
        j.destroy(), Me("leave");
        return;
      }
      g(), t.scene.start("OnlineTownScene", { state: C, entryLoading: j });
    } catch (C) {
      throw j.destroy(), C;
    }
  }, v = (R) => {
    p("キャラクターを選ぶ"), e.append(L("p", "サーバー1 · はじまりの町 ／ キャラクターは2体まで"), y);
    const j = L("div");
    j.className = "online-character-grid";
    for (let C = 1; C <= 2; C++) {
      const I = R.characters.find((U) => U.slot === C), N = L("section");
      if (N.className = "online-character-card", N.append(L("h3", `キャラクター ${C}`)), I) {
        const U = Cl(t, I);
        N.append(U, L("strong", I.name), L("p", I.gender === "male" ? "男 · レベル1" : "女 · レベル1"), m("町へ入場", () => {
          O(() => w(I.id));
        }));
      } else N.append(L("p", "空きスロット"), m("キャラクター作成", () => x(R)));
      j.append(N);
    }
    e.append(j, m("ログアウト", () => {
      O(async () => {
        await _e?.auth.signOut(), A();
      });
    }));
  }, x = (R) => {
    p("キャラクター作成"), e.append(L("p", "男女と冒険者名を決めて、町へ出発しましょう。"));
    const j = L("form");
    j.setAttribute("aria-label", "キャラクター作成");
    let C = "male";
    const I = L("div");
    I.className = "online-character-grid";
    const N = [];
    for (const S of ["male", "female"]) {
      const P = m(S === "male" ? "男" : "女", () => {
        C = S, N.forEach((W) => W.setAttribute("aria-pressed", String(W.dataset.gender === S)));
      });
      P.className = "online-gender-choice", P.dataset.gender = S, P.setAttribute("aria-pressed", String(S === C));
      const $ = L("div");
      $.className = "online-character-sprite", $.style.backgroundImage = `url(assets/characters/player-painted-v1/${S}-leather.png)`, P.prepend($), N.push(P), I.append(P);
    }
    const U = L("input");
    U.required = !0, U.minLength = 2, U.maxLength = 12, U.setAttribute("autocomplete", "nickname");
    const H = L("label", "冒険者名（2〜12文字）");
    H.append(U);
    const B = L("button", "作成して町へ");
    B.type = "submit", j.append(I, H, B), j.onsubmit = (S) => {
      S.preventDefault(), O(async () => {
        if (!j.reportValidity()) return;
        const $ = (await Me("create_character", { name: U.value.trim(), gender: C })).characters.find((W) => !R.characters.some((q) => q.id === W.id));
        if (!$) throw Error("キャラクター一覧を更新してください。");
        await w($.id);
      });
    }, e.append(j, y, m("キャラクター選択へ戻る", () => v(R)));
  }, b = () => {
    p("キャラクターを読み込み中…"), e.append(y), Me("list").then((R) => {
      l || v(R);
    }).catch(_);
  }, O = async (R) => {
    if (!(h || l)) {
      h = !0, y.textContent = "";
      try {
        await R();
      } catch (j) {
        _(j);
      } finally {
        h = !1;
      }
    }
  }, A = (R = "login", j = "", C = "") => {
    const I = R === "signup", N = R === "resend", U = N ? "確認メールの再送" : I ? "アカウント作成" : "オンラインにログイン";
    p(U), y.textContent = C, e.append(L("p", N ? "登録したメールアドレスに確認メールを送ります。" : I ? "オンライン専用のアカウントを作成します。" : "作成済みのアカウントでログインしてください。"));
    const H = L("form"), B = L("input"), S = L("input"), P = L("input"), $ = L("input");
    H.setAttribute("aria-label", U), B.type = "email", B.autocomplete = "email", B.required = !0, B.value = j, S.type = "password", S.autocomplete = I ? "new-password" : "current-password", S.required = !0, I && (S.minLength = 8), P.maxLength = 20, P.required = !0, P.setAttribute("autocomplete", "nickname"), $.type = "password", $.autocomplete = "new-password", $.required = !0;
    const W = (J, te) => {
      const Pe = L("label", J);
      Pe.append(te), H.append(Pe);
    };
    W("メールアドレス", B), N || W(I ? "パスワード（8文字以上）" : "パスワード", S), I && W("パスワード（確認用）", $);
    const q = L("button", N ? "確認メールを送信" : I ? "アカウントを作成" : "ログイン");
    q.type = "submit", H.append(q);
    const X = () => {
      if (vr && !d) throw new Error("本人確認が完了するまでお待ちください。");
    };
    if (H.onsubmit = (J) => {
      J.preventDefault(), O(async () => {
        if (!H.reportValidity()) return;
        if (I && S.value !== $.value) throw new Error("確認用パスワードが一致しません。");
        if (X(), N) {
          const { error: ze } = await _e.auth.resend({ type: "signup", email: B.value.trim(), options: { captchaToken: d, emailRedirectTo: "https://charizard0711.github.io/chari-dungeon/" } });
          if (u?.reset(), ze) throw ze;
          y.textContent = "確認メールを再送しました。メール内のリンクを開いてください。";
          return;
        }
        if (I) {
          const { data: ze, error: Or } = await _e.auth.signUp({ email: B.value.trim(), password: S.value, options: { data: { language: nn() }, emailRedirectTo: "https://charizard0711.github.io/chari-dungeon/", captchaToken: d } });
          if (u?.reset(), Or) throw Or;
          S.value = "", $.value = "", ze.session ? (c = ze.session.user.id, b()) : A("login", B.value.trim(), "確認メールを送信しました。メール内で認証後、ログインしてください。");
          return;
        }
        const { data: te, error: Pe } = await _e.auth.signInWithPassword({ email: B.value.trim(), password: S.value, options: { captchaToken: d } });
        if (u?.reset(), Pe) throw new Error(Pe.message === "Email not confirmed" ? "メールアドレスが未確認です。確認メールのリンクを開くか、再送してください。" : Pe.message);
        c = te.user.id, S.value = "", b();
      });
    }, e.append(H, y), vr) {
      const J = L("div");
      H.prepend(J), $o(J, (te) => {
        d = te;
      }).then((te) => {
        l || !J.isConnected ? te.destroy() : u = te;
      }).catch(_);
    }
    if (N || (e.append(L("p", I ? "すでにアカウントをお持ちの方" : "アカウントをまだお持ちでない方")), e.append(m(I ? "ログイン画面へ" : "新規アカウント作成へ", () => A(I ? "login" : "signup", B.value)))), R === "login" && e.append(m("確認メールが届かない方", () => A("resend", B.value))), N && e.append(m("ログイン画面へ戻る", () => A("login", B.value))), R === "login") for (const J of ["Google", "Microsoft"]) {
      const te = m(`${J}でログイン（準備中）`, () => {
      });
      te.disabled = !0, e.append(te);
    }
    e.append(L("p", "ソロの冒険・図鑑とは別のオンラインアカウントです。"));
  };
  return A(), _e?.auth.getSession().then(({ data: R }) => {
    !l && R.session && !R.session.user.is_anonymous && (c = R.session.user.id, b());
  }).catch(_), g;
}
function jl() {
  const t = new URLSearchParams(location.search), e = t.get("token_hash"), r = nn(t.get("lang") ?? "ja");
  history.replaceState(null, "", location.pathname), document.documentElement.lang = r;
  const s = Lo[r], n = document.getElementById("confirmation"), i = document.createElement("h1");
  i.textContent = s[0];
  const a = document.createElement("p");
  a.setAttribute("role", "status"), a.textContent = e ? s[1] : s[5];
  const l = document.createElement("button");
  l.textContent = s[2], l.disabled = !e || !_e;
  const h = document.createElement("a");
  h.href = "./", h.textContent = s[4], n.replaceChildren(i, a, l, h), l.onclick = async () => {
    l.disabled = !0;
    try {
      const { error: o } = await _e.auth.verifyOtp({ token_hash: e, type: "email" });
      a.textContent = o ? s[5] : s[3], o || l.remove();
    } catch {
      a.textContent = s[5], l.disabled = !1;
    }
  };
}
function Ll(t, e) {
  const r = document.createElement("section");
  r.className = "online-panel";
  const s = document.createElement("h2");
  s.textContent = "設定", r.append(s);
  const n = t.input.keyboard, i = n?.enabled;
  n && (n.enabled = !1);
  const a = () => {
    r.remove(), n && (n.enabled = i), t.events.off("shutdown", a);
  };
  for (const [h, o, c] of [["BGM", "bgmVolume", "setBgmVolume"], ["効果音", "seVolume", "setSeVolume"]]) {
    const u = document.createElement("label");
    u.textContent = h;
    const d = document.createElement("input");
    d.type = "range", d.min = "0", d.max = "1", d.step = ".05", d.value = String(e[o]), d.setAttribute("aria-label", `${h}音量`), d.oninput = () => e[c](Number(d.value)), u.append(d), r.append(u);
  }
  const l = document.createElement("button");
  l.textContent = "戻る", l.onclick = a, r.append(l), document.body.append(r), t.events.once("shutdown", a);
}
export {
  pl as ensureShieldMist,
  yn as installGamePresentation,
  jl as mountEmailConfirmation,
  $l as openOnline,
  Ll as openOnlineSettings
};
