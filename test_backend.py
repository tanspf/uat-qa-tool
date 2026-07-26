import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000"

def test_generate():
    print("--- 1. Testing /generate-test-cases ---")
    with open("sample_prd/PRD_FoodDelivery_VN.pdf", "rb") as f:
        files = {"file": ("PRD_FoodDelivery_VN.pdf", f, "application/pdf")}
        res = requests.post(f"{BASE_URL}/generate-test-cases", files=files)
        print("Status code:", res.status_code)
        data = res.json()
        print(f"Generated {len(data.get('test_cases', []))} test cases:")
        for tc in data.get('test_cases', []):
            print(f"  - [{tc['test_case_no']}] ({tc['section']}): {tc['expected_result']}")
        return data

def test_judge_missing_evidence():
    print("\n--- 2. Testing /judge-test-result (Missing evidence -> BLOCKED) ---")
    payload = {
        "expected_result": "Hóa đơn hiển thị giảm 0đ phí ship",
        "required_evidence_type": ["screenshot", "api_response"],
        "evidence_type_submitted": ["screenshot"],  # Missing api_response!
        "actual_result": "Đã thấy giảm 0đ",
        "evidence_urls": ["/uploads/img1.png"]
    }
    res = requests.post(f"{BASE_URL}/judge-test-result", json=payload)
    print("Status code:", res.status_code)
    print("Response verdict:", res.json()["verdict"])
    print("Verdict reason:", res.json()["verdict_reason"])

def test_judge_complete_evidence():
    print("\n--- 3. Testing /judge-test-result (Complete evidence -> PASS) ---")
    payload = {
        "expected_result": "Hệ thống tạo đơn hàng thành công, chuyển tới màn hình Tracking",
        "required_evidence_type": ["screenshot", "api_response"],
        "evidence_type_submitted": ["screenshot", "api_response"],
        "actual_result": "Đơn hàng tạo thành công và chuyển tới tracking screen",
        "evidence_urls": ["/uploads/img1.png", "/uploads/api.json"]
    }
    res = requests.post(f"{BASE_URL}/judge-test-result", json=payload)
    print("Status code:", res.status_code)
    print("Response verdict:", res.json()["verdict"])
    print("Verdict reason:", res.json()["verdict_reason"])

if __name__ == "__main__":
    test_generate()
    test_judge_missing_evidence()
    test_judge_complete_evidence()
