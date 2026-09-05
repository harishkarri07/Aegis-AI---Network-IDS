"""
Detection Rule Loader & Compiler
Loads YAML and JSON detection rules, validates constraints, and prepares rules for the stateful engine.
"""

import os
import json
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

RULES_PATH = os.environ.get(
    "SIEM_RULES_PATH",
    os.path.join(os.path.dirname(__file__), "rules.yaml")
)
RULES_JSON_PATH = os.path.join(os.path.dirname(__file__), "rules.json")


@dataclass
class DetectionRule:
    rule_id: str
    name: str
    description: str
    severity: str
    risk_score: int
    timeframe: int = 120  # seconds
    count: int = 1        # threshold
    group_by: Optional[str] = "source_ip"
    conditions: Dict[str, Any] = field(default_factory=dict)
    preceding_rule: Optional[str] = None
    enabled: bool = True
    mitre_technique: Optional[str] = None
    mitre_tactic: Optional[str] = None
    recommendation: str = "Investigate alert evidence."

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "name": self.name,
            "description": self.description,
            "severity": self.severity,
            "risk_score": self.risk_score,
            "timeframe": self.timeframe,
            "count": self.count,
            "group_by": self.group_by,
            "conditions": self.conditions,
            "preceding_rule": self.preceding_rule,
            "enabled": self.enabled,
            "mitre_technique": self.mitre_technique,
            "mitre_tactic": self.mitre_tactic,
            "recommendation": self.recommendation
        }


def parse_clean_yaml(text: str) -> Dict[str, Any]:
    """Robust zero-dependency parser for SIEM detection rules YAML structure."""
    try:
        import yaml
        return yaml.safe_load(text)
    except Exception:
        pass

    rules = []
    current_rule: Optional[Dict[str, Any]] = None
    section = None  # None or 'conditions'

    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        indent = len(line) - len(line.lstrip())

        if stripped.startswith("- rule_id:") or (stripped.startswith("-") and "rule_id:" in stripped):
            if current_rule and current_rule.get("rule_id"):
                rules.append(current_rule)
            val = stripped.split("rule_id:", 1)[1].strip().strip('"').strip("'")
            current_rule = {
                "rule_id": val,
                "conditions": {},
                "enabled": True,
                "count": 1,
                "timeframe": 120,
                "severity": "MEDIUM",
                "risk_score": 50,
                "group_by": "source_ip"
            }
            section = None
            continue

        if not current_rule:
            continue

        if ":" in stripped:
            parts = stripped.split(":", 1)
            key = parts[0].strip().lstrip("- ")
            val_str = parts[1].strip().strip('"').strip("'")

            if key == "conditions":
                section = "conditions"
                continue

            # Parse value type
            val: Any = val_str
            if val_str.isdigit():
                val = int(val_str)
            elif val_str.lower() == "true":
                val = True
            elif val_str.lower() == "false":
                val = False
            elif not val_str:
                val = None

            # Check indentation level: inside conditions (indent >= 6) vs rule attribute (indent <= 4)
            if indent >= 6 and section == "conditions":
                current_rule["conditions"][key] = val
            else:
                section = None
                current_rule[key] = val

    if current_rule and current_rule.get("rule_id"):
        rules.append(current_rule)

    return {"rules": rules}


class RuleLoader:
    @staticmethod
    def load_rules(file_path: Optional[str] = None) -> List[DetectionRule]:
        path = file_path or RULES_PATH
        if not os.path.exists(path):
            if os.path.exists(RULES_JSON_PATH):
                path = RULES_JSON_PATH
            else:
                return []

        with open(path, "r", encoding="utf-8") as f:
            content = f.read()

        data = {}
        if path.endswith(".json"):
            data = json.loads(content)
        else:
            data = parse_clean_yaml(content)

        raw_rules = data.get("rules", [])
        rules_list: List[DetectionRule] = []

        for r in raw_rules:
            if not r.get("rule_id"):
                continue
            rule_obj = DetectionRule(
                rule_id=r.get("rule_id"),
                name=r.get("name", "Unknown Rule"),
                description=r.get("description", ""),
                severity=r.get("severity", "MEDIUM").upper(),
                risk_score=int(r.get("risk_score", 50)),
                timeframe=int(r.get("timeframe", 120)),
                count=int(r.get("count", 1)),
                group_by=r.get("group_by", "source_ip"),
                conditions=r.get("conditions", {}),
                preceding_rule=r.get("preceding_rule"),
                enabled=bool(r.get("enabled", True)),
                mitre_technique=r.get("mitre_technique"),
                mitre_tactic=r.get("mitre_tactic"),
                recommendation=r.get("recommendation", "Investigate alert evidence.")
            )
            rules_list.append(rule_obj)

        return rules_list
