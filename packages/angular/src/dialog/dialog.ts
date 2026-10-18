import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  Injector,
  afterNextRender,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  isDevMode,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';

export type GrDialogSize = 'sm' | 'md' | 'lg';

let nextTitleId = 0;

/**
 * Dialog, a composite: `<gr-dialog>` wraps a native `<dialog class="gr-dialog">` that it opens with
 * `showModal()` and closes with `close()`, and owns no styles itself, so the host application must
 * load @grass-ds/tokens and @grass-ds/css. The browser provides the top layer, the backdrop, the inert
 * page behind it, Escape, and moving focus in and back to whatever opened the dialog.
 *
 * ```html
 * <button grButton (click)="confirm.showModal()">Delete</button>
 * <gr-dialog #confirm size="sm" (closed)="onClosed($event)">
 *   <div grDialogHeader><h2 grDialogTitle>Delete project?</h2></div>
 *   <div grDialogBody>This cannot be undone.</div>
 *   <form method="dialog" grDialogFooter>
 *     <button grButton variant="secondary" value="cancel" autofocus>Cancel</button>
 *     <button grButton variant="danger" value="delete">Delete</button>
 *   </form>
 * </gr-dialog>
 * ```
 *
 * The dialog is named by its `grDialogTitle` (or by the `label` input). Its content is created with
 * the parent view, also while closed: wrap it in `@if (dialog.open())` to create it only when needed.
 */
@Component({
  selector: 'gr-dialog',
  template: `<dialog
    #dialog
    class="gr-dialog"
    [attr.data-size]="size() ?? null"
    [attr.aria-labelledby]="labelledby()"
    [attr.aria-label]="label() ?? null"
    [attr.closedby]="closeOnBackdrop() ? 'any' : null"
    (close)="onClose()"
    (pointerdown)="onPointerDown($event)"
    (click)="onClick($event)"
  >
    <ng-content />
  </dialog>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  // The host takes no box of its own: the dialog is in the top layer and, closed, it is display: none.
  host: { style: 'display: contents' },
})
export class GrDialog {
  /** Whether the dialog is open. Two-way: `[(open)]`. Escape and a method call write it back. */
  readonly open = model(false);
  /** Width: `sm`, `md` (the default) or `lg`. Never wider than the viewport minus the gutters. */
  readonly size = input<GrDialogSize>();
  /** Accessible name for a dialog that has no `grDialogTitle`. A title names the dialog by itself. */
  readonly label = input<string>();
  /**
   * Close on a click outside the dialog. Sets the native `closedby="any"`; in a browser without it,
   * a click handler does the same.
   */
  readonly closeOnBackdrop = input(false, { transform: booleanAttribute });
  /** Emits the `returnValue` each time the dialog closes: the `value` of the submitting button, else `''`. */
  readonly closed = output<string>();

  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private pressedOnBackdrop = false;
  private destroyed = false;
  private readonly titleId = signal<string | null>(null);
  protected readonly labelledby = computed(() => (this.label() ? null : this.titleId()));

  constructor() {
    // Destroyed while open: close it, so the browser returns focus to the opener instead of the body.
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      const element = this.dialog()?.nativeElement;
      if (element?.open) element.close();
    });
    effect(() => {
      const element = this.dialog()?.nativeElement;
      const wanted = this.open();
      if (!element) return;
      if (wanted && !element.open && element.isConnected) {
        // The native returnValue survives a later close without one, such as Escape: reset it.
        element.returnValue = '';
        element.showModal();
        if (isDevMode()) this.warnIfUnnamed();
      } else if (!wanted && element.open) element.close();
    });
  }

  private readonly injector = inject(Injector);

  // After the next render, so a grDialogTitle that registers in the same cycle is counted.
  private warnIfUnnamed(): void {
    afterNextRender(
      () => {
        if (!this.label() && !this.titleId())
          console.warn(
            'gr-dialog: an open dialog has no accessible name. Add a grDialogTitle inside it, or set the label input.',
          );
      },
      { injector: this.injector },
    );
  }

  /** Opens the dialog as a modal. */
  showModal(): void {
    this.open.set(true);
  }

  /** Closes the dialog; `returnValue` is what `closed` then emits. */
  close(returnValue?: string): void {
    const element = this.dialog()?.nativeElement;
    if (element?.open) element.close(returnValue);
    this.open.set(false);
  }

  /** @internal Called by `GrDialogTitle`. */
  registerTitle(id: string | null): void {
    this.titleId.set(id);
  }

  protected onClose(): void {
    if (this.destroyed) return;
    this.open.set(false);
    this.closed.emit(this.dialog()?.nativeElement.returnValue ?? '');
  }

  protected onPointerDown(event: PointerEvent): void {
    this.pressedOnBackdrop = event.target === this.dialog()?.nativeElement;
  }

  protected onClick(event: MouseEvent): void {
    const element = this.dialog()?.nativeElement;
    const pressed = this.pressedOnBackdrop;
    this.pressedOnBackdrop = false;
    // Fallback for browsers without closedby. The dialog has no padding of its own, so a click that
    // targets the dialog element itself, outside its box, is a click on the backdrop. The press must
    // have started there too: a text selection dragged out of the dialog ends in a click on it.
    if (
      !element ||
      !this.closeOnBackdrop() ||
      Reflect.has(element, 'closedBy') ||
      !pressed ||
      event.target !== element
    )
      return;
    const box = element.getBoundingClientRect();
    const outside =
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom;
    if (outside) this.close();
  }
}

/** `.gr-dialog__header`: the title and, optionally, the actions. */
@Directive({ selector: '[grDialogHeader]', host: { class: 'gr-dialog__header' } })
export class GrDialogHeader {}

/**
 * `.gr-dialog__title`: put it on the heading element that fits the page. It names the dialog: the
 * dialog points `aria-labelledby` at its id, which is the `id` you write (static or bound) or, without
 * one, a generated id. It registers with the `<gr-dialog>` it is written inside; inside another
 * component's template it does not, so name that dialog with `label` instead.
 */
@Directive({
  selector: '[grDialogTitle]',
  host: { class: 'gr-dialog__title', '[attr.id]': 'resolvedId()' },
})
export class GrDialogTitle {
  readonly id = input<string>();
  private readonly generatedId = `gr-dialog-title-${nextTitleId++}`;
  protected readonly resolvedId = computed(() => this.id() || this.generatedId);

  constructor() {
    const dialog = inject(GrDialog, { optional: true });
    effect(() => dialog?.registerTitle(this.resolvedId()));
    inject(DestroyRef).onDestroy(() => dialog?.registerTitle(null));
  }
}

/** `.gr-dialog__actions`: controls on the right of the header. */
@Directive({ selector: '[grDialogActions]', host: { class: 'gr-dialog__actions' } })
export class GrDialogActions {}

/** `.gr-dialog__body`: the content; it scrolls when the dialog is taller than the viewport. */
@Directive({ selector: '[grDialogBody]', host: { class: 'gr-dialog__body' } })
export class GrDialogBody {}

/** `.gr-dialog__footer`: the actions. Put it on a `<form method="dialog">` to return a value. */
@Directive({ selector: '[grDialogFooter]', host: { class: 'gr-dialog__footer' } })
export class GrDialogFooter {}

/** Everything a template needs: `imports: [GR_DIALOG]`. */
export const GR_DIALOG = [
  GrDialog,
  GrDialogHeader,
  GrDialogTitle,
  GrDialogActions,
  GrDialogBody,
  GrDialogFooter,
] as const;
