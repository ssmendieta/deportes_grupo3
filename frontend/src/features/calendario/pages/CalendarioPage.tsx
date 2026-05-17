import CalendarioAdminPage from "./CalendarioAdminPage";
import CalendarioEstudiantePage from "./CalendarioEstudiantePage";
import { getUserFromToken } from "../../auth/authStore";

type Props = {
  onVerReservas: () => void;
};

function CalendarioPage({ onVerReservas }: Props) {
  const user = getUserFromToken();
  const esAdmin = user?.rol === "admin";

  return esAdmin
    ? <CalendarioAdminPage onVerReservas={onVerReservas} />
    : <CalendarioEstudiantePage />;
}

export default CalendarioPage;
