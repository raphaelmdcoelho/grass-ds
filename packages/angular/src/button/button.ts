import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';

export type GrButtonVariant = 'primary' | 'secondary' | 'danger';

/**
 * Button, applied to a native element: `<button grButton>` or `<a grButton href>`.
 * It renders the markup contract of `.gr-button` in @grass-ds/css and owns no styles itself,
 * so the host application must load @grass-ds/tokens and @grass-ds/css.
 */
@Component({
  selector: 'button[grButton], a[grButton]',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'gr-button',
    '[attr.data-variant]': 'variant()',
    // A <button> uses the native attribute (not focusable, never clicks); anything else gets ARIA.
    '[attr.disabled]': 'nativeDisabled() ? "" : null',
    '[attr.aria-disabled]': 'ariaDisabled()',
    '(click)': 'onClick($event)',
  },
})
export class GrButton {
  /** Visual variant, set as `data-variant` on the host. */
  readonly variant = input<GrButtonVariant>('primary');

  /** Disables the button: natively on `<button>`, with `aria-disabled` and no navigation on `<a>`. */
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly isButton = this.element.localName === 'button';
  // A binding to null would remove an aria-disabled attribute the consumer wrote in the template.
  private readonly authoredAriaDisabled = this.element.getAttribute('aria-disabled');

  protected readonly nativeDisabled = computed(() => this.disabled() && this.isButton);
  protected readonly ariaDisabled = computed(() =>
    this.disabled() && !this.isButton ? 'true' : this.authoredAriaDisabled,
  );

  protected onClick(event: Event): void {
    // aria-disabled does not stop navigation or form submission, so it is stopped by hand.
    if (this.ariaDisabled() === 'true') event.preventDefault();
  }
}
