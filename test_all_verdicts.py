import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

FASTAPI_URL = "http://localhost:8000"

def test_verdict_fail():
    print("==================================================")
    print("1. VERIFYING VERDICT: FAIL")
    print("==================================================")
    payload = {
        "expected_result": "Hóa đơn hiển thị giảm 0đ phí vận chuyển khi áp mã FREESHIP_VN",
        "required_evidence_type": ["screenshot"],
        "evidence_type_submitted": ["screenshot"],
        "actual_result": "Phí giao hàng vẫn tính 35.000đ, mã giảm giá FREESHIP_VN báo lỗi 'Hết lượt sử dụng'",
        "evidence_urls": ["/uploads/invoice_error_35k.png"]
    }
    res = requests.post(f"{FASTAPI_URL}/judge-test-result", json=payload)
    print(f"Status Code: {res.status_code}")
    print("JSON Output:")
    print(json.dumps(res.json(), indent=2, ensure_ascii=False))
    return res.json()

def test_verdict_pending_review():
    print("\n==================================================")
    print("2. VERIFYING VERDICT: PENDING_REVIEW")
    print("==================================================")
    payload = {
        "expected_result": "Bản đồ hiển thị vị trí tài xế di chuyển thời gian thực mỗi 5 giây",
        "required_evidence_type": ["screen_recording"],
        "evidence_type_submitted": ["screen_recording"],
        "actual_result": "Ảnh chụp bị nhòe mờ, video cắt ngắn chỉ 1 giây không thể quan sát chuyển động của tài xế trên bản đồ",
        "evidence_urls": ["/uploads/blur_video_frame.mp4"]
    }
    res = requests.post(f"{FASTAPI_URL}/judge-test-result", json=payload)
    print(f"Status Code: {res.status_code}")
    print("JSON Output:")
    print(json.dumps(res.json(), indent=2, ensure_ascii=False))
    return res.json()

def test_verdict_pass():
    print("\n==================================================")
    print("3. VERIFYING VERDICT: PASS")
    print("==================================================")
    payload = {
        "expected_result": "Đơn hàng tạo thành công với trạng thái PENDING_MERCHANT",
        "required_evidence_type": ["screenshot"],
        "evidence_type_submitted": ["screenshot"],
        "actual_result": "Đơn hàng #VN883921 đã được tạo thành công, giao diện hiển thị PENDING_MERCHANT khớp 100% PRD",
        "evidence_urls": ["/uploads/order_success.png"]
    }
    res = requests.post(f"{FASTAPI_URL}/judge-test-result", json=payload)
    print(f"Status Code: {res.status_code}")
    print("JSON Output:")
    print(json.dumps(res.json(), indent=2, ensure_ascii=False))
    return res.json()

def test_verdict_blocked():
    print("\n==================================================")
    print("4. VERIFYING VERDICT: BLOCKED (Missing Evidence - 0$ LLM Cost)")
    print("==================================================")
    payload = {
        "expected_result": "Đã ghi log sự kiện order_created và nhận response 200 OK",
        "required_evidence_type": ["screenshot", "api_response", "log"],
        "evidence_type_submitted": ["screenshot"],  # Missing api_response & log!
        "actual_result": "Chỉ đính kèm ảnh màn hình UI, quên copy log",
        "evidence_urls": ["/uploads/ui_only.png"]
    }
    res = requests.post(f"{FASTAPI_URL}/judge-test-result", json=payload)
    print(f"Status Code: {res.status_code}")
    print("JSON Output:")
    print(json.dumps(res.json(), indent=2, ensure_ascii=False))
    return res.json()

if __name__ == "__main__":
    test_verdict_fail()
    test_verdict_pending_review()
    test_verdict_pass()
    test_verdict_blocked()
