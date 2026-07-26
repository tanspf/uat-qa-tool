import os
import json
import base64
import re
from typing import List, Optional, Union
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pypdf
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="UAT QA Tool Heavy Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY", GEMINI_API_KEY)
    if not api_key:
        return None
    return genai.Client(api_key=api_key)

# Data Schemas
class TestCaseItem(BaseModel):
    test_case_no: str
    section: Optional[str] = "General"
    precondition: Optional[str] = ""
    steps: str
    expected_result: str
    required_evidence_type: List[str]
    priority: str = Field(default="medium", description="critical|high|medium|low")
    evidence_note_for_tester: str
    needs_clarification: bool = False
    clarification_reason: Optional[str] = None

class GenerateTestCasesResponse(BaseModel):
    test_cases: List[TestCaseItem]

class JudgeRequest(BaseModel):
    expected_result: str
    required_evidence_type: List[str]
    evidence_type_submitted: List[str]
    actual_result: Optional[str] = ""
    evidence_urls: Optional[List[str]] = []
    evidence_files_base64: Optional[List[dict]] = []  # [{ "mime_type": "image/png", "data": "base64..." }]

class JudgeResponse(BaseModel):
    verdict: str  # pass | fail | blocked | pending_review
    verdict_reason: str
    evidence_validity_score: float

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "gemini_configured": bool(get_gemini_client())
    }

def extract_text_from_pdf_stream(file_bytes: bytes) -> str:
    import io
    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    text_content = []
    for idx, page in enumerate(reader.pages):
        page_text = page.extract_text() or ""
        text_content.append(f"--- Page {idx+1} ---\n{page_text}")
    return "\n\n".join(text_content)

def clean_json_response(raw_text: str) -> str:
    cleaned = raw_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()

@app.post("/generate-test-cases", response_model=GenerateTestCasesResponse)
async def generate_test_cases(
    file: Optional[UploadFile] = File(None),
    prd_text: Optional[str] = Form(None)
):
    text_to_process = ""
    if file:
        content = await file.read()
        if file.filename.endswith(".pdf") or content[:4] == b"%PDF":
            text_to_process = extract_text_from_pdf_stream(content)
        else:
            text_to_process = content.decode("utf-8", errors="ignore")
    elif prd_text:
        text_to_process = prd_text

    if not text_to_process.strip():
        raise HTTPException(status_code=400, detail="Không có nội dung PRD để xử lý")

    prompt = f"""Role: QA Engineer sinh test case từ PRD cho food delivery app (Buyer/Merchant/Driver).

Đọc toàn bộ PRD được cung cấp bên dưới. Với mỗi requirement/user story, sinh 1 hoặc nhiều test case bao gồm cả happy path và edge case được PRD mô tả.

Với mỗi test case, xác định required_evidence_type (có thể chọn nhiều):
- "screenshot": kết quả là trạng thái tĩnh (UI hiển thị đúng, text đúng)
- "screen_recording": expected_result mô tả hành vi động/animation/luồng nhiều bước
- "api_response": expected_result liên quan tới dữ liệu backend không thấy qua UI
- "log": expected_result liên quan tới việc hệ thống có ghi log/event đúng hay không

Output JSON strictly formatted as:
{{
  "test_cases": [
    {{
      "test_case_no": "TC_001",
      "section": "Tên section/feature",
      "precondition": "Điều kiện tiên quyết",
      "steps": "Các bước thực hiện (1. ... 2. ...)",
      "expected_result": "Kết quả mong đợi",
      "required_evidence_type": ["screenshot"],
      "priority": "critical"|"high"|"medium"|"low",
      "evidence_note_for_tester": "Hướng dẫn ngắn, cụ thể cho tester về bằng chứng cần chụp/quay",
      "needs_clarification": false,
      "clarification_reason": null
    }}
  ]
}}

Constraint: Chỉ scope Vietnam (VN), bỏ qua section riêng cho ID/MY/TH/PH.
Không suy đoán ngoài PRD — thiếu thông tin thì đánh needs_clarification: true.

NỘI DUNG PRD:
{text_to_process}
"""

    client = get_gemini_client()
    if not client:
        # Fallback generator for development/testing when Gemini Key is not set
        return GenerateTestCasesResponse(test_cases=[
            TestCaseItem(
                test_case_no="TC_VN_001",
                section="Đặt Hàng (Buyer)",
                precondition="Buyer đã đăng nhập, ở màn hình giỏ hàng tại Việt Nam",
                steps="1. Chọn phương thức thanh toán MoMo/ZaloPay\n2. Nhấn 'Đặt hàng'",
                expected_result="Hệ thống tạo đơn hàng thành công, chuyển tới màn hình Tracking",
                required_evidence_type=["screenshot", "api_response"],
                priority="critical",
                evidence_note_for_tester="Chụp màn hình UI Order Success + đính kèm payload response API /orders/create",
                needs_clarification=False,
                clarification_reason=None
            ),
            TestCaseItem(
                test_case_no="TC_VN_002",
                section="Khuyến Mãi (Voucher)",
                precondition="Áp mã giảm giá FREESHIP_VN",
                steps="1. Nhập mã FREESHIP_VN\n2. Kiểm tra tổng tiền",
                expected_result="Phí giao hàng giảm về 0đ",
                required_evidence_type=["screenshot"],
                priority="high",
                evidence_note_for_tester="Chụp màn hình chi tiết dòng giảm giá phí vận chuyển 0đ trong hóa đơn",
                needs_clarification=False,
                clarification_reason=None
            )
        ])

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        cleaned = clean_json_response(response.text)
        data = json.loads(cleaned)
        if "test_cases" in data:
            return GenerateTestCasesResponse(test_cases=data["test_cases"])
        elif isinstance(data, list):
            return GenerateTestCasesResponse(test_cases=data)
        else:
            raise ValueError("Unexpected JSON format from Gemini")
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi sinh test case qua Gemini: {str(e)}")


@app.post("/judge-test-result", response_model=JudgeResponse)
async def judge_test_result(req: JudgeRequest):
    req_types_lower = [t.lower().strip() for t in req.required_evidence_type]
    sub_types_lower = [t.lower().strip() for t in req.evidence_type_submitted]

    # Step 1: Mandatory Evidence Types Check (Immediate BLOCKED)
    missing_types = [t for t in req_types_lower if t not in sub_types_lower]
    if missing_types:
        missing_str = ", ".join(missing_types)
        return JudgeResponse(
            verdict="blocked",
            verdict_reason=f"Thiếu loại bằng chứng bắt buộc: [{missing_str}]",
            evidence_validity_score=0.0
        )

    # Step 2: Gemini Prompt / Ambiguity Evaluation
    prompt = f"""Role: QA reviewer chấm kết quả test dựa trên bằng chứng tester cung cấp.

Input:
- expected_result: {req.expected_result}
- required_evidence_type: {req.required_evidence_type}
- evidence_type_submitted: {req.evidence_type_submitted}
- actual_result (mô tả của tester): {req.actual_result}
- evidence: [hình ảnh/bằng chứng được đính kèm bên dưới nếu có]

Bước 1 — Kiểm tra tính đủ của evidence:
(Đã kiểm tra thành công).

Bước 2 — Đối chiếu evidence thực tế và actual_result với expected_result:
- pass: evidence và kết quả thực tế khớp đúng expected_result
- fail: evidence cho thấy kết quả khác/sai so với expected_result — nêu rõ khác biệt cụ thể
- pending_review: evidence không đủ rõ ràng để kết luận chắc chắn (vd ảnh mờ/nhòe, video bị cắt ngắn mất đoạn quan trọng, thiếu thông tin xác minh) — không tự ý đoán pass/fail, phải trả pending_review

Output JSON strictly formatted as:
{{
  "verdict": "pass"|"fail"|"blocked"|"pending_review",
  "verdict_reason": "string — giải thích cụ thể, trích dẫn phần evidence hoặc mô tả liên quan",
  "evidence_validity_score": 0.95
}}

Constraint: Không suy đoán ngoài evidence được cung cấp. Nếu không chắc chắn, trả "pending_review", không tự chấm pass/fail.
"""

    client = get_gemini_client()
    if not client:
        # Offline intelligent simulation rule for testing
        act = (req.actual_result or "").lower()
        exp = req.expected_result.lower()

        # Check for ambiguity keywords -> pending_review
        ambiguity_keywords = ["mờ", "nhòe", "không rõ", "cắt ngắn", "cắt thiếu", "không thể quan sát", "bị nhòe", "không thể kết luận"]
        if any(k in act for k in ambiguity_keywords):
            return JudgeResponse(
                verdict="pending_review",
                verdict_reason="Bằng chứng đính kèm không đủ rõ ràng (ảnh bị nhòe/mờ hoặc video cắt ngắn thiếu góc quay). Cần PM/QA Lead review xác minh thủ công.",
                evidence_validity_score=0.45
            )

        # Check for fail keywords -> fail
        fail_keywords = ["báo lỗi", "không hợp lệ", "vẫn tính", "sai", "thất bại", "error", "failed", "không đạt"]
        if any(k in act for k in fail_keywords) or ("0đ" in exp and "35.000" in act):
            return JudgeResponse(
                verdict="fail",
                verdict_reason=f"Bằng chứng và thực tế cho thấy kết quả '{req.actual_result}' không khớp với Expected Result '{req.expected_result}'.",
                evidence_validity_score=0.85
            )

        return JudgeResponse(
            verdict="pass",
            verdict_reason="Bằng chứng và kết quả thực tế khớp đúng với Expected Result trong PRD.",
            evidence_validity_score=0.95
        )

    try:
        contents: List[Union[str, types.Part]] = [prompt]

        if req.evidence_files_base64:
            for item in req.evidence_files_base64:
                mime_type = item.get("mime_type", "image/png")
                b64_data = item.get("data", "")
                if b64_data:
                    if "," in b64_data:
                        b64_data = b64_data.split(",")[1]
                    raw_bytes = base64.b64decode(b64_data)
                    contents.append(
                        types.Part.from_bytes(data=raw_bytes, mime_type=mime_type)
                    )

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        cleaned = clean_json_response(response.text)
        data = json.loads(cleaned)
        return JudgeResponse(
            verdict=data.get("verdict", "pending_review"),
            verdict_reason=data.get("verdict_reason", "Không có giải thích cụ thể"),
            evidence_validity_score=float(data.get("evidence_validity_score", 0.5))
        )
    except Exception as e:
        print(f"Error in judge_test_result: {e}")
        return JudgeResponse(
            verdict="pending_review",
            verdict_reason=f"Cần review thủ công do lỗi AI evaluation: {str(e)}",
            evidence_validity_score=0.5
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
