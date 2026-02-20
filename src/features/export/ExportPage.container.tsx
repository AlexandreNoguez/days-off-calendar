import { ExportPageView } from "./ExportPage.view";

export function ExportPageContainer() {
  // No MVP, a view pode só mostrar um placeholder.
  // Depois, você liga com useExportXlsx() e useValidation().
  return <ExportPageView />;
}
