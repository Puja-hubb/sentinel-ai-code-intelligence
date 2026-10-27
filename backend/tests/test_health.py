from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint_returns_ok() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "sentinel-ai-api",
        "version": "0.2.0",
    }


def test_root_endpoint_links_to_docs() -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["docs"] == "/docs"


def test_scan_detects_dangerous_python_patterns() -> None:
    response = client.post(
        "/api/scan",
        json={
            "filename": "test.py",
            "code": (
                "import os\n"
                "password = 'mysecret123'\n"
                "eval('2 + 2')\n"
                "os.system('echo hello')\n"
            ),
        },
    )

    assert response.status_code == 200
    result = response.json()
    assert result["filename"] == "test.py"
    assert result["language"] == "python"
    assert result["findings_count"] == 3

    rule_ids = {finding["rule_id"] for finding in result["findings"]}
    assert rule_ids == {"PY001", "PY003", "PY005"}


def test_scan_rejects_non_python_files() -> None:
    response = client.post(
        "/api/scan",
        json={"filename": "test.js", "code": "console.log('hello')"},
    )
    assert response.status_code == 400


def test_scan_rejects_invalid_python_syntax() -> None:
    response = client.post(
        "/api/scan",
        json={"filename": "test.py", "code": "def broken(:\n    pass"},
    )
    assert response.status_code == 422



def test_scan_detects_unsafe_yaml_load() -> None:
    response = client.post(
        "/api/scan",
        json={
            "filename": "test.py",
            "code": (
                "import yaml\n"
                "data = yaml.load(user_input)\n"
            ),
        },
    )

    assert response.status_code == 200
    result = response.json()
    assert any(
        finding["rule_id"] == "PY006"
        for finding in result["findings"]
    )
def test_scan_does_not_flag_yaml_safe_load() -> None:
    response = client.post(
        "/api/scan",
        json={
            "filename": "safe_example.py",
            "code": (
                "import yaml\n"
                "data = yaml.safe_load(user_input)\n"
            ),
        },
    )

    assert response.status_code == 200
    assert not any(
        finding["rule_id"] == "PY006"
        for finding in response.json()["findings"]
    )


def test_scan_ignores_obvious_secret_placeholders() -> None:
    response = client.post(
        "/api/scan",
        json={
            "filename": "config.py",
            "code": (
                "password = 'your_password_here'\n"
                "api_token = 'replace_me'\n"
            ),
        },
    )

    assert response.status_code == 200
    assert not any(
        finding["rule_id"] == "PY005"
        for finding in response.json()["findings"]
    )


def test_scan_still_detects_possible_real_secrets() -> None:
    response = client.post(
        "/api/scan",
        json={
            "filename": "config.py",
            "code": (
                "password = 'mysecret123'\n"
                "api_token = 'sk_live_example_12345'\n"
            ),
        },
    )

    assert response.status_code == 200
    findings = [
        finding
        for finding in response.json()["findings"]
        if finding["rule_id"] == "PY005"
    ]
    assert len(findings) == 2


def test_scan_history_lists_saved_scans() -> None:
    scan_response = client.post(
        "/api/scan",
        json={
            "filename": "history_test.py",
            "code": "eval('2 + 2')\n",
        },
    )
    assert scan_response.status_code == 200

    response = client.get("/api/scans")
    assert response.status_code == 200

    scans = response.json()["scans"]
    assert any(
        scan["filename"] == "history_test.py"
        for scan in scans
    )


def test_scan_history_detail_returns_saved_findings() -> None:
    scan_response = client.post(
        "/api/scan",
        json={
            "filename": "detail_test.py",
            "code": "eval('2 + 2')\n",
        },
    )
    assert scan_response.status_code == 200

    history_response = client.get("/api/scans")
    saved_scan = next(
        scan
        for scan in history_response.json()["scans"]
        if scan["filename"] == "detail_test.py"
    )

    response = client.get(f"/api/scans/{saved_scan['id']}")
    assert response.status_code == 200

    result = response.json()
    assert result["filename"] == "detail_test.py"
    assert result["findings_count"] >= 1
    assert any(
        finding["rule_id"] == "PY001"
        for finding in result["findings"]
    )


def test_scan_history_returns_404_for_missing_scan() -> None:
    response = client.get("/api/scans/999999999")
    assert response.status_code == 404
