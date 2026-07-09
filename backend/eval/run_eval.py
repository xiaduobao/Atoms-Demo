"""RAGAS evaluation — run manually: python -m eval.run_eval"""

import json
from pathlib import Path

GOLDEN = Path(__file__).parent / "fixtures" / "golden_prompts.json"


def load_golden():
    return json.loads(GOLDEN.read_text())


def run_eval():
    prompts = load_golden()
    print(f"Loaded {len(prompts)} golden prompts for evaluation")
    for p in prompts:
        print(f"  - {p['title']}: {p['prompt'][:50]}...")
    print("\nConfigure LLM_API_KEY and run with ragas for full eval.")


if __name__ == "__main__":
    run_eval()
