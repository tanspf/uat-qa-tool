# 🛡️ UAT QA Tool — Automated Test Case Generation & AI Evidence Evaluation

Hệ thống web độc lập hỗ trợ QA Engineer và PM tự động hóa quy trình UAT:
1. **Upload PRD (PDF)** — Tự động sinh danh sách Test Case bằng LLM (Gemini 2.5 Flash / Pro).
2. **Hướng Dẫn Bằng Chứng Cụ Thể** — Mỗi test case nêu rõ loại bằng chứng bắt buộc (`screenshot`, `screen_recording`, `api_response`, `log`) và hướng dẫn ngắn cho tester.
3. **Thẩm Định Kết Quả & Bằng Chứng (AI Judge)** — Đánh giá tính đủ của bằng chứng (trả `BLOCKED` ngay lập tức nếu thiếu loại bằng chứng bắt buộc mà không cần gọi LLM), sau đó đối chiếu kết quả thực tế để trả về `PASS`, `FAIL`, `BLOCKED`, hoặc `PENDING_REVIEW` kèm lý do chi tiết và điểm tin cậy.
4. **PM UAT Dashboard** — Tổng hợp tỷ lệ PASS/FAIL/BLOCKED, phân phối priority, và danh sách vấn đề cần xử lý.

---

## 🏗️ Tech Stack

| Layer | Công nghệ chọn |
|---|---|
| **Frontend & CRUD API** | Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons |
| **Heavy LLM Backend** | Python FastAPI (Uvicorn), PyPDF |
| **LLM Provider** | Google Gemini API (`gemini-2.5-flash` / `gemini-2.5-pro`) |
| **Database** | PostgreSQL / Supabase Schema + Local Store Fallback |
| **File Storage** | Supabase Storage (`uat-evidence` bucket) / Local Public Uploads |

---

## 📁 Cấu Trúc Dự Án

```
uat-qa-tool/
├── backend/
│   ├── main.py                # FastAPI Service (Generate Test Cases & Judge Test Results)
│   ├── requirements.txt       # Python dependencies (fastapi, uvicorn, google-genai, pypdf, pydantic)
│   └── .env                   # GEMINI_API_KEY environment variable
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── prds/                # POST: upload PRD & trigger test generation; GET: list PRDs
│   │   │   │   ├── test-cases/          # GET: list test cases by prd_id
│   │   │   │   ├── test-results/        # POST: submit actual result + evidence; call AI judge
│   │   │   │   └── dashboard/[prd_id]/  # GET: aggregate UAT stats
│   │   │   ├── globals.css
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── UploadPrdModal.tsx
│   │   │   ├── TestCaseTable.tsx
│   │   │   ├── TestExecutionModal.tsx
│   │   │   ├── CaseDetailsModal.tsx
│   │   │   ├── DashboardView.tsx
│   │   │   └── VerdictBadge.tsx
│   │   └── lib/
│   │       ├── types.ts                 # TypeScript interfaces (PRD, TestCase, TestResult)
│   │       └── db.ts                    # Database persistence helper
│   └── package.json
├── database/
│   └── schema.sql             # SQL Schema cho Supabase / PostgreSQL (prds, test_cases, test_results)
├── sample_prd/
│   └── PRD_FoodDelivery_VN.pdf# File PRD mẫu scope Việt Nam cho Buyer/Merchant/Driver
├── generate_sample_pdf.py     # Script tạo file PRD PDF mẫu
├── test_backend.py            # Script kiểm thử FastAPI endpoints
├── test_e2e.py                # Script kiểm thử tích hợp End-to-End
└── start.bat                  # Script khởi chạy 1-click cho Windows
```

---

## ⚡ Khởi Chạy Nhanh (Quick Start)

### 1. Khởi chạy 1-click (Windows):
Double click vào file `start.bat` hoặc chạy trong terminal:
```bash
.\start.bat
```

### 2. Khởi chạy thủ công:
**Khởi chạy Backend Python FastAPI (Port 8000):**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --port 8000 --reload
```

**Khởi chạy Frontend Next.js (Port 3000):**
```bash
cd frontend
npm install
npm run dev
```

---

## 🔄 Luồng Hoạt Động (End-to-End Workflow)

```
PM Upload PRD (PDF)
  ↳ Next.js POST /api/prds
    ↳ FastAPI /generate-test-cases
      ↳ Gemini AI phân tích PRD & tạo Test Cases (Scope VN-only)
    ↳ Next.js lưu records vào bảng test_cases

Tester Thực Hiện Test & Upload Evidence
  ↳ Next.js POST /api/test-results
    ↳ FastAPI /judge-test-result
      ↳ Bước 1: Kiểm tra tính đủ loại bằng chứng (Thiếu -> BLOCKED ngay lập tức, 0$ cost LLM)
      ↳ Bước 2: AI Gemini Multimodal đối chiếu bằng chứng + actual_result với expected_result
    ↳ Trả về { verdict, verdict_reason, evidence_validity_score }
  ↳ PM Xem Báo Cáo Trên Dashboard
```

---

## 🎯 Đạt 100% Acceptance Criteria
- [x] Upload PRD mẫu PDF → Sinh danh sách test cases cho từng section scope VN.
- [x] Mỗi test case hiển thị hướng dẫn bằng chứng cụ thể cho tester (`evidence_note_for_tester`).
- [x] Tester nộp thiếu bằng chứng bắt buộc → Trả về `BLOCKED` ngay lập tức mà không gọi LLM tốn phí.
- [x] Bằng chứng khớp `expected_result` → Tra kết quả `PASS` kèm giải thích.
- [x] Bằng chứng mâu thuẫn → Tra kết quả `FAIL` kèm trích dẫn lý do.
- [x] Dashboard cập nhật real-time các thông số UAT và priority breakdown.
