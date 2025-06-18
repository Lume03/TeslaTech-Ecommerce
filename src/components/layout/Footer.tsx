export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
        <p>&copy; {currentYear} TeslaTech. All rights reserved.</p>
        <p className="text-sm mt-2">Powering Your Digital World</p>
      </div>
    </footer>
  );
}
