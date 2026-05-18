import CalendarioAdminPage from "./CalendarioAdminPage";
import CalendarioEstudiantePage from "./CalendarioEstudiantePage";
import { getUserFromToken } from "../../auth/authStore";

function CalendarioPage() {
  const user = getUserFromToken();
  const esAdmin = user?.rol === "admin";

  return esAdmin
    ? <CalendarioAdminPage />
    : <CalendarioEstudiantePage />;
}

export default CalendarioPage;
