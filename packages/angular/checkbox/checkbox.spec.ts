import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField, required, validate, type FormUiControl } from '@angular/forms/signals';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { GrCheckbox } from './checkbox';

// Compile-time guard: the inputs this directive declares must not be names that [formField]
// writes into a host (the FormUiControl contract, plus `checked` from the checkbox variant).
type Reserved = keyof FormUiControl<boolean> | 'checked' | 'value';
const noCollision: Extract<'grInvalid' | 'indeterminate', Reserved> extends never ? true : never =
  true;

@Component({
  imports: [GrCheckbox, FormsModule, ReactiveFormsModule, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input type="checkbox" grCheckbox id="plain" />
    <input type="checkbox" grCheckbox id="flag" [grInvalid]="flag()" />
    <input type="checkbox" grCheckbox id="static" aria-invalid="true" />
    <input type="checkbox" grCheckbox id="mixed" [(indeterminate)]="mixed" />
    <input type="checkbox" grCheckbox id="one-way" [indeterminate]="mixed()" />
    <input type="checkbox" grCheckbox id="reactive" [formControl]="reactive" />
    <input type="checkbox" grCheckbox id="template" required [(ngModel)]="model" />
    <input type="checkbox" grCheckbox id="signal" [formField]="signalForm.accepted" />
    <input
      type="checkbox"
      grCheckbox
      id="signal-driven"
      [formField]="signalForm.accepted"
      [grInvalid]="signalForm.accepted().invalid() && signalForm.accepted().touched()"
    />
    <input type="checkbox" grCheckbox id="disabled" disabled />
  `,
})
class Host {
  readonly flag = signal(false);
  readonly mixed = signal(true);
  readonly reactive = new FormControl(false, {
    nonNullable: true,
    validators: Validators.requiredTrue,
  });
  readonly model = signal(false);
  readonly signalModel = signal({ accepted: false });
  readonly signalForm = form(this.signalModel, (path) => {
    required(path.accepted);
    validate(path.accepted, ({ value }) => (value() ? undefined : { kind: 'accept' }));
  });
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root: HTMLElement = fixture.nativeElement;
  const get = (id: string) => root.querySelector<HTMLInputElement>(`#${id}`)!;
  const settle = async () => {
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
  };
  const toggle = async (id: string) => {
    get(id).click();
    await settle();
  };
  return { fixture, host: fixture.componentInstance, get, settle, toggle };
}

describe('GrCheckbox', () => {
  it('compiles with inputs that do not collide with the Signal Forms contract', () => {
    expect(noCollision).toBe(true);
  });

  it('renders the .gr-checkbox markup contract with no aria-invalid and keeps native behaviour', async () => {
    const { get, toggle } = await setup();
    expect(get('plain').classList.contains('gr-checkbox')).toBe(true);
    expect(get('plain').hasAttribute('aria-invalid')).toBe(false);
    expect(get('plain').checked).toBe(false);
    await toggle('plain');
    expect(get('plain').checked).toBe(true);
  });

  it('reflects grInvalid as aria-invalid="true" and removes it again', async () => {
    const { get, host, settle } = await setup();
    host.flag.set(true);
    await settle();
    expect(get('flag').getAttribute('aria-invalid')).toBe('true');
    host.flag.set(false);
    await settle();
    expect(get('flag').hasAttribute('aria-invalid')).toBe(false);
  });

  it('keeps an aria-invalid written in the template', async () => {
    const { get } = await setup();
    expect(get('static').getAttribute('aria-invalid')).toBe('true');
  });

  describe('indeterminate', () => {
    it('sets the DOM property from the input', async () => {
      const { get, host, settle } = await setup();
      expect(get('mixed').indeterminate).toBe(true);
      host.mixed.set(false);
      await settle();
      expect(get('mixed').indeterminate).toBe(false);
      host.mixed.set(true);
      await settle();
      expect(get('mixed').indeterminate).toBe(true);
    });

    it('is cleared by a user toggle, like native, and written back with [(indeterminate)]', async () => {
      const { get, host, toggle } = await setup();
      expect(get('mixed').indeterminate).toBe(true);
      await toggle('mixed');
      expect(get('mixed').indeterminate).toBe(false);
      expect(host.mixed()).toBe(false);
      expect(get('mixed').checked).toBe(true);
    });

    it('can be set again after the user cleared it', async () => {
      const { get, host, toggle, settle } = await setup();
      await toggle('mixed');
      host.mixed.set(true);
      await settle();
      expect(get('mixed').indeterminate).toBe(true);
    });
  });

  describe('reactive forms', () => {
    it('reads and writes the checked state with no ControlValueAccessor of our own', async () => {
      const { get, host, settle, toggle } = await setup();
      await toggle('reactive');
      expect(host.reactive.value).toBe(true);
      host.reactive.setValue(false);
      await settle();
      expect(get('reactive').checked).toBe(false);
    });

    it('flags an invalid control only once it is touched', async () => {
      const { get, host, settle } = await setup();
      const input = get('reactive');
      expect(host.reactive.invalid).toBe(true);
      expect(input.hasAttribute('aria-invalid')).toBe(false);
      input.dispatchEvent(new Event('blur'));
      await settle();
      expect(input.getAttribute('aria-invalid')).toBe('true');
      await (async () => {
        input.click();
        await settle();
      })();
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('flags when the form marks everything touched (a submit attempt)', async () => {
      const { get, host, settle } = await setup();
      host.reactive.markAsTouched();
      await settle();
      expect(get('reactive').getAttribute('aria-invalid')).toBe('true');
    });

    it('is disabled through the control', async () => {
      const { get, host, settle } = await setup();
      host.reactive.disable();
      await settle();
      expect(get('reactive').disabled).toBe(true);
    });
  });

  describe('template-driven forms', () => {
    it('binds ngModel in both directions', async () => {
      const { fixture, get, host, toggle } = await setup();
      await toggle('template');
      expect(host.model()).toBe(true);
      host.model.set(false);
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve)); // NgModel writes the view in a microtask
      expect(get('template').checked).toBe(false);
    });

    it('flags a required, unchecked box once it is touched', async () => {
      const { get, settle } = await setup();
      const input = get('template');
      expect(input.hasAttribute('aria-invalid')).toBe(false);
      input.dispatchEvent(new Event('blur'));
      await settle();
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('Signal Forms', () => {
    it('binds the checked state in both directions', async () => {
      const { get, host, settle, toggle } = await setup();
      await toggle('signal');
      expect(host.signalModel().accepted).toBe(true);
      host.signalModel.set({ accepted: false });
      await settle();
      expect(get('signal').checked).toBe(false);
    });

    it('does not write its invalid state into aria-invalid on first render', async () => {
      const { get, host } = await setup();
      expect(host.signalForm.accepted().invalid()).toBe(true);
      expect(get('signal').hasAttribute('aria-invalid')).toBe(false);
      expect(get('signal-driven').hasAttribute('aria-invalid')).toBe(false);
    });

    it('works without grInvalid: null before blur, true after, null once valid', async () => {
      const { get, settle, toggle } = await setup();
      const input = get('signal');
      expect(input.getAttribute('aria-invalid')).toBeNull();
      input.dispatchEvent(new Event('blur'));
      await settle();
      expect(input.getAttribute('aria-invalid')).toBe('true');
      await toggle('signal');
      expect(input.getAttribute('aria-invalid')).toBeNull();
    });

    it('shows invalid once touched when grInvalid is driven from the field state', async () => {
      const { get, settle } = await setup();
      const input = get('signal-driven');
      input.dispatchEvent(new Event('blur'));
      await settle();
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });
  });
});
