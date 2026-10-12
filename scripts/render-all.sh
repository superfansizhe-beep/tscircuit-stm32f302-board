#!/bin/bash
# 一键生成所有交付图片（PCB + 九页原理图），输出到 out/stm32f302/images/
# 图片放在工程内固定位置，不放 /tmp —— 后者重启就没了。
set -e
export PATH="$HOME/Desktop/tscircuit/.tooling/bun/bin:$PATH"
cd ~/Desktop/tscircuit/my-tscircuit
OUT=out/stm32f302/images
mkdir -p "$OUT"

echo "── PCB"
./tsci-run export circuits/stm32f302/main.tsx -f pcb-svg -o ../../out/stm32f302/main.pcb.svg >/dev/null 2>&1
bun scripts/svg2png.ts out/stm32f302/main.pcb.svg "$OUT/pcb-full.png" 2400
# 主控区细节（展示去耦电容与密集布线）
python3 - "$OUT" <<'PY'
import sys
from PIL import Image
o=sys.argv[1]
im=Image.open(f'{o}/pcb-full.png'); W,H=im.size
im.crop((int(W*0.33),int(H*0.25),int(W*0.75),int(H*0.75))).save(f'{o}/pcb-mcu-zoom.png')
PY
echo "   ✅ $OUT/pcb-full.png + pcb-mcu-zoom.png"

echo "── 原理图（逐页）"
./scripts/render-pages.sh >/dev/null 2>&1
for p in power mcu uart i2c spi can pwm adc led; do
  [ -f "/tmp/page-$p.png" ] && cp "/tmp/page-$p.png" "$OUT/sch-$p.png"
done
echo "   ✅ 九页"

echo "── 原理图（九页总图，竖直堆叠）"
./tsci-run export circuits/stm32f302/main.tsx -f schematic-svg -o ../../out/stm32f302/main.sch.svg >/dev/null 2>&1
bun scripts/svg2png.ts out/stm32f302/main.sch.svg "$OUT/sch-all-pages.png" 1000 >/dev/null 2>&1
echo "   ✅ $OUT/sch-all-pages.png"

echo
echo "全部图片："
ls -la "$OUT" | awk 'NR>3{printf "   %8.0f KB  %s\n", $5/1024, $9}'
