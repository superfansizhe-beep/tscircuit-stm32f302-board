#!/bin/bash
# 一键导出全部交付文件到 out/stm32f302/deliverables/
#
# ⚠️ 为什么要走 Altium 这条路：
#   提交要求 .epro2（嘉立创 EasyEDA Pro 私有格式），tscircuit 导不出来，
#   只能 tscircuit → 中间格式 → EasyEDA Pro 手动转。
#   实测 tscircuit 的 kicad_sch 导出是**空的**（连单页都只有 0 个符号，
#   是它的缺陷），而 altium 导出是完整的（10 张 SchDoc，元件数逐页对得上）。
#   所以转 .epro2 用 Altium 包，不用 KiCad 包。
set -e
export PATH="$HOME/Desktop/tscircuit/.tooling/bun/bin:$PATH"
cd ~/Desktop/tscircuit/my-tscircuit
D=out/stm32f302/deliverables
SRC=circuits/stm32f302/main.tsx
IMG=out/stm32f302/images

rm -rf "$D"
mkdir -p "$D"/{01-原理图,02-PCB,03-导入EasyEDA,04-制造资料,05-3D}

ex() { ./tsci-run export "$SRC" -f "$1" -o "$2" >/dev/null 2>&1 || echo "   ⚠️ $1 失败"; }

echo "── 01 原理图"
ex schematic-pdf  "$D/01-原理图/原理图-九页.pdf"
# 分页图由 render-all.sh 产出后再拷过来
[ -d "$IMG" ] && {
  cp "$IMG"/sch-all-pages.png "$D/01-原理图/00-九页总图.png"
  i=0
  for p in power:01-电源页 mcu:02-最小系统页 uart:03-串口页 i2c:04-I2C页 \
           spi:05-SPI页 can:06-CAN页 pwm:07-PWM页 adc:08-ADC采样页 led:09-指示灯页; do
    k="${p%%:*}"; n="${p#*:}"
    cp "$IMG/sch-$k.png" "$D/01-原理图/$n.png" 2>/dev/null || true
  done
  cp "$IMG/pcb-full.png" "$D/02-PCB/PCB-全板.png" 2>/dev/null || true
  cp "$IMG/pcb-mcu-zoom.png" "$D/02-PCB/PCB-主控区细节.png" 2>/dev/null || true
}
cp out/stm32f302/main.sch.svg "$D/01-原理图/原理图-矢量.svg" 2>/dev/null || true

echo "── 02 PCB"
# 正反面分开导出。⚠️ 注意：`--layer` 只支持 top / bottom，
# 内层（inner1/inner2）导不出来 —— 内层只在"全板图"里能看到，
# 制造上由 Gerber 里的 In1_Cu / In2_Cu 表达。
# 用 pcb-svg + --layer 再转 PNG，比直接 pcb-png 分辨率高得多（800px → 2400px）。
for L in top bottom; do
  case $L in top) NAME=顶层 ;; bottom) NAME=底层 ;; esac
  ./tsci-run export "$SRC" -f pcb-svg --layer $L -o "/tmp/_pcb-$L.svg" >/dev/null 2>&1 || true
  bun scripts/svg2png.ts "/tmp/_pcb-$L.svg" "$D/02-PCB/PCB-$NAME.png" 2400 >/dev/null 2>&1 || true
done
ex gerbers        "$D/02-PCB/Gerber.zip"
cp out/stm32f302/main.pcb.svg "$D/02-PCB/PCB-矢量.svg" 2>/dev/null || true

echo "── 03 导入 EasyEDA 用"
ex altium         "$D/03-导入EasyEDA/Altium工程.zip"
ex kicad_pcb      "$D/03-导入EasyEDA/main.kicad_pcb"

echo "── 04 制造资料"
ex readable-netlist "$D/04-制造资料/网表.txt"
python3 scripts/gen-bom.py >/dev/null 2>&1 || true

echo "── 05 3D"
ex step           "$D/05-3D/整板.step"

echo
echo "完成。文件："
find "$D" -type f | sort | while read f; do
  printf "  %9.0f KB  %s\n" "$(($(stat -f%z "$f")/1024))" "${f#$D/}"
done
