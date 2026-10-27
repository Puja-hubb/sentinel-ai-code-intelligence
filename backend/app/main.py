
import ast
import re
from pathlib import PurePosixPath
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.database import get_scan, initialize_database, list_scans, save_scan

app = FastAPI(
    title="SentinelAI API",
    description="Code intelligence and verification platform API.",
    version="0.2.0",
)

@app.on_event("startup")
def startup_event() -> None:
    initialize_database()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


class ScanRequest(BaseModel):
    filename: str = Field(default="sample.py", max_length=200)
    code: str = Field(min_length=1, max_length=100_000)


class Finding(BaseModel):
    rule_id: str
    severity: Literal["critical", "high", "medium", "low"]
    title: str
    message: str
    line: int
    recommendation: str


class ScanResponse(BaseModel):
    filename: str
    language: str
    findings: list[Finding]
    findings_count: int


@app.get("/", tags=["system"])
def root() -> dict[str, str]:
    return {"message": "SentinelAI API is running", "docs": "/docs"}


@app.get("/api/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="sentinel-ai-api", version="0.2.0")


@app.get("/api/scans", tags=["history"])
def scan_history(limit: int = 50) -> dict:
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="Limit must be between 1 and 100.")
    return {"scans": list_scans(limit=limit)}


@app.get("/api/scans/{scan_id}", tags=["history"])
def scan_history_detail(scan_id: int) -> dict:
    if scan_id < 1:
        raise HTTPException(status_code=400, detail="Scan ID must be positive.")
    scan = get_scan(scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found.")
    return scan

@app.post("/api/scan", response_model=ScanResponse, tags=["analysis"])
def scan_code(request: ScanRequest) -> ScanResponse:
    filename = PurePosixPath(request.filename.replace("\\", "/")).name
    if not filename or filename.startswith("."):
        raise HTTPException(status_code=400, detail="Provide a valid source filename.")

    if not filename.endswith(".py"):
        raise HTTPException(
            status_code=400,
            detail="The initial scanner supports Python (.py) files only.",
        )

    try:
        tree = ast.parse(request.code)
    except SyntaxError as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Python syntax error on line {exc.lineno or 1}: {exc.msg}",
        ) from exc

    findings: list[Finding] = []

    def add_finding(
        rule_id: str,
        severity: Literal["critical", "high", "medium", "low"],
        title: str,
        message: str,
        line: int,
        recommendation: str,
    ) -> None:
        findings.append(
            Finding(
                rule_id=rule_id,
                severity=severity,
                title=title,
                message=message,
                line=line,
                recommendation=recommendation,
            )
        )

    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in {"eval", "exec"}:
                add_finding(
                    "PY001", "high", f"Use of {node.func.id}()",
                    f"{node.func.id}() can execute dynamically supplied code.",
                    node.lineno,
                    "Avoid dynamic code execution; use explicit parsing or dispatch.",
                )

            if isinstance(node.func, ast.Name) and node.func.id == "__import__":
                add_finding(
                    "PY002", "medium", "Dynamic import",
                    "Dynamic imports can make behavior harder to review.",
                    node.lineno,
                    "Prefer explicit imports when possible and validate dynamic module names.",
                )

            if (
                isinstance(node.func, ast.Attribute)
                and node.func.attr == "load"
                and isinstance(node.func.value, ast.Name)
                and node.func.value.id == "yaml"
            ):
                has_safe_loader = any(
                    keyword.arg == "Loader"
                    and isinstance(keyword.value, ast.Attribute)
                    and isinstance(keyword.value.value, ast.Name)
                    and keyword.value.value.id == "yaml"
                    and keyword.value.attr in {"SafeLoader", "CSafeLoader"}
                    for keyword in node.keywords
                )
                if not has_safe_loader:
                    add_finding(
                        "PY006",
                        "high",
                        "Potentially unsafe YAML deserialization",
                        "yaml.load() without a safe loader may deserialize untrusted data unsafely.",
                        node.lineno,
                        "Use yaml.safe_load() or explicitly use yaml.SafeLoader for untrusted input.",
                    )
            if isinstance(node.func, ast.Attribute) and node.func.attr in {
                "system", "popen"
            }:
                if isinstance(node.func.value, ast.Name) and node.func.value.id == "os":
                    add_finding(
                        "PY003", "high", "Shell command execution",
                        "os.system() or os.popen() can be risky with untrusted input.",
                        node.lineno,
                        "Prefer subprocess APIs with argument lists and avoid shell=True.",
                    )

            if isinstance(node.func, ast.Attribute) and node.func.attr == "Popen":
                for keyword in node.keywords:
                    if (
                        keyword.arg == "shell"
                        and isinstance(keyword.value, ast.Constant)
                        and keyword.value.value is True
                    ):
                        add_finding(
                            "PY004", "high", "Subprocess uses shell=True",
                            "Shell interpretation can introduce command injection risks.",
                            node.lineno,
                            "Use shell=False and pass a list of arguments where possible.",
                        )

        if isinstance(node, ast.Assign):
            value = node.value
            if (
                isinstance(value, ast.Constant)
                and isinstance(value.value, str)
                and len(value.value) >= 8
                and value.value.strip().lower() not in {
                    "your_password_here",
                    "replace_me",
                    "changeme",
                    "change_me",
                    "your_api_key_here",
                    "your_secret_here",
                    "placeholder",
                    "example",
                    "password",
                    "secret",
                }
            ):
                for target in node.targets:
                    if isinstance(target, ast.Name) and re.search(
                        r"(password|passwd|secret|api_key|token)",
                        target.id,
                        re.IGNORECASE,
                    ):
                        add_finding(
                            "PY005", "medium", "Possible hardcoded secret",
                            f"Variable '{target.id}' contains a string that may be a secret.",
                            node.lineno,
                            "Load secrets from environment variables or a secrets manager.",
                        )

    save_scan(
        filename=filename,
        language="python",
        findings=[finding.model_dump() for finding in findings],
    )

    return ScanResponse(
        filename=filename,
        language="python",
        findings=findings,
        findings_count=len(findings),
    )
