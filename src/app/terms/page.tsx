
export default function TermsAndConditionsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-card text-card-foreground p-8 rounded-lg shadow-lg space-y-6 fade-in">
        <h1 className="text-4xl font-headline font-bold text-primary mb-6 border-b pb-4">
          Términos y Condiciones de Uso
        </h1>

        <div className="space-y-4 text-muted-foreground">
          <p className="text-lg">
            Este documento establece los “Términos y Condiciones” generales que rigen el acceso y uso de los servicios proporcionados por <strong>TeslaTech</strong>, con RUC 10749821057, en el sitio web <a href="https://teslatech-tna5j.web.app/" className="text-primary hover:underline">https://teslatech-tna5j.web.app/</a> y todos sus subdominios (en adelante, el “Sitio Web”).
          </p>
          <p>
            Cualquier persona que desee acceder y/o utilizar el Sitio Web o sus servicios (el “Usuario”) deberá aceptar previamente estos Términos y Condiciones. Todas las visitas, contratos y transacciones realizadas en este Sitio Web se regirán por estas normas y estarán sujetas a la legislación aplicable en la República del Perú.
          </p>
          <p>
            El Usuario debe leer, entender y aceptar todas las condiciones aquí establecidas antes de registrarse o adquirir productos. Al visitar y utilizar el Sitio Web, usted se comunica con <strong>TeslaTech</strong> de manera electrónica y brinda su consentimiento expreso para regirse por estos términos y recibir comunicaciones por correo electrónico o mediante avisos publicados en el portal.
          </p>
        </div>

        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">1. Registro del Usuario y Capacidad</h2>
          <div className="space-y-2 text-muted-foreground pl-6">
            <p>Para comprar productos en el Sitio Web no es un requisito indispensable estar registrado. Sin embargo, si el usuario decide registrarse, deberá completar el formulario con datos veraces, exactos y actualizados. Es responsabilidad exclusiva del Usuario la veracidad y actualización de dicha información.</p>
            <p>El Usuario es el único responsable de mantener la confidencialidad de su contraseña. <strong>TeslaTech</strong> no se hace responsable por el uso no autorizado de la cuenta por parte de terceros.</p>
            <p>El tratamiento de los datos personales proporcionados se rige por nuestra Política de Privacidad y la Ley N° 29733 – Ley de Protección de Datos Personales.</p>
          </div>
        </section>

        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">2. Productos, Precios y Stock</h2>
          <div className="space-y-2 text-muted-foreground pl-6">
            <p><strong>Precios:</strong> Los precios exhibidos son exclusivos para compras realizadas en este Sitio Web. Están expresados en Soles (S/) e incluyen el Impuesto General a las Ventas (IGV). TeslaTech se reserva el derecho de modificar cualquier información, incluyendo precios, promociones y condiciones, en cualquier momento y sin previo aviso.</p>
            <p><strong>Imágenes:</strong> Las imágenes, videos y descripciones de los productos son de carácter referencial y tienen un propósito orientador. Podrían existir ligeras diferencias de apariencia o empaque con el producto real sin que esto afecte su funcionalidad principal.</p>
            <p><strong>Stock:</strong> La disponibilidad de los productos se actualiza constantemente. No se garantiza un stock superior a una (1) unidad por producto durante las ofertas. Si un producto se agota, se indicará como "AGOTADO". En el eventual caso de que un pedido ya pagado no pueda ser atendido por falta de stock imprevista, nuestro equipo de servicio al cliente contactará al Usuario para coordinar una solución, que podrá ser la cancelación del pedido y el extorno completo del dinero.</p>
          </div>
        </section>

        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">3. Forma de Pago</h2>
          <div className="space-y-2 text-muted-foreground pl-6">
            <p>Los pagos en el Sitio Web se realizarán única y exclusivamente a través de la pasarela de pago internacional <strong>Stripe</strong>. Esta plataforma procesa de forma segura las principales tarjetas de crédito y/o débito (Visa, Mastercard, American Express, entre otras).</p>
            <p>El uso de las tarjetas se sujetará a lo establecido en los términos y condiciones de su respectivo banco emisor. La aprobación del pedido está sujeta a la validación y confirmación de la transacción por parte de Stripe.</p>
            <p><strong>TeslaTech no almacena, procesa ni tiene acceso a los datos de su tarjeta.</strong> Toda la información financiera es gestionada de forma encriptada y segura directamente por Stripe.</p>
          </div>
        </section>

        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">4. Políticas de Entrega (Delivery)</h2>
          <div className="space-y-2 text-muted-foreground pl-6">
            <p><strong>Responsabilidad del Cliente:</strong> Es responsabilidad del cliente indicar con total exactitud y detalle la dirección de entrega. Un error en la dirección podría ocasionar demoras significativas, costos adicionales o la imposibilidad de la entrega.</p>
            <p><strong>Recepción del Pedido:</strong> Una persona mayor de 18 años, debidamente identificada con DNI, deberá recibir el producto en la dirección de entrega. De no encontrarse nadie en la dirección, se procederá según lo indicado en "Entregas Fallidas".</p>
            <p><strong>Costos de Envío:</strong> El costo del envío será especificado al momento de finalizar la compra y dependerá del destino y las dimensiones del producto.</p>
            <p><strong>Envío Gratuito:</strong> El costo de envío será gratuito para todas las compras cuyo monto total sea superior a S/ 2,000.00 (Dos mil y 00/100 Soles).</p>
            <p><strong>Plazos de Entrega:</strong> Los plazos de entrega se contarán en días hábiles (no incluye domingos ni feriados) desde que TeslaTech valida la solicitud de compra y la confirmación del pago por parte de Stripe.</p>
            <p><strong>Entregas Fallidas:</strong> En caso de que no se pueda concretar la entrega por responsabilidad del cliente (dirección incorrecta, nadie para recibir, etc.), se procederá a anular la orden de compra. Se realizará la devolución del monto del producto, pero no se devolverá el costo del flete de envío.</p>
          </div>
        </section>

        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">5. Comprobantes de Pago</h2>
          <div className="space-y-2 text-muted-foreground pl-6">
            <p>Conforme a la normativa de SUNAT (R.S. N° 007-99/SUNAT y modificatorias), el cliente deberá decidir correctamente el tipo de comprobante de pago que solicitará (Boleta de Venta o Factura) al momento de su compra. <strong>No procederá el cambio de boletas por facturas ni viceversa una vez emitido el comprobante.</strong></p>
            <p>Para la emisión de Factura, es obligatorio proporcionar el número de RUC y la Razón Social. Los comprobantes electrónicos (CPE) serán puestos a disposición del cliente conforme a la normativa vigente.</p>
          </div>
        </section>

         <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">6. Propiedad Intelectual</h2>
          <div className="space-y-2 text-muted-foreground pl-6">
            <p>Todo el contenido incluido o puesto a disposición del Usuario en el Sitio Web, incluyendo textos, gráficos, logos, íconos, imágenes, y cualquier otra información, es de propiedad de <strong>TeslaTech</strong> o ha sido licenciado a esta. Queda estrictamente prohibida su reproducción, copia, o cualquier otra forma de explotación con fines comerciales sin el consentimiento previo y por escrito de TeslaTech.</p>
          </div>
        </section>
        
        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">7. Modificaciones de los Términos y Condiciones</h2>
          <div className="space-y-2 text-muted-foreground pl-6">
             <p><strong>TeslaTech</strong> podrá modificar los Términos y Condiciones en cualquier momento, haciendo públicos en el Sitio Web los términos modificados. Dichas modificaciones entrarán en vigor a los 10 (diez) días de su publicación. El uso del sitio y/o sus servicios implica la aceptación de dichos cambios.</p>
          </div>
        </section>

      </div>
    </div>
  );
}
