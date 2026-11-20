# Tài Liệu Tham Khảo & Phân Tích Hình Ảnh (Track Godot)

## Nguồn đã đọc & tra cứu
1. **Octopath Traveler (Square Enix / Acquire — HD-2D):**
   - Áp dụng trong Godot Forward+: `Camera3D` FOV hẹp `28°`, `WorldEnvironment` ACES Filmic + Glow ngưỡng cao (`0.85`), `VolumetricFog` + tia sáng cộng dồn, và shader tilt-shift bokeh giữ nét vùng nhân vật.
2. **The Last Night (Odd Tales — Steam App 612400):**
   - Tương phản màu lạnh (indigo) / ấm (vàng hổ phách), ánh sáng điểm `OmniLight3D` chiếu lên `Sprite3D`/`QuadMesh` có `NORMAL_MAP`, mặt nước phản chiếu & gợn sóng pixel-quantized.
3. **LONG GONE (Hillfort Games — Steam App 1977610):**
   - Mật độ pixel đồng nhất `16 px = 1.0 unit`, bố cục 3 lớp (tiền cảnh nhoè, trung cảnh rõ nét, hậu cảnh sương chiều sâu).
4. **Dự án Bilibili HD-2D (BV1dhn36VEF8):**
   - Không truy cập trực tiếp được video; sử dụng kỹ thuật tương đương qua custom spatial shader `hd2d_sprite.gdshader` (`filter_nearest`, Y-billboard, wind vertex sway, normal map, emissive mask, rim light).
