import ReservaForm from "../components/ReservaForm";

type Props = {
  onVolver: () => void;
};

function NuevaReservaPage({ onVolver }: Props) {
  return <ReservaForm onVolver={onVolver} />;
}

export default NuevaReservaPage;
