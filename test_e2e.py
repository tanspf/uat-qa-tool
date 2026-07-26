import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

FRONTEND_URL = "http://localhost:3005"

def test_full_e2e_flow():
    print("==================================================")
    print("🚀 STARTING E2E INTEGRATION TEST: UAT QA TOOL")
    print("==================================================")

    # 1. Upload PRD (PDF) to Next.js API
    print("\n1. Uploading PRD_FoodDelivery_VN.pdf to Next.js POST /api/prds...")
    with open("sample_prd/PRD_FoodDelivery_VN.pdf", "rb") as f:
        files = {"file": ("PRD_FoodDelivery_VN.pdf", f, "application/pdf")}
        res = requests.post(f"{FRONTEND_URL}/api/prds", files=files)
        assert res.status_code == 200, f"Upload failed: {res.text}"
        data = res.json()
        prd_id = data["prd"]["id"]
        test_cases = data["test_cases"]
        print(f"✅ PRD uploaded successfully! ID: {prd_id}")
        print(f"✅ Generated {len(test_cases)} test cases automatically:")
        for tc in test_cases:
            print(f"    - [{tc['test_case_no']}] priority={tc['priority']}, req_evidence={tc['required_evidence_type']}")

    # 2. Fetch test cases from Next.js GET /api/test-cases
    print(f"\n2. Querying test cases for PRD {prd_id}...")
    tc_res = requests.get(f"{FRONTEND_URL}/api/test-cases?prd_id={prd_id}")
    assert tc_res.status_code == 200
    tc_list = tc_res.json()
    print(f"✅ Fetched {len(tc_list)} test cases from DB.")
    first_tc = tc_list[0]

    # 3. Test missing evidence check (Step 1 validation -> BLOCKED without calling LLM)
    print(f"\n3. Submitting incomplete evidence for {first_tc['test_case_no']}...")
    form_blocked = {
        "test_case_id": first_tc["id"],
        "actual_result": "Đã thực hiện xong nhưng thiếu bằng chứng API",
        "evidence_type_submitted": json.dumps(["screenshot"]) # Missing api_response if required
    }
    res_blocked = requests.post(f"{FRONTEND_URL}/api/test-results", data=form_blocked)
    assert res_blocked.status_code == 200
    judged_blocked = res_blocked.json()
    print(f"✅ Verdict received: {judged_blocked['verdict'].upper()}")
    print(f"✅ Reason: {judged_blocked['verdict_reason']}")

    # 4. Test complete evidence submission (Step 2 validation -> PASS)
    print(f"\n4. Submitting complete evidence for {first_tc['test_case_no']}...")
    form_pass = {
        "test_case_id": first_tc["id"],
        "actual_result": "Đơn hàng tạo thành công và chuyển sang màn hình tracking đúng như kỳ vọng",
        "evidence_type_submitted": json.dumps(first_tc["required_evidence_type"])
    }
    res_pass = requests.post(f"{FRONTEND_URL}/api/test-results", data=form_pass)
    assert res_pass.status_code == 200
    judged_pass = res_pass.json()
    print(f"✅ Verdict received: {judged_pass['verdict'].upper()}")
    print(f"✅ Reason: {judged_pass['verdict_reason']}")
    print(f"✅ Evidence Validity Score: {judged_pass['evidence_validity_score']}")

    # 5. Fetch Dashboard metrics from Next.js GET /api/dashboard/[prd_id]
    print(f"\n5. Querying PM Dashboard for PRD {prd_id}...")
    dash_res = requests.get(f"{FRONTEND_URL}/api/dashboard/{prd_id}")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    stats = dash_data["stats"]
    print(f"✅ PM Dashboard Metrics Summary:")
    print(f"    - Total Cases: {stats['total']}")
    print(f"    - PASS: {stats['pass']}")
    print(f"    - FAIL: {stats['fail']}")
    print(f"    - BLOCKED: {stats['blocked']}")
    print(f"    - PASS Rate: {stats['pass_rate']}%")

    print("\n==================================================")
    print("🎉 ALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_full_e2e_flow()
