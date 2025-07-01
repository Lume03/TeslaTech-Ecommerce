
export default function WarrantyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-card text-card-foreground p-8 rounded-lg shadow-lg space-y-6 fade-in">
        <h1 className="text-4xl font-headline font-bold text-primary mb-6 border-b pb-4">
          Política de Garantía
        </h1>

        <section className="space-y-3">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">Disposiciones Generales</h2>
          <div className="space-y-2 text-muted-foreground pl-6">
            <p>La garantía se aplica exclusivamente al cliente titular que realizó la compra en <strong>TeslaTech</strong> y no es transferible a terceros.</p>
            <p>Cada producto cuenta con términos y definiciones de garantía específicos, los cuales se rigen por las políticas establecidas por el fabricante de dicho producto.</p>
            <p><strong>Horario de Atención para Garantías:</strong> Lunes a Miércoles de 10:30 a.m. a 1:00 p.m. y de 2:00 p.m. a 5:00 p.m.</p>
            <p><strong>Número de Contacto:</strong> 908 900 554.</p>
            <p><strong>Ubicación del Área de Garantías:</strong> Galería Centro Lima, Semisótano Pasaje H 557 - Cercado de Lima.</p>
          </div>
        </section>

        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">Requisitos para la Garantía</h2>
          <div className="space-y-2 text-muted-foreground pl-6">
            <p>Para hacer efectiva la validación de la garantía, el cliente debe presentar su comprobante de pago (factura o boleta, ya sea original o copia). No se recepcionará ningún producto sin su respectivo comprobante.</p>
            <p>El producto debe ser remitido a nuestro centro de servicio debidamente protegido. En caso de equipos ensamblados, solo será necesario traer el CPU, sin monitor, teclado, mouse o cables, tal como fue despachado.</p>
             <p>El cliente recibirá una copia de la guía de recepción al internar sus productos. Para preservar la seguridad, el recojo de los equipos solo se efectuará presentando el documento original de dicha guía.</p>
          </div>
        </section>

        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">Responsabilidad sobre la Información</h2>
          <div className="space-y-2 text-muted-foreground pl-6">
            <p>La garantía no cubre backups, copias de seguridad de archivos y/o programas, mantenimientos generales, reinstalaciones de software o fallas causadas por virus. <strong>TeslaTech</strong> no se responsabiliza por la pérdida parcial o total de la información almacenada en su equipo durante el proceso de diagnóstico o reparación.</p>
          </div>
        </section>

        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">Proceso de Reparación y Envíos</h2>
           <div className="space-y-2 text-muted-foreground pl-6">
            <p>Los productos que ingresan por garantía podrán ser reparados o remanufacturados con partes y piezas nuevas, manteniendo el periodo restante de la garantía original.</p>
            <p>Los clientes domiciliados en provincia asumirán la obligación de cubrir todos los gastos y costos de envío y retorno de sus productos a su lugar de origen.</p>
          </div>
        </section>

        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">Exclusiones y Anulación de la Garantía</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-6">
            <li>El producto perderá automáticamente la garantía si presenta etiquetas del fabricante o de <strong>TeslaTech</strong> que hayan sido adulteradas o removidas, o si muestra evidencia de intentos de reparación por personal no autorizado.</li>
            <li>En ningún caso se recibirán productos con daño físico, signos de haber sido manipulados, forzados, o que presenten algún componente quemado o dañado visiblemente.</li>
            <li>No se aceptan devoluciones o cambios de productos por error de compra o por cambio de modelo por parte del cliente.</li>
            <li>Los daños causados por fallas eléctricas externas, sobrecargas, mala instalación, falta de mantenimiento, o la presencia de cualquier elemento extraño (ácidos, líquidos, químicos, insectos, óxido, etc.) o por uso inapropiado, no están cubiertos por la garantía.</li>
          </ul>
        </section>

        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">Plazos de Atención de la Garantía</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-6">
            <li><strong>Cambio Inmediato (Primeros 7 Días):</strong> Si el producto adquirido presenta un desperfecto de fábrica dentro de los primeros 7 días hábiles, se procederá a un cambio inmediato. De no contar con stock, se emitirá una nota de crédito por el 100% de su valor de compra.</li>
            <li><strong>Servicio Técnico (Después de 7 Días):</strong> Si el desperfecto ocurre pasados los 7 días hábiles, el plazo de diagnóstico y reparación es de un mínimo de 48 horas y un máximo de 30 días, sujeto a la disponibilidad de partes y piezas, especialmente para equipos ensamblados.</li>
            <li><strong>Productos Descontinuados:</strong> Si un producto en garantía se encuentra descontinuado, se entregará un producto de reemplazo de características y valor equivalentes, o se generará una nota de crédito por el 100% del valor de compra si la falla ocurre dentro de los primeros 12 meses.</li>
          </ul>
        </section>
        
        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">Garantía Directa con Centros Autorizados (C.A.S.)</h2>
          <div className="space-y-2 text-muted-foreground pl-6">
            <p>Ciertas marcas gestionan sus garantías directamente a través de sus Centros Autorizados de Servicio (C.A.S.). En estos casos, el cliente debe acudir directamente al C.A.S. con su comprobante de compra y regirse por las políticas específicas de la marca. Estos productos no deben ser enviados a nuestro departamento de garantías.</p>
          </div>
        </section>

        <section className="space-y-3 pt-4 bg-muted p-4 rounded-md">
            <h2 className="text-xl font-headline font-semibold text-foreground">Definiciones Clave</h2>
             <dl className="space-y-2 text-sm text-muted-foreground">
                <div>
                    <dt className="font-semibold text-foreground">Garantía</dt>
                    <dd>Es el compromiso temporal que otorga el fabricante o <strong>TeslaTech</strong> al comprador, por el cual nos obligamos a reparar gratuitamente un producto en caso de avería o defecto de fabricación. La garantía no es sinónimo de cambio inmediato del producto, sino de asegurar su buen funcionamiento a través de un diagnóstico y reparación.</dd>
                </div>
                <div>
                    <dt className="font-semibold text-foreground">Garantía de Marca</dt>
                    <dd>Es la garantía cuyo plazo y condiciones son definidos directamente por el fabricante. Para hacerla válida, el cliente debe dirigirse a los Centros Autorizados de Servicio (C.A.S.) de la marca.</dd>
                </div>
                <div>
                    <dt className="font-semibold text-foreground">C.A.S. (Centro Autorizado de Servicio)</dt>
                    <dd>Entidad técnica autorizada por el fabricante para gestionar y reparar productos bajo las condiciones de su garantía.</dd>
                </div>
             </dl>
        </section>
      </div>
    </div>
  );
}
