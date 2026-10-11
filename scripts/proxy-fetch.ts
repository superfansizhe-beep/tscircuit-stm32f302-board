/**
 * 契约第 4 条：封装抓取走本地 gost 中继
 *
 * tscircuit 的 `kicad:` / `jlcpcb:` 封装要在运行时去上游拉 footprint / PCB 几何
 * （含 3D 模型）。这些请求直连会被 407，必须过 127.0.0.1:8118。
 *
 * 为什么用 preload 而不是裸设环境变量：
 *   HTTP_PROXY / HTTPS_PROXY 是**进程级**的，会把所有请求都拐进代理；
 *   preload 能把代理**只限定在 kicad/jlcpcb/oshwlab 这几个上游域名上**，
 *   registry.npmjs.org 之类的直连不受影响。这是这层包装唯一的存在理由。
 *
 * 为什么用 Bun 原生 fetch 的 `proxy` 选项，而不是手写 CONNECT 隧道：
 *   Bun 的 `node:http` polyfill 不接受 absolute-URI 请求目标，连 CONNECT 都直接报
 *   `fetch() URL is invalid` —— 在 Bun 上手写代理隧道是走不通的（已实测）。
 *   实测 Bun 1.3.3 的 `fetch(url, { proxy })` 的 CONNECT 隧道是好的。
 *
 * 代理不通时自动回退原始 fetch，所以 gost 没起也不会把导出流程卡死。
 *
 * 环境开关：
 *   TSC_PROXY_OFF=1        关闭代理接管，全部直连
 *   TSC_PROXY_ALL=1        所有外部 http(s) 都走代理，不做域名匹配
 *   TSC_PROXY_MATCH=...    自定义匹配正则（默认 kicad|jlc|lcsc|easyeda|oshwlab）
 *   GOST_PROXY_HOST / GOST_PROXY_PORT   代理地址（默认 127.0.0.1:8118）
 *   TSC_PROXY_DEBUG=1      打印每次代理决策
 */
const PROXY_HOST = process.env.GOST_PROXY_HOST ?? "127.0.0.1"
const PROXY_PORT = Number(process.env.GOST_PROXY_PORT ?? 8118)
const PROXY_URL = `http://${PROXY_HOST}:${PROXY_PORT}`
const PROXY_OFF = process.env.TSC_PROXY_OFF === "1"
const PROXY_ALL = process.env.TSC_PROXY_ALL === "1"
const DEBUG = process.env.TSC_PROXY_DEBUG === "1"
const MATCH = new RegExp(
  process.env.TSC_PROXY_MATCH ?? "kicad|jlc|lcsc|easyeda|oshwlab",
  "i",
)

const originalFetch = globalThis.fetch

function log(...args: unknown[]) {
  if (DEBUG) console.log("[proxy-fetch]", ...args)
}

function isLoopback(host: string) {
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "0.0.0.0"
}

function shouldProxy(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false
  if (isLoopback(url.hostname)) return false
  if (PROXY_ALL) return true
  return MATCH.test(url.hostname)
}

if (!PROXY_OFF) {
  globalThis.fetch = proxyAwareFetch as typeof globalThis.fetch
  if (DEBUG) console.log(`[proxy-fetch] 已接管 fetch → ${PROXY_URL}`)
}

async function proxyAwareFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let url: URL
  try {
    url = new URL(input instanceof Request ? input.url : String(input))
  } catch {
    return originalFetch(input as RequestInfo, init)
  }

  if (!shouldProxy(url)) return originalFetch(input as RequestInfo, init)
  log("经代理:", url.href)

  try {
    return await originalFetch(input as RequestInfo, {
      ...(init ?? {}),
      proxy: PROXY_URL,
    } as RequestInit)
  } catch (err) {
    log("代理失败，回退直连:", url.host, (err as Error).message)
    return originalFetch(input as RequestInfo, init)
  }
}