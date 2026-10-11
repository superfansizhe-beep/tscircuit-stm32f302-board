# AGENTS.md

`my-tscircuit` —— 基于 Bun + tscircuit 的硬件描述项目：用 TSX 声明电路，导出网表 / PCB / Gerber。

**这里的 `.tsx` 是电路描述，不是 UI。** 标签是元件和走线，不是页面元素。

本目录当前**不是 git 仓库**（实测）。需要版本管理时先问用户，不要擅自 `git init`。

## 六条环境契约 —— 不可绕过

| # | 契约 | 内容 |
|---|------|------|
| 1 | 运行时 | Bun 1.3.3，**只认 `./tsci-run`**。落到 Node 会 `ERR_UNSUPPORTED_DIR_IMPORT` |
| 2 | 版本钉死 | `package.json` → `overrides` 钉死 `@tscircuit/core@0.0.2119` |
| 3 | registry | `.npmrc` 指官方源；npmmirror 同步滞后，取不到钉死版本 |
| 4 | 网络 | `kicad:` / `jlcpcb:` 封装抓取走本地 gost 中继 `127.0.0.1:8118` |
| 5 | fd | `dev` 前先 `ulimit -n 65536`；fd 受限时退回无头 `export` |
| 6 | 补丁 | `patches/@tscircuit%2Fcore@0.0.2119.patch` 由 `bun install` 自动应用 |

Bun **不在 PATH**，装在工作区外层：`export PATH="$HOME/Desktop/tscircuit/.tooling/bun/bin:$PATH"`（1.3.3）。

## Setup 与常用命令

```bash
# ⚠️ --ignore-scripts 必须带：sharp 的 postinstall 在本机必失败（拉不到 libvips 预编译包），
#    会让 bun install 返回非零退出码、CI / set -e 直接中断。本项目任何路径都用不到 sharp。
bun install --frozen-lockfile --ignore-scripts

# 导出（无头，一次性产物；-o 要给完整文件名，不能给目录）
./tsci-run export circuits/blink.tsx -f readable-netlist -o ../out/blink.netlist.txt
./tsci-run export circuits/blink.tsx -f pcb-svg        -o ../out/blink.pcb.svg
./tsci-run export circuits/blink.tsx -f schematic-svg  -o ../out/blink.schematic.svg
./tsci-run export circuits/blink.tsx -f pcb-png        -o ../out/blink.pcb.png
./tsci-run export circuits/blink.tsx -f gerbers        -o ../out/blink.gerbers.zip

# 开发服务器（watch + 多 worker，吃 fd）
ulimit -n 65536 && ./tsci-run dev circuits/blink.tsx      # → http://localhost:3020

# 代理中继（契约 4）
./proxy-run                                               # gost 127.0.0.1:8118，前台运行
```

`package.json` **没有 scripts 字段**，不要写 `npm run` / `bun run` 的用法。

## ⚠️ 三个必须避开的坑

| 写法 | 后果 |
|---|---|
| `bunx --bun @tscircuit/cli ...` | bunx 在临时缓存重新解析依赖树，绕开本项目 `node_modules` 与 `overrides` —— 契约 2 直接作废 |
| `./node_modules/.bin/tscircuit-cli ...` | shebang 是 `node`，直接落到 Node → `ERR_UNSUPPORTED_DIR_IMPORT` |
| `-o out/blink.svg` | `-o` 相对**电路文件所在目录**解析，会落到 `circuits/out/` → ENOENT |

正确写法统一是 `./tsci-run ...`。

## 写电路

- 一个电路一个文件，放 `circuits/*.tsx`，`export default () => (<board>…</board>)`。
- 元件用 `<chip>` / `<resistor>` / `<led>`，footprint 用字符串别名（`soic8`、`0402`）。
- pin 引用优先用 `.U1 > .VCC` 选择器；布局用 `pcbX` / `pcbY`，单位 mm。
- **避免同一个 pin 同时属于两条 `<trace>`**（分支 / 三通节点）：会触发
  `@tscircuit/core@0.0.2119` 的 autorouting 产物存不下来（core#4481）。
  改成串联通路即可绕开。导出永远成功、PCB 布线也正确，丢的只是可回放产物。
- 需要新格式先跑 `./tsci-run export --help`；README 列了全部支持的 `-f` 值。

## 代码风格

- **文件头块注释是硬惯例**：每个 `.ts` / `.tsx` 开头用 `/** */` 写清「干什么 + 为什么这么写」，
  实测踩过的坑和结论直接写进去。照 `scripts/proxy-fetch.ts` 与 `circuits/blink.tsx` 的密度写。
- 注释与文档用中文，标识符用英文。
- Prettier 风格：无分号、双引号、2 空格缩进、尾随逗号。
- 行为开关走环境变量，常量集中声明在文件顶部，调试开关默认关闭
  （照 `scripts/proxy-fetch.ts` 的 `PROXY_*` / `DEBUG` / `MATCH`）。

## 目录与产物

- `circuits/` 电路源码 · `out/` export 产物（已忽略，保留 `.gitkeep`）· `scripts/` preload 脚本
- `.tscircuit/` 是缓存，可随时清空；冷启动会重新抓取封装
- `-f circuit-json` 会在 `circuits/` 旁多写一份同名 sidecar（已 gitignore），其他格式不会

## 改版本配置前

- 升级 core 要**三步一起做**：删 `patchedDependencies` → 删 `patches/` → 改 `overrides` 版本号 → 重装。
  补丁 key 绑死版本号，bun 不会把 `0.0.2119` 的补丁套到新版本上。
- 验证补丁是否生效：`grep -c "spans separate connections" node_modules/@tscircuit/core/dist/index.js`
  （输出 `1` = 已打上）

**动手前先读 `README.md`** —— 里面每条命令都是实测跑出来的，并标明了所有偏离原始契约的地方。