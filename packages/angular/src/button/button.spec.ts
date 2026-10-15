import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GrButton, GrButtonVariant } from './button';

@Component({
  imports: [GrButton],
  template: `
    <button
      grButton
      id="native"
      [variant]="variant()"
      [disabled]="disabled()"
      (click)="clicks.update((n) => n + 1)"
    >
      Save
    </button>
    <a grButton id="link" href="#target" [disabled]="disabled()">Docs</a>
    <a
      grButton
      id="handled"
      href="#target"
      [disabled]="disabled()"
      (click)="linkClicks.update((n) => n + 1)"
      >Save link</a
    >
    <button grButton id="submit" type="submit">Submit</button>
    <button grButton id="reset" type="reset">Reset</button>
    <button grButton id="plain" disabled>Static</button>
    <button grButton id="aria" aria-disabled="true">Aria</button>
  `,
})
class Host {
  readonly variant = signal<GrButtonVariant>('primary');
  readonly disabled = signal(false);
  readonly clicks = signal(0);
  readonly linkClicks = signal(0);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root: HTMLElement = fixture.nativeElement;
  const get = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;
  return { fixture, host: fixture.componentInstance, get };
}

describe('GrButton', () => {
  it('renders the .gr-button markup contract on native elements and keeps their content', async () => {
    const { get } = await setup();
    const button = get('native');
    expect(button.localName).toBe('button');
    expect(button.classList.contains('gr-button')).toBe(true);
    expect(button.textContent?.trim()).toBe('Save');
    expect(get('link').localName).toBe('a');
    expect(get('link').classList.contains('gr-button')).toBe(true);
  });

  it('defaults to the primary variant and maps variant to data-variant', async () => {
    const { get, host, fixture } = await setup();
    expect(get('native').dataset['variant']).toBe('primary');
    host.variant.set('danger');
    await fixture.whenStable();
    expect(get('native').dataset['variant']).toBe('danger');
    host.variant.set('secondary');
    await fixture.whenStable();
    expect(get('native').dataset['variant']).toBe('secondary');
  });

  it('uses the native disabled attribute on <button>, not aria-disabled', async () => {
    const { get, host, fixture } = await setup();
    expect(get('native').hasAttribute('disabled')).toBe(false);
    host.disabled.set(true);
    await fixture.whenStable();
    expect(get('native').hasAttribute('disabled')).toBe(true);
    expect(get('native').hasAttribute('aria-disabled')).toBe(false);
    host.disabled.set(false);
    await fixture.whenStable();
    expect(get('native').hasAttribute('disabled')).toBe(false);
  });

  it('uses aria-disabled on <a> and cancels navigation while disabled', async () => {
    const { get, host, fixture } = await setup();
    const link = get('link');
    const click = () =>
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(link.hasAttribute('aria-disabled')).toBe(false);
    expect(click()).toBe(true);
    host.disabled.set(true);
    await fixture.whenStable();
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.hasAttribute('disabled')).toBe(false);
    expect(click()).toBe(false);
  });

  it('does not emit clicks from a natively disabled button', async () => {
    const { get, host, fixture } = await setup();
    host.disabled.set(true);
    await fixture.whenStable();
    get('native').click();
    expect(host.clicks()).toBe(0);
    host.disabled.set(false);
    await fixture.whenStable();
    get('native').click();
    expect(host.clicks()).toBe(1);
  });

  it('accepts the bare disabled attribute', async () => {
    const { get } = await setup();
    expect(get('plain').hasAttribute('disabled')).toBe(true);
  });

  it('keeps a consumer-written aria-disabled attribute', async () => {
    const { get } = await setup();
    expect(get('aria').getAttribute('aria-disabled')).toBe('true');
  });

  it('adds no styles of its own', async () => {
    const { fixture } = await setup();
    expect(document.head.querySelectorAll('style[ng-app-id]').length).toBe(0);
    expect(fixture.nativeElement.querySelector('#native').getAttribute('style')).toBeNull();
  });

  it('never calls a consumer (click) handler on a disabled link, and does again once enabled', async () => {
    const { get, host, fixture } = await setup();
    const link = get('handled');
    host.disabled.set(true);
    await fixture.whenStable();
    link.click();
    expect(host.linkClicks()).toBe(0);
    host.disabled.set(false);
    await fixture.whenStable();
    link.click();
    expect(host.linkClicks()).toBe(1);
  });

  it('cancels middle-click (auxclick) and Ctrl-click navigation on a disabled link', async () => {
    const { get, host, fixture } = await setup();
    host.disabled.set(true);
    await fixture.whenStable();
    const link = get('link');
    const fire = (type: string, init: MouseEventInit) =>
      link.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, ...init }));
    expect(fire('auxclick', { button: 1 })).toBe(false);
    expect(fire('click', { ctrlKey: true })).toBe(false);
    host.disabled.set(false);
    await fixture.whenStable();
    expect(fire('auxclick', { button: 1 })).toBe(true);
  });

  it('honours an aria-disabled attribute set at runtime', async () => {
    const { get, host } = await setup();
    const link = get('handled');
    link.setAttribute('aria-disabled', 'true');
    link.click();
    expect(host.linkClicks()).toBe(0);
  });

  it('defaults <button> to type="button" and lets an explicit type win', async () => {
    const { get } = await setup();
    expect(get('native').getAttribute('type')).toBe('button');
    expect(get('plain').getAttribute('type')).toBe('button');
    expect(get('submit').getAttribute('type')).toBe('submit');
    expect(get('reset').getAttribute('type')).toBe('reset');
    expect(get('link').hasAttribute('type')).toBe(false);
  });

  it('removes its listeners when destroyed', async () => {
    const { fixture, get } = await setup();
    const link = get('handled');
    const remove = vi.spyOn(link, 'removeEventListener');
    fixture.destroy();
    expect(remove).toHaveBeenCalledWith('click', expect.any(Function), { capture: true });
    expect(remove).toHaveBeenCalledWith('auxclick', expect.any(Function), { capture: true });
  });
});
