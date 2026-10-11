# my-tscircuit —— 基准机 / 环境契约

这是**基准机**，不是 mock。它是钉死的、可复跑的宿主环境：正式的电路项目也住在这里面，
或者整个目录复制一份当模板用。

**环境不可变，复现靠目录快照，而不是靠记忆。**

> 本文档里的命令都是在本目录实测跑出来的，不是照抄文档。
> 标 ⚠️ 的是实测踩到、且和原始契约写法**不一致**的地方。

---

## Toolchain Contract

| # | 契约 | 内容 |
|---|------|------|
| 1 | 运行时 | Bun 1.3.3。用 `tsci-run` wrapper 起；Node 跑会报 `ERR_UNSUPPORTED_DIR_IMPORT`（Node 不允许目录 import，Bun 允许） |
| 2 | 包 | `@tscircuit/cli@0.1.2277` + `tscircuit@0.0.2790`；`package.json` 的 `overrides` 钉死 `@tscircuit/core@0.0.2119` |
| 3 | 源 | `.npmrc` 指 `registry=https://registry.npmjs.org`（npmmirror 同步滞后，取不到钉死版本） |
| 4 | 网络 | `kicad:` / `jlcpcb:` 封装抓取走本地 gost 中继 `127.0.0.1:8118`，由 `bunfig.toml` 的 `preload` wrap `fetch` 注入 |
| 5 | fd | `tsci dev` 需要 > 2048（`ulimit -n 65536`）；沙箱硬顶 2048 时 fallback 到无头 `export` |
| 6 | 补丁 | `patches/@tscircuit%2Fcore@0.0.2119.patch` 由 `bun install` 自动应用，把 core#4481 的诊断修复固化下来（见「本地补丁」） |

### 为什么必须是这个目录，不能全局装

契约里有 4 条只在项目目录内才生效：

| 契约 | 全局做不了的原因 |
|------|------------------|
| `overrides` 钉 core 版本 | `package.json` overrides 是项目级机制，全局装包没法 override 别的包的依赖树 |
| `.npmrc` 指官方源 | 可以全局，但项目级更稳，不受你机器上其他项目切换源影响 |
| `bunfig.toml` preload wrap fetch | preload 配置按项目目录读，只有在这里跑的 bun 命令会加载它 |
| `node_modules` 隔离 | Bun 目录 import 风格的 ESM 只在这个 node_modules 里自洽，扔别的目录下 Node 会炸 |

所以「新文件夹」不是习惯，是这些钉子的唯一挂载点。

### 版本钉子的真实依据

- `@tscircuit/cli@0.1.2277` 本身是**零依赖打包**（`bin: tscircuit-cli`），不直接吃 core；
  真正吃 core 的是 `tscircuit@0.0.2790`，它声明 `@tscircuit/core: ^0.0.2117`。
  caret 会浮动，所以用 `overrides` 钉到具体版本 `0.0.2119`（该包当前的 latest）。
  实测装出来确实是 `0.0.2119`。
- 这类「Cannot find module '@tscircuit/core'」的报错在 tscircuit/cli 的 issue
  #1657 / #3982 有复现（不同 core 版本组合），钉版本是标准解法。
- `ERR_UNSUPPORTED_DIR_IMPORT` 是 Node 的 ESM 目录导入错误，Bun 默认允许 —— 第 1 条契约的由来。

---

## ⚠️ 三处必须偏离原始写法的地方

### 1. 不要用 `bunx --bun @tscircuit/cli`

```bash
# ❌ 不要这样 —— 实测会打印 "Resolved, downloaded and extracted [618]"
bunx --bun @tscircuit/cli export circuits/blink.tsx -f pcb-svg
```

`bunx` 在自己的临时缓存目录里**重新解析整棵依赖树**，完全绕开本项目的
`node_modules` 和 `package.json` 的 `overrides` —— 等于把**第 2 条契约直接作废**，
还会重新触发 sharp 的 install script。

### 2. 也不要直接跑 `node_modules/.bin/tscircuit-cli`

```bash
# ❌ 不要这样
./node_modules/.bin/tscircuit-cli export ...
```

它的 shebang 是 `#!/usr/bin/env node`，直接执行就落到 Node 上 → `ERR_UNSUPPORTED_DIR_IMPORT`。

所以才有 `tsci-run`：它用 `process.execPath`（Bun 自身绝对路径）强制 Bun 运行时，
同时指向**本地那份**钉死的 CLI。两个问题一次解决。

### 3. `-o` 是文件路径，且相对**电路文件所在目录**解析

```bash
# ❌ 会被解析成 circuits/out/ → ENOENT
./tsci-run export circuits/blink.tsx -f pcb-svg -o out/blink.svg

# ✅ 对
./tsci-run export circuits/blink.tsx -f pcb-svg -o ../out/blink.pcb.svg
```

`-o` 要给完整文件名，不能给目录。

---

## 常用命令（已验证可跑）

```bash
cd my-tscircuit

# ⚠️ 必须带 --ignore-scripts
# 实测：不带会因 sharp 的 postinstall 失败而返回非零退出码（CI / set -e 会直接中断）。
# 带了就干净通过（rc=0），且 5 种导出格式与版本钉死全部正常 —— sharp 在本项目里根本用不到。
bun install --frozen-lockfile --ignore-scripts
```

**导出（无头，一次性产物，fd 受限时的 fallback）**

```bash
./tsci-run export circuits/blink.tsx -f readable-netlist -o ../out/blink.netlist.txt
./tsci-run export circuits/blink.tsx -f pcb-svg        -o ../out/blink.pcb.svg
./tsci-run export circuits/blink.tsx -f schematic-svg  -o ../out/blink.schematic.svg
./tsci-run export circuits/blink.tsx -f pcb-png        -o ../out/blink.pcb.png
./tsci-run export circuits/blink.tsx -f gerbers        -o ../out/blink.gerbers.zip
```

实测全部通过。`export --help` 里支持的格式还有：
`json` `circuit-json` `schematic-pdf` `gltf` `glb` `specctra-dsn` `kicad_sch`
`kicad_pcb` `kicad_zip` `altium` `kicad-library` `srj` `step` `assembly-svg`
`component-box-3mf`

**开发服务器（需要 watch + 多 worker，fd 消耗大）**

```bash
ulimit -n 65536                              # macOS 默认偏低，先抬 fd
./tsci-run dev circuits/blink.tsx            # → http://localhost:3020
```

实测 `lsof` 确认监听 `*:3020`，`curl` 返回 200。

`fd` 不够时的取舍：dev 起多 worker + watch，吃 fd；export 是无头单次任务，不受影响。
沙箱 fd 硬顶 2048 时一律退回 export。

---

## 已知问题（不阻塞，但要知道）

### sharp 的 postinstall 会失败 —— 已绕过，不影响任何导出

`sharp@0.32.6` 要从 GitHub release 拉 libvips 预编译包，本机网络拉不下来
（HTTP/2 framing error / ECONNREFUSED / timeout 都遇到过），fallback 去源码编译也失败，
最终 `install script from "sharp" exited with 1`。

**实测影响**：
- `require("sharp")` 会抛「Cannot find module sharp-darwin-arm64v8.node」
- 但 **svg / png / gerbers / netlist 五种导出全部照常**（`pcb-png` 走 resvg，不经 sharp）
- 唯一实际后果：`bun install` 返回**非零退出码**，CI 或 `set -e` 会中断

**已修**：安装命令统一带 `--ignore-scripts`（见「常用命令」），rc=0，且导出全绿。
本项目任何路径都用不到 sharp，跳过所有 install script 是安全的。
真要用 sharp 时再单独 `cd node_modules/sharp && node install/libvips`（前提是网络能通）。

### `-f circuit-json` 会写两份文件

实测：对 `circuits/blink.tsx` 跑 `-f circuit-json -o ../out/check.json`，
除了 `out/check.json`，**还会在电路文件旁多写一份 `circuits/blink.circuit.json`**，
两份内容逐字节相同。

不影响正确性，但会污染源码目录。已在 `.gitignore` 里排除 `circuits/*.circuit.json`。
其他格式（netlist / svg / png / gerbers）实测**不会**有这个问题。

### autorouting 产物存不下来 —— 上游问题，已提 issue + PR

`@tscircuit/core@0.0.2119`（截至 2026-10-09 的 npm latest）会出现：

```
Could not save autorouting paths for subcircuit_source_group_0:
Saved phase path ".LED1 > port.pin1" must end at another connection endpoint;
use autorouter="fanout" for saved escapes
```

**注意：PCB 本身是正确布线的**（无 `pcb_autorouting_error`，`pcb_trace` 都有真实几何和
正确的起止 `pcb_port_id`）。丢的只是 `.tscircuit/autorouting-artifacts/` 那个
可回放产物，CLI 因此跳过写入。严重性：**轻微**，不是渲染缺陷。

**真实根因**（在 core 仓库里逐变量插桩定位到的，比最初的猜测更窄）：saved path 要求
走线两端属于**同一条 SRJ 连接**；而当某个 pin 同时属于两条连接时，路由器会把这条网络
布成一棵**跨连接**的树——经由另一条连接的 port 抵达，而不是直接连线过去。此时无论
锚在哪一端都无法表达，该产物只能作废。

`autorouter="fanout"`（报错自己推荐的解法）实测**一字不变地无效**。

最小复现（`R1.pin2` 同时属于两条连接）：

```tsx
<chip name="U1" footprint="soic8" pinLabels={{ pin1: "VCC", pin2: "GND", pin3: "OUT", pin4: "IN" }} pcbX={0} />
<resistor name="R1" resistance="330" footprint="0402" pcbX={-6} pcbY={0} />
<led name="LED1" footprint="0402" pcbX={6} pcbY={0} />
<trace from="U1.VCC" to="R1.pin1" />
<trace from="U1.OUT" to="R1.pin2" />
<trace from="R1.pin2" to="LED1.pin1" />
<trace from="LED1.pin2" to="U1.GND" />
```

**影响**：`circuits/blink.tsx` 恰好有一个 pin（`R1.pin2`）同时属于两条连接，所以踩到了；
改成串联通路就不会出现。导出本身永远成功，只是那个产物存不下来。

### 相关上游进展（2026-10-09 查）

**已提交**：[issue #4481](https://github.com/tscircuit/core/issues/4481)（已按实测更正根因与严重性）
+ [PR #4482](https://github.com/tscircuit/core/pull/4482) —— 修的是**报错误导性**：
在锚定走线时识别「跨连接」形态，用可读的 port 名报出是哪两个 port，
不再甩锅给一条从未被保存的路径、不再推荐无效的 `autorouter="fanout"`。
（+37 行、0 删除，带 `tests/repros/` 复现测试与 PCB 快照，在 main 上红、修复后绿。）

| 编号 | 状态 | 说明 |
|------|------|------|
| [core#4482](https://github.com/tscircuit/core/pull/4482) | **open（本次提交）** | 让诊断指向真实成因 |
| [core#4481](https://github.com/tscircuit/core/issues/4481) | open（本次提交） | 问题报告，含最小复现与隔离表 |
| [core#4197](https://github.com/tscircuit/core/issues/4197) | 已关闭 | 同一句报错的出处，由 [#4204](https://github.com/tscircuit/core/pull/4204) 修复且**确实包含在 0.0.2119 里**（compare `7f68819...abe48513` = ahead 239 / behind 0）。但本条是**另一个成因**（跨连接走线），不是那个修复的残留缺口 |
| [core#3887](https://github.com/tscircuit/core/issues/3887) | 已关闭 | 症状同为 `undefined connectedPort.x`，但触发条件是**异步/文件加载的 `.kicad_mod` 封装**缺 `pcb_port_id`，由 #3889/#3892 修复。与本条不是同一路径 |
| [core#4337](https://github.com/tscircuit/core/pull/4337) | open | repro：对角封装铜箔 abort autorouting。相邻但不同 |
| [core#4477](https://github.com/tscircuit/core/pull/4477) | open | fix：保留手动 `pcbPath`。相邻但不同 |
| [core#4192](https://github.com/tscircuit/core/pull/4192) | open | fix：忽略无主顶层走线。相邻但不同 |

搜 `connectedPort`、`must end at another connection endpoint`、`getSimpleRouteJson`
在 open issue / PR 里**均 0 命中** —— 提交时没有任何 PR 在正面修这条。

**规避办法**：设计电路时避免让同一个 pin 同时属于两条连接（串联化即可），
否则该板的 autorouting 产物存不下来；PCB 渲染不受影响。
上游若改成「按电气网络合并成一条多端连接」就能真正存下来，
但那属于建模改动，需要维护者定夺。届时改 `overrides` 里的版本号即可。

---

## 本地补丁（patches/）

上游 PR [#4482](https://github.com/tscircuit/core/pull/4482) 的修复已经**用 `bun patch` 固化成
本项目的第 6 条契约**，不需要等上游合并：

```
patches/@tscircuit%2Fcore@0.0.2119.patch   # 改的是 core 打包产物的 dist/index.js
package.json → patchedDependencies
```

`bun install` 会**自动**应用它，无需任何手工步骤。实测全新安装 rc=0，
补丁自动生效，五种导出全绿。

**为什么需要它**：不打补丁时导出每条分支拓扑电路都会打印
`Saved phase path "..." must end at another connection endpoint; use autorouter="fanout" for saved escapes`
—— 甩锅给一条从未被保存的路径，还推荐一个实测无效的解法。打上补丁后变成：

```
Route between .LED1 > port.pin1 and .U1 > port.OUT spans separate connections of
the same net; the router reached one port through the other instead of tracing
between them, which a saved path cannot express
```

**验证补丁是否生效**：

```bash
grep -c "spans separate connections" node_modules/@tscircuit/core/dist/index.js   # 1 = 已打上
```

**⚠️ 补丁绑死版本号**。key 是 `@tscircuit/core@0.0.2119`，和 `overrides` 一致。
上游修好后升级 core，补丁会失效（bun 不会把 0.0.2119 的补丁套到新版本上），这时应该：

```bash
# 1. 删掉 package.json 的 patchedDependencies
# 2. 删掉 patches/ 目录
# 3. 改 overrides 里的 core 版本号，重装
```

**补丁没改行为，只改诊断**：跳连接形态下产物依然存不下来（模型层限制，
见下方「autorouting 产物存不下来」），但现在报错说的是真话。

```
my-tscircuit/
├── package.json        # 钉版本 + overrides + patchedDependencies —— 契约的核心
├── bun.lock            # 已生成，换机用 --frozen-lockfile 复现
├── .npmrc              # registry=https://registry.npmjs.org
├── bunfig.toml         # preload = ["./scripts/proxy-fetch.ts"]
├── patches/            # bun patch 产出的本地补丁（install 时自动应用）
│   └── @tscircuit%2Fcore@0.0.2119.patch
├── scripts/
│   └── proxy-fetch.ts  # wrap fetch → 127.0.0.1:8118（解决 kicad:/jlcpcb: 直连 407）
├── tsci-run            # 自建 wrapper，#!/usr/bin/env bun，强制 Bun + 走本地钉死依赖
├── proxy-run           # 启动本地 gost 中继（127.0.0.1:8118）
├── circuits/           # 实际电路 .tsx 都放这
└── out/                # export 产物（netlist / pcb-svg / pcb-png / gerbers...）
```

## 代理调试

### gost 已安装并验证生效

`gost 3.3.0`（Homebrew，`/opt/homebrew/bin/gost`）。启动：

```bash
./proxy-run                    # 前台启动 gost 中继 127.0.0.1:8118
```

**⚠️ 不要用 `brew services start gost`**：Homebrew 默认配置 `/opt/homebrew/etc/gost.yml`
监听的是 `:8080` 且绑 `eth0`，与本契约要求的 `127.0.0.1:8118` 不符。

**自检三连**：

```bash
# 1. 端口在听
lsof -nP -iTCP:8118 -sTCP:LISTEN

# 2. 代理本身通（期望 200）
curl -x http://127.0.0.1:8118 https://easyeda.com/ -o /dev/null -w '%{http_code}\n'

# 3. preload 真的把上游域名送进了代理（而不是回退直连）
TSC_PROXY_DEBUG=1 ./tsci-run export circuits/blink.tsx -f readable-netlist -o ../out/x.txt
```

**实测（2026-10-10，冷缓存）**：清空 `.tscircuit` 后导出，
`jlcsearch.tscircuit.com` 与 `easyeda.com` 全部标记「经代理」，
gost 日志出现真实隧道与字节数，**无「代理失败，回退直连」**。

域隔离也验证过（这是这层 preload 存在的全部理由）：

| 目标 | 走向 | gost 连接记录 |
|---|---|---|
| `registry.npmjs.org` | **直连** | 无 |
| `jlcsearch.tscircuit.com` | 经代理 | 有 |
| `easyeda.com` | 经代理 | 有 |
| `127.0.0.1`（本地） | 直连 | 无 |

### preload 行为

`scripts/proxy-fetch.ts` 只对 `kicad|jlc|lcsc|easyeda|oshwlab` 命中的域名生效，
loopback 一律直连，**代理不通会自动回退原始 fetch**。

```bash
TSC_PROXY_DEBUG=1 ./tsci-run export circuits/blink.tsx -f pcb-svg -o ../out/blink.pcb.svg
TSC_PROXY_ALL=1   ...   # 全部外部请求走代理
TSC_PROXY_OFF=1   ...   # 完全直连（排查代理本身的问题）
```

实测行为（本地起了个最小代理对照验证）：

| 目标 | 行为 |
|------|------|
| `https://easyeda.com/...` | 经代理，CONNECT 隧道通 |
| `https://registry.npmjs.org/...` | **直连**，域名不在匹配范围内 |
| `http://127.0.0.1:...` | 直连，loopback 排除 |
| 代理没起 | 自动回退直连，导出照常成功 |

### ⚠️ 实现要点：用 Bun 原生 `proxy` 选项，不要手写 CONNECT

最初按 oven-sh/bun#30381 的思路在 preload 里手写 `node:http` 的 CONNECT 隧道，
**在 Bun 1.3.3 上根本跑不通**：Bun 的 `node:http` polyfill 不接受 absolute-URI 请求目标，
连 `method: "CONNECT"` 都直接抛 `TypeError: fetch() URL is invalid`。

实测可行的做法是直接用 Bun 原生 fetch 的 `proxy` 选项（CONNECT 隧道已验证可用）：

```ts
originalFetch(input, { ...init, proxy: "http://127.0.0.1:8118" })
```

preload 这层包装依然必要，但理由变了：**它不是为了绕开 Bun 的 CONNECT bug，
而是为了把代理范围限定在 kicad/jlcpcb 上游域名上** —— `HTTP_PROXY` 环境变量是进程级的，
会把 registry.npmjs.org 也一起拐进代理，而 registry 直连才是我们要的。

## 什么时候才需要第二个文件夹

只有一种情况：新项目需要另一套钉死的版本组合（比如 CLI 出大版本、你想 A/B 对比）。
届时不是升级 `my-tscircuit`，而是**整个目录复制一份改版本号**。

## 换机复现

```bash
# 1. 机器上装 Bun 1.3.3
curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.3"

# 2. 拷贝本目录（node_modules/ 已在 .gitignore 里，不带；bun.lock 要带）
# 3. 在目录内落地契约
cd my-tscircuit
bun install --frozen-lockfile --ignore-scripts   # rc=0，逐字节一致的依赖树
                                                  # --ignore-scripts 必须带，见 sharp 一节

# 4. 验证：五种格式 + dev 都要能跑
./tsci-run export circuits/blink.tsx -f pcb-svg -o ../out/blink.pcb.svg
./tsci-run dev circuits/blink.tsx                  # → http://localhost:3020

# 5. 启动本地代理中继（契约第 4 条）
./proxy-run                    # gost 127.0.0.1:8118，前台运行
# 自检：curl -x http://127.0.0.1:8118 https://easyeda.com/ -o /dev/null -w '%{http_code}\n'
```

> **gost 的装法**：`brew install gost`（3.3.0）。
> 这台机器从 GitHub release 直连下不动（HTTP/2 framing error 反复出现，16MB 的 v3
> tar.gz 试了 5 次没下完，v2 的 5MB 也失败），Homebrew 走 ghcr.io bottle 才稳定。

`bun.lock` 已生成并纳入版本管理，`--frozen-lockfile` 比光靠 `package.json` 的版本号更硬。

> **Bun 装在工作区外层**：`../.tooling/bun/bin/bun`（1.3.3，macOS arm64），
> 没有动全局环境。要用就把该目录加进 PATH：
> `export PATH="$HOME/Desktop/tscircuit/.tooling/bun/bin:$PATH"`
> 换成 `~/.bun/bin/bun` 全局安装后，`tsci-run` 依然工作（它用 `process.execPath` 取运行时）。

## 工作区位置

```
~/Desktop/tscircuit/            ← tscircuit 专属工作区
├── .tooling/bun/bin/bun       ← Bun 1.3.3（项目外的工具层）
├── my-tscircuit/              ← 本项目（你现在在这）
└── my-tscircuit-baseline.zip  ← 本项目的快照包
```

`.tooling` 与 `my-tscircuit/` 同级，所以 README 里所有 `../.tooling/...` 的
相对引用在任何机器上都成立——**复制整个 `tscircuit/` 目录到别处也能直接用**，
不用改任何路径。换新项目时同理：再复制一份目录、改版本号即可。

---

## 环境健康状态（2026-10-10 实测）

| 项 | 状态 |
|---|---|
| 冷启动（清空 `.tscircuit` 缓存） | ✅ 五种格式全部导出成功，footprint 直接解析 |
| 锁文件复现（`--frozen-lockfile --ignore-scripts`） | ✅ rc=0，版本钉死正确，五种格式全绿 |
| 本地补丁自动应用 | ✅ 全新安装后 `grep -c "spans separate connections"` = 1 |
| 版本钉死 | ✅ core 0.0.2119 / cli 0.1.2277 / tscircuit 0.0.2790 |
| `dev` 服务器 | ✅ 监听 `*:3020`，HTTP 200 |
| `sharp` | ⚠️ 不可用，但被 `--ignore-scripts` 绕过，五种导出不受影响 |
| gost 代理 | ✅ **已装 3.3.0 并实测生效**；冷缓存导出确认上游域名走代理、registry 直连 |
| autorouting 产物 | ⚠️ 分支拓扑下仍存不下来（模型层限制）；**报错已是准确文案**（补丁生效） |

**结论**：日常导出与开发服务器稳定可用，六条契约全部落地且可复现。
唯一剩余缺口是 autorouting 产物本身存不下来（上游建模问题），
但不再报错误导；真正解决要等 core#4481 合并后改 `overrides` 版本号，
届时删掉 `patches/` 即可。