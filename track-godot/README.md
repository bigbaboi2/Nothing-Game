# Forest Village Explorer — Track B (Godot 4.4.1 Forward+)

Track B là demo khám phá làng rừng với môi trường 3D stylized, nhân vật pixel HD-2D và chu kỳ ngày/đêm, mùa, thời tiết.

## Chạy nhanh (1 lệnh)
```powershell
..\tools\godot\Godot_v4.4.1-stable_win64_console.exe --path .
```

## Mở bằng Godot Editor
```powershell
..\tools\godot\Godot_v4.4.1-stable_win64.exe --path . -e
```

## Chụp toàn bộ bộ ảnh nghiệm thu 1920×1080 (1 lệnh)
```powershell
..\tools\godot\Godot_v4.4.1-stable_win64_console.exe --path . -- --shots
```

## Tái tạo tài nguyên pixel
```powershell
node tools/gen_assets.mjs
```
Lệnh này cũng tái tạo các lớp SVG tán rừng vẽ tay; có thể tạo riêng bằng `node tools/gen_forest_canopies.mjs`.

## Phím tắt tương tác
- `W` / `A` / `S` / `D`: Di chuyển; giữ `Shift` để chạy
- Giữ chuột phải và kéo hoặc nhấn `Q` / `E`: Xoay camera
- Con lăn chuột: Phóng to / thu nhỏ
- `Tab`: Mở / ẩn bảng điều khiển môi trường
- `1` / `2` / `3` / `4`: `dawn` / `day` / `dusk` / `night`
- `F1` / `F2` / `F3` / `F4`: xuân / hạ / thu / đông
- `Z` / `X`: `clear` / `leaves`
- Bảng `Tab`: chọn mùa, thời điểm, chất lượng rừng (Low / Medium / High), DOF và phản chiếu nước
