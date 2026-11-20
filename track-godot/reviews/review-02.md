# Review 02 – Track Godot (Godot 4.4.1 Forward+) – Duyệt Cuối

## Điểm Rubric (Thang 0–10 mỗi mục)
| Hạng mục | Điểm | Lý do cụ thể |
|---|---|---|
| Chất lượng pixel art | 8.5 | Pixel `NEAREST` lossless sắc nét, đồng nhất `16 px/unit` trên toàn cảnh (`G2-assets-sheet.png`). |
| Bảng màu & không khí | 8.5 | ACES Filmic + ánh sáng ấm/lạnh rõ ràng qua 4 thời điểm (`FINAL-day.png`, `FINAL-dusk.png`, `FINAL-night.png`, `G3-lit-dawn.png`). |
| Bố cục & chiều sâu | 8.0 | Camera `(0.5, 13.0, 25.5)` thấy trọn mái Inn, cây lớn, bầu trời hoàng hôn, tiền cảnh nhoè và hậu cảnh sương sâu. |
| Ánh sáng & bóng | 8.0 | `DirectionalLight3D` + 7 `OmniLight3D` tương tác `NORMAL_MAP` rõ nét (`FINAL-character-closeup.png`). |
| Thể tích & sương | 8.5 | Đã thay `godray.gdshader` falloff mềm mượt + `VolumetricFog` thật (`FINAL-ab-volumetric.png`). |
| Phản chiếu | 7.5 | Mặt nước kênh gợn sóng phản chiếu ánh đèn ấm và công trình qua `hint_screen_texture`. |
| Hậu kỳ HD-2D | 8.5 | Tilt-shift DOF 12-tap giữ nét nhân vật, nhoè tiền/hậu cảnh (`FINAL-ab-dof.png`), Glow ngưỡng `0.85` giữ song cửa sổ rõ nét. |
| Sống động | 8.0 | Đom đóm thu nhỏ hài hoà, lá rơi, mưa, bướm, chim bay, khói ống khói (`FINAL-motion-strip.png`). |
| Nhân vật chibi | 8.0 | Tỷ lệ 2 đầu đáng yêu, đèn lồng phát sáng tự nhiên. |
| Mức tiệm cận ví dụ mẫu | 8.0 | Đạt chất diorama HD-2D rõ rệt; chỉ còn 1 đường mảnh ở đường chân trời sky dome do `ProceduralSkyMaterial` ở góc rất hẹp. |
| Độ vững kỹ thuật | 8.5 | Chạy Vulkan Forward+ trên RX 6600 XT ổn định, chụp 1920×1080 tự động 0 lỗi `blit_rect`. |

**Tổng điểm quy đổi:** **81.8 / 100** (Đạt mục tiêu ≥ 75, không có hạng mục nào dưới 5).

## Kết luận: ĐẠT NGHIỆM THU VÒNG 1
