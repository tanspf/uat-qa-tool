@echo off
echo ==================================================
echo 🚀 STARTING UAT QA TOOL (FastAPI + Next.js)
echo ==================================================

echo 1. Starting Python FastAPI Heavy LLM Backend on http://localhost:8000 ...
start "FastAPI Backend" cmd /k "cd backend && python -m uvicorn main:app --port 8000 --reload"

echo 2. Starting Next.js App Router Frontend on http://localhost:3000 ...
start "Next.js Frontend" cmd /k "cd frontend && npx next dev -p 3000"

echo ==================================================
echo ✅ Both services are launching!
echo Backend API Docs: http://localhost:8000/docs
echo Frontend Web App: http://localhost:3000
echo ==================================================
