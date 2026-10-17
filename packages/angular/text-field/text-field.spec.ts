import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField, required } from '@angular/forms/signals';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { GrTextField } from './text-field';

@Component({
  imports: [GrTextField, FormsModule, ReactiveFormsModule, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input grTextField id="plain" />
    <input grTextField id="flag" [grInvalid]="flag()" />
    <input grTextField id="static" aria-invalid="true" />
    <textarea grTextField id="area"></textarea>
    <input grTextField id="reactive" [formControl]="reactive" />
    <input grTextField id="signal" [formField]="signalForm.name" />
    <input
      grTextField
      id="signal-driven"
      [formField]="signalForm.name"
      [grInvalid]="signalForm.name().invalid() && signalForm.name().touched()"
    />
    <input grTextField id="template" required [(ngModel)]="model" />
  `,
})
class Host {
  readonly flag = signal(false);
  readonly reactive = new FormControl('', { nonNullable: true, validators: Validators.required });
  model = '';
  readonly signalModel = signal({ name: '' });
  readonly signalForm = form(this.signalModel, (path) => required(path.name));
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root: HTMLElement = fixture.nativeElement;
  const get = <T extends HTMLElement = HTMLInputElement>(id: string) =>
    root.querySelector<T>(`#${id}`)!;
  const settle = async () => {
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, get, settle };
}

describe('GrTextField', () => {
  it('renders the .gr-text-field markup contract on input and textarea, with no aria-invalid', async () => {
    const { get } = await setup();
    for (const id of ['plain', 'area']) {
      expect(get(id).classList.contains('gr-text-field')).toBe(true);
      expect(get(id).hasAttribute('aria-invalid')).toBe(false);
    }
    expect(get('area').localName).toBe('textarea');
  });

  it('reflects the grInvalid input as aria-invalid="true" and removes it again', async () => {
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

  describe('reactive forms', () => {
    it('reads and writes the value with no ControlValueAccessor of our own', async () => {
      const { get, host, settle } = await setup();
      const input = get('reactive');
      input.value = 'hello';
      input.dispatchEvent(new Event('input'));
      expect(host.reactive.value).toBe('hello');
      host.reactive.setValue('from the model');
      await settle();
      expect(input.value).toBe('from the model');
    });

    it('flags an invalid control only once it is touched', async () => {
      const { get, host, settle } = await setup();
      const input = get('reactive');
      expect(host.reactive.invalid).toBe(true);
      expect(input.hasAttribute('aria-invalid')).toBe(false);
      input.dispatchEvent(new Event('blur'));
      await settle();
      expect(input.getAttribute('aria-invalid')).toBe('true');
      input.value = 'ok';
      input.dispatchEvent(new Event('input'));
      await settle();
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('also flags when the form marks everything touched (a submit attempt)', async () => {
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

  describe('Signal Forms', () => {
    it('does not write its invalid state into aria-invalid before the field is touched', async () => {
      const { get, host } = await setup();
      expect(host.signalForm.name().invalid()).toBe(true);
      expect(get('signal').hasAttribute('aria-invalid')).toBe(false);
      expect(get('signal-driven').hasAttribute('aria-invalid')).toBe(false);
    });

    it('binds the value in both directions', async () => {
      const { get, host, settle } = await setup();
      const input = get('signal');
      input.value = 'typed';
      input.dispatchEvent(new Event('input'));
      expect(host.signalModel().name).toBe('typed');
      host.signalModel.set({ name: 'from the model' });
      await settle();
      expect(input.value).toBe('from the model');
    });

    it('works without grInvalid: null before blur, true after, null once valid', async () => {
      const { get, host, settle } = await setup();
      const input = get('signal');
      expect(input.getAttribute('aria-invalid')).toBeNull();
      input.dispatchEvent(new Event('blur'));
      await settle();
      expect(input.getAttribute('aria-invalid')).toBe('true');
      input.value = 'ok';
      input.dispatchEvent(new Event('input'));
      await settle();
      expect(host.signalForm.name().invalid()).toBe(false);
      expect(input.getAttribute('aria-invalid')).toBeNull();
    });

    it('shows invalid once the field is touched when grInvalid is driven from the field state', async () => {
      const { get, host, settle } = await setup();
      const input = get('signal-driven');
      input.dispatchEvent(new Event('blur'));
      await settle();
      expect(host.signalForm.name().touched()).toBe(true);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      input.value = 'ok';
      input.dispatchEvent(new Event('input'));
      await settle();
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('template-driven forms', () => {
    it('binds ngModel in both directions', async () => {
      const { fixture, get, host } = await setup();
      const input = get('template');
      input.value = 'typed';
      input.dispatchEvent(new Event('input'));
      expect(host.model).toBe('typed');
      host.model = 'set by the model';
      fixture.changeDetectorRef.markForCheck();
      await fixture.whenStable();
      await fixture.whenStable();
      expect(input.value).toBe('set by the model');
    });

    it('flags a required field once it is touched and empty', async () => {
      const { get, settle } = await setup();
      const input = get('template');
      expect(input.hasAttribute('aria-invalid')).toBe(false);
      input.dispatchEvent(new Event('blur'));
      await settle();
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });
  });
});
