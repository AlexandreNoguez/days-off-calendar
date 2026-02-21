import { SchedulePageView } from "./SchedulePage.view";
import { useScheduleEditor } from "./useScheduleEditor";

export function SchedulePageContainer() {
  const schedule = useScheduleEditor();

  return (
    <SchedulePageView
      year={schedule.state.year}
      month={schedule.state.month}
      hasEmployees={schedule.state.hasEmployees}
      hasRules={schedule.state.hasRules}
      dayColumns={schedule.state.dayColumns}
      employeeRows={schedule.state.employeeRows}
      canUndo={schedule.state.canUndo}
      canRedo={schedule.state.canRedo}
      validation={schedule.state.validation}
      changeLogRows={schedule.state.changeLogRows}
      getCellStatus={schedule.actions.getCellStatus}
      onSetStatus={schedule.actions.setStatus}
      onToggleOff={schedule.actions.toggleOff}
      onMarkAllAsWork={schedule.actions.markAllAsWork}
      onGenerateSuggestion={schedule.actions.generateSuggestion}
      onUndo={schedule.actions.undo}
      onRedo={schedule.actions.redo}
      onResetSchedule={schedule.actions.resetSchedule}
    />
  );
}
