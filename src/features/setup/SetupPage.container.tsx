import { SetupPageView } from "./SetupPage.view";
import { useSetup } from "./useSetup";

export function SetupPageContainer() {
  const setup = useSetup();

  return (
    <SetupPageView
      year={setup.state.year}
      month={setup.state.month}
      monthOptions={setup.state.monthOptions}
      yearOptions={setup.state.yearOptions}
      weekdayLabels={setup.state.weekdayLabels}
      calendarCells={setup.state.calendarCells}
      holidaysCount={setup.state.holidaysCount}
      onChangeYear={setup.actions.onChangeYear}
      onChangeMonth={setup.actions.onChangeMonth}
      onToggleHoliday={setup.actions.onToggleHoliday}
      onClearHolidays={setup.actions.clearHolidays}
    />
  );
}
