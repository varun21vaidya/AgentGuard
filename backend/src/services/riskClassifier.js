const TOOL_RISK_DEFAULTS = {
  'firecrawl': 'safe',
  'github': 'reversible',
  'github:write': 'irreversible',
  'filesystem:read': 'safe',
  'filesystem:write': 'reversible',
  'filesystem:delete': 'irreversible',
};

export class RiskClassifier {
  getEffectiveRisk(nodeData) {
    if (nodeData.riskLevel && nodeData.riskLevel !== 'safe') {
      return nodeData.riskLevel;
    }

    if (nodeData.serverId && nodeData.toolName) {
      const key = `${nodeData.serverId}:${nodeData.toolName}`;
      const risk = TOOL_RISK_DEFAULTS[key] || TOOL_RISK_DEFAULTS[nodeData.serverId];
      if (risk) return risk;
    }

    return 'safe';
  }

  setToolRiskDefaults(toolId, riskLevel) {
    TOOL_RISK_DEFAULTS[toolId] = riskLevel;
  }
}

export const riskClassifier = new RiskClassifier();
