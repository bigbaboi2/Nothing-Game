# Review 01 – Track Web (Three.js + WebGL2) – Vòng Duyệt Giữa Kỳ

## Điểm Rubric (Thang 0–10 mỗi mục)
| Hạng mục | Điểm | Lý do cụ thể |
|---|---|---|
| Chất lượng pixel art | 8.5 | Pixel sắc nét (NearestFilter), bảng màu 87 màu chuẩn `palette.json`, viền chọn lọc sạch (`FINAL-character-closeup.png`). |
| Bảng màu & không khí | 8.0 | Tương phản ấm/lạnh rõ nét ở `FINAL-hero.png` và `FINAL-rain-night.png`, cảm giác ấm cúng. |
| Bố cục & chiều sâu | 6.0 | 3 lớp có nhưng camera hơi gần: cắt mất đỉnh mái ngói Inn, đỉnh cây lớn và phần lớn mặt nước kênh ở góc phải dưới. |
| Ánh sáng & bóng | 7.0 | 7 đèn điểm + normal map hoạt động tốt (đặc biệt trên đường đá ướt), nhưng bờ tường kênh (`northBank`/`westBank`) dùng `MeshStandardMaterial` không có đèn Three.js nên bị đen đặc. |
| Thể tích & sương | 8.0 | Tia sáng god-ray, bụi/đom đóm và sương chiều sâu nhìn rõ ở `FINAL-hero.png` & `FINAL-day.png`. |
| Phản chiếu | 6.5 | Đá ướt phản chiếu đèn cực tốt ở `FINAL-rain-night.png`; nhưng mặt nước kênh nằm quá thấp dưới mép phải nên ít thấy phản chiếu nhà/đèn. |
| Hậu kỳ HD-2D | 7.0 | Tilt-shift DOF làm nhoè tiền cảnh/hậu cảnh tốt, giữ nhân vật nét; nhưng Bloom (`strength=0.65`, `threshold=0.78`, `emissiveScale=1.45`) làm cửa sổ cháy sáng trắng, mất nét song cửa. |
| Sống động | 7.5 | Bướm, đom đóm, gió, mưa đều có; cần chụp đủ `FINAL-motion-strip.png` để xác nhận. |
| Nhân vật chibi | 9.0 | Tỷ lệ 2 đầu đáng yêu, đèn lồng cầm tay chiếu sáng mặt/khăn/áo rất tự nhiên (`FINAL-character-closeup.png`). |
| Mức tiệm cận ví dụ mẫu | 7.5 | Rất gần chất Octopath/Last Night ở phần ánh sáng & nhân vật; cần mở khung hình để thấy trời, cây và nước như cảnh làng mẫu. |
| Độ vững kỹ thuật | 8.0 | Chạy headless SwiftShader 0 lỗi console, chụp chuẩn 1920×1080. |

**Tổng điểm quy đổi:** **75.5 / 100** (Cần sửa để vượt ngưỡng an toàn và khắc phục lỗi tường đen & cháy bloom).

## YÊU CẦU SỬA (Ưu tiên Cao → Thấp)
1. **[Cao] Sửa bờ tường kênh bị đen đặc:** Thay `northBank`/`westBank` khỏi `MeshStandardMaterial` sang `createGroundMaterial('ground_cobble', ...)` để nhận đúng directional + 7 point lights. Tiêu chí: không còn dải đen thuần ở mép đường/kênh trong `FINAL-hero.png` và `FINAL-day.png`.
2. **[Cao] Mở rộng khung hình camera & đưa mặt nước kênh vào vùng nhìn thấy rõ:** Lùi camera về `(0.5, 13.0, 25.5)` nhìn `(0.5, 2.5, -1.5)`, dịch kênh nước lên `z = 6.8` (bờ bắc `z = 3.6`, rộng `7.5` đơn vị) và chỉnh cầu/bến thuyền sao cho thấy rõ cả đỉnh mái ngói Inn, tán cây lớn, bầu trời hoàng hôn, và mặt nước phản chiếu.
3. **[Cao] Giảm cháy sáng Bloom ở cửa sổ:** Nâng `bloomPass.threshold` từ `0.78` lên `0.88`, giảm `strength` từ `0.65` xuống `0.42`, giảm `emissiveScale` dusk từ `1.45` xuống `1.05` để thấy rõ khung gỗ song cửa sổ Inn/Cottage.

## Kết luận: Cần sửa tiếp (vòng 1 → vòng 2)
