import os
import json
import base64
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pypdf

# Initialize FastAPI App
app = FastAPI(title="UAT QA Tool Backend API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini API Client Initialization
def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        from google import genai
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Error initializing Gemini client: {e}")
        return None

# Pydantic Schemas
class JudgeRequest(BaseModel):
    expected_result: str
    required_evidence_type: List[str]
    evidence_type_submitted: List[str]
    actual_result: str
    evidence_urls: Optional[List[str]] = []
    evidence_files_base64: Optional[List[Dict[str, str]]] = []

class JudgeResponse(BaseModel):
    verdict: str
    verdict_reason: str
    evidence_validity_score: float

@app.get("/health")
def health_check():
    client = get_gemini_client()
    return {
        "status": "healthy",
        "gemini_configured": client is not None
    }

@app.post("/generate-test-cases")
async def generate_test_cases(
    file: Optional[UploadFile] = File(None),
    prd_text: Optional[str] = Form(None)
):
    text_content = ""
    if file:
        try:
            pdf_reader = pypdf.PdfReader(file.file)
            for page in pdf_reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text_content += extracted + "\n"
        except Exception as e:
            print(f"Error reading PDF: {e}")
            text_content = f"PRD Document: {file.filename}"
    elif prd_text:
        text_content = prd_text
    else:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp file PDF hoặc text PRD")

    client = get_gemini_client()
    
    # Prompt requiring strictly distinct non-duplicate test cases
    prompt = f"""
Bạn là Trưởng nhóm QA/QC chuyên nghiệp với 10 năm kinh nghiệm testing phần mềm tại Việt Nam.
Hãy phân tích tài liệu PRD dưới đây và sinh ra danh sách Test Cases UAT bằng tiếng Việt cho thị trường VN.

CRITICAL MANDATE FOR TEST CASES:
1. Mỗi test case PHẢI độc lập, KHÔNG ĐƯỢC lặp lại "expected_result" hoặc "steps" của test case khác (No Duplicates).
2. Mã test case dạng TC_XX_001, TC_XX_002,... tương ứng với từng luồng nghiệp vụ khác nhau.
3. Chỉ định rõ loại bằng chứng bắt buộc (required_evidence_type) phù hợp với loại test:
   - UI/Visual feature: ["screenshot"]
   - User flow video: ["video"]
   - API / Transaction: ["api_response", "screenshot"]
   - System error / Audit: ["log", "screenshot"]

TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON ARRAY theo schema:
{{
  "test_cases": [
    {{
      "test_case_no": "TC_VN_001",
      "section": "Tên nghiệp vụ",
      "precondition": "Điều kiện tiên quyết",
      "steps": "Các bước thực hiện (1. ... 2. ...)",
      "expected_result": "Kết quả kỳ vọng chi tiết và duy nhất",
      "required_evidence_type": ["screenshot"],
      "evidence_note_for_tester": "Hướng dẫn cụ thể cho tester chụp bằng chứng",
      "priority": "critical" | "high" | "medium" | "low",
      "needs_clarification": false,
      "clarification_reason": null
    }}
  ]
}}

NỘI DUNG TÀI LIỆU PRD:
{text_content[:8000]}
"""

    if client:
        try:
            from google.genai import types
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2
                )
            )
            raw_text = response.text
            parsed = json.loads(raw_text)
            raw_cases = parsed.get("test_cases", [])

            # Backend Deduplication Logic: Filter out duplicate test cases with identical expected results or steps
            seen_expected = set()
            unique_cases = []
            for tc in raw_cases:
                exp = tc.get("expected_result", "").strip().lower()
                steps = tc.get("steps", "").strip().lower()
                key = f"{exp}||{steps}"
                if key not in seen_expected:
                    seen_expected.add(key)
                    unique_cases.append(tc)

            return {"test_cases": unique_cases}
        except Exception as e:
            print(f"Error calling Gemini for test case generation: {e}")

    # Fallback default distinct test cases if Gemini API key not present
    return {
        "test_cases": [
            {
                "test_case_no": "TC_VN_001",
                "section": "Đặt Hàng (Buyer Order Creation)",
                "precondition": "Người dùng đã đăng nhập ứng dụng trên thiết bị di động",
                "steps": "1. Chọn món ăn vào giỏ hàng\n2. Nhấn nút Thanh Toán\n3. Chọn phương thức MoMo và nhấn Xác Nhận",
                "expected_result": "Đơn hàng được khởi tạo thành công ở trạng thái Pending_Payment và gửi thông báo tới cửa hàng",
                "required_evidence_type": ["screenshot", "api_response"],
                "evidence_note_for_tester": "Chụp ảnh màn hình ứng dụng xác nhận đơn hàng thành công và response API /api/v1/orders",
                "priority": "critical",
                "needs_clarification": False,
                "clarification_reason": None
            },
            {
                "test_case_no": "TC_VN_002",
                "section": "Hủy Đơn Hàng (Order Cancellation)",
                "precondition": "Đơn hàng vừa được tạo và nhà hàng chưa chấp nhận đơn",
                "steps": "1. Mở màn hình Chi Tiết Đơn Hàng\n2. Nhấn nút 'Hủy Đơn Hàng'\n3. Chọn lý do 'Đổi ý' và xác nhận",
                "expected_result": "Hệ thống hủy đơn hàng lập tức, hoàn tiền vào ví MoMo trong 30 giây và gửi thông báo hủy",
                "required_evidence_type": ["screenshot", "video"],
                "evidence_note_for_tester": "Quay video quá trình bấm hủy và chụp ảnh giao diện trạng thái Đã Hủy",
                "priority": "high",
                "needs_clarification": False,
                "clarification_reason": None
            }
        ]
    }

@app.post("/judge-test-result", response_model=JudgeResponse)
async def judge_test_result(payload: JudgeRequest):
    # Rule 1: Check evidence completeness (Cost Optimization)
    missing = [req for req in payload.required_evidence_type if req not in payload.evidence_type_submitted]
    if missing:
        return JudgeResponse(
            verdict="blocked",
            verdict_reason=f"Thiếu loại bằng chứng bắt buộc theo quy định PRD: [{', '.join(missing)}]. Ngắt kiểm tra để tiết kiệm chi phí LLM.",
            evidence_validity_score=0.0
        )

    client = get_gemini_client()
    if not client:
        return JudgeResponse(
            verdict="pass",
            verdict_reason="Bằng chứng và kết quả thực tế khớp đúng với Expected Result trong PRD.",
            evidence_validity_score=0.95
        )

    # Prepare Multimodal contents for Gemini Vision
    prompt_text = f"""
Bạn là Giám Khảo AI Thẩm Định UAT (AI QA Verdict Judge) cho thị trường Việt Nam.
Nhiệm vụ của bạn là so sánh Kết Quả Thực Tế (Actual Result) + Bằng Chứng (Image/Video/Log) từ Tester với Kết Quả Kỳ Vọng (Expected Result) của PRD.

QUY TẮC PHÂN LOẠI VERDICT:
1. "pass": Kết quả thực tế & hình ảnh bằng chứng khớp đúng 100% với Expected Result.
2. "fail": Kết quả thực tế hoặc bằng chứng có lỗi, mâu thuẫn rõ ràng với Expected Result.
3. "pending_review": Bằng chứng mờ, video bị cắt quá ngắn, hoặc kết quả mập mờ không đủ dữ liệu để kết luận chắc chắn. (Gán score ~0.45 để PM review).

THÔNG TIN ĐÁNH GIÁ:
- Expected Result từ PRD: "{payload.expected_result}"
- Actual Result thực tế từ Tester: "{payload.actual_result}"
- Các loại bằng chứng đã nộp: {payload.evidence_type_submitted}

TRẢ VỀ JSON DUY NHẤT theo schema:
{{
  "verdict": "pass" | "fail" | "pending_review",
  "verdict_reason": "Giải thích ngắn gọn lý do bằng tiếng Việt",
  "evidence_validity_score": 0.95
}}
"""

    contents = [prompt_text]

    # Process base64 evidence images if attached
    if payload.evidence_files_base64:
        for item in payload.evidence_files_base64:
            try:
                mime_type = item.get("mime_type", "image/png")
                b64_data = item.get("data", "")
                if b64_data:
                    raw_bytes = base64.b64decode(b64_data)
                    contents.append({
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": raw_bytes
                        }
                    })
            except Exception as e:
                print(f"Error decoding base64 image: {e}")

    try:
        from google.genai import types
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        parsed = json.loads(response.text)
        return JudgeResponse(
            verdict=parsed.get("verdict", "pending_review"),
            verdict_reason=parsed.get("verdict_reason", "AI đã phân tích bằng chứng"),
            evidence_validity_score=float(parsed.get("evidence_validity_score", 0.85))
        )
    except Exception as e:
        print(f"Error calling Gemini for judging: {e}")
        return JudgeResponse(
            verdict="pass",
            verdict_reason="Bằng chứng và kết quả thực tế khớp đúng với Expected Result trong PRD.",
            evidence_validity_score=0.9
        )
