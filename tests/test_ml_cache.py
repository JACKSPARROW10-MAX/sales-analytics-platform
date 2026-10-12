import json
import threading
import time

import api.main as main


def _point_cache_at(monkeypatch, tmp_path):
    monkeypatch.setattr(main, "PROJECT_ROOT", tmp_path)
    (tmp_path / "data").mkdir()
    return tmp_path / "data" / "ml_results.json"


def test_concurrent_cold_start_runs_the_pipeline_exactly_once(monkeypatch, tmp_path):
    """Regression: 5 parallel dashboard requests on a cold server used to run the
    ML pipeline 5 times at once (CPU/memory spike on small hosts)."""
    cache = _point_cache_at(monkeypatch, tmp_path)
    calls = {"n": 0}

    def slow_pipeline():
        calls["n"] += 1
        time.sleep(0.3)  # long enough for the other threads to arrive
        cache.write_text(json.dumps({"anomalies": [1, 2], "status": "ok"}), encoding="utf-8")
        return {"anomalies": [1, 2], "status": "ok"}

    monkeypatch.setattr(main, "run_ml_pipeline", slow_pipeline)

    results, threads = [], []
    for _ in range(6):
        t = threading.Thread(target=lambda: results.append(main.get_cached_ml_data()))
        threads.append(t)
        t.start()
    for t in threads:
        t.join(timeout=10)

    assert calls["n"] == 1
    assert len(results) == 6 and all(r["status"] == "ok" for r in results)


def test_existing_cache_is_served_without_running_the_pipeline(monkeypatch, tmp_path):
    cache = _point_cache_at(monkeypatch, tmp_path)
    cache.write_text(json.dumps({"status": "cached"}), encoding="utf-8")

    def must_not_run():
        raise AssertionError("pipeline should not run when the cache exists")

    monkeypatch.setattr(main, "run_ml_pipeline", must_not_run)
    assert main.get_cached_ml_data() == {"status": "cached"}


def test_corrupt_cache_file_is_rebuilt(monkeypatch, tmp_path):
    cache = _point_cache_at(monkeypatch, tmp_path)
    cache.write_text("{not json", encoding="utf-8")
    monkeypatch.setattr(main, "run_ml_pipeline", lambda: {"status": "rebuilt"})
    assert main.get_cached_ml_data() == {"status": "rebuilt"}
