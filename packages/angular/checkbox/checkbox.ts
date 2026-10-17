import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Checkbox, applied to a native control: `<input type="checkbox" grCheckbox>`. It renders the
 * markup contract of `.gr-checkbox` in @grass-ds/css and owns no styles itself, so the host
 * application must load @grass-ds/tokens and @grass-ds/css. The label wraps the input (see the
 * `.gr-checkbox-label` contract), which makes the whole label the click target.
 *
 * The control stays native, so `ngModel`, `formControl`, `formControlName` and `[formField]` work
 * on it with no ControlValueAccessor of our own.
 */
@Component({
  selector: 'input[type=checkbox][grCheckbox]',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'gr-checkbox',
    // A method, not a computed: the form control's touched/invalid state is not a signal. Host
    // bindings are re-read on every check of the host's view, and the events that change that
    // state (change, blur, submit) mark it for check.
    '[attr.aria-invalid]': 'ariaInvalid()',
    // The browser clears `indeterminate` when the user toggles the box; mirror that into the model.
    '(change)': 'indeterminate.set(element.indeterminate)',
  },
})
export class GrCheckbox {
  /**
   * The mixed state. It has no HTML attribute, so it is set as the DOM property, and the browser
   * clears it when the user toggles the box (as it does natively); with `[(indeterminate)]` the
   * cleared value is written back.
   */
  readonly indeterminate = model(false);

  /**
   * Marks the checkbox invalid (`aria-invalid="true"`), which the CSS styles. Use it for errors
   * the form does not know about, to show the error before the box is touched, or with Signal
   * Forms. Named `grInvalid`, like on GrTextField, because `[formField]` writes its own `invalid`
   * into a host input of that name. Do not bind `[attr.aria-invalid]` on the same element.
   */
  readonly grInvalid = input(false, { transform: booleanAttribute });

  protected readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  // Present when the element also carries ngModel / formControl / formControlName / formField.
  private readonly control = inject(NgControl, { optional: true, self: true });
  // Host bindings to null would remove an attribute the consumer wrote in the template, so the
  // authored value is read once.
  private readonly authoredAriaInvalid = this.element.getAttribute('aria-invalid');

  constructor() {
    effect(() => {
      this.element.indeterminate = this.indeterminate();
    });
  }

  /**
   * Invalid when the consumer says so, or when the bound form control is invalid *and* touched.
   * Otherwise whatever `aria-invalid` the template wrote statically is kept.
   */
  protected ariaInvalid(): string | null {
    if (this.grInvalid() || (this.control?.touched && this.control.invalid)) return 'true';
    return this.authoredAriaInvalid;
  }
}
