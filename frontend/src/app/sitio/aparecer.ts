import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

/**
 * Hace que un elemento aparezca suavemente (sube y se aclara) cuando entra en pantalla.
 * Los estilos están en styles.scss ([appAparecer] y .visible).
 *
 * Uso: <article appAparecer [retraso]="150">...</article>
 */
@Directive({
  selector: '[appAparecer]',
})
export class Aparecer implements OnInit, OnDestroy {
  private elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private observador?: IntersectionObserver;

  /** Milisegundos de espera antes de aparecer (para que varios salgan en cascada) */
  retraso = input(0);

  ngOnInit(): void {
    const el = this.elemento.nativeElement;
    el.style.setProperty('--retraso', `${this.retraso()}ms`);

    // Navegadores muy viejos: se muestra de una vez
    if (!('IntersectionObserver' in window)) {
      el.classList.add('visible');
      return;
    }
    this.observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          el.classList.add('visible');
          this.observador?.disconnect(); // Solo se anima la primera vez
        }
      },
      { threshold: 0.12 },
    );
    this.observador.observe(el);
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
  }
}
