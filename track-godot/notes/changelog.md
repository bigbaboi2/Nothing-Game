# Changelog – Track Godot

## v1.2 (Forest Village exploration pass)
- Chuyển bố cục sang quảng trường làng rừng với lối đất dẫn vào trung tâm, hai nhà, lều/lửa trại và hồ nhỏ; ngày xuân là trạng thái mở đầu.
- Mở rộng mặt đất để tránh thấy mép nền ở góc camera mới; lùi camera mặc định và nới FOV, giảm mật độ cỏ tiền cảnh để khung làng thoáng hơn.
- Thêm biến thể tán cây phủ tuyết, lá rơi, chuyển động nhẹ cho cây, khói/lửa; cân lại ánh sáng, bloom và vật liệu nước.
- Giữ nhân vật sprite pixel, bổ sung nhịp bước theo hướng; ẩn HUD/bảng kỹ thuật lúc khởi động và mở lại bằng `Tab`.
- Chụp lại bộ ảnh 1920×1080 ở xuân ngày, đi bộ, camera orbit, thu chiều, đông ngày/chiều và đêm trong `shots/V3-*.png`.

## v1.3 (Painterly forest & shallow focus)
- Thay tán cây kiểu cầu pixel và cầu khối bằng sprite SVG vẽ tay nhiều lớp, màu lá sáng, có chiều sâu mảng sáng/tối; tăng số cây bao quanh làng.
- Tách thêm 7 cụm lá quanh mỗi thân cây và làm đường bao tán mượt hơn.
- Tích hợp bộ sinh tán SVG vào lệnh dựng lại tài nguyên.
- Thêm chất lượng rừng Low / Medium / High trong bảng `Tab`; mức thấp giảm số lớp cỏ, tắt bóng và sương thể tích để nhẹ hơn.
- Tăng độ phủ và biến thiên kích thước/màu cho cỏ, dời lều ra nền đất khô, chuyển ao thành hình méo tự nhiên và bờ đất bất quy tắc.
- Làm mềm nhịp lửa, đường bay tro và smoke; thêm DOF vùng nét giữa ảnh để làm mềm phần trên và rìa hai bên, giữ chủ thể rõ.
- Tạo lại bộ ảnh nghiệm thu 1920×1080 sau thay đổi.

## v1.0 (G0–G6 Initial Build)
- Tạo 25 pixel sprite + normal/emissive map trong `assets/sprites/` bằng `tools/gen_assets.mjs`.
- Dựng cảnh Forward+ Vulkan trên Godot 4.4.1 với `hd2d_sprite.gdshader` (`filter_nearest`, Y-billboard, wind sway, normal map, rim light), `water_hd2d.gdshader`, `tiltshift_grade.gdshader`, `WorldEnvironment` (ACES, Glow, VolumetricFog), 7 `OmniLight3D` + hạt thời tiết/sinh vật.

## v1.1 (Sửa theo Review-01)
- **Tia sáng Volumetric mềm:** Thêm `shaders/godray.gdshader` với falloff `sin(UV.x * PI)^1.8` và fade đầu/cuối thay thế `StandardMaterial3D` cạnh cứng.
- **Mở rộng khung hình camera:** Lùi camera về `(0.5, 13.0, 25.5)` nhìn `(0.5, 2.5, -1.5)`.
- **Làm sáng nhân vật chibi & thu nhỏ đom đóm:** Tắt `cast_shadow` trên `chibi_hero`, đặt `NORMAL_MAP_DEPTH = 0.75`, giảm bán kính đom đóm còn `0.04`.
