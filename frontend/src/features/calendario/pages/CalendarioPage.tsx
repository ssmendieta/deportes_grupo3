import CalendarioAdminPage from "./CalendarioAdminPage";
import CalendarioEstudiantePage from "./CalendarioEstudiantePage";
import { getUserFromToken } from "../../auth/authStore";

function CalendarioPage() {
  const user = getUserFromToken();
  const rol = user?.rol;
  const esGestor = rol === "admin" || rol === "entrenador";

  return esGestor
    ? <CalendarioAdminPage />
    : <CalendarioEstudiantePage />;
}

export default CalendarioPage;
