
export default function ShippingPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-card text-card-foreground p-8 rounded-lg shadow-lg space-y-6 fade-in">
        <h1 className="text-4xl font-headline font-bold text-primary mb-6 border-b pb-4">
          Política de Envío
        </h1>

        <section className="space-y-3">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">Cobertura de Envío</h2>
          <p className="pl-6 text-muted-foreground">
            Actualmente, realizamos envíos a todo el territorio nacional del Perú. Trabajamos con los operadores logísticos más confiables para garantizar que tu pedido llegue de manera segura y oportuna.
          </p>
        </section>

        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">Costos de Envío</h2>
          <div className="space-y-2 pl-6 text-muted-foreground">
            <p>
              El costo de envío se calcula automáticamente al momento de finalizar tu compra y se basa en la dirección de destino, así como en el peso y las dimensiones de los productos en tu carrito.
            </p>
            <p className="font-semibold text-foreground">
              ¡Ofrecemos envío gratuito para todas las compras cuyo monto total sea superior a S/ 2,000.00!
            </p>
          </div>
        </section>

        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">Plazos de Entrega</h2>
           <div className="space-y-2 pl-6 text-muted-foreground">
             <p>
              Los plazos de entrega se cuentan en días hábiles (no incluye domingos ni feriados) y comienzan a regir desde el momento en que <strong>TeslaTech</strong> valida la orden de compra y recibe la confirmación del pago por parte de Stripe.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Lima Metropolitana:</strong> Entre 2 a 4 días hábiles.</li>
              <li><strong>Provincias:</strong> Entre 5 a 10 días hábiles, dependiendo de la lejanía y accesibilidad de la localidad.</li>
            </ul>
             <p>
              Haremos todo lo posible por cumplir con estos plazos; sin embargo, pueden ocurrir retrasos por motivos de fuerza mayor (condiciones climáticas, huelgas, etc.). En dichos casos, nuestro equipo se comunicará contigo.
            </p>
          </div>
        </section>
        
        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">Seguimiento del Pedido</h2>
           <p className="pl-6 text-muted-foreground">
             Una vez que tu pedido sea despachado, recibirás un correo electrónico con la información de seguimiento (número de guía y enlace del transportista) para que puedas rastrear su estado en tiempo real.
          </p>
        </section>

        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">Recepción del Pedido</h2>
          <div className="space-y-2 pl-6 text-muted-foreground">
            <p>
              Es fundamental que proporciones una dirección de entrega correcta, completa y con referencias claras. <strong>TeslaTech</strong> no se responsabiliza por retrasos o costos adicionales generados por direcciones incorrectas o incompletas.
            </p>
            <p>
              Al momento de la entrega, una persona mayor de 18 años deberá recibir el paquete, presentando su DNI. Es importante que revises el estado del embalaje. Si notas algún daño o signo de manipulación, por favor, no aceptes el paquete y contáctanos de inmediato.
            </p>
          </div>
        </section>

        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">Entregas Fallidas</h2>
          <p className="pl-6 text-muted-foreground">
            Si la entrega no puede realizarse por responsabilidad del cliente (dirección incorrecta, nadie para recibir el paquete tras los intentos del transportista), la orden será anulada. En este caso, se procederá con la devolución del monto del producto, pero no se reembolsará el costo del flete de envío.
          </p>
        </section>
      </div>
    </div>
  );
}
