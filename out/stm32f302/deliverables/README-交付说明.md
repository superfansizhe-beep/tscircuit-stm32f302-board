# 交付说明 — STM32F302R8T6 考核板

> 本目录的文件由 `scripts/export-deliverables.sh` 从 `circuits/stm32f302/` 的
> 源码自动生成。**改电路后重跑那个脚本即可刷新全部**，不要手改本目录里的文件。

---

## ⚠️ 最重要的一步：提交要用 `.epro2`，需要你手动转一次

tscircuit **不能直接导出 `.epro2`**（嘉立创 EasyEDA Pro 的私有格式）。
所以走 **tscircuit → Altium → EasyEDA Pro → `.epro2`** 这条路。

### 转换步骤

用 `03-导入EasyEDA/Altium工程.zip`（**不要用 KiCad 那个，原因见下**）：

1. 打开 **EasyEDA Pro**（嘉立创 EDA 专业版）
2. 菜单 **文件 → 导入 → Altium**
3. 选择 `Altium工程.zip`（不用解压）
4. 勾选全部 10 张原理图 + PCB，确认导入
5. **检查**：原理图应有 9 页、PCB 应是 80×80、4 层
6. **文件 → 另存为 → 嘉立创EDA专业版工程（`.epro2`）**

### 为什么不用 KiCad 那个

`03-导入EasyEDA/main.kicad_pcb` 里的 **PCB 是完整可用的**（84 个封装、
1675 段走线、331 个过孔），但它配套的 `kicad_sch` **是空的** ——
这是 tscircuit 的缺陷，实测连单页导出也是 0 个符号。

而 **Altium 导出是完整的**，元件数逐页核对过：

| 文件 | 元件数 | 对应页 |
|------|-------:|--------|
| main-01.SchDoc | 20 | 电源 |
| main-02.SchDoc | 20 | 最小系统 |
| main-03.SchDoc | 3 | 串口 |
| main-04.SchDoc | 11 | I2C |
| main-05.SchDoc | 7 | SPI |
| main-06.SchDoc | 5 | CAN |
| main-07.SchDoc | 3 | PWM |
| main-08.SchDoc | 9 | ADC 采样 |
| main-09.SchDoc | 6 | 指示灯 |
| **合计** | **84** | ✓ 与实际一致 |

所以**优先用 Altium 包**。KiCad 的 PCB 作为备用（比如 Altium 导入出问题时）。

---

## 目录内容

### `01-原理图/`

| 文件 | 说明 |
|------|------|
| `原理图-九页.pdf` | 九页原理图，**建议用这个交作业** |
| `00-九页总图.png` | 九页竖直堆叠总图（1000×6743） |
| `01-电源页.png` … `09-指示灯页.png` | 分页图，每页 1500×750 |
| `原理图-矢量.svg` | 矢量版，放大不糊 |

### `02-PCB/`

| 文件 | 说明 |
|------|------|
| `PCB-全板.png` | 全板视图（2400×1800，含内层地平面） |
| `PCB-主控区细节.png` | 主控区放大，看去耦电容布局 |
| `PCB-顶层.png` / `PCB-底层.png` | 单层视图 |
| `PCB-矢量.svg` | 矢量版 |
| `Gerber.zip` | **打样用**。含 4 层铜箔（F_Cu/B_Cu/**In1_Cu/In2_Cu**）、阻焊、丝印、钢网、板框、4 层钻孔，另附 `bom.csv` 与 `pick_and_place.csv` |

### `03-导入EasyEDA/`

| 文件 | 说明 |
|------|------|
| `Altium工程.zip` | **转 .epro2 用这个**（原理图 10 张 + PCB + 工程文件） |
| `main.kicad_pcb` | KiCad 格式 PCB（备用） |

### `04-制造资料/`

| 文件 | 说明 |
|------|------|
| `BOM.csv` | 37 种料号，含 C 编号、厂商型号、封装、参数、数量、位号 |
| `网表.txt` | 可读网表 |

### `05-3D/`

| 文件 | 说明 |
|------|------|
| `整板.step` | 整板 3D 模型，可导入 SolidWorks / Fusion 做结构核对 |

---

## 板子规格

| 项目 | 值 |
|------|-----|
| 尺寸 | **80 × 80 mm** |
| 层数 | **4 层**（顶层信号 / 内层1 GND / 内层2 电源 / 底层信号） |
| 元件 | 84 个（261 个 SMT 焊盘 + 76 个通孔） |
| 走线 | 234 条、197 个过孔 |
| 铜皮 | 内层1 + 底层 GND 平面 |

---

## 已知问题（交付前请知情）

### 1. 布线 DRC 剩 2 条，均为晶振

```
PCB trace uses 2 vias, exceeding the 0 maximum   ×2
```

tscircuit 把晶振网络的 `max_via_count` **硬编码为 0**
（core 里的 `DEFAULT_CRYSTAL_MAX_VIA_COUNT`），**没有任何 prop 可覆盖**；
布线器在这块板上做不到晶振走线零过孔。已翻 core 源码确认。

**影响很小**：晶振走线实际只有 2 个过孔，长度已放宽到 20mm 以内。

### 2. CAN 未做差分对

本工程的接线架构是「每个引脚一条 trace 连到命名网络」，
`<differentialpair>` 需要的是「成对的两条走线」，架构上不匹配。
CAN_H / CAN_L 按普通信号走。

**影响很小**：CAN 最高 1Mbps，不做差分对也能正常工作。

### 3. 走线里有 17 个 90° 直角（占 530 个有效转角的 3.2%）

**93% 的转角已经是 45°** —— 布线器本来就在做 45° 走线，这部分不用管。

剩下的 17 个 90° 直角，实测**不是布线器偷懒，多数是躲焊盘逼出来的**：

| 类型 | 数量 | 能否优化 |
|------|-----:|----------|
| 位于焊盘出口处（≤0.7mm） | 4 | ❌ 由引脚排布决定 |
| 走线中途 | 13 | ❌ **实测切角会撞相邻焊盘**（见下） |

#### 为什么切不了角（实测）

拿 `U3.pin64 → V3_3` 这条试：它的 90° 拐点在 U3 左下角。
强制改成 45° 后立刻报：

```
Pad U3.VSS  and trace U3.pin64 to net.V3_3 are too close (0.05mm, 需 0.1mm)
Pad U3.PC13 and trace U3.pin64 to net.V3_3 are too close (0.05mm, 需 0.1mm)
Trace [U3.pin64 to net.V3_3] has dangling endpoint
```

原因：LQFP-64 的引脚间距只有 **0.5mm**，从密集引脚阵列里出来时，
直角绕行是**为了和相邻焊盘保持间距**。切 45° 会让走线斜穿到隔壁脚的焊盘上。

#### 试过的两条路都失败

1. **`pcbRouteCache`**（官方"直接采用给定走线"入口）
   - 只给 cache：布线器带着预载走线再跑一遍，内存溢出，产出 284 条乱走线
   - 补 `cacheKey` + `routingDisabled`：不报错了，但**只有 182/234 条采用缓存**，
     没采用的那 52 条正好包含全部 17 个直角 —— 一个都没修到
2. **`pcbPath`**（在 trace 上手工指定路径）
   - 给中间点：tscircuit 把折线**简化成整条对角线**，撞焊盘
   - 给完整路径：同样被简化，同样撞焊盘

#### 结论

tscircuit **没有全局倒角开关**（core 里的 `chamferOrthogonalPolyline()`
只在 `createBranchTrace` 这个特定策略内部调用），而这 17 个直角在
0.5mm 引脚间距下**本来就是为了避让**。

**建议保持现状。** 若仍要处理，只能手工在 EasyEDA Pro 里逐个微调
（每处一个拐角，分散在 17 条不同走线上互不影响），但要逐条确认
调整后不会违反焊盘间距。

### 4. 无阻抗控制

tscircuit 不支持。但本板**没有真正的高速信号** —— 最快是 CAN 1Mbps、
SPI 几 MHz，都不需要阻抗控制。

---

## 重新生成

```bash
cd ~/Desktop/tscircuit/my-tscircuit

# 1) 重建电路并跑验收
export PATH="$HOME/Desktop/tscircuit/.tooling/bun/bin:$PATH"
./tsci-run export circuits/stm32f302/main.tsx -f circuit-json -o ../../out/stm32f302/main.json
python3 scripts/check-modules.py     # 元件数 / 丢件 / 几何重叠 / 页外元素
python3 scripts/erc.py               # 八项电气规则

# 2) 刷新图片与交付文件
./scripts/render-all.sh
./scripts/export-deliverables.sh
python3 scripts/gen-bom.py           # 刷新 BOM
```
