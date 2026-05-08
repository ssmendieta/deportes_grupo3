import PageHeader from "../../../shared/components/PageHeader";

type Props = {
  titulo: string;
  subtitulo: string;
  textoBoton?: string;
  onClickBoton?: () => void;
};

function EncabezadoCalendario({ titulo, subtitulo, textoBoton, onClickBoton }: Props) {
  return (
    <PageHeader
      eyebrow="Universidad Católica Boliviana"
      title={titulo}
      description={subtitulo}
      actionLabel={textoBoton}
      onAction={onClickBoton}
    />
  );
}

export default EncabezadoCalendario;
