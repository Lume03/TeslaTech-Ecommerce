
export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-card text-card-foreground p-8 rounded-lg shadow-lg space-y-6 fade-in">
        <h1 className="text-4xl font-headline font-bold text-primary mb-6 border-b pb-4">
          Política de Cookies
        </h1>

        <div className="space-y-4 text-muted-foreground">
          <p>
            En <strong>TeslaTech</strong> tenemos el compromiso de respetar la privacidad de nuestros clientes y proteger la confidencialidad de su información. Por ello, cumplimos con las disposiciones para el tratamiento de sus datos personales establecidas en la Ley de Protección de Datos Personales - Ley N° 29733, su Reglamento y demás normativa relacionada.
          </p>
          <p>
            En el marco de esa adaptación, <strong>TeslaTech</strong> cuenta con la página web <a href="https://teslatech-tna5j.web.app/" className="text-primary hover:underline">https://teslatech-tna5j.web.app/</a> (en adelante, el “Sitio Web”), la cual utiliza cookies. En este documento describimos la “Política de Cookies” que regula el Sitio Web, con el objetivo de garantizar la privacidad de los Usuarios.
          </p>
          <p>
            Informamos a los Usuarios que en el Sitio Web utilizamos cookies, tanto propias como de terceros. Estas cookies nos permiten facilitar el uso y navegación, garantizar el acceso a determinadas funcionalidades y, adicionalmente, nos ayudan a mejorar la calidad del Sitio Web de acuerdo a los hábitos y estilos de navegación de los Usuarios.
          </p>
        </div>

        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">1. ¿Qué son las Cookies?</h2>
          <p className="pl-6 text-muted-foreground">
            Las cookies son pequeños archivos de texto que los sitios web almacenan en su ordenador, celular inteligente (Smartphone), Tablet o cualquier otro dispositivo de acceso a Internet.
          </p>
        </section>

        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">2. ¿Para qué sirven?</h2>
          <div className="space-y-2 pl-6 text-muted-foreground">
            <p>Las cookies sirven para reconocer el dispositivo de los Usuarios cuando vuelven a visitar el Sitio Web, facilitándole su uso, recordando sus preferencias y configuración de navegación (ej. ítems en el carrito de compras, sesión iniciada).</p>
            <p>También sirven para mejorar los servicios que ofrecemos y para poder recopilar información estadística que nos permite entender cómo los Usuarios utilizan nuestro Sitio Web y nos ayudan a mejorar su estructura y contenidos. Algunas cookies son estrictamente necesarias para que el sitio web funcione correctamente y otras sirven para mejorar el rendimiento y su experiencia como usuario.</p>
          </div>
        </section>

        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">3. Tipos de Cookies que Utilizamos</h2>
          <div className="space-y-4 pl-6 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Según su origen:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Cookies Propias:</strong> Son aquellas que se envían al dispositivo del Usuario desde nuestro propio Sitio Web.</li>
                <li><strong>Cookies de Terceros:</strong> Son aquellas enviadas por otras entidades, como Google Analytics para análisis estadístico o Stripe para el proceso de pago.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Según su duración:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Cookies de Sesión:</strong> Recogen y almacenan datos solo mientras el Usuario está en el Sitio Web.</li>
                <li><strong>Cookies Persistentes:</strong> Los datos siguen almacenados en el dispositivo por un tiempo definido.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Según su finalidad:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Técnicas:</strong> Imprescindibles para el funcionamiento del Sitio Web (ej. mantenimiento de sesión, carrito de compras).</li>
                <li><strong>De Personalización:</strong> Permiten recordar preferencias como el idioma o la configuración regional.</li>
                <li><strong>De Análisis:</strong> Permiten el seguimiento y análisis del comportamiento de los Usuarios de forma anónima para mejorar el servicio.</li>
                <li><strong>Publicitarias:</strong> Permiten la gestión eficaz de espacios publicitarios.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">4. Gestión y Desactivación de Cookies</h2>
          <div className="space-y-2 pl-6 text-muted-foreground">
            <p>
              Si usted como Usuario decide no autorizar el tratamiento, solo usaríamos las cookies técnicas, puesto que son imprescindibles para la navegación. En este caso, no almacenaríamos ninguna otra cookie.
            </p>
            <p>
              Tenga en cuenta que si rechaza o borra las cookies, no podremos mantener sus preferencias, y algunas funcionalidades no estarán operativas.
            </p>
            <p>
              Es posible eliminar las cookies o impedir que se registre esta información en su equipo en cualquier momento mediante la modificación de los parámetros de configuración de su navegador. Para bloquear o deshabilitar las cookies, deberá activar la configuración que rechaza la instalación de todas o algunas de ellas.
            </p>
          </div>
        </section>

        <section className="space-y-3 pt-4">
          <h2 className="text-2xl font-headline font-semibold text-primary border-l-4 border-primary pl-4">5. Vigencia y Modificación</h2>
          <p className="pl-6 text-muted-foreground">
            <strong>TeslaTech</strong> puede modificar esta Política de Cookies en función de exigencias legislativas o reglamentarias. De producirse cualquier cambio o modificación, el texto vigente será publicado en nuestro portal web.
          </p>
        </section>
      </div>
    </div>
  );
}
