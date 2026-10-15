import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  DestroyRef,
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
    // Parity with the Reference: a <button> never submits unless the consumer says type="submit".
    '[attr.type]': 'type',
  },
})
export class GrButton {
  /** Visual variant, set as `data-variant` on the host. */
  readonly variant = input<GrButtonVariant>('primary');

  /**
   * Disables the button: natively on `<button>`; on `<a>` with `aria-disabled="true"` and every
   * click (including Ctrl/middle-click and Enter) cancelled before any consumer handler runs.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly isButton = this.element.localName === 'button';
  // Host bindings to null would remove attributes the consumer wrote in the template, so the
  // authored values are read once. Write them statically; do not bind [attr.aria-disabled] or
  // [attr.type] on the same element.
  private readonly authoredAriaDisabled = this.element.getAttribute('aria-disabled');
  protected readonly type = this.isButton
    ? (this.element.getAttribute('type') ?? 'button')
    : this.element.getAttribute('type');

  protected readonly nativeDisabled = computed(() => this.disabled() && this.isButton);
  protected readonly ariaDisabled = computed(() =>
    this.disabled() && !this.isButton ? 'true' : this.authoredAriaDisabled,
  );

  constructor() {
    // Capture phase on the host itself runs before the (click) listeners a template registers, and
    // stopImmediatePropagation keeps those from firing. aria-disabled alone stops neither
    // navigation nor handlers, and auxclick is what middle-click navigation uses.
    const block = (event: Event) => {
      if (this.disabled() || this.element.getAttribute('aria-disabled') === 'true') {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    for (const name of ['click', 'auxclick'])
      this.element.addEventListener(name, block, { capture: true });
    inject(DestroyRef).onDestroy(() => {
      for (const name of ['click', 'auxclick'])
        this.element.removeEventListener(name, block, { capture: true });
    });
  }
}
