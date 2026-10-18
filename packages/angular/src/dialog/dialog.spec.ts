import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GR_DIALOG, GrDialog } from './dialog';

@Component({
  imports: [GR_DIALOG],
  template: `
    <button id="opener" (click)="main.showModal()">Open</button>
    <gr-dialog #main id="main" [(open)]="isOpen" size="sm" (closed)="values.push($event)">
      <div grDialogHeader>
        <h2 grDialogTitle id="own-id">Title</h2>
        <div grDialogActions><button id="action">x</button></div>
      </div>
      <div grDialogBody><p id="content">Body</p></div>
      <form method="dialog" grDialogFooter>
        <button id="cancel" value="cancel">Cancel</button>
        <button id="ok" value="ok">OK</button>
      </form>
    </gr-dialog>
    <gr-dialog id="auto" label="Labelled"><div grDialogBody>Auto</div></gr-dialog>
    <gr-dialog id="bound"><h2 grDialogTitle [id]="titleId()">Bound</h2></gr-dialog>
    <gr-dialog id="generated"><h2 grDialogTitle>Generated</h2></gr-dialog>
    <gr-dialog id="backdrop" closeOnBackdrop><div grDialogBody>Backdrop</div></gr-dialog>
    @if (lazy()) {
      <gr-dialog id="late"><h2 grDialogTitle>Late</h2></gr-dialog>
    }
  `,
})
class Host {
  readonly isOpen = signal(false);
  readonly lazy = signal(true);
  readonly titleId = signal('first-id');
  readonly values: string[] = [];
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root: HTMLElement = fixture.nativeElement;
  const get = <T extends HTMLElement = HTMLElement>(selector: string) =>
    root.querySelector<T>(selector)!;
  const dialogOf = (id: string) => get<HTMLDialogElement>(`#${id} > dialog`);
  return { fixture, host: fixture.componentInstance, get, dialogOf };
}

describe('GrDialog', () => {
  // jsdom has no showModal/close: stand in for the two methods and the events the browser fires.
  let showModal: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    });
    HTMLDialogElement.prototype.showModal = showModal as unknown as () => void;
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement, value?: string) {
      if (!this.hasAttribute('open')) return;
      this.removeAttribute('open');
      if (value !== undefined) this.returnValue = value;
      this.dispatchEvent(new Event('close'));
    };
  });

  it('renders a native dialog with .gr-dialog inside the host and projects the parts untouched', async () => {
    const { dialogOf, get } = await setup();
    const dialog = dialogOf('main');
    expect(dialog.localName).toBe('dialog');
    expect(dialog.classList.contains('gr-dialog')).toBe(true);
    expect(dialog.getAttribute('data-size')).toBe('sm');
    expect([...dialog.children].map((child) => child.className)).toEqual([
      'gr-dialog__header',
      'gr-dialog__body',
      'gr-dialog__footer',
    ]);
    expect(get('#action').parentElement!.className).toBe('gr-dialog__actions');
    expect(get('#main').style.display).toBe('contents');
    expect(dialogOf('auto').hasAttribute('data-size')).toBe(false);
  });

  it('is named by its title, keeping the id the consumer wrote, else generating one', async () => {
    const { dialogOf, get } = await setup();
    expect(dialogOf('main').getAttribute('aria-labelledby')).toBe('own-id');
    const generated = get('#generated h2');
    expect(generated.id).toMatch(/^gr-dialog-title-\d+$/);
    expect(dialogOf('generated').getAttribute('aria-labelledby')).toBe(generated.id);
    expect(dialogOf('auto').getAttribute('aria-label')).toBe('Labelled');
    expect(dialogOf('auto').hasAttribute('aria-labelledby')).toBe(false);
  });

  it('follows a bound title id, so aria-labelledby never dangles', async () => {
    const { fixture, host, get, dialogOf } = await setup();
    expect(get('#bound h2').id).toBe('first-id');
    expect(dialogOf('bound').getAttribute('aria-labelledby')).toBe('first-id');
    host.titleId.set('second-id');
    await fixture.whenStable();
    expect(get('#bound h2').id).toBe('second-id');
    expect(dialogOf('bound').getAttribute('aria-labelledby')).toBe('second-id');
  });

  it('opens with showModal() when the model turns true and closes when it turns false', async () => {
    const { fixture, host, dialogOf } = await setup();
    expect(showModal).not.toHaveBeenCalled();
    host.isOpen.set(true);
    await fixture.whenStable();
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(dialogOf('main').open).toBe(true);
    host.isOpen.set(false);
    await fixture.whenStable();
    expect(dialogOf('main').open).toBe(false);
  });

  it('opens from a template reference and syncs the model', async () => {
    const { fixture, host, get, dialogOf } = await setup();
    get('#opener').click();
    await fixture.whenStable();
    expect(host.isOpen()).toBe(true);
    expect(dialogOf('main').open).toBe(true);
  });

  it('writes false back to the model when the browser closes it (Escape fires close)', async () => {
    const { fixture, host, dialogOf } = await setup();
    host.isOpen.set(true);
    await fixture.whenStable();
    const dialog = dialogOf('main');
    dialog.removeAttribute('open'); // what the browser does on Escape, before it fires close
    dialog.dispatchEvent(new Event('close'));
    await fixture.whenStable();
    expect(host.isOpen()).toBe(false);
    expect(host.values).toEqual(['']);
  });

  it('emits the returnValue of the submitting button, and forgets it on the next open', async () => {
    const { fixture, host, get, dialogOf } = await setup();
    host.isOpen.set(true);
    await fixture.whenStable();
    const dialog = dialogOf('main');
    dialog.returnValue = get<HTMLButtonElement>('#ok').value; // form method=dialog sets it, then closes
    dialog.close();
    await fixture.whenStable();
    expect(host.values).toEqual(['ok']);
    host.isOpen.set(true);
    await fixture.whenStable();
    expect(dialog.returnValue).toBe('');
    dialog.close();
    await fixture.whenStable();
    expect(host.values).toEqual(['ok', '']);
  });

  it('close(value) closes imperatively and emits the value', async () => {
    const { fixture, host, get, dialogOf } = await setup();
    const main = fixture.debugElement.children.find((c) => c.nativeElement.id === 'main')!;
    const instance = main.componentInstance as GrDialog;
    instance.showModal();
    await fixture.whenStable();
    expect(dialogOf('main').open).toBe(true);
    instance.close('done');
    await fixture.whenStable();
    expect(host.isOpen()).toBe(false);
    expect(host.values).toEqual(['done']);
    expect(get('#main')).not.toBeNull();
  });

  it('closeOnBackdrop sets closedby="any" and closes on a click outside the box when unsupported', async () => {
    const { fixture, dialogOf } = await setup();
    const dialog = dialogOf('backdrop');
    expect(dialog.getAttribute('closedby')).toBe('any');
    expect(dialogOf('main').hasAttribute('closedby')).toBe(false);
    const instance = fixture.debugElement.children.find((c) => c.nativeElement.id === 'backdrop')!
      .componentInstance as GrDialog;
    instance.showModal();
    await fixture.whenStable();
    // jsdom has no closedBy and no layout: the box is 0x0 at the origin, so (5, 5) is outside it.
    dialog.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    dialog.dispatchEvent(new MouseEvent('click', { clientX: 5, clientY: 5, bubbles: true }));
    await fixture.whenStable();
    expect(dialog.open).toBe(false);
  });

  it('a click that starts inside a part does not count as a backdrop click', async () => {
    const { fixture, get, dialogOf } = await setup();
    const instance = fixture.debugElement.children.find((c) => c.nativeElement.id === 'backdrop')!
      .componentInstance as GrDialog;
    instance.showModal();
    await fixture.whenStable();
    get('#backdrop .gr-dialog__body').dispatchEvent(
      new MouseEvent('click', { clientX: 5, clientY: 5, bubbles: true }),
    );
    expect(dialogOf('backdrop').open).toBe(true);
  });

  it('a press that starts inside the dialog and is released over the backdrop does not close it', async () => {
    const { fixture, get, dialogOf } = await setup();
    const instance = fixture.debugElement.children.find((c) => c.nativeElement.id === 'backdrop')!
      .componentInstance as GrDialog;
    instance.showModal();
    await fixture.whenStable();
    // A text selection dragged out of the body: pointerdown on a part, the click lands on the dialog.
    get('#backdrop .gr-dialog__body').dispatchEvent(new Event('pointerdown', { bubbles: true }));
    dialogOf('backdrop').dispatchEvent(
      new MouseEvent('click', { clientX: 5, clientY: 5, bubbles: true }),
    );
    expect(dialogOf('backdrop').open).toBe(true);
  });

  it('closes an open dialog when it is destroyed and returns focus to its opener', async () => {
    const { fixture, host, get } = await setup();
    const opener = get('#opener');
    opener.focus();
    const late = fixture.debugElement.children.find((c) => c.nativeElement.id === 'late')!
      .componentInstance as GrDialog;
    late.showModal();
    await fixture.whenStable();
    const dialog = get<HTMLDialogElement>('#late > dialog');
    const close = vi.spyOn(dialog, 'close');
    opener.blur();
    host.lazy.set(false);
    await fixture.whenStable();
    expect(close).toHaveBeenCalledTimes(1);
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('warns in dev mode when an open dialog has neither a title nor a label', async () => {
    const { fixture } = await setup();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const instance = (id: string) =>
      fixture.debugElement.children.find((c) => c.nativeElement.id === id)!
        .componentInstance as GrDialog;
    instance('backdrop').showModal(); // no title, no label
    await fixture.whenStable();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/no accessible name/);
    warn.mockClear();
    instance('main').showModal(); // titled
    instance('auto').showModal(); // labelled
    await fixture.whenStable();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('content is created with the parent even while closed, and @if inside works', async () => {
    const { fixture, host, get } = await setup();
    expect(get('#content')).not.toBeNull();
    expect(get('#late h2')).not.toBeNull();
    host.lazy.set(false);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#late')).toBeNull();
  });
});
