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
      formEditing={rulesPage.state.formEditing}
      formReadyRulesCount={rulesPage.state.formReadyRulesCount}
      formRegistry={rulesPage.state.ruleFormRegistry}
      roles={rulesPage.state.roles}
      employees={rulesPage.state.employees}
      isCreateDialogOpen={rulesPage.state.isCreateDialogOpen}
      createStep={rulesPage.state.createStep}
      createError={rulesPage.state.createError}
      createRuleDraft={rulesPage.state.createRuleDraft}
      onEnsureDefaultRules={rulesPage.actions.ensureDefaultRules}
      onResetToDefaults={rulesPage.actions.resetToDefaultRules}
      onRestoreRulesDefaults={seedDefaults.actions.seedRulesDefaults}
      onToggleRule={rulesPage.actions.onToggleRule}
      onStartEditParams={rulesPage.actions.startEditParams}
      onCancelEditParams={rulesPage.actions.cancelEditParams}
      onChangeParamsDraft={rulesPage.actions.changeParamsDraft}
      onSaveParams={rulesPage.actions.saveParams}
      onStartFormEdit={rulesPage.actions.startFormEdit}
      onCancelFormEdit={rulesPage.actions.cancelFormEdit}
      onUpdateFormField={rulesPage.actions.updateFormField}
      onSaveFormEdit={rulesPage.actions.saveFormEdit}
      onOpenCreateRuleDialog={rulesPage.actions.openCreateRuleDialog}
      onCloseCreateRuleDialog={rulesPage.actions.closeCreateRuleDialog}
      onChangeCreateStep={rulesPage.actions.changeCreateStep}
      onUpdateCreateRuleDraft={rulesPage.actions.updateCreateRuleDraft}
      onCreateCustomRule={rulesPage.actions.createCustomRule}
    />
  );
}
