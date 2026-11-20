# Review 01 – Track Godot (Godot 4.4.1 Forward+) – Vòng Duyệt Giữa Kỳ

## Điểm Rubric (Thang 0–10 mỗi mục)
| Hạng mục | Điểm | Lý do cụ thể |
|---|---|---|
| Chất lượng pixel art | 8.5 | Pixel `NEAREST` sắc nét, đồng bộ mật độ `16 px/unit`. |
| Bảng màu & không khí | 8.0 | ACES + ánh sáng ấm từ `OmniLight3D` rất hài hoà. |
| Bố cục & chiều sâu | 6.0 | Camera `(0, 11.5, 22)` hơi gần, cắt đỉnh mái ngói, tán cây và phần lớn mặt nước kênh. |
| Ánh sáng & bóng | 7.0 | `OmniLight3D` + `NORMAL_MAP` hoạt động tốt; tuy nhiên nhân vật chibi bị bóng tự đổ (`cast_shadow = ON`) làm mặt hơi tối ở góc nhìn chính. |
| Thể tích & sương | 5.5 | `QuadMesh` god-ray dùng `StandardMaterial3D` phẳng nên thấy **viền cạnh chữ nhật sắc** cắt ngang màn hình (`FINAL-hero.png`). |
| Phản chiếu | 6.5 | Nước có gợn sóng, cần đưa vào khung nhìn rõ hơn. |
| Hậu kỳ HD-2D | 8.0 | Glow ngưỡng `0.85` giữ song cửa sổ rõ hơn Web, DOF tilt-shift hoạt động tốt. |
| Sống động | 7.0 | Đom đóm `SphereMesh` bán kính `0.07` hơi to so với pixel sprite; cần thu nhỏ còn `0.04`. |
| Nhân vật chibi | 7.5 | Dễ thương nhưng cần tắt `cast_shadow` trên hero (dùng contact shadow) và giảm `NORMAL_MAP_DEPTH` còn `0.75` để mặt sáng rõ. |
| Mức tiệm cận ví dụ mẫu | 7.0 | Khung cảnh đẹp nhưng viền god-ray cứng làm giảm độ tự nhiên. |
| Độ vững kỹ thuật | 8.0 | Chạy Forward+ Vulkan trên RX 6600 XT mượt, xuất PNG 1920×1080. |

**Tổng điểm quy đổi:** **71.8 / 100** (Chưa đạt ≥ 75 — BẮT BUỘC sửa các mục Cao).

## YÊU CẦU SỬA (Ưu tiên Cao → Thấp)
1. **[Cao] Thay shader mềm cho tia sáng Volumetric God-Rays:** Viết `shaders/godray.gdshader` có falloff `sin(UV.x * PI)^1.8` và fade đầu/cuối theo `UV.y` để loại bỏ hoàn toàn viền cạnh chữ nhật cứng.
2. **[Cao] Mở rộng khung hình camera & đưa mặt nước kênh vào vùng nhìn:** Lùi camera về `(0.5, 13.0, 25.5)` nhìn `(0.5, 2.5, -1.5)` để thấy trọn mái nhà Inn, cây lớn, bầu trời và mặt nước phản chiếu.
3. **[Trung bình] Làm sáng rõ mặt nhân vật chibi & thu nhỏ đom đóm:** Tắt `cast_shadow` trên `chibi_hero` (thêm contact shadow disc), đặt `NORMAL_MAP_DEPTH = 0.75`, và giảm bán kính đom đóm xuống `0.04`.

## Kết luận: Cần sửa tiếp (vòng 1 → vòng 2)
