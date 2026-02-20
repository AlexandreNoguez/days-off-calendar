import { RulesPageView } from "./RulesPage.view";
import { useRulesPage } from "./useRulesPage";

export function RulesPageContainer() {
  const rulesPage = useRulesPage();

  return (
    <RulesPageView
      rules={rulesPage.state.orderedRules}
      hasRules={rulesPage.state.hasRules}
      editing={rulesPage.state.editing}
      onEnsureDefaultRules={rulesPage.actions.ensureDefaultRules}
      onResetToDefaults={rulesPage.actions.resetToDefaultRules}
      onToggleRule={rulesPage.actions.onToggleRule}
      onStartEditParams={rulesPage.actions.startEditParams}
      onCancelEditParams={rulesPage.actions.cancelEditParams}
      onChangeParamsDraft={rulesPage.actions.changeParamsDraft}
      onSaveParams={rulesPage.actions.saveParams}
    />
  );
}
