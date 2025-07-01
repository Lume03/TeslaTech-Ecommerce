
export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-card text-card-foreground p-8 rounded-lg shadow-lg space-y-6 fade-in">
        <h1 className="text-4xl font-headline font-bold text-primary mb-6 border-b pb-4">
          Nuestra Empresa
        </h1>

        <p className="text-lg leading-relaxed text-muted-foreground">
          Somos <span className="font-semibold text-foreground">TeslaTech</span>, una empresa peruana con más de 15 años de experiencia en el mercado, liderando el rubro de ventas de equipos y accesorios de cómputo. Nos enorgullece ser distribuidores oficiales certificados de las principales marcas tecnológicas a nivel mundial.
        </p>
        
        <p className="leading-relaxed text-muted-foreground">
          En <span className="font-semibold text-foreground">TeslaTech</span>, estamos comprometidos en ofrecer lo último de la tecnología, llevando modernidad y mejorando la calidad de vida de nuestros clientes con productos innovadores y de vanguardia.
        </p>

        <div>
          <h2 className="text-2xl font-headline font-semibold text-primary mb-3">Nuestra Sede Principal se encuentra ubicada en:</h2>
          <p className="leading-relaxed text-muted-foreground">
            Galería Centro Lima - Pasaje H 557 Primer Nivel, Lima, Perú.
          </p>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground border-t border-border/50 pt-4 mt-4">
          Como parte de la transparencia de nuestra empresa, ponemos a su disposición el libro de reclamaciones, así como las políticas de protección de datos personales y uso de cookies para fines adicionales.
        </p>

        <div className="grid md:grid-cols-2 gap-8 pt-6">
          <div className="bg-muted p-6 rounded-md">
            <h2 className="text-3xl font-headline font-bold text-primary mb-3">
              Visión
            </h2>
            <p className="leading-relaxed text-foreground">
              Ser una de las empresas principales y un referente indiscutible en el mundo de la tecnología informática en la región.
            </p>
          </div>
          <div className="bg-muted p-6 rounded-md">
            <h2 className="text-3xl font-headline font-bold text-primary mb-3">
              Misión
            </h2>
            <p className="leading-relaxed text-foreground">
              Ser la principal alternativa de compra, ofreciendo productos y accesorios de cómputo de primera calidad con la garantía certificada de las principales marcas tecnológicas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
