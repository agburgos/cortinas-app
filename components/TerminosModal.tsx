"use client";

export default function TerminosModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--warm-white)] rounded-t-2xl p-5 w-full max-h-[85vh] overflow-y-auto">
        <div className="w-9 h-1 bg-[var(--border)] rounded mx-auto mb-4" />
        <div className="text-lg font-extrabold mb-3">Términos y Condiciones y Política de Protección de Datos</div>
        <div className="text-[13px] text-[var(--charcoal)] space-y-3 leading-relaxed">
          <p>
            <strong>1. Objeto.</strong> Al enviar este formulario, usted solicita una cotización de productos y
            servicios de cortinaje a <strong>Cortinajes Claudia Burgos</strong> ("la Empresa"). El presupuesto
            generado es referencial y puede variar tras una visita técnica o medición en terreno.
          </p>
          <p>
            <strong>2. Datos que recolectamos.</strong> Para generar su cotización solicitamos: nombre, correo
            electrónico, teléfono (opcional), medidas de sus ventanas y notas adicionales que usted indique.
          </p>
          <p>
            <strong>3. Finalidad del tratamiento.</strong> Estos datos se utilizan exclusivamente para: (a) calcular
            y enviarle su presupuesto en formato PDF, (b) contactarlo para coordinar la venta e instalación, y (c)
            fines administrativos internos de la Empresa. No se venden ni se comparten con terceros ajenos al
            negocio.
          </p>
          <p>
            <strong>4. Responsable del tratamiento.</strong> Cortinajes Claudia Burgos es responsable del
            tratamiento de sus datos personales, conforme a la Ley N° 21.719 sobre Protección de Datos Personales,
            que entra en vigencia en diciembre de 2026.
          </p>
          <p>
            <strong>5. Sus derechos.</strong> Usted tiene derecho a acceder, rectificar, cancelar y oponerse al
            tratamiento de sus datos personales (derechos ARCO), así como a solicitar la eliminación de su
            información de nuestros registros en cualquier momento.
          </p>
          <p>
            <strong>6. Cómo ejercer sus derechos.</strong> Puede ejercer estos derechos escribiendo a
            claudia.burgosc@gmail.com, indicando su nombre y correo utilizado en la solicitud. Responderemos en un
            plazo razonable.
          </p>
          <p>
            <strong>7. Conservación.</strong> Sus datos se conservarán mientras exista una relación comercial vigente
            o potencial, y se eliminarán a su solicitud salvo obligación legal de conservarlos.
          </p>
          <p>
            <strong>8. Aceptación.</strong> Al marcar la casilla de aceptación y enviar el formulario, usted declara
            haber leído y aceptado estos Términos y Condiciones y esta Política de Protección de Datos.
          </p>
        </div>
        <button
          className="mt-5 w-full rounded-xl py-3 font-semibold text-white"
          style={{ background: "var(--gradient)" }}
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
