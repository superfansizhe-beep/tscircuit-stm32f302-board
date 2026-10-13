# 交接说明 —— STM32F302R8T6 考核板

> 交接时的仓库状态：`39e710a`（main 分支）
> 最后更新：2026-10-13

---

## 一、这个项目是什么

用 **tscircuit**（电路即代码，用 TypeScript/TSX 描述电路）设计的一块
STM32F302 开发板，含原理图、PCB、制造文件，以及一套自动校验脚本。

| | |
|---|---|
| 题目出处 | 考核题，文档在 `~/Downloads/1（1）…` |
| 板子 | **80 × 80 mm，4 层** |
| 主控 | STM32F302R8T6（LQFP-64） |
| 元件 | **84 个**（261 个 SMT 焊盘 + 76 个通孔） |
| 原理图 | **9 页**（电源 / 最小系统 / 串口 / I2C / SPI / CAN / PWM / ADC / 指示灯） |
| 走线 | 234 条、197 个过孔 |
| 铜皮 | 内层1 + 底层 GND 平面 |
| 评分构成 | 原理图 60%，PCB 40%（其中布局 70%、布线 30%） |
| 截止时间 | **2026-10-13 18:00** |

### 功能

- **电源**：XT30 输入 → 拨动开关 → RY8411 降压到 5V → TLV75733 LDO 到 3.3V，三颗电源指示灯
- **最小系统**：8MHz HSE 晶振、复位/启动按键、SWD 调试口、全套去耦
- **外设**：3 路串口（PH2.0）、3 路 I2C、2 路 SPI（MCP23S17 扩 16 路 GPIO）、
  1 路 CAN、6 路 PWM 舵机轨、3 路 ADC 电源采样、3 路 GPIO 指示灯

---

## 二、仓库结构

```
my-tscircuit/                          ← 工程根（git 仓库）
├── README.md                          ← 工具链契约（环境怎么钉死的）
├── circuits/stm32f302/                ← ★项目源码★
│   ├── main.tsx                       ← 顶层：板框、叠层、铺铜、模块装配
│   ├── nets.ts                        ← 50 个网络的注册表
│   ├── pages.ts                       ← 9 个原理图分页
│   ├── modules/01-power.tsx … 09-led.tsx   ← 9 个模块
│   ├── parts/                         ← 可复用零件（降压块、LDO、PH2.0、上拉对…）
│   ├── README.md                      ← ★开发过程踩坑记录（很有价值，务必看）★
│   ├── REQUIREMENTS.md / PINMAP.md / BOM.md / REFDES.md
│   └── BOM-AUTO.md                    ← 从电路产物自动生成
├── scripts/                           ← 校验与导出
│   ├── check-modules.py               ← 逐模块查元件数/丢件/几何重叠/越出板边
│   ├── erc.py                         ← 八项电气规则检查
│   ├── gen-bom.py                     ← 从 circuit-json 反推 BOM
│   ├── render-all.sh                  ← 刷新全部图片
│   ├── export-deliverables.sh         ← 刷新全部交付文件
│   ├── push-via-api.py                ← GitHub 推送（github.com 不通时的通道）
│   └── svg2png.ts / proxy-fetch.ts
└── out/stm32f302/
    ├── deliverables/                  ← ★交付物★
    │   ├── README-交付说明.md          ← 含 .epro2 转换步骤与已知问题
    │   ├── 01-原理图/                  ← 九页 PDF + 分页 PNG + 矢量
    │   ├── 02-PCB/                     ← 正反面 + 全板 + Gerber（4 层）
    │   ├── 03-导入EasyEDA/             ← Altium 工程（转 .epro2）+ KiCad PCB
    │   ├── 04-制造资料/                ← BOM.csv + 网表
    │   └── 05-3D/                      ← 整板.step（见下方"已知问题"）
    └── images/                        ← 渲染图
```

---

## 三、怎么跑起来

### 1. 工具链（已钉死，不要升级）

```bash
cd ~/Desktop/tscircuit/my-tscircuit
export PATH="$HOME/Desktop/tscircuit/.tooling/bun/bin:$PATH"
```

| 项 | 版本 / 位置 | 说明 |
|---|---|---|
| Bun | **1.3.3**（`~/Desktop/tscircuit/.tooling/bun/bin`） | **不在 PATH 上**，必须显式 export；用 Node 跑会报 `ERR_UNSUPPORTED_DIR_IMPORT` |
| `@tscircuit/cli` | 0.1.2277 | |
| `tscircuit` | 0.0.2790 | |
| `@tscircuit/core` | **0.0.2119**（`package.json` 的 `overrides` 钉死） | 版本一变行为就变 |

**⚠️ 只用 `./tsci-run` wrapper**，不要用 `bunx`，也不要用 `node_modules/.bin/tscircuit-cli`。
wrapper 里处理了环境变量和网络中继。

### 2. 常用命令

```bash
# 重建电路（约 1 分钟，含布线）
./tsci-run export circuits/stm32f302/main.tsx -f circuit-json -o ../../out/stm32f302/main.json

# 验收（每次改完电路都要跑，不要只看"构建成功"）
python3 scripts/check-modules.py     # 元件数 / 丢件 / 几何重叠 / 越出板边
python3 scripts/erc.py               # 八项电气规则

# 刷新产物
./scripts/render-all.sh              # 图片
./scripts/export-deliverables.sh     # 交付文件
python3 scripts/gen-bom.py           # BOM
```

### 3. 这个环境特有的约束

| 约束 | 内容 |
|---|---|
| 网络 | `kicad:` / `jlcpcb:` 封装抓取走本地 gost 中继 `127.0.0.1:8118`，由 `bunfig.toml` 的 preload 注入 |
| 补丁 | `patches/@tscircuit%2Fcore@0.0.2119.patch` 由 `bun install` 自动应用（固化了 core#4481 的诊断修复） |
| npm 源 | `.npmrc` 指 `registry.npmjs.org`（npmmirror 同步滞后，取不到钉死版本） |
| `tsci dev` | 需要 `ulimit -n 65536`；受限时 fallback 到无头 `export` |

---

## 四、当前进度

| 部分 | 状态 |
|---|---|
| 需求梳理 / 引脚分配 / BOM / 位号 | ✅ 完成 |
| 原理图 9 页分页 + 放置器件 + 接线 | ✅ 完成，**ERC 八项全过** |
| PCB 全局布局 | ✅ 完成（主控居中、接口贴边、去耦贴脚） |
| PCB 布线（4 层） | ✅ 完成，**剩 2 条 DRC**（见已知问题） |
| 交付物导出 | ✅ 五类文件齐全 |
| **`.epro2` 转换** | ⬜ **需要人工做一次**（见下） |
| 提交 | ⬜ 未提交 |

### ⬜ 唯一需要人工做的一步：转 `.epro2`

tscircuit **导不出**嘉立创 EasyEDA Pro 的私有格式 `.epro2`。路径是：

```
tscircuit → Altium → EasyEDA Pro → 另存为 .epro2
```

具体步骤写在 `out/stm32f302/deliverables/README-交付说明.md` 里。要点：

1. 用 **`03-导入EasyEDA/Altium工程.zip`**（**不要用 KiCad 那个**）
2. EasyEDA Pro → 文件 → 导入 → Altium → 选 zip
3. 检查：原理图 9 页、PCB 80×80、4 层
4. 另存为 `.epro2`

**为什么不用 KiCad 包**：tscircuit 的 `kicad_sch` 导出**是空的**（实测连单页
导出都只有 0 个符号），而 `altium` 导出是完整的（10 张 SchDoc，元件数逐页对得上）。
KiCad 的 **PCB** 是可用的，作为备用。

---

## 五、开发过程中抓到的 4 个真 bug（重要，别重蹈）

这 4 个都是**"构建成功但板子是废的"**，构建过程完全不报错，
是靠 `check-modules.py` / `erc.py` 抓出来的 —— **所以那两个脚本必须每次跑**：

1. **晶振缺参数 → 元件静默消失**：`<crystal>` 少了 `loadCapacitance`，
   元件直接从产物里没了，构建无任何提示。
2. **绿/蓝 LED 极性写反**：0603 LED 的 1 脚定义按颜色不同 ——
   红色 `C2286` 1 脚是阳极，绿色 `C84267` / 蓝色 `C84266` 1 脚是**阴极**。
3. **料号在库里不存在 → 元件零焊盘**：磁珠的料号在 JLC 库里查不到，
   元件变成 0 个焊盘，构建照过。**且当时检查脚本也没发现** ——
   是后来补了"零焊盘检查"才抓住的。
4. **网络名与位号重名**：`NET.LED1` 和元件位号 `LED1` 撞了，已改名 `NET.GPIO_LED1/2/3`。

另外有一个**只有功能仿真才能发现**的：做外壳挡边时，第一版忘了把挡边材料
加回去（板子滑入口已经把下壁挖空了），几何看着完全正常，
是"板子往外滑 1mm 能否被挡住"这个仿真查出来的。

---

## 六、已知问题（交付前必须知情）

### 1. 布线 DRC 剩 2 条，都是晶振

```
PCB trace uses 2 vias, exceeding the 0 maximum   ×2
```

tscircuit 把晶振网络的 `max_via_count` **硬编码为 0**
（core 里的 `DEFAULT_CRYSTAL_MAX_VIA_COUNT`），**没有任何 prop 可覆盖**；
布线器在这块板上做不到晶振走线零过孔。已翻 core 源码确认。

**影响很小**：实际只用了 2 个过孔，长度已放宽到 20mm 以内。

### 2. CAN 未做差分对

本工程的接线架构是「每个引脚一条 trace 连到命名网络」，
而 `<differentialpair>` 需要的是「成对的两条走线」，架构上不匹配。
CAN_H / CAN_L 按普通信号走。**影响很小**：CAN 最高 1 Mbps。

### 3. 走线里有 17 个 90° 直角（占 530 个有效转角的 3.2%）

**93% 的转角已经是 45°**。剩下 17 个 90° 直角**多数是躲焊盘逼出来的**：
LQFP-64 引脚间距只有 0.5mm，从密集引脚阵列出来时，直角绕行是**为了和相邻焊盘
保持间距**。实测强行切 45° 会让走线撞上隔壁脚（间距只剩 0.05mm）。

**建议保持现状。** 详见 `deliverables/README-交付说明.md`。

### 4. ⚠️ `05-3D/整板.step` 是残缺的

tscircuit 导出的这个文件**不能作为 3D 交付文件**：

| 问题 | 实测 |
|---|---|
| 语法错误 | 导入时报 `Incorrect Syntax : Fails Count : 8` |
| **大平面三角化失败** | 70 个面被跳过，**含板身最大的两个平面** —— 导出的 STL 在 z=±0.70 处面积加起来**只有 630mm²**（应为 6400），即 **90% 的板身表面缺失** |
| 元件模型缺失 | 84 个元件里**只有 1 个**有 3D 模型；整个文件 z 最高只到板面上 0.6mm |

**最危险的是第三条** —— 拿它做干涉检查会漏掉几乎所有元件，**误导结构设计**。

**建议**：如果要用 3D，用 `build123d`（`/opt/homebrew/bin/python3.12`，
已装 0.13.0）从 `out/stm32f302/enclosure/board.json` 之类的数据重建。

### 5. 早期做过的 3D 外壳工作已被移除

曾经做过一套完整的 3D 外壳（build123d，六步：提数据 → 底壳 → 开连接器口 →
板子挡边 → 盖板+卡扣 → 装配检查 → 打印文件）以及按真实封装建模的全板 3D。
**按用户要求于 2026-10-13 从主干移除。**

如果日后需要，关键经验记在这里：
- `build123d` 用 `/opt/homebrew/bin/python3.12`（**系统 `python3` 是 3.9，跑不了**）
- **不能用电路数据里上报的元件尺寸**：实测 51 个元件报 2.5×0.9mm，那是封装
  courtyard（含焊盘），真实 0603 本体只有 1.6×0.8mm
- LQFP-64 = 10×10 本体 + 四边各 16 只 0.5mm 间距鸥翼脚，跨距 12×12
- `import_step` 返回 **Compound**，不能直接做布尔运算，要先 `Part() + list(s.solids())`
- `Mesher.add_shape` 的参数名是 `linear_deflection` / `angular_deflection`；
  取顶点索引用 `Shape.tessellate(tol, angular)`（Mesher 没有那个方法）
- matplotlib 的 3D 深度排序是**按集合**而非逐三角形的，多零件要合并成一个集合
- tscircuit 的 `<differentialpair>` 参数要**走线名或引脚选择器**，不是网络名

---

## 七、下一步

按优先级：

1. **把 `.epro2` 转出来并提交**（唯一的关键路径，需要人工操作）
2. 如果要交 3D：重建一个干净的板子 3D 模型（见已知问题 4）
3. 可选：手工在 EasyEDA Pro 里把那 17 个 90° 直角拖一下
4. 可选：给 PCB 补安装孔（现在板上**没有任何安装孔**，76 个孔全是元件孔）

---

## 八、GitHub

```
https://github.com/superfansizhe-beep/tscircuit-stm32f302-board   （私有）
```

**注意**：`github.com:443` 在这个网络环境下**长期不稳定**（VPN 抖动时完全不通），
但 `api.github.com` 一直正常。常规 `git push` 走的是 `github.com:443`，所以经常推不上去。

**用 `scripts/push-via-api.py`** —— 它走 Git Data API，用 `base_tree` 只上传
改动文件，并保留完整提交历史：

```bash
python3 scripts/push-via-api.py [--dry-run]
```

（脚本本身踩过的坑都写在文件头里：`base_tree` 不能用 `git rev-parse` 取、
比对文件要加 `-c core.quotePath=false`、远端 SHA 不在本地时的兜底……）

---

## 九、一条最重要的经验

**不要相信"构建成功"。** 这个项目里 4 个致命问题全部逃过了构建检查 ——
板子上少了元件、LED 极性反了、元件零焊盘、网络重名，构建都一声不吭。

**`check-modules.py` 和 `erc.py` 不是摆设，每次改完电路都必须跑。**
`circuits/stm32f302/README.md` 里还有更详细的逐条记录。
