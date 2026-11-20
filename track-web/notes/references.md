# Tài Liệu Tham Khảo & Phân Tích Hình Ảnh (Track Web)

## Nguồn đã đọc & tra cứu
1. **Octopath Traveler (Square Enix / Acquire — Unreal Engine 4 HD-2D):**
   - Nguồn: Unreal Engine developer showcase & GDC/CEDEC post-mortem summaries.
   - Đặc điểm rút ra:
     - Sprite pixel 2D đặt làm billboard/mặt phẳng trong không gian 3D thật có chiều sâu.
     - Tilt-shift Depth of Field (DOF) mạnh làm nhoè tiền cảnh & hậu cảnh, tạo cảm giác mô hình diorama thu nhỏ.
     - Bloom có ngưỡng chọn lọc cao để đèn lồng, cửa sổ và hiệu ứng phép thuật bừng sáng ấm áp trên nền tối lạnh.
     - Ánh sáng điểm (point light) ấm tương tác với bóng đổ thời gian thực và normal map của sprite.
2. **The Last Night (Odd Tales — Steam App 612400):**
   - Nguồn: Steam store page & technical breakdown articles.
   - Đặc điểm rút ra:
     - Tương phản mạnh giữa bóng tối lạnh (indigo/slate) và nguồn sáng ấm/neon.
     - Ánh sáng thể tích (god rays) xuyên qua sương mù.
     - Mặt đường ướt phản chiếu ánh sáng đèn theo thời gian thực kết hợp normal map đá lát.
3. **LONG GONE (Hillfort Games — Steam App 1977610):**
   - Nguồn: Steam store page & developer devlogs.
   - Đặc điểm rút ra:
     - Bố cục diorama 2.5D giàu chi tiết ngoại cảnh (cây cối, hàng rào, vật dụng đời thường) tạo cảm giác có câu chuyện.
     - Mật độ pixel đồng nhất giữa nhân vật, nhà cửa và mặt đất.
4. **Dự án Bilibili HD-2D (BV1dhn36VEF8):**
   - Trạng thái: Không truy cập trực tiếp được nội dung video Bilibili; đã tra cứu kỹ thuật tương đương ("3D pixel art lighting / custom normal-mapped billboard shaders").
   - Kỹ thuật áp dụng: Shader sprite tuỳ biến nhận đồng thời DirectionalLight + nhiều PointLight thông qua normal map sinh từ heightmap, kết hợp rim light và emissive mask.
5. **Thị trấn chữa lành nhiều mùa (nguồn cảm hứng gốc):**
   - Đặc điểm rút ra: Khung hình ngang 16:9, bảng màu ấm/chữa lành (87 màu hue-shifted), chuyển đổi được thời điểm (`dawn`/`day`/`dusk`/`night`) và thời tiết (`clear`/`rain`/`leaves`).
