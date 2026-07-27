import requests
import json
import time

BASE_URL = "http://localhost:3000"

def test_full_auth_and_rbac_flow():
    print("==================================================")
    print("STARTING UAT QA TOOL AUTH & RBAC E2E VERIFICATION")
    print("==================================================")
    
    # 1. VERIFY UNAUTHENTICATED BLOCKING
    print("\n[TEST 1] Testing Unauthenticated Access Block...")
    res = requests.get(f"{BASE_URL}/api/prds")
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    print("[OK] PASSED: Unauthenticated access blocked with 401 Unauthorized.")

    # 2. LOGIN AS PM ADMIN
    print("\n[TEST 2] Logging in as PM Admin (pm@company.com)...")
    pm_session = requests.Session()
    res = pm_session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "pm@company.com",
        "password": "password123"
    })
    assert res.status_code == 200, f"PM Login failed: {res.text}"
    pm_user = res.json()["user"]
    print(f"[OK] PASSED: PM Logged in successfully: {pm_user['name']} ({pm_user['role']})")

    # 3. CREATE TASK 1 AS PM & ASSIGN TO TESTER 1
    print("\n[TEST 3] Creating Task 1 (Order Checkout Flow) as PM and assigning PIC to tester1@company.com...")
    res = pm_session.post(f"{BASE_URL}/api/prds", data={
        "prd_text": "PRD LUONG DAT HANG & THANH TOAN MOMO: Nguoi dung them mon an vao gio, chon thanh toan qua vi MoMo va xac nhan don hang thanh cong.",
        "assigned_pics": json.dumps(["tester1@company.com"])
    })
    assert res.status_code == 200, f"Failed to create Task 1: {res.text}"
    task1 = res.json()["prd"]
    print(f"[OK] PASSED: Created Task 1 ID: {task1['id']} | Assigned PICs: {task1['assigned_pics']}")

    # 4. CREATE TASK 2 AS PM & ASSIGN TO TESTER 2
    print("\n[TEST 4] Creating Task 2 (Payment Wallet Flow) as PM and assigning PIC to tester2@company.com...")
    res = pm_session.post(f"{BASE_URL}/api/prds", data={
        "prd_text": "PRD LUONG HOAN TIEN VI VNPAY: Nguoi dung huy don hang va he thong tu dong hoan tien vao vi VNPAY trong vong 30 giay.",
        "assigned_pics": json.dumps(["tester2@company.com"])
    })
    assert res.status_code == 200, f"Failed to create Task 2: {res.text}"
    task2 = res.json()["prd"]
    print(f"[OK] PASSED: Created Task 2 ID: {task2['id']} | Assigned PICs: {task2['assigned_pics']}")

    # 5. VERIFY PM SEES ALL TASKS
    print("\n[TEST 5] Verifying PM sees ALL Tasks...")
    res = pm_session.get(f"{BASE_URL}/api/prds")
    assert res.status_code == 200
    pm_prds = res.json()
    print(f"PM sees {len(pm_prds)} Tasks in total.")
    assert len(pm_prds) >= 2, "PM should see all created tasks"
    print("[OK] PASSED: PM sees all Tasks in PM Dashboard.")

    # 6. LOGIN AS TESTER 1 & VERIFY SCOPED ACCESS
    print("\n[TEST 6] Logging in as Tester 1 (tester1@company.com) & checking scoped access...")
    t1_session = requests.Session()
    res = t1_session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "tester1@company.com",
        "password": "password123"
    })
    assert res.status_code == 200
    t1_prds = t1_session.get(f"{BASE_URL}/api/prds").json()
    print(f"Tester 1 sees {len(t1_prds)} Task(s): {[p['file_name'] for p in t1_prds]}")
    t1_prd_ids = [p['id'] for p in t1_prds]
    assert task1['id'] in t1_prd_ids, "Task 1 should be visible to Tester 1"
    assert task2['id'] not in t1_prd_ids, "Task 2 MUST NOT be visible to Tester 1"
    print("[OK] PASSED: Tester 1 view is strictly scoped to assigned Task 1 only!")

    # 7. LOGIN AS TESTER 2 & VERIFY SCOPED ACCESS
    print("\n[TEST 7] Logging in as Tester 2 (tester2@company.com) & checking scoped access...")
    t2_session = requests.Session()
    res = t2_session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "tester2@company.com",
        "password": "password123"
    })
    assert res.status_code == 200
    t2_prds = t2_session.get(f"{BASE_URL}/api/prds").json()
    print(f"Tester 2 sees {len(t2_prds)} Task(s): {[p['file_name'] for p in t2_prds]}")
    t2_prd_ids = [p['id'] for p in t2_prds]
    assert task2['id'] in t2_prd_ids, "Task 2 should be visible to Tester 2"
    assert task1['id'] not in t2_prd_ids, "Task 1 MUST NOT be visible to Tester 1"
    print("[OK] PASSED: Tester 2 view is strictly scoped to assigned Task 2 only!")

    # 8. SUBMIT TEST RESULT AS TESTER 1 AND CHECK BACKEND AUDIT RECORD
    print("\n[TEST 8] Tester 1 submitting test result & verifying submitted_by + submitted_at backend record...")
    # Fetch test cases for Task 1
    t1_cases = t1_session.get(f"{BASE_URL}/api/test-cases?prd_id={task1['id']}").json()
    assert len(t1_cases) > 0, "Task 1 should have test cases"
    target_tc = t1_cases[0]
    print(f"Submitting result for Test Case {target_tc['test_case_no']}...")

    submit_res = t1_session.post(f"{BASE_URL}/api/test-results", data={
        "test_case_id": target_tc["id"],
        "actual_result": "Don hang da duoc tao thanh cong o trang thai Pending_Payment va nhan thong bao MoMo",
        "evidence_type_submitted": json.dumps(["screenshot"])
    })
    assert submit_res.status_code == 200, f"Submit test result failed: {submit_res.text}"
    submitted_record = submit_res.json()
    print(f"Submission Response: ID={submitted_record['id']} | submitted_by={submitted_record.get('submitted_by')} | submitted_at={submitted_record.get('submitted_at')}")

    # 9. QUERY BACKEND AUDIT LOGS TO PROVE RECORD PERSISTENCE
    print("\n[TEST 9] Querying Backend Audit Logs Endpoint (/api/admin/audit-logs)...")
    audit_res = pm_session.get(f"{BASE_URL}/api/admin/audit-logs")
    assert audit_res.status_code == 200
    audit_data = audit_res.json()
    logs = audit_data.get("logs", [])
    print(f"Total Audit Log Submissions Found in Backend: {len(logs)}")
    
    found = False
    for log in logs:
        if log.get("id") == submitted_record["id"]:
            found = True
            print("\n--------------------------------------------------")
            print("BACKEND AUDIT RECORD VERIFIED IN DATABASE:")
            print(f"  - Record ID: {log['id']}")
            print(f"  - Test Case No: {log.get('test_case_no')}")
            print(f"  - Submitter Identity (submitted_by): {log.get('submitted_by')}")
            print(f"  - Submitter Name (tester_name): {log.get('tester_name')}")
            print(f"  - Timestamp (submitted_at): {log.get('submitted_at')}")
            print(f"  - AI Verdict: {log.get('verdict')}")
            print("--------------------------------------------------")
            assert log.get("submitted_by") == "tester1@company.com", f"Expected tester1@company.com, got {log.get('submitted_by')}"
            assert log.get("submitted_at") is not None, "submitted_at must be populated"
            break

    assert found, "Submitted record must be present in backend audit logs!"
    print("[OK] PASSED: Backend record contains exact submitter identity (tester1@company.com) and timestamp!")

    print("\n==================================================")
    print("ALL 9 E2E AUTH & RBAC VERIFICATION TESTS PASSED CLEANLY!")
    print("==================================================")

if __name__ == "__main__":
    test_full_auth_and_rbac_flow()
