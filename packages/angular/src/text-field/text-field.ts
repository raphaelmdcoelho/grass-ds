import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * TextField, applied to a native control: `<input grTextField>` or `<textarea grTextField>`.
 * It renders the markup contract of `.gr-text-field` in @grass-ds/css and owns no styles itself,
 * so the host application must load @grass-ds/tokens and @grass-ds/css.
 *
 * The control stays native, so `ngModel`, `formControl` and `formControlName` work on it with no
 * ControlValueAccessor of our own. Label, hint and error text are plain markup (`.gr-field`), tied
 * to the control with `for`/`id` and `aria-describedby`.
 */
@Component({
  selector: 'input[grTextField], textarea[grTextField]',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'gr-text-field',
    // A method, not a computed: the form control's touched/invalid state is not a signal. Host
    // bindings are re-read on every check of the host's view, and the events that change that
    // state (input, blur, submit) mark it for check.
    '[attr.aria-invalid]': 'ariaInvalid()',
  },
})
export class GrTextField {
  /**
   * Marks the field invalid (`aria-invalid="true"`), which the CSS styles. Use it for errors the
   * form does not know about (a server message) or to show the error before the field is touched.
   * Do not bind `[attr.aria-invalid]` on the same element: this input owns the attribute.
   */
  readonly invalid = input(false, { transform: booleanAttribute });

  // Present when the element also carries ngModel / formControl / formControlName.
  private readonly control = inject(NgControl, { optional: true, self: true });
  // Host bindings to null would remove an attribute the consumer wrote in the template, so the
  // authored value is read once.
  private readonly authoredAriaInvalid =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.getAttribute('aria-invalid');

  /**
   * Invalid when the consumer says so, or when the bound form control is invalid *and* touched, so
   * a field is not flagged before the user has had a chance to fill it in. Otherwise whatever
   * `aria-invalid` the template wrote statically is kept.
   */
  protected ariaInvalid(): string | null {
    if (this.invalid() || (this.control?.touched && this.control.invalid)) return 'true';
    return this.authoredAriaInvalid;
  }
}
