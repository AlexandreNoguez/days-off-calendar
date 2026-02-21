import { RulesPageView } from "./RulesPage.view";
import { useRulesPage } from "./useRulesPage";
import { useSeedDefaults } from "../wizard/useSeedDefaults";

export function RulesPageContainer() {
  const rulesPage = useRulesPage();
  const seedDefaults = useSeedDefaults();

  return (
    <RulesPageView
      rules={rulesPage.state.orderedRules}
      hasRules={rulesPage.state.hasRules}
      editing={rulesPage.state.editing}
      onEnsureDefaultRules={rulesPage.actions.ensureDefaultRules}
      onResetToDefaults={rulesPage.actions.resetToDefaultRules}
      onRestoreRulesDefaults={seedDefaults.actions.seedRulesDefaults}
      onToggleRule={rulesPage.actions.onToggleRule}
      onStartEditParams={rulesPage.actions.startEditParams}
      onCancelEditParams={rulesPage.actions.cancelEditParams}
      onChangeParamsDraft={rulesPage.actions.changeParamsDraft}
      onSaveParams={rulesPage.actions.saveParams}
    />
  );
}
