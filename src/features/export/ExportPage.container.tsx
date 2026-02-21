import { ExportPageView } from "./ExportPage.view";
import { useExportXlsx } from "./useExportXlsx";

export function ExportPageContainer() {
  const exportPage = useExportXlsx();

  return (
    <ExportPageView
      year={exportPage.state.year}
      month={exportPage.state.month}
      employeesCount={exportPage.state.employeesCount}
      hardConflictsCount={exportPage.state.hardConflictsCount}
      softConflictsCount={exportPage.state.softConflictsCount}
      canExport={exportPage.state.canExport}
      onExport={exportPage.actions.exportXlsx}
    />
  );
}
