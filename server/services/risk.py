"""
Explainable Multi-Factor Risk Engine
Calculates deterministic security risk scores (0-100) with detailed transparent factor breakdowns.
"""

from typing import Dict, Any, List, Optional
from server.models.event import SecurityEvent


class RiskEngine:
    @staticmethod
    def calculate_event_risk(event: SecurityEvent, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Calculate risk score for a single security event.
        Returns a dict with total score, tier, and contributing factors.
        """
        factors: List[Dict[str, Any]] = []
        base_score = 10

        # Severity Hint baseline
        sev = (event.severity_hint or "LOW").upper()
        if sev == "CRITICAL":
            base_score = 70
            factors.append({"factor": "Critical Severity Classification", "points": +60})
        elif sev == "HIGH":
            base_score = 50
            factors.append({"factor": "High Severity Classification", "points": +40})
        elif sev == "MEDIUM":
            base_score = 30
            factors.append({"factor": "Medium Severity Classification", "points": +20})
        else:
            factors.append({"factor": "Baseline Security Telemetry", "points": +10})

        # Event type & Action weights
        if event.event_type == "privilege" and event.status == "success":
            base_score += 20
            factors.append({"factor": "Privilege Escalation Execution", "points": +20})
        elif event.event_type == "privilege" and event.status == "denied":
            base_score += 15
            factors.append({"factor": "Unauthorized Privilege Attempt", "points": +15})
        elif event.event_type == "authentication" and event.status == "failure":
            base_score += 10
            factors.append({"factor": "Authentication Rejection", "points": +10})

        # Sensitive target accounts
        if event.username and event.username.lower() in ("root", "administrator", "admin", "system"):
            base_score += 15
            factors.append({"factor": f"Privileged Account Targeted ({event.username})", "points": +15})

        # Bounded 0 - 100
        final_score = max(0, min(100, base_score))
        tier = RiskEngine.score_to_tier(final_score)

        return {
            "score": final_score,
            "tier": tier,
            "factors": factors
        }

    @staticmethod
    def calculate_alert_risk(
        base_rule_score: int,
        severity: str,
        event_count: int,
        has_correlation: bool = False,
        is_privileged: bool = False
    ) -> Dict[str, Any]:
        """
        Calculate explainable risk score for an alert.
        """
        score = base_rule_score
        factors: List[Dict[str, Any]] = [
            {"factor": f"Base Rule Risk Score ({severity})", "points": base_rule_score}
        ]

        # Multi-event frequency escalation
        if event_count > 10:
            boost = 15
            score += boost
            factors.append({"factor": f"High Velocity / Frequency ({event_count} events)", "points": +boost})
        elif event_count > 3:
            boost = 8
            score += boost
            factors.append({"factor": f"Repeated Activity ({event_count} events)", "points": +boost})

        # Correlation boost
        if has_correlation:
            boost = 20
            score += boost
            factors.append({"factor": "Multi-Stage Attack Chain Correlation", "points": +boost})

        # Privileged target boost
        if is_privileged:
            boost = 10
            score += boost
            factors.append({"factor": "Involves Root / Admin Privileges", "points": +boost})

        final_score = max(0, min(100, score))
        tier = RiskEngine.score_to_tier(final_score)

        return {
            "score": final_score,
            "tier": tier,
            "factors": factors
        }

    @staticmethod
    def score_to_tier(score: int) -> str:
        if score >= 90:
            return "CRITICAL"
        if score >= 70:
            return "HIGH"
        if score >= 40:
            return "MEDIUM"
        return "LOW"
